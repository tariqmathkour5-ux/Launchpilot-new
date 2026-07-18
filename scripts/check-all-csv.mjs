import fs from 'fs';
import path from 'path';

const extractedPath = path.join(process.cwd(), 'project/data/extracted');

// Check all archive directories
const archives = ['archive', 'archive_(2)', 'archive_(3)', 'archive_(5)', 'archive_(6)', 'archive_(7)', 'archive_(8)', 'archive_(9)'];

console.log('Checking all archive directories...\n');

archives.forEach(archive => {
  const fullPath = path.join(extractedPath, archive);
  if (fs.existsSync(fullPath)) {
    const files = fs.readdirSync(fullPath);
    const csvFiles = files.filter(f => f.endsWith('.csv'));
    
    if (csvFiles.length > 0) {
      console.log(archive + ':');
      csvFiles.forEach(csvFile => {
        const csvPath = path.join(fullPath, csvFile);
        try {
          const content = fs.readFileSync(csvPath, 'utf8');
          const lines = content.split('\n').filter(l => l.trim());
          const headerLine = lines[0] || '';
          console.log('  ' + csvFile + ': ' + (lines.length - 1) + ' tools, headers: ' + headerLine.substring(0, 100));
        } catch (e) {
          console.log('  ' + csvFile + ': error reading');
        }
      });
    }
  }
});