import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  GAMES,
  questionBank,
  makeMission,
  PHONEMES,
} from "../src/data/games.js";
import { defaults } from "../src/utils/storage.js";
import {
  finishMission,
  exportProfiles,
  validateBackup,
} from "../src/utils/learning.js";
const profiles = () => ({
  first: structuredClone(defaults),
  second: structuredClone(defaults),
});
function finished(together = false) {
  const m = makeMission("count", profiles(), "first", together, "test-mission");
  m.results = m.rounds.map((q) => ({
    questionId: q.id,
    pilotId: q.pilotId,
    tier: q.tier,
    independent: true,
    helpRequests: 0,
    misses: 0,
    explained: false,
  }));
  m.index = 5;
  return m;
}
test("every game and level has solvable questions with unique options and ids", () => {
  for (const g of GAMES)
    for (let tier = 0; tier < 3; tier++) {
      const bank = questionBank(g.id, tier);
      assert.ok(bank.length >= 3);
      assert.equal(new Set(bank.map((q) => q.id)).size, bank.length);
      for (const q of bank) {
        assert.ok(q.prompt && q.hint);
        assert.equal(
          new Set(q.options.map((o) => o.id)).size,
          q.options.length,
        );
        if (q.counter)
          assert.ok(Number(q.answer) >= 0 && Number(q.answer) <= q.max);
        else if (q.sequence)
          assert.deepEqual(
            new Set(q.answer.split(",")),
            new Set(q.options.map((o) => o.id)),
          );
        else
          assert.ok(
            q.options.some((o) => o.id === q.answer),
            `${g.id}/${q.id}`,
          );
      }
    }
});
test("cooperative mission alternates pilots and uses each pilot’s difficulty", () => {
  const p = profiles();
  p.first.settings.gameLevel = "0";
  p.second.settings.gameLevel = "2";
  const m = makeMission("count", p, "first", true, "co-op");
  assert.deepEqual(
    m.rounds.map((q) => q.pilotId),
    ["first", "second", "first", "second", "first"],
  );
  assert.deepEqual(
    m.rounds.map((q) => q.tier),
    [0, 2, 0, 2, 0],
  );
  assert.equal(
    JSON.stringify(m.rounds),
    JSON.stringify(makeMission("count", p, "first", true, "co-op").rounds),
  );
});
test("automatic missions mix familiar practice with the current challenge", () => {
  const p = profiles();
  p.first.learning.skills.count = { tier: 2 };
  assert.deepEqual(
    makeMission("count", p, "first", false, "mix").rounds.map((q) => q.tier),
    [1, 1, 1, 2, 2],
  );
});
test("mission reward is idempotent, incomplete missions earn nothing, and progress is immutable", () => {
  const p = profiles().first,
    m = finished();
  assert.equal(
    finishMission(p, { ...m, results: m.results.slice(0, 4) }, "first"),
    p,
  );
  const next = finishMission(p, m, "first");
  assert.equal(next.currentFuel, 35);
  assert.equal(next.learning.missions.length, 1);
  assert.equal(next.hangar.stickers.length, 1);
  assert.equal(p.currentFuel, 0);
  assert.equal(finishMission(next, m, "first"), next);
  assert.equal(next.learning.skills.count.tier, 1);
  const second = finishMission(
    next,
    { ...finished(), id: "second-mission" },
    "first",
  );
  assert.ok(second.hangar.unlockedSkins.includes("b737"));
});
test("cooperative rewards are shared but answers remain in each pilot’s own record", () => {
  const m = finished(true),
    p = profiles();
  const first = finishMission(p.first, m, "first"),
    second = finishMission(p.second, m, "second");
  assert.equal(first.learning.history.length, 3);
  assert.equal(second.learning.history.length, 2);
  assert.equal(first.currentFuel, second.currentFuel);
  assert.ok(first.learning.history.every((r) => r.pilotId === "first"));
  assert.ok(second.learning.history.every((r) => r.pilotId === "second"));
});
test("clues and retries do not count as independent practice or advance difficulty", () => {
  const m = finished();
  m.results = m.results.map((r) => ({
    ...r,
    independent: false,
    helpRequests: 2,
    misses: 1,
  }));
  const n = finishMission(profiles().first, m, "first");
  assert.equal(n.learning.skills.count.independent, 0);
  assert.equal(n.learning.skills.count.helped, 5);
  assert.equal(n.learning.skills.count.tier, 0);
  assert.equal(n.currentFuel, 35);
});
test("backups round-trip both profiles and reject invalid saves", () => {
  const p = profiles();
  p.first.currentFuel = 21;
  assert.deepEqual(validateBackup(exportProfiles(p)), p);
  assert.throws(() => validateBackup({ version: 1 }));
  assert.throws(() =>
    validateBackup(exportProfiles({ first: {}, second: p.second })),
  );
});
test("all shipped game prompts, story help and phonemes have nonempty offline audio", () => {
  const manifest = JSON.parse(
    fs.readFileSync(new URL("../src/data/narration.json", import.meta.url)),
  );
  const texts = [];
  for (const g of GAMES)
    for (let tier = 0; tier < 3; tier++)
      for (const q of questionBank(g.id, tier))
        texts.push(
          q.prompt,
          q.hint,
          ...q.options.map((o) => o.label),
          ...(q.story ? [q.story, `${q.story} ${q.prompt}`] : []),
        );
  for (const p of Object.keys(PHONEMES)) texts.push(`phoneme:${p}`);
  for (const s of JSON.parse(
    fs.readFileSync(new URL("../src/data/stories.json", import.meta.url)),
  ))
    for (const sentence of s.sentences)
      texts.push(sentence, ...sentence.split(/\s+/));
  for (const t of texts) {
    assert.ok(manifest[t], t);
    const f = new URL(`../public${manifest[t]}`, import.meta.url);
    assert.ok(fs.statSync(f).size > 100, t);
  }
});

test("cooperative completion preserves another pilot’s unfinished solo mission", () => {
  const p = profiles().second;
  const solo = makeMission("nature", profiles(), "second", false, "solo-save");
  p.learning.draft = solo;
  p.learning.drafts = { "nature:solo": solo };
  const next = finishMission(p, finished(true), "second");
  assert.equal(next.learning.draft.id, "solo-save");
  assert.equal(next.learning.drafts["nature:solo"].id, "solo-save");
});
test("difficulty advances only from answers at the current tier", () => {
  const p = profiles().first;
  p.learning.skills.count = { tier: 1, attempts: 0, independent: 0, helped: 0 };
  const m = finished();
  m.rounds = m.rounds.map((q) => ({ ...q, tier: 0 }));
  m.results = m.results.map((r) => ({ ...r, tier: 0 }));
  assert.equal(finishMission(p, m, "first").learning.skills.count.tier, 1);
});
test("a malformed unfinished mission cannot be restored from a backup", () => {
  const p = profiles();
  p.first.learning.draft = { gameId: "count", rounds: [], index: 99 };
  assert.throws(() => validateBackup(exportProfiles(p)));
});

test("backup validation rejects a null draft collection", () => {
  const p = profiles();
  p.first.learning.drafts = null;
  assert.throws(() => validateBackup(exportProfiles(p)));
});
