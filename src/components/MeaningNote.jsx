import React from 'react';
import { languageTag, translationCopy } from '../lib/translationCopy.js';

export default function MeaningNote({ note, targetLanguage = 'en' }) {
  const copy = translationCopy(targetLanguage);

  return (
    <div className="meaning-note" lang={languageTag(targetLanguage)}>
      <p className="meaning-expression" lang="und">“{note.expression}”</p>
      <span className="note-detail-label">{copy.meaning}</span>
      <p>{note.meaning}</p>
      <div className="note-detail">
        <span className="note-detail-label">{copy.pitfall}</span>
        <p>{note.pitfall}</p>
      </div>
      <div className="note-detail">
        <span className="note-detail-label">{copy.alternatives}</span>
        <p>{note.alternatives}</p>
      </div>
      <p className="uncertainty-note">
        {note.regionalUncertainty ?? copy.regional}
      </p>
    </div>
  );
}