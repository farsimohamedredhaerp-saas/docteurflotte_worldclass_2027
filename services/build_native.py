"""
==============================================================================
DOCTEURFLOTTE — Orchestrateur de Compilation & Purge des Sources Python
==============================================================================
Exécute la compilation Cython en place et supprime les fichiers .py et .c
pour garantir qu'aucun code source en clair ne subsiste dans le conteneur.
"""

import os
import sys
import subprocess
import glob

def compile_and_purge():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    setup_file = os.path.join(base_dir, "setup_cython.py")

    print("🚀 [BUILD-NATIVE] Compilation des modules Python en bibliothèques C...")
    result = subprocess.run([sys.executable, setup_file, "build_ext", "--inplace"], cwd=base_dir)
    if result.returncode != 0:
        print("❌ [BUILD-NATIVE] Échec de la compilation Cython.")
        sys.exit(result.returncode)

    print("🧹 [BUILD-NATIVE] Nettoyage des fichiers temporaires .c et build/...")
    # Nettoyage des .c intermédiaires
    for c_file in glob.glob(os.path.join(base_dir, "**/*.c"), recursive=True):
        try:
            os.remove(c_file)
            print(f"  Supprimé : {os.path.basename(c_file)}")
        except OSError:
            pass

    # Option de purge des sources .py (activée si --purge-source passé en argument)
    if "--purge-sources" in sys.argv:
        print("🔒 [BUILD-NATIVE] Mode Zero-Source : Suppression des fichiers .py compilés...")
        from setup_cython import MODULES_TO_PROTECT
        for mod_rel in MODULES_TO_PROTECT:
            py_path = os.path.join(base_dir, mod_rel)
            if os.path.exists(py_path):
                # Vérifier qu'un .so ou .pyd existe avant de supprimer le .py
                base_no_ext = os.path.splitext(py_path)[0]
                binaries = glob.glob(f"{base_no_ext}*.so") + glob.glob(f"{base_no_ext}*.pyd")
                if binaries:
                    os.remove(py_path)
                    print(f"  ✓ Source .py purgé (conservé en binaire {os.path.basename(binaries[0])})")
                else:
                    print(f"  ⚠️ Pas de binaire trouvé pour {py_path}, source conservé par sécurité.")

    print("✓ [SUCCESS] Modules protégés et optimisés.")

if __name__ == "__main__":
    compile_and_purge()

