/**
 * Exclusive Deals Hub - Mock Deal Data
 * This file contains mock promo codes and price drops for AI tools.
 * In production, this data would come from the database or partner APIs.
 */

export interface Deal {
  id: string;
  toolSlug: string;
  toolName: string;
  type: 'promo_code' | 'price_drop';
  title: string;
  description: string;
  discount: string; // e.g., "25% OFF" or "Save $50"
  promoCode?: string; // Required for promo_code type
  originalPrice?: string;
  newPrice?: string;
  expiresAt?: string;
  isActive: boolean;
  priority: 'high' | 'medium' | 'low';
  ctaText: string;
  websiteUrl: string;
}

// Mock deals data - in production, this would be fetched from database
export const DEALS: Deal[] = [
  {
    id: 'deal-1',
    toolSlug: 'chatgpt',
    toolName: 'ChatGPT',
    type: 'promo_code',
    title: 'ChatGPT Plus Special Offer',
    description: 'Get 50% off your first month of ChatGPT Plus. Perfect for power users who need advanced features.',
    discount: '50% OFF',
    promoCode: 'LAUNCHPILOT50',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
    isActive: true,
    priority: 'high',
    ctaText: 'Claim Offer',
    websiteUrl: 'https://chat.openai.com',
  },
  {
    id: 'deal-2',
    toolSlug: 'midjourney',
    toolName: 'Midjourney',
    type: 'price_drop',
    title: 'Midjourney Annual Deal',
    description: 'Special pricing on annual plans - save up to $120 per year on Pro membership.',
    discount: 'Save $120/year',
    originalPrice: '$360/year',
    newPrice: '$240/year',
    expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    isActive: true,
    priority: 'high',
    ctaText: 'Get Discount',
    websiteUrl: 'https://www.midjourney.com',
  },
  {
    id: 'deal-3',
    toolSlug: 'github-copilot',
    toolName: 'GitHub Copilot',
    type: 'promo_code',
    title: 'GitHub Copilot Free Trial',
    description: 'Extended 60-day free trial for developers. Experience AI-powered coding assistance.',
    discount: '60 Days Free',
    promoCode: 'FREETRIAL60',
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    isActive: true,
    priority: 'medium',
    ctaText: 'Start Free Trial',
    websiteUrl: 'https://github.com/features/copilot',
  },
  {
    id: 'deal-4',
    toolSlug: 'claude',
    toolName: 'Claude',
    type: 'promo_code',
    title: 'Claude Pro Early Access',
    description: 'Exclusive 30-day free trial for Claude Pro - advanced AI assistant for professionals.',
    discount: '30 Days Free',
    promoCode: 'CLAUDEPILOT',
    expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    isActive: true,
    priority: 'high',
    ctaText: 'Get Early Access',
    websiteUrl: 'https://claude.ai',
  },
  {
    id: 'deal-5',
    toolSlug: 'jasper',
    toolName: 'Jasper',
    type: 'price_drop',
    title: 'Jasper Business Plan Discount',
    description: 'Limited time 35% off on all Jasper Business plans. Perfect for teams and businesses.',
    discount: '35% OFF',
    originalPrice: '$125/month',
    newPrice: '$81/month',
    expiresAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    isActive: true,
    priority: 'medium',
    ctaText: 'Save Now',
    websiteUrl: 'https://www.jasper.ai',
  },
  {
    id: 'deal-6',
    toolSlug: 'murf',
    toolName: 'Murf',
    type: 'promo_code',
    title: 'Murf AI Voice Studio Deal',
    description: 'Get 40% off on Murf AI annual plans. Create professional voiceovers with AI.',
    discount: '40% OFF',
    promoCode: 'MURF40DEAL',
    expiresAt: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString(),
    isActive: true,
    priority: 'low',
    ctaText: 'Claim Discount',
    websiteUrl: 'https://murf.ai',
  },
  {
    id: 'deal-7',
    toolSlug: 'notion-ai',
    toolName: 'Notion AI',
    type: 'promo_code',
    title: 'Notion AI Free Credits',
    description: 'Get $20 in free credits when you upgrade to Notion AI. Limited time offer.',
    discount: '$20 Free Credit',
    promoCode: 'NOTION20',
    expiresAt: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
    isActive: true,
    priority: 'medium',
    ctaText: 'Get Credits',
    websiteUrl: 'https://notion.so',
  },
  {
    id: 'deal-8',
    toolSlug: 'canva-ai',
    toolName: 'Canva AI',
    type: 'price_drop',
    title: 'Canva Pro Team Discount',
    description: "Special team pricing - get Canva Pro for your entire team at 25% off.",
    discount: '25% Team Discount',
    originalPrice: '$12.50/member',
    newPrice: '$9.50/member',
    expiresAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
    isActive: true,
    priority: 'low',
    ctaText: 'Save on Teams',
    websiteUrl: 'https://canva.com',
  },
];

// Get active deals
export function getActiveDeals(): Deal[] {
  return DEALS.filter((deal) => deal.isActive);
}

// Get deals for specific tools
export function getDealsForTools(toolSlugs: string[]): Deal[] {
  return DEALS.filter((deal) => deal.isActive && toolSlugs.includes(deal.toolSlug));
}

// Get deal by tool slug
export function getDealByTool(toolSlug: string): Deal | undefined {
  return DEALS.find((deal) => deal.toolSlug === toolSlug && deal.isActive);
}

// Get tools that have active deals
export function getToolsWithDeals(): string[] {
  return [...new Set(DEALS.filter((deal) => deal.isActive).map((deal) => deal.toolSlug))];
}