const WORDS_PER_MINUTE = 200;

/** Word count of markdown/plain text content (whitespace-split, punctuation-agnostic). */
export function countWords(content: string): number {
  const trimmed = content.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

/** Estimated reading time in whole minutes, minimum 1 for any non-empty content. */
export function calculateReadingTime(content: string): number {
  const words = countWords(content);
  if (words === 0) return 0;
  return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
}
