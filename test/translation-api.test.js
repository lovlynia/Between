import assert from 'node:assert/strict';
import test from 'node:test';
import { createTranslationHandler } from '../api/translate.js';
import { validateTranslationRequest, validateTranslationResponse } from '../api/_lib/contracts.js';
import { toneDescriptors, toneSummary, translationCopy } from '../src/lib/translationCopy.js';

const validRequest = {
  mode: 'conversation',
  text: '¿Vienes?',
  sourceLanguage: 'auto',
  targetLanguage: 'en',
  tone: 'friendly',
  context: [],
};

const validResult = {
  translation: 'Are you coming?',
  detectedLanguage: 'es',
  mixedLanguages: false,
  literalTranslation: null,
  explanation: 'A direct question about whether the person is coming.',
  alternatives: [],
  uncertainty: null,
  meaningNotes: [],
};

function makeResponse() {
  return {
    headers: {},
    setHeader(name, value) { this.headers[name] = value; },
    status(statusCode) {
      this.statusCode = statusCode;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}

function makeRequest(body = validRequest, method = 'POST') {
  return { method, body };
}

test('rejects invalid requests before contacting Groq', async () => {
  let called = false;
  const handler = createTranslationHandler({
    env: { GROQ_API_KEY: 'secret', GROQ_MODEL: 'test-model' },
    fetchImpl: async () => { called = true; },
  });
  const response = makeResponse();

  await handler(makeRequest({ ...validRequest, unexpected: 'value' }), response);

  assert.equal(response.statusCode, 400);
  assert.equal(called, false);
});

test('returns a clear missing-configuration response without calling Groq', async () => {
  let called = false;
  const handler = createTranslationHandler({ fetchImpl: async () => { called = true; }, env: {} });
  const response = makeResponse();

  await handler(makeRequest(), response);

  assert.equal(response.statusCode, 503);
  assert.equal(response.body.code, 'TRANSLATION_NOT_CONFIGURED');
  assert.match(response.body.error, /not configured/i);
  assert.equal(called, false);
});

test('returns only schema-validated provider JSON', async () => {
  let providerRequest;
  const handler = createTranslationHandler({
    env: { GROQ_API_KEY: 'server-secret', GROQ_MODEL: 'test-model' },
    fetchImpl: async (url, options) => {
      providerRequest = { url, options };
      return {
        ok: true,
        status: 200,
        json: async () => ({ choices: [{ message: { content: JSON.stringify(validResult) } }] }),
      };
    },
  });
  const response = makeResponse();

  await handler(makeRequest(), response);

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.body, validResult);
  assert.equal(providerRequest.url, 'https://api.groq.com/openai/v1/chat/completions');
  assert.equal(providerRequest.options.headers.Authorization, 'Bearer server-secret');
  assert.equal(response.headers['Cache-Control'], 'no-store');
});

test('rejects malformed model output without exposing it', async () => {
  const handler = createTranslationHandler({
    env: { GROQ_API_KEY: 'server-secret', GROQ_MODEL: 'test-model' },
    fetchImpl: async () => ({
      ok: true,
      status: 200,
      json: async () => ({ choices: [{ message: { content: '{"translation":"ok"}' } }] }),
    }),
  });
  const response = makeResponse();

  await handler(makeRequest(), response);

  assert.equal(response.statusCode, 502);
  assert.equal(response.body.code, 'INVALID_PROVIDER_RESPONSE');
  assert.equal(response.body.translation, undefined);
  assert.equal(JSON.stringify(response.body).includes('"ok"'), false);
});

test('handles upstream rate limits and constrains retry-after', async () => {
  const handler = createTranslationHandler({
    env: { GROQ_API_KEY: 'server-secret', GROQ_MODEL: 'test-model' },
    fetchImpl: async () => ({
      ok: false,
      status: 429,
      headers: { get: () => '999' },
    }),
  });
  const response = makeResponse();

  await handler(makeRequest(), response);

  assert.equal(response.statusCode, 503);
  assert.equal(response.body.code, 'TRANSLATION_RATE_LIMITED');
  assert.equal(response.headers['Retry-After'], '300');
});

test('validates a distinct response contract for each Deep Translation mode', () => {
  const responses = {
    everyday: {
      translation: 'That is quite a stretch.', explanation: 'An idiom expressing doubt.',
      literalTranslation: null, alternatives: [], clarificationQuestions: [], uncertainty: null, meaningNotes: [],
    },
    academic: {
      translation: 'Results were consistent with the estimate.', technicalTerms: [],
      preservationNotes: ['The qualification is preserved.'], uncertainty: null,
    },
    professional: {
      translation: 'Thank you for the update.', rewrittenText: null, rewriteExplanation: null,
      culturalConventions: [], uncertainty: null,
    },
    ambiguous: {
      interpretations: [{ reading: 'A possible reading.', supportingContext: 'The surrounding sentence.', missingInformation: 'The speaker is not identified.' }],
      confidence: 'Limited: context is brief.', clarificationQuestions: [], uncertainty: null,
    },
  };

  for (const [mode, response] of Object.entries(responses)) {
    assert.equal(validateTranslationResponse(mode, response), true, `${mode} response should validate`);
    assert.equal(validateTranslationResponse(mode, { ...response, unexpected: 'value' }), false);
  }
});

test('validates academic section metadata and professional style', () => {
  assert.equal(validateTranslationRequest({
    mode: 'academic', text: 'Section', sourceLanguage: 'auto', targetLanguage: 'en',
    sectionIndex: 2, sectionCount: 3, priorTerms: [],
  }), null);
  assert.match(validateTranslationRequest({
    mode: 'professional', text: 'Email', sourceLanguage: 'en', targetLanguage: 'fr',
    professionalStyle: 'invented',
  }), /style is invalid/);
});

test('provides target-language detail labels and tone guidance', () => {
  assert.equal(translationCopy('zh-CN').conveying, '它传达的意思');
  assert.deepEqual(toneDescriptors('zh-CN', 'friendly'), ['温和', '自然', '亲切']);
  assert.match(toneSummary('zh-CN', 'professional'), /专业/);
});