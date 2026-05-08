# TODO - Constituição Interativa

## Fase 1: Estrutura de Dados e Backend

- [x] Criar schema do banco de dados (títulos, capítulos, artigos, quiz, flashcards, progresso)
- [x] Implementar procedures tRPC para listar títulos e capítulos
- [x] Implementar procedures tRPC para buscar artigos por ID/capítulo
- [x] Implementar procedures tRPC para quiz (get questions, submit answers, calcular score)
- [x] Implementar procedures tRPC para progresso do usuário
- [x] Implementar procedures tRPC para achievements/gamificação
- [x] Implementar procedures tRPC para flashcards
- [x] Implementar procedures tRPC para emendas constitucionais
- [ ] Implementar busca por palavras-chave
- [ ] Implementar curiosidades

## Fase 2: Design Visual e Layout

- [x] Definir paleta de cores (pixel art 16-bit: verde lime, cyan, roxo, amarelo)
- [x] Definir tipografia (Press Start 2P para pixel art retro)
- [x] Criar componentes base (Card, Button, Input, Modal) em pixel art
- [x] Criar layout principal com sidebar + content + right panel
- [x] Criar componente de navegação de títulos/capítulos
- [x] Criar componente de busca
- [x] Implementar efeito de scanline
- [x] Customizar scrollbar em estilo pixel art
- [x] Adicionar animações pixel art (pulse, bounce, glow, glitch)

## Fase 3: Interface Principal

- [x] Criar página Home com introdução e CTA (pixel art)
- [x] Criar página de Navegação com sidebar interativa
- [x] Criar componente de visualização de artigos (split view: simplificado + original)
- [ ] Aplicar pixel art em página de Constituição
- [ ] Integrar dados reais de artigos nas páginas
- [ ] Implementar busca por palavras-chave
- [ ] Implementar navegação entre artigos (anterior/próximo)
- [ ] Implementar breadcrumb de navegação

## Fase 4: Sistema de Quiz

- [x] Criar componente de Quiz com perguntas de múltipla escolha
- [x] Implementar lógica de pontuação
- [x] Implementar feedback de respostas corretas/incorretas
- [x] Criar página de resultados do quiz
- [ ] Aplicar pixel art em página de Quiz
- [ ] Integrar dados reais de quiz
- [ ] Implementar histórico de quizzes completados

## Fase 5: Gamificação

- [x] Criar sistema de pontos (por artigo lido, quiz completado)
- [x] Criar sistema de achievements/badges
- [x] Criar barra de progresso por seção
- [x] Criar painel de progresso do usuário
- [x] Implementar visualização de conquistas

## Fase 6: Flashcards

- [x] Criar componente de flashcard interativo
- [x] Implementar sistema de estudo com flashcards
- [x] Implementar marcação de flashcards como "aprendido"
- [ ] Criar página de revisão de flashcards

## Fase 7: Emendas Constitucionais

- [x] Criar linha do tempo visual das emendas
- [ ] Implementar filtro por período/tipo
- [ ] Criar componente de detalhes da emenda
- [ ] Implementar busca de emendas

## Fase 8: Curiosidades e Contexto

- [ ] Criar modo "Curiosidades" com fatos interessantes
- [ ] Implementar contexto histórico por artigo
- [ ] Criar componente de visualização de curiosidades

## Fase 9: Painel de Progresso

- [ ] Criar dashboard de progresso do usuário
- [ ] Mostrar seções lidas, quizzes completados, pontuação
- [ ] Implementar estatísticas de estudo
- [ ] Criar visualização de metas de aprendizado

## Fase 10: Testes e Otimização

- [ ] Escrever testes unitários (vitest)
- [ ] Testar funcionalidades principais
- [ ] Otimizar performance
- [ ] Testar responsividade (mobile, tablet, desktop)
- [ ] Testar acessibilidade

## Fase 11: Conteúdo

- [x] Extrair e estruturar conteúdo do PDF (805 artigos extraídos)
- [x] Reescrever artigos em linguagem simplificada (primeiros 10)
- [x] Inserir artigos no banco de dados (primeiros 10)
- [ ] Completar reescrita de todos os 805 artigos
- [ ] Criar quiz por capítulo com dados reais
- [ ] Criar flashcards com conceitos-chave
- [ ] Adicionar curiosidades e contexto histórico
- [ ] Adicionar emendas constitucionais

## Fase 12: Deploy e Publicação

- [ ] Criar checkpoint final
- [ ] Deploy da plataforma
- [ ] Publicação e testes em produção
