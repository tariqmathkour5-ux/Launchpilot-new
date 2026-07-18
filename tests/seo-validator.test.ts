import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  validatePageSeo,
  detectDuplicates,
  generateSeoReport,
  type SeoValidationResult,
  type SeoValidationReport,
} from '../src/lib/seo/validator';

// =====================================================
// STRICT MODE SEO VALIDATOR TESTS
// Validates meta-tags and canonical URLs for uniqueness
// =====================================================

test('validatePageSeo: passes with valid SEO data', () => {
  const issues = validatePageSeo('/tools/chatgpt', {
    title: 'ChatGPT Review - AI Assistant Tool',
    description: 'Comprehensive review of ChatGPT, the AI assistant by OpenAI.',
    canonical: 'https://launchpilot.app/tools/chatgpt',
    noindex: false,
  });

  assert.equal(issues.length, 0);
});

test('validatePageSeo: reports MISSING_TITLE when title is empty', () => {
  const issues = validatePageSeo('/tools/chatgpt', {
    title: '',
    description: 'Some description',
    canonical: 'https://launchpilot.app/tools/chatgpt',
  });

  const missingTitle = issues.find(i => i.type === 'MISSING_TITLE');
  assert.ok(missingTitle);
  assert.equal(missingTitle.severity, 'error');
});

test('validatePageSeo: reports MISSING_DESCRIPTION when description is empty', () => {
  const issues = validatePageSeo('/tools/chatgpt', {
    title: 'ChatGPT Review',
    description: '',
    canonical: 'https://launchpilot.app/tools/chatgpt',
  });

  const missingDesc = issues.find(i => i.type === 'MISSING_DESCRIPTION');
  assert.ok(missingDesc);
  assert.equal(missingDesc.severity, 'error');
});

test('validatePageSeo: reports MISSING_CANONICAL when canonical is empty', () => {
  const issues = validatePageSeo('/tools/chatgpt', {
    title: 'ChatGPT Review',
    description: 'Some description',
    canonical: '',
  });

  const missingCanonical = issues.find(i => i.type === 'MISSING_CANONICAL');
  assert.ok(missingCanonical);
  assert.equal(missingCanonical.severity, 'error');
});

test('validatePageSeo: reports TITLE_TOO_LONG when title exceeds 70 chars', () => {
  const longTitle = 'A'.repeat(71);
  const issues = validatePageSeo('/tools/chatgpt', {
    title: longTitle,
    description: 'Some description',
    canonical: 'https://launchpilot.app/tools/chatgpt',
  });

  const titleTooLong = issues.find(i => i.type === 'TITLE_TOO_LONG');
  assert.ok(titleTooLong);
  assert.equal(titleTooLong.severity, 'warning');
});

test('validatePageSeo: reports DESCRIPTION_TOO_LONG when description exceeds 160 chars', () => {
  const longDesc = 'A'.repeat(161);
  const issues = validatePageSeo('/tools/chatgpt', {
    title: 'ChatGPT Review',
    description: longDesc,
    canonical: 'https://launchpilot.app/tools/chatgpt',
  });

  const descTooLong = issues.find(i => i.type === 'DESCRIPTION_TOO_LONG');
  assert.ok(descTooLong);
  assert.equal(descTooLong.severity, 'warning');
});

test('validatePageSeo: reports NOINDEX_WITH_CANONICAL warning', () => {
  const issues = validatePageSeo('/blog/draft', {
    title: 'Draft Post',
    description: 'Some description',
    canonical: 'https://launchpilot.app/blog/draft',
    noindex: true,
  });

  const contradictory = issues.find(i => i.type === 'NOINDEX_WITH_CANONICAL');
  assert.ok(contradictory);
  assert.equal(contradictory.severity, 'warning');
});

test('validatePageSeo: reports TRAILING_SLASH_MISMATCH warning', () => {
  const issues = validatePageSeo('/tools/chatgpt/', {
    title: 'ChatGPT Review',
    description: 'Some description',
    canonical: 'https://launchpilot.app/tools/chatgpt',
  });

  const slashMismatch = issues.find(i => i.type === 'TRAILING_SLASH_MISMATCH');
  assert.ok(slashMismatch);
  assert.equal(slashMismatch.severity, 'warning');
});

// =====================================================
// DUPLICATE DETECTION TESTS
// =====================================================

test('detectDuplicates: reports DUPLICATE_TITLE when two pages have same title', () => {
  const report: SeoValidationReport = {
    totalPages: 2,
    pages: [
      { page: '/tools/chatgpt', title: 'Same Title', description: 'Desc 1', canonical: 'https://launchpilot.app/tools/chatgpt', noindex: false },
      { page: '/tools/gpt4', title: 'Same Title', description: 'Desc 2', canonical: 'https://launchpilot.app/tools/gpt4', noindex: false },
    ],
    issues: [],
    passed: true,
  };

  const issues = detectDuplicates(report);
  const dupTitle = issues.find(i => i.type === 'DUPLICATE_TITLE');
  assert.ok(dupTitle);
  assert.equal(dupTitle.severity, 'error');
});

test('detectDuplicates: reports DUPLICATE_CANONICAL when two pages have same canonical', () => {
  const report: SeoValidationReport = {
    totalPages: 2,
    pages: [
      { page: '/tools/chatgpt', title: 'ChatGPT Review', description: 'Desc 1', canonical: 'https://launchpilot.app/tools/chatgpt', noindex: false },
      { page: '/tools/chatgpt-alt', title: 'ChatGPT Alternative', description: 'Desc 2', canonical: 'https://launchpilot.app/tools/chatgpt', noindex: false },
    ],
    issues: [],
    passed: true,
  };

  const issues = detectDuplicates(report);
  const dupCanonical = issues.find(i => i.type === 'DUPLICATE_CANONICAL');
  assert.ok(dupCanonical);
  assert.equal(dupCanonical.severity, 'error');
});

test('detectDuplicates: reports DUPLICATE_DESCRIPTION when two pages have same description', () => {
  const report: SeoValidationReport = {
    totalPages: 2,
    pages: [
      { page: '/tools/chatgpt', title: 'ChatGPT Review', description: 'Same description here', canonical: 'https://launchpilot.app/tools/chatgpt', noindex: false },
      { page: '/tools/gpt4', title: 'GPT-4 Review', description: 'Same description here', canonical: 'https://launchpilot.app/tools/gpt4', noindex: false },
    ],
    issues: [],
    passed: true,
  };

  const issues = detectDuplicates(report);
  const dupDesc = issues.find(i => i.type === 'DUPLICATE_DESCRIPTION');
  assert.ok(dupDesc);
  assert.equal(dupDesc.severity, 'warning');
});

test('detectDuplicates: no duplicates when all pages have unique SEO data', () => {
  const report: SeoValidationReport = {
    totalPages: 3,
    pages: [
      { page: '/', title: 'Home', description: 'Home description', canonical: 'https://launchpilot.app/', noindex: false },
      { page: '/tools', title: 'All AI Tools', description: 'Tools description', canonical: 'https://launchpilot.app/tools', noindex: false },
      { page: '/blog', title: 'Blog', description: 'Blog description', canonical: 'https://launchpilot.app/blog', noindex: false },
    ],
    issues: [],
    passed: true,
  };

  const issues = detectDuplicates(report);
  assert.equal(issues.length, 0);
});

// =====================================================
// FULL REPORT TESTS
// =====================================================

test('generateSeoReport: passes with clean pages', () => {
  const pages: SeoValidationResult[] = [
    { page: '/', title: 'Home', description: 'Home description', canonical: 'https://launchpilot.app/', noindex: false },
    { page: '/tools', title: 'All AI Tools', description: 'Tools description', canonical: 'https://launchpilot.app/tools', noindex: false },
  ];

  const report = generateSeoReport(pages);
  assert.equal(report.passed, true);
  assert.equal(report.totalPages, 2);
});

test('generateSeoReport: fails with duplicate canonical URLs', () => {
  const pages: SeoValidationResult[] = [
    { page: '/tools/chatgpt', title: 'ChatGPT', description: 'Desc 1', canonical: 'https://launchpilot.app/tools/chatgpt', noindex: false },
    { page: '/tools/chatgpt-v2', title: 'ChatGPT v2', description: 'Desc 2', canonical: 'https://launchpilot.app/tools/chatgpt', noindex: false },
  ];

  const report = generateSeoReport(pages);
  assert.equal(report.passed, false);
  const hasDuplicateCanonical = report.issues.some(i => i.type === 'DUPLICATE_CANONICAL');
  assert.equal(hasDuplicateCanonical, true);
});

test('generateSeoReport: fails with missing titles', () => {
  const pages: SeoValidationResult[] = [
    { page: '/tools/test', title: '', description: 'Desc', canonical: 'https://launchpilot.app/tools/test', noindex: false },
  ];

  const report = generateSeoReport(pages);
  assert.equal(report.passed, false);
  const hasMissingTitle = report.issues.some(i => i.type === 'MISSING_TITLE');
  assert.equal(hasMissingTitle, true);
});