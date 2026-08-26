import { AIRCRAFT, AIRCRAFT_ORDER } from "./aircraft.js";

const KEY = "reading-racer:v1";
// Map legacy skin keys -> new aircraft
const LEGACY_SKIN_MAP = {
  classic: "c172",
  rocket: "f16",
  sea: "b737",
  jungle: "f16",
  star: "sr71",
};

const defaults = {
  totalFuel: 0,
  flightsFlown: 0,
  storiesCompleted: [], // ids
  sentenceHistory: [], // { storyId, sentenceIndex, score, grade, fuel, timestamp }
  settings: {
    levelFilter: "all", // all | 1 | 2 | 3
    passThreshold: 0.78, // plan suggests 0.80, we use slightly generous
    goodThreshold: 0.55,
    micSensitivity: "default",
    dyslexiaFont: false,
    soundEnabled: true,
    flightFuelRequired: 28, // per plan 25-30
    hangarSkin: "c172",
  },
  hangar: {
    unlockedSkins: ["c172"],
    stickers: [],
  },
  starsCollected: 0,
  currentFuel: 0, // fuel in tank for next flight
};

export function loadProgress() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return structuredClone(defaults);
    const parsed = JSON.parse(raw);
    const merged = {
      ...structuredClone(defaults),
      ...parsed,
      settings: { ...defaults.settings, ...(parsed.settings || {}) },
      hangar: { ...defaults.hangar, ...(parsed.hangar || {}) },
    };
    // migrate legacy skins -> new aircraft
    if (LEGACY_SKIN_MAP[merged.settings.hangarSkin]) {
      merged.settings.hangarSkin = LEGACY_SKIN_MAP[merged.settings.hangarSkin];
    }
    merged.hangar.unlockedSkins = merged.hangar.unlockedSkins.map((k) => LEGACY_SKIN_MAP[k] || k);
    // dedupe & ensure at least c172
    merged.hangar.unlockedSkins = [...new Set(merged.hangar.unlockedSkins)];
    if (!merged.hangar.unlockedSkins.includes("c172")) merged.hangar.unlockedSkins.unshift("c172");
    // guard unknown skin
    if (!AIRCRAFT[merged.settings.hangarSkin]) merged.settings.hangarSkin = "c172";
    return merged;
  } catch {
    return structuredClone(defaults);
  }
}

export function saveProgress(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (e) {
    console.warn("save failed", e);
  }
}

export function clearProgress() {
  localStorage.removeItem(KEY);
}

export function addSentenceResult(state, { storyId, sentenceIndex, score, grade, fuel }) {
  const next = structuredClone(state);
  next.sentenceHistory.push({
    storyId,
    sentenceIndex,
    score,
    grade,
    fuel,
    timestamp: Date.now(),
  });
  next.totalFuel += fuel;
  next.currentFuel += fuel;
  // cap currentFuel at 100 for display
  if (next.currentFuel > 100) next.currentFuel = 100;
  return next;
}

export function getFlightDurationSeconds(level = 1) {
  // Minimum ~30s, scales with difficulty (Level 1 = 30s, Level 2 = 40s, Level 3 = 50s)
  const lvl = Math.max(1, Math.min(3, Number(level) || 1));
  return 30 + (lvl - 1) * 10;
}

export function consumeFuelForFlight(state, ringsCollected = null) {
  const need = state.settings.flightFuelRequired;
  if (state.currentFuel < need) return state;
  let next = structuredClone(state);
  next.currentFuel -= need;
  next.flightsFlown += 1;
  // Rings collected become stars; if not provided (legacy joy flight), random fallback
  const stars =
    typeof ringsCollected === "number"
      ? Math.max(0, Math.floor(ringsCollected))
      : Math.floor(5 + Math.random() * 5);
  // Bonus for completing flight: at least 3 stars even if 0 rings (encouragement)
  next.starsCollected += stars > 0 ? stars : 3;
  if (typeof ringsCollected === "number") {
    next.lastFlightRings = ringsCollected;
  }
  // flight-based aircraft unlocks
  next = maybeUnlockByFlights(next);
  return next;
}

export function completeStory(state, storyId) {
  if (state.storiesCompleted.includes(storyId)) return state;
  const next = structuredClone(state);
  next.storiesCompleted.push(storyId);
  // unlock aircraft by story milestones: 0:c172 (default), 2:b737, 4:f16, 6:f22, 9:sr71, 12:xb70
  const count = next.storiesCompleted.length;
  const unlockByCount = {
    2: "b737",
    4: "f16",
    6: "f22",
    9: "sr71",
    12: "xb70",
  };
  const toUnlock = unlockByCount[count];
  // check story unlock
  if (toUnlock && !next.hangar.unlockedSkins.includes(toUnlock)) {
    next.hangar.unlockedSkins.push(toUnlock);
  }
  // stickers
  next.hangar.stickers.push({ storyId, earnedAt: Date.now() });
  return next;
}

export function maybeUnlockByFlights(state) {
  const thresholds = { 5: "b737", 10: "f16", 18: "f22", 28: "sr71", 40: "xb70" };
  const need = thresholds[state.flightsFlown];
  if (need && !state.hangar.unlockedSkins.includes(need)) {
    const next = structuredClone(state);
    next.hangar.unlockedSkins.push(need);
    return next;
  }
  return state;
}

export function getStats(state) {
  const totalSentences = state.sentenceHistory.length;
  const avgScore = totalSentences
    ? state.sentenceHistory.reduce((s, r) => s + r.score, 0) / totalSentences
    : 0;
  const perfect = state.sentenceHistory.filter((r) => r.grade === "perfect").length;
  const strugglingWords = computeStrugglingWords(state);
  return { totalSentences, avgScore, perfect, strugglingWords };
}

function computeStrugglingWords(state) {
  // naive: count missed grades per story? We don't store word-level; approximate via low scores
  const low = state.sentenceHistory.filter((r) => r.score < 0.55);
  // we could later expand to word-level history
  return low.slice(-5).map((r) => r.storyId);
}

export { defaults, AIRCRAFT, AIRCRAFT_ORDER };
