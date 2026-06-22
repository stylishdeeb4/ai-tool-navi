import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: '運営者情報・このサイトについて | AIツールナビ',
  description: 'AIツールナビの運営者情報と編集方針を紹介します。AIツールの使い方・比較・副業活用を、実際に試した一次情報をもとにわかりやすく発信しています。',
  alternates: { canonical: '/about' },
}

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">運営者情報・このサイトについて</h1>

      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4">サイトの理念</h2>
        <p className="text-gray-700 leading-relaxed">
          AIツールナビは、「最新のAIツールを、誰でも使いこなせるようにする」ことを目指す情報サイトです。
          ChatGPTをはじめとするAIツールは、使い方次第で仕事や副業、日々の暮らしを大きく変える力を持っています。
          一方で「種類が多すぎて何を使えばいいか分からない」「専門用語が難しい」という声も多く聞かれます。
          そこで当サイトでは、実際にツールを試したうえで、初心者の方にもわかりやすい言葉で
          使い方・比較・活用法をお届けしています。
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4">運営者について</h2>
        <p className="text-gray-700 leading-relaxed mb-4">
          当サイトは、AIツールを実務・副業で活用してきた個人運営者によって運営されています。
          日々アップデートされるAIの世界を追いかけ、実際に手を動かして得た知見を発信することを大切にしています。
        </p>
        <ul className="list-none text-gray-700 space-y-2">
          <li><span className="font-semibold">サイト名：</span>AIツールナビ</li>
          <li><span className="font-semibold">運営形態：</span>個人運営</li>
          <li><span className="font-semibold">発信テーマ：</span>ChatGPT・Claudeなどの使い方、AIツール比較、AIを活用した副業・収益化</li>
          <li><span className="font-semibold">お問い合わせ：</span><Link href="/contact" className="text-blue-600 hover:underline">お問い合わせフォーム</Link>よりご連絡ください</li>
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4">編集方針</h2>
        <p className="text-gray-700 leading-relaxed mb-4">
          読者の皆さまに信頼できる情報をお届けするため、当サイトは以下の方針で記事を作成しています。
        </p>
        <ul className="list-disc list-inside text-gray-700 space-y-2">
          <li><span className="font-semibold">実際に試す：</span>紹介するツールや手法は、可能な限り運営者自身が試したうえで解説します。</li>
          <li><span className="font-semibold">事実確認を行う：</span>料金・仕様・機能などの情報は、公式情報をもとに確認しています。</li>
          <li><span className="font-semibold">わかりやすさを優先：</span>専門用語はかみ砕き、初心者の方がつまずかない手順で説明します。</li>
          <li><span className="font-semibold">継続的に見直す：</span>AIツールは更新が速いため、内容が古くなった記事は随時リライトします。</li>
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4">免責事項</h2>
        <p className="text-gray-700 leading-relaxed">
          当サイトに掲載する情報は、正確性を期すよう努めていますが、その完全性・正確性・有用性を保証するものではありません。
          AIツールの仕様や料金は変更される場合があるため、ご利用の際は必ず各公式サイトで最新情報をご確認ください。
          当サイトの情報を利用して生じたいかなる損害についても、運営者は責任を負いかねます。あらかじめご了承ください。
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold mb-4">広告について</h2>
        <p className="text-gray-700 leading-relaxed">
          当サイトでは、第三者配信の広告サービス（Google AdSense等）やアフィリエイトプログラムを利用しています。
          詳細は<Link href="/privacy-policy" className="text-blue-600 hover:underline">プライバシーポリシー</Link>をご覧ください。
        </p>
      </section>
    </div>
  )
}
