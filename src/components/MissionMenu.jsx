import { useState } from "react";
import { draftKey } from "../utils/learning.js";
import { GAMES } from "../data/games.js";
import { speak } from "../utils/sounds.js";
export default function MissionMenu({
  progress,
  pilot,
  onStart,
  onResume,
  onFly,
  onRead,
}) {
  const [all, setAll] = useState(false);
  const [together, setTogether] = useState(false);
  const recent = progress.learning.missions.slice(-2).map((m) => m.gameId);
  const choices = [
    ...GAMES.filter((g) => !recent.includes(g.id)),
    ...GAMES.filter((g) => recent.includes(g.id)),
  ];
  return (
    <section className="mission-home">
      <div className="mission-welcome">
        <div>
          <span className="eyebrow">
            {pilot.emoji} {pilot.name}
          </span>
          <h1>Where shall we fly?</h1>
          <p>Choose a little mission. Earn a sticker. Fly your plane!</p>
        </div>
        <span className="home-plane" aria-hidden="true">
          ✈️
        </span>
      </div>
      {progress.learning.draft && (
        <button className="primary-button resume-mission" onClick={onResume}>
          ▶ Finish my mission
        </button>
      )}
      <div className="mission-controls">
        <button
          className="quiet-button"
          aria-pressed={together}
          onClick={() => {
            setTogether(!together);
            speak(
              together
                ? "Your turn, pilot."
                : "Play together. Take turns with your friend.",
            );
          }}
        >
          {together ? "🐻 🦊 Together ✓" : "🐻 🦊 Play together"}
        </button>
        <button
          className="quiet-button"
          onClick={() =>
            speak("Choose a little mission. Earn a sticker. Fly your plane!")
          }
        >
          🔊 Listen
        </button>
      </div>
      <div className="mission-choices">
        {(all ? choices : choices.slice(0, 2)).map((g) => (
          <button
            className={`mission-card game-${g.id}`}
            key={g.id}
            onClick={() => onStart(g.id, together)}
          >
            <span className="mission-icon" aria-hidden="true">
              {g.emoji}
            </span>
            <h2>{g.name}</h2>
            <p>{g.invitation}</p>
            <span className="mission-play">
              {progress.learning.drafts?.[draftKey({ gameId: g.id, together })]
                ? "Keep going →"
                : "Let’s play →"}
            </span>
          </button>
        ))}
      </div>
      <div className="mission-bottom">
        <button className="quiet-button" onClick={() => setAll(!all)}>
          {all ? "Show two choices" : "🎲 Other missions"}
        </button>
        <button className="quiet-button" onClick={onRead}>
          📚 Read a story
        </button>
        {progress.currentFuel >= progress.settings.flightFuelRequired && (
          <button className="primary-button" onClick={onFly}>
            ✈️ Fly my plane
          </button>
        )}
      </div>
      <p className="mission-note">Five little steps. Play at your own pace.</p>
    </section>
  );
}
