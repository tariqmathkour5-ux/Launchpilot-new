import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const plans = [
  {
    name: 'Free',
    slug: 'free',
    description: 'Get started with basic access to our AI tool directory',
    monthlyPrice: 0,
    yearlyPrice: 0,
    trialDays: 0,
    features: [
      'Browse 15,000+ AI tools',
      '5 favorites',
      '1 collection (up to 10 items)',
      '3 comparisons',
      'Basic search',
    ],
    limits: {
      favorites: 5,
      collections: 1,
      collection_items: 10,
      comparisons: 3,
      api_requests: 0,
    },
    sortOrder: 0,
    isActive: true,
  },
  {
    name: 'Pro',
    slug: 'pro',
    description: 'For individuals and professionals who need unlimited access',
    monthlyPrice: 999,  // $9.99
    yearlyPrice: 9999,  // $99.99
    trialDays: 14,
    features: [
      'Everything in Free',
      'Unlimited favorites',
      'Unlimited collections',
      'Unlimited comparisons',
      'Advanced search & filters',
      'Personalized recommendations',
      'Export comparisons (CSV/PDF)',
    ],
    limits: {
      favorites: -1,
      collections: -1,
      collection_items: -1,
      comparisons: -1,
      api_requests: 1000,
    },
    sortOrder: 1,
    isActive: true,
  },
  {
    name: 'Enterprise',
    slug: 'enterprise',
    description: 'For teams and organizations requiring advanced features and support',
    monthlyPrice: 2999,  // $29.99
    yearlyPrice: 29999,  // $299.99
    trialDays: 0,
    features: [
      'Everything in Pro',
      'Company dashboard',
      'Advanced analytics',
      'Unlimited team members',
      'Publish your AI tools',
      'Custom integrations',
      'White-label options',
      'Dedicated support manager',
      'SLA guarantee',
    ],
    limits: {
      favorites: -1,
      collections: -1,
      collection_items: -1,
      comparisons: -1,
      api_requests: -1,
      team_members: -1,
      published_tools: -1,
      ad_campaigns: -1,
    },
    sortOrder: 2,
    isActive: true,
  },
];

async function main() {
  console.log('🌱 Seeding subscription plans...\n');

  for (const plan of plans) {
    const existing = await prisma.subscriptionPlan.findUnique({
      where: { slug: plan.slug },
    });

    const data = {
      ...plan,
      features: JSON.stringify(plan.features),
      limits: JSON.stringify(plan.limits),
    };

    if (existing) {
      await prisma.subscriptionPlan.update({
        where: { slug: plan.slug },
        data,
      });
      console.log(`  ✓ Updated plan: ${plan.name}`);
    } else {
      await prisma.subscriptionPlan.create({
        data,
      });
      console.log(`  ✓ Created plan: ${plan.name}`);
    }
  }

  console.log('\n✅ Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });