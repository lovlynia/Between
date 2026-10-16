import { defineConfig, loadEnv } from 'vite';
import { createTranslationHandler } from './api/translate.js';
import { createTranscriptionHandler } from './api/transcribe.js';

const MAX_TRANSLATION_BODY_BYTES = 256 * 1024;
const MAX_TRANSCRIPTION_BODY_BYTES = 5 * 1024 * 1024;

export default defineConfig(({ mode }) => {
  const env = { ...loadEnv(mode, process.cwd(), ''), ...process.env };
  env.GROQ_API_KEY ??= env.XAI_API_KEY;
  env.GROQ_MODEL ??= env.XAI_API_KEY ? 'openai/gpt-oss-120b' : undefined;
  const translationHandler = createTranslationHandler({ env });
  const transcriptionHandler = createTranscriptionHandler({ env });
  const apiPlugin = {
    name: 'between-local-api',
    configureServer(server) {
      attachApi(server.middlewares, '/api/translate', translationHandler, MAX_TRANSLATION_BODY_BYTES);
      attachApi(server.middlewares, '/api/transcribe', transcriptionHandler, MAX_TRANSCRIPTION_BODY_BYTES);
    },
    configurePreviewServer(server) {
      attachApi(server.middlewares, '/api/translate', translationHandler, MAX_TRANSLATION_BODY_BYTES);
      attachApi(server.middlewares, '/api/transcribe', transcriptionHandler, MAX_TRANSCRIPTION_BODY_BYTES);
    },
  };

  return { plugins: [apiPlugin] };
});

function attachApi(middlewares, path, handler, maxBodyBytes) {
  middlewares.use(path, async (request, response) => {
    const chunks = [];
    let size = 0;
    for await (const chunk of request) {
      size += chunk.length;
      if (size > maxBodyBytes) {
        response.statusCode = 413;
        return writeJson(response, { error: 'Request body is too large.', code: 'REQUEST_TOO_LARGE' });
      }
      chunks.push(chunk);
    }

    request.body = Buffer.concat(chunks).toString('utf8');
    response.json = (body) => writeJson(response, body);
    await handler(request, response);
  });
}

function writeJson(response, body) {
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.end(JSON.stringify(body));
  return response;
}