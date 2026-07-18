// =====================================================
// STRICT MODE SEO VALIDATOR
// Validates meta-tags and canonical URLs for uniqueness
// across the entire site. Used in tests and build-time
// checks to ensure every page has unique, valid SEO.
// =====================================================

export interface SeoValidationResult {
  page: string;
  title: string;
  description: string;
  canonical: string;
  noindex: boolean;
}

export interface SeoValidationReport {
  totalPages: number;
  pages: SeoValidationResult[];
  issues: SeoIssue[];
  passed: boolean;
}

export interface SeoIssue {
  type: 'DUPLICATE_TITLE' | 'DUPLICATE_DESCRIPTION' | 'DUPLICATE_CANONICAL' 
      | 'MISSING_TITLE' | 'MISSING_DESCRIPTION' | 'MISSING_CANONICAL'
      | 'TITLE_TOO_LONG' | 'DESCRIPTION_TOO_LONG' | 'CANONICAL_MISMATCH'
      | 'NOINDEX_WITH_CANONICAL' | 'TRAILING_SLASH_MISMATCH';
  page: string;
  message: string;
  severity: 'error' | 'warning';
}

const SEO_TITLE_MAX = 70;
const SEO_DESCRIPTION_MAX = 160;

/**
 * Validate a single page's SEO metadata.
 * Returns a list of issues found.
 */
export function validatePageSeo(
  page: string,
  seo: { title?: string; description?: string; canonical?: string; noindex?: boolean }
): SeoIssue[] {
  const issues: SeoIssue[] = [];

  // Missing required fields
  if (!seo.title) {
    issues.push({
      type: 'MISSING_TITLE',
      page,
      message: `Page "${page}" is missing a meta title`,
      severity: 'error',
    });
  }

  if (!seo.description) {
    issues.push({
      type: 'MISSING_DESCRIPTION',
      page,
      message: `Page "${page}" is missing a meta description`,
      severity: 'error',
    });
  }

  if (!seo.canonical) {
    issues.push({
      type: 'MISSING_CANONICAL',
      page,
      message: `Page "${page}" is missing a canonical URL`,
      severity: 'error',
    });
  }

  // Length checks
  if (seo.title && seo.title.length > SEO_TITLE_MAX) {
    issues.push({
      type: 'TITLE_TOO_LONG',
      page,
      message: `Title "${seo.title.substring(0, 50)}..." is ${seo.title.length} chars (max ${SEO_TITLE_MAX})`,
      severity: 'warning',
    });
  }

  if (seo.description && seo.description.length > SEO_DESCRIPTION_MAX) {
    issues.push({
      type: 'DESCRIPTION_TOO_LONG',
      page,
      message: `Description is ${seo.description.length} chars (max ${SEO_DESCRIPTION_MAX})`,
      severity: 'warning',
    });
  }

  // noindex with canonical is contradictory
  if (seo.noindex && seo.canonical) {
    issues.push({
      type: 'NOINDEX_WITH_CANONICAL',
      page,
      message: `Page "${page}" has noindex=true but also specifies a canonical URL — contradictory signals`,
      severity: 'warning',
    });
  }

  // Trailing slash consistency check
  if (seo.canonical && seo.canonical !== '/' && page !== '/') {
    const canonicalEndsWithSlash = seo.canonical.endsWith('/');
    const pageEndsWithSlash = page.endsWith('/');
    if (canonicalEndsWithSlash !== pageEndsWithSlash) {
      issues.push({
        type: 'TRAILING_SLASH_MISMATCH',
        page,
        message: `Canonical "${seo.canonical}" trailing slash doesn't match page "${page}"`,
        severity: 'warning',
      });
    }
  }

  return issues;
}

/**
 * Detect duplicates across all pages in a report.
 * Checks for duplicate titles, descriptions, and canonical URLs.
 */
export function detectDuplicates(report: SeoValidationReport): SeoIssue[] {
  const issues: SeoIssue[] = [];
  const titleMap = new Map<string, string[]>();
  const descMap = new Map<string, string[]>();
  const canonicalMap = new Map<string, string[]>();

  for (const page of report.pages) {
    // Track duplicate titles
    if (page.title) {
      const existing = titleMap.get(page.title) || [];
      existing.push(page.page);
      titleMap.set(page.title, existing);
    }

    // Track duplicate descriptions
    if (page.description) {
      const existing = descMap.get(page.description) || [];
      existing.push(page.page);
      descMap.set(page.description, existing);
    }

    // Track duplicate canonical URLs
    if (page.canonical) {
      const existing = canonicalMap.get(page.canonical) || [];
      existing.push(page.page);
      canonicalMap.set(page.canonical, existing);
    }
  }

  // Report duplicates
  for (const [title, pages] of titleMap) {
    if (pages.length > 1) {
      issues.push({
        type: 'DUPLICATE_TITLE',
        page: pages.join(', '),
        message: `Duplicate title "${title.substring(0, 50)}..." found on ${pages.length} pages: ${pages.join(', ')}`,
        severity: 'error',
      });
    }
  }

  for (const [desc, pages] of descMap) {
    if (pages.length > 1) {
      issues.push({
        type: 'DUPLICATE_DESCRIPTION',
        page: pages.join(', '),
        message: `Duplicate description found on ${pages.length} pages: ${pages.join(', ')}`,
        severity: 'warning',
      });
    }
  }

  for (const [canonical, pages] of canonicalMap) {
    if (pages.length > 1) {
      issues.push({
        type: 'DUPLICATE_CANONICAL',
        page: pages.join(', '),
        message: `Duplicate canonical "${canonical}" found on ${pages.length} pages: ${pages.join(', ')}`,
        severity: 'error',
      });
    }
  }

  return issues;
}

/**
 * Generate a full validation report from a list of page SEO data.
 */
export function generateSeoReport(
  pages: SeoValidationResult[]
): SeoValidationReport {
  const report: SeoValidationReport = {
    totalPages: pages.length,
    pages,
    issues: [],
    passed: true,
  };

  // Validate each page individually
  for (const page of pages) {
    const pageIssues = validatePageSeo(page.page, {
      title: page.title,
      description: page.description,
      canonical: page.canonical,
      noindex: page.noindex,
    });
    report.issues.push(...pageIssues);
  }

  // Detect cross-page duplicates
  const duplicateIssues = detectDuplicates(report);
  report.issues.push(...duplicateIssues);

  // Determine pass/fail
  report.passed = report.issues.filter(i => i.severity === 'error').length === 0;

  return report;
}

/**
 * Pretty-print a validation report to console.
 */
export function printSeoReport(report: SeoValidationReport): void {
  console.log('\n========================================');
  console.log('  SEO VALIDATION REPORT');
  console.log('========================================');
  console.log(`  Total pages checked: ${report.totalPages}`);
  console.log(`  Issues found: ${report.issues.length}`);
  console.log(`  Status: ${report.passed ? '✅ PASSED' : '❌ FAILED'}`);
  console.log('========================================\n');

  if (report.issues.length === 0) {
    console.log('  No issues found. All pages pass SEO validation.\n');
    return;
  }

  const errors = report.issues.filter(i => i.severity === 'error');
  const warnings = report.issues.filter(i => i.severity === 'warning');

  if (errors.length > 0) {
    console.log(`  ERRORS (${errors.length}):`);
    console.log('  -------------------------');
    for (const issue of errors) {
      console.log(`  ❌ [${issue.type}] ${issue.message}`);
    }
    console.log();
  }

  if (warnings.length > 0) {
    console.log(`  WARNINGS (${warnings.length}):`);
    console.log('  ---------------------------');
    for (const issue of warnings) {
      console.log(`  ⚠️  [${issue.type}] ${issue.message}`);
    }
    console.log();
  }
}