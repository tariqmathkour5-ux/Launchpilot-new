import { test } from 'node:test';
import assert from 'node:assert/strict';
import { countWords, calculateReadingTime } from '../src/lib/reading-time';

test('countWords: empty string is 0 words', () => {
  assert.equal(countWords(''), 0);
});

test('countWords: whitespace-only string is 0 words', () => {
  assert.equal(countWords('   \n\t  '), 0);
});

test('countWords: counts whitespace-separated words regardless of punctuation', () => {
  assert.equal(countWords('Hello, world! This is a test.'), 6);
});

test('calculateReadingTime: empty content is 0 minutes', () => {
  assert.equal(calculateReadingTime(''), 0);
});

test('calculateReadingTime: any non-empty content is at least 1 minute', () => {
  assert.equal(calculateReadingTime('just a few words here'), 1);
});

test('calculateReadingTime: exactly 400 words is exactly 2 minutes', () => {
  const content = Array(400).fill('word').join(' ');
  assert.equal(calculateReadingTime(content), 2);
});

test('calculateReadingTime: 401 words rounds UP to 3 minutes, not down to 2', () => {
  const content = Array(401).fill('word').join(' ');
  assert.equal(calculateReadingTime(content), 3);
});
