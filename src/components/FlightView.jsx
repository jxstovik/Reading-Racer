import { useEffect, useRef, useState } from "react";
import { playFlight, playTone, playTryAgain } from "../utils/sounds.js";
import { getFlightDurationSeconds } from "../utils/storage.js";
import { AIRCRAFT, drawTopDownAircraft } from "../utils/aircraft.js";

export default function FlightView({
  level = 1,
  durationSeconds,
  fuelEarned,
  skin = "c172",
  onDone,
}) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [phase, setPhase] = useState("flying");
  const [stats, setStats] = useState({ ringsCollected: 0, totalRings: 0, timeLeft: 0, bumps: 0 });
  const [showHint, setShowHint] = useState(true);
  const duration = durationSeconds ?? getFlightDurationSeconds(level);
  // resolve aircraft: skin may be legacy keys; map already migrated but fallback to c172
  const aircraftId = AIRCRAFT[skin] ? skin : (skin === "classic" ? "c172" : "c172");
  const ac = AIRCRAFT[aircraftId] || AIRCRAFT.c172;
  const gameRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const hintTimer = setTimeout(() => setShowHint(false), 4200);
    playFlight();

    const dpr = window.devicePixelRatio || 1;
    const logicalW = 560;
    const logicalH = 720;
    // responsive sizing — keep portrait aspect, cap height via CSS
    function resize() {
      const parent = canvas.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      // use width-limited sizing: displayW = rect.width, displayH = rect.width * logicalH/logicalW
      // cap height to 560 on very wide screens via CSS max-height, but here just map
      const displayW = rect.width;
      const displayH = (displayW * logicalH) / logicalW;
      canvas.style.width = `${displayW}px`;
      canvas.style.height = `${displayH}px`;
      canvas.width = displayW * dpr;
      canvas.height = displayH * dpr;
      ctx.setTransform((displayW * dpr) / logicalW, 0, 0, (displayH * dpr) / logicalH, 0, 0);
    }
    resize();
    window.addEventListener("resize", resize);

    // World state
    const planeFixedY = logicalH - 86; // plane stays near bottom
    const state = {
      elapsed: 0,
      rings: [], // {x,y,collected,passed,pulse}
      mountains: [], // {x,y,r,shape}
      spawnRingAccum: 0,
      spawnMountAccum: 0,
      ringsCollected: 0,
      totalSpawned: 0,
      bumps: 0,
      bumpTime: 0,
      planeX: logicalW / 2,
      planeY: planeFixedY,
      angle: 0, // heading, 0 = up, positive right
      targetAngle: 0,
      velocityX: 0,
      leftHeld: false,
      rightHeld: false,
      pointerHeld: false,
      pointerX: logicalW / 2,
      ended: false,
      terrainOffset: 0,
    };
    gameRef.current = state;

    const forwardSpeed = ac.speed; // px/s in logical coords
    const lateralBase = 240; // base strafe when holding turn - scaled slightly with tier
    const lateralSpeed = lateralBase + (ac.tier - 1) * 18; // 240->330
    const maxTilt = 0.55; // rad visual roll (~31deg)
    const ringHole = 30; // collect radius for flat ring (top-down)
    const ringOuter = 26;
    const mountainBaseR = 24;

    // spawn spacing to guarantee max 2 rings on screen
    // interval = spacing / speed, spacing ~ 260 gives 2-3 visible at 720h
    const ringSpacing = 260;
    const mountainSpacing = 190;

    let raf = 0;
    let last = performance.now();
    let t = 0;

    // helpers
    function clamp(v,a,b){ return Math.max(a, Math.min(b,v)); }
    function wrappedDx(a,b) {
      const d = Math.abs(a-b);
      return Math.min(d, logicalW - d);
    }
    function randomX(margin=44){
      return margin + Math.random() * (logicalW - margin*2);
    }
    function spawnRing() {
      // keep max 2 visible - called only when visible count <2
      let x;
      // avoid mountain overlap: try a few times
      let tries=0;
      do {
        x = randomX(48);
        tries++;
      } while (tries<6 && state.mountains.some(m => wrappedDx(m.x, x)< mountainBaseR + ringOuter + 12 && Math.abs(m.y - (-40)) < 60));
      state.rings.push({ x, y: -40, collected:false, passed:false, pulse:0 });
      state.totalSpawned++;
    }
    function spawnMountain() {
      // random cluster
      const x = randomX(50);
      const r = 18 + Math.random()*16;
      const y = -60 - Math.random()*30;
      // avoid spawning directly on ring center
      if (state.rings.some(rr => wrappedDx(rr.x, x) < r + ringOuter + 6 && Math.abs(rr.y - y) < 40)) {
        // nudge
        // skip this spawn occasionally
      }
      state.mountains.push({ x, y, r, rot: Math.random()*Math.PI, type: Math.random()<0.5?0:1 });
    }

    // prime with mountains ahead
    for(let i=0;i<3;i++){
      state.mountains.push({ x: randomX(40), y: 80 + i*180 + Math.random()*80, r: 16+Math.random()*14, rot: Math.random()*Math.PI, type: i%2 });
    }

    // input
    const keyDown = (e)=>{
      if(e.key==="ArrowLeft"|| e.key==="a"|| e.key==="A") state.leftHeld=true;
      if(e.key==="ArrowRight"|| e.key==="d"|| e.key==="D") state.rightHeld=true;
      // also support up/down as alias for left/right for legacy side-game kids
      if(e.key==="ArrowUp"||e.key==="w"||e.key==="W") state.leftHeld=true;
      if(e.key==="ArrowDown"||e.key==="s"||e.key==="S") state.rightHeld=true;
    };
    const keyUp = (e)=>{
      if(e.key==="ArrowLeft"|| e.key==="a"|| e.key==="A") state.leftHeld=false;
      if(e.key==="ArrowRight"|| e.key==="d"|| e.key==="D") state.rightHeld=false;
      if(e.key==="ArrowUp"||e.key==="w"||e.key==="W") state.leftHeld=false;
      if(e.key==="ArrowDown"||e.key==="s"||e.key==="S") state.rightHeld=false;
    };
    window.addEventListener("keydown", keyDown);
    window.addEventListener("keyup", keyUp);

    function canvasToX(clientX){
      const rect=canvas.getBoundingClientRect();
      return ((clientX - rect.left)/rect.width)*logicalW;
    }
    const onPointerDown=(e)=>{
      state.pointerHeld=true;
      const x = canvasToX(e.touches? e.touches[0].clientX : e.clientX);
      state.pointerX = clamp(x, 18, logicalW-18);
      e.preventDefault();
    };
    const onPointerMove=(e)=>{
      if(!state.pointerHeld) return;
      const x = canvasToX(e.touches? e.touches[0].clientX : e.clientX);
      state.pointerX = clamp(x, 18, logicalW-18);
      e.preventDefault();
    };
    const onPointerUp=()=>{ state.pointerHeld=false; };

    canvas.addEventListener("touchstart", onPointerDown, {passive:false});
    canvas.addEventListener("touchmove", onPointerMove, {passive:false});
    window.addEventListener("touchend", onPointerUp);
    canvas.addEventListener("mousedown", onPointerDown);
    window.addEventListener("mousemove", onPointerMove);
    window.addEventListener("mouseup", onPointerUp);

    function frame(now){
      const dt = Math.min(0.05, (now-last)/1000);
      last=now;
      if(state.ended) return;
      t+=dt;
      state.elapsed+=dt;
      state.terrainOffset = (state.terrainOffset + forwardSpeed * dt * 0.35) % 80;

      // spawn rings: ensure max 2 on screen
      const visibleRings = state.rings.filter(r=>!r.collected && r.y>=-40 && r.y <= logicalH+40).length;
      state.spawnRingAccum+=dt;
      const ringInterval = ringSpacing / forwardSpeed;
      if(visibleRings < 2 && state.spawnRingAccum >= ringInterval){
        state.spawnRingAccum=0;
        spawnRing();
      }
      // mountains spawn more liberally
      state.spawnMountAccum+=dt;
      const mountInterval = mountainSpacing / forwardSpeed * (0.85 + Math.random()*0.3);
      if(state.spawnMountAccum >= mountInterval){
        state.spawnMountAccum=0;
        // spawn 1-2 mountains
        spawnMountain();
        if(Math.random()<0.35) spawnMountain();
      }

      // plane lateral/heading control
      if(state.pointerHeld){
        const dx = state.pointerX - state.planeX;
        // choose shortest wrap direction
        let bestDx = dx;
        if(Math.abs(dx) > logicalW/2) bestDx = dx > 0 ? dx - logicalW : dx + logicalW;
        const step = clamp(bestDx, -lateralSpeed*dt*1.4, lateralSpeed*dt*1.4);
        state.planeX += step;
        state.targetAngle = clamp(bestDx * 0.008, -maxTilt, maxTilt);
      } else {
        if(state.leftHeld && !state.rightHeld) state.targetAngle = -maxTilt;
        else if(state.rightHeld && !state.leftHeld) state.targetAngle = maxTilt;
        else state.targetAngle = 0;
        // apply turn
        const angleLerp = 5.5;
        state.angle += (state.targetAngle - state.angle) * angleLerp * dt;
        // translate angle to lateral velocity (sin)
        state.planeX += Math.sin(state.angle) * forwardSpeed * dt * 0.9;
        // also direct strafe for responsiveness when holding
        if(state.leftHeld) state.planeX -= lateralSpeed * dt * 0.55;
        if(state.rightHeld) state.planeX += lateralSpeed * dt * 0.55;
      }
      // wrap
      if(state.planeX < -16) state.planeX += logicalW + 32;
      if(state.planeX > logicalW+16) state.planeX -= logicalW + 32;
      // clamp angle for visual
      state.angle = clamp(state.angle, -maxTilt, maxTilt);

      // move world down (rings/mountains approach)
      for(const r of state.rings){
        r.y += forwardSpeed * dt;
        if(r.collected) r.pulse+= dt*7;
      }
      for(const m of state.mountains){
        m.y += forwardSpeed * dt * 0.98; // slightly slower parallax
        m.rot += dt*0.15;
      }
      // cull off-screen bottom
      while(state.rings.length && state.rings[0].y > logicalH+80) state.rings.shift();
      while(state.mountains.length && state.mountains[0].y > logicalH+80) state.mountains.shift();

      // collisions - rings
      for(const r of state.rings){
        if(r.collected || r.passed) continue;
        const dy = Math.abs(r.y - state.planeY);
        if(dy < 22){
          const dx = wrappedDx(r.x, state.planeX);
          if(dx < ringHole){
            r.collected=true;
            state.ringsCollected++;
            const base = 520 + level*28 + (state.ringsCollected%7)*38;
            playTone(base, 0.13, "sine", 0.16);
            setTimeout(()=> playTone(base*1.52, 0.09, "sine", 0.11), 65);
          }
        }
        if(r.y > state.planeY + 26 && !r.collected) r.passed=true;
      }
      // mountains - gentle bump
      for(const m of state.mountains){
        const dy = Math.abs(m.y - state.planeY);
        if(dy < 26){
          const dx = wrappedDx(m.x, state.planeX);
          if(dx < m.r + 12){
            // bump cooldown 0.7s
            if(now - state.bumpTime > 700){
              state.bumpTime = now;
              state.bumps++;
              // nudge plane away
              const dir = (state.planeX - m.x);
              // choose shortest wrap direction sign
              let push = dir;
              if(Math.abs(dir) > logicalW/2) push = -push;
              state.planeX += Math.sign(push||1) * 18;
              // flash
              playTryAgain();
              // slight screen shake via bumpTime used in draw
            }
          }
        }
      }

      // UI throttle
      if(Math.floor(state.elapsed*10)%2===0){
        const left = Math.max(0, duration - state.elapsed);
        setStats({ ringsCollected: state.ringsCollected, totalRings: state.totalSpawned, timeLeft:left, bumps: state.bumps });
      }
      if(state.elapsed >= duration){
        state.ended=true;
        setStats({ ringsCollected: state.ringsCollected, totalRings: state.totalSpawned, timeLeft:0, bumps: state.bumps });
        setPhase("landed");
        return;
      }

      // ---- DRAW ----
      // terrain
      ctx.fillStyle = "#bbf7d0";
      ctx.fillRect(0,0,logicalW,logicalH);
      // tiled field pattern scrolling
      const tile = 80;
      ctx.strokeStyle = "rgba(16,185,129,0.22)";
      ctx.lineWidth = 1;
      for(let y = -tile + (state.terrainOffset % tile); y < logicalH; y+= tile){
        ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(logicalW,y); ctx.stroke();
      }
      for(let x=0;x<logicalW;x+= tile){
        ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,logicalH); ctx.stroke();
      }
      // subtle green variation blobs
      ctx.fillStyle = "rgba(52,211,153,0.18)";
      for(let i=0;i<6;i++){
        const bx = (i*137 + state.terrainOffset*0.5) % logicalW;
        const by = (i*91 + state.terrainOffset) % logicalH;
        ctx.beginPath(); ctx.ellipse(bx, by, 44, 22, 0,0,Math.PI*2); ctx.fill();
      }
      // side walls wrap indicators - dashed lines
      ctx.strokeStyle = "rgba(14,165,233,0.35)";
      ctx.setLineDash([10,10]);
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(1,0); ctx.lineTo(1,logicalH); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(logicalW-1,0); ctx.lineTo(logicalW-1,logicalH); ctx.stroke();
      ctx.setLineDash([]);
      // draw mountains
      for(const m of state.mountains){
        ctx.save();
        ctx.translate(m.x, m.y);
        // also draw wrapped duplicate if near edge for seamless visual
        const draws = [{dx:0}];
        if(m.x < 36) draws.push({dx: logicalW});
        if(m.x > logicalW-36) draws.push({dx: -logicalW});
        for(const d of draws){
          ctx.save(); ctx.translate(d.dx, 0);
          // shadow
          ctx.fillStyle = "rgba(0,0,0,0.09)";
          ctx.beginPath(); ctx.ellipse(3,6, m.r*0.9, m.r*0.46, 0,0,Math.PI*2); ctx.fill();
          // base rock
          ctx.fillStyle = m.type===0 ? "#78716c" : "#57534e";
          ctx.beginPath();
          // top-down mountain as irregular polygon / circle with ridge
          ctx.ellipse(0,0, m.r, m.r*0.74, m.rot, 0, Math.PI*2); ctx.fill();
          ctx.fillStyle = "#a8a29e";
          ctx.beginPath(); ctx.ellipse(-m.r*0.18, -m.r*0.12, m.r*0.55, m.r*0.42, m.rot, 0, Math.PI*2); ctx.fill();
          // snow peak
          ctx.fillStyle = "#f8fafc";
          ctx.beginPath(); ctx.arc(0, -1, m.r*0.24, 0, Math.PI*2); ctx.fill();
          ctx.strokeStyle = "rgba(0,0,0,0.12)"; ctx.lineWidth=1; ctx.stroke();
          ctx.restore();
        }
        ctx.restore();
      }
      // draw rings (flat on ground)
      for(const r of state.rings){
        const draws = [{dx:0}];
        if(r.x < ringOuter+12) draws.push({dx: logicalW});
        if(r.x > logicalW - ringOuter-12) draws.push({dx: -logicalW});
        for(const d of draws){
          ctx.save();
          ctx.translate(r.x + d.dx, r.y);
          if(r.collected){
            const s = 1 + r.pulse*0.16;
            const alpha = Math.max(0, 1 - r.pulse*0.26);
            ctx.globalAlpha = alpha;
            ctx.scale(s,s);
            ctx.fillStyle = "#facc15";
            ctx.beginPath(); ctx.arc(0,0, 9, 0, Math.PI*2); ctx.fill();
            ctx.strokeStyle = `rgba(250,204,21,${alpha})`;
            ctx.lineWidth=2;
            for(let a=0;a<5;a++){
              const ang = a/5*Math.PI*2 + r.pulse*2;
              ctx.beginPath(); ctx.moveTo(Math.cos(ang)*14, Math.sin(ang)*14); ctx.lineTo(Math.cos(ang)*19, Math.sin(ang)*19); ctx.stroke();
            }
          } else {
            const isMissed = r.passed;
            const alpha = isMissed?0.33:0.96;
            ctx.globalAlpha = alpha;
            // shadow
            ctx.fillStyle="rgba(0,0,0,0.08)";
            ctx.beginPath(); ctx.ellipse(2,2, ringOuter+7, ringOuter+7, 0,0,Math.PI*2); ctx.fill();
            // flat ring donut
            ctx.fillStyle = isMissed ? "#94a3b8" : "#f59e0b";
            ctx.beginPath();
            ctx.arc(0,0, ringOuter+7, 0, Math.PI*2);
            ctx.arc(0,0, ringOuter-6, 0, Math.PI*2, true);
            ctx.fill("evenodd");
            ctx.strokeStyle = isMissed? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.9)";
            ctx.lineWidth=2.2;
            ctx.beginPath(); ctx.arc(0,0, ringOuter+1, 0, Math.PI*2); ctx.stroke();
            // hole dashed guide (for top-down, inner circle is target)
            ctx.globalAlpha = isMissed?0.12:0.22;
            ctx.setLineDash([6,6]);
            ctx.strokeStyle="#fff"; ctx.lineWidth=1.2;
            ctx.beginPath(); ctx.arc(0,0, ringHole,0,Math.PI*2); ctx.stroke();
            ctx.setLineDash([]);
            if(!isMissed){
              ctx.globalAlpha=1;
              ctx.fillStyle="#facc15";
              ctx.font="18px serif";
              ctx.textAlign="center";
              ctx.textBaseline="middle";
              ctx.save(); ctx.rotate(t*1.6); ctx.fillText("⭐",0,1); ctx.restore();
            }
          }
          ctx.restore();
        }
      }
      // shake on bump
      let shakeX=0, shakeY=0;
      if(now - state.bumpTime < 280){
        shakeX = (Math.random()-0.5)*6;
        shakeY = (Math.random()-0.5)*6;
      }
      // plane
      ctx.save();
      // account for shake
      ctx.translate(shakeX, shakeY);
      // draw plane and its wrap duplicate when near edge
      const planeDraws = [{x: state.planeX}];
      if(state.planeX < 28) planeDraws.push({x: state.planeX + logicalW});
      if(state.planeX > logicalW-28) planeDraws.push({x: state.planeX - logicalW});
      for(const pd of planeDraws){
        ctx.save();
        ctx.translate(pd.x, state.planeY);
        // heading tilt visual (roll) - slight yaw from angle
        const roll = state.angle * 0.9;
        // draw aircraft top-down with thrust flame behind (opposite forward)
        // thrust flame behind (south)
        ctx.fillStyle = state.bumpTime && now - state.bumpTime < 200 ? "rgba(248,113,113,0.9)" : "rgba(251,146,60,0.0)";
        if(state.bumpTime && now - state.bumpTime < 200){
          ctx.beginPath(); ctx.ellipse(0, 18, 6, 4, 0,0,Math.PI*2); ctx.fill();
        }
        // speed lines behind when fast
        if(ac.tier >=3){
          ctx.strokeStyle="rgba(255,255,255,0.55)";
          ctx.lineWidth=2;
          ctx.beginPath();
          ctx.moveTo(-4, 16); ctx.lineTo(-6, 24 + Math.sin(t*18)*2);
          ctx.moveTo(4, 16); ctx.lineTo(6, 24 + Math.sin(t*18+1)*2);
          ctx.stroke();
        }
        drawTopDownAircraft(ctx, aircraftId, { scale: 1.15, tilt: roll, thrust: 0.6 });
        // highlight hit radius for kids? faint
        // ctx.strokeStyle="rgba(14,165,233,0.18)"; ctx.beginPath(); ctx.arc(0,0,14,0,Math.PI*2); ctx.stroke();
        ctx.restore();
      }
      ctx.restore();

      // edge warp arrows hint
      ctx.fillStyle="rgba(255,255,255,0.9)";
      ctx.font="11px sans-serif";
      ctx.textAlign="center";
      ctx.fillText("◀ wrap", 34, 18);
      ctx.fillText("wrap ▶", logicalW-34, 18);

      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    return ()=>{
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
  }, [level, duration, aircraftId, ac.speed, ac.tier]);

  const pct = Math.min(100, Math.round(((duration - stats.timeLeft)/duration)*100));
  const displayFuel = fuelEarned ?? null;
  return (
    <div ref={containerRef} className="w-full rounded-2xl overflow-hidden border-4 border-sky-300 shadow-lg bg-sky-50 select-none">
      <div className="bg-gradient-to-r from-sky-600 to-indigo-600 text-white px-3 py-2 flex items-center justify-between gap-2">
        <span className="font-black tracking-wide text-sm sm:text-base">🗺️ FLIGHT MAP</span>
        <div className="flex items-center gap-1.5 text-xs flex-wrap justify-end">
          <span className="bg-white/20 px-2 py-1 rounded-full font-bold">{AIRCRAFT[aircraftId]?.name || aircraftId} • {ac.speed} kts</span>
          <span className="bg-white/20 px-2 py-1 rounded-full font-bold">Level {level} • {Math.round(duration)}s</span>
          {displayFuel!=null && <span className="hidden sm:inline bg-amber-400 text-amber-900 px-2 py-1 rounded-full font-black">-{displayFuel} fuel</span>}
        </div>
      </div>
      <div className="bg-white/90 backdrop-blur px-3 py-2 flex items-center justify-between text-xs font-bold border-b">
        <div className="flex items-center gap-2">
          <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full">⭐ {stats.ringsCollected} / {stats.totalRings || "—"}</span>
          <span className="hidden sm:inline text-sky-700">Rings (max 2 on screen)</span>
          <span className="sm:hidden text-sky-700">Rings</span>
          {stats.bumps>0 && <span className="bg-rose-100 text-rose-700 px-2 py-1 rounded-full">⛰️ {stats.bumps} bumps</span>}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-600 tabular-nums">{Math.ceil(stats.timeLeft||duration)}s left</span>
          <div className="w-20 sm:w-28 h-2.5 bg-slate-100 rounded-full overflow-hidden border">
            <div className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 transition-all" style={{width:`${pct}%`}}/>
          </div>
        </div>
      </div>
      <div className="relative bg-emerald-100">
        <canvas ref={canvasRef} className="w-full block touch-none" style={{ aspectRatio: "560 / 720", maxHeight: "560px" }} />
        {showHint && phase==="flying" && (
          <div className="absolute inset-x-0 top-3 flex justify-center pointer-events-none">
            <span className="bg-slate-900/80 text-white text-[11px] sm:text-xs font-bold px-3 py-1.5 rounded-full text-center leading-tight">
              ◀ ▶ Turn left/right — edges wrap like Pac-Man! Fly through rings, avoid ⛰️
            </span>
          </div>
        )}
        {phase==="flying" && (
          <>
            <div className="absolute left-2 bottom-3 flex gap-2">
              <button
                onTouchStart={(e)=>{ e.preventDefault(); if (gameRef.current) gameRef.current.leftHeld=true; }}
                onTouchEnd={(e)=>{ e.preventDefault(); if(gameRef.current) gameRef.current.leftHeld=false; }}
                onMouseDown={()=> { if (gameRef.current) gameRef.current.leftHeld=true; }}
                onMouseUp={()=> { if (gameRef.current) gameRef.current.leftHeld=false; }}
                onMouseLeave={()=> { if (gameRef.current) gameRef.current.leftHeld=false; }}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/95 border-2 border-sky-300 shadow-xl flex items-center justify-center text-2xl active:bg-sky-50 active:scale-95 transition select-none"
                aria-label="Turn left"
              >
                ◀
              </button>
              <button
                onTouchStart={(e)=>{ e.preventDefault(); if (gameRef.current) gameRef.current.rightHeld=true; }}
                onTouchEnd={(e)=>{ e.preventDefault(); if(gameRef.current) gameRef.current.rightHeld=false; }}
                onMouseDown={()=> { if (gameRef.current) gameRef.current.rightHeld=true; }}
                onMouseUp={()=> { if (gameRef.current) gameRef.current.rightHeld=false; }}
                onMouseLeave={()=> { if (gameRef.current) gameRef.current.rightHeld=false; }}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/95 border-2 border-sky-300 shadow-xl flex items-center justify-center text-2xl active:bg-sky-50 active:scale-95 transition select-none"
                aria-label="Turn right"
              >
                ▶
              </button>
            </div>
            <div className="absolute right-2 bottom-2 text-[10px] bg-white/85 px-2 py-1 rounded-full font-semibold text-slate-600 hidden sm:block">
              Drag on map to steer • A/D or ◀▶
            </div>
          </>
        )}
      </div>
      <div className="bg-white p-4 text-center">
        {phase==="flying" ? (
          <p className="text-sky-700 font-bold text-sm">Overhead map — 2 rings at a time! Steer, wrap edges, collect ⭐</p>
        ) : (
          <div>
            <p className="text-xl font-black text-emerald-600">✨ Amazing flight! ✨</p>
            <p className="text-slate-700 text-sm mt-1">
              You collected <b className="text-amber-600">{stats.ringsCollected}</b> of {stats.totalRings} rings in {Math.round(duration)}s — {AIRCRAFT[aircraftId]?.name} at {ac.speed} kts
              {stats.bumps>0 ? ` • bumped ${stats.bumps} mountain${stats.bumps>1?"s":""}` : ""}!
            </p>
            <p className="text-xs text-slate-500 mt-1">Rings become stars. Faster aircraft unlock as you read more!</p>
            <button
              onClick={()=> onDone?.({ ringsCollected: stats.ringsCollected, totalRings: stats.totalRings, duration, level, aircraftId, bumps: stats.bumps })}
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
