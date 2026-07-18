import Link from 'next/link';
import type { HeadingEntry } from '@/lib/table-of-contents';

export default function BlogTableOfContents({ headings }: { headings: HeadingEntry[] }) {
  if (headings.length < 2) return null; // Not worth a TOC for a single section

  return (
    <nav aria-label="Table of contents" className="card p-5 mb-8">
      <p className="text-sm font-semibold text-secondary-900 mb-3">On this page</p>
      <ul className="space-y-2 text-sm">
        {headings.map((heading) => (
          <li key={heading.id} className={heading.level === 3 ? 'ml-4' : ''}>
            <Link href={`#${heading.id}`} className="text-secondary-500 hover:text-primary-600">
              {heading.text}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
