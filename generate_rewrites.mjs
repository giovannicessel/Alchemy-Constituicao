#!/usr/bin/env node
import fs from 'fs';
import { invokeLLM } from './server/_core/llm.ts';

// Ler artigos extraídos
const articlesPath = './articles_data.json';
const articles = JSON.parse(fs.readFileSync(articlesPath, 'utf-8'));

console.log(`📚 Processando ${articles.length} artigos...`);
console.log('🤖 Gerando reescritas didáticas com IA...\n');

// Processar em lotes para não sobrecarregar
const batchSize = 10;
let processed = 0;

for (let i = 0; i < articles.length; i += batchSize) {
  const batch = articles.slice(i, i + batchSize);
  
  for (const article of batch) {
    const hasSimplified = Boolean(article.simplifiedText && article.simplifiedText.length > 10);
    const hasExample = Boolean(article.practicalExample && article.practicalExample.length > 10);
    const hasCuriosity = Boolean(article.curiosity && article.curiosity.length > 10);
    if (hasSimplified && hasExample && hasCuriosity) continue;

    try {
      const prompt = `Você é um especialista em Direito Constitucional que sabe explicar leis de forma simples e didática.

ARTIGO ORIGINAL:
Art. ${article.number}. ${article.originalText}

TAREFA:
1. Reescreva este artigo em linguagem MUITO SIMPLES e ACESSÍVEL (como se explicasse para um adolescente)
2. Forneça um EXEMPLO PRÁTICO do dia a dia
3. Forneça uma CURIOSIDADE ou CONTEXTO HISTÓRICO

Responda EXATAMENTE neste formato JSON (sem markdown, sem explicações extras):
{
  "simplified": "texto simplificado aqui",
  "example": "exemplo prático aqui",
  "curiosity": "curiosidade aqui"
}`;

      const response = await invokeLLM({
        messages: [
          { role: 'system', content: 'Você é um especialista em Direito Constitucional. Sempre responda em JSON válido.' },
          { role: 'user', content: prompt }
        ]
      });

      const content = response.choices[0].message.content;
      
      // Tentar extrair JSON da resposta
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        article.simplifiedText = (parsed.simplified || article.simplifiedText || '').trim();
        article.practicalExample = (parsed.example || article.practicalExample || '').trim();
        article.curiosity = (parsed.curiosity || article.curiosity || '').trim();
        processed++;
        
        if (processed % 10 === 0) {
          console.log(`✅ Processados ${processed}/${articles.length} artigos...`);
          // checkpoint para evitar perda em execução longa
          fs.writeFileSync(articlesPath, JSON.stringify(articles, null, 2), 'utf-8');
        }
      }
    } catch (error) {
      console.error(`❌ Erro ao processar artigo ${article.number}:`, error.message);
    }
  }
}

// Salvar artigos atualizados
fs.writeFileSync(articlesPath, JSON.stringify(articles, null, 2), 'utf-8');
console.log(`\n✅ Concluído! ${processed} artigos processados e salvos em ${articlesPath}`);
