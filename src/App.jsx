import { useEffect, useRef, useState } from "react";
import stories from "./data/stories.json";
import Library from "./components/Library.jsx";
import StoryReader from "./components/StoryReader.jsx";
import Hangar from "./components/Hangar.jsx";
import MapView from "./components/MapView.jsx";
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
import { speak } from "./utils/sounds.js";

export default function App() {
  const [pilotId, setPilotId] = useState("first");
  const [progress, setProgress] = useState(() => loadProgress("first"));
  const [view, setView] = useState("library");
  const [activeStory, setActiveStory] = useState(null);
  const [showParent, setShowParent] = useState(false);
  const [toast, setToast] = useState(null);
  const [joyFlight, setJoyFlight] = useState(false);
  const [celebration, setCelebration] = useState(null);
  const holdTimer = useRef(null);
  const pilot = PILOTS.find((p) => p.id === pilotId);
  const canFly = progress.currentFuel >= progress.settings.flightFuelRequired;
  const playing = view === "reading" || joyFlight;

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
    window.speechSynthesis?.cancel();
    setPilotId(id);
    setProgress(loadProgress(id));
    setCelebration(null);
    setToast(null);
    setView("library");
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
            if (!playing) setView("library");
          }}
        >
          <span className="brand-icon" aria-hidden="true">
            ✈
          </span>
          <span>
            Reading Racer<small>A little reading. A big adventure.</small>
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
            ["library", "📚", "Read & play"],
            ["hangar", "🛩️", "My planes"],
            ["map", "🌍", "My places"],
          ].map(([key, emoji, label]) => (
            <button
              key={key}
              aria-current={view === key ? "page" : undefined}
              onClick={() => {
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
              soundEnabled={progress.settings.soundEnabled}
              onDone={({ ringsCollected }) => {
                finishFlight(ringsCollected);
                setJoyFlight(false);
              }}
            />
          </div>
        ) : (
          <>
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
              />
            )}
            {view === "map" && <MapView progress={progress} />}
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
          stories={stories}
          onUpdateSettings={updateSettings}
          onClearProgress={() => {
            if (
              !confirm(`Clear ${pilot.name}'s progress? This cannot be undone.`)
            )
              return;
            clearProgress(pilotId);
            setProgress(loadProgress(pilotId));
            setShowParent(false);
          }}
          onClose={() => setShowParent(false)}
        />
      )}
    </div>
  );
}
