"""
==============================================================================
DOCTEURFLOTTE — Script de Compilation Native Cython (Protection IP Algorithmes)
==============================================================================
Traduit les modules Python sensibles en C et les compile en bibliothèques
partagées binaires (.so sous Linux, .pyd sous Windows).
Les fichiers sources .py peuvent ensuite être supprimés pour ne livrer
que des binaires machine compilés sans bytecode décompilable.
"""

import os
import sys
import shutil
from setuptools import setup, Extension
try:
    from Cython.Build import cythonize
    from Cython.Distutils import build_ext
except ImportError:
    print("❌ Cython n'est pas installé. Exécutez : pip install cython setuptools")
    sys.exit(1)

# Modules critiques contenant la propriété intellectuelle mathématique et métier
MODULES_TO_PROTECT = [
    "decision-engine/regulatory_and_predictive_gate.py",
    "decision-engine/substitution_optimizer.py",
    "decision-engine/models.py",
    "oem-scraper/catalog_resolver_dz.py",
    "oem-scraper/vin_resolver_dz.py",
]

def get_extensions():
    extensions = []
    base_dir = os.path.dirname(os.path.abspath(__file__))
    
    for rel_path in MODULES_TO_PROTECT:
        full_path = os.path.join(base_dir, rel_path)
        if os.path.exists(full_path):
            mod_name = os.path.splitext(rel_path.replace("/", ".").replace("\\", "."))[0]
            extensions.append(
                Extension(
                    name=mod_name,
                    sources=[full_path],
                    extra_compile_args=["-O3", "-Wall"] if sys.platform != "win32" else ["/O2"],
                )
            )
        else:
            print(f"⚠️ Fichier introuvable pour compilation Cython : {rel_path}")
            
    return extensions

if __name__ == "__main__":
    exts = get_extensions()
    if not exts:
        print("❌ Aucun module à compiler.")
        sys.exit(1)

    setup(
        name="docteurflotte_native_core",
        version="1.0.0",
        cmdclass={"build_ext": build_ext},
        ext_modules=cythonize(
            exts,
            compiler_directives={
                "language_level": "3",
                "always_allow_keywords": True,
                "cdivision": True,
                "boundscheck": False,
                "wraparound": False,
            },
        ),
    )
    print("✓ [SUCCESS] Compilation Cython terminée. Les binaires natifs (.so/.pyd) sont prêts.")

