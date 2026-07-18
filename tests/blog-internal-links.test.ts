import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildInternalLinks } from '../src/lib/blog-internal-links.ts';

const basePost = {
  id: 'post-1',
  slug: 'post-one',
  title: 'Post One',
  category: { name: 'AI News', slug: 'ai-news' },
  blogPostTags: [{ tag: { id: 't1', name: 'machine learning', slug: 'machine-learning' } }],
  author: { id: 'user-1', name: 'Jane Doe' },
};

test('buildInternalLinks: category link points at the real category filter route', () => {
  const links = buildInternalLinks(basePost, []);
  assert.equal(links.category?.href, '/blog?category=ai-news');
});

test('buildInternalLinks: tag names are URL-encoded, never left raw', () => {
  const links = buildInternalLinks(basePost, []);
  assert.equal(links.tags[0].href, '/blog?q=machine%20learning');
});

test('buildInternalLinks: tag links never point at an invented tag-archive route', () => {
  const links = buildInternalLinks(basePost, []);
  assert.ok(links.tags.every((t) => t.href.startsWith('/blog?q=')));
});

test('buildInternalLinks: author link points at the real author page route', () => {
  const links = buildInternalLinks(basePost, []);
  assert.equal(links.author?.href, '/blog/authors/user-1');
});

test('buildInternalLinks: related posts exclude the current post even if present in input', () => {
  const related = [
    { id: 'post-2', slug: 'other', title: 'Other Post' },
    { id: 'post-1', slug: 'self', title: 'Should never appear' },
  ];
  const links = buildInternalLinks(basePost, related);
  assert.equal(links.relatedPosts.length, 1);
  assert.equal(links.relatedPosts[0].href, '/blog/other');
});

test('buildInternalLinks: a post with no relationships produces null/empty, never a fabricated link', () => {
  const bare = { id: 'post-3', slug: 'bare', title: 'Bare Post', category: null, blogPostTags: [], author: null };
  const links = buildInternalLinks(bare, []);
  assert.equal(links.category, null);
  assert.deepEqual(links.tags, []);
  assert.equal(links.author, null);
  assert.deepEqual(links.relatedPosts, []);
});
