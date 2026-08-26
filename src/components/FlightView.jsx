import { useEffect, useRef, useState } from "react";
import { playFlight } from "../utils/sounds.js";

export default function FlightView({ fuelEarned, skin = "classic", stars = 5, onDone }) {
  const canvasRef = useRef(null);
  const [phase, setPhase] = useState("flying"); // flying -> landed

  useEffect(() => {
    playFlight();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let raf = 0;
    let t = 0;
    const planeSkins = {
      classic: "✈️",
      rocket: "🚀",
      sea: "🛩️",
      jungle: "🛫",
      star: "🌟",
    };
    // stars positions
    const starDots = Array.from({ length: stars }, () => ({
      x: Math.random() * 600 + 200,
      y: 30 + Math.random() * 120,
      r: 4 + Math.random() * 6,
    }));
    const clouds = Array.from({ length: 5 }, (_, i) => ({
      x: i * 170 + 80,
      y: 60 + Math.random() * 40,
      s: 0.6 + Math.random() * 0.6,
    }));

    const w = (canvas.width = canvas.clientWidth * 2);
    const h = (canvas.height = 160 * 2);
    canvas.style.height = "160px";

    function frame() {
      t += 0.02;
      ctx.clearRect(0, 0, w, h);
      // sky gradient
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, "#38bdf8");
      grad.addColorStop(1, "#e0f2fe");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // clouds moving
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      clouds.forEach((c) => {
        c.x -= 0.9 + c.s;
        if (c.x < -100) c.x = w + 40;
        // puff
        ctx.beginPath();
        const cx = c.x, cy = c.y;
        ctx.ellipse(cx, cy, 42 * c.s, 18 * c.s, 0, 0, Math.PI * 2);
        ctx.ellipse(cx + 22 * c.s, cy + 5 * c.s, 28 * c.s, 14 * c.s, 0, 0, Math.PI * 2);
        ctx.ellipse(cx - 20 * c.s, cy + 6 * c.s, 24 * c.s, 12 * c.s, 0, 0, Math.PI * 2);
        ctx.fill();
      });

      // stars
      ctx.fillStyle = "#facc15";
      starDots.forEach((s) => {
        s.x -= 1.2;
        if (s.x < -20) s.x = w + 20;
        ctx.beginPath();
        ctx.arc(s.x, s.y + Math.sin(t * 2 + s.x * 0.01) * 4, s.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,0.6)";
        ctx.lineWidth = 2;
        ctx.stroke();
      });

      // plane bobbing
      const px = 160 + Math.sin(t * 0.6) * 8;
      const py = 80 + Math.sin(t * 1.8) * 6;
      // shadow
      ctx.fillStyle = "rgba(0,0,0,0.08)";
      ctx.beginPath();
      ctx.ellipse(px + 10, 120, 40, 8, 0, 0, Math.PI * 2);
      ctx.fill();

      // plane emoji rendered via text (fallback to triangle)
      ctx.font = `${44 * 2}px serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      // tilt
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(Math.sin(t) * 0.08);
      ctx.fillText(planeSkins[skin] || "✈️", 0, 0);
      ctx.restore();

      // contrail
      ctx.strokeStyle = "rgba(255,255,255,0.6)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(px - 26, py + 2);
      ctx.lineTo(px - 60 - Math.sin(t * 3) * 6, py + 2);
      ctx.stroke();

      raf = requestAnimationFrame(frame);
    }
    frame();
    const timer = setTimeout(() => setPhase("landed"), 3800);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
  }, [skin, stars]);

  return (
    <div className="w-full rounded-2xl overflow-hidden border-4 border-sky-300 shadow-lg bg-sky-50">
      <div className="bg-gradient-to-r from-sky-600 to-indigo-600 text-white px-4 py-2 flex items-center justify-between">
        <span className="font-black tracking-wide">✈️ FLIGHT TIME!</span>
        <span className="text-sm bg-white/20 px-3 py-1 rounded-full">+{fuelEarned} fuel used → stars!</span>
      </div>
      <canvas ref={canvasRef} className="w-full block" />
      <div className="bg-white p-4 text-center">
        {phase === "flying" ? (
          <p className="text-sky-700 font-bold animate-pulse">Soaring through the sky...</p>
        ) : (
          <div>
            <p className="text-xl font-black text-emerald-600">✨ Amazing flight! ✨</p>
            <p className="text-slate-600 text-sm mt-1">You collected {stars} stars!</p>
            <button
              onClick={onDone}
              className="mt-4 bg-emerald-500 hover:bg-emerald-400 text-white font-black px-8 py-3 rounded-full shadow-lg text-lg transition"
            >
              Continue →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
