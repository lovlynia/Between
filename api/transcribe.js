const GROQ_TRANSCRIPTIONS_URL = 'https://api.groq.com/openai/v1/audio/transcriptions';
const MAX_AUDIO_BYTES = 3 * 1024 * 1024;
const MAX_BASE64_LENGTH = Math.ceil(MAX_AUDIO_BYTES / 3) * 4 + 4;
const MIME_TYPES = {
  'audio/webm': 'recording.webm',
  'audio/mp4': 'recording.mp4',
  'audio/ogg': 'recording.ogg',
  'audio/wav': 'recording.wav',
  'audio/mpeg': 'recording.mp3',
};

export function createTranscriptionHandler({ fetchImpl = fetch, env = process.env } = {}) {
  return async function transcriptionHandler(request, response) {
    response.setHeader?.('Cache-Control', 'no-store');
    response.setHeader?.('X-Content-Type-Options', 'nosniff');
    if (request.method !== 'POST') {
      response.setHeader?.('Allow', 'POST');
      return send(response, 405, { error: 'Use POST to transcribe audio.' });
    }

    const body = parseBody(request.body);
    const validationError = validateAudio(body);
    if (validationError) return send(response, 400, { error: validationError });
    if (!env.GROQ_API_KEY) return send(response, 503, { error: 'Voice transcription is not configured.' });

    const mimeType = body.mimeType.split(';')[0].toLowerCase();
    const audioBytes = Buffer.from(body.audioBase64, 'base64');
    const form = new FormData();
    form.append('file', new Blob([audioBytes], { type: mimeType }), MIME_TYPES[mimeType]);
    form.append('model', env.GROQ_TRANSCRIPTION_MODEL ?? 'whisper-large-v3-turbo');
    form.append('response_format', 'json');
    if (body.language && body.language !== 'auto') form.append('language', body.language.slice(0, 2).toLowerCase());

    let upstream;
    try {
      upstream = await fetchImpl(GROQ_TRANSCRIPTIONS_URL, {
        method: 'POST',
        headers: { Authorization: `Bearer ${env.GROQ_API_KEY}` },
        body: form,
        signal: AbortSignal.timeout(30_000),
      });
    } catch {
      return send(response, 502, { error: 'The transcription service could not be reached. Please retry.' });
    }
    if (!upstream.ok) {
      return send(response, upstream.status === 429 ? 503 : 502, {
        error: upstream.status === 429
          ? 'The transcription service is busy. Please wait and retry.'
          : 'The transcription service returned an error. Please retry.',
      });
    }

    let result;
    try {
      result = await upstream.json();
    } catch {
      return send(response, 502, { error: 'The transcription service returned an unreadable response.' });
    }
    if (typeof result.text !== 'string' || !result.text.trim() || result.text.length > 20_000) {
      return send(response, 502, { error: 'No usable speech was recognized. Please try again.' });
    }
    return send(response, 200, { text: result.text });
  };
}

function parseBody(body) {
  if (typeof body !== 'string') return body;
  try {
    return JSON.parse(body);
  } catch {
    return null;
  }
}

function validateAudio(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return 'Request body must be a JSON object.';
  if (Object.keys(body).some((key) => !['audioBase64', 'mimeType', 'language'].includes(key))) {
    return 'Request contains unsupported fields.';
  }
  if (typeof body.audioBase64 !== 'string' || !body.audioBase64.length || body.audioBase64.length > MAX_BASE64_LENGTH) {
    return 'Audio must be no larger than 3 MB.';
  }
  if (!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(body.audioBase64)) {
    return 'Audio encoding is invalid.';
  }
  const audioBytes = Buffer.from(body.audioBase64, 'base64');
  if (!audioBytes.length || audioBytes.length > MAX_AUDIO_BYTES) return 'Audio must be no larger than 3 MB.';
  if (!MIME_TYPES[String(body.mimeType).split(';')[0].toLowerCase()]) return 'Audio format is not supported.';
  if (body.language !== undefined && !/^(auto|[a-z]{2,3}(?:-[A-Z]{2})?)$/.test(body.language)) {
    return 'Language is invalid.';
  }
  return null;
}

function send(response, status, body) {
  if (typeof response.status === 'function') return response.status(status).json(body);
  response.statusCode = status;
  return response.json(body);
}

export default createTranscriptionHandler();