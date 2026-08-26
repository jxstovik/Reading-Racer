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
npm run dev     # http://localhost:5173 (host 0.0.0.0 so phones can connect — see below)
npm run build
npm run preview # http://localhost:4173
npm run lint
```

Node 18+ required (tested with Node 26).

## 📱 Run from Phone (same Wi-Fi)

The app is a plain web app — no install needed. Mic uses the browser’s **Web Speech API**, so the phone just needs a modern browser.

### Option A — Dev server on your laptop, open on phone (fastest for testing)

1. **Connect both devices to the same Wi-Fi.**
2. On your **laptop** (the machine running the dev server):
   ```bash
   npm install
   npm run dev   # already runs as vite --host (0.0.0.0), see vite.config.js:5 and package.json:8
   # you’ll see:
   #  ➜  Local:   http://localhost:5173/
   #  ➜  Network: http://192.168.1.XX:5173/
   ```
   Note that `Network:` URL — that’s the one your phone uses.

3. **Find your laptop’s LAN IP if it’s not printed:**
   - **macOS / Linux:** `hostname -I | awk '{print $1}'` or `ip addr`
   - **Windows (PowerShell):** `ipconfig` → look under *Wireless LAN adapter Wi-Fi* → `IPv4 Address` e.g. `192.168.1.42`
   - **WSL2 (this repo lives in WSL):** WSL2 now forwards automatically, but if `192.168.x.x` doesn’t load on the phone you’re on old WSL NAT:
     - Easiest: open **PowerShell** on Windows and run `ipconfig`, use the *Windows* Wi-Fi IP (not the `172.20.x.x` that `hostname -I` inside WSL shows).
     - Or enable mirrored networking: add to `%USERPROFILE%\.wslconfig`:
       ```
       [wsl2]
       networkingMode=mirrored
       ```
       then `wsl --shutdown` and reopen.

4. **On your phone’s browser**, open `http://<that-ip>:5173` (e.g. `http://192.168.1.42:5173`).
   - **Android:** Chrome or Edge works best. Allow the microphone when prompted.
   - **iPhone / iPad:** Safari currently has **no Web Speech API** (it shows “Parent Tap” only). For full mic support on iOS, use **Chrome on iOS** (recent versions proxy to Apple’s engine and may work on iOS 18+) or just use **Parent Tap Mode** — tap “👨‍👩‍👧 Parent: Great job!” after your child reads aloud; fuel is awarded without mic.

5. **Firewall:** If the phone can’t connect, allow Node/Vite through the firewall:
   - **Windows Defender:** Windows prompts the first time you `--host`. Click *Allow*, or Settings → Firewall → Allow an app → Node.js.
   - **macOS:** System Settings → Network → Firewall → Options → allow `node`.

**HTTPS tip — mic needs “secure context” on some phones:** Chrome on Android lets mic work over plain `http://192.168.x.x` on LAN, but iOS Safari and some Android WebViews **require `https://`**. If mic says `not-allowed` / `not-supported` on the phone:

```bash
# easiest free https tunnel (pick one):
npx --yes cloudflared tunnel --url http://localhost:5173
# or
npx --yes localtunnel --port 5173
# or
npx --yes ngrok http 5173
```

Open the printed `https://…trycloudflare.com` URL on the phone instead. Mic will then be permitted.

### Option B — Production build for phone (more like real deploy)

```bash
npm run build
npm run preview   # preview is already --host, serves dist/ at http://<lan-ip>:4173
# then open http://<lan-ip>:4173 on the phone
```

Or deploy `dist/` anywhere static:

```bash
npx serve dist -l 4173 --cors
# or: python3 -m http.server 4173 --directory dist
```

To share beyond your house, deploy `dist/` to **Vercel / Netlify / GitHub Pages / Cloudflare Pages** — just upload `dist/`. HTTPS is then automatic, so phone mic works everywhere.

### Add to Home Screen (feels like an app, optional PWA)

- **iOS Safari:** Open the URL → Share → *Add to Home Screen*.
- **Android Chrome:** Menu → *Add to Home screen* or *Install app* (uses `public/manifest.webmanifest:1` + `index.html:8`).

Works offline for progress (LocalStorage), but fresh load still prefers network for fonts.

### Troubleshooting from a phone

| Phone says… | Fix |
|---|---|
| “Microphone not supported” / only shows Parent Tap | Expected on iOS Safari; use Parent Tap mode (intentionally encouraged per plan) or try Chrome. |
| `NotAllowedError` / mic silently fails | Must be `https://` on that phone. Use a `cloudflared` tunnel above, or deploy to a `https://` host. Also check browser mic permission in phone Settings → Privacy → Microphone. |
| Page never loads (`site can’t be reached`) | Phone + laptop not same Wi-Fi, wrong IP, or firewall blocked. Try laptop IP from `ipconfig`/`hostname -I`, ensure `vite.config.js:7` `host:true`, and temporarily disable firewall to test. |
| Can’t find IP behind WSL | See WSL note above — use Windows host IP, not the 172.x.x inside WSL. |
| Flight rings lag on old phones | Rings are Canvas 2D, very light; if slow, close other tabs. No fix needed — flight still 30–50s. |

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
