import { useEffect, useRef, useState } from "react";
import { GAMES } from "../data/games.js";
import { PILOTS } from "../utils/storage.js";
import {
  speak,
  speakSequence,
  stopSpeech,
  playSuccess,
} from "../utils/sounds.js";
export default function MissionPlayer({
  initialMission,
  soundEnabled,
  onSave,
  onComplete,
  onExit,
}) {
  const [mission, setMission] = useState(initialMission);
  const [answer, setAnswer] = useState(initialMission.scratch?.answer ?? null),
    [feedback, setFeedback] = useState(initialMission.scratch?.feedback || "");
  const [count, setCount] = useState(initialMission.scratch?.count || 0),
    [sequence, setSequence] = useState(initialMission.scratch?.sequence || []),
    [help, setHelp] = useState(initialMission.scratch?.help || 0),
    [misses, setMisses] = useState(initialMission.scratch?.misses || 0),
    [explained, setExplained] = useState(
      initialMission.scratch?.explained || false,
    );
  const [rotation, setRotation] = useState(
      initialMission.scratch?.rotation || 0,
    ),
    [creation, setCreation] = useState(initialMission.scratch?.creation || []);
  const [joined, setJoined] = useState(initialMission.scratch?.joined || false);
  const committed = useRef(false),
    heading = useRef(null);
  const saveRef = useRef(onSave);
  useEffect(() => {
    saveRef.current = onSave;
  }, [onSave]);
  useEffect(() => {
    if (!committed.current)
      saveRef.current({
        ...mission,
        scratch: {
          answer,
          feedback,
          count,
          sequence,
          help,
          misses,
          explained,
          rotation,
          creation,
          joined,
        },
      });
  }, [
    mission,
    answer,
    feedback,
    count,
    sequence,
    help,
    misses,
    explained,
    rotation,
    creation,
    joined,
  ]);
  const q = mission.rounds[mission.index],
    game = GAMES.find((g) => g.id === mission.gameId),
    pilot = PILOTS.find((p) => p.id === q.pilotId);
  function listen() {
    speakSequence([
      ...(mission.together ? [`${pilot.name}’s turn.`] : []),
      ...(q.phonemes
        ? [q.prompt, ...q.phonemes.map((p) => `phoneme:${p}`)]
        : [q.story ? `${q.story} ${q.prompt}` : q.prompt]),
    ]);
  }
  useEffect(() => {
    heading.current?.focus();
    if (soundEnabled)
      speakSequence([
        ...(mission.together
          ? [`${PILOTS.find((p) => p.id === q.pilotId).name}’s turn.`]
          : []),
        ...(q.phonemes
          ? [q.prompt, ...q.phonemes.map((p) => `phoneme:${p}`)]
          : [q.story ? `${q.story} ${q.prompt}` : q.prompt]),
      ]);
    return stopSpeech;
  }, [q, soundEnabled, mission.together]);
  function check(value) {
    if (answer !== null) return;
    if (String(value) === q.answer) {
      setAnswer(String(value));
      setFeedback("You found it!");
      if (soundEnabled) {
        playSuccess();
        speakSequence([
          "You found it!",
          ...(q.create
            ? ["Make your own repeating runway. Say its rule!"]
            : []),
          ...(q.explain ? ["You can tell someone why you chose it."] : []),
        ]);
      }
    } else {
      setMisses((m) => m + 1);
      setFeedback("Let’s try again. You can listen or ask for a clue.");
      if (soundEnabled)
        speak("Let’s try again. You can listen or ask for a clue.");
      if (q.sequence) setSequence([]);
    }
  }
  function choose(o) {
    if (q.sequence) {
      const next = [...sequence, o.id];
      setSequence(next);
      if (next.length === q.options.length) check(next.join(","));
    } else check(o.id);
  }
  function next() {
    if (committed.current || answer === null) return;
    committed.current = true;
    const result = {
      questionId: q.id,
      pilotId: q.pilotId,
      tier: q.tier,
      independent: misses === 0 && help === 0,
      helpRequests: help,
      misses,
      explained: q.explain && explained,
    };
    const updated = {
      ...mission,
      results: [...mission.results, result],
      index: mission.index + 1,
      scratch: null,
    };
    if (updated.index === updated.rounds.length) {
      stopSpeech();
      onComplete(updated);
      return;
    }
    onSave(updated);
    setMission(updated);
    setAnswer(null);
    setFeedback("");
    setCount(0);
    setSequence([]);
    setHelp(0);
    setMisses(0);
    setExplained(false);
    setJoined(false);
    setRotation(0);
    setCreation([]);
    committed.current = false;
  }
  return (
    <section className="mission-player">
      <div className="reader-toolbar">
        <button
          className="quiet-button"
          onClick={() => {
            stopSpeech();
            onExit();
          }}
        >
          ⌂ Save & home
        </button>
        <div
          className="mission-steps"
          aria-label={`Step ${mission.index + 1} of 5`}
        >
          {mission.rounds.map((_, i) => (
            <span key={i} className={i <= mission.index ? "filled" : ""}>
              {i < mission.index ? "✓" : i + 1}
            </span>
          ))}
        </div>
        <span>
          {pilot.emoji} {mission.together ? `${pilot.name}’s turn` : game.name}
        </span>
      </div>
      <div className="question-card">
        <span className="eyebrow">
          {game.emoji} {game.name}
        </span>
        <h1 ref={heading} tabIndex={-1}>
          {q.prompt}
        </h1>
        <button className="listen-button" onClick={listen}>
          🔊{" "}
          {q.phonemes
            ? "Hear the sounds"
            : q.story
              ? "Hear the story"
              : "Listen"}
        </button>
        {q.story && (
          <details className="mini-story">
            <summary>📖 Story words</summary>
            <p>{q.story}</p>
          </details>
        )}
        {q.scene && (
          <div
            className={`question-scene ${q.scene.length > 15 ? "long-scene" : ""}`}
            style={{ transform: `rotate(${rotation}deg)` }}
            aria-label={q.counter ? "Your cargo plane" : undefined}
          >
            {q.scene}
          </div>
        )}
        {q.rotate > 0 && (
          <button
            className="quiet-button"
            onClick={() => setRotation((r) => r + 45)}
          >
            ↻ Turn the shape
          </button>
        )}
        {q.compose && (
          <div className="shape-pieces">
            <svg
              width="240"
              height="100"
              viewBox="0 0 240 100"
              role="img"
              aria-label="Two pieces to turn and slide together"
            >
              <g
                transform={`translate(${q.id === "compose-square" && joined ? 75 : 20},10) rotate(${rotation},40,40)`}
                fill="#8970c8"
              >
                {q.id === "compose-square" ? (
                  <polygon points="0,0 80,80 0,80" />
                ) : (
                  <rect width="80" height="80" />
                )}
              </g>
              <g
                transform={`translate(${q.id === "compose-square" && joined ? 75 : joined ? 100 : 135},10)`}
                fill="#53aebb"
              >
                {q.id === "compose-square" ? (
                  <polygon points="0,0 80,0 80,80" />
                ) : (
                  <rect width="80" height="80" />
                )}
              </g>
            </svg>
            <button
              className="quiet-button"
              onClick={() => setRotation((r) => r + 90)}
            >
              ↻ Turn a piece
            </button>
            <button
              className="quiet-button"
              onClick={() => setJoined((j) => !j)}
            >
              {joined ? "↔ Pull apart" : "↔ Slide together"}
            </button>
          </div>
        )}
        {q.frame !== undefined && (
          <div
            className="ten-frame"
            aria-label={`${q.frame} full spaces in a ten frame`}
          >
            {Array.from({ length: 10 }, (_, i) => (
              <span key={i}>{i < q.frame ? "📦" : ""}</span>
            ))}
          </div>
        )}
        {q.groups && (
          <div className="math-crates">
            <span>{"📦".repeat(q.groups[0])}</span>
            <b>{q.subtract ? "−" : "+"}</b>
            <span>{"📦".repeat(q.groups[1])}</span>
          </div>
        )}
        {q.segment && (
          <div className="sound-counters">
            {q.phonemes.map((p, i) => (
              <button
                key={i}
                aria-label={`Sound ${i + 1}`}
                onClick={() => speak(`phoneme:${p}`)}
              >
                {i + 1} ●
              </button>
            ))}
            <p>Tap each sound. Say the word.</p>
          </div>
        )}
        {q.counter ? (
          <>
            <div className="cargo-display" aria-live="polite">
              {"📦".repeat(count) || "Your empty cargo bay"}
              <b>{count}</b>
            </div>
            <div className="counter-controls">
              <button
                className="quiet-button"
                aria-label="Remove one crate"
                disabled={count === 0 || answer !== null}
                onClick={() => setCount((c) => c - 1)}
              >
                −
              </button>
              <button
                className="primary-button"
                aria-label="Add one crate"
                disabled={count === q.max || answer !== null}
                onClick={() => {
                  setCount((c) => c + 1);
                  speak(String(count + 1), soundEnabled);
                }}
              >
                ＋ 📦
              </button>
              <button
                className="primary-button"
                disabled={answer !== null}
                onClick={() => check(count)}
              >
                Check my cargo
              </button>
            </div>
          </>
        ) : (
          <div className="answer-options">
            {q.options.map((o) => (
              <div className="option-wrap" key={o.id}>
                <button
                  className={`answer-button ${answer === o.id ? "correct" : ""}`}
                  disabled={answer !== null || sequence.includes(o.id)}
                  onClick={() => choose(o)}
                >
                  <span
                    className="answer-picture"
                    style={
                      q.gameId === "shapes" && !q.compose
                        ? {
                            transform: `rotate(${(q.rotate || 0) + rotation}deg)`,
                          }
                        : undefined
                    }
                  >
                    {o.picture}
                  </span>
                  {o.picture !== o.label && <span>{o.label}</span>}
                  {sequence.includes(o.id) && (
                    <b>{sequence.indexOf(o.id) + 1}</b>
                  )}
                </button>
                <button
                  className="option-listen"
                  aria-label={`Hear ${o.label}`}
                  onClick={() => speak(o.label)}
                >
                  🔊
                </button>
              </div>
            ))}
          </div>
        )}
        {q.sequence && sequence.length > 0 && answer === null && (
          <button className="quiet-button" onClick={() => setSequence([])}>
            ↶ Start the order again
          </button>
        )}
        {answer !== null && q.letter && (
          <button
            className="letter-sound quiet-button"
            onClick={() =>
              speakSequence([
                `The letter ${q.letter} makes this sound.`,
                `phoneme:${q.letter}`,
              ])
            }
          >
            🔊{" "}
            <b>
              {q.letter.toUpperCase()} {q.letter}
            </b>{" "}
            Hear its sound
          </button>
        )}
        {answer !== null && q.create && (
          <div className="pattern-builder">
            <p>Make your own repeating runway. Say its rule!</p>
            <div>
              {creation.length
                ? [...creation, ...creation, ...creation].join(" ")
                : "Your runway goes here"}
            </div>
            {q.options.map((o) => (
              <button
                className="quiet-button"
                key={o.id}
                disabled={creation.length === 3}
                onClick={() => setCreation((c) => [...c, o.picture])}
              >
                {o.picture}
              </button>
            ))}
            {creation.length > 0 && (
              <button
                className="quiet-button"
                onClick={() =>
                  speakSequence(
                    [...creation, ...creation].map(
                      (p) => q.options.find((o) => o.picture === p).label,
                    ),
                  )
                }
              >
                🔊 Hear my pattern
              </button>
            )}
            <button className="quiet-button" onClick={() => setCreation([])}>
              ↶ Clear
            </button>
          </div>
        )}
        {answer !== null && q.explain && (
          <label className="explanation-check">
            <input
              type="checkbox"
              checked={explained}
              onChange={(e) => setExplained(e.target.checked)}
            />{" "}
            I told someone why. <small>Optional</small>
          </label>
        )}
        <div role="status" className="mission-feedback">
          {feedback}
          {help > 0 && answer === null && <p>{q.hint}</p>}
        </div>
        <div className="question-actions">
          <button
            className="quiet-button"
            onClick={() => {
              setHelp((h) => h + 1);
              speak(q.hint);
            }}
          >
            💡 Help me
          </button>
          {answer !== null && (
            <button className="primary-button" onClick={next}>
              {mission.index === 4 ? "🎉 Finish my mission" : "Next →"}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
