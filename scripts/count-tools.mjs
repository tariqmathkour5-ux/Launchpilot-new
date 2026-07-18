import fs from 'fs';
import path from 'path';

const extractedPath = path.join(process.cwd(), 'project/data/extracted');

const archives = [
  { name: 'archive_(8)', file: 'AI_Landscape_19k_Tools_2026.csv' },
  { name: 'archive_(7)', file: 'AI_tools_dataset.csv' },
  { name: 'archive_(9)', file: 'ai_tools.csv' },
  { name: 'archive_(6)', file: 'Generative AI Tools - Platforms 2025.csv' },
  { name: 'archive_(2)', file: 'Ai Tools Directory.csv' },
  { name: 'archive', file: 'Ai Tools Directory.csv' }
];

let total = 0;
archives.forEach(({ name, file }) => {
  const fullPath = path.join(extractedPath, name, file);
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf8');
    const lines = content.split('\n').filter(l => l.trim()).length;
    console.log(name + ': ' + (lines - 1) + ' tools (from ' + file + ')');
    total += (lines - 1);
  } else {
    console.log(name + ': File not found - ' + file);
  }
});

console.log('\nTotal from archives: ' + total);