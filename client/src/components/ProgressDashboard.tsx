import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BookOpen, Trophy, Zap, Target } from "lucide-react";

interface UserProgress {
  articlesRead: number;
  totalArticles: number;
  quizzesCompleted: number;
  totalPoints: number;
  averageAccuracy: number;
  weeklyAccuracy: number;
  retentionD7: number;
  dueReviews: number;
  byBoard: Array<{ board: string; attempts: number; accuracy: number }>;
  weakThemes: Array<{ theme: string; attempts: number; accuracy: number }>;
  achievements: Array<{
    type: string;
    name: string;
    points: number;
    earnedAt: Date;
  }>;
  lastActivity?: Date | null;
}

interface ProgressDashboardProps {
  progress: UserProgress;
}

export default function ProgressDashboard({ progress }: ProgressDashboardProps) {
  const readPercentage = Math.round(
    (progress.articlesRead / progress.totalArticles) * 100
  );

  const achievements = [
    // === ARTIGOS LIDOS ===
    { id: "read_1", name: "Primeiro Passo", description: "Leia seu primeiro artigo", icon: "📖", points: 10 },
    { id: "read_10", name: "Leitor Aprendiz", description: "Leia 10 artigos", icon: "📚", points: 20 },
    { id: "read_50", name: "Leitor Assíduo", description: "Leia 50 artigos", icon: "🔥", points: 50 },
    { id: "read_100", name: "Leitor Frequente", description: "Leia 100 artigos", icon: "⚡", points: 100 },
    { id: "read_150", name: "Rato de Biblioteca", description: "Leia 150 artigos", icon: "🧐", points: 150 },
    { id: "read_200", name: "Especialista", description: "Leia 200 artigos", icon: "🎓", points: 200 },
    { id: "constitution_master", name: "Mestre da Constituição", description: "Leia toda a Constituição (250 arts)", icon: "👑", points: 500 },

    // === DOMÍNIOS TEMÁTICOS ===
    { id: "theme_1_4", name: "Princípios Fundamentais", description: "Domine os Artigos 1 ao 4", icon: "🏛️", points: 50 },
    { id: "theme_5", name: "Cidadão Consciente", description: "Domine o Artigo 5 (Dir. Individuais)", icon: "🛡️", points: 50 },
    { id: "theme_6_11", name: "Ativista Social", description: "Domine os Direitos Sociais (6-11)", icon: "🤝", points: 50 },
    { id: "theme_12_13", name: "Patriota", description: "Domine Nacionalidade (12-13)", icon: "🇧🇷", points: 30 },
    { id: "theme_14_16", name: "Eleitor Consciente", description: "Domine Direitos Políticos (14-16)", icon: "🗳️", points: 30 },
    { id: "theme_18_43", name: "Estrategista Estatal", description: "Domine a Organização do Estado (18-43)", icon: "🗺️", points: 80 },
    { id: "theme_44_75", name: "Legislador", description: "Domine o Poder Legislativo (44-75)", icon: "📜", points: 80 },
    { id: "theme_76_91", name: "Chefe de Estado", description: "Domine o Poder Executivo (76-91)", icon: "👔", points: 80 },
    { id: "theme_92_126", name: "Magistrado", description: "Domine o Poder Judiciário (92-126)", icon: "⚖️", points: 80 },
    { id: "theme_145_169", name: "Economista Público", description: "Domine Tributação e Orçamento (145-169)", icon: "💰", points: 80 },
    { id: "theme_193_232", name: "Guardião da Ordem", description: "Domine a Ordem Social (193-232)", icon: "🏥", points: 80 },

    // === QUIZ ===
    { id: "quiz_first", name: "Primeiro Teste", description: "Responda seu primeiro quiz", icon: "📝", points: 10 },
    { id: "quiz_10_correct", name: "Concurseiro Iniciante", description: "Acerte 10 questões no total", icon: "🎯", points: 20 },
    { id: "quiz_25_correct", name: "Concurseiro Intermediário", description: "Acerte 25 questões no total", icon: "🏹", points: 50 },
    { id: "quiz_50_correct", name: "Concurseiro Avançado", description: "Acerte 50 questões no total", icon: "⚔️", points: 100 },
    { id: "quiz_75_correct", name: "Máquina de Vencer", description: "Acerte 75 questões no total", icon: "🤖", points: 200 },
    { id: "quiz_90_correct", name: "Imbatível", description: "Acerte 90 questões no total", icon: "🏆", points: 500 },
    { id: "quiz_master", name: "Mestre do Quiz", description: "Acerte 80% em um quiz", icon: "⭐", points: 50 },
    { id: "quiz_perfect", name: "Gabaritador", description: "Acerte 100% em um quiz com +5 perguntas", icon: "💯", points: 100 },

    // === FLASHCARDS ===
    { id: "flashcard_first", name: "Primeira Revisão", description: "Faça sua primeira revisão", icon: "🧠", points: 10 },
    { id: "flashcard_10", name: "Mente Afiada", description: "Revise 10 flashcards", icon: "💡", points: 20 },
    { id: "flashcard_30", name: "Estudante Focado", description: "Revise 30 flashcards", icon: "📖", points: 50 },
    { id: "flashcard_50", name: "Memória de Elefante", description: "Revise 50 flashcards", icon: "🐘", points: 100 },
    { id: "flashcard_70", name: "Domínio Total", description: "Revise 70 flashcards", icon: "🔮", points: 500 },
  ].map(a => ({ ...a, earned: progress.achievements.some((pa) => pa.type === a.id) }));

  const earnedAchievements = achievements.filter((a) => a.earned);
  const earnedPoints = earnedAchievements.reduce((sum, a) => sum + a.points, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-lg border-2 p-4 card-pixel" style={{ borderColor: "var(--pixel-border-soft)", backgroundColor: "var(--pixel-surface)" }}>
        <h2 className="text-2xl font-bold mb-2 tracking-normal" style={{ color: "var(--pixel-text-main)", fontFamily: "system-ui, sans-serif", textShadow: "1px 1px 0px #000" }}>
          Seu Progresso
        </h2>
        <p style={{ color: "var(--pixel-text-muted)" }}>
          Acompanhe seu aprendizado e conquistas
        </p>
      </div>

      {/* Main Stats */}
      <div className="grid md:grid-cols-5 gap-4">
        <Card className="border-2 card-pixel" style={{ borderColor: "var(--pixel-border-soft)", backgroundColor: "var(--pixel-surface)" }}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2" style={{ color: "var(--pixel-cyan)" }}>
              <BookOpen className="w-4 h-4" />
              Artigos Lidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: "var(--pixel-text-main)" }}>
              {progress.articlesRead}/{progress.totalArticles}
            </div>
            <Progress value={readPercentage} className="mt-2 h-2" />
            <p className="text-xs mt-2" style={{ color: "var(--pixel-text-muted)" }}>
              {readPercentage}% completo
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 card-pixel" style={{ borderColor: "var(--pixel-border-soft)", backgroundColor: "var(--pixel-surface)" }}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2" style={{ color: "var(--pixel-lime)" }}>
              <Zap className="w-4 h-4" />
              Quizzes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: "var(--pixel-text-main)" }}>
              {progress.quizzesCompleted}
            </div>
            <p className="text-xs mt-2" style={{ color: "var(--pixel-text-muted)" }}>
              Teste seus conhecimentos
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 card-pixel" style={{ borderColor: "var(--pixel-border-soft)", backgroundColor: "var(--pixel-surface)" }}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2" style={{ color: "var(--pixel-yellow)" }}>
              <Trophy className="w-4 h-4" />
              Pontos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold animate-pixel-pulse" style={{ color: "var(--pixel-lime)", textShadow: "1px 1px 0px #000" }}>
              {progress.totalPoints}
            </div>
            <p className="text-xs mt-2" style={{ color: "var(--pixel-text-muted)" }}>
              Ganhos com atividades
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 card-pixel" style={{ borderColor: "var(--pixel-border-soft)", backgroundColor: "var(--pixel-surface)" }}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2" style={{ color: "var(--pixel-purple)" }}>
              <Target className="w-4 h-4" />
              Conquistas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: "var(--pixel-text-main)" }}>
              {earnedAchievements.length}/{achievements.length}
            </div>
            <p className="text-xs mt-2" style={{ color: "var(--pixel-text-muted)" }}>
              {earnedPoints} pts ganhos
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 card-pixel" style={{ borderColor: "var(--pixel-border-soft)", backgroundColor: "var(--pixel-surface)" }}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-rose-500">
              <Target className="w-4 h-4" />
              Revisões
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: "var(--pixel-text-main)" }}>
              {progress.dueReviews}
            </div>
            <p className="text-xs mt-2" style={{ color: "var(--pixel-text-muted)" }}>
              Fila SRS pendente
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="border-2 card-pixel" style={{ borderColor: "var(--pixel-border-soft)", backgroundColor: "var(--pixel-surface)" }}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium" style={{ color: "var(--pixel-text-main)" }}>Acurácia Geral</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: "var(--pixel-cyan)" }}>{progress.averageAccuracy}%</div>
            <Progress value={progress.averageAccuracy} className="mt-2 h-2" />
          </CardContent>
        </Card>
        <Card className="border-2 card-pixel" style={{ borderColor: "var(--pixel-border-soft)", backgroundColor: "var(--pixel-surface)" }}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium" style={{ color: "var(--pixel-text-main)" }}>Acurácia 7 dias</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: "var(--pixel-cyan)" }}>{progress.weeklyAccuracy}%</div>
            <Progress value={progress.weeklyAccuracy} className="mt-2 h-2" />
          </CardContent>
        </Card>
        <Card className="border-2 card-pixel" style={{ borderColor: "var(--pixel-border-soft)", backgroundColor: "var(--pixel-surface)" }}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium" style={{ color: "var(--pixel-text-main)" }}>Retenção D+7</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: "var(--pixel-cyan)" }}>{progress.retentionD7}%</div>
            <Progress value={progress.retentionD7} className="mt-2 h-2" />
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="border-2 card-pixel" style={{ borderColor: "var(--pixel-border-soft)", backgroundColor: "var(--pixel-surface)" }}>
          <CardHeader>
            <CardTitle style={{ color: "var(--pixel-text-main)" }}>Desempenho por banca</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {progress.byBoard.length === 0 ? (
              <p className="text-sm" style={{ color: "var(--pixel-text-muted)" }}>Sem dados de tentativas por banca ainda.</p>
            ) : (
              progress.byBoard.map((b) => (
                <div key={b.board} className="flex items-center justify-between text-sm" style={{ color: "var(--pixel-text-main)" }}>
                  <span>{b.board}</span>
                  <span style={{ color: "var(--pixel-lime)" }}>{b.accuracy}% ({b.attempts})</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
        <Card className="border-2 card-pixel" style={{ borderColor: "var(--pixel-border-soft)", backgroundColor: "var(--pixel-surface)" }}>
          <CardHeader>
            <CardTitle style={{ color: "var(--pixel-text-main)" }}>Temas fracos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {progress.weakThemes.length === 0 ? (
              <p className="text-sm" style={{ color: "var(--pixel-text-muted)" }}>Sem temas fracos mapeados ainda.</p>
            ) : (
              progress.weakThemes.map((t) => (
                <div key={t.theme} className="flex items-center justify-between text-sm" style={{ color: "var(--pixel-text-main)" }}>
                  <span>{t.theme}</span>
                  <span className="text-rose-500">{t.accuracy}% ({t.attempts})</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Achievements */}
      <div>
        <h3 className="text-lg font-semibold mb-4 tracking-normal" style={{ fontFamily: "system-ui, sans-serif", color: "var(--pixel-text-main)" }}>
          Conquistas Disponíveis
        </h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {achievements.map((achievement) => (
            <Card
              key={achievement.id}
              className={achievement.earned ? "opacity-100 border-2 card-pixel shadow-lg shadow-[#16c784]/20" : "opacity-60 border-2 card-pixel"}
              style={{
                borderColor: achievement.earned ? "var(--pixel-lime)" : "var(--pixel-border-soft)",
                backgroundColor: "var(--pixel-surface)",
              }}
            >
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="text-3xl">{achievement.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h4 className="font-semibold" style={{ color: "var(--pixel-text-main)" }}>
                        {achievement.name}
                      </h4>
                      {achievement.earned && (
                        <Badge className="bg-emerald-600 text-white text-[10px] py-0">
                          Conquistado
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs mb-2" style={{ color: "var(--pixel-text-muted)" }}>
                      {achievement.description}
                    </p>
                    <Badge variant="secondary" className="text-[10px]">
                      +{achievement.points} pts
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Activity */}
      {progress.lastActivity && (
        <Card className="border-2 card-pixel" style={{ borderColor: "var(--pixel-border-soft)", backgroundColor: "var(--pixel-surface)" }}>
          <CardContent className="pt-6">
            <p className="text-sm" style={{ color: "var(--pixel-text-muted)" }}>
              Última atividade:{" "}
              <span className="font-semibold" style={{ color: "var(--pixel-text-main)" }}>
                {new Date(progress.lastActivity).toLocaleDateString("pt-BR")}
              </span>
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
