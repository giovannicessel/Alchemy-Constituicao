#!/usr/bin/env python3
import json
import re
from pathlib import Path

from pypdf import PdfReader


ROOT = Path(__file__).resolve().parents[1]
PDF_PATH = ROOT / "CF88_Livro_EC91_2016.pdf"
OUT_PATH = ROOT / "data" / "pdf_articles.json"


def normalize_text(text: str) -> str:
    text = text.replace("\u00ad", "")
    text = text.replace("\r", "\n")
    text = re.sub(r"\n{2,}", "\n", text)
    text = re.sub(r"[ \t]+", " ", text)
    return text


def clean_article_text(text: str) -> str:
    t = text
    t = t.replace("\n", " ")
    t = re.sub(r"\s+", " ", t).strip()
    t = re.sub(r"Constitui..o da Rep.blica Federativa do Brasil", "", t, flags=re.I)
    t = re.sub(r"\b\d{1,3}\b(?=\s*$)", "", t).strip()
    t = re.sub(r"\s{2,}", " ", t).strip()
    return t


def main() -> None:
    if not PDF_PATH.exists():
        raise SystemExit(f"PDF não encontrado: {PDF_PATH}")

    reader = PdfReader(str(PDF_PATH))
    body_parts: list[str] = []
    for page in reader.pages:
        txt = page.extract_text() or ""
        body_parts.append(txt)

    full_text = normalize_text("\n".join(body_parts))
    # Captura apenas o bloco principal da CF (antes de ADCT/índices extensos)
    start_idx = full_text.find("Art. 1")
    if start_idx < 0:
        raise SystemExit("Não encontrei 'Art. 1' no PDF extraído.")
    full_text = full_text[start_idx:]

    matches = list(re.finditer(r"Art\.\s*(\d{1,3})[ºo°]?\s*[–-]?", full_text, flags=re.I))
    by_number: dict[int, str] = {}

    for i, m in enumerate(matches):
        n = int(m.group(1))
        if n < 1 or n > 250:
            continue
        start = m.start()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(full_text)
        chunk = full_text[start:end]
        cleaned = clean_article_text(chunk)
        # Mantém a versão mais longa do mesmo artigo
        prev = by_number.get(n, "")
        if len(cleaned) > len(prev):
            by_number[n] = cleaned

    articles = []
    for n in sorted(by_number):
        txt = by_number[n]
        # Garante prefixo padrão
        if not txt.lower().startswith("art."):
            txt = f"Art. {n}. {txt}"
        articles.append({"number": n, "originalText": txt})

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_text(json.dumps(articles, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Extraídos {len(articles)} artigos para {OUT_PATH}")


if __name__ == "__main__":
    main()

