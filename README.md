# Reading Racer — Fuel Your Airplane By Reading ✈️

A warm, encouraging reading game for early readers (4–8). **Read sentences out loud → earn fuel → fly!**

> Built from `reading_app_plan.md` — Web/PWA MVP with Web Speech API + fuzzy matching.

## Core Loop

1. **Story** — One big sentence at a time, large type, illustrated (emoji).
2. **Read** — Tap 🎤 and read aloud (Web Speech API). Interim results shown.
3. **Check** — Fuzzy match (normalized + Levenshtein/WER, 80% threshold generous). Word-level feedback.
4. **Reward** — +10 fuel perfect, +7 good, +3 try-again. Near-miss is still positive.
5. **Fly** — Every ~28 fuel or 2 sentences you can fly. **Interactive flight:** steer up/down (▲▼ buttons, Arrow keys/W+S, or drag/touch) through glowing rings. Min 30s flight, scales with difficulty (L1 30s / L2 40s / L3 50s). Rings collected → stars. No fail state, always encouraging.
6. **Progress** — Unlock next story, hangar skins, map destinations. All local (LocalStorage).

Fallback: **Parent Tap “Great job!”** always works if mic is unavailable or recognition is poor for child voice.

## Quick Start

```bash
npm install
npm run dev     # http://localhost:5173
npm run build
npm run preview
npm run lint
```

Node 18+ required (tested with Node 26).

## Stack

- Vite 8 + React 19 + `@vitejs/plugin-react`
- Tailwind CSS 4 via `@tailwindcss/vite`
- Web Speech API (`SpeechRecognition` / `webkitSpeechRecognition`)
- Web Speech Synthesis for “Hear it” TTS
- Web Audio for success/flight sounds
- LocalStorage for progress (no backend, COPPA-friendly, offline-capable)
- Canvas flight animation (no heavy game engine)

## Project Structure

```
public/stories/stories.json
src/components/
  Library.jsx          # leveled library (15 stories: 4×L1, 5×L2, 6×L3)
  StoryReader.jsx      # one-sentence view, mic, word tap, feedback
  FuelGauge.jsx        # tank 0..required (28 default)
  FlightView.jsx       # interactive canvas flight (rings, up/down control, timed 30–50s)
  Hangar.jsx           # skins (classic/rocket/sea/jungle/star)
  MapView.jsx          # 6 destinations by flights flown
  ParentDashboard.jsx  # hold ⚙️ 900ms to open
  MicrophoneButton.jsx
src/hooks/useSpeechRecognition.js
src/utils/
  speechMatch.js       # normalize, levenshtein, WER, scoreReading, gradeFromScore
  storage.js           # load/save, addSentenceResult, consumeFuel, completeStory
  sounds.js            # Web Audio tones + speechSynthesis
```

## Stories

15 original stories, JSON schema `{id, level, title, sentences[], coverEmoji, color, vocabulary[]}`:

- **Level 1** (3–4 words): Sam’s First Flight, Cat Can Fly, Sun and Moon, Big Blue Sky
- **Level 2** (5–8 words): Little Pilot, Cloud Island, Star Journey, Rainy Rescue, City Lights, Space Dream
- **Level 3** (8–12 words): Jungle Airstrip, Desert Race, Arctic Delivery, Ocean Rescue, Mountain Quest

Add more by editing `public/stories/stories.json`.

## Speech Tuning

`src/utils/speechMatch.js:scoreReading` blends `wordScore*0.6 + charAcc*0.2 + (1-WER)*0.2`.  
Thresholds in `storage.js` defaults: `passThreshold 0.78` (perfect=10), `goodThreshold 0.55` (good=7). Adjust in Parent Dashboard slider. Generous by design — encouragement > strictness.

Tested:
- Exact match → 100% perfect
- Missing 1 of 6 words → ~85% perfect
- 3 of 4 words → ~75% good
- One typo → tolerant via edit-distance 1

## Parent Dashboard

Hold **⚙️** in header ~1s. Shows:

- Sentences read, avg accuracy, stories done, fuel/flights/stars
- Recent reads with grade
- Settings: strictness slider, fuel per flight (20/28/35), dyslexia font, sounds
- Clear progress

No account, no cloud storage of voice.

## Child UX

- ≥28px sentences, one at a time, minimal chrome
- Big mic button with pulsing when listening, propeller feel
- Warm copy: “Amazing! +10 fuel!” never “Incorrect”
- Word tap 🔊 for help, “Hear it” whole sentence
- No timers, unlimited retries, always forward progress
- 5 max flights hint in footer, no pressure

## Build Phases (per plan)

- **Phase 0 Prep** — Scaffold Vite+React+Tailwind, 15 stories, file structure ✓
- **Phase 1 MVP** — Reader UI, mic + fuzzy matcher, fuel + flight, local save ✓
- **Phase 2 Polish** — Word feedback, TTS, hangar, map, sounds, illustrations ✓
- **Phase 3 Evaluate** — Parent dashboard, tunable economy, offline local ✓

## Next Ideas (V2/V3 from plan)

- Downloadable story packs, custom sentences (family names)
- Multi-child profiles, streaks, adaptive difficulty
- Whisper.cpp on-device fallback for better kid-voice accuracy

## Privacy

Child voice: processed via browser Web Speech API (may require internet per browser). No audio stored. No external POST. Comply with COPPA: opt-in, local only, no account.

## License

MIT — original stories, no copyrighted text.
