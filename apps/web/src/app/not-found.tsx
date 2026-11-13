import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#080b11] text-slate-100 p-6">
      <div className="max-w-md w-full bg-slate-900/80 border border-slate-800 rounded-2xl p-8 shadow-2xl backdrop-blur-xl text-center">
        <div className="w-16 h-16 rounded-full bg-slate-800/80 border border-slate-700/60 mx-auto flex items-center justify-center mb-6 text-emerald-400">
          <span className="text-2xl font-black font-mono">404</span>
        </div>

        <h1 className="text-xl font-bold text-white mb-2">Module ou Ressource Introuvable</h1>
        <p className="text-sm text-slate-400 mb-6 leading-relaxed">
          La route ou la ressource télématique demandée n&apos;existe pas ou a été déplacée dans le référentiel d&apos;exploitation.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/live-cockpit"
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm transition-colors shadow-lg shadow-emerald-900/30"
          >
            Cockpit Live
          </Link>
          <Link
            href="/digital-twin"
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-sm transition-colors border border-slate-700"
          >
            Jumeau Numérique
          </Link>
        </div>
      </div>
    </div>
  );
}

