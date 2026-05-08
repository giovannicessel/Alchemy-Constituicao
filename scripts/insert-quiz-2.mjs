import "dotenv/config";
import mysql from "mysql2/promise";

const REAL_QUIZZES = [
  {
    articleNumber: 109,
    question: "Qual a competência da Justiça Federal segundo o Art. 109 da CF/88?",
    optionA: "Ações contra o Banco do Brasil",
    optionB: "Disputa sobre direitos indígenas",
    optionC: "Mandados de segurança contra dirigente de faculdade particular",
    optionD: "Ações em que o INSS for interessado",
    correctAnswer: "A",
    examBoard: "TRF1",
    theme: "Organização dos Poderes",
    difficulty: "hard",
    explanation: "Ações contra o Banco do Brasil (sociedade de economia mista) tramitam na Justiça Estadual, não na Federal (Súmula 508 STF). Porém, a Justiça Federal julga disputas sobre direitos indígenas (Art. 109, XI), MS contra atos de dirigente de faculdade particular (exercício de função federal), etc. Mas calma, a alternativa A é a única INCORRETA/Gabarito."
  },
  {
    articleNumber: 5,
    question: "Sobre Direitos Individuais (Art. 5º), assinale a INCORRETA:",
    optionA: "Associações só dissolvidas por decisão judicial com trânsito em julgado",
    optionB: "Plena liberdade de associação para fins lícitos, vedada paramilitar",
    optionC: "Reunião em locais públicos exige autorização do Poder Público",
    optionD: "A lei não excluirá da apreciação do Judiciário lesão a direito",
    correctAnswer: "C",
    examBoard: "TRF1",
    theme: "Direitos e Garantias Fundamentais",
    difficulty: "medium",
    explanation: "O direito de reunião NÃO exige autorização, sendo exigido apenas o prévio aviso à autoridade competente. (Art. 5º, XVI)"
  },
  {
    articleNumber: 1,
    question: "Classificação da Constituição Brasileira de 1988:",
    optionA: "Promulgada, escrita, sintética, formal, dogmática, rígida, eclética",
    optionB: "Outorgada, escrita, analítica, material, dogmática, rígida, ortodoxa",
    optionC: "Promulgada, escrita, sintética, formal, histórica, rígida, eclética",
    optionD: "Promulgada, escrita, analítica, formal, dogmática, rígida, eclética",
    correctAnswer: "D",
    examBoard: "TRF1",
    theme: "Teoria Geral do Direito Constitucional",
    difficulty: "hard",
    explanation: "A CF/88 é: Promulgada (democrática), Escrita, Analítica (extensa), Formal, Dogmática (reúne dogmas de um momento), Rígida (processo de alteração mais árduo) e Eclética (concilia ideologias diversas)."
  },
  {
    articleNumber: 37,
    question: "Segundo o Art. 37, XIX da CF/88, sobre autarquias e fundações:",
    optionA: "Lei específica cria autarquia e autoriza empresa pública",
    optionB: "Lei cria autarquia e autoriza fundação",
    optionC: "Lei específica cria autarquia e autoriza instituição de empresa pública",
    optionD: "Lei específica cria autarquia e autoriza fundação, lei complementar define atuação",
    correctAnswer: "D",
    examBoard: "TRF1",
    theme: "Administração Pública",
    difficulty: "hard",
    explanation: "Somente lei ESPECÍFICA pode CRIA a autarquia e AUTORIZAR a instituição de empresa pública, de sociedade de economia mista e de fundação, cabendo à LEI COMPLEMENTAR, neste último caso, definir as áreas de sua atuação."
  },
  {
    articleNumber: 5,
    question: "A permanência irregular ou clandestina de estrangeiro no país justifica sua extradição?",
    optionA: "Certo.",
    optionB: "Errado.",
    optionC: "Apenas se solicitada por país fronteiriço.",
    optionD: "Apenas se houver condenação penal no Brasil.",
    correctAnswer: "B",
    examBoard: "Cebraspe",
    theme: "Direitos Individuais - Extradição",
    difficulty: "medium",
    explanation: "A permanência irregular enseja DEPORTAÇÃO, não extradição. Extradição exige o cometimento de crime julgado no exterior e requisição oficial."
  },
  {
    articleNumber: 84,
    question: "O Presidente da República, como Chefe de Estado, mantém relações com Estados estrangeiros?",
    optionA: "Certo.",
    optionB: "Errado.",
    optionC: "Apenas com aprovação prévia do STF.",
    optionD: "Apenas em situações de guerra declarada.",
    correctAnswer: "A",
    examBoard: "Cebraspe",
    theme: "Organização dos Poderes - Executivo",
    difficulty: "easy",
    explanation: "Como Chefe de Estado, o Presidente representa o Brasil externamente (mantém relações, acredita representantes). Como Chefe de Governo, ele atua na política interna."
  },
  {
    articleNumber: 144,
    question: "A Polícia Federal é um órgão transitório da segurança pública?",
    optionA: "Certo.",
    optionB: "Errado.",
    optionC: "Apenas para ações nas fronteiras.",
    optionD: "Depende de decreto de GLO (Garantia da Ordem).",
    correctAnswer: "B",
    examBoard: "Cebraspe",
    theme: "Defesa do Estado e Segurança Pública",
    difficulty: "easy",
    explanation: "A Polícia Federal é um órgão PERMANENTE, mantido pela União (Art. 144, §1º)."
  },
  {
    articleNumber: 231,
    question: "A remoção de indígenas de suas terras em caso de epidemia exige autorização prévia do Congresso Nacional?",
    optionA: "Certo.",
    optionB: "Errado.",
    optionC: "Apenas se envolver mais de uma aldeia.",
    optionD: "A remoção é absolutamente proibida.",
    correctAnswer: "B",
    examBoard: "Cebraspe",
    theme: "Ordem Social - Índios",
    difficulty: "hard",
    explanation: "A remoção é feita 'ad referendum' (para posterior aprovação) do Congresso Nacional, e não com autorização prévia, por conta da urgência (Art. 231, §5º)."
  },
  {
    articleNumber: 5,
    question: "Habeas Corpus e Habeas Data são gratuitos e dispensam advogado?",
    optionA: "Certo.",
    optionB: "Errado.",
    optionC: "São gratuitos apenas para cidadãos reconhecidamente pobres.",
    optionD: "Dispensam advogado apenas na primeira instância.",
    correctAnswer: "B",
    examBoard: "Cebraspe",
    theme: "Remédios Constitucionais",
    difficulty: "medium",
    explanation: "Ambos são gratuitos, mas o Habeas Data EXIGE capacidade postulatória (advogado), diferentemente do Habeas Corpus."
  },
  {
    articleNumber: 5,
    question: "O Poder Judiciário pode autorizar interceptação telefônica para processo civil?",
    optionA: "Certo.",
    optionB: "Errado.",
    optionC: "Apenas em processos envolvendo varas de família.",
    optionD: "Apenas quando envolver menores de idade infratores.",
    correctAnswer: "B",
    examBoard: "Cebraspe",
    theme: "Direitos e Garantias Fundamentais",
    difficulty: "medium",
    explanation: "A interceptação telefônica (sigilo de comunicações) só pode ser quebrada para fins de INVESTIGAÇÃO CRIMINAL ou INSTRUÇÃO PROCESSUAL PENAL (Art. 5º, XII)."
  },
  {
    articleNumber: 144,
    question: "Municípios podem instituir guardas municipais para proteção de bens e serviços?",
    optionA: "Certo.",
    optionB: "Errado.",
    optionC: "Apenas municípios com mais de 50 mil habitantes.",
    optionD: "Apenas se houver convênio prévio com o Estado.",
    correctAnswer: "A",
    examBoard: "Cebraspe",
    theme: "Defesa do Estado e Segurança Pública",
    difficulty: "easy",
    explanation: "Os Municípios poderão (é facultativo) instituir guardas municipais destinadas à proteção de seus bens, serviços e instalações (Art. 144, §8º)."
  },
  {
    articleNumber: 144,
    question: "A Polícia Penal federal é responsável pelo patrulhamento repressivo do sistema penal?",
    optionA: "Certo.",
    optionB: "Errado.",
    optionC: "Apenas em presídios de segurança máxima federais.",
    optionD: "Apenas quando convocada pela Força Nacional.",
    correctAnswer: "B",
    examBoard: "Cebraspe",
    theme: "Defesa do Estado e Segurança Pública",
    difficulty: "medium",
    explanation: "As polícias penais cabem à 'segurança dos estabelecimentos penais', e não 'patrulhamento repressivo', que é função de outras polícias (ex: PRF faz patrulhamento ostensivo das rodovias)."
  },
  {
    articleNumber: 18,
    question: "Quais princípios caracterizam os estados-membros como entes federados?",
    optionA: "Soberania e auto-governo",
    optionB: "Soberania e participação",
    optionC: "Autonomia e soberania",
    optionD: "Participação e autonomia",
    correctAnswer: "D",
    examBoard: "UFPR",
    theme: "Organização Político-Administrativa",
    difficulty: "hard",
    explanation: "Soberania é atributo da República Federativa do Brasil. Os Estados-membros possuem AUTONOMIA (auto-organização, autogoverno e autoadministração) e o direito de PARTICIPAÇÃO na vontade nacional (através do Senado)."
  },
  {
    articleNumber: 5,
    question: "Sobre os direitos fundamentais, a manifestação do pensamento:",
    optionA: "É livre e permite anonimato",
    optionB: "É livre, porém é vedado o anonimato",
    optionC: "É restrita apenas aos meios oficiais de comunicação",
    optionD: "Não inclui a livre expressão científica se for amadora",
    correctAnswer: "B",
    examBoard: "UFPR",
    theme: "Direitos e Garantias Fundamentais",
    difficulty: "easy",
    explanation: "Art. 5º, IV - é livre a manifestação do pensamento, sendo vedado o anonimato."
  },
  {
    articleNumber: 1,
    question: "São características fundamentais do princípio republicano no Brasil:",
    optionA: "Eletividade, periodicidade dos mandatos e responsabilidade dos governantes",
    optionB: "Hereditariedade e vitaliciedade dos chefes de estado",
    optionC: "Poder absoluto e concentrado na figura do Chefe de Estado",
    optionD: "Ausência de prestação de contas do Poder Executivo",
    correctAnswer: "A",
    examBoard: "UFPR",
    theme: "Princípios Fundamentais",
    difficulty: "medium",
    explanation: "A República opõe-se à Monarquia, caracterizando-se pela eleição popular (eletividade), tempo limitado no poder (periodicidade) e dever de prestar contas (responsabilidade/accountability)."
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
    
    for (const quiz of REAL_QUIZZES) {
      // Find the article UUID and chapterId
      const [rows] = await conn.execute("SELECT id, chapterId FROM articles WHERE number = ?", [quiz.articleNumber]);
      
      let chapterId = 1; // Default
      let articleNumber = quiz.articleNumber;
      
      if (rows && rows.length > 0) {
        chapterId = rows[0].chapterId;
      } else {
        console.warn(`Aviso: Artigo ${quiz.articleNumber} não encontrado na tabela. Atribuindo ao Capítulo padrão (1) e prosseguindo.`);
      }
      
      // Insert Quiz Question
      await conn.execute(
        `INSERT INTO quizQuestions 
        (chapterId, articleNumber, examBoard, theme, sourceType, question, optionA, optionB, optionC, optionD, correctAnswer, explanation, difficulty)
        VALUES (?, ?, ?, ?, 'concurso', ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          chapterId, 
          articleNumber, 
          quiz.examBoard, 
          quiz.theme, 
          quiz.question, 
          quiz.optionA, 
          quiz.optionB, 
          quiz.optionC, 
          quiz.optionD, 
          quiz.correctAnswer, 
          quiz.explanation, 
          quiz.difficulty
        ]
      );
      
      inseridos++;
    }
    
    console.log(`\nSucesso! Foram injetados ${inseridos} Quizzes extraídos do Quiz-2.csv no banco de dados.`);
    
  } catch (error) {
    console.error("Erro durante a injeção:", error);
  } finally {
    await conn.end();
  }
}

main().catch(console.error);
