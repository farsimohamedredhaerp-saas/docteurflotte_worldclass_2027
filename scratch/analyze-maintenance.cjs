const fs = require('fs');

const content = fs.readFileSync('apps/web/src/app/maintenance/page.tsx', 'utf-8');
const hexes = content.match(/#[0-9a-fA-F]{3,8}/g) || [];
const counts = {};
hexes.forEach((h) => {
  const norm = h.toUpperCase();
  counts[norm] = (counts[norm] || 0) + 1;
});

// Also look for dark styling patterns
const lines = content.split('\n');
const suspiciousLines = [];
lines.forEach((line, idx) => {
  if (
    line.includes('#0') ||
    line.includes('#1') ||
    line.includes('#2') ||
    line.includes('rgb(0') ||
    line.includes('rgba(0') ||
    line.includes('background: \'#') ||
    line.includes('color: \'#') ||
    line.includes('border: \'1px solid #')
  ) {
    suspiciousLines.push({ line: idx + 1, text: line.trim() });
  }
});

console.log('Hex summary:');
console.log(JSON.stringify(counts, null, 2));
console.log('\nSuspicious lines count:', suspiciousLines.length);
console.log('First 20 suspicious lines:', suspiciousLines.slice(0, 20));
