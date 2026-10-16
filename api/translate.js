import {
  MODE_RESPONSE_SCHEMAS,
  validateTranslationRequest,
  validateTranslationResponse,
} from './_lib/contracts.js';
import { MODE_SYSTEM_PROMPTS, translationUserPrompt } from './_lib/prompts.js';

const GROQ_CHAT_COMPLETIONS_URL = 'https://api.groq.com/openai/v1/chat/completions';
const REQUEST_TIMEOUT_MS = 30_000;

export function createTranslationHandler({ fetchImpl = fetch, env = process.env } = {}) {
  return async function translationHandler(request, response) {
    setHeader(response, 'Cache-Control', 'no-store');
    setHeader(response, 'X-Content-Type-Options', 'nosniff');
    setHeader(response, 'Referrer-Policy', 'no-referrer');

    if (request.method !== 'POST') {
      setHeader(response, 'Allow', 'POST');
      return send(response, 405, { error: 'Use POST to request a translation.', code: 'METHOD_NOT_ALLOWED' });
    }

    const body = parseBody(request.body);
    if (!body) return send(response, 400, { error: 'Request body must be valid JSON.', code: 'INVALID_JSON' });

    const validationError = validateTranslationRequest(body);
    if (validationError) return send(response, 400, { error: validationError, code: 'INVALID_REQUEST' });

    if (!env.GROQ_API_KEY || !env.GROQ_MODEL) {
      return send(response, 503, {
        error: 'Live translation is not configured. Set the server API key and model.',
        code: 'TRANSLATION_NOT_CONFIGURED',
      });
    }

    let upstream;
    try {
      upstream = await fetchImpl(GROQ_CHAT_COMPLETIONS_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: env.GROQ_MODEL,
          messages: [
            { role: 'system', content: MODE_SYSTEM_PROMPTS[body.mode] },
            { role: 'user', content: translationUserPrompt(body) },
          ],
          response_format: {
            type: 'json_schema',
            json_schema: {
              name: `between_${body.mode}_translation`,
              strict: true,
              schema: MODE_RESPONSE_SCHEMAS[body.mode],
            },
          },
        }),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch {
      return send(response, 502, {
        error: 'The translation provider could not be reached. Please retry.',
        code: 'TRANSLATION_PROVIDER_UNAVAILABLE',
      });
    }

    if (upstream.status === 429) {
      const retryAfter = safeRetryAfter(upstream.headers?.get?.('retry-after'));
      if (retryAfter) setHeader(response, 'Retry-After', retryAfter);
      return send(response, 503, {
        error: 'The translation service is busy. Wait briefly, then retry.',
        code: 'TRANSLATION_RATE_LIMITED',
      });
    }

    if (!upstream.ok) {
      return send(response, 502, {
        error: 'The translation provider returned an error. Please retry.',
        code: 'TRANSLATION_PROVIDER_ERROR',
      });
    }

    let providerResponse;
    try {
      providerResponse = await upstream.json();
    } catch {
      return malformedResponse(response);
    }

    const content = providerResponse?.choices?.[0]?.message?.content;
    if (typeof content !== 'string') return malformedResponse(response);

    let result;
    try {
      result = JSON.parse(content);
    } catch {
      return malformedResponse(response);
    }

    if (!validateTranslationResponse(body.mode, result)) return malformedResponse(response);
    return send(response, 200, result);
  };
}

function parseBody(body) {
  if (typeof body === 'string') {
    try {
      return JSON.parse(body);
    } catch {
      return null;
    }
  }
  return body;
}

function malformedResponse(response) {
  return send(response, 502, {
    error: 'The translation provider returned an unreadable response. Please retry.',
    code: 'INVALID_PROVIDER_RESPONSE',
  });
}

function safeRetryAfter(value) {
  if (!value || !/^\d{1,3}$/.test(value)) return null;
  return String(Math.min(Number(value), 300));
}

function setHeader(response, name, value) {
  response.setHeader?.(name, value);
}

function send(response, status, body) {
  if (typeof response.status === 'function') return response.status(status).json(body);
  response.statusCode = status;
  return response.json(body);
}

export default createTranslationHandler();