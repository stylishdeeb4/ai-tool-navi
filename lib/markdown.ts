import { remark } from 'remark'
import remarkGfm from 'remark-gfm'
import remarkHtml from 'remark-html'
import { renderAffiliateBox } from './affiliates'

// 記事内の {{AFF:キー}} を、アフィリエイトCTAボックスのHTMLに置換する。
// remark で <p>{{AFF:キー}}</p> のように段落化されるため、その形も拾う。
function replaceAffiliateTokens(html: string): string {
  return html.replace(/<p>\s*\{\{AFF:([a-zA-Z0-9_-]+)\}\}\s*<\/p>/g, (_m, key) => renderAffiliateBox(key))
    .replace(/\{\{AFF:([a-zA-Z0-9_-]+)\}\}/g, (_m, key) => renderAffiliateBox(key))
}

export async function markdownToHtml(markdown: string): Promise<string> {
  const result = await remark()
    .use(remarkGfm)
    .use(remarkHtml, { sanitize: false })
    .process(markdown)
  return replaceAffiliateTokens(result.toString())
}
