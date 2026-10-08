# Reading Racer: laptop review and learning roadmap

This first pass makes the existing reading-and-flying loop easier to use independently. Age is a starting point, not a fixed ability level; adjust each pilot's story level after playing together once.

## Review of the original game

- Reading pages showed up to five sentences alongside a large illustration and vertically stacked controls. Important actions could require scrolling. The new reader presents one sentence in a wide workspace, with a smaller illustration beside it.
- Library choices used numerical levels and many equally prominent cards. The new home recommends a short story or resumes an unfinished one, with named difficulty groups and audio for titles.
- Microphone failures required a parent to approve every attempt. Listen-and-practice now lets a child continue; it does not claim to verify reading. Fresh Little Pilot saves start here. Super Pilot starts with a microphone, with the same fallback available.
- Feedback used red struck-through words and percentages. Child feedback now underlines words for optional audio help and acknowledges that recognition can miss words.
- Repeated attempts could award repeated fuel before moving on. Fuel is committed once when advancing from a sentence, including the flight path.
- Flight started immediately; portrait canvas sizing was distorted by a conflicting height cap and steering keys could scroll the page. Flights now wait for Take off, preserve canvas proportions, pause on window focus loss, and suppress arrow-key scrolling.
- Both siblings shared one save. There are now two separate pilot saves; existing v1 progress stays with Little Pilot.
- The app advertised offline use but had no service worker and relied on remote fonts. Production builds now precache the entire game and use local/system fonts. Speech recognition may still need internet; device speech voices also vary.

## Next games, in suggested order

| Subject and game | Starting version for age 4 | Extension for age 6 | Learning goal |
| --- | --- | --- | --- |
| **Sound Safari** | Hear two spoken words; choose which rhymes. Match a beginning sound to one of two pictures. | Blend spoken sounds into a word; separate sounds with counters; link sounds to letters. | Phonological awareness, then phonics. Use recorded phoneme audio: general text-to-speech often reads letters as names. |
| **Cargo Count** | Put 1–5 crates into a plane; tap each crate while counting. | Make 10, compare loads, add or remove pictured crates up to 20. | One-to-one counting, quantities, early operations. |
| **Shape Hangar** | Match circles, triangles, and squares to hangar doors. | Rotate pieces, compose shapes, compare corners and sides. | Spatial reasoning and geometry. |
| **Pattern Runway** | Complete AB patterns using colors or animal pictures. | AAB / ABC patterns; describe the rule, then make your own. | Pattern recognition and early mathematical reasoning. |
| **Story Detective** | After a narrated mini-story, choose the character or put two pictures in order. | Sequence three events; answer who/why; choose an ending supported by the story. | Listening comprehension, vocabulary, reading meaning. |
| **Nature Rescue** | Sort animals by habitat with pictures and narration. | Predict what a plant needs or choose clothing for weather; explain a choice aloud. | Observation, classification, and cause/effect. |

Sound games are a strong next step for a child who is not yet decoding sentences. Reading Rockets describes rhyme, syllable and sound activities as pre-reading practice: https://www.readingrockets.org/literacy-home/reading-101-guide-parents/your-pre-kindergarten-child/phonological-and-phonemic

The counting, shape and pattern suggestions apply the playful math approach described by NAEYC. These specific game concepts are design proposals, not a tested curriculum: https://www.naeyc.org/resources/pubs/yc/jul2017/playful-math-early-learning

## Keep them coming back

- Offer a choice between two small missions, rather than a wall of subjects.
- Target a satisfying 3–5 minute mission: a few learning steps, one flight, one sticker, and a clear chance to stop.
- Mix familiar material with one new challenge; adjust from successful independent attempts, not microphone scores alone.
- Use shared airplane/sticker rewards across subjects. Add cosmetic plane colors before increasing speed; speed should not make the game harder for the younger child.
- Add optional two-player turns so the siblings can deliver cargo together without comparing scores.
- Use a sticker book and story destinations; avoid daily streak loss or pressure to keep playing.
- Retain a parent view of practiced skills and help requests. Self-reported practice should stay separate from assessed work.

## Deployment path

1. **Laptop now:** production build with a local-only launcher opens Chrome/Edge in an app window. The same build supports browser installation as a PWA. Keep port 4173 consistent because browser saves belong to an origin.
2. **Desktop distribution next:** an installer/launcher shortcut and a bundled local runtime, or a hosted HTTPS PWA. Test the children's actual microphone and locally installed speech voices. Native packaging is a separate step, not completed in this pass.
3. **iPhone later:** test this responsive build on the physical iPhone before selecting a wrapper. Start with an HTTPS PWA; choose a native iOS wrapper only if App Store distribution or dependable native speech makes it worthwhile. Do not assume all iPhone browsers support recognition equivalently. Keep the practice path independent of recognition.

## Observe one play session

Watch each child choose their own avatar, start a story, request word help, continue after a microphone failure, start/steer/pause a flight, and return home. Note any instruction you need to explain. This browser pass verifies the controls; real child speech, comprehension, and enjoyment need observation before claiming improved learning outcomes.
