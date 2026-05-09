import { and, asc, count, desc, eq, gte, inArray, lte, sql } from "drizzle-orm";
import {
  InsertUser,
  users,
  titles,
  chapters,
  articles,
  quizQuestions,
  flashcards,
  amendments,
  userProgress,
  userQuizResults,
  userAchievements,
  userQuestionAttempts,
  userFlashcardReview,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

/** Import dinâmico: evita carregar o addon nativo `mysql2` no cold start da função serverless (Vercel). */
async function createMysqlDb(connectionUrl: string) {
  const { drizzle } = await import("drizzle-orm/mysql2");
  return drizzle(connectionUrl);
}

let _db: Awaited<ReturnType<typeof createMysqlDb>> | null = null;

function shouldDisableDbOnVercel() {
  // Hardening: evita crashes recorrentes de função no runtime da Vercel ao carregar o driver mysql.
  // Reative explicitamente após estabilizar o ambiente: ENABLE_TRPC_DB=1.
  return process.env.VERCEL === "1" && process.env.ENABLE_TRPC_DB !== "1";
}

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (shouldDisableDbOnVercel()) {
    return null;
  }
  if (!_db && ENV.databaseUrl) {
    try {
      _db = await createMysqlDb(ENV.databaseUrl);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Queries para Títulos
export async function getAllTitles() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(titles).orderBy(titles.order);
}

// Queries para Capítulos
export async function getChaptersByTitleId(titleId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(chapters).where(eq(chapters.titleId, titleId)).orderBy(chapters.order);
}

// Queries para Artigos
export async function getArticlesByChapterId(chapterId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(articles).where(eq(articles.chapterId, chapterId)).orderBy(articles.number);
}

export async function listArticlesWithMeta(opts?: { limit?: number; offset?: number }) {
  const db = await getDb();
  if (!db) return [];

  const limit = Math.min(Math.max(opts?.limit ?? 500, 1), 1000);
  const offset = Math.max(opts?.offset ?? 0, 0);

  return db
    .select({
      id: articles.id,
      number: articles.number,
      chapterId: articles.chapterId,
      originalText: articles.originalText,
      simplifiedText: articles.simplifiedText,
      curiosity: articles.curiosity,
      practicalExample: articles.practicalExample,
      keywordsTags: articles.keywordsTags,
      chapterTitle: chapters.title,
      titleName: titles.title,
      titleOrder: titles.order,
      chapterOrder: chapters.order,
    })
    .from(articles)
    .innerJoin(chapters, eq(articles.chapterId, chapters.id))
    .innerJoin(titles, eq(chapters.titleId, titles.id))
    .orderBy(asc(titles.order), asc(chapters.order), asc(articles.number))
    .limit(limit)
    .offset(offset);
}

export async function listAllChaptersWithTitles() {
  const db = await getDb();
  if (!db) return [];

  return db
    .select({
      id: chapters.id,
      titleId: chapters.titleId,
      chapterTitle: chapters.title,
      chapterOrder: chapters.order,
      chapterNumber: chapters.number,
      titleName: titles.title,
      titleOrder: titles.order,
    })
    .from(chapters)
    .innerJoin(titles, eq(chapters.titleId, titles.id))
    .orderBy(asc(titles.order), asc(chapters.order));
}

export async function getArticleById(articleId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(articles).where(eq(articles.id, articleId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// Queries para Quiz
export async function getQuizQuestionsByChapterId(
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
  const db = await getDb();
  if (!db) return [];
  const normalize = (s: string) =>
    s
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  const whereParts = [eq(quizQuestions.chapterId, chapterId)];
  if (filters?.difficulty) whereParts.push(eq(quizQuestions.difficulty, filters.difficulty));
  if (filters?.articleStart != null) whereParts.push(gte(quizQuestions.articleNumber, filters.articleStart));
  if (filters?.articleEnd != null) whereParts.push(lte(quizQuestions.articleNumber, filters.articleEnd));
  const limit = Math.min(Math.max(filters?.limit ?? (filters?.mode === "simulado" ? 20 : 300), 1), 300);
  const rows = await db
    .select()
    .from(quizQuestions)
    .where(and(...whereParts))
    .orderBy(asc(quizQuestions.id))
    .limit(500);

  const boardSearch = normalize(filters?.board || "");
  const themeSearch = normalize(filters?.theme || "");
  let filtered = rows.filter((q) => {
    const boardOk = !boardSearch || normalize(String(q.examBoard || "")).includes(boardSearch);
    const themeOk = !themeSearch || normalize(String(q.theme || "")).includes(themeSearch);
    return boardOk && themeOk;
  });

  if ((filters?.mode ?? "practice") === "simulado") {
    // embaralha para simulado
    filtered = [...filtered].sort(() => Math.random() - 0.5).slice(0, limit);
  } else {
    filtered = filtered.slice(0, limit);
  }
  return filtered;
}

export async function getQuizFilterOptionsByChapterId(chapterId?: number) {
  const db = await getDb();
  if (!db) return { boards: [], themes: [], difficulties: [] as Array<"easy" | "medium" | "hard"> };
  const rows =
    typeof chapterId === "number" && chapterId > 0
      ? await db
          .select({
            examBoard: quizQuestions.examBoard,
            theme: quizQuestions.theme,
            difficulty: quizQuestions.difficulty,
          })
          .from(quizQuestions)
          .where(eq(quizQuestions.chapterId, chapterId))
      : await db
          .select({
            examBoard: quizQuestions.examBoard,
            theme: quizQuestions.theme,
            difficulty: quizQuestions.difficulty,
          })
          .from(quizQuestions);

  const boards = Array.from(new Set(rows.map((r) => String(r.examBoard || "").trim()).filter(Boolean))).sort();
  const themes = Array.from(new Set(rows.map((r) => String(r.theme || "").trim()).filter(Boolean))).sort();
  const difficulties = Array.from(
    new Set(rows.map((r) => (r.difficulty || "medium") as "easy" | "medium" | "hard"))
  );
  return { boards, themes, difficulties };
}

// Queries para Flashcards
export async function getFlashcardsByArticleId(articleId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(flashcards).where(eq(flashcards.articleId, articleId));
}

export async function getFlashcardsDueForReview(userId: number, limit = 30) {
  const db = await getDb();
  if (!db) return [];
  const now = new Date();
  const rows = await db
    .select({
      id: flashcards.id,
      articleId: flashcards.articleId,
      front: flashcards.front,
      back: flashcards.back,
      category: flashcards.category,
      cardType: flashcards.cardType,
      reviewId: userFlashcardReview.id,
      dueAt: userFlashcardReview.dueAt,
      intervalDays: userFlashcardReview.intervalDays,
      repetitions: userFlashcardReview.repetitions,
      easeFactor: userFlashcardReview.easeFactor,
    })
    .from(flashcards)
    .innerJoin(userFlashcardReview, and(eq(userFlashcardReview.flashcardId, flashcards.id), eq(userFlashcardReview.userId, userId)))
    .where(lte(userFlashcardReview.dueAt, now))
    .orderBy(asc(userFlashcardReview.dueAt))
    .limit(Math.min(Math.max(limit, 1), 100));
  return rows;
}

// Queries para Emendas
export async function getAllAmendments() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(amendments).orderBy(amendments.year);
}

// Queries para Progresso do Usuário
export async function getUserProgress(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(userProgress).where(eq(userProgress.userId, userId));
}

export async function markArticleAsRead(userId: number, articleId: number) {
  const db = await getDb();
  if (!db) return;
  
  const existing = await db
    .select()
    .from(userProgress)
    .where(and(eq(userProgress.userId, userId), eq(userProgress.articleId, articleId)))
    .limit(1);
  
  if (existing.length > 0) {
    await db.update(userProgress)
      .set({ read: 1, readAt: new Date() })
      .where(and(eq(userProgress.userId, userId), eq(userProgress.articleId, articleId)));
  } else {
    await db.insert(userProgress).values({
      userId,
      articleId,
      read: 1,
      readAt: new Date(),
    });
  }
}

// Queries para Quiz Results
export async function saveQuizResult(
  userId: number,
  chapterId: number,
  score: number,
  totalQuestions: number,
  meta?: { correctAnswers?: number; wrongAnswers?: number; avgTimeMs?: number; board?: string; theme?: string }
) {
  const db = await getDb();
  if (!db) return;
  await db.insert(userQuizResults).values({
    userId,
    chapterId,
    score,
    totalQuestions,
    correctAnswers: meta?.correctAnswers ?? score,
    wrongAnswers: meta?.wrongAnswers ?? Math.max(totalQuestions - score, 0),
    avgTimeMs: meta?.avgTimeMs,
    board: meta?.board,
    theme: meta?.theme,
  });
}

export async function getUserQuizResults(userId: number, chapterId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(userQuizResults)
    .where(and(eq(userQuizResults.userId, userId), eq(userQuizResults.chapterId, chapterId)));
}

// Queries para Achievements
export async function awardAchievement(userId: number, achievementType: string, points: number = 0) {
  const db = await getDb();
  if (!db) return;
  await db.insert(userAchievements).values({
    userId,
    achievementType,
    points,
  });
}

export async function getUserAchievements(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(userAchievements).where(eq(userAchievements.userId, userId));
}

export async function saveQuestionAttempts(
  userId: number,
  attempts: Array<{
    questionId: number;
    chapterId: number;
    articleNumber?: number | null;
    examBoard?: string | null;
    theme?: string | null;
    selectedAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
    elapsedMs?: number | null;
  }>
) {
  const db = await getDb();
  if (!db || attempts.length === 0) return;
  await db.insert(userQuestionAttempts).values(
    attempts.map((a) => ({
      userId,
      questionId: a.questionId,
      chapterId: a.chapterId,
      articleNumber: a.articleNumber ?? null,
      examBoard: a.examBoard ?? null,
      theme: a.theme ?? null,
      selectedAnswer: a.selectedAnswer,
      correctAnswer: a.correctAnswer,
      isCorrect: a.isCorrect ? 1 : 0,
      elapsedMs: a.elapsedMs ?? null,
    }))
  );
}

export async function upsertFlashcardReview(
  userId: number,
  flashcardId: number,
  grade: number
) {
  const db = await getDb();
  if (!db) return null;

  const now = new Date();
  const existing = await db
    .select()
    .from(userFlashcardReview)
    .where(and(eq(userFlashcardReview.userId, userId), eq(userFlashcardReview.flashcardId, flashcardId)))
    .limit(1);

  const prev = existing[0];
  const prevEase = (prev?.easeFactor ?? 250) / 100;
  const prevInterval = prev?.intervalDays ?? 0;
  const prevRepetitions = prev?.repetitions ?? 0;

  let nextEase = Math.max(1.3, prevEase + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02)));
  if (grade < 3) nextEase = Math.max(1.3, nextEase - 0.2);
  const repetitions = grade < 3 ? 0 : prevRepetitions + 1;
  const intervalDays =
    grade < 3 ? 1 : repetitions === 1 ? 1 : repetitions === 2 ? 3 : Math.max(4, Math.round(prevInterval * nextEase));
  const dueAt = new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000);

  if (prev) {
    await db
      .update(userFlashcardReview)
      .set({
        easeFactor: Math.round(nextEase * 100),
        intervalDays,
        repetitions,
        lapses: grade < 3 ? (prev.lapses ?? 0) + 1 : prev.lapses,
        lastGrade: grade,
        reviewedAt: now,
        dueAt,
      })
      .where(eq(userFlashcardReview.id, prev.id));
    return { ...prev, easeFactor: Math.round(nextEase * 100), intervalDays, repetitions, lastGrade: grade, dueAt };
  }

  await db.insert(userFlashcardReview).values({
    userId,
    flashcardId,
    easeFactor: Math.round(nextEase * 100),
    intervalDays,
    repetitions,
    lapses: grade < 3 ? 1 : 0,
    lastGrade: grade,
    reviewedAt: now,
    dueAt,
  });
  return { flashcardId, easeFactor: Math.round(nextEase * 100), intervalDays, repetitions, lastGrade: grade, dueAt };
}

export async function getStudyStats(userId: number) {
  const db = await getDb();
  if (!db) {
    return {
      articlesRead: 0,
      totalArticles: 0,
      quizzesCompleted: 0,
      totalPoints: 0,
      averageAccuracy: 0,
      weeklyAccuracy: 0,
      retentionD7: 0,
      dueReviews: 0,
      byBoard: [] as Array<{ board: string; attempts: number; accuracy: number }>,
      weakThemes: [] as Array<{ theme: string; attempts: number; accuracy: number }>,
      achievements: [],
      lastActivity: null as Date | null,
    };
  }

  const [readRows, totalArticlesRows, quizRows, achRows, dueRows, attemptsRows, reviewRows] = await Promise.all([
    db.select({ c: count() }).from(userProgress).where(and(eq(userProgress.userId, userId), eq(userProgress.read, 1))),
    db.select({ c: count() }).from(articles),
    db.select().from(userQuizResults).where(eq(userQuizResults.userId, userId)),
    db.select().from(userAchievements).where(eq(userAchievements.userId, userId)),
    db
      .select({ c: count() })
      .from(userFlashcardReview)
      .where(and(eq(userFlashcardReview.userId, userId), lte(userFlashcardReview.dueAt, new Date()))),
    db.select().from(userQuestionAttempts).where(eq(userQuestionAttempts.userId, userId)),
    db.select({ c: count() }).from(userFlashcardReview).where(eq(userFlashcardReview.userId, userId)),
  ]);

  const articlesRead = Number(readRows[0]?.c ?? 0);
  const totalArticles = Number(totalArticlesRows[0]?.c ?? 0);
  const quizzesCompleted = quizRows.length;
  const totalPoints = achRows.reduce((sum, a) => sum + (a.points ?? 0), 0);
  
  const totalCorrectAnswers = attemptsRows.reduce((s, a) => s + (a.isCorrect ? 1 : 0), 0);
  const avgAcc =
    attemptsRows.length > 0
      ? Math.round((totalCorrectAnswers / attemptsRows.length) * 100)
      : 0;

  const weekCut = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const weekRows = attemptsRows.filter((a) => a.createdAt && new Date(a.createdAt) >= weekCut);
  const weeklyAccuracy =
    weekRows.length > 0 ? Math.round((weekRows.reduce((s, a) => s + (a.isCorrect ? 1 : 0), 0) / weekRows.length) * 100) : 0;

  const olderThan7 = attemptsRows.filter((a) => a.createdAt && new Date(a.createdAt) < weekCut);
  const retentionD7 =
    olderThan7.length > 0
      ? Math.round((olderThan7.reduce((s, a) => s + (a.isCorrect ? 1 : 0), 0) / olderThan7.length) * 100)
      : weeklyAccuracy;

  const boardMap = new Map<string, { attempts: number; correct: number }>();
  const themeMap = new Map<string, { attempts: number; correct: number }>();
  for (const a of attemptsRows) {
    const b = a.examBoard || "geral";
    const t = a.theme || "geral";
    boardMap.set(b, {
      attempts: (boardMap.get(b)?.attempts ?? 0) + 1,
      correct: (boardMap.get(b)?.correct ?? 0) + (a.isCorrect ? 1 : 0),
    });
    themeMap.set(t, {
      attempts: (themeMap.get(t)?.attempts ?? 0) + 1,
      correct: (themeMap.get(t)?.correct ?? 0) + (a.isCorrect ? 1 : 0),
    });
  }

  const byBoard = Array.from(boardMap.entries()).map(([board, v]) => ({
    board,
    attempts: v.attempts,
    accuracy: Math.round((v.correct / Math.max(v.attempts, 1)) * 100),
  }));
  const weakThemes = Array.from(themeMap.entries())
    .map(([theme, v]) => ({
      theme,
      attempts: v.attempts,
      accuracy: Math.round((v.correct / Math.max(v.attempts, 1)) * 100),
    }))
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, 5);

  const allDates = [
    ...attemptsRows.map((a) => a.createdAt).filter(Boolean),
    ...quizRows.map((q) => q.completedAt).filter(Boolean),
    ...achRows.map((a) => a.earnedAt).filter(Boolean),
  ] as Date[];
  const lastActivity = allDates.length > 0 ? allDates.sort((a, b) => +new Date(b) - +new Date(a))[0] : null;

  const totalFlashcardsReviewed = Number(reviewRows[0]?.c ?? 0);

  return {
    articlesRead,
    totalArticles,
    quizzesCompleted,
    totalPoints,
    totalCorrectAnswers,
    totalFlashcardsReviewed,
    averageAccuracy: avgAcc,
    weeklyAccuracy,
    retentionD7,
    dueReviews: Number(dueRows[0]?.c ?? 0),
    byBoard,
    weakThemes,
    achievements: achRows.map((a) => ({
      type: a.achievementType,
      name: a.achievementType,
      points: a.points ?? 0,
      earnedAt: a.earnedAt,
    })),
    lastActivity,
  };
}

const THEMATIC_GROUPS = [
  { key: "principios-fundamentais", label: "Princípios Fundamentais", start: 1, end: 4 },
  { key: "direitos-individuais-coletivos", label: "Direitos Individuais e Coletivos", start: 5, end: 5 },
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

export async function getThematicProgress(userId: number) {
  const db = await getDb();
  if (!db) return [];

  const [allArticles, allQuiz, allFlashcards, readRows, attemptRows] = await Promise.all([
    db.select({ id: articles.id, number: articles.number }).from(articles),
    db.select({ id: quizQuestions.id, chapterId: quizQuestions.chapterId, articleNumber: quizQuestions.articleNumber }).from(quizQuestions),
    db
      .select({ flashcardId: flashcards.id, articleNumber: articles.number })
      .from(flashcards)
      .innerJoin(articles, eq(flashcards.articleId, articles.id)),
    db
      .select({ articleId: userProgress.articleId })
      .from(userProgress)
      .where(and(eq(userProgress.userId, userId), eq(userProgress.read, 1))),
    db
      .select({
        questionId: userQuestionAttempts.questionId,
        articleNumber: userQuestionAttempts.articleNumber,
        chapterId: userQuestionAttempts.chapterId,
        isCorrect: userQuestionAttempts.isCorrect,
      })
      .from(userQuestionAttempts)
      .where(eq(userQuestionAttempts.userId, userId)),
  ]);

  const articleNumberById = new Map(allArticles.map((a) => [a.id, a.number]));
  const readArticleNumbers = new Set(
    readRows
      .map((r) => articleNumberById.get(r.articleId))
      .filter((n): n is number => typeof n === "number")
  );

  return THEMATIC_GROUPS.map((g) => {
    const inRange = (n: number | null | undefined) => typeof n === "number" && n >= g.start && n <= g.end;

    const groupArticles = allArticles.filter((a) => inRange(a.number));
    const totalArticles = groupArticles.length;
    const readArticles = groupArticles.filter((a) => readArticleNumbers.has(a.number)).length;

    const groupQuiz = allQuiz.filter((q) => inRange(q.articleNumber));
    const totalQuiz = groupQuiz.length;
    const quizIds = new Set(groupQuiz.map((q) => q.id));

    const groupFlashcards = allFlashcards.filter((f) => inRange(f.articleNumber));
    const totalFlashcards = groupFlashcards.length;

    const attemptsInGroup = attemptRows.filter((a) => {
      if (inRange(a.articleNumber)) return true;
      return a.articleNumber == null && quizIds.has(a.questionId);
    });
    const solvedQuestionIds = new Set(attemptsInGroup.map((a) => a.questionId));
    const solvedQuiz = solvedQuestionIds.size;
    const correctHits = attemptsInGroup.filter((a) => Boolean(a.isCorrect)).length;
    const accuracy = attemptsInGroup.length ? Math.round((correctHits / attemptsInGroup.length) * 100) : 0;

    const articlePct = totalArticles ? readArticles / totalArticles : 0;
    const quizPct = totalQuiz ? solvedQuiz / totalQuiz : 0;
    const accPct = accuracy / 100;
    const progressPercent = Math.round((articlePct * 0.45 + quizPct * 0.35 + accPct * 0.2) * 100);

    return {
      key: g.key,
      label: g.label,
      start: g.start,
      end: g.end,
      totalArticles,
      readArticles,
      totalQuiz,
      solvedQuiz,
      totalFlashcards,
      accuracy,
      progressPercent: Math.max(0, Math.min(100, progressPercent)),
    };
  });
}
