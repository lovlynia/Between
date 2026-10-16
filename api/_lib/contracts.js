const meaningNoteSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['expression', 'meaning', 'literalPitfall', 'regionalUncertainty'],
  properties: {
    expression: { type: 'string' },
    meaning: { type: 'string' },
    literalPitfall: { type: 'string' },
    regionalUncertainty: { type: ['string', 'null'] },
  },
};

const notes = { type: 'array', items: meaningNoteSchema };
const textList = { type: 'array', items: { type: 'string' } };
const nullableString = { type: ['string', 'null'] };

export const MODE_RESPONSE_SCHEMAS = {
  conversation: schema({
    translation: { type: 'string' },
    detectedLanguage: nullableString,
    mixedLanguages: { type: 'boolean' },
    literalTranslation: nullableString,
    explanation: { type: 'string' },
    alternatives: textList,
    uncertainty: nullableString,
    meaningNotes: notes,
  }),
  everyday: schema({
    translation: { type: 'string' },
    explanation: { type: 'string' },
    literalTranslation: nullableString,
    alternatives: textList,
    clarificationQuestions: textList,
    uncertainty: nullableString,
    meaningNotes: notes,
  }),
  academic: schema({
    translation: { type: 'string' },
    technicalTerms: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['sourceTerm', 'translatedTerm', 'explanation'],
        properties: {
          sourceTerm: { type: 'string' },
          translatedTerm: { type: 'string' },
          explanation: { type: 'string' },
        },
      },
    },
    preservationNotes: textList,
    uncertainty: nullableString,
  }),
  professional: schema({
    translation: { type: 'string' },
    rewrittenText: nullableString,
    rewriteExplanation: nullableString,
    culturalConventions: textList,
    uncertainty: nullableString,
  }),
  ambiguous: schema({
    interpretations: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['reading', 'supportingContext', 'missingInformation'],
        properties: {
          reading: { type: 'string' },
          supportingContext: { type: 'string' },
          missingInformation: { type: 'string' },
        },
      },
    },
    confidence: { type: 'string' },
    clarificationQuestions: textList,
    uncertainty: nullableString,
  }),
};

const MODE_FIELDS = {
  conversation: ['context', 'tone'],
  everyday: [],
  academic: ['sectionIndex', 'sectionCount', 'priorTerms'],
  professional: ['professionalStyle'],
  ambiguous: [],
};

export function validateTranslationRequest(body) {
  if (!isRecord(body)) return 'Request body must be a JSON object.';
  const mode = body.mode;
  if (!Object.hasOwn(MODE_FIELDS, mode)) return 'Translation mode is invalid.';
  const allowedKeys = new Set([
    'mode', 'text', 'sourceLanguage', 'targetLanguage',
    ...MODE_FIELDS[mode],
  ]);
  if (Object.keys(body).some((key) => !allowedKeys.has(key))) return 'Request contains unsupported fields.';
  if (typeof body.text !== 'string' || !body.text.trim() || body.text.length > 5000) {
    return 'Text must contain 1 to 5000 characters.';
  }
  if (!isLanguageCode(body.sourceLanguage, true)) return 'Source language is invalid.';
  if (!isLanguageCode(body.targetLanguage, false)) return 'Target language is invalid.';
  if (mode === 'conversation' && !validContext(body.context)) {
    return 'Context must contain no more than 8 valid messages.';
  }
  if (mode === 'conversation' && !['friendly', 'clear', 'professional', 'playful'].includes(body.tone)) {
    return 'Conversation tone is invalid.';
  }
  if (mode === 'academic' && (
    !Number.isInteger(body.sectionIndex)
    || !Number.isInteger(body.sectionCount)
    || body.sectionCount < 1
    || body.sectionCount > 100
    || body.sectionIndex < 1
    || body.sectionIndex > body.sectionCount
  )) return 'Academic section numbering is invalid.';
  if (mode === 'academic' && body.priorTerms !== undefined && (
    !Array.isArray(body.priorTerms)
    || body.priorTerms.length > 40
    || body.priorTerms.some((term) => !isRecord(term)
      || !hasExactKeys(term, ['sourceTerm', 'translatedTerm'])
      || !boundedString(term.sourceTerm, 300)
      || !boundedString(term.translatedTerm, 300))
  )) return 'Academic terminology context is invalid.';
  if (mode === 'professional' && !['preserve', 'formalize', 'naturalize', 'explain'].includes(body.professionalStyle)) {
    return 'Professional translation style is invalid.';
  }
  return null;
}

export function validateTranslationResponse(mode, value) {
  if (!Object.hasOwn(MODE_RESPONSE_SCHEMAS, mode) || !isRecord(value)) return false;
  const keys = MODE_RESPONSE_SCHEMAS[mode].required;
  if (!hasExactKeys(value, keys)) return false;

  switch (mode) {
    case 'conversation':
      return boundedString(value.translation, 12000)
        && nullableStringValue(value.detectedLanguage, 35)
        && (value.detectedLanguage === null || /^[a-z]{2,3}(?:-[A-Z]{2})?$/.test(value.detectedLanguage))
        && typeof value.mixedLanguages === 'boolean'
        && nullableStringValue(value.literalTranslation, 12000)
        && boundedString(value.explanation, 3000)
        && stringArray(value.alternatives, 3, 1000)
        && nullableStringValue(value.uncertainty, 1000)
        && validateNotes(value.meaningNotes);
    case 'everyday':
      return boundedString(value.translation, 12000)
        && boundedString(value.explanation, 3000)
        && nullableStringValue(value.literalTranslation, 12000)
        && stringArray(value.alternatives, 4, 1000)
        && stringArray(value.clarificationQuestions, 4, 500)
        && nullableStringValue(value.uncertainty, 1000)
        && validateNotes(value.meaningNotes);
    case 'academic':
      return boundedString(value.translation, 20000)
        && Array.isArray(value.technicalTerms)
        && value.technicalTerms.length <= 20
        && value.technicalTerms.every((term) => isRecord(term)
          && hasExactKeys(term, ['sourceTerm', 'translatedTerm', 'explanation'])
          && boundedString(term.sourceTerm, 300)
          && boundedString(term.translatedTerm, 300)
          && boundedString(term.explanation, 1000))
        && stringArray(value.preservationNotes, 8, 500)
        && nullableStringValue(value.uncertainty, 1000);
    case 'professional':
      return boundedString(value.translation, 12000)
        && nullableStringValue(value.rewrittenText, 12000)
        && nullableStringValue(value.rewriteExplanation, 1500)
        && stringArray(value.culturalConventions, 6, 700)
        && nullableStringValue(value.uncertainty, 1000);
    case 'ambiguous':
      return Array.isArray(value.interpretations)
        && value.interpretations.length >= 1
        && value.interpretations.length <= 4
        && value.interpretations.every((item) => isRecord(item)
          && hasExactKeys(item, ['reading', 'supportingContext', 'missingInformation'])
          && boundedString(item.reading, 1200)
          && boundedString(item.supportingContext, 1000)
          && boundedString(item.missingInformation, 1000))
        && boundedString(value.confidence, 500)
        && stringArray(value.clarificationQuestions, 5, 500)
        && nullableStringValue(value.uncertainty, 1000);
    default:
      return false;
  }
}

function schema(properties) {
  return {
    type: 'object',
    additionalProperties: false,
    required: Object.keys(properties),
    properties,
  };
}

function validContext(context) {
  if (context === undefined) return true;
  return Array.isArray(context)
    && context.length <= 8
    && context.every((item) => isRecord(item)
      && hasOnlyKeys(item, ['speaker', 'text'])
      && ['you', 'other'].includes(item.speaker)
      && boundedString(item.text, 2000));
}

function isLanguageCode(value, allowAuto) {
  return typeof value === 'string'
    && (allowAuto && value === 'auto' || /^[a-z]{2,3}(?:-[A-Z]{2})?$/.test(value));
}

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function hasExactKeys(value, required) {
  return required.length === Object.keys(value).length && required.every((key) => Object.hasOwn(value, key));
}

function hasOnlyKeys(value, allowed) {
  return Object.keys(value).every((key) => allowed.includes(key));
}

function boundedString(value, maximum) {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= maximum;
}

function nullableStringValue(value, maximum) {
  return value === null || typeof value === 'string' && value.length <= maximum;
}

function stringArray(value, maximumItems, maximumLength) {
  return Array.isArray(value)
    && value.length <= maximumItems
    && value.every((item) => boundedString(item, maximumLength));
}

function validateNotes(value) {
  return Array.isArray(value)
    && value.length <= 5
    && value.every((note) => isRecord(note)
      && hasExactKeys(note, ['expression', 'meaning', 'literalPitfall', 'regionalUncertainty'])
      && boundedString(note.expression, 300)
      && boundedString(note.meaning, 1000)
      && boundedString(note.literalPitfall, 1000)
      && nullableStringValue(note.regionalUncertainty, 500));
}