export default function RootLoading() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#080b11] text-slate-100 p-6">
      <div className="relative flex items-center justify-center mb-6">
        <div className="w-16 h-16 rounded-full border-2 border-emerald-500/20 border-t-emerald-400 animate-spin" />
        <div className="absolute w-8 h-8 rounded-full bg-emerald-500/10 blur-sm" />
      </div>
      <div className="text-center space-y-2">
        <h2 className="text-lg font-semibold tracking-wide text-white">DocteurFlotte 2027</h2>
        <p className="text-xs text-slate-400 font-mono tracking-wider uppercase">
          Chargement du cockpit décisionnel souverain...
        </p>
      </div>
    </div>
  );
}

