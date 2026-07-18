import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

// Load knowledge base data
const knowledgeBasePath = path.join(process.cwd(), 'LaunchPilot_AI_KnowledgeBase');

// Load all JSON files
const toolsMaster = JSON.parse(fs.readFileSync(path.join(knowledgeBasePath, 'tools_master.json'), 'utf8'));
const categories = JSON.parse(fs.readFileSync(path.join(knowledgeBasePath, 'categories.json'), 'utf8'));
const companies = JSON.parse(fs.readFileSync(path.join(knowledgeBasePath, 'companies.json'), 'utf8'));
const seo = JSON.parse(fs.readFileSync(path.join(knowledgeBasePath, 'seo.json'), 'utf8'));

async function importCategories() {
  console.log('📂 Importing categories...');
  
  for (const category of categories) {
    const existing = await prisma.category.findUnique({
      where: { slug: category.slug }
    });
    
    if (existing) {
      await prisma.category.update({
        where: { slug: category.slug },
        data: {
          name: category.name,
          description: category.description,
        }
      });
      console.log(`  ✓ Updated category: ${category.name}`);
    } else {
      await prisma.category.create({
        data: {
          slug: category.slug,
          name: category.name,
          description: category.description || '',
          order: category.order || 0,
        }
      });
      console.log(`  ✓ Created category: ${category.name}`);
    }
  }
}

async function importCompanies() {
  console.log('\n🏢 Importing companies...');
  
  for (const company of companies) {
    const existing = await prisma.company.findUnique({
      where: { slug: company.slug }
    });
    
    if (existing) {
      await prisma.company.update({
        where: { slug: company.slug },
        data: {
          name: company.name,
          description: company.description || '',
          industry: company.industry || '',
          founded: company.founded || null,
          headquarters: company.headquarters || '',
          website: company.website || '',
        }
      });
      console.log(`  ✓ Updated company: ${company.name}`);
    } else {
      await prisma.company.create({
        data: {
          slug: company.slug,
          name: company.name,
          description: company.description || '',
          industry: company.industry || '',
          founded: company.founded || null,
          headquarters: company.headquarters || '',
          website: company.website || '',
        }
      });
      console.log(`  ✓ Created company: ${company.name}`);
    }
  }
}

async function importTools() {
  console.log('\n🔧 Importing tools...');
  
  for (const tool of toolsMaster) {
    // Find or create category
    let category = await prisma.category.findUnique({
      where: { slug: tool.category.toLowerCase().replace(/\s+/g, '-') }
    });
    
    if (!category) {
      // Create category if not exists
      category = await prisma.category.create({
        data: {
          slug: tool.category.toLowerCase().replace(/\s+/g, '-'),
          name: tool.category,
          description: tool.category + ' tools',
        }
      });
    }
    
    // Find or create company
    let company = null;
    if (tool.name === 'ChatGPT' || tool.name === 'DALL-E 3') {
      company = await prisma.company.findUnique({
        where: { slug: 'openai' }
      });
    } else if (tool.name === 'Claude') {
      company = await prisma.company.findUnique({
        where: { slug: 'anthropic' }
      });
    } else if (tool.name === 'Midjourney') {
      company = await prisma.company.findUnique({
        where: { slug: 'midjourney-inc' }
      });
    } else if (tool.name === 'GitHub Copilot') {
      company = await prisma.company.findUnique({
        where: { slug: 'microsoft' }
      });
    } else if (tool.name === 'Jasper') {
      company = await prisma.company.findUnique({
        where: { slug: 'jasper-ai' }
      });
    }
    
    const existing = await prisma.tool.findUnique({
      where: { slug: tool.slug }
    });
    
    const toolData = {
      slug: tool.slug,
      name: tool.name,
      title: tool.title || tool.name,
      description: tool.description || '',
      content: tool.content || '',
      categoryId: category.id,
      companyId: company?.id || null,
      pricing: tool.pricing || 'unknown',
      hasFreeTier: tool.has_free_tier || false,
      hasApi: tool.has_api || false,
      platforms: JSON.stringify(tool.platforms || []),
      features: JSON.stringify(tool.features || []),
      pros: JSON.stringify(tool.pros || []),
      cons: JSON.stringify(tool.cons || []),
      useCases: JSON.stringify(tool.use_cases || []),
      integrations: JSON.stringify(tool.integrations || []),
      websiteUrl: tool.website_url || '',
    };
    
    if (existing) {
      await prisma.tool.update({
        where: { slug: tool.slug },
        data: toolData
      });
      console.log(`  ✓ Updated tool: ${tool.name}`);
    } else {
      await prisma.tool.create({
        data: toolData
      });
      console.log(`  ✓ Created tool: ${tool.name}`);
    }
  }
}

async function main() {
  console.log('🚀 Starting knowledge base import...\n');
  
  try {
    await importCategories();
    await importCompanies();
    await importTools();
    
    console.log('\n✅ Knowledge base import completed successfully!');
  } catch (error) {
    console.error('❌ Import failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();