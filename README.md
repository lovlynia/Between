# Between
Microsoft Hackathon #NYTechWeek

Between helps people understand each other across languages by preserving meaning, intent, tone, and context.

## Local development

Requirements: Node.js 20.19+ or 22.12+.

Copy `.env.example` to `.env`, then set `GROQ_API_KEY` and `GROQ_MODEL`. The configured model is `openai/gpt-oss-120b`. Never commit `.env`; it is ignored by Git.

```sh
npm install
npm run dev
```

The Vite development and preview servers mount the same handler used by Vercel at `/api/translate`. Translation sends text and (for conversation) up to 8 recent messages to Groq for processing. Between does not store conversation or document text; the provider's data practices apply.

Run checks and build with:

```sh
npm test
npm run build
npm run preview
```

## Vercel deployment

Import this repository into Vercel. Vercel detects the Vite app and the `api/translate.js` serverless function. Set `GROQ_API_KEY` and `GROQ_MODEL` in the project's server-side Environment Variables for each environment, then deploy. Do not add credentials to Vite-prefixed variables or client code.

Academic mode accepts pasted text and TXT/Markdown files, processing long documents in ordered sections. PDF extraction and OCR are not implemented.
