# Reading Racer ✈️

Offline learning adventures for two little pilots. Choose a short mission, earn fuel and a sticker, then fly. The desktop app includes its own runtime and narration; it needs no terminal or internet to play.

## Install on this Linux laptop

The built files are in `release/`:

- **Portable:** extract `Reading-Racer-2.0.0-x64.tar.gz`, open the folder, and double-click `reading-racer`. Run `./install-desktop.sh` once to add Reading Racer to your application menu. No administrator access is needed. Keep Linux user namespaces enabled; the portable package preserves Electron's sandbox.
- **Ubuntu/Debian installer:** open `Reading-Racer-2.0.0-amd64.deb` in your software installer. This installs the application and launcher for the computer. Administrator access is required by the OS installer.

Existing browser progress stays where it is. In the browser's Parent Settings, **Export both pilots**, then **Restore backup** in the desktop app. Restoration explicitly asks before replacing both saves. Browser storage and desktop storage are separate.

## Build or develop

Use Node 22.12+ or a newer Vite-supported LTS, and npm.

```sh
npm ci
npm run dev
npm test
npm run lint
npm run build
npm run desktop          # standalone Electron window
npm run desktop:smoke    # verifies the native window, local assets and storage
npm run desktop:pack     # Linux x64 portable archive and .deb (requires tar, dpkg-deb)
npm run desktop:browser  # optional local Chrome/Edge app window on port 4173
```

The packaging script copies the official Electron runtime and the compiled game. It needs no installer framework or native application dependencies at runtime. Electron's Chromium sandbox, context isolation and web security stay enabled. The renderer cannot access Node, open other pages, or make remote network requests. The desktop app uses offline listen-and-practice reading; online speech recognition remains an optional browser feature.

## Play and learn

- **🐻 Little Pilot / 🦊 Super Pilot:** independent local saves. Existing v1 saves are preserved under Little Pilot. Age is a starting point; set each pilot's difficulty to fit their current skills.
- **Play:** two suggested missions at a time, with Other missions to choose any of the six subjects. Each mission has five steps, spoken prompts, picture choices, clues, and supportive retries.
- **Sound Safari:** rhymes, beginning sounds, sound/letter links, blending and separate sound counters.
- **Cargo Count:** load 1–5 crates with spoken counting, make ten, compare quantities, and pictured addition/subtraction within 20.
- **Shape Hangar:** identify shapes, compare corners/sides, turn shapes, and move/rotate pieces to compose a shape.
- **Pattern Runway:** AB, AAB and ABC patterns, then build and hear your own repeating runway.
- **Story Detective:** narrated mini-stories, characters, two-event ordering, three-event sequencing, reasons, and supported endings.
- **Nature Rescue:** animal habitats, plant needs and weather decisions. Optional spoken explanations are self-reported; the app does not record or assess them.
- **Play together:** alternate bear/fox turns, each using their own difficulty. Both earn a sticker and equal fuel; their practice records remain separate.
- **Stories:** 35 stories with one sentence at a time, word audio and a saved reading position. Practice reading is unscored.
- **Flight:** choose Take off. Steer with arrows, A/D, drag or large buttons. Pause any time; leaving the window pauses automatically. Plane paint and models are cosmetic. A parent can choose Gentle or Brisk pace independently.
- **Rewards:** every completed mission earns 35 fuel and a sticker. Story and mission completions share plane unlocks. Aircraft also unlock through flights. Nothing expires and there are no streak penalties. Completion offers a flight, another mission, or a clear break activity.

Mission progress includes choices, cargo counts, clues and retries, so resuming does not turn supported practice into an independent answer. Starting another subject retains unfinished missions. Automatic difficulty mixes familiar questions with the current challenge. It moves up after at least five answers at that tier with 80% independent success, and down below 40%, using up to ten recent answers at the tier. Microphone matching never drives this progression. Manual difficulty is available in Parent Settings.

Hold the gear briefly, or focus it and press Enter, to open Parent Settings. It shows practiced skills, independent answers, clue requests, and reading practice separately from microphone estimates. Clear progress affects the selected pilot; backup restoration affects both pilots after confirmation.

## Offline audio, saves and privacy

The standalone app bundles every game prompt, story sentence, word-help clip and phoneme clip. These are **synthetic American English voices**, generated with eSpeak NG, rather than human recordings. Phonemes use explicit phonetic input rather than letter-name TTS. Continuous consonants are sustained and stop consonants remain short, without added spoken vowels. Try the sounds together once; human voice recordings can replace assets without changing the game engine.

To regenerate narration on Linux, install the build-only system libraries `libespeak-ng1`, `espeak-ng-data` and `libsndfile1`, then run:

```sh
node scripts/audio-texts.mjs
python3 scripts/generate-audio.py
```

The shipped Ogg assets need none of those libraries in the installed game. Known content uses bundled audio; other dynamic browser text can fall back to system speech. Browser production builds precache the full game and audio after a successful first visit. Close all game tabs to activate a newer cached version. Development does not register a service worker. The native app reads its bundled files directly and does not use a service worker.

Progress lives in local storage on this device. Clearing app/browser storage removes it; export a backup before moving installations. No accounts, ads, analytics or audio recordings are added. Browser speech recognition may send voice to its provider; the standalone app denies microphone access and remote requests, and retains unscored practice.

## Verification and remaining platform work

Automated checks cover question correctness, stable sibling turns and levels, adaptive progression, duplicate rewards, independent saves, backup validation and offline audio coverage. Browser checks exercise the child flows; the packaged native smoke check verifies a secure local window, rendered missions, audio and persistent storage.

Actual child speech, comprehension, enjoyment and the naturalness of synthetic narration require a play session with your children. The implementation is a practice game, not a validated curriculum or reading assessment. iPhone installation, physical-device testing and native iOS packaging are the next platform phase.

See [the completed desktop roadmap](docs/LEARNING-ROADMAP.md) and [desktop verification notes](docs/DESKTOP-VERIFICATION.md).
