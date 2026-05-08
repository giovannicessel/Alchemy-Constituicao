import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RotateCw, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Flashcard {
  id: number;
  front: string;
  back: string;
  category?: string;
}

interface FlashcardsComponentProps {
  flashcards: Flashcard[];
  articleId?: number;
}

export default function FlashcardsComponent({
  flashcards,
  articleId,
}: FlashcardsComponentProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [learned, setLearned] = useState<Set<number>>(new Set());

  const currentCard = flashcards[currentIndex];
  const learnedCount = learned.size;
  const progress = Math.round((learnedCount / flashcards.length) * 100);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleMarkAsLearned = () => {
    const newSet = new Set(learned);
    newSet.add(currentCard.id);
    setLearned(newSet);
    handleNext();
  };

  const handleNext = () => {
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsFlipped(false);
    }
  };

  const handleReset = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setLearned(new Set());
  };

  if (flashcards.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <p className="text-muted-foreground">
            Nenhum flashcard disponível para este artigo.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-foreground">Progresso de Aprendizado</h3>
          <span className="text-sm text-muted-foreground">
            {learnedCount}/{flashcards.length} aprendidos
          </span>
        </div>
        <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
          <div
            className="bg-emerald-600 h-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Flashcard */}
      <Card className="cursor-pointer" onClick={handleFlip}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <Badge variant="secondary">
              {currentIndex + 1}/{flashcards.length}
            </Badge>
            {currentCard?.category && (
              <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300">
                {currentCard.category}
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent>
          <div className="aspect-video flex items-center justify-center">
            <div
              className={cn(
                "w-full h-full flex flex-col items-center justify-center p-8 rounded-lg transition-all duration-300 transform",
                isFlipped
                  ? "bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950"
                  : "bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950"
              )}
            >
              <div className="text-center">
                <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
                  {isFlipped ? "Resposta" : "Pergunta"}
                </p>
                <p className="text-lg font-semibold text-foreground leading-relaxed break-words whitespace-pre-wrap">
                  {isFlipped ? currentCard?.back : currentCard?.front}
                </p>
              </div>
              <div className="mt-6 text-xs text-muted-foreground">
                Clique para virar
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Controls */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <Button
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            variant="outline"
            className="flex-1"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Anterior
          </Button>
          <Button
            onClick={handleNext}
            disabled={currentIndex === flashcards.length - 1}
            variant="outline"
            className="flex-1"
          >
            Próximo
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleMarkAsLearned}
            disabled={learned.has(currentCard.id)}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700"
          >
            {learned.has(currentCard.id) ? "✓ Aprendido" : "Marcar como Aprendido"}
          </Button>
          <Button
            onClick={handleReset}
            variant="outline"
            className="flex-1"
          >
            <RotateCw className="w-4 h-4 mr-2" />
            Reiniciar
          </Button>
        </div>
      </div>

      {/* Stats */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-emerald-600">{learnedCount}</p>
              <p className="text-xs text-muted-foreground">Aprendidos</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">
                {flashcards.length - learnedCount}
              </p>
              <p className="text-xs text-muted-foreground">Restantes</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-600">{progress}%</p>
              <p className="text-xs text-muted-foreground">Progresso</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
