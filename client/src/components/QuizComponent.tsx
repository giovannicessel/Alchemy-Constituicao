import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, SkipForward } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuizQuestion {
  id: number;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: string;
  explanation?: string;
  difficulty?: string;
}

interface QuizComponentProps {
  questions: QuizQuestion[];
  chapterId: number;
  onComplete?: (score: number, totalQuestions: number) => void;
}

export default function QuizComponent({
  questions,
  chapterId,
  onComplete,
}: QuizComponentProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [showExplanation, setShowExplanation] = useState(false);
  const [quizComplete, setQuizComplete] = useState(false);

  const currentQuestion = questions[currentQuestionIndex];
  const options = [
    { key: "A", text: currentQuestion?.optionA },
    { key: "B", text: currentQuestion?.optionB },
    { key: "C", text: currentQuestion?.optionC },
    { key: "D", text: currentQuestion?.optionD },
  ];

  const selectedAnswer = selectedAnswers[currentQuestion?.id];
  const isCorrect = selectedAnswer === currentQuestion?.correctAnswer;
  const isAnswered = selectedAnswer !== undefined;

  const score = useMemo(() => {
    return Object.entries(selectedAnswers).reduce((acc, [questionId, answer]) => {
      const question = questions.find((q) => q.id === Number(questionId));
      return acc + (question && answer === question.correctAnswer ? 1 : 0);
    }, 0);
  }, [selectedAnswers, questions]);

  const handleSelectAnswer = (key: string) => {
    if (!isAnswered) {
      setSelectedAnswers((prev) => ({
        ...prev,
        [currentQuestion.id]: key,
      }));
      setShowExplanation(true);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setShowExplanation(false);
    } else {
      setQuizComplete(true);
      onComplete?.(score, questions.length);
    }
  };

  const handleRetry = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setShowExplanation(false);
    setQuizComplete(false);
  };

  if (quizComplete) {
    const percentage = Math.round((score / questions.length) * 100);
    const passed = percentage >= 70;

    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className={cn(
          "bg-gradient-to-r",
          passed
            ? "from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950"
            : "from-orange-50 to-red-50 dark:from-orange-950 dark:to-red-950"
        )}>
          <CardTitle className={cn(
            "text-center text-2xl",
            passed ? "text-emerald-700 dark:text-emerald-300" : "text-orange-700 dark:text-orange-300"
          )}>
            {passed ? "🎉 Parabéns!" : "📚 Continue Estudando"}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-8">
          <div className="text-center mb-8">
            <div className="text-5xl font-bold text-foreground mb-4">
              {score}/{questions.length}
            </div>
            <div className="text-lg text-muted-foreground mb-4">
              Você acertou {percentage}% das questões
            </div>
            <Progress value={percentage} className="h-3 mb-4" />
            <p className="text-sm text-muted-foreground">
              {passed
                ? "Excelente desempenho! Você domina este capítulo."
                : "Revise o conteúdo e tente novamente."}
            </p>
          </div>

          <div className="space-y-2">
            <Button
              onClick={handleRetry}
              className="w-full bg-emerald-600 hover:bg-emerald-700"
            >
              Fazer Quiz Novamente
            </Button>
            <Button variant="outline" className="w-full">
              Voltar para Capítulo
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      {/* Header */}
      <CardHeader>
        <div className="flex items-center justify-between mb-4">
          <Badge variant="secondary">
            Questão {currentQuestionIndex + 1}/{questions.length}
          </Badge>
          {currentQuestion?.difficulty && (
            <Badge
              className={cn(
                currentQuestion.difficulty === "easy"
                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                  : currentQuestion.difficulty === "medium"
                  ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                  : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
              )}
            >
              {currentQuestion.difficulty === "easy"
                ? "Fácil"
                : currentQuestion.difficulty === "medium"
                ? "Médio"
                : "Difícil"}
            </Badge>
          )}
        </div>
        <Progress
          value={((currentQuestionIndex + 1) / questions.length) * 100}
          className="h-2"
        />
      </CardHeader>

      {/* Question */}
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-4">
            {currentQuestion?.question}
          </h3>

          {/* Options */}
          <div className="space-y-3">
            {options.map((option) => {
              const isSelected = selectedAnswer === option.key;
              const isCorrectOption = option.key === currentQuestion?.correctAnswer;
              const showCorrect = isAnswered && isCorrectOption;
              const showWrong = isAnswered && isSelected && !isCorrect;

              return (
                <button
                  key={option.key}
                  onClick={() => handleSelectAnswer(option.key)}
                  disabled={isAnswered}
                  className={cn(
                    "w-full p-4 rounded-lg border-2 text-left transition-all",
                    !isAnswered && "hover:border-emerald-300 cursor-pointer",
                    isSelected && !isAnswered && "border-emerald-400 bg-emerald-50 dark:bg-emerald-950",
                    showCorrect && "border-green-500 bg-green-50 dark:bg-green-950",
                    showWrong && "border-red-500 bg-red-50 dark:bg-red-950",
                    !isSelected && isAnswered && "border-border opacity-50",
                    isAnswered && "cursor-not-allowed"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full border-2 border-current flex items-center justify-center font-semibold">
                      {option.key}
                    </div>
                    <div className="flex-1">
                      <p className="text-foreground">{option.text}</p>
                    </div>
                    {showCorrect && <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />}
                    {showWrong && <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Explanation */}
        {showExplanation && currentQuestion?.explanation && (
          <div className={cn(
            "p-4 rounded-lg border-l-4",
            isCorrect
              ? "bg-green-50 dark:bg-green-950 border-green-500"
              : "bg-blue-50 dark:bg-blue-950 border-blue-500"
          )}>
            <p className={cn(
              "text-sm font-semibold mb-2",
              isCorrect ? "text-green-700 dark:text-green-300" : "text-blue-700 dark:text-blue-300"
            )}>
              {isCorrect ? "✓ Correto!" : "Explicação:"}
            </p>
            <p className="text-sm text-foreground">
              {currentQuestion.explanation}
            </p>
          </div>
        )}

        {/* Score */}
        {isAnswered && (
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              Pontuação: <span className="font-semibold text-foreground">{score}/{questions.length}</span>
            </p>
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3">
          {!isAnswered && (
            <Button variant="outline" className="flex-1">
              <SkipForward className="w-4 h-4 mr-2" />
              Pular
            </Button>
          )}
          {isAnswered && (
            <Button
              onClick={handleNextQuestion}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
            >
              {currentQuestionIndex === questions.length - 1
                ? "Ver Resultado"
                : "Próxima Questão"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
