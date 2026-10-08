import { GAMES } from "../data/games.js";
export const emptyLearning = () => ({
  history: [],
  skills: {},
  missions: [],
  draft: null,
  drafts: {},
});
export const draftKey = (mission) =>
  `${mission.gameId}:${mission.together ? "together" : "solo"}`;
export function finishMission(state, mission, pilotId) {
  if (state.learning.missions.some((m) => m.id === mission.id)) return state;
  if (mission.results.length !== mission.rounds.length) return state;
  const next = structuredClone(state);
  const own = mission.results.filter((r) => r.pilotId === pilotId);
  if (!own.length) return state;
  next.learning.history.push(
    ...own.map((r) => ({
      ...r,
      missionId: mission.id,
      gameId: mission.gameId,
      timestamp: Date.now(),
    })),
  );
  next.learning.history = next.learning.history.slice(-500);
  next.learning.missions.push({
    id: mission.id,
    gameId: mission.gameId,
    together: mission.together,
    timestamp: Date.now(),
  });
  const previous = next.learning.skills[mission.gameId] || {
    tier: Math.max(...own.map((r) => r.tier)),
    independent: 0,
    helped: 0,
    attempts: 0,
  };
  const recent = next.learning.history
    .filter((r) => r.gameId === mission.gameId && r.tier === previous.tier)
    .slice(-10);
  const independent = own.filter((r) => r.independent).length;
  let tier = previous.tier;
  if (
    recent.length >= 5 &&
    recent.filter((r) => r.independent).length / recent.length >= 0.8
  )
    tier = Math.min(2, tier + 1);
  else if (
    recent.length >= 5 &&
    recent.filter((r) => r.independent).length / recent.length < 0.4
  )
    tier = Math.max(0, tier - 1);
  next.learning.skills[mission.gameId] = {
    tier,
    independent: previous.independent + independent,
    helped: previous.helped + own.filter((r) => r.helpRequests > 0).length,
    attempts: previous.attempts + own.length,
    helpRequests:
      (previous.helpRequests || 0) +
      own.reduce((n, r) => n + r.helpRequests, 0),
  };
  const key = draftKey(mission);
  if (next.learning.drafts?.[key]?.id === mission.id)
    delete next.learning.drafts[key];
  if (next.learning.draft?.id === mission.id)
    next.learning.draft =
      Object.values(next.learning.drafts || {}).at(-1) || null;
  next.totalFuel += 35;
  next.currentFuel = Math.min(100, next.currentFuel + 35);
  next.hangar.stickers.push({
    gameId: mission.gameId,
    missionId: mission.id,
    earnedAt: Date.now(),
  });
  const completed =
    next.storiesCompleted.length + next.learning.missions.length;
  ["b737", "f16", "f22", "sr71", "xb70"].forEach((id, i) => {
    if (
      completed >= [2, 4, 6, 9, 12][i] &&
      !next.hangar.unlockedSkins.includes(id)
    )
      next.hangar.unlockedSkins.push(id);
  });
  return next;
}
export function learningStats(state) {
  return GAMES.map((g) => ({
    ...g,
    ...(state.learning.skills[g.id] || {
      tier: 0,
      independent: 0,
      helped: 0,
      attempts: 0,
    }),
    helpRequests:
      state.learning.skills[g.id]?.helpRequests ??
      state.learning.history
        .filter((r) => r.gameId === g.id)
        .reduce((s, r) => s + r.helpRequests, 0),
    explanations: state.learning.history.filter(
      (r) => r.gameId === g.id && r.explained,
    ).length,
  }));
}
export function exportProfiles(profiles) {
  return {
    format: "reading-racer-backup",
    version: 2,
    exportedAt: new Date().toISOString(),
    profiles,
  };
}
export function validateBackup(value) {
  if (value?.format !== "reading-racer-backup" || value.version !== 2)
    throw new Error("Choose a Reading Racer backup file.");
  for (const id of ["first", "second"]) {
    const p = value.profiles?.[id];
    if (
      !p ||
      !Number.isFinite(p.currentFuel) ||
      p.currentFuel < 0 ||
      p.currentFuel > 100 ||
      !Number.isFinite(p.totalFuel) ||
      !Number.isFinite(p.flightsFlown) ||
      !Array.isArray(p.storiesCompleted) ||
      !Array.isArray(p.sentenceHistory) ||
      !Array.isArray(p.hangar?.unlockedSkins) ||
      !Array.isArray(p.hangar?.stickers) ||
      !p.settings ||
      (p.learning &&
        (!Array.isArray(p.learning.history) ||
          !Array.isArray(p.learning.missions) ||
          !p.learning.skills ||
          Array.isArray(p.learning.skills) ||
          typeof p.learning.skills !== "object"))
    )
      throw new Error("The backup is incomplete or damaged.");
  }
  for (const p of Object.values(value.profiles)) {
    if (p.learning) {
      if (
        p.learning.drafts !== undefined &&
        (!p.learning.drafts ||
          Array.isArray(p.learning.drafts) ||
          typeof p.learning.drafts !== "object")
      )
        throw new Error("The backup has invalid unfinished missions.");
      for (const skill of Object.values(p.learning.skills)) {
        if (
          !skill ||
          ![0, 1, 2].includes(skill.tier) ||
          ![skill.attempts, skill.independent, skill.helped].every(
            (n) => Number.isInteger(n) && n >= 0,
          )
        )
          throw new Error("The backup has invalid learning records.");
      }
      for (const draft of [
        p.learning.draft,
        ...Object.values(p.learning.drafts || {}),
      ].filter(Boolean)) {
        if (
          !GAMES.some((g) => g.id === draft.gameId) ||
          !["first", "second"].includes(draft.ownerId) ||
          !Array.isArray(draft.rounds) ||
          draft.rounds.length !== 5 ||
          !Number.isInteger(draft.index) ||
          draft.index < 0 ||
          draft.index > 4 ||
          !Array.isArray(draft.results) ||
          draft.results.length !== draft.index ||
          !draft.rounds.every(
            (q) =>
              q &&
              ["first", "second"].includes(q.pilotId) &&
              [0, 1, 2].includes(q.tier) &&
              typeof q.prompt === "string" &&
              typeof q.answer === "string" &&
              Array.isArray(q.options),
          )
        )
          throw new Error("The backup has an invalid unfinished mission.");
      }
    }
  }
  return value.profiles;
}
