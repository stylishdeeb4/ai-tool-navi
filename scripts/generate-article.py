#!/usr/bin/env python3
"""
AIツールナビ 毎日自動記事生成スクリプト
Claude APIを使ってSEO最適化された日本語AI記事を生成し、
content/posts/ にMDXファイルとして保存します。
"""

import anthropic
import os
import json
from datetime import date, datetime
from pathlib import Path

POSTS_DIR = Path("content/posts")
POSTS_DIR.mkdir(parents=True, exist_ok=True)

ARTICLE_THEMES = [
    {
        "category": "ChatGPT",
        "tags": ["ChatGPT", "OpenAI", "活用術"],
        "topics": [
            "ChatGPTで仕事を効率化する10の方法",
            "ChatGPT GPT-4oの新機能完全ガイド",
            "ChatGPTプロンプトエンジニアリング入門",
            "ChatGPTで英語学習を加速する方法",
            "ChatGPTで副業・フリーランス収入を増やす",
        ],
    },
    {
        "category": "Claude",
        "tags": ["Claude", "Anthropic", "AI"],
        "topics": [
            "Claude 3.5 Sonnetの使い方完全ガイド",
            "ClaudeとChatGPTの違い・使い分け方",
            "Claudeで長文コンテンツを作成する方法",
            "Claudeのプロンプトテクニック集",
        ],
    },
    {
        "category": "画像生成AI",
        "tags": ["Midjourney", "Stable Diffusion", "DALL-E", "画像生成"],
        "topics": [
            "Midjourneyで商用利用OKの画像を作る方法",
            "Stable Diffusionローカル環境構築ガイド2025",
            "画像生成AIプロンプト完全攻略法",
            "DALL-E 3 vs Midjourney v6 比較レビュー",
        ],
    },
    {
        "category": "AI動画",
        "tags": ["Sora", "Runway", "動画生成AI"],
        "topics": [
            "Runway Gen-3 Alphaの使い方完全ガイド",
            "AI動画生成ツール2025年最新比較",
            "YouTube向けAI動画制作の始め方",
        ],
    },
    {
        "category": "比較・レビュー",
        "tags": ["AIツール", "比較", "おすすめ"],
        "topics": [
            "2025年最強AIツール20選・完全比較",
            "無料で使えるAIツールおすすめ10選",
            "AIライティングツール比較：ChatGPT vs Claude vs Gemini",
        ],
    },
]

def pick_today_theme():
    day_of_year = datetime.now().timetuple().tm_yday
    theme = ARTICLE_THEMES[day_of_year % len(ARTICLE_THEMES)]
    topic = theme["topics"][day_of_year % len(theme["topics"])]
    return {"category": theme["category"], "tags": theme["tags"], "title_hint": topic}

def generate_article(theme):
    client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])
    prompt = f"""あなたはSEOに強い日本語AIメディアのライターです。
以下の条件で高品質な記事を生成してください。

【テーマ】{theme['title_hint']}
【カテゴリ】{theme['category']}
【タグ】{', '.join(theme['tags'])}

【記事要件】
- 文字数：1500〜2500字
- SEOを意識した見出し構造（H2・H3を適切に使用）
- 読者に価値のある具体的な情報・手順を含める
- 冒頭：読者の悩みに共感するリード文（2-3文）
- 末尾：まとめと次のアクションを促す文章

【出力形式】必ずJSON形式で出力してください：
{{
  "title": "記事タイトル（30〜60文字、数字や「完全ガイド」などを含める）",
  "description": "記事の説明文（120〜150文字、検索意図に合わせたもの）",
  "content": "Markdown形式の記事本文（frontmatterは含めない）"
}}

JSONのみ出力し、余計な説明は不要です。"""

    message = client.messages.create(
        model="claude-opus-4-5",
        max_tokens=4096,
        messages=[{"role": "user", "content": prompt}],
    )
    text = message.content[0].text.strip()
    if "```json" in text:
        text = text.split("```json")[1].split("```")[0].strip()
    elif "```" in text:
        text = text.split("```")[1].split("```")[0].strip()
    return json.loads(text)

def save_article(article, theme):
    today = date.today()
    cat_slug = {
        "ChatGPT": "chatgpt",
        "Claude": "claude",
        "画像生成AI": "image-ai",
        "AI動画": "video-ai",
        "比較・レビュー": "review",
    }.get(theme["category"], "ai")
    slug = f"{today.strftime('%Y%m%d')}-{cat_slug}"
    filepath = POSTS_DIR / f"{slug}.mdx"
    tags_yaml = "\n".join(f'  - "{t}"' for t in theme["tags"])
    mdx_content = f"""---
title: "{article['title']}"
description: "{article['description']}"
date: "{today.isoformat()}"
category: "{theme['category']}"
tags:
{tags_yaml}
---

{article['content']}
"""
    filepath.write_text(mdx_content, encoding="utf-8")
    print(f"✅ 記事を生成しました: {filepath}")
    print(f"   タイトル: {article['title']}")
    return filepath

def main():
    print(f"🤖 AIツールナビ 自動記事生成 - {date.today()}")
    theme = pick_today_theme()
    print(f"📌 テーマ: {theme['title_hint']} [{theme['category']}]")
    print("📝 Claude APIで記事を生成中...")
    article = generate_article(theme)
    saved_path = save_article(article, theme)
    print(f"🎉 完了！ {saved_path}")

if __name__ == "__main__":
    main()
