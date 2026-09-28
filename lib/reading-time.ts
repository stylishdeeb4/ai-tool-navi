import { remark } from 'remark'
import remarkGfm from 'remark-gfm'
import type { Root, RootContent } from 'mdast'

const parser = remark().use(remarkGfm)

function visibleText(node: Root | RootContent): string {
  if (node.type === 'text' || node.type === 'inlineCode' || node.type === 'code') return node.value
  if (node.type === 'html') return node.value.replace(/<[^>]*>/g, '')
  if ('children' in node) return node.children.map(visibleText).join('')
  return ''
}

/** 編集上の目安：表示本文の空白を除く500文字を約1分とする。リンク先URLや広告トークンは含めない。 */
export function estimateReadingTime(markdown: string): number {
  const source = markdown.replace(/\{\{AFF:[a-zA-Z0-9_-]+\}\}/g, '')
  const text = visibleText(parser.parse(source)).replace(/\s/g, '')
  return Math.max(1, Math.ceil(Array.from(text).length / 500))
}
