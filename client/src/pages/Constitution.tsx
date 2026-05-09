import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { STATIC_STUDY_MODE } from "@/config/features";
import ThemeToggle from "@/components/ThemeToggle";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookMarked,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Headphones,
  List,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

type ArticleRow = {
  id: number;
  number: number;
  chapterId: number;
  originalText: string;
  simplifiedText: string | null;
  curiosity: string | null;
  practicalExample: string | null;
  keywordsTags: string | null;
  chapterTitle: string;
  titleName: string;
  titleOrder: number;
  chapterOrder: number;
  audiobookUrl?: string | null;
  audiobookTitle?: string | null;
  textQualityScore?: number;
};

function splitLegalTextForDisplay(text: string): string[] {
  return String(text || "")
    .replace(/\s+(§\s*\d+º?)/g, "\n$1")
    .replace(/\s+(Parágrafo único)/gi, "\n$1")
    .replace(/\s+([IVXLCDM]{1,6}\s*[–-])/g, "\n$1")
    .replace(/\s+([a-z]\))/g, "\n$1")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

type ArticleNavInnerProps = {
  articlesLoading: boolean;
  filteredGrouped: Map<string, ArticleRow[]>;
  openTitles: Record<string, boolean>;
  toggleTitle: (title: string) => void;
  selectedArticle: ArticleRow | undefined;
  setSelectedArticleId: (id: number) => void;
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  onArticlePicked?: () => void;
};

function ConstitutionArticleNavInner({
  articlesLoading,
  filteredGrouped,
  openTitles,
  toggleTitle,
  selectedArticle,
  setSelectedArticleId,
  searchTerm,
  setSearchTerm,
  onArticlePicked,
}: ArticleNavInnerProps) {
  return (
    <>
      <h2
        className="text-lg font-bold mb-4"
        style={{ color: "var(--pixel-text-main)", textShadow: "1px 1px 0px #000" }}
      >
        Navegar
      </h2>
      <div className="relative mb-4">
        <Search className="absolute left-2 top-2 w-4 h-4" style={{ color: "var(--pixel-text-muted)" }} />
        <Input
          placeholder="Buscar artigo ou palavra..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input-pixel pl-8 w-full"
          style={{
            backgroundColor: "var(--pixel-page-bg)",
            color: "var(--pixel-text-main)",
            borderColor: "var(--pixel-border-soft)",
          }}
        />
      </div>

      <div className="space-y-2 max-h-[min(70vh,560px)] overflow-y-auto pr-1">
        {articlesLoading ? (
          <div style={{ color: "var(--pixel-text-muted)" }}>Carregando...</div>
        ) : (
          Array.from(filteredGrouped.entries()).map(([titleName, titleArticles]) => (
            <Collapsible
              key={titleName}
              open={openTitles[titleName] ?? true}
              onOpenChange={() => toggleTitle(titleName)}
            >
              <CollapsibleTrigger className="flex w-full items-center justify-between rounded px-2 py-2 text-left font-bold text-sm hover:bg-[var(--pixel-border-soft)]/20">
                <span style={{ color: "var(--pixel-text-main)" }} className="truncate pr-2">
                  {titleName}
                </span>
                <ChevronDown
                  className={cn(
                    "w-4 h-4 shrink-0 transition-transform",
                    openTitles[titleName] ?? true ? "rotate-180" : ""
                  )}
                  style={{ color: "var(--pixel-text-muted)" }}
                />
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-1 pt-1">
                {titleArticles.map((article) => (
                  <button
                    key={article.id}
                    type="button"
                    onClick={() => {
                      setSelectedArticleId(article.id);
                      onArticlePicked?.();
                    }}
                    className={cn(
                      "w-full text-left p-2 rounded transition-all border-2",
                      selectedArticle?.id === article.id
                        ? "border-[var(--pixel-border-soft)] shadow-[2px_2px_0_#000]"
                        : "border-transparent"
                    )}
                    style={{
                      backgroundColor:
                        selectedArticle?.id === article.id ? "var(--pixel-border-soft)" : "transparent",
                      color:
                        selectedArticle?.id === article.id ? "var(--pixel-page-bg)" : "var(--pixel-text-muted)",
                    }}
                  >
                    <div className="text-xs font-bold">Art. {article.number}</div>
                    <div className="text-[11px] opacity-90 truncate">{article.chapterTitle}</div>
                  </button>
                ))}
              </CollapsibleContent>
            </Collapsible>
          ))
        )}
      </div>
    </>
  );
}

export default function Constitution() {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  const utils = trpc.useUtils();

  const [tab, setTab] = useState<"legal" | "extras" | "story">(() => {
    if (typeof window === "undefined") return "legal";
    const t = new URLSearchParams(window.location.search).get("tab");
    return t === "extras" || t === "legal" || t === "story" ? t : "legal";
  });

  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("tab");
    if (t === "extras" || t === "legal" || t === "story") setTab(t);
  }, [location]);

  useEffect(() => {
    const articleParam = new URLSearchParams(window.location.search).get("article");
    if (!articleParam) return;
    const parsed = Number.parseInt(articleParam, 10);
    if (!Number.isNaN(parsed) && parsed > 0) {
      setSelectedArticleId(parsed);
    }
  }, [location]);

  const [selectedArticleId, setSelectedArticleId] = useState<number | null>(null);
  const [showAudioPlayer, setShowAudioPlayer] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [openTitles, setOpenTitles] = useState<Record<string, boolean>>({});
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const markRead = trpc.constitution.markArticleAsRead.useMutation({
    onSuccess: () => utils.constitution.getUserProgress.invalidate(),
  });

  const { data: articles = [], isLoading: articlesLoading } = trpc.constitution.listArticles.useQuery({
    limit: 500,
    offset: 0,
  });

  const { data: flashcards = [] } = trpc.constitution.getFlashcards.useQuery(
    selectedArticleId ?? 0,
    { enabled: Boolean(selectedArticleId) }
  );

  const selectedArticle = useMemo(() => {
    const list = articles as ArticleRow[];
    if (!list.length) return undefined;
    const chosen = list.find((a) => a.id === selectedArticleId);
    return chosen ?? list[0];
  }, [articles, selectedArticleId]);

  useEffect(() => {
    const list = articles as ArticleRow[];
    if (!list.length || selectedArticleId !== null) return;
    setSelectedArticleId(list[0].id);
  }, [articles, selectedArticleId]);

  useEffect(() => {
    if (STATIC_STUDY_MODE || !selectedArticle?.id || !user?.id) return;
    const t = window.setTimeout(() => {
      markRead.mutate(selectedArticle.id);
    }, 2500);
    return () => window.clearTimeout(t);
  }, [selectedArticle?.id, user?.id, markRead]);

  const filteredArticles = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    const list = articles as ArticleRow[];
    if (!q) return list;
    return list.filter(
      (a) =>
        String(a.number).includes(q) ||
        a.originalText?.toLowerCase().includes(q) ||
        (a.simplifiedText && a.simplifiedText.toLowerCase().includes(q)) ||
        (a.keywordsTags && a.keywordsTags.toLowerCase().includes(q)) ||
        a.chapterTitle?.toLowerCase().includes(q)
    );
  }, [articles, searchTerm]);

  const filteredGrouped = useMemo(() => {
    const map = new Map<string, ArticleRow[]>();
    for (const a of filteredArticles) {
      const key = a.titleName;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(a);
    }
    return map;
  }, [filteredArticles]);

  const flatFiltered = filteredArticles;
  const currentIndex = flatFiltered.findIndex((a) => a.id === selectedArticle?.id);
  const hasNext = currentIndex >= 0 && currentIndex < flatFiltered.length - 1;
  const hasPrev = currentIndex > 0;

  const goNext = useCallback(() => {
    if (hasNext && flatFiltered.length) {
      setSelectedArticleId(flatFiltered[currentIndex + 1].id);
    }
  }, [hasNext, flatFiltered, currentIndex]);

  const goPrev = useCallback(() => {
    if (hasPrev && flatFiltered.length) {
      setSelectedArticleId(flatFiltered[currentIndex - 1].id);
    }
  }, [hasPrev, flatFiltered, currentIndex]);

  const toggleTitle = (title: string) => {
    setOpenTitles((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  const youtubeVideoId = useMemo(() => {
    const url = selectedArticle?.audiobookUrl;
    if (!url) return null;
    try {
      const parsed = new URL(url);
      const id = parsed.searchParams.get("v");
      return id || null;
    } catch {
      return null;
    }
  }, [selectedArticle?.audiobookUrl]);

  const youtubeEmbedUrl = useMemo(() => {
    if (!youtubeVideoId) return null;
    return `https://www.youtube.com/embed/${youtubeVideoId}`;
  }, [youtubeVideoId]);

  useEffect(() => {
    setShowAudioPlayer(false);
  }, [selectedArticle?.id]);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--pixel-page-bg)", color: "var(--pixel-text-main)" }}>
      <header
        className="sticky top-0 z-40"
        style={{ backgroundColor: "var(--pixel-header)", borderBottom: "2px solid var(--pixel-border-soft)" }}
      >
        <div className="max-w-6xl mx-auto px-4 min-h-16 py-2 flex flex-wrap items-center justify-between gap-x-2 gap-y-2">
          <div className="flex min-w-0 items-center gap-2">
            <Sparkles className="w-6 h-6 sm:w-7 sm:h-7 shrink-0" style={{ color: "#ff00ff" }} />
            <h1
              className="text-lg sm:text-xl md:text-2xl font-bold truncate"
              style={{ color: "#00ff41", textShadow: "4px 4px 0px #8800ff" }}
            >
              CF/88 viva
            </h1>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button
              type="button"
              className="btn-pixel gap-2 lg:hidden min-h-11"
              onClick={() => setMobileNavOpen(true)}
            >
              <List className="h-4 w-4 shrink-0" />
              Índice
            </Button>
            <ThemeToggle />
            <Button onClick={() => setLocation("/")} className="btn-pixel min-h-11">
              Voltar
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {!articles.length && !articlesLoading ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="card-pixel p-10 text-center max-w-xl mx-auto"
            style={{ backgroundColor: "#0f3460", borderColor: "#16c784" }}
          >
            <p className="text-lg mb-4" style={{ color: "#16c784" }}>
              {STATIC_STUDY_MODE
                ? "Não foi possível carregar o pacote de estudo. Verifique se o ficheiro content/study-pack.json existe no projeto e gere-o com:"
                : "Ainda não há artigos na base de dados. Rode o seed do MySQL e importe o conteúdo:"}
            </p>
            <code className="block text-sm text-left p-4 rounded" style={{ backgroundColor: "#1a1a2e", color: "#00ff41" }}>
              {STATIC_STUDY_MODE ? (
                <>
                  pnpm run study-pack
                  <br />
                  (opcional DB) pnpm run seed-db &amp;&amp; pnpm run content:apply
                </>
              ) : (
                <>
                  pnpm run seed-db
                  <br />
                  pnpm run content:apply
                </>
              )}
            </code>
          </motion.div>
        ) : (
          <>
            <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
              <SheetContent
                side="left"
                className="w-[min(100vw-0.5rem,22rem)] overflow-y-auto border-[var(--pixel-border-soft)] bg-[var(--pixel-page-bg)] p-4 sm:max-w-sm"
              >
                <SheetHeader className="p-0 text-left">
                  <SheetTitle className="text-base" style={{ color: "var(--pixel-text-main)" }}>
                    Índice de artigos
                  </SheetTitle>
                </SheetHeader>
                <div
                  className="card-pixel mt-4"
                  style={{ backgroundColor: "var(--pixel-surface)", borderColor: "var(--pixel-border-soft)" }}
                >
                  <div className="p-4">
                    <ConstitutionArticleNavInner
                      articlesLoading={articlesLoading}
                      filteredGrouped={filteredGrouped}
                      openTitles={openTitles}
                      toggleTitle={toggleTitle}
                      selectedArticle={selectedArticle}
                      setSelectedArticleId={setSelectedArticleId}
                      searchTerm={searchTerm}
                      setSearchTerm={setSearchTerm}
                      onArticlePicked={() => setMobileNavOpen(false)}
                    />
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            <div className="grid lg:grid-cols-4 gap-6">
              <div className="hidden lg:block lg:col-span-1 space-y-4">
                <div className="card-pixel" style={{ backgroundColor: "var(--pixel-surface)", borderColor: "var(--pixel-border-soft)" }}>
                  <div className="p-4">
                    <ConstitutionArticleNavInner
                      articlesLoading={articlesLoading}
                      filteredGrouped={filteredGrouped}
                      openTitles={openTitles}
                      toggleTitle={toggleTitle}
                      selectedArticle={selectedArticle}
                      setSelectedArticleId={setSelectedArticleId}
                      searchTerm={searchTerm}
                      setSearchTerm={setSearchTerm}
                    />
                  </div>
                </div>
              </div>

              <div className="lg:col-span-3 pb-28 lg:pb-0 min-w-0">
              <AnimatePresence mode="wait">
                {selectedArticle ? (
                  <motion.div
                    key={selectedArticle.id}
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -16 }}
                    transition={{ duration: 0.22 }}
                    className="space-y-6"
                  >
                    <div className="card-pixel" style={{ backgroundColor: "var(--pixel-surface)", borderColor: "var(--pixel-border-soft)" }}>
                      <div className="p-6">
                        <p className="text-xs uppercase tracking-widest mb-2" style={{ color: "var(--pixel-text-muted)" }}>
                          {selectedArticle.titleName} · {selectedArticle.chapterTitle}
                        </p>
                        <h2
                          className="text-3xl font-bold mb-2"
                          style={{ color: "var(--pixel-text-main)", textShadow: "2px 2px 0px #000" }}
                        >
                          Artigo {selectedArticle.number}
                        </h2>
                        <div className="flex gap-2 flex-wrap">
                          {selectedArticle.keywordsTags
                            ?.split(",")
                            .filter(Boolean)
                            .map((tag: string) => (
                              <span
                                key={tag}
                                className="px-2 py-1 text-xs rounded"
                                style={{ backgroundColor: "var(--pixel-border-soft)", color: "var(--pixel-page-bg)" }}
                              >
                                {tag.trim()}
                              </span>
                            ))}
                        </div>
                        {selectedArticle.audiobookUrl && (
                          <div className="mt-4">
                            <div className="flex flex-wrap gap-3">
                              {youtubeEmbedUrl && (
                                <Button
                                  type="button"
                                  className="btn-pixel"
                                  onClick={() => setShowAudioPlayer((v) => !v)}
                                >
                                  {showAudioPlayer ? (
                                    <>
                                      <X className="w-4 h-4 mr-2" />
                                      Fechar mini player
                                    </>
                                  ) : (
                                    <>
                                      <Headphones className="w-4 h-4 mr-2" />
                                      Ouvir no mini player
                                    </>
                                  )}
                                </Button>
                              )}
                              <Button
                                type="button"
                                className="btn-pixel"
                                onClick={() =>
                                  window.open(selectedArticle.audiobookUrl ?? "", "_blank", "noopener,noreferrer")
                                }
                              >
                                <Headphones className="w-4 h-4 mr-2" />
                                Abrir no YouTube
                              </Button>
                            </div>
                            {selectedArticle.audiobookTitle ? (
                              <p className="text-xs mt-2" style={{ color: "var(--pixel-text-muted)" }}>
                                {selectedArticle.audiobookTitle}
                              </p>
                            ) : null}
                            {showAudioPlayer && youtubeEmbedUrl && (
                              <div
                                className="mt-3 rounded overflow-hidden border-2"
                                style={{ borderColor: "var(--pixel-border-soft)", backgroundColor: "var(--pixel-page-bg)" }}
                              >
                                <iframe
                                  title={`Audiobook Artigo ${selectedArticle.number}`}
                                  src={youtubeEmbedUrl}
                                  className="w-full aspect-video"
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                  allowFullScreen
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <Tabs
                      value={tab}
                      onValueChange={(v) => {
                        const next = v as "legal" | "extras" | "story";
                        setTab(next);
                        const url = new URL(window.location.href);
                        url.searchParams.set("tab", next);
                        window.history.replaceState(null, "", `${url.pathname}?${url.searchParams.toString()}`);
                      }}
                      className="w-full"
                    >
                      <div
                        className="md:hidden mb-3 p-2 rounded border flex gap-2"
                        style={{ borderColor: "var(--pixel-border-soft)", backgroundColor: "var(--pixel-surface)" }}
                      >
                        <Button
                          type="button"
                          className="btn-pixel flex-1"
                          onClick={() => setTab("legal")}
                          style={{
                            opacity: tab === "legal" ? 1 : 0.75,
                            borderColor: tab === "legal" ? "var(--pixel-text-main)" : "var(--pixel-border-soft)",
                          }}
                        >
                          Texto Legal
                        </Button>
                      </div>

                      <TabsList className="w-full grid grid-cols-2 mb-4 h-auto p-1" style={{ backgroundColor: "var(--pixel-page-bg)", border: "2px solid var(--pixel-border-soft)" }}>
                        {!!selectedArticle?.simplifiedText && (
                          <TabsTrigger value="story" className="text-xs sm:text-sm text-foreground">
                            🎓 Em boa língua
                          </TabsTrigger>
                        )}
                        <TabsTrigger value="legal" className="text-xs sm:text-sm text-foreground">
                           ⚖️ Texto legal
                        </TabsTrigger>
                        <TabsTrigger value="extras" className="text-xs sm:text-sm text-foreground">
                          ✨ Extras
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="story" className="flex-1 overflow-y-auto outline-none p-4 pb-20 custom-scrollbar mt-0 border-0">
                        {!!selectedArticle?.simplifiedText && (
                          <div className="prose prose-sm sm:prose-base max-w-none text-[var(--pixel-text-main)]">
                            <div className="bg-[var(--pixel-surface)] border-4 border-[var(--pixel-border-soft)] p-4 sm:p-6 shadow-[4px_4px_0px_rgba(0,0,0,0.1)] relative">
                              <h3 className="font-pixel text-yellow-500 mt-0 mb-4 tracking-wide text-sm flex items-center gap-2">
                                <span className="text-xl">🎓</span>
                                Tradução Didática
                              </h3>
                              <div className="font-sans leading-relaxed text-sm sm:text-base opacity-90 whitespace-pre-wrap space-y-2">
                                {selectedArticle.simplifiedText?.split("\n").map((line, idx) => {
                                  const trimmed = line.trim();
                                  if (!trimmed) return null;
                                  
                                  // Regex to find **text** and replace with <strong>text</strong>
                                  const renderBold = (str: string) => {
                                    const parts = str.split(/(\*\*.*?\*\*)/g);
                                    return parts.map((part, i) => {
                                      if (part.startsWith("**") && part.endsWith("**")) {
                                        return <strong key={i} className="font-bold text-[var(--pixel-text-main)]">{part.slice(2, -2)}</strong>;
                                      }
                                      return part;
                                    });
                                  };

                                  if (trimmed.startsWith("* ") || trimmed.startsWith("- ")) {
                                    return (
                                      <div key={idx} className="flex gap-2 ml-2">
                                        <span className="text-yellow-500">•</span>
                                        <span>{renderBold(trimmed.slice(2))}</span>
                                      </div>
                                    );
                                  }

                                  return <div key={idx}>{renderBold(trimmed)}</div>;
                                })}
                              </div>
                            </div>
                          </div>
                        )}
                      </TabsContent>

                      <TabsContent value="legal">
                        <div className="card-pixel" style={{ backgroundColor: "var(--pixel-surface)", borderColor: "var(--pixel-border-soft)" }}>
                          <div className="p-6 md:p-8 max-h-[480px] overflow-y-auto">
                            <h3 className="text-lg font-bold mb-4" style={{ color: "var(--pixel-text-main)", textShadow: "1px 1px 0px #000" }}>
                              Texto constitucional (consolidado)
                            </h3>
                            <ul className="space-y-2">
                              {splitLegalTextForDisplay(selectedArticle.originalText).map((line, index) => {
                                const isItem = /^([IVXLCDM]{1,6}\s*[–-]|§\s*\d+º?|Parágrafo único|[a-z]\))/i.test(line);
                                return (
                                  <li
                                    key={`${selectedArticle.id}-${index}`}
                                    className={cn(
                                      "text-sm leading-relaxed break-words",
                                      isItem ? "pl-4 border-l-2" : ""
                                    )}
                                    style={{ color: "var(--pixel-text-main)", borderColor: isItem ? "var(--pixel-border-soft)" : undefined }}
                                  >
                                    {line}
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="extras">
                        <div className="grid md:grid-cols-2 gap-6">
                          <div className="card-pixel" style={{ backgroundColor: "var(--pixel-surface)", borderColor: "var(--pixel-border-soft)" }}>
                            <div className="p-6">
                              <h3 className="text-lg font-bold mb-4" style={{ color: "var(--pixel-text-main)", textShadow: "1px 1px 0px #000" }}>
                                💡 Exemplo prático
                              </h3>
                              <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "var(--pixel-text-main)" }}>
                                {selectedArticle.practicalExample?.trim() ||
                                  "Quando o pacote didático for aplicado, aqui aparecem situações do cotidiano ligadas ao artigo."}
                              </p>
                            </div>
                          </div>
                          <div className="card-pixel" style={{ backgroundColor: "var(--pixel-surface)", borderColor: "var(--pixel-border-soft)" }}>
                            <div className="p-6">
                              <h3 className="text-lg font-bold mb-4" style={{ color: "var(--pixel-text-main)", textShadow: "1px 1px 0px #000" }}>
                                🎯 Curiosidade
                              </h3>
                              <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "var(--pixel-text-main)" }}>
                                {selectedArticle.curiosity?.trim() ||
                                  "Curiosidades históricas e comparativos aparecem aqui após a importação do conteúdo."}
                              </p>
                            </div>
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>

                    {flashcards.length > 0 && (
                      <div className="card-pixel" style={{ backgroundColor: "var(--pixel-surface)", borderColor: "var(--pixel-border-soft)" }}>
                        <div className="p-6">
                          <h3
                            className="text-lg font-bold mb-4 flex items-center gap-2"
                            style={{ color: "var(--pixel-text-main)", textShadow: "1px 1px 0px #000" }}
                          >
                            <BookMarked className="w-5 h-5" />
                            Flashcards deste artigo ({flashcards.length})
                          </h3>
                          <ul className="space-y-3">
                            {flashcards.map((card) => (
                              <li
                                key={card.id}
                                className="rounded border-2 p-4"
                                style={{ borderColor: "var(--pixel-border-soft)", backgroundColor: "var(--pixel-page-bg)" }}
                              >
                                <p className="font-semibold mb-1" style={{ color: "var(--pixel-text-main)" }}>
                                  {card.front}
                                </p>
                                <p className="text-sm" style={{ color: "var(--pixel-text-muted)" }}>
                                  {card.back}
                                </p>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}

                    <div
                      className={cn(
                        "flex flex-wrap gap-3 sm:gap-4 justify-center items-center",
                        "lg:static lg:border-t-0 lg:bg-transparent lg:p-0 lg:shadow-none",
                        "fixed bottom-0 left-0 right-0 z-30 border-t-2 px-3 py-3",
                        "bg-[var(--pixel-page-bg)]/95 backdrop-blur supports-[backdrop-filter]:backdrop-blur-md"
                      )}
                      style={{
                        borderColor: "var(--pixel-border-soft)",
                        paddingBottom: "max(0.75rem, env(safe-area-inset-bottom, 0px))",
                      }}
                    >
                      <Button
                        onClick={goPrev}
                        disabled={!hasPrev}
                        className="btn-pixel min-h-11"
                        style={{ opacity: hasPrev ? 1 : 0.45 }}
                      >
                        <ChevronLeft className="w-4 h-4 mr-2" />
                        Anterior
                      </Button>

                      <div
                        className="px-3 sm:px-4 py-2 rounded text-sm sm:text-base font-bold tabular-nums"
                        style={{
                          backgroundColor: "var(--pixel-border-soft)",
                          color: "var(--pixel-page-bg)",
                          border: "2px solid var(--pixel-text-main)",
                        }}
                      >
                        {currentIndex >= 0 ? currentIndex + 1 : 0} / {flatFiltered.length || 0}
                      </div>

                      <Button
                        onClick={goNext}
                        disabled={!hasNext}
                        className="btn-pixel min-h-11"
                        style={{ opacity: hasNext ? 1 : 0.45 }}
                      >
                        Próximo
                        <ChevronRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>

                    <div className="flex flex-wrap gap-4 justify-center">
                      <Button type="button" className="btn-pixel" asChild>
                        <Link href={`/quiz?chapterId=${selectedArticle.chapterId}`}>📝 Quiz deste capítulo</Link>
                      </Button>
                      <Button type="button" className="btn-pixel" asChild>
                        <Link href={`/flashcards?articleId=${selectedArticle.id}`}>💾 Modo flashcards</Link>
                      </Button>
                    </div>
                  </motion.div>
                ) : (
                  <div
                    className="card-pixel text-center p-12"
                    style={{ backgroundColor: "var(--pixel-surface)", borderColor: "var(--pixel-border-soft)" }}
                  >
                    <p style={{ color: "var(--pixel-text-main)" }}>Selecione um artigo na lista</p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
          </>
        )}
      </div>
    </div>
  );
}
