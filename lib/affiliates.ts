// =============================================================
// アフィリエイト設定ファイル
// -------------------------------------------------------------
// ここに各ASPで発行した「実リンク」を貼るだけで、
// 記事内の {{AFF:キー}} トークンがすべて有効なCTAボックスに変わります。
//
// 手順:
//   1. A8.net / もしもアフィリエイト等で対象プログラムと提携
//   2. 発行された広告リンク(URL)を下の url: '' に貼り付け
//   3. コミット＆push すれば全記事に反映されます
//
//   url が空のままだと「準備中」表示になり、壊れたリンクは出ません。
// =============================================================

export interface AffiliateOffer {
  /** 見出し（ボックス上部の小ラベル） */
  eyebrow: string
  /** サービス名 */
  name: string
  /** 一言の訴求文 */
  catch: string
  /** ボタンの文言 */
  button: string
  /** 補足（任意・小さく表示） */
  note?: string
  /** ASPで発行した実リンク。空なら「準備中」表示 */
  url: string
}

export const affiliates: Record<string, AffiliateOffer> = {
  // レンタルサーバー（ブログ副業の高単価案件）
  conoha: {
    eyebrow: 'おすすめレンタルサーバー',
    name: 'ConoHa WING',
    catch: '表示速度が速く、WordPressかんたんセットアップで初心者でも最短10分で開設。月1,000円前後から。',
    button: 'ConoHa WINGを見てみる',
    note: '※申し込みと同時にブログが立ち上がります',
    url: '', // ← A8等で発行した ConoHa WING のリンクを貼る
  },
  xserver: {
    eyebrow: 'おすすめレンタルサーバー',
    name: 'エックスサーバー',
    catch: '国内シェアトップクラスの安定性。WordPressクイックスタートで簡単に始められます。',
    button: 'エックスサーバーを見てみる',
    note: '※迷ったらこの2社のどちらかで間違いありません',
    url: 'https://px.a8.net/svt/ejp?a8mat=4B62OE+FKUCMQ+CO4+61C2Q',
  },
  // クラウドソーシング（ライティング副業の案件獲得）
  crowdworks: {
    eyebrow: 'おすすめクラウドソーシング',
    name: 'クラウドワークス',
    catch: '国内最大級。初心者向けのライティング案件が豊富で、まず実績を作るのに最適です。',
    button: 'クラウドワークスに無料登録',
    note: '※登録・利用は無料です',
    url: '', // ← クラウドワークスのリンクを貼る
  },
  lancers: {
    eyebrow: 'おすすめクラウドソーシング',
    name: 'ランサーズ',
    catch: '案件数が多く、ライティングからデータ入力まで幅広く受注できます。',
    button: 'ランサーズに無料登録',
    note: '※クラウドワークスと併用すると案件の幅が広がります',
    url: '', // ← ランサーズのリンクを貼る
  },
  coconala: {
    eyebrow: 'おすすめスキルマーケット',
    name: 'ココナラ',
    catch: '自分の得意（ライティング・デザイン・相談など）を出品して売れる国内最大級のスキルマーケット。在宅・スキマ時間で始められます。',
    button: 'ココナラに無料登録',
    note: '※登録・出品は無料。AIで作った成果物の販売にも',
    url: 'https://px.a8.net/svt/ejp?a8mat=453CBX+3K07UA+2PEO+OE4NM',
  },
  // WordPressテーマ（ブログのデザイン・収益化を底上げ）
  stork19: {
    eyebrow: 'おすすめWordPressテーマ',
    name: 'STORK19',
    catch: '「ブログマーケッターJUNICHI」監修の国産WordPressテーマ。モバイル表示にこだわった設計で、初心者でも整ったデザインのブログがすぐ作れます。',
    button: 'STORK19を見てみる',
    note: '※買い切り型。表示の見やすさに定評があります',
    url: 'https://px.a8.net/svt/ejp?a8mat=4B62OE+FNTINM+3PSE+63WO2',
  },
  // デザインツール（動画・画像制作の効率化）
  canva: {
    eyebrow: 'おすすめデザインツール',
    name: 'Canva Pro',
    catch: 'テンプレ豊富で、ショート動画やSNS画像が誰でも数分で作れます。素材使い放題で制作スピードが段違い。',
    button: 'Canva Proを無料で試す',
    note: '※無料トライアルあり',
    url: '', // ← Canva Pro のリンクを貼る
  },
  adobe: {
    eyebrow: 'プロ向けクリエイティブツール',
    name: 'Adobe Creative Cloud',
    catch: '画像はPhotoshop、動画はPremiere Pro。本格的に制作・販売を伸ばすなら定番のクリエイティブ環境です。',
    button: 'Adobe Creative Cloudを見る',
    url: '', // ← Adobe CC のリンクを貼る
  },
  // スクール（学んで稼ぐ層・高単価）
  techacademy: {
    eyebrow: 'おすすめオンラインスクール',
    name: 'TechAcademy（テックアカデミー）',
    catch: 'プログラミングやWebスキルを未経験から学べるオンラインスクール。副業・案件獲得サポートも充実しています。',
    button: '無料体験・資料請求する',
    note: '※まずは無料体験から試せます',
    url: '', // ← TechAcademy のリンクを貼る
  },
  // 優先度S：高単価スクール・講座
  daitra: {
    eyebrow: 'おすすめスキルスクール',
    name: 'デイトラ',
    catch: 'Web制作・動画編集・ライティングなどを実践形式で学べる人気オンラインスクール。買い切り価格で副業直結のスキルが身につきます。',
    button: 'デイトラのコースを見る',
    note: '※学んだスキルがそのまま副業の武器になります',
    url: '', // ← デイトラのリンクを貼る
  },
  shiftai: {
    eyebrow: 'おすすめAIスクール・コミュニティ',
    name: 'SHIFT AI',
    catch: '生成AIの活用法を体系的に学び、副業・ビジネスに活かせるAI特化のスクール／コミュニティです。',
    button: 'SHIFT AIの無料セミナーを見る',
    note: '※まずは無料セミナーから',
    url: '', // ← SHIFT AI のリンクを貼る
  },
  studio_us: {
    eyebrow: 'おすすめ動画編集スクール',
    name: 'studio US（スタジオアス）',
    catch: '動画編集を未経験から学べるオンラインスクール。案件獲得まで見据えたカリキュラムで、YouTube副業の本格化に。',
    button: 'studio USを見てみる',
    url: '', // ← studio US のリンクを貼る
  },
  writing_hacks: {
    eyebrow: 'おすすめライティング講座',
    name: 'Writing Hacks（ライティングハックス）',
    catch: 'プロのWebライターが教える買い切り型のライティング講座。SEOライティングや単価アップのノウハウを体系的に学べます。',
    button: 'Writing Hacksを見てみる',
    note: '※単価アップを本気で目指す方向け',
    url: '', // ← Writing Hacks のリンクを貼る
  },
}

/**
 * アフィリエイトボックスのHTMLを生成する。
 * url が未設定の場合は「準備中」のプレースホルダーを返す（リンク切れ防止）。
 */
export function renderAffiliateBox(key: string): string {
  const o = affiliates[key]
  if (!o) return ''

  const eyebrow = `<div style="font-size:12px;font-weight:700;color:#0ea5e9;letter-spacing:.04em;margin-bottom:6px;">${o.eyebrow}</div>`
  const name = `<div style="font-size:18px;font-weight:800;color:#0f172a;margin-bottom:8px;">${o.name}</div>`
  const desc = `<div style="font-size:14px;line-height:1.7;color:#334155;margin-bottom:16px;">${o.catch}</div>`
  const note = o.note ? `<div style="font-size:12px;color:#94a3b8;margin-top:10px;">${o.note}</div>` : ''

  const cta = o.url
    ? `<a href="${o.url}" target="_blank" rel="sponsored nofollow noopener" style="display:inline-block;background:#10b981;color:#fff;font-weight:700;font-size:15px;text-decoration:none;padding:12px 28px;border-radius:9999px;">${o.button} →</a>`
    : `<span style="display:inline-block;background:#e2e8f0;color:#94a3b8;font-weight:700;font-size:14px;padding:12px 28px;border-radius:9999px;">準備中（リンク設定待ち）</span>`

  return (
    `<div style="border:1px solid #e2e8f0;border-radius:14px;padding:24px;margin:28px 0;background:linear-gradient(180deg,#f8fafc 0%,#ffffff 100%);box-shadow:0 1px 3px rgba(0,0,0,.04);">` +
    eyebrow + name + desc + cta + note +
    `</div>`
  )
}
