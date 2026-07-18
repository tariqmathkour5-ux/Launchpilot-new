export interface HeadingEntry {
  level: 2 | 3;
  text: string;
  id: string;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-');
}

/**
 * Extracts ## / ### headings from markdown content, in document order,
 * with stable, unique, deterministic ids (duplicate heading text gets a
 * -2, -3, ... suffix). This is the single source of truth for heading
 * ids: both the table-of-contents UI and the markdown renderer
 * (src/lib/markdown.ts) call this same function rather than each
 * generating ids independently, which is what guarantees a TOC link
 * (`#introduction`) actually matches the heading it points to instead of
 * two slightly different slugify implementations silently drifting apart.
 */
export function extractHeadings(content: string): HeadingEntry[] {
  const lines = content.split('\n');
  const seen = new Map<string, number>();
  const headings: HeadingEntry[] = [];

  for (const line of lines) {
    let level: 2 | 3 | null = null;
    let text = '';

    if (line.startsWith('## ')) {
      level = 2;
      text = line.slice(3).trim();
    } else if (line.startsWith('### ')) {
      level = 3;
      text = line.slice(4).trim();
    }

    if (level && text) {
      const base = slugify(text) || 'section';
      const count = seen.get(base) ?? 0;
      seen.set(base, count + 1);
      const id = count === 0 ? base : `${base}-${count + 1}`;
      headings.push({ level, text, id });
    }
  }

  return headings;
}

/** Table of contents is just the extracted headings — kept as its own named export for clarity at call sites. */
export function generateTableOfContents(content: string): HeadingEntry[] {
  return extractHeadings(content);
}
