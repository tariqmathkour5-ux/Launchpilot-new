nimport fs from 'fs';
import path from 'path';

// Check the Ai_Tools_Directory_(1).csv file
const csvPath = path.join(process.cwd(), 'project/data/Ai_Tools_Directory_(1).csv');
if (fs.existsSync(csvPath)) {
  const content = fs.readFileSync(csvPath, 'utf8');
  const lines = content.split('\n').filter(l => l.trim()).length;
  console.log('Ai_Tools_Directory_(1).csv: ' + (lines - 1) + ' tools');
}

// Check TOOLS_MASTER.xlsx - we can't read it directly without a library, but we can check its size
const xlsxPath = path.join(process.cwd(), 'LaunchPilot_AI_KnowledgeBase/TOOLS_MASTER.xlsx');
if (fs.existsSync(xlsxPath)) {
  const stats = fs.statSync(xlsxPath);
  console.log('TOOLS_MASTER.xlsx: ' + (stats.size / 1024 / 1024).toFixed(2) + ' MB');
}