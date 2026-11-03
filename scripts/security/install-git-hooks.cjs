/**
 * Script d'installation automatique des Git Hooks DocteurFlotte
 */
const fs = require('fs');
const path = require('path');

function installGitHooks() {
  const gitHooksDir = path.join(process.cwd(), '.git', 'hooks');
  if (!fs.existsSync(gitHooksDir)) {
    console.log('ℹ Dossier .git/hooks non trouvé (environnement non-git ou conteneur). Installation ignorée.');
    return;
  }

  const sourceHook = path.join(process.cwd(), 'scripts', 'security', 'pre-commit-hook.sh');
  const targetHook = path.join(gitHooksDir, 'pre-commit');

  if (!fs.existsSync(sourceHook)) {
    console.error('❌ Hook source introuvable :', sourceHook);
    return;
  }

  const hookContent = fs.readFileSync(sourceHook, 'utf8');
  fs.writeFileSync(targetHook, hookContent, { mode: 0o755 });

  console.log('✓ [GIT HOOK] Hook pre-commit anti-fuite de secrets installé avec succès dans .git/hooks/pre-commit');
}

installGitHooks();

