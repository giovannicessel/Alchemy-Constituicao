#!/usr/bin/env node
/**
 * Importa content/study-pack.json para MySQL (artigos, quiz, flashcards, emendas).
 * Requer DATABASE_URL e schema já criado (pnpm db:push + pnpm run seed-db).
 */
import "dotenv/config";
import fs from "fs";
import path from "path";
import mysql from "mysql2/promise";

function parseMysqlUrl(urlString) {
  if (!urlString) throw new Error("Defina DATABASE_URL no .env");
  const u = new URL(urlString);
  const db = u.pathname.replace(/^\//, "").split("/")[0];
  return {
    host: u.hostname,
    port: Number(u.port || 3306),
    user: decodeURIComponent(u.username),
    password: decodeURIComponent(u.password || ""),
    database: db,
  };
}

async function resolveChapterId(conn, titleNumber, chapterOrder) {
  const [rows] = await conn.execute(
    `SELECT c.id FROM chapters c
     INNER JOIN titles t ON c.titleId = t.id
     WHERE t.number = ? AND c.\`order\` = ?`,
    [titleNumber, chapterOrder]
  );
  if (!rows.length) {
    throw new Error(`Capítulo não encontrado (titles.number=${titleNumber}, chapters.order=${chapterOrder}). Rode seed-db.mjs antes.`);
  }
  return rows[0].id;
}

async function upsertArticle(conn, chapterId, row) {
  const [existing] = await conn.execute("SELECT id FROM articles WHERE chapterId = ? AND number = ?", [
    chapterId,
    row.number,
  ]);
  const fields = [
    row.originalText,
    row.simplifiedText ?? "",
    row.curiosity ?? "",
    row.practicalExample ?? "",
    row.keywordsTags ?? "",
  ];
  if (existing.length) {
    await conn.execute(
      `UPDATE articles SET originalText=?, simplifiedText=?, curiosity=?, practicalExample=?, keywordsTags=? WHERE id=?`,
      [...fields, existing[0].id]
    );
    return existing[0].id;
  }
  const [ins] = await conn.execute(
    `INSERT INTO articles (originalText, simplifiedText, curiosity, practicalExample, keywordsTags, chapterId, number)
     VALUES (?,?,?,?,?,?,?)`,
    [...fields, chapterId, row.number]
  );
  return ins.insertId;
}

async function main() {
  const bundlePath = path.join(process.cwd(), "content", "study-pack.json");
  if (!fs.existsSync(bundlePath)) {
    throw new Error(`Arquivo não encontrado: ${bundlePath}`);
  }
  const raw = JSON.parse(fs.readFileSync(bundlePath, "utf8"));
  const conn = await mysql.createConnection(parseMysqlUrl(process.env.DATABASE_URL));

  await conn.beginTransaction();
  try {
    // Limpa dados derivados para reimportação consistente.
    await conn.execute("DELETE FROM userQuestionAttempts");
    await conn.execute("DELETE FROM userFlashcardReview");
    await conn.execute("DELETE FROM userQuizResults");
    await conn.execute("DELETE FROM userProgress");
    await conn.execute("DELETE FROM flashcards");
    await conn.execute("DELETE FROM quizQuestions");
    await conn.execute("DELETE FROM articles");
    await conn.execute("DELETE FROM amendments");

    const chapterRowsById = new Map();
    const [chapterRows] = await conn.execute("SELECT id FROM chapters");
    for (const row of chapterRows) chapterRowsById.set(row.id, row.id);

    for (const a of raw.articles || []) {
      if (!chapterRowsById.has(a.chapterId)) continue;
      await conn.execute(
        `INSERT INTO articles (id, chapterId, number, originalText, simplifiedText, curiosity, practicalExample, keywordsTags)
         VALUES (?,?,?,?,?,?,?,?)`,
        [
          a.id,
          a.chapterId,
          a.number,
          a.originalText ?? "",
          a.simplifiedText ?? "",
          a.curiosity ?? "",
          a.practicalExample ?? "",
          a.keywordsTags ?? "",
        ]
      );
    }

    for (const q of raw.quizQuestions || []) {
      await conn.execute(
        `INSERT INTO quizQuestions
        (id, chapterId, articleNumber, examBoard, theme, sourceType, sourceRef, question, optionA, optionB, optionC, optionD, correctAnswer, explanation, difficulty)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [
          q.id,
          q.chapterId,
          q.articleNumber ?? null,
          q.examBoard ?? "geral",
          q.theme ?? "constitucional",
          q.sourceType ?? "import",
          q.sourceRef ?? null,
          q.question,
          q.optionA,
          q.optionB,
          q.optionC,
          q.optionD,
          q.correctAnswer,
          q.explanation ?? "",
          q.difficulty ?? "medium",
        ]
      );
    }

    for (const f of raw.flashcards || []) {
      await conn.execute(
        `INSERT INTO flashcards (id, articleId, front, back, category, cardType, difficulty, qualityScore)
         VALUES (?,?,?,?,?,?,?,?)`,
        [
          f.id,
          f.articleId,
          f.front,
          f.back,
          f.category ?? "geral",
          f.cardType ?? "literalidade",
          f.difficulty ?? "medium",
          typeof f.qualityScore === "number" ? f.qualityScore : 75,
        ]
      );
    }

    for (const a of raw.amendments || []) {
      await conn.execute(
        `INSERT INTO amendments (id, number, year, title, description, articlesAffected)
         VALUES (?,?,?,?,?,?)`,
        [a.id, a.number, a.year, a.title, a.description ?? null, a.articlesAffected ?? null]
      );
    }

    await conn.commit();
  } catch (error) {
    await conn.rollback();
    throw error;
  }

  await conn.end();
  console.log(
    `Importação concluída: ${raw.articles.length} artigos, ${raw.flashcards.length} flashcards, ${raw.quizQuestions.length} perguntas de quiz e ${raw.amendments.length} emendas.`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
