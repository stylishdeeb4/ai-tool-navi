import type { Metadata } from 'next'
import ReportForm from '@/components/ReportForm'

export const metadata: Metadata = {
  title: '通報',
  description: '権利侵害や不適切なコンテンツを報告できます。',
}

export default function ReportPage({ searchParams }: { searchParams: { id?: string } }) {
  return (
    <div className="cb-shell max-w-2xl py-8">
      <h1 className="text-2xl font-bold">権利侵害・不適切コンテンツの通報</h1>
      <p className="mt-2 text-sm leading-relaxed text-cb-muted">
        掲載されている動画に問題がある場合はこちらからご連絡ください。
        権利者ご本人からのご連絡は優先して確認します。
      </p>

      <div className="mt-6">
        <ReportForm defaultVideoId={searchParams.id ?? ''} />
      </div>
    </div>
  )
}
