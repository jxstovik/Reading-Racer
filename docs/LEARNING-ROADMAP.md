# Reading Racer: desktop roadmap

The desktop implementation is complete for the six subjects, short missions, sibling turns, shared rewards, parent practice records and Linux distribution. Ages 4 and 6 guide starting difficulty; individual practice and parent settings determine challenge.

## Implemented games

| Game | Starting practice | Growing skills | New challenges |
| --- | --- | --- | --- |
| Sound Safari | Rhymes and beginning sounds with two pictures | Beginning sounds and letter links | Blend phonemes and tap sound counters |
| Cargo Count | Load 1–5 crates and count aloud | Make ten and compare loads | Pictured addition/subtraction within 20 |
| Shape Hangar | Circle, triangle and square matching | Corners, sides and rotation | Compose with pieces, turn and slide them |
| Pattern Runway | AB patterns | AAB patterns | ABC patterns and a personal repeating runway |
| Story Detective | Characters and two-picture ordering | First-event ordering | Three-event sequencing, who/why and supported endings |
| Nature Rescue | Habitats | Plant needs and weather | Reasoning with optional self-reported explanation |

All prompts, options, clues, mini-stories, story sentences and word help have bundled synthetic narration. Sound clips use explicit phonemes rather than letter-name TTS. Local generated audio works in the standalone app with remote requests blocked. Human narration is a future polish option; synthetic phonics needs a family listening check before independent use.

## Independent play and returning to the game

Implemented: two suggested missions, five-step sessions, saved unfinished work, a mixture of familiar and current-level challenges, supportive clues/retries, completion stickers and fuel, break choices, individual profiles, alternating cooperative turns, plane paints, cosmetic aircraft choices, sticker book and flight destinations. There is no competitive leaderboard, streak loss or expiring reward.

Adaptive levels use first-choice answers without clues, at the current tier. They do not use speech-recognition estimates. Parent controls can override each pilot's level and flight pace. Practice records distinguish checked picture/number answers, unscored reading, and self-reported nature explanations. Neither synthetic speech nor automatic recognition is represented as a validated reading assessment.

## Desktop distribution

Completed: sandboxed Electron application, offline local content, secure custom protocol, renderer isolation, denied remote requests and microphone permissions, portable Linux x64 archive, Ubuntu/Debian installer, application-menu launcher, and backups for moving browser progress to the standalone application. A package smoke check verifies the native window, local content and saved data.

## iPhone phase

Still to do: install and test on the physical iPhone, verify touch/audio and safe-area behavior, choose HTTPS PWA or an iOS wrapper, and verify platform-specific storage and speech behavior. The shared React content and picture-first mission engine can carry forward.

## Family validation

Observe each child selecting their avatar, listening to a prompt, choosing an answer, requesting a clue, resuming a mission, steering a flight and taking a break. Watch sibling handoffs and listen to the phonics clips together. Note any instruction you must explain. Short missions target a few minutes but have no timer. Child testing is required before claiming improved learning outcomes.

The initial subject choices were informed by [Reading Rockets sound activities](https://www.readingrockets.org/literacy-home/reading-101-guide-parents/your-pre-kindergarten-child/phonological-and-phonemic) and [NAEYC playful mathematics](https://www.naeyc.org/resources/pubs/yc/jul2017/playful-math-early-learning). The game is practice content rather than a tested curriculum.
