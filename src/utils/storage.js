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

export function consumeFuelForFlight(state) {
  const need = state.settings.flightFuelRequired;
  if (state.currentFuel < need) return state;
  const next = structuredClone(state);
  next.currentFuel -= need;
  next.flightsFlown += 1;
  next.starsCollected += Math.floor(5 + Math.random() * 5);
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
