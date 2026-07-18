import fs from 'fs';
import path from 'path';

const KB_PATH = path.join(process.cwd(), 'LaunchPilot_AI_KnowledgeBase', 'tools_master.json');

// Load tools
const tools = JSON.parse(fs.readFileSync(KB_PATH, 'utf-8'));
console.log('Total tools loaded:', tools.length);

// Filter out agents
const AGENT_CATEGORIES = ['ai-agents', 'ai agents', 'Ai Agents'];
const aiTools = tools.filter(t => {
  const catLower = t.category.toLowerCase();
  return !AGENT_CATEGORIES.includes(catLower);
});

console.log('AI Tools (excluding agents):', aiTools.length);
console.log('Agent Tools:', tools.length - aiTools.length);

// Get categories
const categories = [...new Set(aiTools.map(t => t.category))].sort();
console.log('\nCategories:', categories.slice(0, 15).join(', '));

// Test filter
const filtered = aiTools.filter(t => t.category.toLowerCase().includes('chat')).slice(0, 5);
console.log('\nSample tools:', filtered.map(t => t.name).join(', '));