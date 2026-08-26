const KEY = "reading-racer:v1";

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
    hangarSkin: "classic", // classic | rocket | sea | jungle
  },
  hangar: {
    unlockedSkins: ["classic"],
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
    // merge defaults shallow
    return {
      ...structuredClone(defaults),
      ...parsed,
      settings: { ...defaults.settings, ...(parsed.settings || {}) },
      hangar: { ...defaults.hangar, ...(parsed.hangar || {}) },
    };
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
  const next = structuredClone(state);
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
  return next;
}

export function completeStory(state, storyId) {
  if (state.storiesCompleted.includes(storyId)) return state;
  const next = structuredClone(state);
  next.storiesCompleted.push(storyId);
  // unlock skin every 3 stories
  const count = next.storiesCompleted.length;
  const skins = ["classic", "rocket", "sea", "jungle", "star"];
  const shouldUnlock = skins[count];
  if (shouldUnlock && !next.hangar.unlockedSkins.includes(shouldUnlock)) {
    next.hangar.unlockedSkins.push(shouldUnlock);
  }
  // sticker
  next.hangar.stickers.push({ storyId, earnedAt: Date.now() });
  return next;
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

export { defaults };
