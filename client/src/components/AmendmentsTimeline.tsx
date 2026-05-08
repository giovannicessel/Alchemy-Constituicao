import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, FileText } from "lucide-react";

interface Amendment {
  id: number;
  number: number;
  year: number;
  title: string;
  description?: string;
}

interface AmendmentsTimelineProps {
  amendments: Amendment[];
}

export default function AmendmentsTimeline({
  amendments,
}: AmendmentsTimelineProps) {
  if (amendments.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <p className="text-muted-foreground">
            Nenhuma emenda disponível.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Sort amendments by year
  const sortedAmendments = [...amendments].sort((a, b) => a.year - b.year);

  // Group amendments by decade
  const groupedByDecade = sortedAmendments.reduce(
    (acc, amendment) => {
      const decade = Math.floor(amendment.year / 10) * 10;
      if (!acc[decade]) {
        acc[decade] = [];
      }
      acc[decade].push(amendment);
      return acc;
    },
    {} as Record<number, Amendment[]>
  );

  const decades = Object.keys(groupedByDecade)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Evolução da Constituição
        </h2>
        <p className="text-muted-foreground">
          Linha do tempo das Emendas Constitucionais desde 1988
        </p>
      </div>

      {/* Timeline */}
      <div className="space-y-12">
        {decades.map((decade) => (
          <div key={decade}>
            {/* Decade Header */}
            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1 h-px bg-border" />
              <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300 px-4 py-2 text-base">
                {decade}s
              </Badge>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Amendments in this decade */}
            <div className="space-y-4 ml-8 border-l-2 border-emerald-200 dark:border-emerald-800 pl-8">
              {groupedByDecade[decade]!.map((amendment, index) => (
                <div key={amendment.id} className="relative">
                  {/* Timeline dot */}
                  <div className="absolute -left-11 top-2 w-4 h-4 rounded-full bg-emerald-600 border-4 border-background" />

                  <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <CardTitle className="text-base">
                            EC nº {amendment.number}/{amendment.year}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">
                            {amendment.title}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground flex-shrink-0">
                          <Calendar className="w-4 h-4" />
                          {amendment.year}
                        </div>
                      </div>
                    </CardHeader>
                    {amendment.description && (
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          {amendment.description}
                        </p>
                      </CardContent>
                    )}
                  </Card>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Stats */}
      <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950 border-emerald-200 dark:border-emerald-800">
        <CardContent className="pt-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-3xl font-bold text-emerald-600">
                {amendments.length}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Emendas Totais
              </p>
            </div>
            <div>
              <p className="text-3xl font-bold text-teal-600">
                {new Date().getFullYear() - 1988}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Anos de Evolução
              </p>
            </div>
            <div>
              <p className="text-3xl font-bold text-cyan-600">
                {decades.length}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Décadas
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
