# Reading Racer ✈️

Read a little, fill your fuel tank, then fly through rings. A React/Vite game for early readers, with a laptop layout and responsive phone layout.

## Run on this laptop

Use a current Node.js version supported by Vite 8 (Node 22.12+ or newer supported LTS).

```sh
npm ci
npm run build
npm run desktop
```

The desktop launcher serves the built game only on `127.0.0.1:4173` and opens Chrome/Chromium/Edge in a separate app window. Keep the terminal running. If no supported browser is found, open the printed URL yourself. This is a browser-backed desktop app launcher, not a native installer. You can also use your browser's Install app action on the production URL when available.

```sh
npm run dev       # development
npm run test      # progress, profile and game-data regression checks
npm run lint
npm run build
npm run preview
```

## Child play flow

- Pick **🐻 Little Pilot** or **🦊 Super Pilot**; each has a separate local save.
- Fresh Little Pilot saves start with First words and listen-and-practice. Super Pilot starts with Short stories and the microphone. Existing saves stay with Little Pilot.
- Choose **Let’s read** or **Keep reading**. Read one sentence at a time. Tap a word or Listen for audio help.
- Microphone mode checks spoken attempts where the browser supports recognition. Practice mode lets the child say the words and tap **I said it!**; these steps are unscored.
- Tap Next to bank fuel. Retries do not add extra fuel within that step. At a full tank, choose a flight or keep reading.
- Tap **Take off**, steer with left/right arrows, A/D, on-screen buttons, or drag. Pause for a break. Leaving the window pauses the flight.
- Finish a story to earn a sticker; collect stars and unlock planes. Stop and come back at the saved reading step.

Hold the settings gear briefly, or focus it and press Enter, to open the parent view. It shows microphone matching separately from practice. These percentages reflect speech recognition, not a reading assessment. Clear progress affects only the selected pilot.

## Offline and privacy

Production builds generate a service worker that caches the game, stories and graphics after a successful first visit. Refresh once after initial loading if necessary. The built game can then reload without an internet connection while its cached version remains installed. Development mode does not install the service worker.

Progress stays in LocalStorage for this browser and URL; clearing browser data removes it. Saves do not automatically transfer between development (`5173`), desktop (`4173`), a hosted site, or a different browser. The app does not record audio, but browser speech recognition may send voice to the browser vendor and require internet. Listen uses device/browser voices; availability offline depends on the installed voice. Practice mode continues without recognition.

## iPhone

The layout adapts to smaller screens, but physical iPhone testing and native iOS packaging remain future work. A phone needs a hosted HTTPS URL for reliable microphone permission; localhost on the laptop is not reachable from the phone. Use runtime feature detection and retain practice mode rather than assuming a browser supports recognition.

## Code and content

- `src/App.jsx`: app shell, pilot switching, reading and flight flow.
- `src/components/Library.jsx`: recommended story, resume, difficulty groups.
- `src/components/StoryReader.jsx`: one sentence, word audio, practice and recognition feedback.
- `src/components/FlightView.jsx`: canvas flight, start/pause and steering.
- `src/utils/storage.js`: separate local saves and rewards.
- `src/data/stories.json`: original stories, grouped into levels 0–3.
- `scripts/offline-plugin.mjs`: build-specific offline cache.
- `scripts/desktop.mjs`: local app-window launcher.

See [the review and learning roadmap](docs/LEARNING-ROADMAP.md) for additional games, subjects and the desktop/iPhone deployment path.
