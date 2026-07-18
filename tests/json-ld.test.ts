import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toJsonLdScript, enhancedToolJsonLd, offersJsonLd } from '../src/lib/seo/json-ld';

test('toJsonLdScript: escapes "<" so a value cannot close the surrounding <script> tag', () => {
  const malicious = { headline: 'Title</script><script>alert(1)</script>' };
  const serialized = toJsonLdScript(malicious);
  assert.equal(serialized.includes('</script>'), false);
});

test('toJsonLdScript: escaped output still round-trips to the exact original string when parsed', () => {
  const malicious = { headline: 'Title</script><script>alert(1)</script>' };
  const serialized = toJsonLdScript(malicious);
  const parsed = JSON.parse(serialized);
  assert.equal(parsed.headline, malicious.headline);
});

test('toJsonLdScript: normal content is unaffected', () => {
  const result = toJsonLdScript({ headline: 'A perfectly normal title' });
  assert.equal(result, '{"headline":"A perfectly normal title"}');
});

test('toJsonLdScript: raw JSON.stringify (the old behavior) DOES contain a literal closing script tag, confirming the vulnerability was real', () => {
  const malicious = { headline: 'Title</script><script>alert(1)</script>' };
  assert.equal(JSON.stringify(malicious).includes('</script>'), true);
});

// Enhanced Tool JSON-LD Tests - AggregateRating and Offers

test('enhancedToolJsonLd: includes AggregateRating when rating is provided', () => {
  const result = enhancedToolJsonLd({
    name: 'ChatGPT',
    description: 'AI assistant',
    slug: 'chatgpt',
    rating: 4.5,
    reviewCount: 128,
    pricing: 'freemium',
    website_url: 'https://chat.openai.com',
    has_free_tier: true,
  }) as Record<string, unknown>;

  assert.equal(result['@type'], 'SoftwareApplication');
  assert.ok(result.aggregateRating);
  const aggRating = result.aggregateRating as Record<string, unknown>;
  assert.equal(aggRating.ratingValue, 4.5);
  assert.equal(aggRating.ratingCount, 128);
  assert.equal(aggRating.bestRating, 5);
  assert.equal(aggRating.worstRating, 1);
});

test('enhancedToolJsonLd: does not include AggregateRating when rating is null', () => {
  const result = enhancedToolJsonLd({
    name: 'Unknown Tool',
    description: 'No reviews yet',
    slug: 'unknown-tool',
    rating: null,
    pricing: 'paid',
  }) as Record<string, unknown>;

  assert.ok(!result.hasOwnProperty('aggregateRating'));
});

test('offersJsonLd: returns Free offer for tools with free tier', () => {
  const result = offersJsonLd({
    slug: 'chatgpt',
    pricing: 'freemium',
    has_free_tier: true,
  }) as Array<Record<string, unknown>>;

  assert.ok(Array.isArray(result));
  assert.equal(result[0]['@type'], 'Offer');
  assert.equal(result[0].price, 0);
  assert.equal(result[0].priceCurrency, 'USD');
  assert.equal(result[0].category, 'Free');
});

test('offersJsonLd: returns Paid offer for paid tools', () => {
  const result = offersJsonLd({
    slug: 'midjourney',
    pricing: 'paid',
    has_free_tier: false,
  }) as Array<Record<string, unknown>>;

  assert.ok(Array.isArray(result));
  assert.equal(result[0]['@type'], 'Offer');
  assert.equal(result[0].category, 'Paid');
});

test('enhancedToolJsonLd: includes offers in JSON-LD output', () => {
  const result = enhancedToolJsonLd({
    name: 'ChatGPT',
    description: 'AI assistant',
    slug: 'chatgpt',
    rating: 4.5,
    reviewCount: 128,
    pricing: 'freemium',
    has_free_tier: true,
  }) as Record<string, unknown>;

  assert.ok(result.offers);
  assert.ok(Array.isArray(result.offers));
});

test('enhancedToolJsonLd: generates correct URL structure', () => {
  const result = enhancedToolJsonLd({
    name: 'ChatGPT',
    description: 'AI assistant',
    slug: 'chatgpt',
  }) as Record<string, unknown>;

  assert.ok(result.url && String(result.url).includes('/tools/chatgpt'));
});
