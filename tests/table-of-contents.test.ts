import { test } from 'node:test';
import assert from 'node:assert/strict';
import { extractHeadings } from '../src/lib/table-of-contents';

test('extractHeadings: extracts ## and ### headings in document order', () => {
  const content = '## Introduction\nSome text.\n### Details\nMore text.\n## Conclusion';
  const headings = extractHeadings(content);
  assert.equal(headings.length, 3);
  assert.deepEqual(headings.map((h) => h.text), ['Introduction', 'Details', 'Conclusion']);
  assert.deepEqual(headings.map((h) => h.level), [2, 3, 2]);
});

test('extractHeadings: generates a plain lowercase-hyphenated id', () => {
  const headings = extractHeadings('## Getting Started');
  assert.equal(headings[0].id, 'getting-started');
});

test('extractHeadings: strips punctuation from ids', () => {
  const headings = extractHeadings("## What's New?");
  assert.equal(headings[0].id, 'whats-new');
});

test('extractHeadings: duplicate heading text gets a unique -2 suffix, not a colliding id', () => {
  const content = '## Introduction\ntext\n## Introduction\ntext';
  const headings = extractHeadings(content);
  assert.equal(headings[0].id, 'introduction');
  assert.equal(headings[1].id, 'introduction-2');
  assert.notEqual(headings[0].id, headings[1].id);
});

test('extractHeadings: three occurrences of the same heading each get a distinct id', () => {
  const content = '## A\n## A\n## A';
  const ids = extractHeadings(content).map((h) => h.id);
  assert.deepEqual(ids, ['a', 'a-2', 'a-3']);
});

test('extractHeadings: content with no headings returns an empty array', () => {
  assert.deepEqual(extractHeadings('Just a paragraph, no headings here.'), []);
});

test('extractHeadings: ignores lines that merely contain "##" mid-sentence, not at line start', () => {
  const headings = extractHeadings('This is not ## a heading');
  assert.equal(headings.length, 0);
});
