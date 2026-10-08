import { useEffect, useRef } from "react";
import {
  AIRCRAFT,
  AIRCRAFT_ORDER,
  drawTopDownAircraft,
} from "../utils/aircraft.js";
const COLORS = [
  ["Sky blue", "#38bdf8"],
  ["Berry pink", "#ec4899"],
  ["Leaf green", "#22c55e"],
  ["Sunny yellow", "#eab308"],
  ["Purple", "#a855f7"],
  ["Orange", "#f97316"],
];
function AircraftThumb({ id, paint }) {
  const ref = useRef(null);
  useEffect(() => {
    const ctx = ref.current.getContext("2d");
    ctx.clearRect(0, 0, 100, 100);
    ctx.save();
    ctx.translate(50, 50);
    drawTopDownAircraft(ctx, id, { scale: 1.6, paint });
    ctx.restore();
  }, [id, paint]);
  return <canvas ref={ref} width={100} height={100} aria-hidden="true" />;
}
export default function Hangar({ progress, onSelectSkin, onColor }) {
  return (
    <section className="hangar-page">
      <h1>🛩️ My planes</h1>
      <p>Pick your paint. Pick your plane. Every plane flies at your pace.</p>
      <div className="paint-options" aria-label="Plane paint">
        {COLORS.map(([name, color]) => (
          <button
            key={color}
            aria-label={name}
            aria-pressed={progress.settings.planeColor === color}
            style={{ background: color }}
            onClick={() => onColor(color)}
          >
            {progress.settings.planeColor === color ? "✓" : ""}
          </button>
        ))}
      </div>
      <div className="fleet-grid">
        {AIRCRAFT_ORDER.map((id, i) => {
          const unlocked = progress.hangar.unlockedSkins.includes(id);
          return (
            <button
              key={id}
              className="plane-card"
              aria-pressed={id === progress.settings.hangarSkin}
              disabled={!unlocked}
              onClick={() => onSelectSkin(id)}
            >
              <AircraftThumb id={id} paint={progress.settings.planeColor} />
              <h2>{AIRCRAFT[id].name}</h2>
              <span>
                {unlocked
                  ? id === progress.settings.hangarSkin
                    ? "✓ My plane"
                    : "Choose this plane"
                  : `🔒 ${[0, 2, 4, 6, 9, 12][i]} stories or missions`}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
