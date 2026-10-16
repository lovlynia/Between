const COPY = {
  en: {
    conveying: "What it's conveying",
    details: 'Translation details',
    translation: 'Translation',
    settings: 'Your settings',
    context: 'A little more context',
    contextHelper: 'Meaning notes, alternative readings, and uncertainty appear here when useful.',
    meaningEmpty: 'Meaning notes appear here when a translation needs context.',
    privacy: 'Privacy',
    privacyText: 'Text and recent messages are processed by an external AI service. Between does not save conversations.',
    tone: 'Tone',
    literal: 'Literal translation',
    alternatives: 'Other readings',
    uncertainty: 'Uncertainty',
    meaning: 'Meaning note',
    expression: 'Expression',
    pitfall: 'Literal pitfall',
    regional: 'Regional uncertainty',
    technical: 'Technical terms',
    preservation: 'Preservation notes',
    rewrite: 'Optional rewrite',
    conventions: 'Cultural conventions',
    interpretations: 'Plausible interpretations',
    supporting: 'Supporting context',
    missing: 'Still missing',
    confidence: 'Confidence',
    questions: 'Clarifying questions',
  },
  zh: {
    conveying: '它传达的意思', details: '译文细节', translation: '译文', settings: '翻译设置',
    context: '更多语境', contextHelper: '含义说明、其他理解和不确定之处会在适用时显示。',
    meaningEmpty: '需要补充语境时，含义说明会显示在这里。', privacy: '隐私',
    privacyText: '文本和近期消息会由外部 AI 服务处理。Between 不会保存对话。', tone: '语气', literal: '直译',
    alternatives: '其他理解', uncertainty: '不确定之处', meaning: '含义说明',
    expression: '表达', pitfall: '直译可能产生的误解', regional: '地域差异',
    technical: '专业术语', preservation: '保留说明', rewrite: '可选改写',
    conventions: '文化惯例', interpretations: '可能的理解', supporting: '相关上下文',
    missing: '尚缺信息', confidence: '判断把握', questions: '澄清问题',
  },
  es: {
    conveying: 'Lo que transmite', details: 'Detalles de la traducción', translation: 'Traducción', settings: 'Preferencias',
    context: 'Un poco más de contexto', contextHelper: 'Aquí aparecen notas de significado, otras lecturas y dudas cuando son útiles.',
    meaningEmpty: 'Las notas de significado aparecerán aquí cuando el contexto lo requiera.', privacy: 'Privacidad',
    privacyText: 'El texto y los mensajes recientes se procesan mediante un servicio externo de IA. Between no guarda las conversaciones.', tone: 'Tono',
    literal: 'Traducción literal', alternatives: 'Otras interpretaciones', uncertainty: 'Dudas',
    meaning: 'Nota de significado', expression: 'Expresión', pitfall: 'Riesgo de traducción literal',
    regional: 'Variación regional', technical: 'Términos técnicos', preservation: 'Notas de conservación',
    rewrite: 'Reformulación opcional', conventions: 'Convenciones culturales',
    interpretations: 'Interpretaciones posibles', supporting: 'Contexto que la respalda',
    missing: 'Información que falta', confidence: 'Nivel de confianza', questions: 'Preguntas aclaratorias',
  },
  fr: {
    conveying: 'Ce que cela exprime', details: 'Détails de traduction', translation: 'Traduction', settings: 'Préférences',
    context: 'Un peu plus de contexte', contextHelper: 'Les notes de sens, autres lectures et incertitudes utiles apparaissent ici.',
    meaningEmpty: 'Les notes de sens apparaîtront ici lorsque le contexte le nécessite.', privacy: 'Confidentialité',
    privacyText: 'Le texte et les messages récents sont traités par un service d’IA externe. Between ne conserve pas les conversations.', tone: 'Ton',
    literal: 'Traduction littérale', alternatives: 'Autres interprétations', uncertainty: 'Incertitude',
    meaning: 'Note de sens', expression: 'Expression', pitfall: 'Piège du mot à mot',
    regional: 'Variation régionale', technical: 'Termes techniques', preservation: 'Éléments préservés',
    rewrite: 'Reformulation facultative', conventions: 'Conventions culturelles',
    interpretations: 'Interprétations possibles', supporting: 'Contexte pertinent',
    missing: 'Informations manquantes', confidence: 'Degré de confiance', questions: 'Questions de clarification',
  },
  ja: {
    conveying: '伝わる意味', details: '翻訳の補足', translation: '翻訳', settings: '翻訳設定',
    context: 'もう少し詳しく', contextHelper: '意味のメモ、別の解釈、不確かな点を必要に応じて表示します。',
    meaningEmpty: '文脈の補足が必要な場合、ここに意味のメモが表示されます。', privacy: 'プライバシー',
    privacyText: 'テキストと最近のメッセージは外部 AI サービスで処理されます。Between は会話を保存しません。', tone: '語調', literal: '直訳',
    alternatives: '別の解釈', uncertainty: '不確かな点', meaning: '意味のメモ',
    expression: '表現', pitfall: '直訳で生じる誤解', regional: '地域差',
    technical: '専門用語', preservation: '保持した要素', rewrite: '任意の書き換え',
    conventions: '文化的な慣習', interpretations: '考えられる解釈', supporting: '根拠となる文脈',
    missing: '不足している情報', confidence: '確信度', questions: '確認の質問',
  },
  pt: {
    conveying: 'O que transmite', details: 'Detalhes da tradução', translation: 'Tradução', settings: 'Preferências',
    context: 'Um pouco mais de contexto', contextHelper: 'Notas de significado, outras leituras e dúvidas úteis aparecem aqui.',
    meaningEmpty: 'As notas de significado aparecem aqui quando o contexto precisar.', privacy: 'Privacidade',
    privacyText: 'O texto e as mensagens recentes são processados por um serviço externo de IA. A Between não salva conversas.', tone: 'Tom',
    literal: 'Tradução literal', alternatives: 'Outras interpretações', uncertainty: 'Incerteza',
    meaning: 'Nota de significado', expression: 'Expressão', pitfall: 'Risco da tradução literal',
    regional: 'Variação regional', technical: 'Termos técnicos', preservation: 'Notas de preservação',
    rewrite: 'Reescrita opcional', conventions: 'Convenções culturais',
    interpretations: 'Interpretações possíveis', supporting: 'Contexto favorável',
    missing: 'Informações ausentes', confidence: 'Grau de confiança', questions: 'Perguntas de esclarecimento',
  },
};

const TONE_SUMMARIES = {
  en: {
    friendly: 'Warm, natural phrasing without adding intimacy.',
    clear: 'Direct wording that makes the meaning easy to follow.',
    professional: 'Polished, respectful wording that keeps the original meaning.',
    playful: 'Light phrasing without inventing humor or intent.',
  },
  zh: {
    friendly: '表达自然亲切，不额外拉近关系。',
    clear: '表达直接清楚，便于理解原意。',
    professional: '措辞得体专业，同时保留原意。',
    playful: '语气轻松，但不凭空添加幽默或意图。',
  },
  es: {
    friendly: 'Una expresión cálida y natural, sin añadir intimidad.',
    clear: 'Una formulación directa que facilita seguir el sentido.',
    professional: 'Una formulación cuidada y respetuosa que conserva el sentido.',
    playful: 'Un tono ligero, sin inventar humor ni intención.',
  },
  fr: {
    friendly: 'Une formulation chaleureuse et naturelle, sans ajouter de proximité.',
    clear: 'Une formulation directe qui rend le sens facile à suivre.',
    professional: 'Une formulation soignée et respectueuse qui garde le sens initial.',
    playful: 'Un ton léger, sans inventer d’humour ni d’intention.',
  },
  ja: {
    friendly: '親しみやすく自然な表現にしつつ、距離感は加えません。',
    clear: '意味を追いやすい、明快な表現にします。',
    professional: '原意を保ちながら、丁寧で整った表現にします。',
    playful: '軽やかな表現にしつつ、冗談や意図は作りません。',
  },
  pt: {
    friendly: 'Uma formulação calorosa e natural, sem sugerir intimidade.',
    clear: 'Uma formulação direta, fácil de acompanhar.',
    professional: 'Uma formulação cuidadosa e respeitosa que mantém o sentido.',
    playful: 'Um tom leve, sem inventar humor ou intenção.',
  },
};

const TONE_DESCRIPTORS = {
  en: {
    friendly: ['warm', 'casual', 'inviting'], clear: ['clear', 'direct', 'easy to follow'],
    professional: ['polished', 'respectful', 'precise'], playful: ['light', 'lively', 'playful'],
  },
  zh: {
    friendly: ['温和', '自然', '亲切'], clear: ['清晰', '直接', '易懂'],
    professional: ['得体', '尊重', '准确'], playful: ['轻松', '活泼', '俏皮'],
  },
  es: {
    friendly: ['cálido', 'informal', 'acogedor'], clear: ['claro', 'directo', 'fácil de seguir'],
    professional: ['cuidado', 'respetuoso', 'preciso'], playful: ['ligero', 'animado', 'juguetón'],
  },
  fr: {
    friendly: ['chaleureux', 'décontracté', 'accueillant'], clear: ['clair', 'direct', 'facile à suivre'],
    professional: ['soigné', 'respectueux', 'précis'], playful: ['léger', 'vivant', 'espiègle'],
  },
  ja: {
    friendly: ['温かい', '自然体', '親しみやすい'], clear: ['明快', '率直', '分かりやすい'],
    professional: ['丁寧', '敬意がある', '正確'], playful: ['軽やか', '生き生き', '遊び心のある'],
  },
  pt: {
    friendly: ['acolhedor', 'informal', 'convidativo'], clear: ['claro', 'direto', 'fácil de entender'],
    professional: ['bem elaborado', 'respeitoso', 'preciso'], playful: ['leve', 'animado', 'divertido'],
  },
};

export function translationCopy(languageCode) {
  return COPY[languageCode?.split('-')[0]] ?? COPY.en;
}

export function toneSummary(languageCode, tone) {
  return (TONE_SUMMARIES[languageCode?.split('-')[0]] ?? TONE_SUMMARIES.en)[tone];
}

export function toneDescriptors(languageCode, tone) {
  return (TONE_DESCRIPTORS[languageCode?.split('-')[0]] ?? TONE_DESCRIPTORS.en)[tone];
}

const LANGUAGE_TAGS = {
  'zh-CN': 'zh-Hans',
  'zh-TW': 'zh-Hant',
};

export function languageTag(languageCode) {
  return LANGUAGE_TAGS[languageCode] ?? languageCode ?? 'und';
}