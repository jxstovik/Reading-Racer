import { useEffect, useRef, useState } from "react";
import { playFlight, playTone } from "../utils/sounds.js";
import { getFlightDurationSeconds } from "../utils/storage.js";

const SKIN_EMOJI = {
  classic: "✈️",
  rocket: "🚀",
  sea: "🛩️",
  jungle: "🛫",
  star: "🌟",
};

export default function FlightView({
  level = 1,
  durationSeconds,
  fuelEarned,
  skin = "classic",
  onDone,
}) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [phase, setPhase] = useState("flying"); // flying | landed
  const [stats, setStats] = useState({ ringsCollected: 0, totalRings: 0, timeLeft: 0 });
  const [showHint, setShowHint] = useState(true);

  // derive duration: if explicit given use it; else from level (30 / 40 / 50)
  const duration = durationSeconds ?? getFlightDurationSeconds(level);

  // refs for mutable game state (avoid React re-render thrash)
  const gameRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Hide hint after 4s
    const hintTimer = setTimeout(() => setShowHint(false), 4200);

    playFlight();

    const dpr = window.devicePixelRatio || 1;
    const logicalW = 720; // fixed logical width for consistent gameplay, rendered responsively via CSS
    const logicalH = 360;
    // physically size canvas for retina
    function resize() {
      const rect = canvas.parentElement?.getBoundingClientRect();
      const displayW = rect ? rect.width : logicalW;
      // keep aspect 2:1, height is logicalH scaled to displayW
      const displayH = (displayW * logicalH) / logicalW;
      canvas.style.width = `${displayW}px`;
      canvas.style.height = `${displayH}px`;
      canvas.width = displayW * dpr;
      canvas.height = displayH * dpr;
      // we will scale ctx to logical coords
      // logical coords mapping: scale so logicalW maps to displayW
      // So we scale by (displayW / logicalW) * dpr? Easier: just scale ctx to map logicalW/H to canvas physical
      // We'll set transform to map [0,logicalW] x [0,logicalH] -> canvas physical
      ctx.setTransform((displayW * dpr) / logicalW, 0, 0, (displayH * dpr) / logicalH, 0, 0);
    }
    resize();
    window.addEventListener("resize", resize);

    // Game state
    const state = {
      elapsed: 0,
      rings: [], // { x, y, collected, passed, pulse }
      spawnAccum: 0,
      ringsCollected: 0,
      totalSpawned: 0,
      clouds: Array.from({ length: 6 }, (_, i) => ({
        x: i * 140 + Math.random() * 80,
        y: 30 + Math.random() * 70,
        s: 0.7 + Math.random() * 0.6,
        speed: 22 + Math.random() * 12,
      })),
      // plane
      planeX: 120,
      planeY: logicalH / 2,
      targetY: logicalH / 2,
      velocity: 0,
      // input
      upHeld: false,
      downHeld: false,
      pointerHeld: false,
      ended: false,
    };
    gameRef.current = state;

    const speedByLevel = { 1: 135, 2: 165, 3: 195 };
    const ringSpeed = speedByLevel[level] ?? 135;
    const spawnInterval = level === 3 ? 1.15 : level === 2 ? 1.4 : 1.65;
    const holeRadius = level === 3 ? 46 : level === 2 ? 50 : 56; // generous, slightly smaller at higher level but still big
    const ringOuter = 34;
    const collectDistX = 36;

    let raf = 0;
    let last = performance.now();
    let t = 0;

    // input handlers
    const keyDown = (e) => {
      if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") state.upHeld = true;
      if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") state.downHeld = true;
    };
    const keyUp = (e) => {
      if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") state.upHeld = false;
      if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") state.downHeld = false;
    };
    window.addEventListener("keydown", keyDown);
    window.addEventListener("keyup", keyUp);

    // pointer (touch/mouse) on canvas -> set targetY directly
    function canvasToLogicalY(clientY) {
      const rect = canvas.getBoundingClientRect();
      const rel = (clientY - rect.top) / rect.height; // 0..1
      return rel * logicalH;
    }
    const onPointerDown = (e) => {
      state.pointerHeld = true;
      const y = canvasToLogicalY(e.touches ? e.touches[0].clientY : e.clientY);
      state.targetY = clamp(y, 28, logicalH - 28);
      e.preventDefault();
    };
    const onPointerMove = (e) => {
      if (!state.pointerHeld) return;
      const y = canvasToLogicalY(e.touches ? e.touches[0].clientY : e.clientY);
      state.targetY = clamp(y, 28, logicalH - 28);
      e.preventDefault();
    };
    const onPointerUp = () => {
      state.pointerHeld = false;
    };
    canvas.addEventListener("touchstart", onPointerDown, { passive: false });
    canvas.addEventListener("touchmove", onPointerMove, { passive: false });
    window.addEventListener("touchend", onPointerUp);
    canvas.addEventListener("mousedown", onPointerDown);
    window.addEventListener("mousemove", onPointerMove);
    window.addEventListener("mouseup", onPointerUp);



    function clamp(v, a, b) {
      return Math.max(a, Math.min(b, v));
    }

    function spawnRing() {
      // y with some variation, but keep within bounds and avoid spawning too close to previous
      const lastY = state.rings.length ? state.rings[state.rings.length - 1].y : logicalH / 2;
      let y;
      let tries = 0;
      do {
        y = 60 + Math.random() * (logicalH - 120);
        tries++;
      } while (Math.abs(y - lastY) < 45 && tries < 6);
      state.rings.push({ x: logicalW + 40, y, collected: false, passed: false, pulse: 0, outer: ringOuter });
      state.totalSpawned++;
    }

    // spawn first ring quickly
    spawnRing();
    state.spawnAccum = 0.4;

    function frame(now) {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (state.ended) return;
      t += dt;
      state.elapsed += dt;

      // spawn
      state.spawnAccum += dt;
      if (state.spawnAccum >= spawnInterval) {
        state.spawnAccum = 0;
        spawnRing();
      }

      // plane movement
      if (!state.pointerHeld) {
        if (state.upHeld) state.targetY -= 240 * dt;
        if (state.downHeld) state.targetY += 240 * dt;
      }
      state.targetY = clamp(state.targetY, 30, logicalH - 30);
      // smooth lerp towards target
      const dy = state.targetY - state.planeY;
      state.velocity = dy * 0.18; // simple PD
      // also add sine bob when not inputting
      const bob = (!state.upHeld && !state.downHeld && !state.pointerHeld) ? Math.sin(t * 2.1) * 8 * dt * 60 : 0;
      state.planeY += state.velocity * 60 * dt + bob * dt * 2;
      // clamp
      state.planeY = clamp(state.planeY, 22, logicalH - 22);

      // move rings
      for (const r of state.rings) {
        r.x -= ringSpeed * dt;
        if (r.collected) r.pulse += dt * 8;
      }
      // cull off-screen
      while (state.rings.length && state.rings[0].x < -80) state.rings.shift();

      // collision / collection
      for (const r of state.rings) {
        if (r.collected || r.passed) continue;
        const dx = Math.abs(r.x - state.planeX);
        if (dx < collectDistX) {
          const dyR = Math.abs(r.y - state.planeY);
          if (dyR < holeRadius - 8) {
            r.collected = true;
            state.ringsCollected++;
            // chime, pitch rises with level slightly
            const base = 520 + level * 30 + (state.ringsCollected % 8) * 40;
            playTone(base, 0.14, "sine", 0.16);
            setTimeout(() => playTone(base * 1.5, 0.1, "sine", 0.11), 70);
          } else if (r.x < state.planeX - 10) {
            // passed without collecting
            // no penalty, just mark passed for subtle fade
            // we keep ring visible but desaturate
          }
        }
        if (r.x < state.planeX - 30 && !r.collected) {
          r.passed = true;
        }
      }

      // update derived UI stats throttled (every 100ms)
      if (Math.floor(state.elapsed * 10) % 2 === 0) {
        const left = Math.max(0, duration - state.elapsed);
        setStats({ ringsCollected: state.ringsCollected, totalRings: state.totalSpawned, timeLeft: left });
      }

      // end condition
      if (state.elapsed >= duration) {
        state.ended = true;
        setStats({ ringsCollected: state.ringsCollected, totalRings: state.totalSpawned, timeLeft: 0 });
        setPhase("landed");
        return;
      }

      // ---- DRAW ----
      // sky gradient
      const grad = ctx.createLinearGradient(0, 0, 0, logicalH);
      grad.addColorStop(0, level === 3 ? "#0ea5e9" : "#38bdf8");
      grad.addColorStop(0.55, "#7dd3fc");
      grad.addColorStop(1, "#e0f2fe");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, logicalW, logicalH);

      // distant hills / ground line
      ctx.fillStyle = level === 3 ? "rgba(148,163,184,0.22)" : "rgba(16,185,129,0.14)";
      ctx.beginPath();
      ctx.moveTo(0, logicalH - 28);
      for (let x = 0; x <= logicalW; x += 18) {
        const y = logicalH - 28 + Math.sin(x * 0.012 + t * 0.45) * 6;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(logicalW, logicalH);
      ctx.lineTo(0, logicalH);
      ctx.closePath();
      ctx.fill();

      // clouds
      ctx.fillStyle = "rgba(255,255,255,0.92)";
      for (const c of state.clouds) {
        c.x -= c.speed * dt;
        if (c.x < -90) c.x = logicalW + 60 + Math.random() * 30;
        const cx = c.x, cy = c.y;
        ctx.beginPath();
        ctx.ellipse(cx, cy, 44 * c.s, 18 * c.s, 0, 0, Math.PI * 2);
        ctx.ellipse(cx + 24 * c.s, cy + 5 * c.s, 30 * c.s, 14 * c.s, 0, 0, Math.PI * 2);
        ctx.ellipse(cx - 22 * c.s, cy + 6 * c.s, 26 * c.s, 12 * c.s, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // rings
      for (const r of state.rings) {
        ctx.save();
        ctx.translate(r.x, r.y);
        if (r.collected) {
          // pop animation: scale up and fade
          const s = 1 + r.pulse * 0.14;
          const alpha = Math.max(0, 1 - r.pulse * 0.28);
          ctx.globalAlpha = alpha;
          ctx.scale(s, s);
          ctx.fillStyle = "#facc15";
          ctx.beginPath();
          ctx.arc(0, 0, 10, 0, Math.PI * 2);
          ctx.fill();
          // sparkle
          ctx.strokeStyle = `rgba(250,204,21,${alpha})`;
          ctx.lineWidth = 2;
          for (let a = 0; a < 6; a++) {
            const ang = (a / 6) * Math.PI * 2 + r.pulse;
            ctx.beginPath();
            ctx.moveTo(Math.cos(ang) * 16, Math.sin(ang) * 16);
            ctx.lineTo(Math.cos(ang) * 22, Math.sin(ang) * 22);
            ctx.stroke();
          }
        } else {
          const isMissed = r.passed;
          // outer ring
          const glowAlpha = isMissed ? 0.35 : 0.95;
          // shadow
          ctx.fillStyle = "rgba(0,0,0,0.08)";
          ctx.beginPath();
          ctx.ellipse(4, 4, ringOuter + 9, ringOuter + 9, 0, 0, Math.PI * 2);
          ctx.fill();
          // outer torus
          ctx.globalAlpha = glowAlpha;
          ctx.fillStyle = isMissed ? "#94a3b8" : "#f59e0b";
          ctx.beginPath();
          ctx.arc(0, 0, ringOuter + 8, 0, Math.PI * 2);
          ctx.arc(0, 0, ringOuter - 7, 0, Math.PI * 2, true);
          ctx.fill("evenodd");
          // inner highlight
          ctx.strokeStyle = isMissed ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.92)";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(0, 0, ringOuter + 1, 0, Math.PI * 2);
          ctx.stroke();
          // hole guide: faint inner circle
          ctx.globalAlpha = isMissed ? 0.12 : 0.22;
          ctx.strokeStyle = "#fff";
          ctx.lineWidth = 1.4;
          ctx.setLineDash([6, 6]);
          ctx.beginPath();
          ctx.arc(0, 0, holeRadius, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
          // center star
          if (!isMissed) {
            ctx.globalAlpha = 1;
            ctx.fillStyle = "#facc15";
            ctx.font = "22px serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            // gentle spin
            ctx.save();
            ctx.rotate(t * 1.2);
            ctx.fillText("⭐", 0, 1);
            ctx.restore();
          }
        }
        ctx.restore();
      }

      // plane shadow on ground
      ctx.fillStyle = "rgba(0,0,0,0.07)";
      ctx.beginPath();
      ctx.ellipse(state.planeX + 10, logicalH - 24, 38, 7, 0, 0, Math.PI * 2);
      ctx.fill();

      // plane
      const tilt = clamp(state.velocity * 0.18, -0.34, 0.34);
      ctx.save();
      ctx.translate(state.planeX, state.planeY);
      ctx.rotate(tilt);
      // contrail
      ctx.strokeStyle = "rgba(255,255,255,0.62)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-26, 2);
      ctx.lineTo(-58 - Math.sin(t * 8) * 4, 2);
      ctx.stroke();
      // engine puff
      ctx.fillStyle = "rgba(254,240,138,0.9)";
      ctx.beginPath();
      ctx.ellipse(-30, 2, 7 + Math.sin(t * 20) * 1.2, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      // plane emoji
      ctx.font = "44px serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(SKIN_EMOJI[skin] || "✈️", 0, 1);
      ctx.restore();

      // plane highlight ring for hitbox debug? hidden

      // vignette border inner
      ctx.strokeStyle = "rgba(255,255,255,0.35)";
      ctx.lineWidth = 2;
      ctx.strokeRect(1, 1, logicalW - 2, logicalH - 2);

      // progress bar is React overlay, but draw subtle tick? we render React HUD

      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("keydown", keyDown);
      window.removeEventListener("keyup", keyUp);
      canvas.removeEventListener("touchstart", onPointerDown);
      canvas.removeEventListener("touchmove", onPointerMove);
      window.removeEventListener("touchend", onPointerUp);
      canvas.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("mousemove", onPointerMove);
      window.removeEventListener("mouseup", onPointerUp);
      cancelAnimationFrame(raf);
      clearTimeout(hintTimer);
    };
  }, [level, duration, skin]);

  // button hold handlers
  const holdUp = (v) => {
    if (!gameRef.current) return;
    gameRef.current.upHeld = v;
  };
  const holdDown = (v) => {
    if (!gameRef.current) return;
    gameRef.current.downHeld = v;
  };

  const pct = Math.min(100, Math.round(((duration - stats.timeLeft) / duration) * 100));
  const displayFuel = fuelEarned ?? null;

  return (
    <div ref={containerRef} className="w-full rounded-2xl overflow-hidden border-4 border-sky-300 shadow-lg bg-sky-50 select-none">
      <div className="bg-gradient-to-r from-sky-600 to-indigo-600 text-white px-3 py-2 flex items-center justify-between gap-2">
        <span className="font-black tracking-wide text-sm sm:text-base">✈️ FLIGHT TIME!</span>
        <div className="flex items-center gap-2 text-xs">
          <span className="bg-white/20 px-2 py-1 rounded-full font-bold">
            Level {level} • {Math.round(duration)}s
          </span>
          {displayFuel != null && <span className="hidden sm:inline bg-amber-400 text-amber-900 px-2 py-1 rounded-full font-black">-{displayFuel} fuel</span>}
        </div>
      </div>

      {/* HUD */}
      <div className="bg-white/90 backdrop-blur px-3 py-2 flex items-center justify-between text-xs font-bold border-b">
        <div className="flex items-center gap-3">
          <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full">⭐ {stats.ringsCollected} / {stats.totalRings || "—"}</span>
          <span className="text-sky-700 hidden sm:inline">Rings</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-600 tabular-nums">{Math.ceil(stats.timeLeft || duration)}s left</span>
          <div className="w-20 sm:w-28 h-2.5 bg-slate-100 rounded-full overflow-hidden border">
            <div className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>

      <div className="relative bg-sky-200">
        <canvas ref={canvasRef} className="w-full block touch-none" style={{ aspectRatio: "720 / 360" }} />

        {/* controls hint */}
        {showHint && phase === "flying" && (
          <div className="absolute inset-x-0 top-3 flex justify-center pointer-events-none">
            <span className="bg-slate-900/80 text-white text-[11px] sm:text-xs font-bold px-3 py-1.5 rounded-full">
              ↑ ↓ Drag, Arrow keys, or hold buttons to steer through rings
            </span>
          </div>
        )}

        {/* On-screen up/down buttons - big for kids */}
        {phase === "flying" && (
          <>
            <div className="absolute left-2 top-1/2 -translate-y-1/2 flex flex-col gap-3">
              <button
                onTouchStart={() => holdUp(true)}
                onTouchEnd={() => holdUp(false)}
                onMouseDown={() => holdUp(true)}
                onMouseUp={() => holdUp(false)}
                onMouseLeave={() => holdUp(false)}
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/90 border-2 border-sky-300 shadow-lg flex items-center justify-center text-2xl active:bg-sky-50 active:scale-95 transition"
                aria-label="Up"
              >
                ▲
              </button>
              <button
                onTouchStart={() => holdDown(true)}
                onTouchEnd={() => holdDown(false)}
                onMouseDown={() => holdDown(true)}
                onMouseUp={() => holdDown(false)}
                onMouseLeave={() => holdDown(false)}
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/90 border-2 border-sky-300 shadow-lg flex items-center justify-center text-2xl active:bg-sky-50 active:scale-95 transition"
                aria-label="Down"
              >
                ▼
              </button>
            </div>
            <div className="absolute right-2 bottom-2 text-[10px] bg-white/80 px-2 py-1 rounded-full font-semibold text-slate-600 hidden sm:block">
              Drag on sky to steer
            </div>
          </>
        )}
      </div>

      <div className="bg-white p-4 text-center">
        {phase === "flying" ? (
          <p className="text-sky-700 font-bold text-sm">Fly through the glowing rings! ⭐</p>
        ) : (
          <div>
            <p className="text-xl font-black text-emerald-600">✨ Amazing flight! ✨</p>
            <p className="text-slate-700 text-sm mt-1">
              You collected <b className="text-amber-600">{stats.ringsCollected}</b> of {stats.totalRings} rings in {Math.round(duration)}s
              {level > 1 ? ` (Level ${level} — longer flight!)` : ""}!
            </p>
            <p className="text-xs text-slate-500 mt-1">Rings become stars for your hangar & map.</p>
            <button
              onClick={() => onDone?.({ ringsCollected: stats.ringsCollected, totalRings: stats.totalRings, duration, level })}
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
