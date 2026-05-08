import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import ProgressDashboard from "@/components/ProgressDashboard";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { BookOpen, Loader2 } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";

export default function ProgressPage() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();

  const { data: progress, isLoading } = isAuthenticated
    ? trpc.constitution.getUserProgress.useQuery()
    : { data: null, isLoading: false };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: "var(--pixel-page-bg)", color: "var(--pixel-text-main)" }}>
        <header className="sticky top-0 z-40 border-b-2" style={{ borderColor: "#16c784", backgroundColor: "#0f3460" }}>
          <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BookOpen className="w-8 h-8" style={{ color: "#16c784" }} />
              <h1 className="text-2xl font-bold" style={{ color: "#00ff41" }}>Meu Progresso</h1>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button
                variant="outline"
                onClick={() => setLocation("/")}
              >
                ← Voltar
              </Button>
            </div>
          </div>
        </header>

        <div className="max-w-6xl mx-auto px-4 py-12">
          <Card className="border-2" style={{ borderColor: "#16c784", backgroundColor: "#0f3460" }}>
            <CardContent className="pt-6 text-center">
              <p className="mb-4" style={{ color: "#ffffff" }}>
                Você precisa estar autenticado para ver seu progresso.
              </p>
              <Button onClick={() => setLocation("/")} className="bg-emerald-600 hover:bg-emerald-700">
                Voltar à Página Inicial
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--pixel-page-bg)", color: "var(--pixel-text-main)" }}>
      <header className="sticky top-0 z-40 border-b-2" style={{ borderColor: "#16c784", backgroundColor: "#0f3460" }}>
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen className="w-8 h-8" style={{ color: "#16c784" }} />
            <h1 className="text-2xl font-bold" style={{ color: "#00ff41" }}>Meu Progresso</h1>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button
              variant="outline"
              onClick={() => setLocation("/constituicao")}
            >
              ← Voltar
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-12">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#16c784" }} />
          </div>
        ) : progress ? (
          <ProgressDashboard progress={progress} />
        ) : (
          <Card className="border-2" style={{ borderColor: "#16c784", backgroundColor: "#0f3460" }}>
            <CardContent className="pt-6 text-center">
              <p style={{ color: "#ffffff" }}>
                Nenhum progresso registrado ainda. Comece a estudar!
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
