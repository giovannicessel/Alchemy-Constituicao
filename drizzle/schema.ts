import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Títulos da Constituição (ex: Título I, Título II, etc)
export const titles = mysqlTable("titles", {
  id: int("id").autoincrement().primaryKey(),
  number: int("number").notNull(), // 1, 2, 3, etc
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  order: int("order").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Capítulos dentro de cada título
export const chapters = mysqlTable("chapters", {
  id: int("id").autoincrement().primaryKey(),
  titleId: int("titleId").notNull(),
  number: int("number"),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  order: int("order").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Artigos da Constituição
export const articles = mysqlTable("articles", {
  id: int("id").autoincrement().primaryKey(),
  chapterId: int("chapterId").notNull(),
  number: int("number").notNull(),
  originalText: text("originalText").notNull(),
  simplifiedText: text("simplifiedText"),
  curiosity: text("curiosity"),
  practicalExample: text("practicalExample"),
  keywordsTags: varchar("keywordsTags", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Perguntas de Quiz
export const quizQuestions = mysqlTable("quizQuestions", {
  id: int("id").autoincrement().primaryKey(),
  chapterId: int("chapterId").notNull(),
  articleNumber: int("articleNumber"),
  examBoard: varchar("examBoard", { length: 64 }),
  theme: varchar("theme", { length: 120 }),
  sourceType: varchar("sourceType", { length: 64 }),
  sourceRef: varchar("sourceRef", { length: 255 }),
  question: text("question").notNull(),
  optionA: text("optionA").notNull(),
  optionB: text("optionB").notNull(),
  optionC: text("optionC").notNull(),
  optionD: text("optionD").notNull(),
  correctAnswer: varchar("correctAnswer", { length: 1 }).notNull(), // A, B, C, D
  explanation: text("explanation"),
  difficulty: mysqlEnum("difficulty", ["easy", "medium", "hard"]).default("medium"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Flashcards
export const flashcards = mysqlTable("flashcards", {
  id: int("id").autoincrement().primaryKey(),
  articleId: int("articleId").notNull(),
  front: text("front").notNull(), // pergunta/conceito
  back: text("back").notNull(), // resposta/definição
  category: varchar("category", { length: 100 }),
  cardType: varchar("cardType", { length: 64 }),
  difficulty: mysqlEnum("difficulty", ["easy", "medium", "hard"]).default("medium"),
  qualityScore: int("qualityScore").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Emendas Constitucionais
export const amendments = mysqlTable("amendments", {
  id: int("id").autoincrement().primaryKey(),
  number: int("number").notNull(),
  year: int("year").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  articlesAffected: text("articlesAffected"), // JSON array de IDs de artigos
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Progresso do Usuário
export const userProgress = mysqlTable("userProgress", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  articleId: int("articleId").notNull(),
  read: int("read").default(0), // 0 ou 1
  readAt: timestamp("readAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// Resultados de Quiz do Usuário
export const userQuizResults = mysqlTable("userQuizResults", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  chapterId: int("chapterId").notNull(),
  score: int("score").notNull(), // pontuação
  totalQuestions: int("totalQuestions").notNull(),
  correctAnswers: int("correctAnswers"),
  wrongAnswers: int("wrongAnswers"),
  avgTimeMs: int("avgTimeMs"),
  board: varchar("board", { length: 64 }),
  theme: varchar("theme", { length: 120 }),
  completedAt: timestamp("completedAt").defaultNow().notNull(),
});

// Tentativas por questão para analytics de retenção
export const userQuestionAttempts = mysqlTable("userQuestionAttempts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  questionId: int("questionId").notNull(),
  chapterId: int("chapterId").notNull(),
  articleNumber: int("articleNumber"),
  examBoard: varchar("examBoard", { length: 64 }),
  theme: varchar("theme", { length: 120 }),
  selectedAnswer: varchar("selectedAnswer", { length: 1 }).notNull(),
  correctAnswer: varchar("correctAnswer", { length: 1 }).notNull(),
  isCorrect: int("isCorrect").notNull(), // 0/1
  elapsedMs: int("elapsedMs"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Revisão espaçada por usuário/card
export const userFlashcardReview = mysqlTable("userFlashcardReview", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  flashcardId: int("flashcardId").notNull(),
  easeFactor: int("easeFactor").default(250).notNull(), // 250 = 2.5
  intervalDays: int("intervalDays").default(0).notNull(),
  repetitions: int("repetitions").default(0).notNull(),
  lapses: int("lapses").default(0).notNull(),
  lastGrade: int("lastGrade").default(0).notNull(), // 0-5
  dueAt: timestamp("dueAt").defaultNow().notNull(),
  reviewedAt: timestamp("reviewedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// Achievements/Conquistas do Usuário
export const userAchievements = mysqlTable("userAchievements", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  achievementType: varchar("achievementType", { length: 100 }).notNull(), // "first_article", "quiz_master", etc
  points: int("points").default(0),
  earnedAt: timestamp("earnedAt").defaultNow().notNull(),
});

// Tipos de dados exportados
export type Title = typeof titles.$inferSelect;
export type Chapter = typeof chapters.$inferSelect;
export type Article = typeof articles.$inferSelect;
export type QuizQuestion = typeof quizQuestions.$inferSelect;
export type Flashcard = typeof flashcards.$inferSelect;
export type Amendment = typeof amendments.$inferSelect;
export type UserProgress = typeof userProgress.$inferSelect;
export type UserQuizResult = typeof userQuizResults.$inferSelect;
export type UserAchievement = typeof userAchievements.$inferSelect;
export type UserQuestionAttempt = typeof userQuestionAttempts.$inferSelect;
export type UserFlashcardReview = typeof userFlashcardReview.$inferSelect;