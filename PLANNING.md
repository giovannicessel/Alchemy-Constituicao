# Plano de Implementação - Constituição Interativa

## Fase 1: Extração e Estruturação de Conteúdo

### Estrutura da CF/88 (conforme PDF)

**Títulos Principais:**
1. Preâmbulo
2. Título I – Dos Princípios Fundamentais
3. Título II – Dos Direitos e Garantias Fundamentais
   - Capítulo I – Dos Direitos e Deveres Individuais e Coletivos (Arts. 1-16)
   - Capítulo II – Dos Direitos Sociais (Arts. 6-11)
   - Capítulo III – Da Nacionalidade (Arts. 12-13)
   - Capítulo IV – Dos Direitos Políticos (Arts. 14-16)
   - Capítulo V – Dos Partidos Políticos (Arts. 17)
4. Título III – Da Organização do Estado
5. Título IV – Da Organização dos Poderes
6. Título V – Da Defesa do Estado e das Instituições Democráticas
7. Título VI – Da Tributação e do Orçamento
8. Título VII – Da Ordem Econômica e Financeira
9. Título VIII – Da Ordem Social
10. Título IX – Das Disposições Constitucionais Gerais
11. Ato das Disposições Constitucionais Transitórias

### Estratégia de Reescrita

Para cada artigo, criar:
1. **Versão Simplificada**: Linguagem acessível, exemplos práticos do dia a dia
2. **Texto Original**: Disponível lado a lado para comparação
3. **Conceitos-chave**: Palavras-chave destacadas para flashcards
4. **Curiosidade**: Contexto histórico ou fato interessante

### Estrutura de Dados (Banco de Dados)

```
Tabelas principais:
- articles (id, titulo, number, simplified_text, original_text, chapter_id, section_id)
- chapters (id, titulo, titulo_id, description)
- titles (id, titulo, order)
- amendments (id, numero, data, description, articles_affected)
- quiz_questions (id, chapter_id, question, options[], correct_answer, explanation)
- flashcards (id, article_id, front, back, category)
- user_progress (user_id, article_id, read, quiz_completed, score)
- user_achievements (user_id, achievement_id, earned_at)
```

## Fase 2: Design Visual

### Identidade Visual
- **Tema**: Elegante, sofisticado, credível
- **Paleta de cores**: Verde (Constituição), Ouro (autoridade), Branco (clareza)
- **Tipografia**: Serif para títulos (autoridade), Sans-serif para corpo (legibilidade)
- **Estilo**: Minimalista com detalhes refinados

### Componentes Principais
1. **Sidebar**: Navegação por títulos/capítulos com busca
2. **Main Content**: Artigo com versão simplificada + original
3. **Right Panel**: Flashcards, curiosidades, progresso
4. **Modal**: Quiz, achievements
5. **Timeline**: Emendas constitucionais

## Fase 3-7: Implementação

### Backend (tRPC)
- Procedures para listar títulos, capítulos, artigos
- Procedures para quiz (get questions, submit answers)
- Procedures para progresso do usuário
- Procedures para curiosidades e emendas

### Frontend
- Navegação interativa
- Busca por palavras-chave
- Visualização de artigos com split view
- Quiz interativo
- Gamificação (pontos, badges)
- Flashcards
- Timeline de emendas
- Painel de progresso

## Fase 8: Testes e Entrega

- Testes unitários (vitest)
- Testes de integração
- Otimização de performance
- Deploy e publicação
