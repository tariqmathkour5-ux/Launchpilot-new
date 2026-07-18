import fs from 'fs';
import path from 'path';

// Check awesome-ai-tools markdown files
const awesomePath = path.join(process.cwd(), 'project/data/extracted/awesome-ai-tools-main/awesome-ai-tools-main');
if (fs.existsSync(awesomePath)) {
  const files = fs.readdirSync(awesomePath).filter(f => f.endsWith('.md'));
  console.log('\nawesome-ai-tools markdown files:');
  let total = 0;
  for (const f of files) {
    const content = fs.readFileSync(path.join(awesomePath, f), 'utf8');
    // Count markdown links like [Tool Name](url)
    const matches = content.match(/\[([^\]]+)\]\(/g) || [];
    const unique = new Set(matches.map(m => m.slice(1, -2))).size; // Get unique tool names
    console.log('  ' + f + ': ~' + unique + ' tools');
    total += unique;
  }
  console.log('Total from awesome-ai-tools:', total);
}

// Check ai-directories-main
const aiDirsPath = path.join(process.cwd(), 'project/data/extracted/ai-directories-main/ai-directories-main');
if (fs.existsSync(aiDirsPath)) {
  const files = fs.readdirSync(aiDirsPath).filter(f => f.endsWith('.md'));
  console.log('\nai-directories-main markdown files:');
  let total = 0;
  for (const f of files) {
    const content = fs.readFileSync(path.join(aiDirsPath, f), 'utf8');
    const matches = content.match(/\[([^\]]+)\]\(/g) || [];
    const unique = new Set(matches.map(m => m.slice(1, -2))).size;
    console.log('  ' + f + ': ~' + unique + ' tools');
    total += unique;
  }
  console.log('Total from ai-directories:', total);
}