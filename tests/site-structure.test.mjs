import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'
import { guides, guidesForPost } from '../lib/guides.ts'
import { categories } from '../lib/categories.ts'

const postCategory = Object.fromEntries(
  fs.readdirSync('content/posts')
    .filter(name => /\.mdx?$/.test(name))
    .map(name => {
      const source = fs.readFileSync(`content/posts/${name}`, 'utf8')
      return [name.replace(/\.mdx?$/, ''), source.match(/^category:\s*"?(.*?)"?\s*$/m)?.[1]]
    })
)

test('every guide step points to an existing article', () => {
  for (const guide of guides) {
    assert.ok(guide.steps.length >= 2, `${guide.id} needs at least two steps`)
    for (const step of guide.steps) assert.ok(step.slug in postCategory, `${guide.id}: ${step.slug} does not exist`)
  }
})

test('guide ids are unique and a step appears once per guide', () => {
  assert.equal(new Set(guides.map(g => g.id)).size, guides.length)
  for (const guide of guides) assert.equal(new Set(guide.steps.map(s => s.slug)).size, guide.steps.length, guide.id)
})

test('guides only reference known categories', () => {
  const slugs = new Set(categories.map(c => c.slug))
  for (const guide of guides) for (const slug of guide.categories) assert.ok(slugs.has(slug), `${guide.id}: ${slug}`)
})

test('each category pillar exists and belongs to that category', () => {
  for (const category of categories) {
    assert.equal(postCategory[category.pillar], category.name, `${category.slug} pillar ${category.pillar}`)
    assert.ok(category.intro.length > 40, `${category.slug} intro is too short`)
  }
})

test('guidesForPost returns the position of the article', () => {
  const [entry] = guidesForPost('ai-blog-koukai-checklist')
  assert.equal(entry.guide.id, 'blog')
  assert.equal(entry.index, 1)
})
