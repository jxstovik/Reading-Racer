import { useEffect, useRef } from "react";
import { AIRCRAFT, AIRCRAFT_ORDER, drawTopDownAircraft } from "../utils/aircraft.js";

function AircraftThumb({ id, active }) {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const w = 96, h = 96;
    c.width = w * dpr;
    c.height = h * dpr;
    c.style.width = `${w}px`;
    c.style.height = `${h}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0,0,w,h);
    // background circle
    ctx.fillStyle = active ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.12)";
    ctx.beginPath(); ctx.arc(w/2, h/2, 38, 0, Math.PI*2); ctx.fill();
    ctx.save();
    ctx.translate(w/2, h/2 + 6);
    // headings up, slight scale per tier
    const s = id === "xb70" ? 1.25 : id === "sr71" ? 1.2 : id === "b737" ? 1.05 : 1.0;
    drawTopDownAircraft(ctx, id, { scale: s, thrust: 0.5 });
    ctx.restore();
  }, [id, active]);
  return <canvas ref={ref} width={96} height={96} className="mx-auto block" />;
}

export default function Hangar({ progress, onSelectSkin }) {
  const unlocked = new Set(progress.hangar.unlockedSkins);
  const activeId = progress.settings.hangarSkin;
  const active = AIRCRAFT[activeId];

  return (
    <div className="bg-white rounded-3xl p-6 shadow-xl border-2 border-slate-100">
      <h2 className="text-2xl font-black text-slate-800">🛩️ Hangar — Top-Down Fleet</h2>
      <p className="text-sm text-slate-500">
        Faster aircraft need more skill. Unlock by reading! Current: <b className="text-sky-700">{active?.name || activeId}</b> — {active?.speed} kts
        <span className="ml-2 text-[11px] bg-amber-100 text-amber-700 px-2 py-1 rounded-full">Wrap edges: fly off one side, appear other — like Pac-Man</span>
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
        {AIRCRAFT_ORDER.map((key) => {
          const ac = AIRCRAFT[key];
          const isUnlocked = unlocked.has(key);
          const isActive = activeId === key;
          const speedPct = Math.round((ac.speed / 320) * 100);
          return (
            <button
              key={key}
              disabled={!isUnlocked}
              onClick={() => onSelectSkin(key)}
              className={`rounded-2xl p-4 border-4 text-center transition text-white relative overflow-hidden
                ${isActive ? "border-emerald-400 scale-[1.02] shadow-lg" : "border-slate-200"}
                ${isUnlocked ? `bg-gradient-to-br ${acColor(ac.id)}` : "bg-slate-100 !text-slate-400 border-dashed"}`}
            >
              {isActive && <span className="absolute top-2 right-2 bg-emerald-500 text-white text-[10px] font-black px-2 py-1 rounded-full">ACTIVE</span>}
              <AircraftThumb id={key} active={isActive} />
              <div className="font-black text-sm mt-1 drop-shadow">{ac.name}</div>
              <div className="text-[11px] opacity-90">{isUnlocked ? ac.desc : `🔒 ${ac.unlock}`}</div>
              <div className="mt-2 text-[11px] text-left">
                <div className="flex justify-between"><span>Speed</span><span className="font-bold">{ac.speed} kts</span></div>
                <div className="h-1.5 bg-white/30 rounded-full overflow-hidden mt-1">
                  <div className="h-full bg-white rounded-full" style={{ width: `${speedPct}%` }} />
                </div>
                <div className="flex justify-between mt-1"><span>Tier</span><span className="font-bold">#{ac.tier} / 6</span></div>
              </div>
              <div className="text-[11px] mt-2 font-bold bg-white/20 rounded-full py-1">
                {isUnlocked ? (isActive ? "✓ Flying" : "Tap to equip") : `🔒 ${ac.unlock}`}
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-6 bg-sky-50 rounded-2xl p-4 border border-sky-200 flex gap-3 items-center">
        <div className="text-3xl">🔄</div>
        <div>
          <h3 className="font-bold text-sky-900">Pac-Man Wrap</h3>
          <p className="text-sm text-slate-600">Edges wrap horizontally — fly off the left edge and reappear on the right (and vice versa). Use it to grab rings near the walls and dodge mountains!</p>
        </div>
      </div>

      <div className="mt-4 bg-amber-50 rounded-2xl p-4 border border-amber-200">
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

function acColor(id) {
  const map = {
    c172: "from-sky-400 to-blue-600",
    b737: "from-slate-400 to-slate-700",
    f16: "from-zinc-400 to-zinc-800",
    f22: "from-slate-500 to-slate-900",
    sr71: "from-neutral-700 to-black",
    xb70: "from-amber-300 to-orange-700",
  };
  return map[id] || "from-sky-400 to-blue-600";
}
