import "dotenv/config";
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

async function main() {
  const conn = await mysql.createConnection(parseMysqlUrl(process.env.DATABASE_URL));
  
  try {
    await conn.execute("DELETE FROM userQuestionAttempts");
    await conn.execute("DELETE FROM userFlashcardReview");
    await conn.execute("DELETE FROM userQuizResults");
    await conn.execute("DELETE FROM userProgress");
    await conn.execute("DELETE FROM userAchievements");

    console.log("✅ Progresso do usuário resetado com sucesso!");
  } catch (e) {
    console.error(e);
  } finally {
    await conn.end();
  }
}

main().catch(console.error);
