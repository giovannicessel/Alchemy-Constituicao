import { Button } from "@/components/ui/button";
import { STATIC_STUDY_MODE } from "@/config/features";
import { trpc } from "@/lib/trpc";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useSearchParams } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import ThemeToggle from "@/components/ThemeToggle";
import { CONSTITUTIONAL_GROUPS, getConstitutionalGroupByArticle } from "@/lib/constitutionalGroups";

export default function FlashcardsPage() {
  const [, setLocation] = useLocation();
  const [searchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();
  const [articleId, setArticleId] = useState<number | null>(null);
  const [groupKey, setGroupKey] = useState<string>("all");
  const [currentCard, setCurrentCard] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    const raw = searchParams.get("articleId");
    if (raw) {
      const n = Number.parseInt(raw, 10);
      if (!Number.isNaN(n)) setArticleId(n);
    } else {
      setArticleId(null);
    }
  }, [searchParams]);

  const { data: articles = [], isLoading } = trpc.constitution.listArticles.useQuery({
    limit: 300,
    offset: 0,
  });

  const { data: flashcards = [], isLoading: cardsLoading } = trpc.constitution.getFlashcards.useQuery(
    articleId ?? 0,
    { enabled: articleId !== null }
  );
  const { data: dueFlashcards = [] } = trpc.constitution.getDueFlashcards.useQuery(
    { limit: 30 },
    { enabled: isAuthenticated && !STATIC_STUDY_MODE }
  );
  const reviewMutation = trpc.constitution.reviewFlashcard.useMutation({
    onSuccess: () => toast.success("Revisão registrada."),
    onError: () => toast.error("Não foi possível salvar revisão."),
  });

  useEffect(() => {
    setCurrentCard(0);
    setIsFlipped(false);
  }, [articleId]);

  const current = flashcards[currentCard];
  const progressPct =
    flashcards.length > 0 ? Math.round(((currentCard + (isFlipped ? 0.5 : 0)) / flashcards.length) * 100) : 0;

  const articleSummary = useMemo(() => {
    const art = articles.find((a) => a.id === articleId);
    return art ? `Art. ${art.number} · ${getConstitutionalGroupByArticle(art.number).label}` : "";
  }, [articles, articleId]);

  const groupedArticles = useMemo(() => {
    if (groupKey === "all") return articles;
    const group = CONSTITUTIONAL_GROUPS.find((g) => g.key === groupKey);
    if (!group) return articles;
    return articles.filter((a) => a.number >= group.start && a.number <= group.end);
  }, [articles, groupKey]);

  if (articleId === null) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: "var(--pixel-page-bg)", color: "var(--pixel-text-main)" }}>
        <header className="sticky top-0 z-40" style={{ backgroundColor: "var(--pixel-header)", borderBottom: "2px solid var(--pixel-border-soft)" }}>
          <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
            <h1 className="text-2xl font-bold" style={{ color: "var(--pixel-text-main)" }}>
              Flashcards CF/88
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
              Escolha um artigo
            </h2>
            {!STATIC_STUDY_MODE && isAuthenticated && (
              <p className="text-sm mb-2" style={{ color: "#ffff00" }}>
                Revisar hoje: {dueFlashcards.length} cartões pendentes
              </p>
            )}
            <p className="text-lg mb-8" style={{ color: "#16c784" }}>
              {STATIC_STUDY_MODE
                ? "Cartões do pacote embutido por artigo."
                : "Cartões vêm do banco por artigo (importe o pacote didático para popular)."}
            </p>
            <div className="flex justify-center">
              <select
                value={groupKey}
                onChange={(e) => setGroupKey(e.target.value)}
                className="input-pixel px-3 py-2"
                style={{ minWidth: 300 }}
              >
                <option value="all">Todos os blocos temáticos</option>
                {CONSTITUTIONAL_GROUPS.map((g) => (
                  <option key={g.key} value={g.key}>
                    {g.label} ({g.start}-{g.end})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {isLoading ? (
            <p style={{ color: "#16c784" }}>Carregando artigos...</p>
          ) : groupedArticles.length === 0 ? (
            <p className="text-center" style={{ color: "#ff6600" }}>
              {STATIC_STUDY_MODE
                ? "Sem artigos no study-pack.json. Rode pnpm run study-pack."
                : "Sem artigos. Rode o seed e importe o conteúdo."}
            </p>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[70vh] overflow-y-auto">
              {groupedArticles.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setArticleId(a.id)}
                  className="card-pixel p-6 text-left transition-all border-2 border-[#16c784] hover:border-[#00ff41]"
                  style={{ backgroundColor: "#0f3460" }}
                >
                  <p className="text-xs mb-1" style={{ color: "#ff00ff" }}>
                    {getConstitutionalGroupByArticle(a.number).label}
                  </p>
                  <h3 className="text-xl font-bold mb-2" style={{ color: "#ffff00" }}>
                    Art. {a.number}
                  </h3>
                  <p className="text-sm line-clamp-2" style={{ color: "#16c784" }}>
                    {a.chapterTitle}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (cardsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#1a1a2e" }}>
        <p style={{ color: "#16c784" }}>Carregando cartões...</p>
      </div>
    );
  }

  if (!flashcards.length) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: "#1a1a2e" }}>
        <header className="sticky top-0 z-40" style={{ backgroundColor: "#0f3460", borderBottom: "4px solid #16c784" }}>
          <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
            <h1 className="text-xl font-bold truncate" style={{ color: "#00ff41" }}>
              Flashcards {articleSummary}
            </h1>
            <Button onClick={() => setArticleId(null)} className="btn-pixel shrink-0">
              Artigos
            </Button>
          </div>
        </header>
        <div className="max-w-lg mx-auto px-4 py-16 text-center card-pixel" style={{ backgroundColor: "#0f3460", borderColor: "#ff6600" }}>
          <p style={{ color: "#ffffff" }} className="mb-6">
            {STATIC_STUDY_MODE
              ? "Este artigo ainda não tem cartões no pacote. Amplie content/didactic-bundle.json e rode pnpm run study-pack."
              : "Nenhum flashcard para este artigo ainda. Amplie o pacote didático ou gere cartões no JSON de importação."}
          </p>
          <Button className="btn-pixel" onClick={() => setArticleId(null)}>
            Escolher outro artigo
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--pixel-page-bg)", color: "var(--pixel-text-main)" }}>
      <header className="sticky top-0 z-40" style={{ backgroundColor: "var(--pixel-header)", borderBottom: "2px solid var(--pixel-border-soft)" }}>
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h1 className="text-lg font-bold truncate" style={{ color: "#00ff41" }}>
              Flashcards · {articleSummary}
            </h1>
            <p className="text-xs truncate" style={{ color: "#16c784" }}>
              {currentCard + 1} / {flashcards.length}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button onClick={() => setArticleId(null)} className="btn-pixel shrink-0">
              Artigos
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-xl mx-auto px-4 py-10 space-y-8">
        <div className="h-3 rounded overflow-hidden border-2 border-[#16c784]" style={{ backgroundColor: "#1a1a2e" }}>
          <motion.div
            className="h-full"
            style={{ backgroundColor: "#00ff41" }}
            animate={{ width: `${progressPct}%` }}
            transition={{ type: "spring", stiffness: 120, damping: 20 }}
          />
        </div>

        <motion.div
          layout
          className="relative min-h-[280px] cursor-pointer rounded-lg border-4 p-8 flex flex-col justify-center text-center"
          style={{
            borderColor: isFlipped ? "#8800ff" : "#16c784",
            backgroundColor: "#0f3460",
          }}
          onClick={() => setIsFlipped(!isFlipped)}
          key={`${currentCard}-${isFlipped}`}
          initial={{ opacity: 0.85, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
        >
          {!isFlipped ? (
            <>
              <p className="text-xs mb-4 uppercase tracking-widest" style={{ color: "#ff00ff" }}>
                Frente
              </p>
              <p className="text-xl font-semibold" style={{ color: "#00ff41" }}>
                {current?.front}
              </p>
              <p className="mt-6 text-sm" style={{ color: "#16c784" }}>
                Toque para virar
              </p>
            </>
          ) : (
            <>
              <p className="text-xs mb-4 uppercase tracking-widest" style={{ color: "#ffff00" }}>
                Verso
              </p>
              <p className="text-lg leading-relaxed" style={{ color: "#ffffff" }}>
                {current?.back}
              </p>
              <p className="mt-6 text-sm" style={{ color: "#16c784" }}>
                Toque para voltar à frente
              </p>
            </>
          )}
        </motion.div>

        <div className="flex gap-4 justify-center flex-wrap">
          <Button
            className="btn-pixel"
            disabled={currentCard === 0}
            onClick={(e) => {
              e.stopPropagation();
              setCurrentCard((c) => Math.max(0, c - 1));
              setIsFlipped(false);
            }}
          >
            Anterior
          </Button>
          <Button
            className="btn-pixel"
            disabled={currentCard >= flashcards.length - 1}
            onClick={(e) => {
              e.stopPropagation();
              setCurrentCard((c) => Math.min(flashcards.length - 1, c + 1));
              setIsFlipped(false);
            }}
          >
            Próximo
          </Button>
        </div>

        {!STATIC_STUDY_MODE && isAuthenticated && (
          <div className="card-pixel p-4" style={{ backgroundColor: "#0f3460", borderColor: "#16c784" }}>
            <p className="text-sm mb-3" style={{ color: "#16c784" }}>
              Avalie sua lembrança para revisão espaçada (0 = esqueci, 5 = muito fácil)
            </p>
            <div className="flex flex-wrap gap-2">
              {[0, 1, 2, 3, 4, 5].map((grade) => (
                <Button
                  key={grade}
                  className="btn-pixel"
                  onClick={() => {
                    if (!current) return;
                    reviewMutation.mutate({ flashcardId: current.id, grade });
                  }}
                >
                  {grade}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
