import fs from 'fs';
import path from 'path';

const extractedPath = path.join(process.cwd(), 'project/data/extracted');

// Check Artificial-Intelligence-Universe-main
const aiUniversePath = path.join(extractedPath, 'Artificial-Intelligence-Universe-main');
if (fs.existsSync(aiUniversePath)) {
  const files = fs.readdirSync(aiUniversePath);
  console.log('\nArtificial-Intelligence-Universe-main files:');
  files.forEach(f => {
    if (f.endsWith('.csv') || f.endsWith('.json')) {
      const fullPath = path.join(aiUniversePath, f);
      const stats = fs.statSync(fullPath);
      if (f.endsWith('.csv')) {
        const content = fs.readFileSync(fullPath, 'utf8');
        const lines = content.split('\n').filter(l => l.trim()).length;
        console.log('  ' + f + ': ' + (lines - 1) + ' tools');
      } else {
        console.log('  ' + f + ': ' + (stats.size / 1024).toFixed(1) + ' KB');
      }
    }
  });
}

// Check ai-directories-main
const aiDirsPath = path.join(extractedPath, 'ai-directories-main');
if (fs.existsSync(aiDirsPath)) {
  const files = fs.readdirSync(aiDirsPath);
  console.log('\nai-directories-main files:');
  files.forEach(f => {
    if (f.endsWith('.md')) {
      const fullPath = path.join(aiDirsPath, f);
      const content = fs.readFileSync(fullPath, 'utf8');
      const tools = content.match(/\[([^\]]+)\]\([^)]+\)/g) || [];
      console.log('  ' + f + ': ~' + tools.length + ' tools (from markdown links)');
    }
  });
}

// Check all CSV files in archive_(9) which has multiple files
const archive9Path = path.join(extractedPath, 'archive_(9)');
if (fs.existsSync(archive9Path)) {
  const files = fs.readdirSync(archive9Path);
  console.log('\narchive_(9) CSV files:');
  files.forEach(f => {
    if (f.endsWith('.csv')) {
      const fullPath = path.join(archive9Path, f);
      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n').filter(l => l.trim()).length;
      console.log('  ' + f + ': ' + (lines - 1) + ' tools');
    }
  });
}