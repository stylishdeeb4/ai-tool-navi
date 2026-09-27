import assert from 'node:assert/strict'
import fs from 'node:fs'

const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:3128'
async function page(path) {
  const response = await fetch(new URL(path, base))
  assert.equal(response.status, 200, `${path} should return 200`)
  return response.text()
}

const home = await page('/')
for (const slug of ['chatgpt', 'claude', 'image-ai', 'video-ai', 'fukugyo', 'review']) {
  assert.ok(home.includes(`href="/category/${slug}"`), `Home should include ${slug}`)
  await page(`/category/${slug}`)
}

const newPath = '/blog/ai-blog-koukai-checklist'
const article = await page(newPath)
assert.equal((article.match(/<h1(?:\s|>)/g) || []).length, 1, 'Article has one H1')
assert.ok(article.includes(`rel="canonical" href="https://hukugyou.blog${newPath}"`))
assert.ok(article.includes('class="article-table"'), 'Tables have a scrollable wrapper')
assert.ok(article.includes('<pre>'), 'Prompt renders as a code block')
const anchors = [...article.matchAll(/href="#(section-\d+)"/g)].map(match => match[1])
assert.ok(anchors.length > 3, 'Table of contents is populated')
for (const id of anchors) assert.ok(article.includes(`id="${id}"`), `Heading ${id} exists`)
const schemas = [...article.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(match => JSON.parse(match[1]))
const schema = schemas.find(item => item['@type'] === 'Article')
assert.ok(schema?.image === 'https://hukugyou.blog/images/ai-blog-koukai-checklist.png')
assert.ok(home.includes(`href="${newPath}"`))
await page('/images/ai-blog-koukai-checklist.png')

const revised = await page('/blog/ai-blog-fukugyo-hajimekata')
assert.ok(revised.includes(`href="${newPath}"`), 'Revised article links to the checklist')
assert.ok(!revised.includes('3〜6ヶ月'), 'Unsupported income timeline was removed')
assert.ok(revised.includes('広告・アフィリエイトリンクが含まれます'))
assert.ok(revised.includes('rel="sponsored nofollow noopener"'))
assert.ok(!revised.includes('**需要'), 'Raw emphasis markers do not appear')

const sitemap = await page('/sitemap.xml')
assert.ok(sitemap.includes('https://hukugyou.blog/category/fukugyo'))
assert.ok(sitemap.includes(`https://hukugyou.blog${newPath}`))
assert.ok((await page('/robots.txt')).includes('Sitemap: https://hukugyou.blog/sitemap.xml'))

const files = fs.readdirSync('content/posts').filter(name => /\.mdx?$/.test(name))
for (const file of files) await page(`/blog/${file.replace(/\.mdx?$/, '')}`)
const missing = await fetch(new URL('/blog/nonexistent-verification-page', base))
assert.equal(missing.status, 404)
console.log(`Verified ${files.length} article routes, 6 categories, navigation, metadata, table of contents, affiliate disclosure, sitemap, robots, image, and 404.`)
