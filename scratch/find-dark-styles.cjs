const fs = require('fs');
const content = fs.readFileSync('apps/web/src/app/maintenance/page.tsx', 'utf-8');
const lines = content.split('\n');

const findings = [];
lines.forEach((line, idx) => {
  // Check for any hardcoded black/dark colors or contrasts
  if (
    line.match(/background:\s*['"]#(?!fff|FFF)/) ||
    line.match(/background:\s*['"]rgba?\(\s*0\s*,/) ||
    line.match(/color:\s*['"]#(?:fff|FFF|f8|F8)/) ||
    line.includes('#0') ||
    line.includes('#1') ||
    line.includes('#2') ||
    line.includes('#3') ||
    line.includes('#4') ||
    line.includes('#5') ||
    line.includes('#6') ||
    line.includes('#7') ||
    line.includes('#8') ||
    line.includes('#9')
  ) {
    // Exclude CSS variables
    if (!line.includes('var(--df-')) {
      findings.push({ line: idx + 1, code: line.trim() });
    }
  }
});

console.log('Total matches without var(--df-):', findings.length);
console.log(JSON.stringify(findings.slice(0, 40), null, 2));
