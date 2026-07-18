import fs from 'fs';

const tools = JSON.parse(fs.readFileSync('c:/Users/طارق/Documents/مشروع طارق من كلود Launchpilot/LaunchPilot_AI_KnowledgeBase/tools_master.json', 'utf8'));

// Check for insidr.ai affiliate links (should all be empty now)
const toolsWithAffiliateLinks = tools.filter(t => t.website_url && t.website_url.includes('insidr.ai'));
console.log('Tools with insidr.ai links (should be 0):', toolsWithAffiliateLinks.length);

// Check for UTM parameters (should all be cleaned)
const toolsWithUtm = tools.filter(t => t.website_url && (t.website_url.includes('utm_') || t.website_url.includes('?aff')));
console.log('Tools with tracking params (should be 0):', toolsWithUtm.length);

// Check categories format
const categories = [...new Set(tools.map(t => t.category))];
console.log('Unique categories:', categories);

// Check for launchpilot affiliate fields
const toolsWithLpFields = tools.filter(t => t.launchpilot_affiliate_url !== undefined);
console.log('Tools with LP affiliate fields:', toolsWithLpFields.length);

// Check sample tool
const sampleTool = tools.find(t => t.launchpilot_affiliate_url !== undefined);
if (sampleTool) {
  console.log('Sample tool:', {
    name: sampleTool.name,
    website_url: sampleTool.website_url,
    launchpilot_affiliate_url: sampleTool.launchpilot_affiliate_url,
    launchpilot_affiliate_params: sampleTool.launchpilot_affiliate_params
  });
}

// Count tools with empty URLs (these were affiliate links that were removed)
const toolsWithEmptyUrl = tools.filter(t => !t.website_url || t.website_url === '');
console.log('Tools with empty URL (removed affiliate links):', toolsWithEmptyUrl.length);