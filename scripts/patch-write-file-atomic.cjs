/**
 * Script de patch postinstall pour write-file-atomic
 * Résout le problème d'incompatibilité signal-exit v4 / write-file-atomic 4.x sous Node 22/24 & pnpm
 */
const fs = require('fs');
const path = require('path');

function patchFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');
  if (content.includes("const onExit = require('signal-exit')")) {
    content = content.replace(
      "const onExit = require('signal-exit')",
      "const _signalExit = require('signal-exit')\nconst onExit = typeof _signalExit === 'function' ? _signalExit : (_signalExit && _signalExit.onExit ? _signalExit.onExit : () => () => {})"
    );
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`[POSTINSTALL-PATCH] Correctif appliqué sur : ${filePath}`);
  }
}

function walkDir(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'write-file-atomic') {
        patchFile(path.join(full, 'lib', 'index.js'));
      } else {
        walkDir(full);
      }
    }
  }
}

const nm = path.join(__dirname, '..', 'node_modules');
if (fs.existsSync(nm)) {
  walkDir(nm);
}

