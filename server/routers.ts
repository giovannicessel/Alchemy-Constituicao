import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import {
  getAllTitles,
  getChaptersByTitleId,
  getArticlesByChapterId,
  getArticleById,
  listArticlesWithMeta,
  listAllChaptersWithTitles,
  getQuizQuestionsByChapterId,
  getQuizFilterOptionsByChapterId,
  saveQuizResult,
  saveQuestionAttempts,
  getFlashcardsByArticleId,
  getFlashcardsDueForReview,
  upsertFlashcardReview,
  getAllAmendments,
  getUserProgress,
  getStudyStats,
  getThematicProgress,
  markArticleAsRead,
  getUserAchievements,
  awardAchievement,
  getUserQuizResults,
} from "./db";
import {
  studyFallbackListArticles,
  studyFallbackListChapters,
  studyFallbackQuizQuestions,
  studyFallbackQuizFilterOptions,
  studyFallbackFlashcards,
  studyFallbackAmendments,
} from "./studyFallback";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  constitution: router({
    // Títulos da Constituição
    getAllTitles: publicProcedure.query(async () => {
      return getAllTitles();
    }),

    // Capítulos
    getChaptersByTitle: publicProcedure
      .input((val: unknown) => {
        if (typeof val !== "number") throw new Error("Invalid input");
        return val;
      })
      .query(async (opts) => {
        return getChaptersByTitleId(opts.input);
      }),

    // Artigos
    getArticlesByChapter: publicProcedure
      .input((val: unknown) => {
        if (typeof val !== "number") throw new Error("Invalid input");
        return val;
      })
      .query(async (opts) => {
        return getArticlesByChapterId(opts.input);
      }),

    getArticleById: publicProcedure
      .input((val: unknown) => {
        if (typeof val !== "number") throw new Error("Invalid input");
        return val;
      })
      .query(async (opts) => {
        return getArticleById(opts.input);
      }),

    listArticles: publicProcedure
      .input((val: unknown) => {
        if (val == null || typeof val !== "object") {
          return { limit: 500, offset: 0 };
        }
        const o = val as Record<string, unknown>;
        return {
          limit: typeof o.limit === "number" ? o.limit : 500,
          offset: typeof o.offset === "number" ? o.offset : 0,
        };
      })
      .query(async ({ input }) => {
        if (process.env.STUDY_PACK_ONLY === "true") {
          return studyFallbackListArticles(input);
        }
        const rows = await listArticlesWithMeta(input);
        if (rows.length > 0) return rows;
        return studyFallbackListArticles(input);
      }),

    listChapters: publicProcedure.query(async () => {
      if (process.env.STUDY_PACK_ONLY === "true") {
        return studyFallbackListChapters();
      }
      const rows = await listAllChaptersWithTitles();
      if (rows.length > 0) return rows;
      return studyFallbackListChapters();
    }),

    // Quiz
    getQuizQuestions: publicProcedure
      .input((val: unknown) => {
        if (typeof val === "number") return { chapterId: val };
        if (typeof val !== "object" || val === null) throw new Error("Invalid input");
        const v = val as Record<string, unknown>;
        if (typeof v.chapterId !== "number") throw new Error("Invalid input");
        return {
          chapterId: v.chapterId,
          board: typeof v.board === "string" ? v.board : undefined,
          theme: typeof v.theme === "string" ? v.theme : undefined,
          difficulty: (
            v.difficulty === "easy" || v.difficulty === "medium" || v.difficulty === "hard"
              ? v.difficulty
              : undefined
          ) as "easy" | "medium" | "hard" | undefined,
          articleStart: typeof v.articleStart === "number" ? v.articleStart : undefined,
          articleEnd: typeof v.articleEnd === "number" ? v.articleEnd : undefined,
          mode: (v.mode === "simulado" ? "simulado" : "practice") as "simulado" | "practice",
          limit: typeof v.limit === "number" ? v.limit : undefined,
        };
      })
      .query(async ({ input }) => {
        const filters = {
          board: input.board,
          theme: input.theme,
          difficulty: input.difficulty,
          articleStart: input.articleStart,
          articleEnd: input.articleEnd,
          mode: input.mode,
          limit: input.limit,
        };
        if (process.env.STUDY_PACK_ONLY === "true") {
          return studyFallbackQuizQuestions(input.chapterId, filters);
        }
        const rows = await getQuizQuestionsByChapterId(input.chapterId, filters);
        if (rows.length > 0) return rows;
        return studyFallbackQuizQuestions(input.chapterId, filters);
      }),

    getQuizFilterOptions: publicProcedure
      .input((val: unknown) => {
        if (typeof val === "number") return val;
        return 0;
      })
      .query(async ({ input }) => {
        if (process.env.STUDY_PACK_ONLY === "true") {
          return studyFallbackQuizFilterOptions(input);
        }
        const rows = await getQuizFilterOptionsByChapterId(input > 0 ? input : undefined);
        if ((rows.boards?.length ?? 0) > 0 || (rows.themes?.length ?? 0) > 0) return rows;
        return studyFallbackQuizFilterOptions(input);
      }),

    submitQuizAnswer: protectedProcedure
      .input((val: unknown) => {
        if (
          typeof val !== "object" ||
          val === null ||
          typeof (val as any).chapterId !== "number" ||
          typeof (val as any).score !== "number" ||
          typeof (val as any).totalQuestions !== "number"
        ) {
          throw new Error("Invalid input");
        }
        return val as {
          chapterId: number;
          score: number;
          totalQuestions: number;
          correctAnswers?: number;
          wrongAnswers?: number;
          avgTimeMs?: number;
          board?: string;
          theme?: string;
          attempts?: Array<{
            questionId: number;
            articleNumber?: number;
            examBoard?: string;
            theme?: string;
            selectedAnswer: string;
            correctAnswer: string;
            elapsedMs?: number;
          }>;
        };
      })
      .mutation(async (opts) => {
        await saveQuizResult(
          opts.ctx.user.id,
          opts.input.chapterId,
          opts.input.score,
          opts.input.totalQuestions,
          {
            correctAnswers: opts.input.correctAnswers,
            wrongAnswers: opts.input.wrongAnswers,
            avgTimeMs: opts.input.avgTimeMs,
            board: opts.input.board,
            theme: opts.input.theme,
          }
        );
        await saveQuestionAttempts(
          opts.ctx.user.id,
          (opts.input.attempts ?? []).map((a) => ({
            questionId: a.questionId,
            chapterId: opts.input.chapterId,
            articleNumber: a.articleNumber,
            examBoard: a.examBoard ?? opts.input.board ?? null,
            theme: a.theme ?? opts.input.theme ?? null,
            selectedAnswer: a.selectedAnswer,
            correctAnswer: a.correctAnswer,
            isCorrect: a.selectedAnswer === a.correctAnswer,
            elapsedMs: a.elapsedMs ?? null,
          }))
        );

        // Achievements logic
        const achievements = await getUserAchievements(opts.ctx.user.id);
        const earned = new Set(achievements.map((a) => a.achievementType));

        if (!earned.has("quiz_first")) {
          await awardAchievement(opts.ctx.user.id, "quiz_first", 10);
        }
        
        const accuracy = opts.input.totalQuestions > 0 ? opts.input.score / opts.input.totalQuestions : 0;
        if (accuracy >= 0.8 && !earned.has("quiz_master")) {
          await awardAchievement(opts.ctx.user.id, "quiz_master", 50);
        }
        if (accuracy === 1 && opts.input.totalQuestions >= 5 && !earned.has("quiz_perfect")) {
          await awardAchievement(opts.ctx.user.id, "quiz_perfect", 100);
        }

        const stats = await getStudyStats(opts.ctx.user.id);
        const totalHits = stats.totalCorrectAnswers ?? 0;

        const quizMilestones: Record<number, { id: string; pts: number }> = {
          10: { id: "quiz_10_correct", pts: 20 },
          25: { id: "quiz_25_correct", pts: 50 },
          50: { id: "quiz_50_correct", pts: 100 },
          75: { id: "quiz_75_correct", pts: 200 },
          90: { id: "quiz_90_correct", pts: 500 },
        };

        const thresholds = Object.keys(quizMilestones).map(Number).sort((a, b) => b - a);
        for (const t of thresholds) {
          if (totalHits >= t) {
            const m = quizMilestones[t];
            if (!earned.has(m.id)) {
              await awardAchievement(opts.ctx.user.id, m.id, m.pts);
            }
          }
        }

        return { success: true };
      }),

    // Flashcards
    getFlashcards: publicProcedure
      .input((val: unknown) => {
        if (typeof val !== "number") throw new Error("Invalid input");
        return val;
      })
      .query(async (opts) => {
        if (process.env.STUDY_PACK_ONLY === "true") {
          return studyFallbackFlashcards(opts.input);
        }
        const rows = await getFlashcardsByArticleId(opts.input);
        if (rows.length > 0) return rows;
        return studyFallbackFlashcards(opts.input);
      }),

    getDueFlashcards: protectedProcedure
      .input((val: unknown) => {
        if (typeof val === "number") return { limit: val };
        if (typeof val !== "object" || val === null) return { limit: 30 };
        const v = val as Record<string, unknown>;
        return { limit: typeof v.limit === "number" ? v.limit : 30 };
      })
      .query(async ({ ctx, input }) => {
        return getFlashcardsDueForReview(ctx.user.id, input.limit);
      }),

    reviewFlashcard: protectedProcedure
      .input((val: unknown) => {
        if (typeof val !== "object" || val === null) throw new Error("Invalid input");
        const v = val as Record<string, unknown>;
        if (typeof v.flashcardId !== "number" || typeof v.grade !== "number") throw new Error("Invalid input");
        return { flashcardId: v.flashcardId, grade: Math.max(0, Math.min(5, v.grade)) };
      })
      .mutation(async ({ ctx, input }) => {
        const state = await upsertFlashcardReview(ctx.user.id, input.flashcardId, input.grade);
        
        // Basic achievement logic for flashcards
        const achievements = await getUserAchievements(ctx.user.id);
        const earned = new Set(achievements.map((a) => a.achievementType));
        
        if (!earned.has("flashcard_first")) {
          await awardAchievement(ctx.user.id, "flashcard_first", 10);
        }

        const stats = await getStudyStats(ctx.user.id);
        const totalReviews = stats.totalFlashcardsReviewed ?? 0;

        const flashcardMilestones: Record<number, { id: string; pts: number }> = {
          10: { id: "flashcard_10", pts: 20 },
          30: { id: "flashcard_30", pts: 50 },
          50: { id: "flashcard_50", pts: 100 },
          70: { id: "flashcard_70", pts: 500 },
        };

        const thresholds = Object.keys(flashcardMilestones).map(Number).sort((a, b) => b - a);
        for (const t of thresholds) {
          if (totalReviews >= t) {
            const m = flashcardMilestones[t];
            if (!earned.has(m.id)) {
              await awardAchievement(ctx.user.id, m.id, m.pts);
            }
          }
        }

        return { success: true, state };
      }),

    // Emendas Constitucionais
    getAllAmendments: publicProcedure.query(async () => {
      if (process.env.STUDY_PACK_ONLY === "true") {
        return studyFallbackAmendments();
      }
      const rows = await getAllAmendments();
      if (rows.length > 0) return rows;
      return studyFallbackAmendments();
    }),

    // Progresso do Usuário
    getUserProgress: protectedProcedure.query(async (opts) => getStudyStats(opts.ctx.user.id)),

    getThematicProgress: protectedProcedure.query(async (opts) => getThematicProgress(opts.ctx.user.id)),

    markArticleAsRead: protectedProcedure
      .input((val: unknown) => {
        if (typeof val !== "number") throw new Error("Invalid input");
        return val;
      })
      .mutation(async (opts) => {
        await markArticleAsRead(opts.ctx.user.id, opts.input);

        // Achievement milestone logic
        const progress = await getUserProgress(opts.ctx.user.id);
        const readCount = progress.filter((p) => p.read === 1).length;
        
        const achievements = await getUserAchievements(opts.ctx.user.id);
        const earned = new Set(achievements.map((a) => a.achievementType));

        const milestones: Record<number, { id: string; pts: number }> = {
          1: { id: "read_1", pts: 10 },
          10: { id: "read_10", pts: 20 },
          50: { id: "read_50", pts: 50 },
          100: { id: "read_100", pts: 100 },
          150: { id: "read_150", pts: 150 },
          200: { id: "read_200", pts: 200 },
          250: { id: "constitution_master", pts: 500 },
        };

        if (milestones[readCount]) {
          const m = milestones[readCount];
          if (!earned.has(m.id)) {
            await awardAchievement(opts.ctx.user.id, m.id, m.pts);
          }
        }

        return { success: true };
      }),

    // Achievements
    getUserAchievements: protectedProcedure.query(async (opts) => {
      return getUserAchievements(opts.ctx.user.id);
    }),

    getUserQuizResults: protectedProcedure
      .input((val: unknown) => {
        if (typeof val !== "number") throw new Error("Invalid input");
        return val;
      })
      .query(async (opts) => {
        return getUserQuizResults(opts.ctx.user.id, opts.input);
      }),
  }),
});

export type AppRouter = typeof appRouter;
