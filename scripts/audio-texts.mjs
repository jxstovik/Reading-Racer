import fs from "node:fs";
import { questionBank, GAMES, PHONEMES } from "../src/data/games.js";
const stories = JSON.parse(
  fs.readFileSync(new URL("../src/data/stories.json", import.meta.url)),
);
const texts = new Set([
  "Make your own repeating runway. Say its rule!",
  "You can tell someone why you chose it.",
  "Little Pilot’s turn.",
  "Super Pilot’s turn.",
  "Choose a story. Listen for help, then read out loud. Reading fills your fuel tank so you can fly!",
  "Listen for help. Then say the words. You can do it!",
  "Read this sentence out loud. Tap any word for help.",
  "You found it!",
  "Let’s try again. You can listen or ask for a clue.",
  "You finished your story! Well done, pilot.",
  "Choose a little mission. Earn a sticker. Fly your plane!",
  "Your turn, pilot.",
  "Play together. Take turns with your friend.",
  "Your mission is complete! You earned a sticker. You can fly, play again, or take a break.",
]);
for (const letter of ["c", "s", "b", "d", "f"])
  texts.add(`The letter ${letter} makes this sound.`);
for (let i = 0; i <= 20; i++) texts.add(String(i));
for (const game of GAMES)
  for (let tier = 0; tier < 3; tier++)
    for (const q of questionBank(game.id, tier)) {
      [
        q.prompt,
        q.hint,
        ...q.options.map((o) => o.label),
        q.story,
        q.story ? `${q.story} ${q.prompt}` : null,
      ]
        .filter(Boolean)
        .forEach((t) => texts.add(t));
    }
for (const s of stories)
  for (const sentence of s.sentences) {
    const text = typeof sentence === "string" ? sentence : sentence.text;
    if (!text) continue;
    texts.add(text);
    for (const word of text.split(/\s+/)) texts.add(word);
  }
fs.writeFileSync(
  "/tmp/reading-racer-narration.json",
  JSON.stringify({ texts: [...texts], phonemes: PHONEMES }),
);
