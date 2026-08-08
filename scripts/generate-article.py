#!/usr/bin/env python3
"""
AIツールナビ 記事自動生成スクリプト

GitHub Actions から毎日実行される。やっていること:

  1. content/posts/ の既存記事を読み、まだ書いていないテーマを1つ選ぶ
  2. 既存記事の一覧を渡して、内部リンク付きの記事を Claude に書かせる
  3. 出力を検証し、壊れた内部リンク・未知のCTAトークンを落としてから保存

「ブラウザで操作する」必要はなく、GitHubのActions画面から実行・停止できる。
特定のテーマだけ書きたいときは workflow_dispatch の slug 入力を使う。
"""

import argparse
import json
import os
import re
import sys
from datetime import date
from pathlib import Path

import anthropic

ROOT = Path(__file__).resolve().parent.parent
POSTS_DIR = ROOT / "content" / "posts"
CATEGORIES_TS = ROOT / "lib" / "categories.ts"
AFFILIATES_TS = ROOT / "lib" / "affiliates.ts"

MODEL = "claude-opus-5"

# 記事1本あたりのCTAボックスの上限。増やすほど読了率とAdSense評価に響く。
MAX_AFF_TOKENS = 3
# 内部リンクの目安（少なすぎると回遊しない、多すぎると読みにくい）
MIN_INTERNAL_LINKS = 3

# -------------------------------------------------------------------------
# 記事テーマのバックログ
# -------------------------------------------------------------------------
# 上から順に「まだ書いていないもの」が選ばれる。書き終えたテーマは自動で
# スキップされるので、ここに追記していけば公開の順番だけを管理すればよい。
# aff は記事に置きたいアフィリ案件のキー（lib/affiliates.ts のキー）。
# 実リンク未設定のキーは自動的に外れる。

TOPICS = [
    {
        "slug": "coconala-vs-crowdworks",
        "title_hint": "ココナラとクラウドワークスの違い｜副業初心者はどっちを使うべきか",
        "category": "副業・収益化",
        "tags": ["ココナラ", "クラウドワークス", "比較", "副業", "初心者"],
        "aff": ["coconala", "crowdworks"],
        "angle": "出品型と応募型の違い、手数料、案件の取りやすさ、併用のすすめ",
    },
    {
        "slug": "coconala-tesuryo-furikomi",
        "title_hint": "ココナラの手数料と振込の仕組み｜手取りはいくら残るか計算してみた",
        "category": "副業・収益化",
        "tags": ["ココナラ", "手数料", "振込", "確定申告", "副業"],
        "aff": ["coconala"],
        "angle": "販売手数料の考え方、価格別の手取り早見表、振込のタイミング、経費と申告",
    },
    {
        "slug": "ai-shigoto-nakunaru",
        "title_hint": "AIで仕事はなくなる？なくならない仕事と今からやるべき準備",
        "category": "副業・収益化",
        "tags": ["AI", "仕事", "将来性", "スキル", "2026年"],
        "aff": ["shiftai", "daitra"],
        "angle": "置き換わる作業と残る仕事の線引き、AIを使う側に回る具体的な手順",
    },
    {
        "slug": "notebooklm-tsukaikata",
        "title_hint": "NotebookLMの使い方完全ガイド｜資料をAIに読ませて要約・活用する",
        "category": "比較・レビュー",
        "tags": ["NotebookLM", "Google", "使い方", "AI活用"],
        "aff": [],
        "angle": "登録から資料の読み込み、要約・質問・音声化まで初心者向けに",
    },
    {
        "slug": "ai-gijiroku-mojiokoshi",
        "title_hint": "AI文字起こし・議事録作成ツールおすすめ比較【2026年】無料で試せる順",
        "category": "比較・レビュー",
        "tags": ["文字起こし", "議事録", "AIツール", "比較", "無料"],
        "aff": ["coconala"],
        "angle": "精度・料金・使いやすさで比較し、副業として受注する道筋まで",
    },
    {
        "slug": "ai-shikaku-benkyou",
        "title_hint": "AIを使った資格勉強のやり方｜ChatGPTで学習効率を上げる7つの方法",
        "category": "ChatGPT",
        "tags": ["ChatGPT", "資格", "勉強法", "学習", "活用術"],
        "aff": ["daitra"],
        "angle": "問題作成・要約・暗記・弱点分析など具体的なプロンプト付きで",
    },
    {
        "slug": "ai-presentation-shiryou",
        "title_hint": "AIでプレゼン資料を作る方法｜構成から清書まで最短で仕上げる手順",
        "category": "ChatGPT",
        "tags": ["ChatGPT", "資料作成", "プレゼン", "時短", "仕事術"],
        "aff": ["canva", "coconala"],
        "angle": "構成案→本文→デザインの流れ、そのまま受注につなげる方法",
    },
]


# -------------------------------------------------------------------------
# リポジトリの状態を読む
# -------------------------------------------------------------------------

def read_valid_categories() -> list[str]:
    """lib/categories.ts を単一情報源としてカテゴリ名を取り出す。"""
    text = CATEGORIES_TS.read_text(encoding="utf-8")
    return re.findall(r"name:\s*'([^']+)'", text)


def read_affiliate_keys() -> dict[str, bool]:
    """lib/affiliates.ts のキーと「実リンクが入っているか」を返す。"""
    text = AFFILIATES_TS.read_text(encoding="utf-8")
    body = text.split("export const affiliates", 1)[-1]
    keys: dict[str, bool] = {}
    current = None
    for line in body.splitlines():
        m = re.match(r"^  ([a-zA-Z0-9_]+):\s*\{", line)
        if m:
            current = m.group(1)
            keys[current] = False
            continue
        if current:
            m = re.match(r"^\s*url:\s*'([^']*)'", line)
            if m:
                keys[current] = bool(m.group(1))
    return keys


def read_posts() -> list[dict]:
    """既存記事の slug / title / category を取り出す（内部リンク候補になる）。"""
    posts = []
    for path in sorted(POSTS_DIR.glob("*.mdx")):
        text = path.read_text(encoding="utf-8")
        fm = text.split("---", 2)[1] if text.startswith("---") else ""
        def field(name: str) -> str:
            m = re.search(rf'^{name}:\s*"([^"]*)"', fm, re.M)
            return m.group(1) if m else ""
        posts.append({
            "slug": path.stem,
            "title": field("title"),
            "category": field("category"),
        })
    return posts


# -------------------------------------------------------------------------
# テーマ選択
# -------------------------------------------------------------------------

def pick_topic(existing_slugs: set[str], wanted_slug: str | None) -> dict | None:
    if wanted_slug:
        for t in TOPICS:
            if t["slug"] == wanted_slug:
                if t["slug"] in existing_slugs:
                    print(f"⚠️  {wanted_slug} は既に存在します（上書きはしません）")
                    return None
                return t
        print(f"⚠️  slug '{wanted_slug}' はバックログにありません")
        return None

    for t in TOPICS:
        if t["slug"] not in existing_slugs:
            return t
    return None


# -------------------------------------------------------------------------
# 生成
# -------------------------------------------------------------------------

ARTICLE_SCHEMA = {
    "type": "object",
    "properties": {
        "title": {"type": "string", "description": "30〜60文字。年号や数字を含める"},
        "description": {"type": "string", "description": "検索意図に合わせた説明文。120〜160文字"},
        "tags": {"type": "array", "items": {"type": "string"}, "description": "5〜8個"},
        "body": {"type": "string", "description": "frontmatterを含まないMarkdown本文"},
    },
    "required": ["title", "description", "tags", "body"],
    "additionalProperties": False,
}


def build_prompt(topic: dict, posts: list[dict], aff_lines: list[str]) -> str:
    link_candidates = "\n".join(
        f"- [{p['title']}](/blog/{p['slug']})" for p in posts
    )
    aff_block = "\n".join(aff_lines) if aff_lines else "（今回は設置しない）"

    return f"""あなたは日本語のAIメディア「AIツールナビ」の編集者です。
以下の条件で記事本文を書いてください。

【テーマ】{topic['title_hint']}
【カテゴリ】{topic['category']}
【切り口】{topic['angle']}

【記事の要件】
- 文字数：3,000〜5,000字
- 冒頭：読者の悩みに共感するリード文（2〜3文）から入り、結論を先に示す
- 見出しはH2（##）とH3（###）で構造化する。H1は使わない
- 比較や一覧は表（Markdownテーブル）を使って読みやすくする
- 具体的な手順・数字・判断基準を入れる。抽象論だけで終わらせない
- 変動しうる数値（手数料・料金など）は「最新は公式サイトで確認」と注記する
- 収入や成果を保証する断定表現は使わない（「〜が目指せる」等の表現にする）
- 末尾は「## まとめ」で、要点の箇条書きと次の一歩を示す

【内部リンク】
本文中に、以下の既存記事から関連性の高いものを{MIN_INTERNAL_LINKS}〜5本、
自然な文脈でリンクしてください。**リストにあるパスだけ**を使い、
存在しないURLは絶対に書かないでください。

{link_candidates}

【CTAトークン】
以下のトークンを、読者が納得した直後の位置に単独の行として置いてください。
記事全体で最大{MAX_AFF_TOKENS}個まで。導入の直後や見出しの直後には置かないこと。

{aff_block}

出力は指定のJSONスキーマに従ってください。bodyにはfrontmatterを含めないでください。
"""


def generate(topic: dict, posts: list[dict], aff_lines: list[str]) -> dict:
    client = anthropic.Anthropic()
    prompt = build_prompt(topic, posts, aff_lines)

    # 長文生成なのでストリーミング（非ストリーミングだとHTTPタイムアウトの恐れ）
    with client.messages.stream(
        model=MODEL,
        max_tokens=32000,
        thinking={"type": "adaptive"},
        output_config={
            "effort": "high",
            "format": {"type": "json_schema", "schema": ARTICLE_SCHEMA},
        },
        messages=[{"role": "user", "content": prompt}],
    ) as stream:
        message = stream.get_final_message()

    if message.stop_reason == "refusal":
        raise SystemExit("生成が拒否されました。テーマを見直してください。")

    text = "".join(b.text for b in message.content if b.type == "text")
    return json.loads(text)


# -------------------------------------------------------------------------
# 後処理（壊れたリンク・未知のCTAを落とす）
# -------------------------------------------------------------------------

def sanitize(body: str, valid_slugs: set[str], allowed_aff: list[str]) -> tuple[str, list[str]]:
    notes = []

    # 存在しない /blog/... リンクはリンクを外して文字だけ残す
    def fix_link(m: re.Match) -> str:
        label, slug = m.group(1), m.group(2)
        if slug in valid_slugs:
            return m.group(0)
        notes.append(f"存在しない内部リンクを解除: /blog/{slug}")
        return label

    body = re.sub(r"\[([^\]]+)\]\(/blog/([a-z0-9-]+)\)", fix_link, body)

    # 未知のCTAトークンを削除し、許可キーでも上限を超えたものは落とす
    used = 0
    def fix_aff(m: re.Match) -> str:
        nonlocal used
        key = m.group(1)
        if key not in allowed_aff:
            notes.append(f"未許可のCTAトークンを削除: {key}")
            return ""
        if used >= MAX_AFF_TOKENS:
            notes.append(f"上限超過のCTAトークンを削除: {key}")
            return ""
        used += 1
        return m.group(0)

    body = re.sub(r"\{\{AFF:([a-zA-Z0-9_-]+)\}\}", fix_aff, body)

    # H1が混ざっていたらH2に降格（ページ側でtitleがH1のため）
    body = re.sub(r"^# (?!#)", "## ", body, flags=re.M)

    body = re.sub(r"\n{3,}", "\n\n", body).strip() + "\n"
    return body, notes


def write_post(topic: dict, article: dict, body: str) -> Path:
    tags = "\n".join(f'  - "{t}"' for t in article["tags"])
    content = f"""---
title: "{article['title'].replace('"', '')}"
date: "{date.today().isoformat()}"
category: "{topic['category']}"
tags:
{tags}
description: "{article['description'].replace('"', '')}"
---

{body}"""
    path = POSTS_DIR / f"{topic['slug']}.mdx"
    path.write_text(content, encoding="utf-8")
    return path


# -------------------------------------------------------------------------

def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--slug", help="バックログから特定のテーマを指定して生成する")
    parser.add_argument("--dry-run", action="store_true", help="生成せず、次に書くテーマだけ表示")
    args = parser.parse_args()

    POSTS_DIR.mkdir(parents=True, exist_ok=True)
    posts = read_posts()
    existing = {p["slug"] for p in posts}

    topic = pick_topic(existing, args.slug)
    if topic is None:
        print("✅ バックログに未執筆のテーマがありません。TOPICS に追記してください。")
        return 0

    categories = read_valid_categories()
    if topic["category"] not in categories:
        print(f"❌ カテゴリ '{topic['category']}' は lib/categories.ts にありません")
        return 1

    aff_status = read_affiliate_keys()
    allowed_aff = [k for k in topic["aff"] if aff_status.get(k)]
    skipped = [k for k in topic["aff"] if k in aff_status and not aff_status[k]]
    if skipped:
        print(f"ℹ️  実リンク未設定のため除外: {', '.join(skipped)}")

    aff_lines = [f"- {{{{AFF:{k}}}}}" for k in allowed_aff]

    print(f"📌 テーマ: {topic['title_hint']}")
    print(f"   slug: {topic['slug']} / カテゴリ: {topic['category']}")
    print(f"   CTA: {allowed_aff or 'なし'} / 内部リンク候補: {len(posts)}本")

    if args.dry_run:
        return 0

    if not os.environ.get("ANTHROPIC_API_KEY"):
        print("❌ ANTHROPIC_API_KEY が設定されていません")
        return 1

    print("📝 生成中...")
    article = generate(topic, posts, aff_lines)

    body, notes = sanitize(article["body"], existing | {topic["slug"]}, allowed_aff)
    for n in notes:
        print(f"   🔧 {n}")

    link_count = len(re.findall(r"\]\(/blog/", body))
    if link_count < MIN_INTERNAL_LINKS:
        print(f"⚠️  内部リンクが{link_count}本しかありません（目安{MIN_INTERNAL_LINKS}本）")

    path = write_post(topic, article, body)
    print(f"✅ 保存: {path.relative_to(ROOT)}")
    print(f"   タイトル: {article['title']}")
    print(f"   本文: 約{len(body)}文字 / 内部リンク{link_count}本 / CTA{body.count('{{AFF:')}個")
    return 0


if __name__ == "__main__":
    sys.exit(main())
