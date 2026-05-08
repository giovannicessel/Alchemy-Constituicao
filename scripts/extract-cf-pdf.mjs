#!/usr/bin/env node
/**
 * Extrai texto de um PDF (ex.: CF88_Livro_EC91_2016.pdf) para um .txt
 * Uso: pnpm run content:extract-pdf -- "C:\\caminho\\arquivo.pdf"
 */
import fs from "fs";
import path from "path";
import pdf from "pdf-parse";

const input = process.argv[2];
if (!input) {
  console.error('Informe o caminho do PDF. Ex.: pnpm run content:extract-pdf -- "./CF88_Livro_EC91_2016.pdf"');
  process.exit(1);
}

const abs = path.resolve(input);
if (!fs.existsSync(abs)) {
  console.error("Arquivo não encontrado:", abs);
  process.exit(1);
}

const buffer = fs.readFileSync(abs);
const data = await pdf(buffer);
const out = abs.replace(/\.pdf$/i, "-extraido.txt");
fs.writeFileSync(out, data.text, "utf8");
console.log("Texto salvo em:", out);
console.log("Caracteres:", data.text.length);
