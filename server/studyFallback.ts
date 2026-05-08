import fs from "fs";
import path from "path";

type StudyPackChapter = {
  id: number;
  titleId: number;
  chapterTitle: string;
  chapterOrder: number;
  chapterNumber: number | null;
  titleName: string;
  titleOrder: number;
};

type StudyPackArticle = {
  id: number;
  number: number;
  chapterId: number;
  originalText: string;
  simplifiedText: string;
  curiosity: string;
  practicalExample: string;
  keywordsTags: string | null;
  chapterTitle: string;
  titleName: string;
  titleOrder: number;
  chapterOrder: number;
  audiobookUrl: string | null;
  audiobookTitle: string | null;
  textQualityScore?: number;
};

type StudyPackQuiz = {
  id: number;
  chapterId: number;
  articleNumber?: number | null;
  examBoard?: string | null;
  theme?: string | null;
  sourceType?: string | null;
  sourceRef?: string | null;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: string;
  explanation: string | null;
  difficulty: "easy" | "medium" | "hard";
};

type StudyPackFlash = {
  id: number;
  articleId: number;
  front: string;
  back: string;
  category: string | null;
  cardType?: string | null;
  difficulty?: "easy" | "medium" | "hard";
  qualityScore?: number;
};

type StudyPackAmendment = {
  id: number;
  number: number;
  year: number;
  title: string;
  description: string | null;
  articlesAffected: string | null;
};

type StudyPack = {
  chapters: StudyPackChapter[];
  articles: StudyPackArticle[];
  quizQuestions: StudyPackQuiz[];
  flashcards: StudyPackFlash[];
  amendments: StudyPackAmendment[];
};

let cached: StudyPack | null | undefined;
let cachedMtimeMs: number | null = null;

function packPath() {
  return path.join(process.cwd(), "content", "study-pack.json");
}

export function getStudyPack(): StudyPack | null {
  const p = packPath();
  if (!fs.existsSync(p)) {
    cached = null;
    cachedMtimeMs = null;
    return null;
  }
  const stats = fs.statSync(p);
  if (cached !== undefined && cachedMtimeMs === stats.mtimeMs) return cached;
  try {
    const raw = JSON.parse(fs.readFileSync(p, "utf-8")) as StudyPack;
    cached = raw;
    cachedMtimeMs = stats.mtimeMs;
    return raw;
  } catch {
    cached = null;
    cachedMtimeMs = null;
    return null;
  }
}

export function studyFallbackListArticles(opts?: { limit?: number; offset?: number }) {
  const pack = getStudyPack();
  if (!pack?.articles?.length) return [];
  const limit = Math.min(Math.max(opts?.limit ?? 500, 1), 1000);
  const offset = Math.max(opts?.offset ?? 0, 0);
  return pack.articles.slice(offset, offset + limit);
}

export function studyFallbackListChapters() {
  return getStudyPack()?.chapters ?? [];
}

export function studyFallbackQuizQuestions(
  chapterId: number,
  filters?: {
    board?: string;
    theme?: string;
    difficulty?: "easy" | "medium" | "hard";
    articleStart?: number;
    articleEnd?: number;
    limit?: number;
    mode?: "practice" | "simulado";
  }
) {
  const pack = getStudyPack();
  if (!pack?.quizQuestions?.length) return [];
  let rows = pack.quizQuestions.filter((q) => q.chapterId === chapterId);
  if (filters?.board) rows = rows.filter((q) => (q.examBoard || "").toLowerCase().includes(filters.board!.toLowerCase()));
  if (filters?.theme) rows = rows.filter((q) => (q.theme || "").toLowerCase().includes(filters.theme!.toLowerCase()));
  if (filters?.difficulty) rows = rows.filter((q) => q.difficulty === filters.difficulty);
  if (filters?.articleStart != null) rows = rows.filter((q) => (q.articleNumber ?? 0) >= filters.articleStart!);
  if (filters?.articleEnd != null) rows = rows.filter((q) => (q.articleNumber ?? 9999) <= filters.articleEnd!);
  const limit = Math.min(Math.max(filters?.limit ?? (filters?.mode === "simulado" ? 20 : 300), 1), 300);
  if (filters?.mode === "simulado") {
    return [...rows].sort(() => Math.random() - 0.5).slice(0, limit);
  }
  return rows.slice(0, limit);
}

export function studyFallbackQuizFilterOptions(chapterId?: number) {
  const pack = getStudyPack();
  if (!pack?.quizQuestions?.length) return { boards: [], themes: [], difficulties: [] as Array<"easy" | "medium" | "hard"> };
  const rows =
    typeof chapterId === "number" && chapterId > 0
      ? pack.quizQuestions.filter((q) => q.chapterId === chapterId)
      : pack.quizQuestions;
  const boards = Array.from(new Set(rows.map((r) => String(r.examBoard || "").trim()).filter(Boolean))).sort();
  const themes = Array.from(new Set(rows.map((r) => String(r.theme || "").trim()).filter(Boolean))).sort();
  const difficulties = Array.from(
    new Set(rows.map((r) => (r.difficulty || "medium") as "easy" | "medium" | "hard"))
  );
  return { boards, themes, difficulties };
}

export function studyFallbackFlashcards(articleId: number) {
  const pack = getStudyPack();
  if (!pack?.flashcards?.length) return [];
  return pack.flashcards.filter((f) => f.articleId === articleId);
}

export function studyFallbackAmendments() {
  const pack = getStudyPack();
  if (!pack?.amendments?.length) return [];
  return pack.amendments.map((a) => ({
    id: a.id,
    number: a.number,
    year: a.year,
    title: a.title,
    description: a.description ?? undefined,
    articlesAffected: a.articlesAffected ?? undefined,
  }));
}
