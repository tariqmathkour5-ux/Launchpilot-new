import React from 'react';
import { extractHeadings } from '@/lib/table-of-contents';

export function renderMarkdownContent(content: string): React.ReactNode[] {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let currentParagraph = '';

  // Same extraction the table-of-contents uses, walked in lockstep with
  // the line loop below, so a heading rendered here gets exactly the id
  // the TOC generated for the same heading — one source of truth, not
  // two independently-slugifying implementations.
  const headings = extractHeadings(content);
  let headingCursor = 0;

  lines.forEach((line, index) => {
    if (line.startsWith('## ')) {
      if (currentParagraph) {
        elements.push(
          React.createElement('p', { key: `p-${index}`, className: 'text-secondary-700 mb-4' }, currentParagraph)
        );
        currentParagraph = '';
      }
      const heading = headings[headingCursor++];
      elements.push(
        React.createElement('h2', { key: `h2-${index}`, id: heading?.id, className: 'text-2xl font-bold text-secondary-900 mt-8 mb-4 scroll-mt-24' }, line.replace('## ', ''))
      );
    } else if (line.startsWith('### ')) {
      if (currentParagraph) {
        elements.push(
          React.createElement('p', { key: `p-${index}`, className: 'text-secondary-700 mb-4' }, currentParagraph)
        );
        currentParagraph = '';
      }
      const heading = headings[headingCursor++];
      elements.push(
        React.createElement('h3', { key: `h3-${index}`, id: heading?.id, className: 'text-xl font-semibold text-secondary-900 mt-6 mb-3 scroll-mt-24' }, line.replace('### ', ''))
      );
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      if (currentParagraph) {
        elements.push(
          React.createElement('p', { key: `p-${index}`, className: 'text-secondary-700 mb-4' }, currentParagraph)
        );
        currentParagraph = '';
      }
      elements.push(
        React.createElement('li', { key: `li-${index}`, className: 'text-secondary-700 ml-4 mb-2' }, line.replace(/^[-*] /, ''))
      );
    } else if (line.startsWith('|')) {
      // Skip table markdown for now - just close any open paragraphs
      if (currentParagraph) {
        elements.push(
          React.createElement('p', { key: `p-${index}`, className: 'text-secondary-700 mb-4' }, currentParagraph)
        );
        currentParagraph = '';
      }
    } else if (line.trim()) {
      currentParagraph += (currentParagraph ? ' ' : '') + line.trim();
    } else if (currentParagraph) {
      elements.push(
        React.createElement('p', { key: `p-${index}`, className: 'text-secondary-700 mb-4' }, currentParagraph)
      );
      currentParagraph = '';
    }
  });

  if (currentParagraph) {
    elements.push(
      React.createElement('p', { key: 'p-last', className: 'text-secondary-700 mb-4' }, currentParagraph)
    );
  }

  return elements;
}
