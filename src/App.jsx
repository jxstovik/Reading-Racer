import { useEffect, useRef, useState } from "react";
import stories from "./data/stories.json";
import Library from "./components/Library.jsx";
import StoryReader from "./components/StoryReader.jsx";
import Hangar from "./components/Hangar.jsx";
import StickerBook from "./components/StickerBook.jsx";
import MissionMenu from "./components/MissionMenu.jsx";
import MissionPlayer from "./components/MissionPlayer.jsx";
import { makeMission, GAMES } from "./data/games.js";
import { finishMission, draftKey } from "./utils/learning.js";
import ParentDashboard from "./components/ParentDashboard.jsx";
import FlightView from "./components/FlightView.jsx";
import {
  loadProgress,
  saveProgress,
  addSentenceResult,
  consumeFuelForFlight,
  completeStory,
  clearProgress,
  getFlightDurationSeconds,
  PILOTS,
} from "./utils/storage.js";
import { speak, stopSpeech } from "./utils/sounds.js";

export default function App() {
  const [pilotId, setPilotId] = useState("first");
  const [progress, setProgress] = useState(() => loadProgress("first"));
  const [view, setView] = useState("home");
  const [mission, setMission] = useState(null);
  const [missionDone, setMissionDone] = useState(null);
  const [activeStory, setActiveStory] = useState(null);
  const [showParent, setShowParent] = useState(false);
  const [toast, setToast] = useState(null);
  const [joyFlight, setJoyFlight] = useState(false);
  const [celebration, setCelebration] = useState(null);
  const holdTimer = useRef(null);
  const pilot = PILOTS.find((p) => p.id === pilotId);
  const canFly = progress.currentFuel >= progress.settings.flightFuelRequired;
  const playing = view === "reading" || view === "mission" || joyFlight;

  useEffect(() => {
    saveProgress(progress, pilotId);
  }, [progress, pilotId]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(timer);
  }, [toast]);
  useEffect(() => () => clearTimeout(holdTimer.current), []);

  function switchPilot(id) {
    saveProgress(progress, pilotId);
    stopSpeech();
    setPilotId(id);
    setProgress(loadProgress(id));
    setCelebration(null);
    setMissionDone(null);
    setMission(null);
    setToast(null);
    setView("home");
  }
  function updateSettings(patch) {
    setProgress((p) => ({ ...p, settings: { ...p.settings, ...patch } }));
  }
  function selectStory(story) {
    setCelebration(null);
    setActiveStory(story);
    setView("reading");
  }
  function finishFlight(ringsCollected) {
    setProgress((p) => consumeFuelForFlight(p, ringsCollected));
    setToast(`⭐ ${ringsCollected || 3} stars earned. Nice flying!`);
  }
  function finishStory(storyId) {
    const story = stories.find((s) => s.id === storyId);
    setProgress((p) => {
      const next = completeStory(p, storyId);
      return {
        ...next,
        storyPositions: { ...next.storyPositions, [storyId]: 0 },
      };
    });
    setCelebration(story);
    setActiveStory(null);
    setView("library");
    speak(
      "You finished your story! Well done, pilot.",
      progress.settings.soundEnabled,
    );
  }
  function startMission(gameId, together) {
    const profiles = {
      first: loadProgress("first"),
      second: loadProgress("second"),
      [pilotId]: progress,
    };
    const key = draftKey({ gameId, together });
    const next =
      progress.learning.drafts[key] ||
      makeMission(gameId, profiles, pilotId, together);
    saveMission(next);
    setMissionDone(null);
    setView("mission");
  }
  function saveMission(next) {
    setMission(next);
    setProgress((p) => ({
      ...p,
      learning: {
        ...p.learning,
        draft: next,
        drafts: { ...p.learning.drafts, [draftKey(next)]: next },
      },
    }));
  }
  function completeMission(done) {
    // Save synchronously before leaving the completion screen; session ids prevent double rewards.
    const own = finishMission(progress, done, pilotId);
    saveProgress(own, pilotId);
    setProgress(own);
    if (done.together) {
      const other = pilotId === "first" ? "second" : "first";
      saveProgress(finishMission(loadProgress(other), done, other), other);
    }
    setMission(null);
    setMissionDone(done);
    setView("home");
    speak(
      "Your mission is complete! You earned a sticker. You can fly, play again, or take a break.",
      progress.settings.soundEnabled,
    );
  }
  function endHold() {
    clearTimeout(holdTimer.current);
  }
  function startHold() {
    endHold();
    holdTimer.current = setTimeout(() => setShowParent(true), 900);
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            if (!playing) setView("home");
          }}
        >
          <span className="brand-icon" aria-hidden="true">
            ✈
          </span>
          <span>
            Reading Racer<small>Little missions. Big adventures.</small>
          </span>
        </a>
        <div className="header-actions">
          {!playing && (
            <div className="pilot-switch" aria-label="Choose your pilot">
              {PILOTS.map((p) => (
                <button
                  key={p.id}
                  aria-label={p.name}
                  aria-pressed={p.id === pilotId}
                  onClick={() => switchPilot(p.id)}
                >
                  <span aria-hidden="true">{p.emoji}</span>
                  <span>{p.name}</span>
                </button>
              ))}
            </div>
          )}
          <button
            className="icon-button fullscreen-button"
            aria-label="Toggle full screen"
            title="Full screen"
            onClick={() => {
              if (document.fullscreenElement)
                document.exitFullscreen?.().catch(() => {});
              else
                document.documentElement.requestFullscreen?.().catch(() => {});
            }}
          >
            ⛶
          </button>
          <button
            className="icon-button"
            aria-label="Parent settings: hold or press Enter"
            title="Hold for parent settings"
            onPointerDown={startHold}
            onPointerUp={endHold}
            onPointerLeave={endHold}
            onPointerCancel={endHold}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setShowParent(true);
              }
            }}
            onContextMenu={(e) => e.preventDefault()}
          >
            ⚙
          </button>
        </div>
      </header>
      {!playing && (
        <nav className="main-nav" aria-label="Main menu">
          {[
            ["home", "🎲", "Play"],
            ["library", "📚", "Stories"],
            ["hangar", "🛩️", "My planes"],
            ["stickers", "⭐", "My stickers"],
          ].map(([key, emoji, label]) => (
            <button
              key={key}
              aria-current={view === key ? "page" : undefined}
              onClick={() => {
                stopSpeech();
                setMissionDone(null);
                setView(key);
                setCelebration(null);
              }}
            >
              <span aria-hidden="true">{emoji}</span>
              {label}
            </button>
          ))}
          <div
            className="nav-reward"
            aria-label={`${progress.starsCollected} stars collected`}
          >
            ⭐ {progress.starsCollected}
            <span>stars</span>
          </div>
        </nav>
      )}
      <main className={`app-main ${playing ? "play-main" : ""}`}>
        {joyFlight ? (
          <div className="flight-session">
            <button
              className="quiet-button"
              onClick={() => setJoyFlight(false)}
            >
              ⌂ Home
            </button>
            <FlightView
              level={1}
              durationSeconds={getFlightDurationSeconds(1)}
              skin={progress.settings.hangarSkin}
              planeColor={progress.settings.planeColor}
              pace={progress.settings.flightPace}
              soundEnabled={progress.settings.soundEnabled}
              onDone={({ ringsCollected }) => {
                finishFlight(ringsCollected);
                setJoyFlight(false);
              }}
            />
          </div>
        ) : (
          <>
            {view === "home" &&
              (missionDone ? (
                <section className="mission-celebration">
                  <div className="celebration-sticker">
                    {GAMES.find((g) => g.id === missionDone.gameId).emoji}
                  </div>
                  <h1>You did it, pilot!</h1>
                  <p>
                    A new sticker and fuel for your plane.
                    {missionDone.together && " You both earned a sticker!"}
                  </p>
                  <div className="mission-bottom">
                    {canFly && (
                      <button
                        className="primary-button"
                        onClick={() => {
                          setMissionDone(null);
                          setJoyFlight(true);
                        }}
                      >
                        ✈️ Fly my plane
                      </button>
                    )}
                    <button
                      className="quiet-button"
                      onClick={() => setMissionDone(null)}
                    >
                      🎲 Choose another mission
                    </button>
                    <button
                      className="quiet-button"
                      onClick={() => {
                        setView("break");
                        setMissionDone(null);
                        stopSpeech();
                      }}
                    >
                      🌳 Take a break
                    </button>
                  </div>
                </section>
              ) : (
                <MissionMenu
                  progress={progress}
                  pilot={pilot}
                  onStart={startMission}
                  onResume={() => {
                    setMission(progress.learning.draft);
                    setView("mission");
                  }}
                  onRead={() => setView("library")}
                  onFly={() => setJoyFlight(true)}
                />
              ))}
            {view === "break" && (
              <section className="mission-celebration">
                <div className="celebration-sticker">🌳</div>
                <h1>Time for a little adventure!</h1>
                <p>
                  Stretch like a tree. Find a shape in your room. Tell someone
                  your favorite part.
                </p>
                <button
                  className="primary-button"
                  onClick={() => setView("home")}
                >
                  ⌂ Back to my missions
                </button>
              </section>
            )}
            {view === "mission" && mission && (
              <MissionPlayer
                key={mission.id}
                initialMission={mission}
                soundEnabled={progress.settings.soundEnabled}
                onSave={saveMission}
                onComplete={completeMission}
                onExit={() => {
                  setMission(null);
                  setView("home");
                }}
              />
            )}
            {view === "library" && (
              <Library
                stories={stories}
                progress={progress}
                onSelect={selectStory}
                settings={progress.settings}
                onSettings={updateSettings}
                pilot={pilot}
                celebration={celebration}
                onFly={() => setJoyFlight(true)}
              />
            )}
            {view === "reading" && activeStory && (
              <StoryReader
                key={`${pilotId}:${activeStory.id}`}
                story={activeStory}
                progress={progress}
                settings={progress.settings}
                onSettings={updateSettings}
                onSentenceSuccess={(result) =>
                  setProgress((p) => addSentenceResult(p, result))
                }
                onPosition={(idx) =>
                  setProgress((p) => ({
                    ...p,
                    storyPositions: {
                      ...p.storyPositions,
                      [activeStory.id]: idx,
                    },
                  }))
                }
                onFlightDone={finishFlight}
                onStoryComplete={finishStory}
                onExit={() => {
                  setActiveStory(null);
                  setView("library");
                }}
              />
            )}
            {view === "hangar" && (
              <Hangar
                progress={progress}
                onSelectSkin={(skin) => updateSettings({ hangarSkin: skin })}
                onColor={(planeColor) => updateSettings({ planeColor })}
              />
            )}
            {view === "stickers" && (
              <StickerBook progress={progress} stories={stories} />
            )}
          </>
        )}
      </main>
      {!playing && (
        <footer className="app-footer">
          Made for curious little pilots · Progress saved on this laptop
          {canFly && " · Your plane is ready!"}
        </footer>
      )}
      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
      {showParent && (
        <ParentDashboard
          progress={progress}
          pilotId={pilotId}
          onRestore={() => {
            setProgress(loadProgress(pilotId));
            setJoyFlight(false);
            stopSpeech();
            setMission(null);
            setMissionDone(null);
            setActiveStory(null);
            setView("home");
          }}
          stories={stories}
          onUpdateSettings={updateSettings}
          onClearProgress={() => {
            if (
              !confirm(`Clear ${pilot.name}'s progress? This cannot be undone.`)
            )
              return;
            clearProgress(pilotId);
            setProgress(loadProgress(pilotId));
            setJoyFlight(false);
            setMission(null);
            setMissionDone(null);
            setActiveStory(null);
            setView("home");
            stopSpeech();
            setShowParent(false);
          }}
          onClose={() => setShowParent(false)}
        />
      )}
    </div>
  );
}
