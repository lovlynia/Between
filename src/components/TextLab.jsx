import React, { useState } from 'react';
import { FileText, RotateCw, Upload } from 'lucide-react';
import { splitIntoSections } from '../lib/documentSections.js';
import MeaningNote from './MeaningNote.jsx';
import { languageTag, translationCopy } from '../lib/translationCopy.js';

const MODES = [
  { id: 'everyday', label: 'Everyday' },
  { id: 'academic', label: 'Academic' },
  { id: 'professional', label: 'Professional' },
  { id: 'ambiguous', label: 'Ambiguous text' },
];

const LANGUAGES = [
  { code: 'auto', label: 'Detect automatically' },
  { code: 'zh-CN', label: 'Chinese (Simplified)' },
  { code: 'zh-TW', label: 'Chinese (Traditional)' },
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Spanish' },
  { code: 'fr', label: 'French' },
  { code: 'ja', label: 'Japanese' },
  { code: 'pt', label: 'Portuguese' },
];

const TARGET_LANGUAGES = LANGUAGES.filter((language) => language.code !== 'auto');
const MAX_DOCUMENT_LENGTH = 100_000;

export default function TextLab() {
  const [mode, setMode] = useState('everyday');
  const [text, setText] = useState('');
  const [fileName, setFileName] = useState('');
  const [sourceLanguage, setSourceLanguage] = useState('auto');
  const [targetLanguage, setTargetLanguage] = useState('zh-CN');
  const [professionalStyle, setProfessionalStyle] = useState('preserve');
  const [job, setJob] = useState(null);
  const [results, setResults] = useState([]);
  const [failedIndex, setFailedIndex] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');

  function changeMode(nextMode) {
    setMode(nextMode);
    setResults([]);
    setJob(null);
    setFailedIndex(null);
    setError('');
  }

  async function loadFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_DOCUMENT_LENGTH) {
      setError('Files must be 100,000 bytes or smaller.');
      event.target.value = '';
      return;
    }
    try {
      const contents = await file.text();
      if (contents.length > MAX_DOCUMENT_LENGTH) throw new Error('Files must be 100,000 characters or smaller.');
      setText(contents);
      setFileName(file.name);
      setResults([]);
      setJob(null);
      setError('');
    } catch (fileError) {
      setError(fileError instanceof Error ? fileError.message : 'This file could not be read.');
    }
  }

  async function submit(event) {
    event.preventDefault();
    if (!text.trim()) {
      setError('Add text before translating.');
      return;
    }
    if (mode !== 'academic' && text.length > 5000) {
      setError('This mode accepts up to 5,000 characters at a time.');
      return;
    }

    let sections;
    try {
      sections = mode === 'academic' ? splitIntoSections(text) : [text];
    } catch {
      setError('The document could not be divided into sections.');
      return;
    }
    const nextJob = { mode, sections, sourceLanguage, targetLanguage, professionalStyle };
    setJob(nextJob);
    setResults([]);
    setFailedIndex(null);
    setError('');
    await runSections(nextJob, 0, []);
  }

  async function runSections(activeJob, startAt, completed) {
    setProcessing(true);
    setError('');
    const nextResults = [...completed];
    for (let index = startAt; index < activeJob.sections.length; index += 1) {
      setProgress(`Section ${index + 1} of ${activeJob.sections.length}`);
      const requestBody = {
        mode: activeJob.mode,
        text: activeJob.sections[index],
        sourceLanguage: activeJob.sourceLanguage,
        targetLanguage: activeJob.targetLanguage,
      };
      if (activeJob.mode === 'academic') {
        requestBody.sectionIndex = index + 1;
        requestBody.sectionCount = activeJob.sections.length;
        requestBody.priorTerms = nextResults.flatMap((result) => result?.technicalTerms ?? [])
          .map(({ sourceTerm, translatedTerm }) => ({ sourceTerm, translatedTerm }))
          .slice(-40);
      }
      if (activeJob.mode === 'professional') requestBody.professionalStyle = activeJob.professionalStyle;

      try {
        const response = await fetch('/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        });
        const result = await response.json().catch(() => null);
        if (!response.ok) throw new Error(result?.error ?? 'Translation failed. Please retry.');
        nextResults[index] = result;
        setResults([...nextResults]);
      } catch (requestError) {
        setFailedIndex(index);
        setError(`Section ${index + 1} failed: ${requestError instanceof Error ? requestError.message : 'Please retry.'}`);
        setProcessing(false);
        setProgress('');
        return;
      }
    }
    setFailedIndex(null);
    setProcessing(false);
    setProgress('');
  }

  async function retry() {
    if (job && failedIndex !== null) await runSections(job, failedIndex, results);
  }

  const maximumLength = mode === 'academic' ? MAX_DOCUMENT_LENGTH : 5000;

  return (
    <section className="text-lab" aria-labelledby="lab-title">
      <header className="lab-header">
        <div>
          <p className="section-kicker">Deep translation</p>
          <h1 id="lab-title">Text lab</h1>
        </div>
        <span className="lab-mark"><FileText size={16} aria-hidden="true" />Meaning, in detail</span>
      </header>

      <div className="mode-tabs" role="tablist" aria-label="Translation mode">
        {MODES.map((item) => (
          <button
            key={item.id}
            className={`mode-tab${mode === item.id ? ' active' : ''}`}
            id={`tab-${item.id}`}
            type="button"
            role="tab"
            aria-selected={mode === item.id}
            aria-controls="mode-panel"
            disabled={processing}
            onClick={() => changeMode(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <form className="lab-form" onSubmit={submit} aria-labelledby={`tab-${mode}`}>
        <div className="lab-options">
          <label className="language-select">
            <span className="micro-label">Source language</span>
            <select value={sourceLanguage} onChange={(event) => setSourceLanguage(event.target.value)} disabled={processing}>
              {LANGUAGES.map((language) => <option key={language.code} value={language.code}>{language.label}</option>)}
            </select>
          </label>
          <label className="language-select">
            <span className="micro-label">Translate to</span>
            <select value={targetLanguage} onChange={(event) => setTargetLanguage(event.target.value)} disabled={processing}>
              {TARGET_LANGUAGES.map((language) => <option key={language.code} value={language.code}>{language.label}</option>)}
            </select>
          </label>
          {mode === 'professional' && (
            <label className="language-select professional-style">
              <span className="micro-label">Translation treatment</span>
              <select value={professionalStyle} onChange={(event) => setProfessionalStyle(event.target.value)} disabled={processing}>
                <option value="preserve">Preserve tone</option>
                <option value="formalize">Formalize</option>
                <option value="naturalize">Improve naturalness</option>
                <option value="explain">Explain conventions only</option>
              </select>
            </label>
          )}
        </div>

        {mode === 'academic' && (
          <div className="document-controls">
            <label className="file-button">
              <Upload size={15} aria-hidden="true" />
              <span>{fileName || 'Choose TXT or Markdown'}</span>
              <input type="file" accept=".txt,.md,text/plain,text/markdown" onChange={loadFile} disabled={processing} />
            </label>
            <p>PDF import is not enabled until text extraction is reliable. Scanned documents may need OCR.</p>
          </div>
        )}

        <div id="mode-panel" role="tabpanel" aria-labelledby={`tab-${mode}`}>
          <label className="sr-only" htmlFor="lab-source-text">Text to translate</label>
          <textarea
            id="lab-source-text"
            className="lab-textarea"
            value={text}
            maxLength={maximumLength}
            onChange={(event) => setText(event.target.value)}
            placeholder={mode === 'academic' ? 'Paste an excerpt or load a TXT/Markdown document…' : 'Paste text to translate…'}
            rows={mode === 'academic' ? 10 : 7}
            disabled={processing}
            aria-describedby="lab-caption"
          />
        </div>

        {mode === 'everyday' && <p className="mode-caption">Slang, idioms, humor, sarcasm, cultural nuance, code-switching.</p>}
        {mode === 'academic' && <p className="mode-caption">Headings, equations, units, citations, terminology, hedging, and limitations are kept in sequence.</p>}
        {mode === 'professional' && <p className="mode-caption">Translation stays separate from any optional rewrite.</p>}
        {mode === 'ambiguous' && <p className="mode-caption">Compare plausible readings and what context is still missing.</p>}

        <div className="lab-submit-row">
          <span id="lab-caption" className="character-count">{text.length.toLocaleString()} / {maximumLength.toLocaleString()}</span>
          <button className="send-button" type="submit" disabled={processing || !text.trim()}>
            <span>{processing ? 'Translating…' : 'Translate'}</span>
          </button>
        </div>
        <p className="external-processing-note">Text is sent to an external AI service for processing. Between does not save it; provider data practices apply.</p>
      </form>

      {error && (
        <div className="lab-error" role="alert">
          <p>{error}</p>
          {failedIndex !== null && (
            <button className="retry-button" type="button" onClick={retry} disabled={processing}>
              <RotateCw size={13} aria-hidden="true" /> Retry section
            </button>
          )}
        </div>
      )}
      {progress && <output className="lab-progress" aria-live="polite">{progress}</output>}
      {results.length > 0 && <ModeResults mode={job?.mode ?? mode} results={results} targetLanguage={job?.targetLanguage ?? targetLanguage} />}
    </section>
  );
}

function ModeResults({ mode, results, targetLanguage }) {
  const copy = translationCopy(targetLanguage);

  return (
    <section className="lab-results" aria-label={copy.details} lang={languageTag(targetLanguage)} aria-live="polite">
      {results.map((result, index) => (
        <article className="lab-result" key={`${mode}-${index}`}>
          {mode === 'academic' && <h2>Section {index + 1}</h2>}
          {mode === 'everyday' && <EverydayResult result={result} targetLanguage={targetLanguage} />}
          {mode === 'academic' && <AcademicResult result={result} targetLanguage={targetLanguage} />}
          {mode === 'professional' && <ProfessionalResult result={result} targetLanguage={targetLanguage} />}
          {mode === 'ambiguous' && <AmbiguousResult result={result} targetLanguage={targetLanguage} />}
        </article>
      ))}
    </section>
  );
}

function EverydayResult({ result, targetLanguage }) {
  const copy = translationCopy(targetLanguage);

  return (
    <>
      <h2>{copy.details}</h2>
      <p className="result-translation">{result.translation}</p>
      <section className="lab-result-details">
        <h3>{copy.conveying}</h3>
        <p className="result-explanation">{result.explanation}</p>
        {result.literalTranslation && <p className="result-detail"><strong>{copy.literal}:</strong> {result.literalTranslation}</p>}
        <StringList title={copy.alternatives} values={result.alternatives} />
        <StringList title={copy.questions} values={result.clarificationQuestions} />
        {result.meaningNotes.map((note) => <MeaningNote key={note.expression} targetLanguage={targetLanguage} note={{ ...note, pitfall: note.literalPitfall, alternatives: note.regionalUncertainty ?? copy.regional, regionalUncertainty: note.regionalUncertainty }} />)}
        {result.uncertainty && <p className="result-uncertainty"><strong>{copy.uncertainty}:</strong> {result.uncertainty}</p>}
      </section>
    </>
  );
}

function AcademicResult({ result, targetLanguage }) {
  const copy = translationCopy(targetLanguage);

  return (
    <>
      <div className="result-translation preserve-whitespace">{result.translation}</div>
      {result.technicalTerms.length > 0 && (
        <div className="term-list">
          <h3>{copy.technical}</h3>
          {result.technicalTerms.map((term) => (
            <p key={`${term.sourceTerm}-${term.translatedTerm}`}>
              <strong>{term.sourceTerm}</strong> → {term.translatedTerm}<span>{term.explanation}</span>
            </p>
          ))}
        </div>
      )}
      <StringList title={copy.preservation} values={result.preservationNotes} />
      {result.uncertainty && <p className="result-uncertainty"><strong>{copy.uncertainty}:</strong> {result.uncertainty}</p>}
    </>
  );
}

function ProfessionalResult({ result, targetLanguage }) {
  const copy = translationCopy(targetLanguage);

  return (
    <>
      <h2>{copy.details}</h2>
      <p className="result-translation">{result.translation}</p>
      {result.rewrittenText && (
        <div className="rewrite-result">
          <h3>{copy.rewrite}</h3>
          <p>{result.rewrittenText}</p>
          {result.rewriteExplanation && <p className="result-detail">{result.rewriteExplanation}</p>}
        </div>
      )}
      <StringList title={copy.conventions} values={result.culturalConventions} />
      {result.uncertainty && <p className="result-uncertainty"><strong>{copy.uncertainty}:</strong> {result.uncertainty}</p>}
    </>
  );
}

function AmbiguousResult({ result, targetLanguage }) {
  const copy = translationCopy(targetLanguage);

  return (
    <>
      <h2>{copy.interpretations}</h2>
      {result.interpretations.map((item, index) => (
        <div className="interpretation" key={`${index}-${item.reading}`}>
          <h3>{item.reading}</h3>
          <p><strong>{copy.supporting}</strong>{item.supportingContext}</p>
          <p><strong>{copy.missing}</strong>{item.missingInformation}</p>
        </div>
      ))}
      <p className="confidence-note"><strong>{copy.confidence}:</strong> {result.confidence}</p>
      <StringList title={copy.questions} values={result.clarificationQuestions} />
      {result.uncertainty && <p className="result-uncertainty"><strong>{copy.uncertainty}:</strong> {result.uncertainty}</p>}
    </>
  );
}

function StringList({ title, values }) {
  if (!values?.length) return null;
  return (
    <div className="result-list">
      <h3>{title}</h3>
      <ul>{values.map((value) => <li key={value}>{value}</li>)}</ul>
    </div>
  );
}