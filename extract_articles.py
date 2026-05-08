#!/usr/bin/env python3
"""
Extrai artigos de um .txt (exportado do PDF da CF/88) e enriquece com texto didático.

Prioridade do material pedagógico:
1) content/didactic-bundle.json (mais completo e revisado no projeto)
2) overrides pontuais opcionais em content/didactic-overrides.json

Saída padrão: data/articles_extracted.json
"""
from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent

ARTICLE_LINE_RE = re.compile(
    r"^Art\.?\s*(?P<num>\d+[a-z]?)[ºª°]?\s*(?P<rest>.*)$",
    re.IGNORECASE,
)


def load_json(path: Path) -> dict | list | None:
    if not path.is_file():
        return None
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def load_didactic_maps(root: Path) -> tuple[dict[int, dict], dict[int, dict]]:
    """Retorna (bundlePorNumero, overridesPorNumero)."""
    bundle_map: dict[int, dict] = {}
    bundle_path = root / "content" / "didactic-bundle.json"
    raw = load_json(bundle_path)
    if isinstance(raw, dict) and isinstance(raw.get("articles"), list):
        for item in raw["articles"]:
            try:
                n = int(item["number"])
            except (KeyError, TypeError, ValueError):
                continue
            bundle_map[n] = {
                "simplifiedText": item.get("simplifiedText") or "",
                "practicalExample": item.get("practicalExample") or "",
                "curiosity": item.get("curiosity") or "",
                "keywordsTags": item.get("keywordsTags") or "",
                "titleNumber": item.get("titleNumber"),
                "chapterOrder": item.get("chapterOrder"),
            }

    override_map: dict[int, dict] = {}
    ov_path = root / "content" / "didactic-overrides.json"
    raw_ov = load_json(ov_path)
    if isinstance(raw_ov, dict) and isinstance(raw_ov.get("articles"), list):
        for item in raw_ov["articles"]:
            try:
                n = int(item["number"])
            except (KeyError, TypeError, ValueError):
                continue
            override_map[n] = {k: v for k, v in item.items() if k != "number"}

    return bundle_map, override_map

def load_pdf_map(root: Path) -> dict[int, dict]:
    pdf_map: dict[int, dict] = {}
    pdf_path = root / "data" / "pdf_articles.json"
    raw = load_json(pdf_path)
    if isinstance(raw, list):
        for item in raw:
            try:
                n = int(item["number"])
            except (KeyError, TypeError, ValueError):
                continue
            txt = str(item.get("originalText") or "").strip()
            if txt:
                pdf_map[n] = {"originalText": txt}
    return pdf_map


def normalize_text(text: str) -> str:
    """Corrige alguns padrões comuns de mojibake/extração."""
    replacements = {
        "Constitui��o": "Constituição",
        "participa��o": "participação",
        "organiza��o": "organização",
        "na��o": "nação",
        "Rep�blica": "República",
        "s�o": "são",
        "n�o": "não",
        "�": "",
        "\u00ad": "",
    }
    out = text
    for bad, good in replacements.items():
        out = out.replace(bad, good)
    return out


def merge_didactic(
    n: int,
    bundle_map: dict[int, dict],
    override_map: dict[int, dict],
) -> dict[str, str | int | None]:
    """Une campos didáticos; override sobrescreve bundle só nos campos informados."""
    base: dict = dict(bundle_map.get(n, {}))
    ov = override_map.get(n, {})
    for key in ("simplifiedText", "practicalExample", "curiosity", "keywordsTags"):
        if key in ov and ov[key] not in (None, ""):
            base[key] = ov[key]
    for key in ("titleNumber", "chapterOrder"):
        if key in ov and ov[key] is not None:
            base[key] = ov[key]
    return {
        "simplifiedText": base.get("simplifiedText") or "",
        "practicalExample": base.get("practicalExample") or "",
        "curiosity": base.get("curiosity") or "",
        "keywordsTags": base.get("keywordsTags") or "",
        "titleNumber": base.get("titleNumber"),
        "chapterOrder": base.get("chapterOrder"),
    }


def strip_ec_notes(text: str) -> str:
    text = re.sub(r"\(EC[^)]*\)", "", text, flags=re.IGNORECASE)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def extract_articles_from_text(content: str) -> list[dict]:
    lines = normalize_text(content).split("\n")
    articles: list[dict] = []
    i = 0

    while i < len(lines):
        line = lines[i].strip()
        m = ARTICLE_LINE_RE.match(line)

        if not m:
            i += 1
            continue

        article_num_str = m.group("num")
        article_text = (m.group("rest") or "").strip()

        i += 1
        while i < len(lines):
            next_line = lines[i].strip()
            if ARTICLE_LINE_RE.match(next_line):
                break
            if next_line and re.match(r"^(TÍTULO|CAPÍTULO|CAPITULO)\s", next_line, re.IGNORECASE):
                break
            if next_line and not next_line.startswith("(EC"):
                article_text += " " + next_line
            i += 1

        article_text = strip_ec_notes(normalize_text(article_text))

        try:
            article_num = int(
                article_num_str.lower().replace("a", "").replace("b", "").replace("c", "")
            )
        except ValueError:
            continue

        articles.append({"number": article_num, "originalText": article_text})

    articles.sort(key=lambda x: (x["number"], len(x["originalText"])))
    dedup: dict[int, dict] = {}
    for a in articles:
        if a["number"] not in dedup or len(a["originalText"]) > len(
            dedup[a["number"]]["originalText"]
        ):
            dedup[a["number"]] = a
    return list(dedup.values())


def main() -> None:
    parser = argparse.ArgumentParser(description="Extrai artigos da CF a partir de texto plano.")
    parser.add_argument(
        "--input",
        "-i",
        type=Path,
        default=ROOT / "data" / "constituicao_completa.txt",
        help="Arquivo .txt com a Constituição (ex.: extraído do PDF)",
    )
    parser.add_argument(
        "--output",
        "-o",
        type=Path,
        default=ROOT / "data" / "articles_extracted.json",
        help="JSON de saída",
    )
    args = parser.parse_args()

    if not args.input.is_file():
        raise SystemExit(
            f"Arquivo de entrada não encontrado: {args.input}\n"
            "Coloque o texto completo em data/constituicao_completa.txt ou passe --input."
        )

    content = None
    for enc in ("utf-8", "utf-8-sig", "cp1252", "latin-1"):
        try:
            with open(args.input, "r", encoding=enc) as f:
                content = f.read()
            break
        except UnicodeDecodeError:
            continue
    if content is None:
        raise SystemExit(f"Não foi possível ler o arquivo com encodings suportados: {args.input}")
    content = normalize_text(content)

    bundle_map, override_map = load_didactic_maps(ROOT)
    pdf_map = load_pdf_map(ROOT)
    extracted = extract_articles_from_text(content)
    extracted_by_number = {item["number"]: item for item in extracted}

    # Garante Arts. 1..250 no consolidado quando o TXT falha em páginas iniciais/finais.
    for n in range(1, 251):
        if n in extracted_by_number:
            continue
        fallback = pdf_map.get(n)
        if fallback and fallback.get("originalText"):
            extracted_by_number[n] = {"number": n, "originalText": strip_ec_notes(fallback["originalText"])}
        elif n in bundle_map:
            # fallback mínimo para não deixar buraco estrutural
            extracted_by_number[n] = {"number": n, "originalText": f"Art. {n}. [texto legal pendente de revisão da fonte]"}
    extracted = sorted(extracted_by_number.values(), key=lambda x: x["number"])

    out: list[dict] = []
    for idx, item in enumerate(extracted, start=1):
        n = item["number"]
        didactic = merge_didactic(n, bundle_map, override_map)
        row = {
            "id": idx,
            "number": n,
            "originalText": item["originalText"],
            "simplifiedText": didactic["simplifiedText"],
            "practicalExample": didactic["practicalExample"],
            "curiosity": didactic["curiosity"],
            "keywordsTags": didactic["keywordsTags"],
        }
        if didactic.get("titleNumber") is not None:
            row["titleNumber"] = didactic["titleNumber"]
        if didactic.get("chapterOrder") is not None:
            row["chapterOrder"] = didactic["chapterOrder"]
        out.append(row)

    args.output.parent.mkdir(parents=True, exist_ok=True)
    with open(args.output, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=2)

    with_bundle = sum(1 for r in out if r.get("simplifiedText"))
    print(f"Extraidos {len(out)} artigos -> {args.output}")
    print(f"Com texto didatico preenchido (bundle/overrides): {with_bundle}")


if __name__ == "__main__":
    main()
