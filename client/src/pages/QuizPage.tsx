import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { STATIC_STUDY_MODE } from "@/config/features";
import { trpc } from "@/lib/trpc";
import { TRPCClientError } from "@trpc/client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useSearchParams } from "wouter";
import { toast } from "sonner";
import ThemeToggle from "@/components/ThemeToggle";

type QuizFilters = {
  board: string;
  theme: string;
  difficulty: "" | "easy" | "medium" | "hard";
  mode: "practice" | "simulado";
};

export default function QuizPage() {
  const [, setLocation] = useLocation();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const [chapterId, setChapterId] = useState<number | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [filters, setFilters] = useState<QuizFilters>({
    board: "",
    theme: "",
    difficulty: "",
    mode: "practice",
  });
  const [attempts, setAttempts] = useState<
    Array<{
      questionId: number;
      selectedAnswer: "A" | "B" | "C" | "D";
      correctAnswer: "A" | "B" | "C" | "D";
      elapsedMs: number;
      articleNumber?: number;
      examBoard?: string | null;
      theme?: string | null;
    }>
  >([]);
  const [questionStartedAt, setQuestionStartedAt] = useState<number>(() => Date.now());

  useEffect(() => {
    const raw = searchParams.get("chapterId");
    if (raw) {
      const n = Number.parseInt(raw, 10);
      if (!Number.isNaN(n)) setChapterId(n);
    } else {
      setChapterId(null);
    }
  }, [searchParams]);

  const { data: chapters = [], isLoading: chaptersLoading } = trpc.constitution.listChapters.useQuery();

  const {
    data: questions = [],
    isLoading: questionsLoading,
    refetch: refetchQuestions,
  } = trpc.constitution.getQuizQuestions.useQuery({
    chapterId: chapterId ?? 0,
    board: filters.board || undefined,
    theme: filters.theme || undefined,
    difficulty: filters.difficulty || undefined,
    articleStart: undefined,
    articleEnd: undefined,
    mode: filters.mode,
    limit: filters.mode === "simulado" ? 20 : 300,
  }, {
    enabled: chapterId !== null,
  });
  const { data: filterOptions } = trpc.constitution.getQuizFilterOptions.useQuery(chapterId ?? 0);

  const submitResult = trpc.constitution.submitQuizAnswer.useMutation({
    onSuccess: () => toast.success("Resultado salvo na sua conta."),
    onError: (err) => {
      if (err instanceof TRPCClientError && err.data?.code === "UNAUTHORIZED") {
        toast.message("Entre na conta para salvar o resultado (o quiz funciona sem login).");
        return;
      }
      toast.error("Não foi possível salvar o resultado.");
    },
  });

  const resetQuiz = useCallback(() => {
    setCurrentQuestion(0);
    setScore(0);
    setShowResults(false);
    setAttempts([]);
    setQuestionStartedAt(Date.now());
    void refetchQuestions();
  }, [refetchQuestions]);

  const handlePickChapter = (id: number) => {
    setChapterId(id);
    setCurrentQuestion(0);
    setScore(0);
    setShowResults(false);
    setAttempts([]);
    setQuestionStartedAt(Date.now());
  };

  const handleAnswer = (letter: "A" | "B" | "C" | "D") => {
    const q = questions[currentQuestion];
    if (!q) return;
    const delta = letter === q.correctAnswer ? 1 : 0;
    const totalCorrect = score + delta;
    const elapsedMs = Math.max(300, Date.now() - questionStartedAt);
    const nextAttempts = [
      ...attempts,
      {
        questionId: q.id,
        selectedAnswer: letter,
        correctAnswer: q.correctAnswer as "A" | "B" | "C" | "D",
        elapsedMs,
        articleNumber: q.articleNumber ?? undefined,
        examBoard: q.examBoard,
        theme: q.theme,
      },
    ];
    setAttempts(nextAttempts);

    if (currentQuestion + 1 < questions.length) {
      setScore(totalCorrect);
      setCurrentQuestion((c) => c + 1);
      setQuestionStartedAt(Date.now());
    } else {
      setScore(totalCorrect);
      setShowResults(true);
      if (!STATIC_STUDY_MODE && user && chapterId !== null && questions.length > 0) {
        const avgTimeMs = Math.round(nextAttempts.reduce((s, a) => s + a.elapsedMs, 0) / Math.max(nextAttempts.length, 1));
        submitResult.mutate({
          chapterId,
          score: totalCorrect,
          totalQuestions: questions.length,
          correctAnswers: totalCorrect,
          wrongAnswers: Math.max(questions.length - totalCorrect, 0),
          avgTimeMs,
          board: filters.board || undefined,
          theme: filters.theme || undefined,
          attempts: nextAttempts.map((a) => ({
            questionId: a.questionId,
            articleNumber: a.articleNumber ?? undefined,
            examBoard: a.examBoard || undefined,
            theme: a.theme || undefined,
            selectedAnswer: a.selectedAnswer,
            correctAnswer: a.correctAnswer,
            elapsedMs: a.elapsedMs,
          })),
        });
      }
    }
  };

  const optionsForQuestion = useMemo(() => {
    const q = questions[currentQuestion];
    if (!q) return [];
    return [
      { letter: "A" as const, text: q.optionA },
      { letter: "B" as const, text: q.optionB },
      { letter: "C" as const, text: q.optionC },
      { letter: "D" as const, text: q.optionD },
    ];
  }, [questions, currentQuestion]);

  const chapterLabel = useMemo(() => {
    const ch = chapters.find((c) => c.id === chapterId);
    return ch ? `${ch.titleName} — ${ch.chapterTitle}` : "";
  }, [chapters, chapterId]);

  if (chapterId === null) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: "var(--pixel-page-bg)", color: "var(--pixel-text-main)" }}>
        <header
          className="sticky top-0 z-40"
          style={{ backgroundColor: "var(--pixel-header)", borderBottom: "2px solid var(--pixel-border-soft)" }}
        >
          <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
            <h1 className="text-2xl font-bold" style={{ color: "var(--pixel-text-main)" }}>
              Quiz CF/88
            </h1>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button onClick={() => setLocation("/")} className="btn-pixel">
                Voltar
              </Button>
            </div>
          </div>
        </header>

        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4" style={{ color: "#00ff41", textShadow: "2px 2px 0px #8800ff" }}>
              Escolha um capítulo
            </h2>
            <p className="text-lg mb-8" style={{ color: "var(--pixel-text-main)" }}>
              {STATIC_STUDY_MODE
                ? "Perguntas do pacote de estudo embutido. Responda no seu ritmo — nada é gravado no servidor."
                : "Selecione um capítulo abaixo para testar seus conhecimentos."}
            </p>
          </div>

          {chaptersLoading ? (
            <p style={{ color: "#16c784" }}>Carregando capítulos...</p>
          ) : chapters.length === 0 ? (
            <p className="text-center" style={{ color: "#ff6600" }}>
              {STATIC_STUDY_MODE
              ? "Nenhum capítulo no pacote. Rode `pnpm run study-pack` e confirme que content/study-pack.json existe."
              : "Sem capítulos no banco. Rode o seed e `pnpm run content:apply`."}
            </p>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {chapters.map((ch) => (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => handlePickChapter(ch.id)}
                  className="card-pixel p-6 text-left transition-transform hover:-translate-y-1 hover:border-[#00ff41]"
                  style={{ backgroundColor: "var(--pixel-surface)", borderColor: "var(--pixel-border-soft)" }}
                >
                  <p className="text-xs mb-1" style={{ color: "var(--pixel-text-muted)" }}>
                    {ch.titleName}
                  </p>
                  <h3 className="text-lg font-bold mb-2" style={{ color: "var(--pixel-text-main)", textShadow: "1px 1px 0px #000" }}>
                    {ch.chapterTitle}
                  </h3>
                  <p className="text-sm" style={{ color: "#16c784" }}>
                    Quiz por capítulo do texto organizado
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (questionsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--pixel-page-bg)", color: "var(--pixel-text-main)" }}>
        <p style={{ color: "#16c784" }}>Carregando perguntas...</p>
      </div>
    );
  }

  if (!questions.length) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: "var(--pixel-page-bg)", color: "var(--pixel-text-main)" }}>
        <header
          className="sticky top-0 z-40"
          style={{ backgroundColor: "var(--pixel-header)", borderBottom: "2px solid var(--pixel-border-soft)" }}
        >
          <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
            <h1 className="text-xl font-bold" style={{ color: "#00ff41" }}>
              Quiz {chapterLabel && `· ${chapterLabel}`}
            </h1>
            <Button onClick={() => setChapterId(null)} className="btn-pixel">
              Capítulos
            </Button>
          </div>
        </header>
        <div className="max-w-xl mx-auto px-4 py-16 text-center card-pixel" style={{ backgroundColor: "var(--pixel-surface)", borderColor: "var(--pixel-border-soft)" }}>
          <p className="mb-6" style={{ color: "var(--pixel-text-main)" }}>
            {STATIC_STUDY_MODE
              ? "Nenhuma pergunta para este capítulo no pacote atual."
              : "Ainda não há perguntas cadastradas para este capítulo."}
          </p>
            <Button
              className="btn-pixel mr-3"
              onClick={() =>
                setFilters({
                  board: "",
                  theme: "",
                  difficulty: "",
                  mode: "practice",
                })
              }
            >
              Limpar filtros
            </Button>
          <Button className="btn-pixel" onClick={() => setChapterId(null)}>
            Voltar aos capítulos
          </Button>
        </div>
      </div>
    );
  }

  const q = questions[currentQuestion];

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--pixel-page-bg)", color: "var(--pixel-text-main)" }}>
      <header className="sticky top-0 z-40" style={{ backgroundColor: "var(--pixel-header)", borderBottom: "2px solid var(--pixel-border-soft)" }}>
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-2">
          <h1 className="text-lg sm:text-2xl font-bold truncate" style={{ color: "var(--pixel-text-main)" }}>
            Quiz
          </h1>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button onClick={() => setChapterId(null)} className="btn-pixel shrink-0">
              Capítulos
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {!showResults ? (
          <div className="space-y-6">
            <div className="card-pixel" style={{ backgroundColor: "#0f3460", borderColor: "#16c784" }}>
              <div className="p-6">
                <div className="flex justify-between mb-4 text-sm">
                  <span style={{ color: "#00ff41" }}>
                    Pergunta {currentQuestion + 1}/{questions.length}
                  </span>
                  <span style={{ color: "#16c784" }}>
                    {STATIC_STUDY_MODE ? "Acertos" : "Pontos"}: {score}
                  </span>
                </div>
                <div
                  style={{
                    width: "100%",
                    height: "12px",
                    backgroundColor: "#1a1a2e",
                    border: "2px solid #16c784",
                  }}
                >
                  <div
                    style={{
                      width: `${((currentQuestion + 1) / questions.length) * 100}%`,
                      height: "100%",
                      backgroundColor: "#00ff41",
                      transition: "width 0.3s ease",
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="card-pixel" style={{ backgroundColor: "#0f3460", borderColor: "#ffff00" }}>
              <div className="p-6">
                <h2 className="text-lg sm:text-xl font-bold mb-6 break-words" style={{ color: "#ffff00" }}>
                  {q.question}
                </h2>
                <div className="space-y-3">
                  {optionsForQuestion.map(({ letter, text }) => (
                    <button
                      key={letter}
                      type="button"
                      onClick={() => handleAnswer(letter)}
                      className="w-full min-h-12 p-4 text-left text-sm sm:text-base rounded transition-all border-[3px] border-[#16c784] hover:bg-[#16c784] hover:text-[#1a1a2e] break-words"
                      style={{ backgroundColor: "#1a1a2e", color: "#ffffff" }}
                    >
                      <span className="font-bold">{letter}.</span> {text}
                    </button>
                  ))}
                </div>
                <p className="mt-6 text-xs" style={{ color: "#16c784" }}>
                  Ao terminar a rodada, confira gabarito e explicações no resumo final.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="card-pixel" style={{ backgroundColor: "#0f3460", borderColor: "#00ff41" }}>
              <div className="p-12 text-center">
                <h2 className="text-2xl sm:text-4xl font-bold mb-6 break-words px-2" style={{ color: "#00ff41", textShadow: "2px 2px 0px #8800ff" }}>
                  Fim do quiz
                </h2>
                <div
                  className="text-4xl sm:text-6xl font-bold mb-6 p-4 sm:p-6 rounded inline-block tabular-nums max-w-full break-all px-2"
                  style={{
                    color: "#ffff00",
                    backgroundColor: "#16c784",
                    textShadow: "2px 2px 0px #8800ff",
                  }}
                >
                  {score}/{questions.length}
                </div>
                <p className="text-lg mb-8" style={{ color: "#16c784" }}>
                  Você acertou {score} de {questions.length} perguntas neste capítulo.
                </p>
                <div className="flex gap-4 justify-center flex-wrap">
                  <Button onClick={resetQuiz} className="btn-pixel">
                    Repetir capítulo
                  </Button>
                  <Button onClick={() => setChapterId(null)} className="btn-pixel">
                    Outro capítulo
                  </Button>
                  <Button onClick={() => setLocation("/constituicao")} className="btn-pixel">
                    Ler artigos
                  </Button>
                </div>
              </div>
            </div>

            <div className="card-pixel p-6" style={{ backgroundColor: "#0f3460", borderColor: "#8800ff" }}>
              <h3 className="font-bold mb-4" style={{ color: "#ffff00" }}>
                Revisão rápida
              </h3>
              <ul className="space-y-3 text-left text-sm">
                {questions.map((item, i) => (
                  <li key={item.id} className="break-words" style={{ color: "#e0e0e0" }}>
                    <strong style={{ color: "#00ff41" }}>{i + 1}.</strong> {item.question}
                    <div className="text-xs mt-1" style={{ color: "#16c784" }}>
                      Gabarito: {item.correctAnswer}
                      {item.explanation ? ` — ${item.explanation}` : ""}
                    </div>
                    {attempts.find((a) => a.questionId === item.id)?.selectedAnswer &&
                      attempts.find((a) => a.questionId === item.id)?.selectedAnswer !== item.correctAnswer && (
                        <div className="text-xs mt-1" style={{ color: "#ff6666" }}>
                          Você errou aqui. Foque neste tema na próxima revisão.
                        </div>
                      )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
