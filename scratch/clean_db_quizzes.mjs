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
    const [result1] = await conn.execute(
      `DELETE FROM quizQuestions WHERE question LIKE '%Qual dispositivo da CF/88%'`
    );
    const [result2] = await conn.execute(
      `DELETE FROM quizQuestions WHERE question LIKE '%Qual artigo corresponde melhor%'`
    );
    const [result3] = await conn.execute(
      `DELETE FROM quizQuestions WHERE question LIKE '%...\\"?%'`
    );
    
    console.log(`Deleted rows: ${result1.affectedRows + result2.affectedRows + result3.affectedRows}`);
  } catch (e) {
    console.error(e);
  } finally {
    await conn.end();
  }
}

main().catch(console.error);
