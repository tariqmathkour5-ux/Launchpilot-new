const fs = require('fs');
const path = require('path');

// Read existing tool names from tool_pages
const existingTools = new Set();
const files = fs.readdirSync('src/data/tool_pages');
files.forEach(f => {
  if (f.endsWith('.md')) existingTools.add(f.replace('.md', '').toLowerCase());
});

// Also check alternatives and reviews
['alternatives', 'reviews'].forEach(dir => {
  const dirPath = `src/data/${dir}`;
  if (fs.existsSync(dirPath)) {
    const dirFiles = fs.readdirSync(dirPath);
    dirFiles.forEach(f => {
      if (f.endsWith('.md')) existingTools.add(f.replace('.md', '').toLowerCase());
    });
  }
});

// Function to read CSV and extract names
function extractNames(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const names = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    let name = '';
    let inQuotes = false;
    for (let j = 0; j < line.length; j++) {
      if (line[j] === '"') { inQuotes = !inQuotes; continue; }
      if (line[j] === ',' && !inQuotes) break;
      name += line[j];
    }
    name = name.replace(/^"|"$/g, '').trim();
    if (name && name !== 'Name' && name !== 'Names') names.push(name);
  }
  return names;
}

const csvFiles = [
  'C:/Users/طارق/Documents/Zapya/Misc/Complete_AI_Tools_Dataset_2025_-_16763_Tools_from_AIToolBuzz.csv',
  'C:/Users/طارق/Documents/Zapya/Misc/Ai_Tools_Directory.csv',
  'C:/Users/طارق/Documents/Zapya/Misc/Ai_Tools_Directory_(1).csv'
];

const allNew = new Map();

csvFiles.forEach(csvPath => {
  try {
    const names = extractNames(csvPath);
    names.forEach(n => {
      const slug = n.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      if (slug && !existingTools.has(slug)) {
        allNew.set(slug, n);
      }
    });
  } catch(e) {
    console.error('Error reading:', csvPath, e.message);
  }
});

const result = [];
result.push('Existing tools count: ' + existingTools.size);
result.push('New tools count: ' + allNew.size);
result.push('');
result.push('New tools list:');
allNew.forEach((name, slug) => {
  result.push(name + ' -> ' + slug);
});

fs.writeFileSync('scripts/new-tools-output.txt', result.join('\n'), 'utf8');
console.log('Output written to scripts/new-tools-output.txt');