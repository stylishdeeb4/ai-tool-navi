import { remark } from 'remark'
import remarkGfm from 'remark-gfm'
import remarkHtml from 'remark-html'
import { renderAffiliateBox } from './affiliates'
import type { Root, RootContent } from 'mdast'

export interface ArticleHeading { id: string; title: string }

function headingText(node: RootContent): string {
  if ('value' in node) return node.value
  if ('children' in node) return node.children.map(headingText).join('')
  return ''
}

// 記事内の {{AFF:キー}} を、アフィリエイトCTAボックスのHTMLに置換する。
// remark で <p>{{AFF:キー}}</p> のように段落化されるため、その形も拾う。
function replaceAffiliateTokens(html: string): string {
  return html.replace(/<p>\s*\{\{AFF:([a-zA-Z0-9_-]+)\}\}\s*<\/p>/g, (_m, key) => renderAffiliateBox(key))
    .replace(/\{\{AFF:([a-zA-Z0-9_-]+)\}\}/g, (_m, key) => renderAffiliateBox(key))
}

export async function renderMarkdown(markdown: string): Promise<{ html: string; headings: ArticleHeading[] }> {
  const headings: ArticleHeading[] = []
  const result = await remark()
    .use(remarkGfm)
    .use(() => (tree: Root) => {
      for (const node of tree.children) {
        if (node.type !== 'heading' || node.depth !== 2) continue
        const id = `section-${headings.length + 1}`
        node.data = { ...node.data, hProperties: { ...node.data?.hProperties, id } }
        headings.push({ id, title: headingText(node) })
      }
    })
    .use(remarkHtml, { sanitize: false })
    .process(markdown)
  const html = replaceAffiliateTokens(result.toString())
    .replace(/<table>/g, '<div class="article-table" role="region" aria-label="比較・確認表" tabindex="0"><table>')
    .replace(/<\/table>/g, '</table></div>')
  return { html, headings }
}
