export const AIRCRAFT = {
  c172: { id: "c172", name: "Cessna 172", tier: 1, speed: 125, turnRate: 3.2, color: ["#38bdf8","#0ea5e9"], desc: "Trainer — steady", unlock: "Start" },
  b737: { id: "b737", name: "Boeing 737", tier: 2, speed: 155, turnRate: 3.0, color: ["#cbd5e1","#475569"], desc: "Airliner — smooth", unlock: "2 stories or 5 flights" },
  f16:  { id: "f16",  name: "F-16 Falcon", tier: 3, speed: 190, turnRate: 3.4, color: ["#a1a1aa","#3f3f46"], desc: "Nimble fighter", unlock: "4 stories or 10 flights" },
  f22:  { id: "f22",  name: "F-22 Raptor", tier: 4, speed: 230, turnRate: 3.6, color: ["#71717a","#27272a"], desc: "Stealth speed", unlock: "6 stories or 18 flights" },
  sr71: { id: "sr71", name: "SR-71 Blackbird", tier: 5, speed: 275, turnRate: 3.8, color: ["#1c1917","#000000"], desc: "Mach 3 legend", unlock: "9 stories or 28 flights" },
  xb70: { id: "xb70", name: "XB-70 Valkyrie", tier: 6, speed: 320, turnRate: 4.0, color: ["#fdba74","#9a3412"], desc: "Mach 3 bomber", unlock: "12 stories or 40 flights" },
};
export const AIRCRAFT_ORDER = ["c172","b737","f16","f22","sr71","xb70"];

// Draw top-down silhouette centered at (0,0) heading up (-Y). Scale controls size.
// ctx assumed already translated. Draws in local coords.
export function drawTopDownAircraft(ctx, id, { scale = 1, tilt = 0, thrust = 0 } = {}) {
  ctx.save();
  ctx.rotate(tilt);
  ctx.scale(scale, scale);
  // common shadow
  ctx.fillStyle = "rgba(0,0,0,0.12)";
  ctx.beginPath();
  ctx.ellipse(2, 6, 12, 5, 0, 0, Math.PI*2);
  ctx.fill();

  switch(id) {
    case "c172": drawC172(ctx, thrust); break;
    case "b737": drawB737(ctx, thrust); break;
    case "f16":  drawF16(ctx, thrust); break;
    case "f22":  drawF22(ctx, thrust); break;
    case "sr71": drawSR71(ctx, thrust); break;
    case "xb70": drawXB70(ctx, thrust); break;
    default: drawC172(ctx, thrust);
  }
  ctx.restore();
}

function drawC172(ctx, thrust) {
  // high-wing single prop, top-down: fuselage, wings, tail
  ctx.fillStyle = "#f8fafc";
  ctx.strokeStyle = "#0ea5e9";
  ctx.lineWidth = 1.4;
  // wings
  ctx.fillRect(-22, -4, 44, 8);
  ctx.strokeRect(-22, -4, 44, 8);
  // fuselage
  ctx.fillStyle = "#e0f2fe";
  roundRect(ctx, -5, -20, 10, 40, 5);
  ctx.fill(); ctx.stroke();
  // cockpit
  ctx.fillStyle = "#7dd3fc";
  ctx.fillRect(-4, -10, 8, 12);
  // tail
  ctx.fillStyle = "#f8fafc";
  ctx.beginPath();
  ctx.moveTo(-7, 16); ctx.lineTo(7,16); ctx.lineTo(4,22); ctx.lineTo(-4,22); ctx.closePath(); ctx.fill(); ctx.stroke();
  // prop blur
  if (thrust > 0) {
    ctx.fillStyle = "rgba(148,163,184,0.5)";
    ctx.fillRect(-10, -22, 20, 2);
  }
}

function drawB737(ctx) {
  ctx.fillStyle = "#f1f5f9";
  ctx.strokeStyle = "#475569";
  ctx.lineWidth = 1.5;
  // swept wings
  ctx.beginPath();
  ctx.moveTo(-28, 2); ctx.lineTo(-6, -4); ctx.lineTo(-6, 6); ctx.lineTo(-30, 10); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(28, 2); ctx.lineTo(6, -4); ctx.lineTo(6, 6); ctx.lineTo(30, 10); ctx.closePath(); ctx.fill(); ctx.stroke();
  // fuselage long
  roundRect(ctx, -6, -28, 12, 54, 6); ctx.fill(); ctx.stroke();
  // cockpit windows
  ctx.fillStyle = "#38bdf8";
  ctx.fillRect(-4, -24, 8, 4);
  // engines
  ctx.fillStyle = "#334155"; ctx.beginPath(); ctx.ellipse(-14, 2, 6, 7, 0,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(14, 2, 6, 7, 0,0,Math.PI*2); ctx.fill();
  // tail
  ctx.fillStyle = "#e2e8f0";
  ctx.beginPath(); ctx.moveTo(-6, 22); ctx.lineTo(6,22); ctx.lineTo(3,30); ctx.lineTo(-3,30); ctx.closePath(); ctx.fill(); ctx.stroke();
}

function drawF16(ctx, thrust) {
  // delta-ish fighter
  ctx.fillStyle = "#d4d4d8";
  ctx.strokeStyle = "#52525b";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(0, -26); // nose
  ctx.lineTo(-5, -10); ctx.lineTo(-18, 4); ctx.lineTo(-10, 10);
  ctx.lineTo(-4, 6); ctx.lineTo(-4, 16); ctx.lineTo(4,16); ctx.lineTo(4,6); ctx.lineTo(10,10); ctx.lineTo(18,4); ctx.lineTo(5,-10);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = "#27272a"; ctx.beginPath(); ctx.ellipse(0, 8, 3, 5, 0,0,Math.PI*2); ctx.fill(); // canopy
  if (thrust>0) { ctx.fillStyle = "#fb923c"; ctx.beginPath(); ctx.moveTo(-3,16); ctx.lineTo(3,16); ctx.lineTo(0,22); ctx.closePath(); ctx.fill(); }
}

function drawF22(ctx, thrust) {
  ctx.fillStyle = "#a1a1aa";
  ctx.strokeStyle = "#27272a";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(0, -27); ctx.lineTo(-6, -12); ctx.lineTo(-20, 0); ctx.lineTo(-14, 8); ctx.lineTo(-6, 4); ctx.lineTo(-5, 14); ctx.lineTo(5,14); ctx.lineTo(6,4); ctx.lineTo(14,8); ctx.lineTo(20,0); ctx.lineTo(6,-12);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  // twin tails
  ctx.fillStyle = "#52525b"; ctx.beginPath(); ctx.moveTo(-6,10); ctx.lineTo(-9,18); ctx.lineTo(-5,18); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(6,10); ctx.lineTo(9,18); ctx.lineTo(5,18); ctx.closePath(); ctx.fill();
  ctx.fillStyle = "#18181b"; ctx.fillRect(-3, 6, 6, 7);
  if (thrust>0) { ctx.fillStyle = "#f97316"; ctx.beginPath(); ctx.arc(0,16,3,0,Math.PI*2); ctx.fill(); }
}

function drawSR71(ctx, thrust) {
  ctx.fillStyle = "#0a0a0a";
  ctx.strokeStyle = "#404040";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(0,-28); ctx.lineTo(-3,-10); ctx.lineTo(-16,6); ctx.lineTo(-12,12); ctx.lineTo(-4,8); ctx.lineTo(-4,18); ctx.lineTo(4,18); ctx.lineTo(4,8); ctx.lineTo(12,12); ctx.lineTo(16,6); ctx.lineTo(3,-10); ctx.closePath(); ctx.fill(); ctx.stroke();
  // chine
  ctx.strokeStyle = "#262626"; ctx.beginPath(); ctx.moveTo(-2,-20); ctx.lineTo(2,-20); ctx.stroke();
  if (thrust>0) { ctx.fillStyle = "#ef4444"; ctx.fillRect(-5,18,4,5); ctx.fillRect(1,18,4,5); }
}

function drawXB70(ctx, thrust) {
  ctx.fillStyle = "#fffbeb";
  ctx.strokeStyle = "#92400e";
  ctx.lineWidth = 1.4;
  // huge delta with canards
  ctx.beginPath();
  ctx.moveTo(0,-30); ctx.lineTo(-4,-14); ctx.lineTo(-22,8); ctx.lineTo(-18,14); ctx.lineTo(-6,10); ctx.lineTo(-5,20); ctx.lineTo(5,20); ctx.lineTo(6,10); ctx.lineTo(18,14); ctx.lineTo(22,8); ctx.lineTo(4,-14); ctx.closePath(); ctx.fill(); ctx.stroke();
  // canards
  ctx.beginPath(); ctx.moveTo(-6,-8); ctx.lineTo(-12,-2); ctx.lineTo(-8,2); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(6,-8); ctx.lineTo(12,-2); ctx.lineTo(8,2); ctx.closePath(); ctx.fill(); ctx.stroke();
  // 6 engines hint
  ctx.fillStyle = "#451a03"; for(let i=-8;i<=8;i+=4) { ctx.fillRect(i-1,16,2,4); }
  if (thrust>0) { ctx.fillStyle = "#f59e0b"; ctx.fillRect(-6,20,12,4); }
}

function roundRect(ctx, x,y,w,h,r) {
  ctx.beginPath();
  ctx.moveTo(x+r,y);
  ctx.arcTo(x+w,y, x+w,y+h, r);
  ctx.arcTo(x+w,y+h, x,y+h, r);
  ctx.arcTo(x,y+h, x,y, r);
  ctx.arcTo(x,y, x+w,y, r);
  ctx.closePath();
}
