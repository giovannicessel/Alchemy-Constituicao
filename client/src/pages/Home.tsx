import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { STATIC_STUDY_MODE } from "@/config/features";
import { BookOpen, Zap, Trophy, Lightbulb, Brain } from "lucide-react";
import { Link } from "wouter";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import ThemeToggle from "@/components/ThemeToggle";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const loggedIn = isAuthenticated || Boolean(user?.id);
  const { data: progressStats } = trpc.constitution.getUserProgress.useQuery(undefined, {
    enabled: loggedIn,
    refetchOnWindowFocus: false,
  });

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--pixel-page-bg)", color: "var(--pixel-text-main)" }}>
      {/* Header */}
      <header
        className="sticky top-0 z-40 pt-[env(safe-area-inset-top)]"
        style={{ backgroundColor: "var(--pixel-header)", borderBottom: "2px solid var(--pixel-border-soft)" }}
      >
        <div className="max-w-6xl mx-auto px-4 min-h-16 py-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:py-0">
          <div className="flex items-center justify-between gap-3 sm:justify-start min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold truncate" style={{ color: '#00ff41', textShadow: '4px 4px 0px #8800ff' }}>
              CF/88
            </h1>
            <div className="flex items-center gap-2 sm:hidden shrink-0">
              <ThemeToggle />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 sm:justify-end">
            <div className="hidden sm:block">
              <ThemeToggle />
            </div>
            {loading ? (
              <div className="h-10 w-24 animate-pulse" style={{ backgroundColor: "var(--pixel-border-soft)" }} />
            ) : loggedIn ? (
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
                <span className="text-sm truncate max-w-[min(100%,14rem)] sm:max-w-none" style={{ color: "var(--pixel-text-muted)" }}>
                  Olá, {user?.name}
                </span>
                <Button type="button" asChild className="btn-pixel w-full sm:w-auto min-h-11">
                  <Link href="/constituicao">Estudar</Link>
                </Button>
              </div>
            ) : (
              <Button asChild className="btn-pixel w-full sm:w-auto min-h-11">
                <a href={getLoginUrl()}>Entrar</a>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-4 py-12 sm:py-20">
        <div className="text-center mb-16 sm:mb-24 px-4 sm:px-8">
          <h2 className="pixel-hero-title text-3xl sm:text-4xl md:text-5xl font-bold mb-6" style={{ color: "var(--pixel-text-main)", textShadow: "3px 3px 0px #000" }}>
            Constituição Federal de 1988
          </h2>
          <p className="text-lg md:text-xl mb-10 max-w-3xl mx-auto" style={{ color: "var(--pixel-text-muted)" }}>
            {STATIC_STUDY_MODE
              ? "Leia com resumos, curiosidades e exemplos no mesmo lugar. Quiz e flashcards — tudo disponível mesmo sem criar conta."
              : "Estude a Constituição de forma dinâmica, interativa e divertida. Reescritas simplificadas, quiz, gamificação e muito mais."}
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button type="button" asChild className="btn-pixel">
              <Link href="/constituicao">📚 Explorar</Link>
            </Button>
            <Button type="button" asChild className="btn-pixel">
              <Link href="/quiz">🎯 Quiz</Link>
            </Button>
            <Button type="button" asChild className="btn-pixel">
              <Link href="/flashcards">💡 Flash</Link>
            </Button>
            <Button type="button" asChild className="btn-pixel">
              <Link href="/emendas">⚖️ Emendas</Link>
            </Button>
            <Button type="button" asChild className="btn-pixel">
              <Link href="/mapa-mental">🧠 Mapa mental</Link>
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 gap-8 mb-24 lg:grid-cols-5 auto-rows-fr">
          <Link href="/constituicao" className="block text-left rounded-none shadow-none border-0 p-0 h-full">
            <Card
              className="card-pixel h-full cursor-pointer transition-transform hover:-translate-y-1 hover:border-[#00ff41]"
              style={{ backgroundColor: "var(--pixel-surface)", borderColor: "var(--pixel-border-soft)" }}
            >
              <CardHeader>
                <CardTitle
                  className="pixel-card-title flex items-center gap-2 text-lg sm:text-xl"
                  style={{ color: "#16c784", textShadow: "2px 2px 0px #000, -1px -1px 0px #000, 1px -1px 0px #000, -1px 1px 0px #000, 1px 1px 0px #000" }}
                >
                  <BookOpen className="w-6 h-6" />
                  Leitura
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="text-sm leading-relaxed" style={{ color: "var(--pixel-text-main)" }}>
                  Artigos formatados para fácil leitura com exemplos práticos do dia a dia
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/quiz" className="block text-left rounded-none shadow-none border-0 p-0 h-full">
            <Card
              className="card-pixel h-full cursor-pointer transition-transform hover:-translate-y-1 hover:border-[#00ff41]"
              style={{ backgroundColor: "var(--pixel-surface)", borderColor: "var(--pixel-border-soft)" }}
            >
              <CardHeader>
                <CardTitle
                  className="pixel-card-title flex items-center gap-2 text-lg sm:text-xl"
                  style={{ color: "#ffff00", textShadow: "2px 2px 0px #000, -1px -1px 0px #000, 1px -1px 0px #000, -1px 1px 0px #000, 1px 1px 0px #000" }}
                >
                  <Zap className="w-6 h-6" />
                  Quiz
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="text-sm leading-relaxed" style={{ color: "var(--pixel-text-main)" }}>
                  Teste seus conhecimentos com perguntas de múltipla escolha por capítulo
                </p>
              </CardContent>
            </Card>
          </Link>
          
          <Link
            href={user ? "/progresso" : "/constituicao"}
            className="block text-left rounded-none shadow-none border-0 p-0 h-full"
          >
            <Card
              className="card-pixel h-full cursor-pointer transition-transform hover:-translate-y-1 hover:border-[#00ff41] relative overflow-hidden"
              style={{ backgroundColor: "var(--pixel-surface)", borderColor: "var(--pixel-border-soft)" }}
            >
              <CardHeader>
                <CardTitle
                  className="pixel-card-title flex items-center gap-2 text-lg sm:text-xl relative z-10"
                  style={{ color: "#ff6600", textShadow: "2px 2px 0px #000, -1px -1px 0px #000, 1px -1px 0px #000, -1px 1px 0px #000, 1px 1px 0px #000" }}
                >
                  <Trophy className="w-6 h-6" />
                  Conquistas
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 relative z-10 flex flex-col justify-center items-center py-6">
                <div className="text-4xl font-bold animate-pulse" style={{ color: "#00ff41", textShadow: "3px 3px 0px #000" }}>
                  {loggedIn ? progressStats?.totalPoints ?? 0 : "0"}
                </div>
                <div className="text-sm mt-2 font-bold" style={{ color: "#ff6600", textShadow: "1px 1px 0px #000" }}>
                  PTS
                </div>
              </CardContent>
              {/* Animação pixelada de fundo */}
              <div className="absolute inset-0 opacity-10 flex items-center justify-center pointer-events-none">
                <Trophy className="w-32 h-32" />
              </div>
            </Card>
          </Link>

          <Link href="/progresso" className="block text-left rounded-none shadow-none border-0 p-0 h-full">
            <Card
              className="card-pixel h-full cursor-pointer transition-transform hover:-translate-y-1 hover:border-[#00ff41]"
              style={{ backgroundColor: "var(--pixel-surface)", borderColor: "var(--pixel-border-soft)" }}
            >
              <CardHeader>
                <CardTitle 
                  className="pixel-card-title flex items-center gap-2 text-lg sm:text-xl" 
                  style={{ color: "#00ff41", textShadow: "2px 2px 0px #000, -1px -1px 0px #000, 1px -1px 0px #000, -1px 1px 0px #000, 1px 1px 0px #000" }}
                >
                  <Brain className="w-6 h-6" />
                  Progresso
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="text-sm leading-relaxed" style={{ color: "var(--pixel-text-main)" }}>
                  {loggedIn
                    ? "Acesse seu dashboard com métricas, retenção e revisões espaçadas."
                    : "Faça login para liberar dashboard completo com analytics e revisões."}
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/mapa-mental" className="block text-left rounded-none shadow-none border-0 p-0 h-full">
            <Card
              className="card-pixel h-full cursor-pointer transition-transform hover:-translate-y-1 hover:border-[#00ff41]"
              style={{ backgroundColor: "var(--pixel-surface)", borderColor: "var(--pixel-border-soft)" }}
            >
              <CardHeader>
                <CardTitle 
                  className="pixel-card-title flex items-center gap-2 text-lg sm:text-xl" 
                  style={{ color: "#00ff41", textShadow: "2px 2px 0px #000, -1px -1px 0px #000, 1px -1px 0px #000, -1px 1px 0px #000, 1px 1px 0px #000" }}
                >
                  <Lightbulb className="w-6 h-6" />
                  Mapa Mental
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="text-sm leading-relaxed" style={{ color: "var(--pixel-text-main)" }}>
                  Navegue pela Constituição por blocos temáticos para revisão estratégica.
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* CTA Section */}
        <div className="rounded-lg p-8 sm:p-12 text-center" style={{ backgroundColor: "var(--pixel-surface)", border: "2px solid var(--pixel-border-soft)", boxShadow: "2px 2px 0px rgba(0, 0, 0, 0.35)" }}>
          <h3 className="pixel-card-title text-2xl sm:text-3xl font-bold mb-4" style={{ color: "var(--pixel-text-main)" }}>
            Pronto para dominar a Constituição?
          </h3>
          <p className="text-lg mb-8" style={{ color: "var(--pixel-text-muted)" }}>
            Comece agora e estude de forma inteligente e divertida
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button type="button" asChild className="btn-pixel">
              <Link href="/constituicao">Começar Agora</Link>
            </Button>
            {user && (
              <Button type="button" asChild className="btn-pixel">
                <Link href="/progresso">Ver Progresso</Link>
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-20 py-8 text-center" style={{ backgroundColor: "var(--pixel-header)", borderTop: "2px solid var(--pixel-border-soft)" }}>
        <p style={{ color: "var(--pixel-text-muted)" }}>
          © 2026 Constituição Interativa • Desenvolvido por{" "}
          <a
            href="http://cesselalchemy.com/"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#00ff41", textDecoration: "underline" }}
          >
            Cessel Alchemy
          </a>
          {STATIC_STUDY_MODE && (
            <span className="block mt-2 text-xs opacity-90">
              Modo leitura local: conteúdo do pacote embarcado. Para pontos salvos na nuvem, defina VITE_STATIC_STUDY=false no .env e configure o servidor.
            </span>
          )}
        </p>
      </footer>
    </div>
  );
}
