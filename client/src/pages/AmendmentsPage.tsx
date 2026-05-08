import { useLocation } from "wouter";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import AmendmentsTimeline from "@/components/AmendmentsTimeline";
import { trpc } from "@/lib/trpc";
import { BookOpen } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";

export default function AmendmentsPage() {
  const [, setLocation] = useLocation();
  const { data: rawAmendments = [] } = trpc.constitution.getAllAmendments.useQuery();

  const amendments = useMemo(
    () =>
      rawAmendments.map((a) => ({
        id: a.id,
        number: a.number,
        year: a.year,
        title: a.title,
        description: a.description ?? undefined,
      })),
    [rawAmendments]
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-cyan-50 to-white dark:from-cyan-950 dark:to-slate-950">
      <header className="sticky top-0 z-40 border-b border-cyan-200 dark:border-cyan-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-cyan-600" />
            <h1 className="text-2xl font-bold text-foreground">Emendas Constitucionais</h1>
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
        <AmendmentsTimeline amendments={amendments} />
      </div>
    </div>
  );
}
