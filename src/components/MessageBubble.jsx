import React from 'react';
import { BookOpen, RotateCw, Volume2 } from 'lucide-react';
import { languageTag, translationCopy } from '../lib/translationCopy.js';

export default function MessageBubble({ message, participantName, selected, onSelect, onSpeak, onRetry }) {
  const ownMessage = message.speaker === 'you';
  const copy = translationCopy(message.targetCode);
  const translationLabel = message.isDemo ? `${copy.translation} · example` : copy.translation;

  return (
    <article className={`message-row${ownMessage ? ' from-you' : ''}`}>
      <div className="message-meta">
        <span>{ownMessage ? 'You' : participantName} · {message.time}</span>
        {message.mixedLanguages && <span className="mixed-language-label">Mixed languages</span>}
        {message.note && (
          <button
            className={`note-link${selected ? ' active' : ''}`}
            type="button"
            onClick={onSelect}
            aria-pressed={selected}
          >
            <BookOpen size={13} aria-hidden="true" /><span>Meaning note</span>
          </button>
        )}
      </div>
      <div className={`message-card${selected ? ' selected' : ''}`}>
        <div className="message-original">
          <span className="message-label">Original · {message.originalLanguage}</span>
            <p lang={languageTag(message.sourceCode)}>{message.original}</p>
        </div>
        {message.translation && (
          <div className="message-translation">
            <div className="message-translation-heading">
              <span className="message-label">{translationLabel}</span>
              <button
                className="icon-button speech-button"
                type="button"
                onClick={() => onSpeak(message.translation, message.translationLanguage)}
                aria-label={`Play ${translationLabel.toLowerCase()} aloud`}
                title="Play aloud"
                disabled={typeof window === 'undefined' || !('speechSynthesis' in window)}
              >
                <Volume2 size={15} aria-hidden="true" />
              </button>
            </div>
            <p lang={languageTag(message.targetCode)}>{message.translation}</p>
          </div>
        )}
        {message.translation && (
          <section className="message-details" lang={languageTag(message.targetCode)}>
            <h3>{copy.conveying}<span>{copy.details}</span></h3>
            {message.explanation && <p className="message-explanation">{message.explanation}</p>}
            {message.toneLabels?.length > 0 && (
              <div className="message-tone-labels" aria-label={copy.tone}>
                <span className="message-label">{copy.tone}</span>
                {message.toneLabels.map((label) => <span className="tone-chip" key={label}>{label}</span>)}
              </div>
            )}
            {message.literalTranslation && <p className="message-detail"><strong>{copy.literal}:</strong> {message.literalTranslation}</p>}
            {message.alternatives?.length > 0 && (
              <div className="message-detail"><strong>{copy.alternatives}</strong><ul>{message.alternatives.map((alternative) => <li key={alternative}>{alternative}</li>)}</ul></div>
            )}
            {message.uncertainty && <p className="message-uncertainty"><strong>{copy.uncertainty}:</strong> {message.uncertainty}</p>}
          </section>
        )}
        {message.loading && <output className="translation-loading" aria-live="polite">Translating…</output>}
        {message.error && (
          <div className="translation-error" role="alert">
            <p>{message.error}</p>
            <button className="retry-button" type="button" onClick={onRetry}>
              <RotateCw size={13} aria-hidden="true" /> Retry
            </button>
          </div>
        )}
      </div>
    </article>
  );
}
