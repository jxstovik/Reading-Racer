import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  defaults,
  loadProgress,
  saveProgress,
  clearProgress,
  addSentenceResult,
  consumeFuelForFlight,
  completeStory,
  getStats,
} from "../src/utils/storage.js";
import { scoreReading, gradeFromScore } from "../src/utils/speechMatch.js";
const values = new Map();
globalThis.localStorage = {
  getItem: (key) => values.get(key) ?? null,
  setItem: (key, value) => values.set(key, value),
  removeItem: (key) => values.delete(key),
};

test("pilot saves are independent, preserve legacy progress, and clear only the selected pilot", () => {
  values.clear();
  const legacy = structuredClone(defaults);
  legacy.currentFuel = 21;
  legacy.storiesCompleted = ["sight-i-see"];
  values.set("reading-racer:v1", JSON.stringify(legacy));
  assert.equal(loadProgress("first").currentFuel, 21);
  const second = loadProgress("second");
  assert.equal(second.currentFuel, 0);
  assert.equal(second.settings.levelFilter, "1");
  second.currentFuel = 7;
  second.storyPositions = { "bob-sam": 2 };
  saveProgress(second, "second");
  assert.equal(loadProgress("first").currentFuel, 21);
  assert.equal(loadProgress("second").storyPositions["bob-sam"], 2);
  clearProgress("second");
  assert.equal(loadProgress("first").currentFuel, 21);
  assert.equal(loadProgress("second").currentFuel, 0);
});

test("first words defaults to practice and broken saves recover without crashing", () => {
  values.clear();
  assert.equal(loadProgress("first").settings.levelFilter, "0");
  assert.equal(loadProgress("first").settings.practiceMode, true);
  values.set("reading-racer:v1", "{broken JSON");
  assert.equal(loadProgress().totalFuel, 0);
});

test("practice earns fuel but is excluded from microphone match averages", () => {
  let state = structuredClone(defaults);
  state = addSentenceResult(state, {
    storyId: "a",
    sentenceIndex: 0,
    score: null,
    grade: "practice",
    fuel: 7,
  });
  state = addSentenceResult(state, {
    storyId: "a",
    sentenceIndex: 1,
    score: 0.8,
    grade: "perfect",
    fuel: 10,
  });
  const stats = getStats(state);
  assert.equal(stats.totalSentences, 2);
  assert.equal(stats.avgScore, 0.8);
  assert.equal(stats.scoredCount, 1);
  assert.equal(stats.practiceCount, 1);
  assert.equal(state.currentFuel, 17);
});

test("flight spends one tank, awards completion stars and cannot spend an empty tank", () => {
  const state = structuredClone(defaults);
  state.currentFuel = 35;
  const landed = consumeFuelForFlight(state, 0);
  assert.equal(landed.currentFuel, 7);
  assert.equal(landed.flightsFlown, 1);
  assert.equal(landed.starsCollected, 3);
  assert.equal(state.currentFuel, 35);
  assert.equal(consumeFuelForFlight(landed, 5), landed);
});

test("story completion is idempotent and aircraft unlock at milestones", () => {
  let state = completeStory(structuredClone(defaults), "a");
  assert.equal(completeStory(state, "a"), state);
  state = completeStory(state, "b");
  assert.ok(state.hangar.unlockedSkins.includes("b737"));
  assert.equal(state.hangar.stickers.length, 2);
});

test("exact speech matches pass and unrelated speech gets supportive help", () => {
  assert.equal(scoreReading("I see a cat.", "I see a cat").score, 1);
  assert.equal(
    gradeFromScore(scoreReading("I see a cat.", "Bananas grow far away").score),
    "needs-help",
  );
});

test("story library has unique identifiers and nonempty sentences at every level", async () => {
  const stories = JSON.parse(
    await readFile(new URL("../src/data/stories.json", import.meta.url)),
  );
  assert.equal(new Set(stories.map((s) => s.id)).size, stories.length);
  for (const level of [0, 1, 2, 3])
    assert.ok(stories.some((s) => s.level === level));
  for (const story of stories) {
    assert.ok(story.sentences.length > 0);
    assert.ok(
      story.sentences.every(
        (s) => typeof s === "string" && s.trim().length > 0,
      ),
    );
  }
});

test("a partial learning save receives a fresh draft collection without losing fuel", () => {
  values.clear();
  const saved = structuredClone(defaults);
  saved.currentFuel = 21;
  saved.learning = {
    history: [],
    skills: {},
    missions: [],
    draft: null,
    drafts: null,
  };
  saveProgress(saved, "first");
  const loaded = loadProgress("first");
  assert.equal(loaded.currentFuel, 21);
  assert.deepEqual(loaded.learning.drafts, {});
});
