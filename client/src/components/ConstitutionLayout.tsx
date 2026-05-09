import { useState } from "react";
import { Menu, X, Search, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface ConstitutionLayoutProps {
  children: React.ReactNode;
  onNavigate?: (titleId: number, chapterId?: number) => void;
  titles?: Array<{ id: number; number: number; title: string }>;
  chapters?: Array<{ id: number; titleId: number; title: string }>;
  selectedTitleId?: number | undefined;
  selectedChapterId?: number | undefined;
}

export default function ConstitutionLayout({
  children,
  onNavigate,
  titles = [],
  chapters = [],
  selectedTitleId,
  selectedChapterId,
}: ConstitutionLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedTitle, setExpandedTitle] = useState<number | null>(selectedTitleId || null);

  const filteredTitles = titles.filter((title) =>
    title.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredChapters = chapters.filter(
    (chapter) =>
      chapter.titleId === expandedTitle &&
      chapter.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 bg-card border-r border-border transition-transform duration-300 flex flex-col",
          !sidebarOpen && "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-6 h-6 text-emerald-600" />
            <h1 className="text-lg font-bold text-foreground">CF/88</h1>
          </div>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-9"
            />
          </div>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-2">
            {filteredTitles.map((title) => (
              <div key={title.id}>
                <button
                  onClick={() => {
                    setExpandedTitle(expandedTitle === title.id ? null : title.id);
                    onNavigate?.(title.id);
                  }}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    selectedTitleId === title.id
                      ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-100"
                      : "hover:bg-muted text-foreground"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="truncate">Título {title.number}</span>
                    <span className="text-xs ml-1">
                      {expandedTitle === title.id ? "−" : "+"}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {title.title}
                  </div>
                </button>

                {/* Chapters */}
                {expandedTitle === title.id && filteredChapters.length > 0 && (
                  <div className="ml-2 mt-1 space-y-1 border-l border-muted pl-2">
                    {filteredChapters.map((chapter) => (
                      <button
                        key={chapter.id}
                        onClick={() => {
                          onNavigate?.(title.id, chapter.id);
                        }}
                        className={cn(
                          "w-full text-left px-2 py-1.5 rounded text-xs transition-colors",
                          selectedChapterId === chapter.id
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                            : "hover:bg-muted text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {chapter.title}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
          <div className="flex items-center justify-between h-14 px-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden"
            >
              {sidebarOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>

            <div className="flex-1 ml-4">
              <h2 className="text-sm font-semibold text-muted-foreground">
                Constituição Federal de 1988
              </h2>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto min-w-0 lg:pl-64">
          {children}
        </main>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
