import express from "express";
import { parse as parseCookieHeader } from "cookie";
import fs from "node:fs";
import path from "node:path";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { initTRPC } from "@trpc/server";
import superjson from "superjson";

type StudyPack = {
  chapters: Array<{
    id: number;
    titleId: number;
    chapterTitle: string;
    chapterOrder: number;
    chapterNumber: number | null;
    titleName: string;
    titleOrder: number;
  }>;
  articles: Array<{
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
    audiobookUrl?: string | null;
    audiobookTitle?: string | null;
  }>;
  quizQuestions: Array<{
    id: number;
    chapterId: number;
    articleNumber?: number | null;
    examBoard?: string | null;
    theme?: string | null;
    question: string;
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;
    correctAnswer: string;
    explanation: string | null;
    difficulty: "easy" | "medium" | "hard";
  }>;
  flashcards: Array<{
    id: number;
    articleId: number;
    front: string;
    back: string;
    category: string | null;
    cardType?: string | null;
  }>;
  amendments: Array<{
    id: number;
    number: number;
    year: number;
    title: string;
    description: string | null;
    articlesAffected: string | null;
  }>;
};

function readStudyPack(): StudyPack {
  const file = path.join(process.cwd(), "content", "study-pack.json");
  const raw = fs.readFileSync(file, "utf-8");
  return JSON.parse(raw) as StudyPack;
}

const t = initTRPC.context<{ req: express.Request; res: express.Response; user: { openId: string; name: string } | null }>().create({
  transformer: superjson,
});
const router = t.router;
const publicProcedure = t.procedure;

const appRouter = router({
  auth: router({
    me: publicProcedure.query(({ ctx }) => {
      if (!ctx.user) return null;
      return {
        id: -1,
        openId: ctx.user.openId,
        name: ctx.user.name,
        email: null,
        loginMethod: "google",
        role: "user",
      };
    }),
    logout: publicProcedure.mutation(({ ctx }) => {
      ctx.res.clearCookie("app_session_id", {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        secure: true,
      });
      return { success: true } as const;
    }),
  }),
  constitution: router({
    listArticles: publicProcedure
      .input((val: unknown) => {
        const o = (val && typeof val === "object" ? val : {}) as Record<string, unknown>;
        return {
          limit: typeof o.limit === "number" ? o.limit : 500,
          offset: typeof o.offset === "number" ? o.offset : 0,
        };
      })
      .query(({ input }) => {
        const pack = readStudyPack();
        const limit = Math.min(Math.max(input.limit, 1), 1000);
        const offset = Math.max(input.offset, 0);
        return pack.articles.slice(offset, offset + limit);
      }),
    listChapters: publicProcedure.query(() => {
      const pack = readStudyPack();
      return pack.chapters;
    }),
    getQuizFilterOptions: publicProcedure
      .input((val: unknown) => (typeof val === "number" ? val : 0))
      .query(({ input }) => {
        const pack = readStudyPack();
        const rows = input > 0 ? pack.quizQuestions.filter((q) => q.chapterId === input) : pack.quizQuestions;
        const boards = Array.from(new Set(rows.map((r) => String(r.examBoard || "").trim()).filter(Boolean))).sort();
        const themes = Array.from(new Set(rows.map((r) => String(r.theme || "").trim()).filter(Boolean))).sort();
        const difficulties = Array.from(new Set(rows.map((r) => (r.difficulty || "medium") as "easy" | "medium" | "hard")));
        return { boards, themes, difficulties };
      }),
    getQuizQuestions: publicProcedure
      .input((val: unknown) => {
        if (typeof val === "number") return { chapterId: val };
        if (!val || typeof val !== "object") return { chapterId: 0 };
        const v = val as Record<string, unknown>;
        return {
          chapterId: typeof v.chapterId === "number" ? v.chapterId : 0,
          board: typeof v.board === "string" ? v.board : undefined,
          theme: typeof v.theme === "string" ? v.theme : undefined,
          difficulty:
            v.difficulty === "easy" || v.difficulty === "medium" || v.difficulty === "hard"
              ? (v.difficulty as "easy" | "medium" | "hard")
              : undefined,
          articleStart: typeof v.articleStart === "number" ? v.articleStart : undefined,
          articleEnd: typeof v.articleEnd === "number" ? v.articleEnd : undefined,
          mode: v.mode === "simulado" ? "simulado" : "practice",
          limit: typeof v.limit === "number" ? v.limit : undefined,
        };
      })
      .query(({ input }) => {
        const pack = readStudyPack();
        const normalize = (s: string) =>
          s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
        let rows = pack.quizQuestions.filter((q) => q.chapterId === input.chapterId);
        if (input.board) rows = rows.filter((q) => normalize(String(q.examBoard || "")).includes(normalize(input.board!)));
        if (input.theme) rows = rows.filter((q) => normalize(String(q.theme || "")).includes(normalize(input.theme!)));
        if (input.difficulty) rows = rows.filter((q) => q.difficulty === input.difficulty);
        if (input.articleStart != null) rows = rows.filter((q) => (q.articleNumber ?? 0) >= input.articleStart!);
        if (input.articleEnd != null) rows = rows.filter((q) => (q.articleNumber ?? 9999) <= input.articleEnd!);
        const limit = Math.min(Math.max(input.limit ?? (input.mode === "simulado" ? 20 : 300), 1), 300);
        if (input.mode === "simulado") return [...rows].sort(() => Math.random() - 0.5).slice(0, limit);
        return rows.slice(0, limit);
      }),
    getFlashcards: publicProcedure
      .input((val: unknown) => (typeof val === "number" ? val : 0))
      .query(({ input }) => readStudyPack().flashcards.filter((f) => f.articleId === input)),
    getAllAmendments: publicProcedure.query(() => readStudyPack().amendments),
    getUserProgress: publicProcedure.query(() => ({
      articlesRead: 0,
      totalArticles: readStudyPack().articles.length,
      quizzesCompleted: 0,
      totalPoints: 0,
      averageAccuracy: 0,
      weeklyAccuracy: 0,
      retentionD7: 0,
      dueReviews: 0,
      byBoard: [],
      weakThemes: [],
      achievements: [],
      lastActivity: null,
    })),
    getDueFlashcards: publicProcedure.query(() => []),
    reviewFlashcard: publicProcedure.mutation(() => ({ success: true, state: null })),
    submitQuizAnswer: publicProcedure.mutation(() => ({ success: true })),
    markArticleAsRead: publicProcedure.mutation(() => ({ success: true })),
  }),
});

const app = express();
app.set("trust proxy", 1);
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext: ({ req, res }) => {
      const token = parseCookieHeader(req.headers.cookie ?? "").app_session_id;
      let user: { openId: string; name: string } | null = null;
      if (token) {
        try {
          const payload = JSON.parse(Buffer.from(token.split(".")[1] ?? "", "base64url").toString("utf8")) as {
            openId?: string;
            name?: string;
          };
          if (typeof payload.openId === "string") {
            user = { openId: payload.openId, name: payload.name ?? "" };
          }
        } catch {
          user = null;
        }
      }
      return { req, res, user };
    },
  }),
);
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("Vercel Serverless Error:", err);
  res.status(500).json({ error: "Internal Server Error" });
});

export default app;
