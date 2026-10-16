# Between--

**Translate the words. Explain the meaning. Preserve what gets lost.**

Between is a context-aware language understanding platform that helps people communicate across languages without losing the nuance behind their words. Beyond literal translation, it aims to preserve intent, tone, cultural context, technical meaning, and ambiguity.

Built for everyday conversations, mixed-language messages, professional communication, and academic research.

## Features

### Conversation
- Translate messages between two participants with independent language preferences.
- Display original messages alongside their translations.
- Explain idioms, slang, cultural references, and potentially misleading literal translations.
- Identify mixed-language text and surface uncertainty when meaning is unclear.
- Listen to translations using browser speech synthesis when supported.

### Deep Translation
Explore difficult text through four specialized modes:

- **Everyday Language** — Understand slang, idioms, humor, sarcasm, and code-switching.
- **Academic Writing** — Translate research passages while preserving technical terminology, equations, citations, numerical values, and uncertainty.
- **Professional Communication** — Translate emails and workplace messages while preserving tone, with optional adjustments to formality and naturalness.
- **Ambiguous Text** — Explore plausible interpretations, contextual clues, missing information, and useful clarification questions.

### Context and Meaning
Between distinguishes direct translation from contextual explanation. When multiple interpretations are plausible, it aims to explain the uncertainty rather than force a single answer.

## Team & Contributions

- **Cindy Nguyen & Wendy Wang-rui:** Drove the product vision, ideation, and UI/UX design, shaping Between's core concept and user experience.
- **Stephanie Abundio & Kyle Liao :** Led technical implementation, including frontend development, application architecture, repository development, and AI integration. Focusing on AI prompting and Multi-agent systems using co-pilot assigning AI bots to specialized individual task as well as testing and validating the languages being translated. 

## Technology

- React
- Vite
- JavaScript
- CSS
- Lucide React
- Vercel serverless functions
- Groq API for AI-powered translation

## Getting Started

### Requirements
- Node.js 20.19+ or 22.12+
- npm
- A Groq API key for live AI translation

### Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/lovlynia/Between.git
cd Between
npm install
```

Create your local environment file:

```bash
cp .env.example .env
```

Add your Groq API credentials to `.env`:

```dotenv
GROQ_API_KEY=your_api_key_here
GROQ_MODEL=openai/gpt-oss-120b
```

Never commit `.env` or expose API credentials in client-side code.

### Run Locally

```bash
npm run dev
```

### Run Tests and Build

```bash
npm test
npm run build
npm run preview
```

## Deployment

Between is designed for deployment on Vercel.

1. Import the repository into Vercel.
2. Configure `GROQ_API_KEY` and `GROQ_MODEL` in the project's server-side environment variables.
3. Deploy the application.

The Vercel serverless endpoint handles AI requests so API credentials remain server-side.

## Privacy and Limitations

Between does not store conversation or document text by default. Text submitted for AI processing is sent to the configured provider, whose data-handling policies apply.

Academic document support currently focuses on pasted text and TXT/Markdown files. PDF extraction and OCR are not implemented.

Translations can depend on dialect, context, audience, and relationship. AI-generated explanations are interpretations, not guarantees of intent or scientific accuracy.

## Project

Created for Microsoft Hackathon at NYTechWeek.

[View the repository](https://github.com/lovlynia/Between)
