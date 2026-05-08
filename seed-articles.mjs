#!/usr/bin/env node
/**
 * Insere artigos a partir de JSON gerado pelo extract_articles.py (data/articles_extracted.json).
 * Usa titleNumber + chapterOrder para localizar chapterId no MySQL.
 */
import fs from "fs";
import mysql from "mysql2/promise";

const articlesPath = process.env.ARTICLES_JSON || "./data/articles_extracted.json";
const articlesData = JSON.parse(fs.readFileSync(articlesPath, "utf-8"));

function parseMysqlUrl(urlString) {
  if (!urlString) return null;
  const u = new URL(urlString);
  return {
    host: u.hostname,
    port: Number(u.port || 3306),
    user: decodeURIComponent(u.username),
    password: decodeURIComponent(u.password || ""),
    database: u.pathname.replace(/^\//, "").split("/")[0],
  };
}

const cfg = parseMysqlUrl(process.env.DATABASE_URL);
if (!cfg) {
  console.error("Defina DATABASE_URL");
  process.exit(1);
}

const connection = await mysql.createConnection(cfg);

async function resolveChapterId(titleNumber, chapterOrder) {
  const [rows] = await connection.execute(
    `SELECT c.id FROM chapters c
     INNER JOIN titles t ON c.titleId = t.id
     WHERE t.number = ? AND c.\`order\` = ?`,
    [titleNumber, chapterOrder]
  );
  return rows[0]?.id ?? null;
}

console.log(`Inserindo artigos de ${articlesPath}...`);

let inserted = 0;
for (const article of articlesData) {
  let chapterId = article.chapterId;
  if (chapterId == null && article.titleNumber != null && article.chapterOrder != null) {
    chapterId = await resolveChapterId(article.titleNumber, article.chapterOrder);
  }
  if (chapterId == null) {
    console.warn(`Pulando Art. ${article.number}: defina chapterId ou titleNumber/chapterOrder validos.`);
    continue;
  }
  try {
    await connection.execute(
      `INSERT INTO articles (number, originalText, simplifiedText, practicalExample, curiosity, chapterId, keywordsTags)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        article.number,
        article.originalText,
        article.simplifiedText || "",
        article.practicalExample || "",
        article.curiosity || "",
        chapterId,
        article.keywordsTags || "",
      ]
    );
    inserted++;
    if (inserted % 50 === 0) {
      console.log(`Inseridos ${inserted}/${articlesData.length}...`);
    }
  } catch (error) {
    console.error(`Erro artigo ${article.number}:`, error.message);
  }
}

await connection.end();
console.log(`Concluido: ${inserted} artigos.`);
