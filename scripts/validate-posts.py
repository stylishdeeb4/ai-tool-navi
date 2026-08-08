#!/usr/bin/env python3
"""
記事の整合性チェック

自動生成した記事をそのまま公開すると、壊れた内部リンクや存在しない
カテゴリが混ざって、サイト全体の評価を落とす。公開前にここで止める。

  python3 scripts/validate-posts.py

チェック内容:
  - frontmatter の必須項目（title / date / category / description / tags）
  - カテゴリが lib/categories.ts に存在するか
  - 記事内の /blog/... リンクの宛先が存在するか
  - {{AFF:key}} が lib/affiliates.ts に存在するキーか
  - image 指定がある場合、public/ に実ファイルがあるか
  - タイトル・slug の重複
"""

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
POSTS_DIR = ROOT / "content" / "posts"
PUBLIC_DIR = ROOT / "public"
CATEGORIES_TS = ROOT / "lib" / "categories.ts"
AFFILIATES_TS = ROOT / "lib" / "affiliates.ts"

REQUIRED = ["title", "date", "category", "description"]


def valid_categories() -> set[str]:
    return set(re.findall(r"name:\s*'([^']+)'", CATEGORIES_TS.read_text(encoding="utf-8")))


def valid_aff_keys() -> set[str]:
    body = AFFILIATES_TS.read_text(encoding="utf-8").split("export const affiliates", 1)[-1]
    return set(re.findall(r"^  ([a-zA-Z0-9_]+):\s*\{", body, re.M))


def main() -> int:
    if not POSTS_DIR.exists():
        print("記事ディレクトリがありません")
        return 1

    categories = valid_categories()
    aff_keys = valid_aff_keys()
    paths = sorted(POSTS_DIR.glob("*.mdx"))
    slugs = {p.stem for p in paths}

    errors: list[str] = []
    warnings: list[str] = []
    titles: dict[str, str] = {}

    for path in paths:
        rel = path.relative_to(ROOT)
        text = path.read_text(encoding="utf-8")

        if not text.startswith("---"):
            errors.append(f"{rel}: frontmatter がありません")
            continue

        parts = text.split("---", 2)
        fm, body = parts[1], parts[2]

        def field(name: str) -> str | None:
            m = re.search(rf'^{name}:\s*"([^"]*)"', fm, re.M)
            return m.group(1) if m else None

        for key in REQUIRED:
            if not field(key):
                errors.append(f"{rel}: frontmatter に {key} がありません")

        category = field("category")
        if category and category not in categories:
            errors.append(f"{rel}: 未知のカテゴリ '{category}'（lib/categories.ts に追加が必要）")

        date = field("date")
        if date and not re.fullmatch(r"\d{4}-\d{2}-\d{2}", date):
            errors.append(f"{rel}: date の形式が不正 '{date}'")

        title = field("title")
        if title:
            if title in titles:
                warnings.append(f"{rel}: タイトルが {titles[title]} と重複")
            titles[title] = str(rel)

        if not re.search(r"^tags:", fm, re.M):
            warnings.append(f"{rel}: tags がありません")

        image = field("image")
        if image and not (PUBLIC_DIR / image.lstrip("/")).exists():
            errors.append(f"{rel}: image '{image}' が public/ に存在しません")

        for slug in re.findall(r"\]\(/blog/([a-z0-9-]+)\)", body):
            if slug not in slugs:
                errors.append(f"{rel}: 内部リンク先が存在しません /blog/{slug}")

        for key in re.findall(r"\{\{AFF:([a-zA-Z0-9_-]+)\}\}", body):
            if key not in aff_keys:
                errors.append(f"{rel}: 未知のアフィリキー '{key}'")

        if re.search(r"^# (?!#)", body, re.M):
            warnings.append(f"{rel}: 本文にH1（#）があります。H2以下にしてください")

    print(f"検査した記事: {len(paths)}本")
    for w in warnings:
        print(f"⚠️  {w}")
    for e in errors:
        print(f"❌ {e}")

    if errors:
        print(f"\n{len(errors)}件のエラーがあります。")
        return 1

    print("✅ 問題なし" + (f"（警告 {len(warnings)}件）" if warnings else ""))
    return 0


if __name__ == "__main__":
    sys.exit(main())
