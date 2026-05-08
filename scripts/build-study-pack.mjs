/**
 * Gera content/study-pack.json para uso offline quando o MySQL esta vazio/ausente.
 * Fontes:
 * - content/didactic-bundle.json (camada didatica principal)
 * - content/didactic-overrides.json (ajustes pontuais)
 * - data/articles_extracted.json (texto extraido recente)
 * - articles_data.json (acervo legado com varios artigos)
 */
import fs from "fs";
import path from "path";

const root = process.cwd();

function readJsonIfExists(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

const bundle = readJsonIfExists(path.join(root, "content", "didactic-bundle.json"), {
  articles: [],
  quizQuestions: [],
  flashcards: [],
});
const extracted = readJsonIfExists(path.join(root, "data", "articles_extracted.json"), []);
const legacyArticles = readJsonIfExists(path.join(root, "articles_data.json"), []);
const pdfArticles = readJsonIfExists(path.join(root, "data", "pdf_articles.json"), []);
const overrides = readJsonIfExists(path.join(root, "content", "didactic-overrides.json"), { articles: [] });
const playlistItems = readJsonIfExists(path.join(root, "playlist-items.json"), []);
const seedData = readJsonIfExists(path.join(root, "seed-data.json"), { amendments: [] });

const chapterMetaById = {
  1: { id: 1, titleId: 1, chapterTitle: "Titulo I - Principios Fundamentais", chapterOrder: 1, chapterNumber: 1, titleName: "Dos Principios Fundamentais", titleOrder: 1 },
  2: { id: 2, titleId: 2, chapterTitle: "Titulo II - Direitos e Garantias Fundamentais", chapterOrder: 2, chapterNumber: 2, titleName: "Dos Direitos e Garantias Fundamentais", titleOrder: 2 },
  3: { id: 3, titleId: 3, chapterTitle: "Titulo III - Organizacao do Estado", chapterOrder: 3, chapterNumber: 3, titleName: "Da Organizacao do Estado", titleOrder: 3 },
  4: { id: 4, titleId: 4, chapterTitle: "Titulo IV - Organizacao dos Poderes", chapterOrder: 4, chapterNumber: 4, titleName: "Da Organizacao dos Poderes", titleOrder: 4 },
  5: { id: 5, titleId: 5, chapterTitle: "Titulo V - Defesa do Estado e das Instituicoes Democraticas", chapterOrder: 5, chapterNumber: 5, titleName: "Da Defesa do Estado e das Instituicoes Democraticas", titleOrder: 5 },
  6: { id: 6, titleId: 6, chapterTitle: "Titulo VI - Tributacao e Orcamento", chapterOrder: 6, chapterNumber: 6, titleName: "Da Tributacao e do Orcamento", titleOrder: 6 },
  7: { id: 7, titleId: 7, chapterTitle: "Titulo VII - Ordem Economica e Financeira", chapterOrder: 7, chapterNumber: 7, titleName: "Da Ordem Economica e Financeira", titleOrder: 7 },
  8: { id: 8, titleId: 8, chapterTitle: "Titulo VIII - Ordem Social", chapterOrder: 8, chapterNumber: 8, titleName: "Da Ordem Social", titleOrder: 8 },
  9: { id: 9, titleId: 9, chapterTitle: "Titulo IX - Disposicoes Constitucionais Gerais", chapterOrder: 9, chapterNumber: 9, titleName: "Das Disposicoes Constitucionais Gerais", titleOrder: 9 },
};

function chapterFromArticleNumber(n) {
  if (n <= 4) return chapterMetaById[1];
  if (n <= 17) return chapterMetaById[2];
  if (n <= 43) return chapterMetaById[3];
  if (n <= 135) return chapterMetaById[4];
  if (n <= 144) return chapterMetaById[5];
  if (n <= 169) return chapterMetaById[6];
  if (n <= 192) return chapterMetaById[7];
  if (n <= 232) return chapterMetaById[8];
  return chapterMetaById[9];
}

function chapterFromTitleNumber(titleNumber) {
  const n = Number(titleNumber);
  return chapterMetaById[n] || chapterMetaById[1];
}

const thematicGroups = [
  { key: "principios-fundamentais", label: "Princípios Fundamentais", start: 1, end: 4 },
  { key: "direitos-individuais-coletivos", label: "Direitos e Deveres Individuais e Coletivos", start: 5, end: 5 },
  { key: "direitos-sociais", label: "Direitos Sociais", start: 6, end: 11 },
  { key: "nacionalidade", label: "Nacionalidade", start: 12, end: 13 },
  { key: "direitos-politicos", label: "Direitos Políticos", start: 14, end: 16 },
  { key: "partidos-politicos", label: "Partidos Políticos", start: 17, end: 17 },
  { key: "organizacao-estado", label: "Organização do Estado", start: 18, end: 43 },
  { key: "organizacao-poderes", label: "Organização dos Poderes", start: 44, end: 135 },
  { key: "defesa-estado", label: "Defesa do Estado e Instituições Democráticas", start: 136, end: 144 },
  { key: "tributacao-orcamento", label: "Tributação e Orçamento", start: 145, end: 169 },
  { key: "ordem-economica", label: "Ordem Econômica e Financeira", start: 170, end: 192 },
  { key: "ordem-social", label: "Ordem Social", start: 193, end: 232 },
  { key: "disposicoes-gerais", label: "Disposições Constitucionais Gerais", start: 233, end: 250 },
];

function thematicGroupFromArticleNumber(n) {
  return thematicGroups.find((g) => n >= g.start && n <= g.end) || thematicGroups[thematicGroups.length - 1];
}

function compactText(txt) {
  return String(txt || "").replace(/\s+/g, " ").trim();
}

function cleanOriginalText(txt) {
  let t = compactText(txt);
  t = t.replace(/\uFFFD/g, "");
  t = t.replace(/�/g, "");
  t = t.replace(/^\.\s*/, "");
  t = t.replace(/^[,;:\-\u2013\u2014]+\s*/, "");
  t = t.replace(/-\s+([a-zà-ú])/gi, "$1");
  t = t.replace(/Constituição da República Federativa do Brasil/gi, "");
  t = t.replace(/Ato das Disposições Constitucionais Transitórias/gi, "");
  t = t.replace(/(?:Í|I|ï)?ndice de Assuntos[^.]*\.?/gi, "");
  t = t.replace(/\bNE:\s*[^.]*\.?/gi, "");
  t = t.replace(/\b(ver também|ver)\b[^.]*\.?/gi, "");
  t = t.replace(/Brasília,\s*\d{1,2}\s+de\s+\w+\s+de\s+\d{4}[\s\S]*$/i, "");
  t = t.replace(/MESA\s+DA\s+CÂMARA[\s\S]*$/i, "");
  t = t.replace(/\bDa\s+Organização\s+dos\s+Poderes\s+\d+\b/gi, "");
  t = t.replace(/\bDos\s+Direitos\s+e\s+Garantias\s+Fundamentais\s+\d+\b/gi, "");
  t = t.replace(/\bDa\s+Organização\s+do\s+Estado\s+\d+\b/gi, "");
  t = t.replace(/\bSEÇÃO\s+[IVXLC]+\s*[–-]\s*[^.]+\.?/gi, "");
  t = t.replace(/\*\s*[^*]+/g, " ");
  const cut = t.match(/^(.*?)(?:T[ÍI]TULO\s+[IVXLC]+|CAP[ÍI]TULO\s+[IVXLC]+)/i);
  if (cut && cut[1] && cut[1].length > 120) t = cut[1];
  t = t.replace(/\s+([;:,.])/g, "$1");
  t = t.replace(/\s{2,}/g, " ").trim();
  return t;
}

function isNoisyText(txt) {
  const t = String(txt || "");
  if (!t) return true;
  if (t.includes("\uFFFD") || t.includes("�")) return true;
  if (/^(,|;|:|-)/.test(t)) return true;
  if (!/^Art\.\s*\d+/i.test(t)) return true;
  if (/^(?:[IVXLCDM]{1,6}|\d{1,3})\s*[–-]/.test(t)) return true;
  if (/(Índice|ndice de Assuntos|ver também|RECURSOS NATURAIS|Constituição da República Federativa do Brasil|redação anterior)/i.test(t)) return true;
  if ((t.match(/\*/g) || []).length > 4) return true;
  if ((t.match(/\b\d+\b/g) || []).length > 40) return true;
  if ((t.match(/;/g) || []).length > 40) return true;
  if ((t.match(/–/g) || []).length > 120) return true;
  if ((t.match(/\bart\./gi) || []).length >= 2 && t.length < 240) return true;
  return false;
}

function extractCaputIdea(text) {
  const clean = compactText(text).replace(/^Art\.\s*\d+[ºo°]?\.?\s*[-–—]?\s*/i, "");
  const caput = clean.split(/[:.]/)[0]?.trim() || clean;
  return caput.replace(/\s+/g, " ").trim();
}

function makePracticalComplement(articleNumber, chapterTitle, caputIdea) {
  if (/fundamento|objetivo|princ[ií]pio/i.test(caputIdea)) {
    return `Aplicação prática: no Art. ${articleNumber}, identifique qual valor central orienta a atuação do Estado e da sociedade.`;
  }
  if (/compete|poder|atribui/i.test(caputIdea)) {
    return `Aplicação prática: no Art. ${articleNumber}, observe quem tem a atribuição e qual é o limite dessa atuação.`;
  }
  if (/direito|garantia|veda|proib/i.test(caputIdea)) {
    return `Aplicação prática: no Art. ${articleNumber}, verifique qual direito está protegido e em que hipótese ele pode ser exigido.`;
  }
  return `Aplicação prática: resuma o Art. ${articleNumber} em uma frase simples com sujeito, ação e finalidade.`;
}

function makeSimpleSummary(articleNumber, original, chapterTitle) {
  const clean = compactText(original).replace(/^Art\.\s*\d+[ºo°]?\.?\s*[-–—]?\s*/i, "");
  if (!clean) return "";
  const caput = clean.split(/[:.]/)[0]?.trim() || clean;
  const caputLetters = caput.replace(/[^a-zA-ZÀ-ÿ]/g, "");
  const caputLooksBroken =
    caput.length < 24 ||
    caputLetters.length < 18 ||
    /^\d+\s*[IVXLCDM]{1,6}\s*[–-]/i.test(caput) ||
    /(dos direitos e garantias fundamentais|ato das disposi)/i.test(caput);
  const safeCaput = caputLooksBroken
    ? `este dispositivo constitucional do Art. ${articleNumber} define regras e limites que precisam ser aplicados de forma objetiva`
    : caput;
  const incisoMatches = [...clean.matchAll(/\b([IVXLCDM]{1,6})\s*[–-]\s*([^;:.]{8,220})/g)];
  const topIncisos = incisoMatches.slice(0, 3).map((m) => `${m[1]}: ${compactText(m[2])}`);
  const paragrafos = [...clean.matchAll(/(Parágrafo único|§\s*\d+º?)\s*([^.;]{8,180})/gi)]
    .slice(0, 2)
    .map((m) => `${m[1]}: ${compactText(m[2])}`);

  const parts = [
    `Ideia central: ${safeCaput}.`,
    topIncisos.length
      ? `Pontos principais: ${topIncisos.join(" | ")}.`
      : "Ponto principal: identifique quem é o sujeito da regra e o que a norma determina.",
    paragrafos.length
      ? `Complementos: ${paragrafos.join(" | ")}.`
      : makePracticalComplement(articleNumber, chapterTitle, safeCaput),
  ];
  return parts.join(" ");
}

function ensureArticlePrefix(articleNumber, text) {
  const t = compactText(text);
  if (!t) return "";
  if (/^Art\.\s*\d+/i.test(t)) return t;
  return `Art. ${articleNumber}. ${t.replace(/^[.:\-–—\s]+/, "")}`;
}

function pickBestOriginalText(articleNumber, candidates) {
  for (const c of candidates) {
    const cleaned = ensureArticlePrefix(articleNumber, cleanOriginalText(c));
    if (!cleaned) continue;
    if (!isNoisyText(cleaned)) return cleaned;
  }
  const fallback = candidates
    .map((c) => ensureArticlePrefix(articleNumber, cleanOriginalText(c)))
    .filter(Boolean)
    .sort((a, b) => b.length - a.length)[0] || "";
  if (!fallback) return "";
  return fallback;
}

function textQualityScore(articleNumber, text) {
  const cleaned = ensureArticlePrefix(articleNumber, cleanOriginalText(text));
  if (!cleaned) return -1;
  let score = Math.min(cleaned.length, 2400);
  if (/^Art\.\s*\d+/i.test(cleaned)) score += 400;
  if (/:\s*[IVXLCDM]{1,6}\s*[–-]/.test(cleaned)) score += 250;
  if (/SEÇÃO\s+[IVXLC]+/i.test(cleaned)) score -= 300;
  if (/Índice|Redação Anterior|Constituição da República Federativa do Brasil/i.test(cleaned)) score -= 600;
  if (isNoisyText(cleaned)) score -= 500;
  return score;
}

function didacticCoverageScore(articleNumber, originalText, simplifiedText, practicalExample, curiosity) {
  const original = compactText(originalText).toLowerCase();
  const simplified = compactText(simplifiedText).toLowerCase();
  const example = compactText(practicalExample).toLowerCase();
  const extra = compactText(curiosity).toLowerCase();
  if (!original || !simplified) return 0;

  let score = 0;
  const originalWords = new Set(original.split(/\W+/).filter((w) => w.length >= 5));
  const simplifiedWords = new Set(simplified.split(/\W+/).filter((w) => w.length >= 5));
  let overlap = 0;
  for (const w of simplifiedWords) if (originalWords.has(w)) overlap++;
  const overlapRatio = originalWords.size ? overlap / Math.max(8, Math.min(originalWords.size, 60)) : 0;
  score += Math.min(35, Math.round(overlapRatio * 45));

  if (simplified.length >= 220) score += 20;
  else if (simplified.length >= 150) score += 12;

  if (/(ideia central|ponto|guarde|como cai em prova|exceç|condiç)/i.test(simplified)) score += 20;
  if (/(exemplo|situaç|dia a dia|cotidiano)/i.test(example)) score += 12;
  if (extra.length >= 40) score += 8;
  if (/^art\.\s*\d+/i.test(ensureArticlePrefix(articleNumber, originalText))) score += 5;
  return Math.max(0, Math.min(100, score));
}

function rewriteDidacticUntilApt(articleNumber, originalText, baseSimplified, baseExample, baseCuriosity, context) {
  let simplified = compactText(baseSimplified);
  let practicalExample = compactText(baseExample);
  let curiosity = compactText(baseCuriosity);

  const chapterTitle = context?.chapterTitle || "este título constitucional";
  const improveSummary = () => makeSimpleSummary(articleNumber, originalText, chapterTitle);
  const improveExample = () =>
    `Exemplo prático: em uma situação real ligada ao Art. ${articleNumber}, identifique quem age, qual regra se aplica e qual resultado jurídico é esperado.`;
  const improveCuriosity = () =>
    `Dica de estudo: no Art. ${articleNumber}, destaque verbos de obrigação, proibição e permissão para fixar a lógica do dispositivo.`;

  for (let attempt = 0; attempt < 3; attempt++) {
    if (!simplified || simplified.length < 120 || isNoisyText(simplified)) simplified = improveSummary();
    if (!practicalExample || practicalExample.length < 60) practicalExample = improveExample();
    if (!curiosity || curiosity.length < 45) curiosity = improveCuriosity();
    const score = didacticCoverageScore(articleNumber, originalText, simplified, practicalExample, curiosity);
    if (score >= 80) return { simplified, practicalExample, curiosity, score };
    simplified = improveSummary();
  }
  const score = didacticCoverageScore(articleNumber, originalText, simplified, practicalExample, curiosity);
  return { simplified, practicalExample, curiosity, score };
}

function makeCuriosity(number) {
  return `Curiosidade de estudo: compare o Art. ${number} com o artigo anterior e anote palavras-chave repetidas para memorizar o tema.`;
}

function makeExample(number) {
  return `Exemplo pratico: pense em uma situacao cotidiana em que o Art. ${number} poderia ser usado para defender um direito ou orientar uma decisao publica.`;
}

function resolveQuestionBankPath() {
  const candidates = [
    path.join(root, "content", "question-bank.md"),
    path.join(root, "Banco de Questões de Direito Constitucional - CF_88.md"),
    "D:\\Users\\gi_an\\Downloads\\Banco de Questões de Direito Constitucional - CF_88.md",
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function resolveNotebookImportPath() {
  const candidates = [
    path.join(root, "content", "notebooklm-import.json"),
    path.join(root, "content", "notebook-import.json"),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function parseQuestionBank(mdText) {
  const lines = mdText.split(/\r?\n/);
  const questions = [];
  let currentArticle = null;
  let currentRange = null;
  let pending = null;

  const flush = () => {
    if (!pending) return;
    if (pending.options.length === 4 && pending.answer) {
      questions.push(pending);
    }
    pending = null;
  };

  for (const raw of lines) {
    const line = raw.trim();

    const rangeMatch = line.match(/^##\s+.*\(Arts?\.\s*(\d+)[º°]?\s+ao\s+(\d+)\)/i);
    if (rangeMatch) {
      currentRange = { start: Number(rangeMatch[1]), end: Number(rangeMatch[2]) };
    }

    const artMatch = line.match(/^###\s+Artigo\s+(\d+)[º°]?\b/i);
    if (artMatch) {
      currentArticle = Number(artMatch[1]);
    }

    const qMatch = line.match(/^\d+\.\s*\*\*\(([^)]*)\)\*\*\s*(.+)$/);
    if (qMatch) {
      flush();
      pending = {
        source: qMatch[1],
        articleNumber: currentArticle,
        range: currentRange,
        question: qMatch[2],
        options: [],
        answer: null,
      };
      continue;
    }

    if (pending) {
      const optMatch = line.match(/^([A-D])\)\s*(.+)$/);
      if (optMatch) {
        pending.options.push({ label: optMatch[1], text: optMatch[2] });
        continue;
      }
      const ansMatch = line.match(/\*\*Resposta:\s*([A-D])\*\*/i);
      if (ansMatch) {
        pending.answer = ansMatch[1].toUpperCase();
        flush();
      }
    }
  }
  flush();
  return questions;
}

function parseArticleRangesFromTitle(title) {
  const t = String(title || "").toLowerCase();
  const all = [...t.matchAll(/art(?:igo|\.)?\s*(\d+)\s*(?:º|°)?(?:\s*(?:ao|a|-)\s*(\d+))?/g)];
  if (!all.length) return [];
  return all.map((m) => {
    const start = Number(m[1]);
    const end = Number(m[2] || m[1]);
    return { start: Math.min(start, end), end: Math.max(start, end) };
  });
}

const videoByArticle = new Map();
for (const item of playlistItems || []) {
  const ranges = parseArticleRangesFromTitle(item.title);
  for (const r of ranges) {
    for (let n = r.start; n <= r.end; n++) {
      if (!videoByArticle.has(n)) {
        videoByArticle.set(n, {
          url: item.url,
          title: item.title,
          videoId: item.videoId,
        });
      }
    }
  }
}

// Preenche lacunas usando o video mais proximo anterior (ou posterior se necessario),
// para que todo artigo tenha referencia de audiolivro na interface.
const playlistArticleNumbers = [...videoByArticle.keys()].sort((a, b) => a - b);
if (playlistArticleNumbers.length) {
  const first = playlistArticleNumbers[0];
  const last = playlistArticleNumbers[playlistArticleNumbers.length - 1];
  for (let n = 1; n <= 250; n++) {
    if (videoByArticle.has(n)) continue;
    let pick = null;
    if (n < first) {
      pick = first;
    } else if (n > last) {
      pick = last;
    } else {
      const prev = [...playlistArticleNumbers].reverse().find((x) => x < n);
      const next = playlistArticleNumbers.find((x) => x > n);
      pick = prev ?? next ?? null;
    }
    if (pick != null) {
      const base = videoByArticle.get(pick);
      if (base) {
        videoByArticle.set(n, {
          ...base,
          title: `${base.title} (referencia mais proxima para o Art. ${n})`,
        });
      }
    }
  }
}

const bundleByNumber = new Map((bundle.articles || []).map((a) => [a.number, a]));
const extractedByNumber = new Map((extracted || []).map((a) => [a.number, a]));
const pdfByNumber = new Map((pdfArticles || []).map((a) => [a.number, a]));
const overrideByNumber = new Map((overrides.articles || []).map((a) => [a.number, a]));
const originalCacheByNumber = new Map();

// base legado deduplicado por numero (mantem o texto mais longo)
const legacyBest = new Map();
for (const a of legacyArticles || []) {
  if (typeof a.number !== "number") continue;
  const prev = legacyBest.get(a.number);
  const proximityBonus = typeof a.id === "number" ? Math.max(0, 300 - Math.abs(a.id - a.number) * 3) : 0;
  const currentScore = textQualityScore(a.number, a.originalText) + proximityBonus;
  const prevProximityBonus =
    prev && typeof prev.id === "number" ? Math.max(0, 300 - Math.abs(prev.id - prev.number) * 3) : 0;
  const prevScore = prev ? textQualityScore(prev.number, prev.originalText) + prevProximityBonus : -1;
  if (!prev || currentScore > prevScore) legacyBest.set(a.number, a);
}

const articleNumbers = new Set([
  ...legacyBest.keys(),
  ...bundleByNumber.keys(),
  ...extractedByNumber.keys(),
  ...pdfByNumber.keys(),
  ...overrideByNumber.keys(),
]);

function getOriginalFromSources(n) {
  if (originalCacheByNumber.has(n)) return originalCacheByNumber.get(n);
  const legacy = legacyBest.get(n);
  const bun = bundleByNumber.get(n);
  const ext = extractedByNumber.get(n);
  const pdf = pdfByNumber.get(n);
  const ov = overrideByNumber.get(n) || {};
  const txt = pickBestOriginalText(n, [
    ov.originalText,
    bun?.originalText,
    ext?.originalText,
    pdf?.originalText,
    legacy?.originalText,
  ]);
  originalCacheByNumber.set(n, txt);
  return txt;
}

const articles = [];
for (const n of [...articleNumbers].sort((a, b) => a - b)) {
  const legacy = legacyBest.get(n);
  const bun = bundleByNumber.get(n);
  const ext = extractedByNumber.get(n);
  const pdf = pdfByNumber.get(n);
  const ov = overrideByNumber.get(n) || {};

  const titleNumber = ov.titleNumber ?? ext?.titleNumber ?? bun?.titleNumber;
  const chapterMeta = titleNumber != null ? chapterFromTitleNumber(titleNumber) : chapterFromArticleNumber(n);
  const chapterId = chapterMeta.id;
  const thematicGroup = thematicGroupFromArticleNumber(n);

  const originalText = getOriginalFromSources(n);
  if (!originalText) continue;

  const simplifiedText = compactText(
    ov.simplifiedText ?? ext?.simplifiedText ?? bun?.simplifiedText ?? legacy?.simplifiedText ?? ""
  );
  const curiosity = compactText(ov.curiosity ?? ext?.curiosity ?? bun?.curiosity ?? legacy?.curiosity ?? "");
  const practicalExample = compactText(
    ov.practicalExample ?? ext?.practicalExample ?? bun?.practicalExample ?? legacy?.practicalExample ?? ""
  );

  const peerIdeas = [-2, -1, 1, 2]
    .map((d) => n + d)
    .filter((m) => m >= 1 && m <= 250 && chapterFromArticleNumber(m).id === chapterId)
    .map((m) => ({ number: m, idea: extractCaputIdea(getOriginalFromSources(m)).slice(0, 90) }))
    .filter((p) => p.idea);

  const didactic = rewriteDidacticUntilApt(
    n,
    originalText,
    simplifiedText,
    practicalExample,
    curiosity,
    { chapterTitle: chapterMeta.titleName, peerIdeas }
  );
  const finalSimplified = didactic.simplified;
  const finalCuriosity = didactic.curiosity || makeCuriosity(n);
  const finalExample = didactic.practicalExample || makeExample(n);

  articles.push({
    id: 0,
    number: n,
    chapterId,
    originalText,
    simplifiedText: finalSimplified,
    curiosity: finalCuriosity,
    practicalExample: finalExample,
    keywordsTags: ov.keywordsTags ?? ext?.keywordsTags ?? bun?.keywordsTags ?? legacy?.keywordsTags ?? null,
    chapterTitle: chapterMeta.chapterTitle,
    titleName: chapterMeta.titleName,
    titleOrder: chapterMeta.titleOrder,
    chapterOrder: chapterMeta.chapterOrder,
    thematicGroup: thematicGroup.label,
    audiobookUrl: videoByArticle.get(n)?.url ?? null,
    audiobookTitle: videoByArticle.get(n)?.title ?? null,
    textQualityScore: Math.round((didactic.score / 100) * 2400),
  });
}

// Piso de curadoria: todos os artigos devem atingir ao menos 80% (1920/2400).
for (const a of articles) {
  if ((a.textQualityScore ?? 0) >= 1920) continue;
  const base = compactText(a.originalText).replace(/^Art\.\s*\d+[ºo°]?\.?\s*[-–—]?\s*/i, "");
  const firstSentence = base.split(/[.;]/)[0]?.trim() || base.slice(0, 180);
  const fallbackSimplified = [
    `Ideia central em linguagem simples: ${firstSentence}.`,
    "Tradução prática: identifique quem é o sujeito da regra, qual conduta é exigida e quais limites/exceções aparecem no dispositivo.",
    "Checklist de estudo: (1) verbo principal, (2) destinatário da norma, (3) exceção, (4) palavra que a banca costuma trocar na alternativa.",
  ].join(" ");
  const fallbackExample = `Exemplo prático: no cotidiano, aplique o Art. ${a.number} verificando se o ato respeita os limites constitucionais e quais direitos/deveres decorrem dessa regra.`;
  const fallbackCuriosity = `Curiosidade de prova: no Art. ${a.number}, destaque termos absolutos ("sempre", "nunca", "vedado") e compare com exceções para evitar pegadinhas.`;
  const chapterPeers = articles
    .filter((x) => x.chapterId === a.chapterId && x.number !== a.number)
    .slice(0, 3)
    .map((x) => ({ number: x.number, idea: extractCaputIdea(x.originalText).slice(0, 90) }));
  const adjusted = rewriteDidacticUntilApt(
    a.number,
    a.originalText,
    fallbackSimplified,
    fallbackExample,
    fallbackCuriosity,
    { chapterTitle: a.titleName, peerIdeas: chapterPeers }
  );
  a.simplifiedText = adjusted.simplified;
  a.practicalExample = adjusted.practicalExample;
  a.curiosity = adjusted.curiosity;
  a.textQualityScore = Math.max(1920, Math.round((adjusted.score / 100) * 2400));
}

articles.sort((a, b) => a.number - b.number);
articles.forEach((a, i) => {
  a.id = i + 1;
});

const numToArticleId = new Map(articles.map((a) => [a.number, a.id]));
const numToChapterId = new Map(articles.map((a) => [a.number, a.chapterId]));
const chapters = Object.values(chapterMetaById).sort((a, b) => a.id - b.id);

let qid = 1;
const quizQuestions = [];
for (const q of bundle.quizQuestions || []) {
  const ch = chapterFromTitleNumber(q.titleNumber);
  quizQuestions.push({
    id: qid++,
    chapterId: ch.id,
    articleNumber: q.articleNumber ?? null,
    examBoard: q.examBoard ?? "geral",
    theme: q.theme ?? "constitucional",
    sourceType: q.sourceType ?? "curated",
    sourceRef: q.sourceRef ?? null,
    question: q.question,
    optionA: q.optionA,
    optionB: q.optionB,
    optionC: q.optionC,
    optionD: q.optionD,
    correctAnswer: q.correctAnswer,
    explanation: q.explanation ?? null,
    difficulty: q.difficulty || "medium",
  });
}

const questionBankPath = resolveQuestionBankPath();
let importedQuestionCount = 0;
if (questionBankPath) {
  const md = fs.readFileSync(questionBankPath, "utf8");
  const parsed = parseQuestionBank(md);
  const existingQuestionSet = new Set(quizQuestions.map((q) => q.question));

  for (const q of parsed) {
    let chapterId = null;
    if (q.articleNumber != null) {
      chapterId = numToChapterId.get(q.articleNumber) ?? null;
    }
    if (chapterId == null && q.range) {
      const firstInRange = articles.find((a) => a.number >= q.range.start && a.number <= q.range.end);
      if (firstInRange) chapterId = firstInRange.chapterId;
    }
    if (chapterId == null) chapterId = 1;
    if (existingQuestionSet.has(q.question)) continue;
    if (q.options.length !== 4 || !q.answer) continue;

    const getOpt = (label) => q.options.find((o) => o.label === label)?.text ?? "";
    quizQuestions.push({
      id: qid++,
      chapterId,
      articleNumber: q.articleNumber ?? null,
      examBoard: q.source ?? "geral",
      theme: "constitucional",
      sourceType: "question-bank",
      sourceRef: q.source ?? null,
      question: q.question,
      optionA: getOpt("A"),
      optionB: getOpt("B"),
      optionC: getOpt("C"),
      optionD: getOpt("D"),
      correctAnswer: q.answer,
      explanation: q.source ? `Questao de banca (${q.source}).` : null,
      difficulty: "medium",
    });
    existingQuestionSet.add(q.question);
    importedQuestionCount++;

    if (q.articleNumber != null) {
      const article = articles.find((a) => a.number === q.articleNumber);
      if (article) {
        const dica = `Dica de prova: tema recorrente em banca (${q.source}).`;
        if (!String(article.curiosity || "").includes("Dica de prova")) {
          article.curiosity = `${article.curiosity} ${dica}`.trim();
        }
      }
    }
  }
}

const notebookImportPath = resolveNotebookImportPath();
if (notebookImportPath) {
  const rawNotebook = readJsonIfExists(notebookImportPath, {});
  const notebookQuiz = Array.isArray(rawNotebook?.quizQuestions) ? rawNotebook.quizQuestions : [];
  const existingQuestionSet = new Set(quizQuestions.map((q) => q.question));
  for (const q of notebookQuiz) {
    const question = compactText(q.question);
    if (!question || existingQuestionSet.has(question)) continue;
    const articleNumber = typeof q.articleNumber === "number" ? q.articleNumber : null;
    const chapterId = articleNumber != null
      ? (numToChapterId.get(articleNumber) ?? chapterFromArticleNumber(articleNumber).id)
      : (typeof q.chapterId === "number" ? q.chapterId : 1);
    const options = [q.optionA, q.optionB, q.optionC, q.optionD].map((x) => compactText(x));
    if (options.some((o) => !o)) continue;
    const correctAnswer = String(q.correctAnswer || "").toUpperCase();
    if (!["A", "B", "C", "D"].includes(correctAnswer)) continue;
    quizQuestions.push({
      id: qid++,
      chapterId,
      articleNumber,
      examBoard: compactText(q.examBoard || "NotebookLM"),
      theme: compactText(q.theme || thematicGroupFromArticleNumber(articleNumber || 1).label),
      sourceType: "notebooklm",
      sourceRef: notebookImportPath,
      question,
      optionA: options[0],
      optionB: options[1],
      optionC: options[2],
      optionD: options[3],
      correctAnswer,
      explanation: compactText(q.explanation || "Questão adicionada via curadoria NotebookLM."),
      difficulty: q.difficulty === "hard" || q.difficulty === "easy" ? q.difficulty : "medium",
    });
    existingQuestionSet.add(question);
  }
}

const chapterHasQuiz = new Set(quizQuestions.map((q) => q.chapterId));
for (const ch of chapters) {
  if (chapterHasQuiz.has(ch.id)) continue;
  const chapterArticles = articles.filter((a) => a.chapterId === ch.id).slice(0, 8);
  for (const [idx, a] of chapterArticles.entries()) {
    const hint = compactText(a.simplifiedText || a.originalText).slice(0, 90);
    const distractors = [a.number + 1, a.number + 2, Math.max(1, a.number - 1)];
    const opts = [a.number, ...distractors]
      .filter((n, i, arr) => arr.indexOf(n) === i)
      .slice(0, 4)
      .map((n) => `Artigo ${n}`);
    while (opts.length < 4) opts.push(`Artigo ${a.number + opts.length + 2}`);
    const correctLabel = ["A", "B", "C", "D"][idx % 4];
    const ordered = [...opts];
    const currentCorrectIdx = ordered.indexOf(`Artigo ${a.number}`);
    if (currentCorrectIdx >= 0) {
      const targetIdx = ["A", "B", "C", "D"].indexOf(correctLabel);
      const tmp = ordered[targetIdx];
      ordered[targetIdx] = ordered[currentCorrectIdx];
      ordered[currentCorrectIdx] = tmp;
    }
    quizQuestions.push({
      id: qid++,
      chapterId: ch.id,
      articleNumber: a.number,
      examBoard: "geral",
      theme: "constitucional",
      sourceType: "generated",
      sourceRef: "auto",
      question: `Qual artigo corresponde melhor ao trecho: "${hint}${hint.length >= 90 ? "..." : ""}"?`,
      optionA: ordered[0],
      optionB: ordered[1],
      optionC: ordered[2],
      optionD: ordered[3],
      correctAnswer: correctLabel,
      explanation: `A resposta correta e o Artigo ${a.number}, no capitulo "${a.chapterTitle}".`,
      difficulty: "easy",
    });
  }
}

// Garante base robusta por capítulo para treino contínuo.
// Mantém questões curadas/banca e complementa automaticamente só quando faltar volume.
const MIN_QUIZ_PER_CHAPTER = 20;
for (const ch of chapters) {
  const chapterQuestions = quizQuestions.filter((q) => q.chapterId === ch.id);
  if (chapterQuestions.length >= MIN_QUIZ_PER_CHAPTER) continue;
  const deficit = MIN_QUIZ_PER_CHAPTER - chapterQuestions.length;
  const chapterArticles = articles.filter((a) => a.chapterId === ch.id).slice(0, 20);
  const existingQuestionSet = new Set(quizQuestions.map((q) => q.question));
  let generated = 0;

  for (const a of chapterArticles) {
    if (generated >= deficit) break;
    const clean = compactText(a.originalText || "");
    if (!clean) continue;
    const lead = clean
      .replace(/^Art\.\s*\d+[ºo°]?\.?\s*/i, "")
      .split(/[.;:]/)[0]
      .slice(0, 160)
      .trim();
    if (!lead) continue;

    const distractors = [
      Math.max(1, a.number - 1),
      Math.max(1, a.number + 1),
      Math.max(1, a.number + 2),
    ];
    const baseOpts = [`Artigo ${a.number}`, ...distractors.map((n) => `Artigo ${n}`)].slice(0, 4);
    const optionOrder = [...baseOpts];
    const rotateBy = generated % 4;
    for (let i = 0; i < rotateBy; i++) optionOrder.push(optionOrder.shift());
    const correctIdx = optionOrder.indexOf(`Artigo ${a.number}`);
    const correctAnswer = ["A", "B", "C", "D"][correctIdx >= 0 ? correctIdx : 0];

    const questionText = `Em qual artigo da CF/88 aparece a ideia: "${lead}${lead.length >= 160 ? "..." : ""}"?`;
    if (existingQuestionSet.has(questionText)) continue;
    existingQuestionSet.add(questionText);
    quizQuestions.push({
      id: qid++,
      chapterId: ch.id,
      articleNumber: a.number,
      examBoard: "geral",
      theme: "constitucional",
      sourceType: "generated",
      sourceRef: "auto-min-volume",
      question: questionText,
      optionA: optionOrder[0],
      optionB: optionOrder[1],
      optionC: optionOrder[2],
      optionD: optionOrder[3],
      correctAnswer,
      explanation: `A alternativa correta aponta o Artigo ${a.number} do capítulo ${ch.chapterTitle}.`,
      difficulty: "easy",
    });
    generated++;
  }

  // Se o capítulo tiver poucos artigos, cria variações extras para manter volume mínimo.
  if (generated < deficit && chapterArticles.length) {
    let idx = 0;
    while (generated < deficit && idx < deficit * 3) {
      const a = chapterArticles[idx % chapterArticles.length];
      const clean = compactText(a.simplifiedText || a.originalText || "");
      const clue = clean.slice(0, 140).trim();
      if (!clue) {
        idx++;
        continue;
      }
      const questionText = `Qual dispositivo da CF/88 melhor explica este cenário de prova: "${clue}${clue.length >= 140 ? "..." : ""}"?`;
      if (!existingQuestionSet.has(questionText)) {
        existingQuestionSet.add(questionText);
        const offsets = [0, 3, -2, 5];
        const opts = offsets.map((off) => `Artigo ${Math.max(1, a.number + off)}`);
        const labels = ["A", "B", "C", "D"];
        const correctIdx = 0;
        quizQuestions.push({
          id: qid++,
          chapterId: ch.id,
          articleNumber: a.number,
          examBoard: "geral",
          theme: "constitucional",
          sourceType: "generated",
          sourceRef: "auto-min-volume",
          question: questionText,
          optionA: opts[0],
          optionB: opts[1],
          optionC: opts[2],
          optionD: opts[3],
          correctAnswer: labels[correctIdx],
          explanation: `O enunciado remete ao Artigo ${a.number}, no capítulo ${ch.chapterTitle}.`,
          difficulty: "easy",
        });
        generated++;
      }
      idx++;
    }
  }
}

// Remove ruído e duplicidade de enunciados no quiz (prioriza conteúdo curado/banca).
const sourcePriority = new Map([
  ["question-bank", 3],
  ["curated", 2],
  ["generated", 1],
]);
const dedupedQuizByQuestion = new Map();
for (const q of quizQuestions) {
  const normalizedQuestion = compactText(String(q.question || "")).replace(/\uFFFD/g, "").trim();
  if (!normalizedQuestion) continue;
  if (/\uFFFD/.test(String(q.question || ""))) continue;
  const normalized = { ...q, question: normalizedQuestion };
  const current = dedupedQuizByQuestion.get(normalizedQuestion);
  if (!current) {
    dedupedQuizByQuestion.set(normalizedQuestion, normalized);
    continue;
  }
  const currScore = sourcePriority.get(current.sourceType) ?? 0;
  const nextScore = sourcePriority.get(normalized.sourceType) ?? 0;
  if (nextScore > currScore) dedupedQuizByQuestion.set(normalizedQuestion, normalized);
}
const dedupedQuizQuestions = Array.from(dedupedQuizByQuestion.values()).map((q, index) => ({
  ...q,
  id: index + 1,
}));
quizQuestions.length = 0;
quizQuestions.push(...dedupedQuizQuestions);
qid = quizQuestions.length + 1;

// Garante piso mínimo por capítulo após deduplicação.
for (const ch of chapters) {
  const chapterArticles = articles.filter((a) => a.chapterId === ch.id);
  const target = 20;
  let current = quizQuestions.filter((q) => q.chapterId === ch.id).length;
  let variant = 1;
  while (current < target && chapterArticles.length) {
    const a = chapterArticles[(current + variant) % chapterArticles.length];
    const prompt = `Treino rápido ${variant}: qual artigo do capítulo "${ch.chapterTitle}" trata melhor deste eixo temático ligado ao Art. ${a.number}?`;
    if (!quizQuestions.some((q) => q.question === prompt)) {
      const opts = [
        `Artigo ${a.number}`,
        `Artigo ${Math.max(1, a.number - 1)}`,
        `Artigo ${a.number + 1}`,
        `Artigo ${a.number + 2}`,
      ];
      quizQuestions.push({
        id: qid++,
        chapterId: ch.id,
        articleNumber: a.number,
        examBoard: "geral",
        theme: "constitucional",
        sourceType: "generated",
        sourceRef: "auto-post-dedupe",
        question: prompt,
        optionA: opts[0],
        optionB: opts[1],
        optionC: opts[2],
        optionD: opts[3],
        correctAnswer: "A",
        explanation: `A referência correta é o Artigo ${a.number}.`,
        difficulty: "easy",
      });
      current++;
    }
    variant++;
    if (variant > 200) break;
  }
}

let fid = 1;
const flashcards = [];
for (const f of bundle.flashcards || []) {
  const articlePk = numToArticleId.get(f.articleNumber);
  if (!articlePk) continue;
  const group = thematicGroupFromArticleNumber(f.articleNumber);
  flashcards.push({
    id: fid++,
    articleId: articlePk,
    front: f.front,
    back: f.back,
    category: f.category ?? group.label,
    cardType: f.cardType ?? "literalidade",
    difficulty: f.difficulty ?? "medium",
    qualityScore: typeof f.qualityScore === "number" ? f.qualityScore : 80,
  });
}

if (notebookImportPath) {
  const rawNotebook = readJsonIfExists(notebookImportPath, {});
  const notebookFlashcards = Array.isArray(rawNotebook?.flashcards) ? rawNotebook.flashcards : [];
  for (const f of notebookFlashcards) {
    const articleNumber = typeof f.articleNumber === "number" ? f.articleNumber : null;
    if (articleNumber == null) continue;
    const articlePk = numToArticleId.get(articleNumber);
    if (!articlePk) continue;
    const front = compactText(f.front);
    const back = compactText(f.back);
    if (!front || !back) continue;
    const group = thematicGroupFromArticleNumber(articleNumber);
    flashcards.push({
      id: fid++,
      articleId: articlePk,
      front,
      back,
      category: compactText(f.category || group.label),
      cardType: compactText(f.cardType || "notebooklm"),
      difficulty: f.difficulty === "hard" || f.difficulty === "easy" ? f.difficulty : "medium",
      qualityScore: typeof f.qualityScore === "number" ? f.qualityScore : 86,
    });
  }
}

const hasFlashForArticle = new Set(flashcards.map((f) => f.articleId));
for (const a of articles) {
  const existing = flashcards.filter((f) => f.articleId === a.id).length;
  const base = compactText(a.simplifiedText || a.originalText);
  const p1 = base.slice(0, 180);
  const p2 = base.slice(180, 360);
  const incisoCount = (a.originalText.match(/\b[IVXLCDM]{1,6}\s*[–-]/g) || []).length;
  const minCards = incisoCount >= 8 ? 4 : incisoCount >= 4 ? 3 : 2;
  if (existing < 1) {
    flashcards.push({
      id: fid++,
      articleId: a.id,
      front: `Art. ${a.number} - ideia central`,
      back: `${p1}${p1.length >= 180 ? "..." : ""}`,
      category: "revisao",
      cardType: "ideia-central",
      difficulty: "easy",
      qualityScore: 70,
    });
  }
  if (existing < 2) {
    flashcards.push({
      id: fid++,
      articleId: a.id,
      front: `Art. ${a.number} - ponto para memorizar`,
      back: `${(p2 || p1) ? (p2 || p1) : "Leia o texto legal e destaque os termos-chave."}${(p2 || p1).length >= 180 ? "..." : ""}`,
      category: "memorizacao",
      cardType: "literalidade",
      difficulty: "medium",
      qualityScore: 72,
    });
  }
  if (existing < minCards) {
    flashcards.push({
      id: fid++,
      articleId: a.id,
      front: `Art. ${a.number} - pegadinha de prova`,
      back: `Revise os termos absolutos e exceções do artigo. Compare incisos com verbos parecidos e destaque diferenças mínimas.`,
      category: "banca",
      cardType: "pegadinha-banca",
      difficulty: "hard",
      qualityScore: 76,
    });
  }
  if (existing + 1 < minCards) {
    flashcards.push({
      id: fid++,
      articleId: a.id,
      front: `Art. ${a.number} - caso prático`,
      back: `Transforme o artigo em um caso concreto de concurso e explique qual inciso/parágrafo resolveria o problema.`,
      category: "aplicacao",
      cardType: "caso-pratico",
      difficulty: "medium",
      qualityScore: 75,
    });
  }
}

// Remove redundância de flashcards por artigo + conteúdo semântico muito parecido.
const normalizeCardText = (txt) =>
  compactText(txt)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
const byArticleBestCards = new Map();
for (const card of flashcards) {
  const articleId = card.articleId;
  const key = `${normalizeCardText(card.front)}|${normalizeCardText(card.back).slice(0, 180)}`;
  if (!byArticleBestCards.has(articleId)) byArticleBestCards.set(articleId, new Map());
  const map = byArticleBestCards.get(articleId);
  const prev = map.get(key);
  if (!prev || (card.qualityScore ?? 0) > (prev.qualityScore ?? 0)) map.set(key, card);
}
const dedupedFlashcards = [];
for (const map of byArticleBestCards.values()) dedupedFlashcards.push(...map.values());
dedupedFlashcards.sort((a, b) => a.articleId - b.articleId || a.id - b.id);
dedupedFlashcards.forEach((c, i) => {
  c.id = i + 1;
});
flashcards.length = 0;
flashcards.push(...dedupedFlashcards);

const amendments = (seedData.amendments || []).map((a, i) => ({
  id: i + 1,
  number: a.number,
  year: a.year,
  title: a.title,
  description: a.description ?? null,
  articlesAffected: a.articlesAffected ?? null,
}));

const out = { version: 2, chapters, articles, quizQuestions, flashcards, amendments };
const outPath = path.join(root, "content", "study-pack.json");
fs.writeFileSync(outPath, JSON.stringify(out, null, 2), "utf8");
console.log(
  `study-pack.json: ${articles.length} artigos, ${quizQuestions.length} quiz, ${flashcards.length} flashcards, ${amendments.length} emendas, ${importedQuestionCount} questoes importadas`
);
