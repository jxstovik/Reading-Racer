export const GAMES = [
  {
    id: "sounds",
    name: "Sound Safari",
    emoji: "🦁",
    skill: "Sounds and blending",
    invitation: "Listen for sounds",
  },
  {
    id: "count",
    name: "Cargo Count",
    emoji: "📦",
    skill: "Number sense",
    invitation: "Load the cargo",
  },
  {
    id: "shapes",
    name: "Shape Hangar",
    emoji: "🔷",
    skill: "Shapes and space",
    invitation: "Build with shapes",
  },
  {
    id: "patterns",
    name: "Pattern Runway",
    emoji: "🌈",
    skill: "Patterns",
    invitation: "Finish the runway",
  },
  {
    id: "stories",
    name: "Story Detective",
    emoji: "🔎",
    skill: "Story understanding",
    invitation: "Solve a little story",
  },
  {
    id: "nature",
    name: "Nature Rescue",
    emoji: "🌱",
    skill: "Nature and reasoning",
    invitation: "Help the animals",
  },
];
const option = (id, label, picture = label) => ({
  id: String(id),
  label,
  picture,
});
const question = (id, prompt, scene, options, answer, hint, extra = {}) => ({
  id,
  prompt,
  scene,
  options,
  answer: String(answer),
  hint,
  ...extra,
});
const animals = [
  ["cat", "🐱", "hat", "🎩", "dog", "🐶", "c"],
  ["sun", "☀️", "bun", "🍞", "fish", "🐟", "s"],
  ["bee", "🐝", "tree", "🌳", "cat", "🐱", "b"],
  ["dog", "🐶", "frog", "🐸", "sun", "☀️", "d"],
  ["fish", "🐟", "dish", "🍽️", "hat", "🎩", "f"],
  ["boat", "⛵", "goat", "🐐", "bee", "🐝", "b"],
];
const blends = [
  ["sun", "☀️", ["s", "uh", "n"], "cat", "🐱"],
  ["man", "👨", ["m", "a", "n"], "fish", "🐟"],
  ["fan", "🪭", ["f", "a", "n"], "sun", "☀️"],
  ["hat", "🎩", ["h", "a", "t"], "dog", "🐶"],
  ["map", "🗺️", ["m", "a", "p"], "hat", "🎩"],
  ["cat", "🐱", ["k", "a", "t"], "sun", "☀️"],
];
const shapes = [
  ["circle", "●", 0],
  ["triangle", "▲", 3],
  ["square", "■", 4],
  ["rectangle", "▬", 4],
  ["hexagon", "⬢", 6],
];
const scenes = [
  {
    text: "Mia packed an apple. She flew to the park. At the park, she ate her apple.",
    who: "Mia",
    person: "👧",
    other: "a bear",
    otherPic: "🐻",
    first: "Pack an apple",
    firstPic: "🍎",
    next: "Fly to the park",
    nextPic: "✈️",
    last: "Eat the apple",
    lastPic: "😋",
    why: "She was hungry",
    whyPic: "🍽️",
    wrongWhy: "She needed a hat",
    wrongPic: "🎩",
  },
  {
    text: "A bear found a seed. He planted it in the soil. He watered it so it could grow.",
    who: "a bear",
    person: "🐻",
    other: "a rabbit",
    otherPic: "🐰",
    first: "Find a seed",
    firstPic: "🌰",
    next: "Plant the seed",
    nextPic: "🪴",
    last: "Water the seed",
    lastPic: "💧",
    why: "The seed needs water",
    whyPic: "🌱",
    wrongWhy: "The seed needs shoes",
    wrongPic: "👟",
  },
  {
    text: "Leo saw rain. He put on his boots. Then he jumped in a puddle.",
    who: "Leo",
    person: "👦",
    other: "a fox",
    otherPic: "🦊",
    first: "See the rain",
    firstPic: "🌧️",
    next: "Put on boots",
    nextPic: "🥾",
    last: "Jump in a puddle",
    lastPic: "💦",
    why: "To keep his feet dry",
    whyPic: "🥾",
    wrongWhy: "To eat a snack",
    wrongPic: "🍪",
  },
  {
    text: "A rabbit picked a carrot. She washed it. Then she shared it with her friend.",
    who: "a rabbit",
    person: "🐰",
    other: "a dog",
    otherPic: "🐶",
    first: "Pick a carrot",
    firstPic: "🥕",
    next: "Wash the carrot",
    nextPic: "💧",
    last: "Share the carrot",
    lastPic: "🤝",
    why: "To share a snack",
    whyPic: "🥕",
    wrongWhy: "To build a plane",
    wrongPic: "✈️",
  },
];
const habitats = [
  ["fish", "🐟", "water", "🌊", "desert", "🏜️"],
  ["camel", "🐪", "desert", "🏜️", "ocean", "🌊"],
  ["frog", "🐸", "pond", "🪷", "dry desert", "🏜️"],
  ["polar bear", "🐻‍❄️", "Arctic sea ice", "🧊", "hot desert", "🏜️"],
  ["bird", "🐦", "tree", "🌳", "underwater", "🌊"],
  ["monkey", "🐒", "forest", "🌳", "sea ice", "🧊"],
];

export function questionBank(gameId, tier = 0) {
  const out = [];
  const add = (q) =>
    out.push({
      ...q,
      gameId,
      tier,
      skill: GAMES.find((g) => g.id === gameId).skill,
    });
  if (gameId === "sounds") {
    animals.forEach(
      ([word, pic, rhyme, rhymePic, wrong, wrongPic, letter], i) => {
        if (tier === 0)
          add(
            question(
              `rhyme-${i}`,
              `What rhymes with ${word}?`,
              pic,
              [option(rhyme, rhyme, rhymePic), option(wrong, wrong, wrongPic)],
              rhyme,
              `${word} and ${rhyme} have the same ending sound.`,
            ),
          );
        if (tier === 1 || (tier === 0 && i % 2 === 1))
          add(
            question(
              `initial-${i}`,
              "Which picture starts with this sound?",
              "👂",
              [
                option(word, word, pic),
                option(
                  letter === "b" && wrong === "bee" ? "cat" : wrong,
                  letter === "b" && wrong === "bee" ? "cat" : wrong,
                  letter === "b" && wrong === "bee" ? "🐱" : wrongPic,
                ),
              ],
              word,
              `Listen to the beginning of ${word}.`,
              { phonemes: [letter], letter },
            ),
          );
        if (tier === 2) {
          const [target, picture, phonemes, distractor, distractorPic] =
            blends[i];
          add(
            question(
              `blend-${i}`,
              "Blend these sounds. Which word do you hear?",
              "👂",
              [
                option(target, target, picture),
                option(distractor, distractor, distractorPic),
              ],
              target,
              `Say the sounds slowly, then slide them together: ${target}.`,
              { phonemes, segment: true },
            ),
          );
        }
      },
    );
  }
  if (gameId === "count") {
    for (let i = 1; i <= 10; i++) {
      const n = tier === 0 ? (i % 5) + 1 : tier === 1 ? (i % 9) + 1 : i + 5;
      if (tier === 0)
        add(
          question(
            `load-${i}`,
            `Load ${n} ${n === 1 ? "crate" : "crates"} onto the plane.`,
            "✈️",
            [],
            n,
            `Tap the plus button once for each crate. Stop at ${n}.`,
            { counter: true, max: 5 },
          ),
        );
      if (tier === 1)
        add(
          question(
            `ten-${i}`,
            `${n} crates are loaded. How many more make ten?`,
            "📦".repeat(n),
            [
              option(10 - n, String(10 - n)),
              option(11 - n, String(11 - n)),
              option(Math.max(0, 9 - n), String(Math.max(0, 9 - n))),
            ],
            10 - n,
            `Count the empty spaces in the ten frame.`,
            { frame: n },
          ),
        );
      if (tier === 2) {
        const remove = i % 2 === 0,
          amount = (i % 4) + 1,
          answer = remove ? n - amount : n + amount;
        add(
          question(
            `math-${i}`,
            `${n} crates. ${remove ? "Take away" : "Add"} ${amount}. How many now?`,
            `${n} ${remove ? "−" : "+"} ${amount} = ?`,
            [
              option(answer, String(answer)),
              option(answer + 1, String(answer + 1)),
              option(Math.max(0, answer - 1), String(Math.max(0, answer - 1))),
            ],
            answer,
            `Use the crates to count ${remove ? "backward" : "forward"} ${amount} steps.`,
            { groups: [n, amount], subtract: remove },
          ),
        );
      }
    }
    if (tier > 0)
      for (let i = 1; i <= 5; i++)
        add(
          question(
            `compare-${i}`,
            "Which plane has more crates?",
            `${"📦".repeat(i)}  •  ${"📦".repeat(i + 2)}`,
            [
              option("left", "Left plane", `✈️ ${"📦".repeat(i)}`),
              option("right", "Right plane", `✈️ ${"📦".repeat(i + 2)}`),
            ],
            "right",
            "Count the crates on each plane. The bigger number is more.",
          ),
        );
  }
  if (gameId === "shapes") {
    shapes
      .slice(0, tier === 0 ? 3 : 5)
      .forEach(([name, picture, corners], i) => {
        add(
          question(
            `match-${i}`,
            tier === 0
              ? `Find the ${name}.`
              : `Find the shape with ${corners} corners${name === "square" ? " and four equal sides" : name === "rectangle" ? " and two long sides" : ""}.`,
            tier === 0 ? picture : "🔍",
            shapes
              .slice(0, tier === 0 ? 3 : 5)
              .filter(
                ([n]) =>
                  !(
                    corners === 4 &&
                    n === (name === "square" ? "rectangle" : "square")
                  ),
              )
              .map(([n, p]) => option(n, n, p)),
            name,
            `A ${name} has ${corners} corners. Trace its edge.`,
            { rotate: tier > 0 ? i * 45 : 0 },
          ),
        );
      });
    if (tier === 2) {
      add(
        question(
          "compose-square",
          "Two matching triangles can make which shape?",
          "◢ ◤",
          [option("square", "square", "■"), option("circle", "circle", "●")],
          "square",
          "Turn the triangles so their long edges meet.",
          { compose: true },
        ),
      );
      add(
        question(
          "compose-rectangle",
          "Two squares side by side make which shape?",
          "■ ■",
          [
            option("rectangle", "rectangle", "▬"),
            option("triangle", "triangle", "▲"),
          ],
          "rectangle",
          "Slide the squares together along one edge.",
          { compose: true },
        ),
      );
    }
  }
  if (gameId === "patterns") {
    const names = {
      "🐻": "bear",
      "🦊": "fox",
      "🐰": "rabbit",
      "🔴": "red",
      "🔵": "blue",
      "🟡": "yellow",
      "☀️": "sun",
      "🌧️": "rain",
      "☁️": "cloud",
      "🍎": "apple",
      "🍌": "banana",
      "🍇": "grapes",
      "✈️": "plane",
      "🚁": "helicopter",
      "🚀": "rocket",
    };
    const pairs = [
      ["🐻", "🦊", "🐰"],
      ["🔴", "🔵", "🟡"],
      ["☀️", "🌧️", "☁️"],
      ["🍎", "🍌", "🍇"],
      ["✈️", "🚁", "🚀"],
    ];
    pairs.forEach(([a, b, c], i) => {
      const unit = tier === 0 ? [a, b] : tier === 1 ? [a, a, b] : [a, b, c];
      for (let k = 0; k < unit.length; k++) {
        const sequence = [...unit, ...unit].slice(0, unit.length + k),
          answer = unit[k];
        add(
          question(
            `pattern-${i}-${k}`,
            "What comes next on the runway?",
            [...sequence, "❔"].join(" "),
            [
              option(a, names[a], a),
              option(b, names[b], b),
              option(c, names[c], c),
            ],
            answer,
            `The repeating group is ${unit.map((p) => names[p]).join(", ")}.`,
            { rule: unit, create: tier === 2 },
          ),
        );
      }
    });
  }
  if (gameId === "stories")
    scenes.forEach((s, i) => {
      if (tier === 0 || tier === 2)
        add(
          question(
            `who-${i}`,
            "Who is in this story?",
            s.person,
            [
              option(s.who, s.who, s.person),
              option(s.other, s.other, s.otherPic),
            ],
            s.who,
            `Listen again for the character: ${s.who}.`,
            { story: s.text },
          ),
        );
      if (tier === 0 || tier === 1)
        add(
          question(
            `order-${i}`,
            "What happened first?",
            `${s.nextPic} ${s.firstPic}`,
            [
              option("first", s.first, s.firstPic),
              option("next", s.next, s.nextPic),
            ],
            "first",
            `At the beginning: ${s.first}.`,
            { story: s.text },
          ),
        );
      if (tier === 2) {
        add(
          question(
            `ending-${i}`,
            "Which ending fits this story?",
            "📖",
            [
              option("ending", s.last, s.lastPic),
              option("silly", "Fly to the moon", "🌙"),
            ],
            "ending",
            `The story ends with: ${s.last}.`,
            { story: s.text },
          ),
        );
        add(
          question(
            `sequence-${i}`,
            "Put the story in order. Tap each picture.",
            "",
            [
              option("first", s.first, s.firstPic),
              option("next", s.next, s.nextPic),
              option("last", s.last, s.lastPic),
            ],
            "first,next,last",
            `First ${s.first.toLowerCase()}, then ${s.next.toLowerCase()}, last ${s.last.toLowerCase()}.`,
            { story: s.text, sequence: true },
          ),
        );
        add(
          question(
            `why-${i}`,
            `Why did ${s.who} do that?`,
            s.lastPic,
            [
              option("why", s.why, s.whyPic),
              option("wrong", s.wrongWhy, s.wrongPic),
            ],
            "why",
            s.why,
            { story: s.text },
          ),
        );
      }
    });
  if (gameId === "nature") {
    habitats.forEach(([animal, pic, home, homePic, wrong, wrongPic], i) =>
      add(
        question(
          `home-${i}`,
          `Where does a ${animal} live?`,
          pic,
          [option(home, home, homePic), option(wrong, wrong, wrongPic)],
          home,
          `A ${animal} can find what it needs in the ${home}.`,
          { explain: tier === 2 },
        ),
      ),
    );
    if (tier > 0) {
      const needs = [
        [
          "A plant is dry. What does it need?",
          "🪴",
          "Water",
          "💧",
          "A shoe",
          "👟",
        ],
        [
          "A seed is ready to grow. Where can we plant it?",
          "🌰",
          "Soil",
          "🟫",
          "A glass shelf",
          "🪟",
        ],
        [
          "Dark rain clouds are coming. What might happen?",
          "☁️",
          "Rain",
          "🌧️",
          "A sunny rainbow without rain",
          "☀️",
        ],
        [
          "A plant is in a dark cupboard. What does it need?",
          "🌱",
          "Light",
          "☀️",
          "A toy",
          "🧸",
        ],
        [
          "It is snowy outside. What keeps you warm?",
          "❄️",
          "A coat",
          "🧥",
          "A swimsuit",
          "🩱",
        ],
      ];
      needs.forEach(([prompt, pic, answer, answerPic, wrong, wrongPic], i) =>
        add(
          question(
            `needs-${i}`,
            prompt,
            pic,
            [option(answer, answer, answerPic), option(wrong, wrong, wrongPic)],
            answer,
            `Think about what helps living things stay healthy and comfortable. ${answer} helps here.`,
            { explain: tier === 2 },
          ),
        ),
      );
    }
  }
  return out;
}
export function tierFor(progress, gameId, pilotId) {
  const setting = progress.settings.gameLevel || "auto";
  if (setting !== "auto") return Math.max(0, Math.min(2, Number(setting)));
  return (
    progress.learning?.skills?.[gameId]?.tier ?? (pilotId === "second" ? 1 : 0)
  );
}
function hash(text) {
  let n = 0;
  for (const c of text) n = (n * 31 + c.charCodeAt(0)) >>> 0;
  return n;
}
export function makeMission(
  gameId,
  profiles,
  ownerId,
  together = false,
  id = globalThis.crypto.randomUUID(),
) {
  const rounds = Array.from({ length: 5 }, (_, i) => {
    const pilotId =
      together && i % 2 ? (ownerId === "first" ? "second" : "first") : ownerId;
    const targetTier = tierFor(profiles[pilotId], gameId, pilotId);
    const tier =
      (profiles[pilotId].settings.gameLevel || "auto") === "auto" && i < 3
        ? Math.max(0, targetTier - 1)
        : targetTier;
    const bank = questionBank(gameId, tier);
    const q = structuredClone(bank[(hash(id) + i) % bank.length]);
    q.options.sort(
      (a, b) => (hash(id + i + a.id) % 97) - (hash(id + i + b.id) % 97),
    );
    return { ...q, pilotId };
  });
  return {
    id,
    gameId,
    ownerId,
    together,
    rounds,
    results: [],
    index: 0,
    startedAt: Date.now(),
  };
}
export const PHONEMES = {
  s: "s",
  m: "m",
  f: "f",
  n: "n",
  a: "a",
  uh: "V",
  k: "k",
  t: "t",
  p: "p",
  c: "k",
  b: "b",
  d: "d",
  h: "h",
};
