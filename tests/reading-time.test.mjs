import assert from 'node:assert/strict'
import test from 'node:test'
import { estimateReadingTime } from '../lib/reading-time.ts'

test('Japanese prose without spaces is not treated as one word', () => {
  assert.equal(estimateReadingTime('あ'.repeat(1500)), 3)
  assert.equal(estimateReadingTime('あ'.repeat(1501)), 4)
})

test('link destinations, formatting, and affiliate tokens do not inflate reading time', () => {
  const longUrl = `https://example.com/${'a'.repeat(4000)}`
  const article = `## 確認\n\n**本文** [公式情報](${longUrl})\n\n{{AFF:xserver}}`
  assert.equal(estimateReadingTime(article), 1)
})

test('tables and prompts remain part of the reading estimate', () => {
  const article = `| 確認 | 内容 |\n| --- | --- |\n| 事実 | ${'あ'.repeat(600)} |\n\n\`\`\`text\n${'い'.repeat(600)}\n\`\`\``
  assert.equal(estimateReadingTime(article), 3)
})

test('empty content has a minimum one-minute estimate', () => {
  assert.equal(estimateReadingTime(''), 1)
})
