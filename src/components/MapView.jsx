const DESTINATIONS = [
  { emoji: "🏝️", name: "Cloud Island", need: 1 },
  { emoji: "🏜️", name: "Desert Outpost", need: 3 },
  { emoji: "🏔️", name: "Mountain Peak", need: 5 },
  { emoji: "🌃", name: "City Lights", need: 7 },
  { emoji: "❄️", name: "Arctic Base", need: 10 },
  { emoji: "🚀", name: "Space Port", need: 14 },
];

export default function MapView({ progress }) {
  const flights = progress.flightsFlown;
  return (
    <div className="bg-white rounded-3xl p-6 shadow-xl border-2 border-slate-100">
      <h2 className="text-2xl font-black text-slate-800">🗺️ Adventure Map</h2>
      <p className="text-sm text-slate-500">Each flight moves you forward. Keep reading to discover new places!</p>
      <div className="mt-4 relative">
        <div className="absolute left-6 top-4 bottom-4 w-1 bg-gradient-to-b from-sky-300 to-indigo-300 rounded-full" />
        <div className="space-y-3">
          {DESTINATIONS.map((d) => {
            const reached = flights >= d.need;
            const isNext = !reached && flights >= d.need - 1;
            return (
              <div key={d.name} className={`relative flex items-center gap-4 p-3 rounded-2xl border-2 ${reached ? "bg-emerald-50 border-emerald-200" : isNext ? "bg-amber-50 border-amber-300 animate-pulse" : "bg-slate-50 border-slate-200 opacity-60"}`}>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl border-2 ${reached ? "bg-emerald-500 border-emerald-600" : "bg-white border-slate-300"}`}>
                  {d.emoji}
                </div>
                <div className="flex-1">
                  <div className="font-black text-slate-800">{d.name}</div>
                  <div className="text-xs text-slate-500">{reached ? "✓ Reached!" : isNext ? "Next destination!" : `Needs ${d.need} flights (you have ${flights})`}</div>
                </div>
                {reached && <span className="text-emerald-600 font-black">✓</span>}
              </div>
            );
          })}
        </div>
      </div>
      <div className="mt-4 text-center text-sm text-slate-500">
        Flights flown: <b>{flights}</b> • Stars collected: ⭐ {progress.starsCollected}
      </div>
    </div>
  );
}
