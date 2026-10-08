# Desktop verification

Target: this Linux x64 laptop, 2026-10-08. Implementation: Reading Racer 2.0.0.

## Automated checks

- 18 tests: all six games at all three tiers have solvable questions and valid options; missions are deterministic for a saved session; co-op turns use individual levels; difficulty uses current-tier independent answers; incomplete/duplicate sessions do not award rewards; shared rewards retain separate records and another pilot's draft; backups round-trip and reject damaged missions; every current game prompt, option, clue, story sentence/word and phoneme has a bundled audio asset; legacy profiles, reading scoring and flight/story rewards remain covered.
- Linter: no warnings or errors.
- Vite production build: successful.
- Dependency audit: zero reported vulnerabilities. Only Electron is added for the native runtime; a separate installer framework was removed.
- Native application smoke: secure local custom protocol, two initial mission cards, bundled audio fetch/decoding, local save/read, no renderer Node access, and blocked remote fetch.
- Portable archive and Debian installer generated from the same build. The per-user application-menu launcher is installed on this laptop; the installed copy passes the same native smoke check. Debian metadata and launcher paths checked. Electron's sandbox stays enabled.

## Browser flow checks

At 1280×720, the pattern activity and its optional builder keep the primary actions in view. Verified:

- Counting all five steps, completion fuel and sticker, break/flight choices.
- Leaving and resuming an answered step, including cargo count and answer state.
- Shape turning/sliding, correct-answer feedback and a clue.
- ABC pattern answer, creating and hearing a repeating runway.
- Phoneme playback controls, separate sound counters and a blending clue.
- Story character, supported ending and three-event sequencing with numbered choices.
- Complete cooperative nature mission: alternating bear/fox turns, different levels, equal rewards, a sticker visible in the other pilot's book, and separate practice/clue totals.
- Paint and aircraft choice, flight takeoff and pause.
- Parent settings keyboard entry and game level selection; checked practice separated from unscored reading. Backup validation is automated; browser download/export is a user action.

No test here verifies a child's pronunciation, comprehension, enjoyment or the naturalness of synthetic voices. Test the phonics clips together and observe one play session per child. iPhone and other desktop OS builds remain outside this Linux phase.
