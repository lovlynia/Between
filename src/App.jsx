import React, { useMemo, useRef, useState } from 'react';
import {
  BookOpen,
  FlaskConical,
  History,
  Languages,
  Mic,
  MessageCircle,
  Send,
} from 'lucide-react';
import LanguageSelect from './components/LanguageSelect.jsx';
import MeaningNote from './components/MeaningNote.jsx';
import MessageBubble from './components/MessageBubble.jsx';
import TextLab from './components/TextLab.jsx';
import { languageTag, toneDescriptors, toneSummary, translationCopy } from './lib/translationCopy.js';

const LANGUAGE_OPTIONS = [
  { code: 'auto', label: 'Detect automatically' },
  { code: 'zh-CN', label: 'Chinese (Simplified)' },
  { code: 'zh-TW', label: 'Chinese (Traditional)' },
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Spanish' },
  { code: 'fr', label: 'French' },
  { code: 'ja', label: 'Japanese' },
  { code: 'pt', label: 'Portuguese' },
];

const TONE_OPTIONS = [
  { value: 'friendly', label: 'Friendly' },
  { value: 'clear', label: 'Clear' },
  { value: 'professional', label: 'Professional' },
  { value: 'playful', label: 'Playful' },
];

const DEMOS = [
  {
    id: 'rainy-day',
    title: 'After the rain',
    participant: 'Maya Rivera',
    initials: 'MR',
    from: { code: 'es', label: 'Spanish' },
    to: { code: 'en', label: 'English' },
    messages: [
      {
        id: 'rain-1', speaker: 'other', original: 'Ya voy, no te preocupes.',
        originalLanguage: 'Spanish', translation: "I'm on my way, don't worry.",
        translationLanguage: 'English', time: '10:42',
        note: {
          expression: 'Ya voy',
          meaning: 'Literally, “I am already going.” Here, it naturally means “I’m on my way.”',
          pitfall: 'A word-for-word rendering can sound as if the speaker has just started walking.',
          alternatives: 'Depending on the situation, it can also mean “I’m coming now.”',
        },
      },
      {
        id: 'rain-2', speaker: 'you',
        original: "Perfect, I'll wait for you here.",
        originalLanguage: 'English', translation: 'Perfecto, aquí te espero.',
        translationLanguage: 'Spanish', time: '10:43',
        note: {
          expression: 'Aquí te espero',
          meaning: '“I’ll wait for you here” is a natural rendering in this exchange.',
          pitfall: 'The phrase does not by itself establish impatience or urgency.',
          alternatives: 'The exact tone depends on the relationship and surrounding conversation.',
        },
      },
      {
        id: 'rain-3', speaker: 'other', original: 'Gracias por la paciencia. Está lloviendo a cántaros.',
        originalLanguage: 'Spanish', translation: "Thanks for being patient. It's raining cats and dogs.",
        translationLanguage: 'English', time: '10:44',
        note: {
          expression: 'Lloviendo a cántaros',
          meaning: 'An idiom describing very heavy rain.',
          pitfall: 'The literal image is “raining pitchers”; translating the image directly would be confusing.',
          alternatives: '“Pouring” is another natural English option.',
        },
      },
    ],
  },
  {
    id: 'quick-check-in',
    title: 'A quick check-in',
    participant: 'Camille Moreau',
    initials: 'CM',
    from: { code: 'fr', label: 'French' },
    to: { code: 'en', label: 'English' },
    messages: [
      {
        id: 'check-1', speaker: 'you', original: 'Did you get a chance to look at the document?',
        originalLanguage: 'English', translation: 'Tu as eu le temps de regarder le document ?',
        translationLanguage: 'French', time: '14:16',
        note: {
          expression: 'Tu as eu le temps de…',
          meaning: 'A common way to ask whether someone had time to do something.',
          pitfall: 'A literal “Did you have the time” can suggest asking for the clock time in English.',
          alternatives: '“Have you had a chance to…” is also natural in a work conversation.',
        },
      },
      {
        id: 'check-2', speaker: 'other', original: 'Oui, je regarde ça tout de suite.',
        originalLanguage: 'French', translation: "Yes, I'll take a look right away.",
        translationLanguage: 'English', time: '14:18',
        note: {
          expression: 'Je regarde ça',
          meaning: 'Literally, “I’m looking at that”; in context, “I’ll take a look” is more natural.',
          pitfall: 'The phrase alone does not establish a specific deadline beyond the speaker’s stated timing.',
          alternatives: 'Depending on context, “I’ll check it out” may also fit.',
        },
      },
    ],
  },
];

function makeMessages(demo) {
  return demo.messages.map((message) => ({
    ...message,
    sourceCode: LANGUAGE_OPTIONS.find((language) => language.label === message.originalLanguage)?.code,
    targetCode: LANGUAGE_OPTIONS.find((language) => language.label === message.translationLanguage)?.code,
    isDemo: true,
  }));
}

function speakText(text, language) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window) || !text) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  const localeByLanguage = {
    English: 'en-US', Spanish: 'es-ES', French: 'fr-FR', Japanese: 'ja-JP', Portuguese: 'pt-BR',
    'Chinese (Simplified)': 'zh-CN', 'Chinese (Traditional)': 'zh-TW',
  };
  utterance.lang = localeByLanguage[language] ?? 'en-US';
  window.speechSynthesis.speak(utterance);
}

function App() {
  const [demoIndex, setDemoIndex] = useState(0);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [preferences, setPreferences] = useState({ user: 'auto', other: 'zh-CN' });
  const [tone, setTone] = useState('friendly');
  const [selectedMessageId, setSelectedMessageId] = useState(null);
  const [notice, setNotice] = useState('');
  const [activeView, setActiveView] = useState('translate');
  const [listening, setListening] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const audioChunksRef = useRef([]);
  const selectedMessage = useMemo(
    () => messages.find((message) => message.id === selectedMessageId) ?? messages.at(-1),
    [messages, selectedMessageId],
  );

  function updatePreference(participant, languageCode) {
    setPreferences((current) => ({ ...current, [participant]: languageCode }));
  }

  async function requestTranslation(message) {
    setMessages((current) => current.map((item) => (
      item.id === message.id ? { ...item, loading: true, error: '' } : item
    )));
    setNotice('Sending message and recent context for external processing.');

    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'conversation',
          text: message.original,
          sourceLanguage: message.sourceCode,
          targetLanguage: message.targetCode,
          context: message.context,
          tone: message.tone ?? tone,
        }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(result?.error ?? 'Translation failed. Please retry.');
      }

      const detectedLanguage = result.detectedLanguage;
      const sourceName = message.sourceCode === 'auto'
        ? languageName(detectedLanguage)
        : languageName(message.sourceCode);
      const targetName = languageName(message.targetCode);
      setMessages((current) => current.map((item) => (
        item.id === message.id
          ? {
              ...item,
              loading: false,
              error: '',
              originalLanguage: sourceName,
              translation: result.translation,
              translationLanguage: targetName,
              explanation: result.explanation,
              literalTranslation: result.literalTranslation,
              alternatives: result.alternatives,
              toneLabels: toneDescriptors(message.targetCode, message.tone ?? tone),
              uncertainty: result.uncertainty,
              mixedLanguages: result.mixedLanguages,
              note: result.meaningNotes[0]
                ? {
                    expression: result.meaningNotes[0].expression,
                    meaning: result.meaningNotes[0].meaning,
                    pitfall: result.meaningNotes[0].literalPitfall,
                    alternatives: translationCopy(message.targetCode).regional,
                    regionalUncertainty: result.meaningNotes[0].regionalUncertainty,
                  }
                : null,
            }
          : item
      )));
      setNotice('Translation complete. The original is unchanged.');
    } catch (error) {
      const messageText = error instanceof Error ? error.message : 'Translation failed. Please retry.';
      setMessages((current) => current.map((item) => (
        item.id === message.id ? { ...item, loading: false, error: messageText } : item
      )));
      setNotice('Translation did not complete. Your original is still available to retry.');
    }
  }

  function sendMessage(event) {
    event.preventDefault();
    if (!draft.trim()) {
      setNotice('Write a message before sending.');
      return;
    }
    if (preferences.other === 'auto') {
      setNotice('Choose a language for the other participant before translating.');
      return;
    }

    const context = messages
      .filter((message) => !message.isDemo && message.original)
      .slice(-8)
      .map((message) => ({ speaker: message.speaker, text: message.original }));
    const message = {
      id: `local-${Date.now()}`,
      speaker: 'you',
      original: draft,
      originalLanguage: languageName(preferences.user),
      translation: '',
      translationLanguage: languageName(preferences.other),
      time: new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' }).format(new Date()),
      isDemo: false,
      loading: true,
      error: '',
      sourceCode: preferences.user,
      targetCode: preferences.other,
      context,
      tone,
    };

    setMessages((current) => [...current, message]);
    setSelectedMessageId(message.id);
    setDraft('');
    void requestTranslation(message);
  }

  async function dictateMessage() {
    if (recorderRef.current) {
      recorderRef.current.stop();
      setNotice('Preparing your recording…');
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setNotice('Microphone recording is not supported in this browser.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      audioChunksRef.current = [];
      const mimeType = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm']
        .find((candidate) => MediaRecorder.isTypeSupported(candidate));
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      recorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size) audioChunksRef.current.push(event.data);
      };
      recorder.onerror = () => {
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        recorderRef.current = null;
        setListening(false);
        setNotice('Recording stopped unexpectedly. Please try again.');
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        recorderRef.current = null;
        setListening(false);
        const audio = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        audioChunksRef.current = [];
        if (!audio.size) {
          setNotice('No audio was captured. Please try again.');
          return;
        }
        if (audio.size > 3 * 1024 * 1024) {
          setNotice('Recording is too large. Please try a shorter recording.');
          return;
        }

        setTranscribing(true);
        setNotice('Transcribing recording…');
        try {
          const audioBase64 = await blobToBase64(audio);
          const response = await fetch('/api/transcribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ audioBase64, mimeType: audio.type, language: preferences.user }),
          });
          const result = await response.json().catch(() => null);
          if (!response.ok) throw new Error(result?.error ?? 'Transcription failed. Please try again.');
          setDraft((current) => [current.trimEnd(), result.text].filter(Boolean).join(' '));
          setNotice('Dictation added to your draft.');
        } catch (error) {
          setNotice(error instanceof Error ? error.message : 'Transcription failed. Please try again.');
        } finally {
          setTranscribing(false);
        }
      };
      recorder.start();
      setListening(true);
      setNotice('Listening. Select the microphone again to finish.');
    } catch (error) {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setListening(false);
      setNotice(error instanceof Error && error.name === 'NotAllowedError'
        ? 'Allow microphone access in your browser, then try again.'
        : 'Could not start the microphone. Please try again.');
    }
  }

  function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '');
      reader.onerror = () => reject(new Error('Could not read microphone recording.'));
      reader.readAsDataURL(blob);
    });
  }

  function languageName(code) {
    return LANGUAGE_OPTIONS.find((language) => language.code === code)?.label ?? code ?? 'Unknown language';
  }

  const workspaceViews = {
    history: <PreviousTranslationsView selectedIndex={demoIndex} onSelect={setDemoIndex} />,
    lab: <TextLab />,
    notes: <MeaningNotesView messages={messages} />,
  };

  return (
    <main className={`app-shell${activeView === 'translate' ? '' : ' single-column'}`}>
      <aside className="left-rail" aria-label="Primary navigation">
        <a className="brand" href="#conversation" aria-label="Between home">
          <span className="brand-name">between--</span>
          <span className="brand-tagline">say it your way.</span>
        </a>
        <nav className="primary-nav" aria-label="Workspace">
          <button className={`nav-item${activeView === 'translate' ? ' is-active' : ''}`} type="button" aria-pressed={activeView === 'translate'} onClick={() => setActiveView('translate')}>
            <Languages size={17} aria-hidden="true" /><span>Translate</span>
          </button>
          <button className={`nav-item${activeView === 'history' ? ' is-active' : ''}`} type="button" aria-pressed={activeView === 'history'} onClick={() => setActiveView('history')}>
            <History size={17} aria-hidden="true" /><span>Previous translations</span>
          </button>
          <button className={`nav-item${activeView === 'lab' ? ' is-active' : ''}`} type="button" aria-pressed={activeView === 'lab'} onClick={() => setActiveView('lab')}>
            <FlaskConical size={17} aria-hidden="true" /><span>Text lab</span>
          </button>
          <button className={`nav-item${activeView === 'notes' ? ' is-active' : ''}`} type="button" aria-pressed={activeView === 'notes'} onClick={() => setActiveView('notes')}>
            <BookOpen size={17} aria-hidden="true" /><span>Meaning notes</span>
          </button>
        </nav>
        <div className="rail-bottom"><span className="privacy-dot" aria-hidden="true" />Nothing saved by default</div>
      </aside>

      {activeView === 'translate' ? (
      <>
      <section className="conversation-column" id="conversation" aria-labelledby="page-title">
        <header className="conversation-header">
          <div><p className="section-kicker">Shared understanding</p><h1 id="page-title">Translate</h1></div>
          <div className="sample-badge"><span className="sample-indicator" aria-hidden="true" />Not saved</div>
        </header>

        <div className="translation-languages">
          <LanguageSelect id="your-language" label="Translate from" value={preferences.user} options={LANGUAGE_OPTIONS} onChange={(value) => updatePreference('user', value)} />
          <span className="language-divider" aria-hidden="true"><Languages size={17} /></span>
          <LanguageSelect id="partner-language" label="Translate to" value={preferences.other} options={LANGUAGE_OPTIONS.filter((language) => language.code !== 'auto')} onChange={(value) => updatePreference('other', value)} />
        </div>
        <div className="tone-control">
          <label className="tone-select-label" htmlFor="translation-tone">Tone</label>
          <select id="translation-tone" value={tone} onChange={(event) => setTone(event.target.value)}>
            {TONE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
          <p className="tone-summary" lang={languageTag(preferences.other)}>{toneSummary(preferences.other, tone)}</p>
        </div>

        <div className="messages" aria-label="Conversation messages" aria-live="polite">
          {messages.length === 0 && (
            <div className="translator-empty">
              <MessageCircle size={22} aria-hidden="true" />
              <h2>Your translation will appear here</h2>
              <p>Write or dictate a message to begin. Your original stays alongside its translation.</p>
            </div>
          )}
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              participantName="You"
              selected={selectedMessage?.id === message.id}
              onSelect={() => setSelectedMessageId(message.id)}
              onSpeak={speakText}
              onRetry={() => requestTranslation(message)}
            />
          ))}
        </div>

        <form className="composer" onSubmit={sendMessage}>
          <label className="sr-only" htmlFor="message-draft">Write a message</label>
          <textarea
            id="message-draft"
            rows="2"
            maxLength={5000}
            placeholder="Write or dictate text to translate…"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            aria-describedby="composer-caption"
          />
          <div className="composer-footer">
            <p id="composer-caption" lang={languageTag(preferences.other)}>{translationCopy(preferences.other).privacyText}</p>
            <button className={`icon-button microphone-button${listening ? ' listening' : ''}`} type="button" onClick={dictateMessage} disabled={transcribing} aria-label={listening ? 'Stop recording' : transcribing ? 'Transcribing recording' : 'Record dictation'} aria-pressed={listening} title={listening ? 'Stop recording' : 'Record dictation'}>
              <Mic size={16} aria-hidden="true" />
            </button>
            <button className="send-button" type="submit" disabled={messages.some((message) => message.loading)}>
              <span>Translate</span><Send size={15} aria-hidden="true" />
            </button>
          </div>
        </form>
        <p className="status-message" role="status" aria-live="polite">{notice}</p>
      </section>

        <aside className="context-column" aria-labelledby="context-title">
        <div className="context-header" lang={languageTag(preferences.other)}>
          <div><p className="section-kicker">{translationCopy(preferences.other).settings}</p><h2 id="context-title">{translationCopy(preferences.other).details}</h2></div>
        </div>
        <p className="translation-details-copy" lang={languageTag(preferences.other)}>{translationCopy(preferences.other).contextHelper}</p>

        <section className="meaning-section" aria-labelledby="meaning-title">
          <div className="meaning-heading">
            <span className="meaning-icon"><BookOpen size={15} aria-hidden="true" /></span>
            <div lang={languageTag(preferences.other)}><p className="section-kicker">{translationCopy(preferences.other).context}</p><h3 id="meaning-title">{translationCopy(preferences.other).meaning}</h3></div>
          </div>
          {selectedMessage?.note ? <MeaningNote note={selectedMessage.note} targetLanguage={selectedMessage.targetCode} /> : <p className="empty-note" lang={languageTag(preferences.other)}>{translationCopy(preferences.other).meaningEmpty}</p>}
        </section>
        <div className="panel-rule" />

        <section className="privacy-note" aria-labelledby="privacy-title">
          <p className="section-kicker" id="privacy-title" lang={languageTag(preferences.other)}>{translationCopy(preferences.other).privacy}</p>
          <p lang={languageTag(preferences.other)}>{translationCopy(preferences.other).privacyText}</p>
        </section>
      </aside>
      </>
      ) : (
        <section className="conversation-column workspace-column">
          {workspaceViews[activeView]}
        </section>
      )}
    </main>
  );
}

function PreviousTranslationsView({ selectedIndex, onSelect }) {
  const selectedDemo = DEMOS[selectedIndex];

  return (
    <section className="history-view" aria-labelledby="history-title">
      <header className="conversation-header history-header">
        <div><p className="section-kicker">Your library</p><h1 id="history-title">Previous translations</h1></div>
      </header>
      <p className="history-disclosure">Illustrative examples only. Between does not store your real conversations.</p>
      <div className="history-layout">
        <nav className="history-list" aria-label="Previous translations">
          {DEMOS.map((item, index) => (
            <button className={`history-choice${index === selectedIndex ? ' selected' : ''}`} key={item.id} type="button" aria-pressed={index === selectedIndex} onClick={() => onSelect(index)}>
              <span className="thread-avatar" aria-hidden="true">{item.initials}</span>
              <span className="thread-choice-copy"><strong>{item.title}</strong><span>{item.from.label} to {item.to.label} · Example</span></span>
            </button>
          ))}
        </nav>
        <article className="history-detail" aria-labelledby="history-detail-title">
          <header className="thread-heading">
            <div className="participant-avatar" aria-hidden="true">{selectedDemo.initials}</div>
            <div className="thread-title-copy"><h2 id="history-detail-title">{selectedDemo.title}</h2><p>Illustrative previous translation · {selectedDemo.from.label} to {selectedDemo.to.label}</p></div>
          </header>
          <div className="messages" aria-label="Illustrative previous translation messages">
            {makeMessages(selectedDemo).map((message) => (
              <MessageBubble key={message.id} message={message} participantName={selectedDemo.participant} selected={false} onSelect={() => {}} onSpeak={speakText} onRetry={() => {}} />
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}

function MeaningNotesView({ messages }) {
  const notes = messages.filter((message) => message.note);

  return (
    <section className="notes-view" aria-labelledby="notes-title">
      <p className="section-kicker">Current thread · session only</p>
      <h1 id="notes-title">Meaning notes</h1>
      {notes.length ? notes.map((message) => (
        <article className="saved-meaning-note" key={message.id}>
          <div className="saved-note-meta">
            <span>{message.speaker === 'you' ? 'You' : 'Other participant'}</span>
            <span>{message.isDemo ? 'Illustrative sample' : 'Current session'}</span>
          </div>
          <MeaningNote note={message.note} targetLanguage={message.targetCode} />
        </article>
      )) : <p className="notes-empty">Meaning notes from this conversation will appear here when available.</p>}
    </section>
  );
}

export default App;