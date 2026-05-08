import fs from "fs";
import path from "path";
import "dotenv/config";
import mysql from "mysql2/promise";

const API_KEY = process.env.GEMINI_API_KEY;
const BUNDLE_PATH = path.join(process.cwd(), "content", "study-pack.json");

if (!API_KEY) {
  console.error("ERRO: GEMINI_API_KEY não encontrada no arquivo .env");
  process.exit(1);
}

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

async function callGemini(originalText) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;
  
  const prompt = `Você é um professor renomado de Direito Constitucional.
Traduza o texto legal abaixo para uma linguagem extremamente fluida, didática e sem 'juridiquês' desnecessário, mantendo o rigor técnico.
Foque em um aluno de concurso público. 

Regras:
1. Explique a regra geral em 1 a 2 frases claras.
2. Se houver incisos/parágrafos importantes, resuma-os em bullet points curtos.
3. NÃO inicie o texto com frases como "A ideia central é" ou "O artigo fala sobre". Vá direto ao ponto!
4. Retorne APENAS o texto didático gerado, sem introduções ou formatações extras.

Texto Original:
${originalText}`;

  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.3 }
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Erro na API do Gemini: ${err}`);
  }

  const data = await res.json();
  return data.candidates[0].content.parts[0].text.trim();
}

async function main() {
  console.log("🚀 Iniciando tradução didática com Gemini 1.5 Flash...");
  
  // Conectar ao Banco para atualizar em tempo real sem apagar progresso
  const conn = await mysql.createConnection(parseMysqlUrl(process.env.DATABASE_URL));
  
  const data = JSON.parse(fs.readFileSync(BUNDLE_PATH, "utf8"));
  const articles = data.articles;
  
  let processed = 0;
  
  for (let i = 0; i < articles.length; i++) {
    const art = articles[i];
    
    // Pular artigos que já possuem um texto simplificado satisfatório
    if (art.simplifiedText && art.simplifiedText.length > 50 && !art.simplifiedText.includes("Ideia central")) {
      continue;
    }

    console.log(`⏳ Processando Artigo ${art.number}...`);
    try {
      const simplified = await callGemini(art.originalText);
      
      // Atualiza o JSON
      art.simplifiedText = simplified;
      
      // Atualiza o DB
      await conn.execute(
        "UPDATE articles SET simplifiedText = ? WHERE number = ?",
        [simplified, art.number]
      );
      
      console.log(`✅ Artigo ${art.number} atualizado com sucesso!`);
      processed++;
      
      // Salva o JSON a cada 5 artigos para não perder progresso
      if (processed % 5 === 0) {
        fs.writeFileSync(BUNDLE_PATH, JSON.stringify(data, null, 2));
      }
      
      // Pequeno delay para respeitar o rate limit da API gratuita (15 RPM)
      await new Promise(r => setTimeout(r, 4000));
      
    } catch (e) {
      console.error(`❌ Erro no Artigo ${art.number}:`, e.message);
      // Salva o progresso e pausa em caso de erro grave (ex: limite de cota)
      break;
    }
  }

  // Salva o estado final
  fs.writeFileSync(BUNDLE_PATH, JSON.stringify(data, null, 2));
  await conn.end();
  
  console.log(`🎉 Finalizado! ${processed} artigos reescritos e salvos.`);
}

main().catch(console.error);
