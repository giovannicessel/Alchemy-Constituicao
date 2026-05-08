import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import "dotenv/config";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Dados estruturados da Constituição
const seedData = JSON.parse(fs.readFileSync(path.join(__dirname, 'seed-data.json'), 'utf-8'));

function parseMysqlUrl(urlString) {
  if (!urlString) return null;
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

async function seedDatabase() {
  const byUrl = parseMysqlUrl(process.env.DATABASE_URL);
  const connection = await mysql.createConnection(
    byUrl || {
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'constituicao',
    }
  );

  try {
    console.log('🌱 Iniciando seed do banco de dados...');
    await connection.beginTransaction();
    await connection.execute("DELETE FROM userQuestionAttempts");
    await connection.execute("DELETE FROM userFlashcardReview");
    await connection.execute("DELETE FROM userQuizResults");
    await connection.execute("DELETE FROM userProgress");
    await connection.execute("DELETE FROM userAchievements");
    await connection.execute("DELETE FROM flashcards");
    await connection.execute("DELETE FROM quizQuestions");
    await connection.execute("DELETE FROM articles");
    await connection.execute("DELETE FROM amendments");
    await connection.execute("DELETE FROM chapters");
    await connection.execute("DELETE FROM titles");

    // Inserir Títulos
    console.log('📚 Inserindo títulos...');
    for (const title of seedData.titles) {
      await connection.execute(
        'INSERT INTO titles (number, title, description, `order`) VALUES (?, ?, ?, ?)',
        [title.number, title.title, title.description, title.order]
      );
    }
    console.log(`✅ ${seedData.titles.length} títulos inseridos`);

    // Inserir Capítulos
    console.log('📖 Inserindo capítulos...');
    for (const chapter of seedData.chapters) {
      await connection.execute(
        'INSERT INTO chapters (titleId, number, title, description, `order`) VALUES (?, ?, ?, ?, ?)',
        [chapter.titleId, chapter.number, chapter.title, chapter.description, chapter.order]
      );
    }
    console.log(`✅ ${seedData.chapters.length} capítulos inseridos`);

    // Inserir Emendas
    console.log('⚖️ Inserindo emendas constitucionais...');
    for (const amendment of seedData.amendments) {
      await connection.execute(
        'INSERT INTO amendments (number, year, title, description, articlesAffected) VALUES (?, ?, ?, ?, ?)',
        [amendment.number, amendment.year, amendment.title, amendment.description, amendment.articlesAffected]
      );
    }
    console.log(`✅ ${seedData.amendments.length} emendas inseridas`);
    await connection.commit();

    console.log('🎉 Seed concluído com sucesso!');
  } catch (error) {
    await connection.rollback();
    console.error('❌ Erro ao fazer seed:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

seedDatabase().catch(console.error);
