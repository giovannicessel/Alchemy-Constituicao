import "dotenv/config";
import mysql from "mysql2/promise";
import crypto from "crypto";

const HARD_FLASHCARDS = [
  {
    articleNumber: 5,
    front: "Se uma autoridade pública nega o acesso a informações PESSOAIS do próprio requerente constantes de registros governamentais, qual remédio constitucional deve ser impetrado?",
    back: "Habeas Data (Art. 5º, LXXII, 'a'). Pegadinha comum: o Mandado de Segurança é residual, não cabendo se o caso for amparado por Habeas Corpus ou Habeas Data.",
    category: "Remédios Constitucionais",
    cardType: "pegadinha"
  },
  {
    articleNumber: 5,
    front: "Para a realização de uma reunião pacífica em local aberto ao público, é necessária a autorização prévia da autoridade competente?",
    back: "NÃO. É exigido apenas PRÉVIO AVISO à autoridade competente, independentemente de autorização, desde que não frustre outra reunião anteriormente convocada. (Art. 5º, XVI)",
    category: "Direitos Individuais",
    cardType: "jurisprudencia"
  },
  {
    articleNumber: 5,
    front: "No caso de iminente perigo público, a autoridade pode usar propriedade particular. O proprietário sempre terá direito à indenização?",
    back: "NÃO. A indenização é ULTERIOR (posterior), e SÓ HAVERÁ se houver DANO. (Art. 5º, XXV)",
    category: "Direito de Propriedade",
    cardType: "excecao"
  },
  {
    articleNumber: 5,
    front: "A Constituição Federal proíbe expressamente algumas penas. Existe alguma exceção em que a pena de morte é permitida no Brasil?",
    back: "SIM. É proibida a pena de morte, SALVO em caso de GUERRA DECLARADA. (Art. 5º, XLVII, 'a')",
    category: "Penas",
    cardType: "excecao"
  },
  {
    articleNumber: 5,
    front: "Quais são os únicos crimes que a Constituição define como INAFIANÇÁVEIS e IMPRESCRITÍVEIS?",
    back: "Racismo e Ação de grupos armados contra a ordem constitucional. (Art. 5º, XLII e XLIV). Bizu: RAÇÃO (Racismo + Ação de grupos).",
    category: "Direito Penal Constitucional",
    cardType: "mnemonico"
  },
  {
    articleNumber: 5,
    front: "O brasileiro NATO pode ser extraditado em caso de envolvimento comprovado com tráfico internacional de drogas?",
    back: "NÃO. O brasileiro NATO NUNCA será extraditado. O NATURALIZADO pode ser extraditado por crime comum antes da naturalização, ou tráfico ilícito a qualquer tempo. (Art. 5º, LI)",
    category: "Extradição",
    cardType: "pegadinha"
  },
  {
    articleNumber: 12,
    front: "Filho de pais estrangeiros, que nasça no Brasil, será considerado brasileiro nato?",
    back: "REGRA: Sim. EXCEÇÃO: Só NÃO será brasileiro nato se PELO MENOS UM dos pais estiver a SERVIÇO DE SEU PAÍS. Se estiverem a serviço de empresa privada, a criança é brasileira nata! (Art. 12, I, 'a')",
    category: "Nacionalidade",
    cardType: "excecao"
  },
  {
    articleNumber: 12,
    front: "Um brasileiro naturalizado pode ocupar o cargo de Ministro de Estado da Defesa ou Presidente do Senado?",
    back: "NÃO. Ambos são privativos de brasileiro NATO. (Art. 12, §3º). Bizu: MP3.COM (Min. STF, Pres. Rep/Vice, Pres. Câmara, Pres. Senado, Carreira Diplomática, Oficial Forças Armadas, Min. Defesa).",
    category: "Nacionalidade",
    cardType: "mnemonico"
  },
  {
    articleNumber: 14,
    front: "Os analfabetos são alistáveis (podem votar)? E eles podem ser votados (elegíveis)?",
    back: "O voto é FACULTATIVO para analfabetos (são alistáveis). Porém, são absolutamente INELEGÍVEIS (não podem receber votos). (Art. 14, §1º e §4º)",
    category: "Direitos Políticos",
    cardType: "pegadinha"
  },
  {
    articleNumber: 14,
    front: "Qual o prazo para impetrar ação de impugnação de mandato eletivo por abuso do poder econômico e onde ela tramita?",
    back: "Prazo de 15 DIAS contados da diplomação. Tramita em SEGREDO DE JUSTIÇA. (Art. 14, §10 e §11)",
    category: "Direitos Políticos",
    cardType: "excecao"
  }
];

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
  console.log("Conectando ao banco de dados...");
  const conn = await mysql.createConnection(parseMysqlUrl(process.env.DATABASE_URL));
  
  try {
    let inseridos = 0;
    
    for (const card of HARD_FLASHCARDS) {
      // Find the article UUID
      const [rows] = await conn.execute("SELECT id FROM articles WHERE number = ?", [card.articleNumber]);
      
      if (!rows || rows.length === 0) {
        console.warn(`Artigo ${card.articleNumber} não encontrado. Pulando flashcard...`);
        continue;
      }
      
      const articleId = rows[0].id;
      const cardId = crypto.randomUUID();
      
      // Insert flashcard
      await conn.execute(
        `INSERT INTO flashcards (articleId, front, back, category, cardType, difficulty, qualityScore)
         VALUES (?, ?, ?, ?, ?, 'hard', 100)`,
        [articleId, card.front, card.back, card.category, card.cardType]
      );
      
      inseridos++;
    }
    
    console.log(`\nSucesso! Foram injetados ${inseridos} Flashcards nível Concurso Público no banco de dados.`);
    
  } catch (error) {
    console.error("Erro durante a injeção:", error);
  } finally {
    await conn.end();
  }
}

main().catch(console.error);
