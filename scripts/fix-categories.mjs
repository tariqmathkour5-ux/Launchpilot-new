import fs from 'fs';
import path from 'path';

const knowledgeBasePath = path.join(process.cwd(), 'LaunchPilot_AI_KnowledgeBase');

// Read tools
const tools = JSON.parse(fs.readFileSync(path.join(knowledgeBasePath, 'tools_master.json'), 'utf8'));

// Normalize all categories to consistent capitalized format
const categoryMap = {
  'ai-chat': 'AI Chat',
  'ai-code': 'AI Code',
  'ai-image': 'AI Image',
  'ai-writing': 'AI Writing',
  'ai-audio': 'AI Audio',
  'ai-video': 'AI Video',
  'ai-productivity': 'AI Productivity',
  'ai-marketing': 'AI Marketing',
  'Ai Chat': 'AI Chat',
  'Ai Code': 'AI Code',
  'Ai Image': 'AI Image',
  'Ai Writing': 'AI Writing',
  'Ai Audio': 'AI Audio',
  'Ai Video': 'AI Video',
  'Ai Productivity': 'AI Productivity',
  'Ai Marketing': 'AI Marketing',
};

const normalizedTools = tools.map(tool => {
  const category = tool.category;
  // If category exists in map, use it; otherwise try to convert
  if (categoryMap[category]) {
    return { ...tool, category: categoryMap[category] };
  }
  // Try to convert lowercase with dashes
  if (category.includes('-')) {
    const normalized = category
      .split('-')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
    return { ...tool, category: normalized };
  }
  // Single letter capital
  const normalized = category.replace(/\b\w/g, l => l.toUpperCase());
  return { ...tool, category: normalized };
});

// Write back
fs.writeFileSync(
  path.join(knowledgeBasePath, 'tools_master.json'),
  JSON.stringify(normalizedTools, null, 2)
);

// Update categories.json to match
const categories = [
  { id: 'ai-chat', slug: 'ai-chat', name: 'AI Chat', description: 'AI Chat tools', icon: '💬', order: 1 },
  { id: 'ai-code', slug: 'ai-code', name: 'AI Code', description: 'AI Code tools', icon: '💻', order: 2 },
  { id: 'ai-image', slug: 'ai-image', name: 'AI Image', description: 'AI Image tools', icon: '🎨', order: 3 },
  { id: 'ai-writing', slug: 'ai-writing', name: 'AI Writing', description: 'AI Writing tools', icon: '✍️', order: 4 },
  { id: 'ai-audio', slug: 'ai-audio', name: 'AI Audio', description: 'AI Audio tools', icon: '🎵', order: 5 },
  { id: 'ai-video', slug: 'ai-video', name: 'AI Video', description: 'AI Video tools', icon: '🎬', order: 6 },
  { id: 'ai-productivity', slug: 'ai-productivity', name: 'AI Productivity', description: 'AI Productivity tools', icon: '⚡', order: 7 },
  { id: 'ai-marketing', slug: 'ai-marketing', name: 'AI Marketing', description: 'AI Marketing tools', icon: '📈', order: 8 }
];

fs.writeFileSync(
  path.join(knowledgeBasePath, 'categories.json'),
  JSON.stringify(categories, null, 2)
);

// Update tags.json
const tags = categories.map(cat => ({
  id: cat.id,
  slug: cat.slug,
  name: cat.name,
  description: cat.description
}));

fs.writeFileSync(
  path.join(knowledgeBasePath, 'tags.json'),
  JSON.stringify(tags, null, 2)
);

// Update tools_master.csv
const csvLines = ['id,name,title,description,category,pricing,has_free_tier,has_api,website_url,features,pros,cons'];
normalizedTools.forEach(t => {
  csvLines.push([
    t.id,
    t.name,
    `"${t.title}"`,
    `"${t.description}"`,
    t.category,
    t.pricing,
    t.has_free_tier,
    t.has_api,
    t.website_url,
    t.features.join('|'),
    t.pros.join('|'),
    t.cons.join('|')
  ].join(','));
});

fs.writeFileSync(
  path.join(knowledgeBasePath, 'tools_master.csv'),
  csvLines.join('\n')
);

// Update seo.json
const seoData = normalizedTools.map(t => ({
  tool_slug: t.slug,
  seo_title: `${t.name} — AI Tool | LaunchPilot`,
  seo_description: t.description.substring(0, 160),
  seo_keywords: [t.category.toLowerCase().replace(/\s+/g, '-'), t.name.toLowerCase()],
  canonical_url: `https://launchpilot.com/tools/${t.slug}`,
  og_image: `https://launchpilot.com/og/${t.slug}.png`,
  no_index: false,
  structured_data: {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    'name': t.name,
    'applicationCategory': t.category,
    'operatingSystem': 'Web',
    'offers': {
      '@type': 'Offer',
      'price': t.has_free_tier ? '0' : '0',
      'priceCurrency': 'USD'
    }
  }
}));

fs.writeFileSync(
  path.join(knowledgeBasePath, 'seo.json'),
  JSON.stringify(seoData, null, 2)
);

// Update TOOLS_MASTER.xlsx
const xlsxLines = ['id\tname\ttitle\tdescription\tcategory\tpricing\thas_free_tier\thas_api\twebsite_url'];
normalizedTools.forEach(t => {
  xlsxLines.push([
    t.id,
    t.name,
    t.title.replace(/\t/g, ' '),
    t.description.replace(/\t/g, ' '),
    t.category,
    t.pricing,
    t.has_free_tier,
    t.has_api,
    t.website_url
  ].join('\t'));
});

fs.writeFileSync(
  path.join(knowledgeBasePath, 'TOOLS_MASTER.xlsx'),
  xlsxLines.join('\n')
);

console.log('✅ Categories normalized successfully!');
console.log('Total tools:', normalizedTools.length);
console.log('Categories:', [...new Set(normalizedTools.map(t => t.category))]);