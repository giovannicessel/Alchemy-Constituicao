import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/ThemeToggle";
import { Brain, Search, PlusCircle, MinusCircle, ZoomIn, ZoomOut, Maximize } from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";

// Dados estáticos do mapa baseado na imagem CF88 com "summary" adicionado
const MIND_MAP_DATA = {
  label: "Direito Constitucional",
  defaultExpanded: true,
  children: [
    {
      label: "Princípios Fundamentais (Art. 1 ao 4)",
      defaultExpanded: true,
      children: [
        { label: "Soberania", link: "/constituicao?article=1", summary: "Garante que o Brasil possui poder supremo e independente sobre seu território, não se sujeitando a imposições externas." },
        { label: "Cidadania", link: "/constituicao?article=1", summary: "Assegura ao indivíduo a participação na vida política do Estado e o pleno exercício dos seus direitos civis e sociais." },
        { label: "Dignidade da Pessoa Humana", link: "/constituicao?article=1", summary: "Valor supremo que atrai o respeito e a proteção à vida de todo ser humano, servindo como base de todos os direitos." },
        { label: "Valores sociais", link: "/constituicao?article=1", summary: "Afirma a proteção do trabalho humano e da livre iniciativa econômica, equilibrando o mercado e o social." },
        { label: "Pluralismo Político", link: "/constituicao?article=1", summary: "Garante a coexistência de diversas ideologias, grupos e opiniões na sociedade, vedando o pensamento único." },
      ],
    },
    {
      label: "Direitos e Garantias Fundamentais (Art. 5 ao 17)",
      defaultExpanded: false,
      children: [
        {
          label: "Individuais e Coletivos",
          defaultExpanded: false,
          children: [
            { label: "Igualdade perante a lei", link: "/constituicao?article=5", summary: "Todos são iguais perante a lei, sem distinção de qualquer natureza." },
            { label: "Liberdade de expressão", link: "/constituicao?article=5", summary: "É livre a manifestação do pensamento, sendo vedado o anonimato." },
            { label: "Inviolabilidade da Casa", link: "/constituicao?article=5", summary: "A casa é asilo inviolável, ninguém nela podendo penetrar sem consentimento, exceto em emergências." },
            { label: "Remédios Constitucionais", link: "/constituicao?article=5", summary: "Ações judiciais especiais como Habeas Corpus (liberdade) e Mandado de Segurança (direito líquido e certo)." },
          ],
        },
        {
          label: "Sociais",
          defaultExpanded: false,
          children: [
            { label: "Educação e Saúde", link: "/constituicao?article=6", summary: "Direitos fundamentais para o bem-estar e sobrevivência digna do indivíduo na sociedade." },
            { label: "Trabalho e Moradia", link: "/constituicao?article=6", summary: "Condições materiais mínimas para a subsistência do cidadão." },
            { label: "Segurança e Lazer", link: "/constituicao?article=6", summary: "Apoio estrutural que garante a ordem e a saúde mental." },
          ],
        },
        { label: "Nacionalidade", link: "/constituicao?article=12", summary: "Define os critérios para ser considerado brasileiro nato ou naturalizado." },
        { label: "Direitos Políticos", link: "/constituicao?article=14", summary: "Regras sobre elegibilidade, alistamento eleitoral e o exercício da soberania popular (voto)." },
        { label: "Partidos Políticos", link: "/constituicao?article=17", summary: "Autonomia e liberdade para a criação, fusão e extinção de siglas partidárias." },
      ],
    },
    {
      label: "Organização do Estado (Art. 18 ao 43)",
      defaultExpanded: false,
      children: [
        { label: "União", link: "/constituicao?article=20", summary: "O ente central da federação, com soberania internacional e competências administrativas abrangentes." },
        { label: "Estados Federados", link: "/constituicao?article=25", summary: "Entidades subnacionais dotadas de autonomia política e administrativa." },
        { label: "Municípios", link: "/constituicao?article=29", summary: "Menor unidade autônoma do Brasil, responsável por assuntos de interesse estritamente local." },
        { label: "DF e Territórios", link: "/constituicao?article=32", summary: "O Distrito Federal mescla competências de Estado e Município. Territórios pertencem à União." },
        { label: "Administração Pública", link: "/constituicao?article=37", summary: "Princípios como Legalidade, Impessoalidade e Eficiência que regem o serviço público." },
      ],
    },
    {
      label: "Organização dos Poderes (Art. 44 ao 135)",
      defaultExpanded: false,
      children: [
        {
          label: "Poder Legislativo",
          defaultExpanded: false,
          children: [
            { label: "Congresso Nacional", link: "/constituicao?article=44", summary: "Órgão bicameral que exerce o poder legislativo federal (Câmara + Senado)." },
            { label: "Câmara dos Deputados", link: "/constituicao?article=51", summary: "Representantes do povo, eleitos proporcionalmente à população de cada Estado." },
            { label: "Senado Federal", link: "/constituicao?article=52", summary: "Representantes dos Estados, com 3 senadores cada, independente da população." },
            { label: "Tribunal de Contas da União", link: "/constituicao?article=71", summary: "Órgão auxiliar do legislativo na fiscalização do dinheiro público." },
          ],
        },
        {
          label: "Poder Executivo",
          defaultExpanded: false,
          children: [
            { label: "Presidente e Vice", link: "/constituicao?article=76", summary: "Chefe de Estado e Chefe de Governo da União." },
            { label: "Ministros de Estado", link: "/constituicao?article=87", summary: "Auxiliares diretos do Presidente na chefia das pastas do executivo." },
            { label: "Conselhos", link: "/constituicao?article=89", summary: "Órgãos superiores de consulta do Presidente da República." },
          ],
        },
        {
          label: "Poder Judiciário",
          defaultExpanded: false,
          children: [
            { label: "Supremo Tribunal Federal", link: "/constituicao?article=101", summary: "A suprema corte do país, guardião máximo da Constituição." },
            { label: "Conselho Nacional de Justiça", link: "/constituicao?article=103", summary: "Órgão de controle administrativo, financeiro e disciplinar da magistratura." },
            { label: "Superior Tribunal de Justiça", link: "/constituicao?article=104", summary: "Corte responsável pela uniformização da lei federal no país." },
            { label: "Demais Justiças", link: "/constituicao?article=106", summary: "Inclui justiça do trabalho, militar, eleitoral e juízes estaduais." },
          ],
        },
        { label: "Funções Essenciais", link: "/constituicao?article=127", summary: "Ministério Público, Advocacia Pública e Defensoria Pública: indispensáveis para a justiça acontecer." },
      ],
    },
    {
      label: "Defesa do Estado e Instituições (Art. 136 ao 144)",
      defaultExpanded: false,
      children: [
        { label: "Estado de Defesa e Sítio", link: "/constituicao?article=136", summary: "Mecanismos emergenciais de suspensão de direitos para restabelecer a ordem nacional." },
        { label: "Forças Armadas", link: "/constituicao?article=142", summary: "Marinha, Exército e Aeronáutica, destinadas à defesa da Pátria e garantia dos poderes." },
        { label: "Segurança Pública", link: "/constituicao?article=144", summary: "Polícias (Federal, Rodoviária, Civil, Militar) e seu dever de manter a ordem pública." },
      ],
    },
    {
      label: "Tributação e Orçamento (Art. 145 ao 169)",
      defaultExpanded: false,
      children: [
        { label: "Sistema Tributário", link: "/constituicao?article=145", summary: "Conjunto de regras sobre quem pode cobrar impostos, taxas e contribuições." },
        { label: "Finanças Públicas", link: "/constituicao?article=163", summary: "Regras sobre dívida pública, Banco Central e circulação de dinheiro." },
        { label: "Orçamentos (PPA, LDO, LOA)", link: "/constituicao?article=165", summary: "Leis de planejamento que dizem como e onde o governo gastará o dinheiro arrecadado." },
      ],
    },
    {
      label: "Ordem Econômica e Social (Art. 170 ao 232)",
      defaultExpanded: false,
      children: [
        { label: "Princípios Econômicos", link: "/constituicao?article=170", summary: "A economia baseia-se no trabalho e na livre iniciativa, buscando justiça social." },
        { label: "Política Urbana/Agrícola", link: "/constituicao?article=182", summary: "Regras para o desenvolvimento das cidades e do campo (função social da propriedade)." },
        { label: "Seguridade Social", link: "/constituicao?article=194", summary: "O tripé da proteção social: Previdência, Saúde e Assistência Social." },
        { label: "Educação, Cultura e Desporto", link: "/constituicao?article=205", summary: "Deveres do Estado no provimento do ensino, cultura e incentivo ao esporte." },
        { label: "Meio Ambiente", link: "/constituicao?article=225", summary: "Direito de todos a um ambiente ecologicamente equilibrado, dever de preservação." },
        { label: "Família, Criança, Jovem e Idoso", link: "/constituicao?article=226", summary: "Proteção especial do Estado à base da sociedade e seus indivíduos mais vulneráveis." },
      ],
    },
  ],
};

// Componente Recursivo para desenhar a árvore
const TreeNode = ({ node, isRoot = false, onOpenSummary }: { node: any; isRoot?: boolean, onOpenSummary: (node: any) => void }) => {
  const hasChildren = node.children && node.children.length > 0;
  // Estado local para expandir/colapsar os galhos filhos
  const [isExpanded, setIsExpanded] = useState(node.defaultExpanded ?? false);

  return (
    <div className="flex items-stretch group relative">
      {/* O nó em si */}
      <div className="flex flex-col justify-center relative">
        <div className="flex items-center">
          <div
            className={`card-pixel px-4 py-2 text-sm relative z-10 transition-transform hover:scale-[1.02] 
              ${isRoot ? "font-bold text-base bg-violet-900 text-white dark:bg-violet-950 border-violet-400 cursor-pointer" : "bg-[var(--pixel-surface)] border-[var(--pixel-border-soft)] text-[var(--pixel-text-main)]"}`}
            style={{ whiteSpace: "nowrap", minWidth: isRoot ? "250px" : "auto" }}
          >
            {/* Se tiver link/resumo, é clicável para abrir a popup */}
            {node.link ? (
              <button 
                onClick={() => onOpenSummary(node)}
                className="hover:text-fuchsia-400 flex items-center gap-2 outline-none text-left"
              >
                {node.label} <Search className="w-3.5 h-3.5" />
              </button>
            ) : (
              <span onClick={() => hasChildren && setIsExpanded(!isExpanded)} className={hasChildren ? "cursor-pointer" : ""}>
                {node.label}
              </span>
            )}
          </div>

          {/* Botão de Expandir/Colapsar (apenas se tiver filhos) */}
          {hasChildren && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="ml-2 z-20 flex items-center justify-center bg-[var(--pixel-page-bg)] border-2 border-[var(--pixel-border-soft)] text-[var(--pixel-text-main)] hover:bg-[var(--pixel-surface)] hover:text-emerald-400 transition-colors"
              style={{ width: "24px", height: "24px", imageRendering: "pixelated", borderRadius: "0" }}
              title={isExpanded ? "Esconder ramificações" : "Mostrar ramificações"}
            >
              {isExpanded ? <MinusCircle className="w-4 h-4" /> : <PlusCircle className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Ramificações conectadas (Renderizadas condicionalmente se estiver expandido) */}
      {hasChildren && isExpanded && (
        <div className="flex items-stretch animate-in slide-in-from-left-4 fade-in duration-300">
          {/* Linha horizontal principal saindo do pai */}
          <div className="w-6 flex flex-col justify-center">
            <div className="h-[2px] bg-[var(--pixel-border-soft)] w-full"></div>
          </div>

          {/* Container vertical das crianças com linha conectora vertical */}
          <div className="flex flex-col py-2 border-l-[2px] border-[var(--pixel-border-soft)] ml-[-2px] space-y-3 justify-center">
            {node.children.map((child: any, idx: number) => (
              <div key={idx} className="flex items-center relative">
                {/* Linha horizontal para cada filho */}
                <div className="w-6 h-[2px] bg-[var(--pixel-border-soft)]"></div>
                <TreeNode node={child} onOpenSummary={onOpenSummary} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default function MentalMapPage() {
  const [, setLocation] = useLocation();
  const [zoom, setZoom] = useState(1);
  const [selectedNode, setSelectedNode] = useState<any | null>(null);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.15, 2));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.15, 0.4));
  const handleZoomReset = () => setZoom(1);

  return (
    <div className="min-h-screen bg-[var(--pixel-page-bg)] text-[var(--pixel-text-main)] overflow-hidden flex flex-col relative">
      <header className="sticky top-0 z-40 bg-[var(--pixel-header)] border-b-2 border-[var(--pixel-border-soft)] shadow-md shrink-0">
        <div className="max-w-[1400px] mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="w-6 h-6 text-[var(--pixel-text-main)]" />
            <h1 className="text-xl font-bold text-[var(--pixel-text-main)] hidden sm:block">Mapa Mental CF/88 Interativo</h1>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Button className="btn-pixel" onClick={() => setLocation("/")}>Voltar</Button>
          </div>
        </div>
      </header>

      {/* Controles de Zoom Flutuantes */}
      <div className="absolute bottom-6 right-6 z-50 flex gap-2 p-2 bg-[var(--pixel-surface)] border-2 border-[var(--pixel-border-soft)] shadow-lg" style={{ borderRadius: 0 }}>
        <button onClick={handleZoomOut} className="p-2 hover:bg-black/10 dark:hover:bg-white/10" title="Afastar">
          <ZoomOut className="w-5 h-5 text-[var(--pixel-text-main)]" />
        </button>
        <button onClick={handleZoomReset} className="p-2 hover:bg-black/10 dark:hover:bg-white/10" title="Tamanho Original">
          <Maximize className="w-5 h-5 text-[var(--pixel-text-main)]" />
        </button>
        <button onClick={handleZoomIn} className="p-2 hover:bg-black/10 dark:hover:bg-white/10" title="Aproximar">
          <ZoomIn className="w-5 h-5 text-[var(--pixel-text-main)]" />
        </button>
      </div>

      <main className="flex-1 relative">
        <div className="absolute top-4 left-4 z-30 pointer-events-none">
          <p className="text-[var(--pixel-text-muted)] text-sm border-l-4 border-emerald-500 pl-4 bg-[var(--pixel-surface)] p-3 card-pixel w-fit pointer-events-auto shadow-md">
            Use [+] e [-] para explorar as ramificações sem poluir a tela.<br/>
            Clique na lupa para ler o resumo de um tema.
          </p>
        </div>

        {/* Container do Mapa Mental arrastável/scrollável */}
        <div className="w-full h-[calc(100vh-64px)] overflow-auto p-12 custom-scrollbar">
          <div 
            className="inline-block min-w-max transition-transform duration-200"
            style={{ 
              transform: `scale(${zoom})`, 
              transformOrigin: "top left",
              paddingTop: "60px", 
              paddingLeft: "20px" 
            }}
          >
            <TreeNode node={MIND_MAP_DATA} isRoot={true} onOpenSummary={setSelectedNode} />
          </div>
        </div>
      </main>

      {/* Modal / Dialog de Resumo */}
      <Dialog open={selectedNode !== null} onOpenChange={(open) => !open && setSelectedNode(null)}>
        <DialogContent className="sm:max-w-[425px] !fixed bg-[var(--pixel-surface)] border-2 border-[var(--pixel-border-soft)] shadow-[2px_2px_0px_rgba(0,0,0,0.4)] p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[var(--pixel-text-main)] mb-2 uppercase border-b-2 border-emerald-500 pb-2">
              {selectedNode?.label}
            </DialogTitle>
            <DialogDescription className="text-base text-[var(--pixel-text-main)] mt-4 leading-relaxed font-semibold">
              {selectedNode?.summary || "Nenhum resumo disponível para este item."}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 pt-4 flex gap-3 justify-end border-t border-[var(--pixel-border-soft)]">
            <DialogClose asChild>
              <Button variant="outline" className="btn-pixel bg-transparent border-[var(--pixel-text-muted)] text-[var(--pixel-text-muted)] hover:bg-black/5 dark:hover:bg-white/5">
                Fechar
              </Button>
            </DialogClose>
            {selectedNode?.link && (
              <Button 
                className="btn-pixel bg-emerald-600 hover:bg-emerald-700 text-white border-b-4 border-emerald-900 active:border-b-0 active:translate-y-1"
                onClick={() => {
                  window.open(selectedNode.link, '_blank', 'noopener,noreferrer');
                }}
              >
                Ler Artigo Completo ➜
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
