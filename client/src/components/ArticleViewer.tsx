import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, BookMarked, Headphones, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Article {
  id: number;
  number: number;
  originalText: string;
  simplifiedText?: string | null;
  curiosity?: string | null;
  practicalExample?: string | null;
  keywordsTags?: string | null;
  chapterId?: number;
  audiobookUrl?: string | null;
  audiobookTitle?: string | null;
}

interface ArticleViewerProps {
  article: Article;
  onMarkAsRead?: (articleId: number) => void;
}

export default function ArticleViewer({ article, onMarkAsRead }: ArticleViewerProps) {
  const [showCuriosity, setShowCuriosity] = useState(false);
  const [showAudioPlayer, setShowAudioPlayer] = useState(false);

  const keywords = article.keywordsTags?.split(",").map((k) => k.trim()) || [];
  const youtubeEmbedUrl = useMemo(() => {
    const url = article.audiobookUrl;
    if (!url) return null;
    try {
      const parsed = new URL(url);
      const videoId = parsed.searchParams.get("v");
      if (!videoId) return null;
      return `https://www.youtube.com/embed/${videoId}`;
    } catch {
      return null;
    }
  }, [article.audiobookUrl]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
            Artigo {article.number}
          </h1>
          {keywords.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {keywords.map((keyword) => (
                <Badge key={keyword} variant="secondary" className="text-xs">
                  {keyword}
                </Badge>
              ))}
            </div>
          )}
        </div>
        <Button
          onClick={() => onMarkAsRead?.(article.id)}
          variant="outline"
          className="gap-2 w-full min-h-11 shrink-0 sm:w-auto"
        >
          <BookMarked className="w-4 h-4" />
          Marcar como lido
        </Button>
      </div>

      {article.audiobookUrl && (
        <Card className="border-violet-200 dark:border-violet-800">
          <CardHeader className="bg-gradient-to-r from-violet-50 to-fuchsia-50 dark:from-violet-950 dark:to-fuchsia-950">
            <CardTitle className="text-lg text-violet-900 dark:text-violet-100 flex items-center gap-2">
              <Headphones className="w-5 h-5" />
              Audiobook do artigo
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-3">
            <div className="flex flex-wrap gap-2">
              {youtubeEmbedUrl && (
                <Button type="button" variant="outline" onClick={() => setShowAudioPlayer((v) => !v)}>
                  {showAudioPlayer ? <X className="w-4 h-4 mr-2" /> : <Headphones className="w-4 h-4 mr-2" />}
                  {showAudioPlayer ? "Fechar mini player" : "Ouvir aqui"}
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={() => window.open(article.audiobookUrl ?? "", "_blank", "noopener,noreferrer")}
              >
                <Headphones className="w-4 h-4 mr-2" />
                Abrir no YouTube
              </Button>
            </div>
            {article.audiobookTitle ? <p className="text-sm text-muted-foreground">{article.audiobookTitle}</p> : null}
            {showAudioPlayer && youtubeEmbedUrl ? (
              <div className="rounded-lg overflow-hidden border border-border">
                <iframe
                  title={`Audiobook do artigo ${article.number}`}
                  src={youtubeEmbedUrl}
                  className="w-full aspect-video"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}

      {/* Content Layout */}
      <div className="space-y-6 mb-6">
        {/* Original Version */}
        <div className="space-y-4">
          <Card className="border-slate-300 dark:border-slate-700">
            <CardHeader className="bg-gradient-to-r from-slate-100 to-gray-100 dark:from-slate-900 dark:to-gray-900">
              <CardTitle className="text-lg text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <BookMarked className="w-5 h-5" />
                Texto Oficial da Constituição
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="bg-muted p-4 rounded-lg border border-border">
                <p className="text-sm leading-relaxed text-foreground font-mono whitespace-pre-wrap break-words">
                  {article.originalText}
                </p>
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                Fonte: Constituição da República Federativa do Brasil de 1988
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Practical Example & Curiosity (Se existirem) */}
        {(article.practicalExample || article.curiosity) && (
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Practical Example */}
            {article.practicalExample && (
              <Card className="border-blue-200 dark:border-blue-800">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950">
                  <CardTitle className="text-lg text-blue-900 dark:text-blue-100 flex items-center gap-2">
                    💡 Exemplo Prático
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <p className="text-base leading-relaxed text-foreground">
                    {article.practicalExample}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Curiosity */}
            {article.curiosity && (
              <Card className="border-amber-200 dark:border-amber-800">
                <CardHeader
                  className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950 cursor-pointer"
                  onClick={() => setShowCuriosity(!showCuriosity)}
                >
                  <CardTitle className="text-lg text-amber-900 dark:text-amber-100 flex items-center gap-2">
                    <Lightbulb className="w-5 h-5" />
                    Curiosidade
                    <span className="ml-auto text-sm">
                      {showCuriosity ? "−" : "+"}
                    </span>
                  </CardTitle>
                </CardHeader>
                {showCuriosity && (
                  <CardContent className="pt-6">
                    <p className="text-base leading-relaxed text-foreground">
                      {article.curiosity}
                    </p>
                  </CardContent>
                )}
              </Card>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-4 border-t border-border">
        <Button variant="outline">← Artigo Anterior</Button>
        <Button variant="outline">Próximo Artigo →</Button>
      </div>
    </div>
  );
}
