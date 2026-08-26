const SKINS = {
  classic: { emoji: "✈️", name: "Classic", color: "from-sky-400 to-blue-600", desc: "Your first plane!" },
  rocket: { emoji: "🚀", name: "Rocket", color: "from-rose-500 to-orange-600", desc: "Unlock after 1 story" },
  sea: { emoji: "🛩️", name: "Sea Plane", color: "from-teal-400 to-cyan-600", desc: "Unlock after 3 stories" },
  jungle: { emoji: "🛫", name: "Jungle Jet", color: "from-green-500 to-emerald-700", desc: "Unlock after 4 stories" },
  star: { emoji: "🌟", name: "Star Glider", color: "from-violet-500 to-purple-800", desc: "Unlock after 5 stories" },
};

export default function Hangar({ progress, onSelectSkin }) {
  const unlocked = new Set(progress.hangar.unlockedSkins);
  return (
    <div className="bg-white rounded-3xl p-6 shadow-xl border-2 border-slate-100">
      <h2 className="text-2xl font-black text-slate-800">🛩️ Hangar</h2>
      <p className="text-sm text-slate-500">Complete stories to unlock new planes. Current: <b>{progress.settings.hangarSkin}</b></p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4">
        {Object.entries(SKINS).map(([key, s]) => {
          const isUnlocked = unlocked.has(key);
          const isActive = progress.settings.hangarSkin === key;
          return (
            <button
              key={key}
              disabled={!isUnlocked}
              onClick={() => onSelectSkin(key)}
              className={`rounded-2xl p-4 border-4 text-center transition ${isActive ? "border-emerald-400 scale-105" : "border-slate-200"} ${isUnlocked ? `bg-gradient-to-br ${s.color} text-white` : "bg-slate-100 text-slate-400"}`}
            >
              <div className="text-4xl mb-1">{s.emoji}</div>
              <div className="font-black text-sm">{s.name}</div>
              <div className="text-[11px] opacity-80">{isUnlocked ? (isActive ? "✓ Active" : "Tap to equip") : `🔒 ${s.desc}`}</div>
            </button>
          );
        })}
      </div>
      <div className="mt-6 bg-amber-50 rounded-2xl p-4 border border-amber-200">
        <h3 className="font-bold text-amber-800">🏆 Stickers</h3>
        {progress.hangar.stickers.length === 0 ? (
          <p className="text-sm text-slate-500">No stickers yet — finish a story to earn one!</p>
        ) : (
          <div className="flex flex-wrap gap-2 mt-2">
            {progress.hangar.stickers.map((s, i) => (
              <span key={i} className="bg-white border px-3 py-1 rounded-full text-sm">⭐ {s.storyId}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
