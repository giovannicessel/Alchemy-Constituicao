export type ConstitutionalGroup = {
  key: string;
  label: string;
  start: number;
  end: number;
  description: string;
};

export const CONSTITUTIONAL_GROUPS: ConstitutionalGroup[] = [
  { key: "principios-fundamentais", label: "Princípios Fundamentais", start: 1, end: 4, description: "Base axiológica da República e organização inicial do Estado." },
  { key: "direitos-individuais-coletivos", label: "Direitos Individuais e Coletivos", start: 5, end: 5, description: "Núcleo de garantias e liberdades constitucionais." },
  { key: "direitos-sociais", label: "Direitos Sociais", start: 6, end: 11, description: "Direitos prestacionais e proteção social." },
  { key: "nacionalidade", label: "Nacionalidade", start: 12, end: 13, description: "Regras de nacionalidade nata e adquirida." },
  { key: "direitos-politicos", label: "Direitos Políticos", start: 14, end: 16, description: "Participação política, sufrágio e elegibilidade." },
  { key: "partidos-politicos", label: "Partidos Políticos", start: 17, end: 17, description: "Autonomia, funcionamento e limites partidários." },
  { key: "organizacao-estado", label: "Organização do Estado", start: 18, end: 43, description: "Competências federativas e repartição territorial." },
  { key: "organizacao-poderes", label: "Organização dos Poderes", start: 44, end: 135, description: "Legislativo, Executivo, Judiciário e funções essenciais." },
  { key: "defesa-estado", label: "Defesa do Estado e Instituições Democráticas", start: 136, end: 144, description: "Estado de defesa, sítio e segurança pública." },
  { key: "tributacao-orcamento", label: "Tributação e Orçamento", start: 145, end: 169, description: "Sistema tributário e finanças públicas." },
  { key: "ordem-economica", label: "Ordem Econômica e Financeira", start: 170, end: 192, description: "Princípios e limites da atividade econômica." },
  { key: "ordem-social", label: "Ordem Social", start: 193, end: 232, description: "Seguridade, educação, cultura, meio ambiente e família." },
  { key: "disposicoes-gerais", label: "Disposições Constitucionais Gerais", start: 233, end: 250, description: "Normas gerais finais da Constituição." },
];

export function getConstitutionalGroupByArticle(articleNumber: number): ConstitutionalGroup {
  return (
    CONSTITUTIONAL_GROUPS.find((g) => articleNumber >= g.start && articleNumber <= g.end) ??
    CONSTITUTIONAL_GROUPS[CONSTITUTIONAL_GROUPS.length - 1]
  );
}
