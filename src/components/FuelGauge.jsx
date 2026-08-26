export default function FuelGauge({ current, required, total }) {
  const pct = Math.min(100, Math.round((current / required) * 100));
  const canFly = current >= required;
  return (
    <div className="bg-white rounded-2xl p-4 shadow-md border-2 border-amber-200">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-bold tracking-wide text-amber-700 uppercase">Fuel Tank</span>
        <span className="text-xs font-semibold bg-amber-100 text-amber-800 px-2 py-1 rounded-full">
          {current} / {required}
        </span>
      </div>
      <div className="h-6 bg-amber-50 rounded-full overflow-hidden border border-amber-200 relative">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${canFly ? "bg-gradient-to-r from-emerald-400 to-teal-500" : "bg-gradient-to-r from-amber-400 to-orange-500"}`}
          style={{ width: `${pct}%` }}
        />
        <div className="absolute inset-0 flex items-center justify-center text-xs font-black text-amber-900/70">
          {pct}% {canFly ? "— Ready to Fly!" : ""}
        </div>
      </div>
      <div className="mt-2 flex justify-between text-[11px] text-slate-500">
        <span>Total earned: {total} fuel</span>
        <span className={canFly ? "text-emerald-600 font-bold" : ""}>{canFly ? "✈️ Tap FLY!" : `Need ${required - current} more`}</span>
      </div>
    </div>
  );
}
