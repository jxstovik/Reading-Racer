import { useEffect, useMemo, useState } from "react";
import storiesData from "../public/stories/stories.json";
import Library from "./components/Library.jsx";
import StoryReader from "./components/StoryReader.jsx";
import FuelGauge from "./components/FuelGauge.jsx";
import Hangar from "./components/Hangar.jsx";
import MapView from "./components/MapView.jsx";
import ParentDashboard from "./components/ParentDashboard.jsx";
import { loadProgress, saveProgress, addSentenceResult, consumeFuelForFlight, completeStory, clearProgress, getFlightDurationSeconds } from "./utils/storage.js";
import FlightView from "./components/FlightView.jsx";

export default function App() {
  const [progress, setProgress] = useState(() => loadProgress());
  const [view, setView] = useState("library"); // library | reading | hangar | map
  const [activeStory, setActiveStory] = useState(null);
  const [showParent, setShowParent] = useState(false);
  const [parentHoldTimer, setParentHoldTimer] = useState(null);
  const [toast, setToast] = useState(null);
  const [joyFlight, setJoyFlight] = useState(null); // { level, duration } when a manual flight is active

  const stories = storiesData;

  // persist
  useEffect(() => {
    saveProgress(progress);
  }, [progress]);

  // toast auto clear
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  function handleSentenceSuccess({ storyId, sentenceIndex, score, grade, fuel }) {
    setProgress((p) => addSentenceResult(p, { storyId, sentenceIndex, score, grade, fuel }));
  }

  // flight consumption: called from StoryReader after FlightView done (now ring-aware)
  const progressWithFlight = useMemo(() => ({
    ...progress,
    onFlightDone: (ringsCollected) => {
      setProgress((p) => consumeFuelForFlight(p, typeof ringsCollected === "number" ? ringsCollected : null));
      const msg = typeof ringsCollected === "number"
        ? `✈️ Flight complete! ${ringsCollected} rings → stars!`
        : "✈️ Flight complete! Fuel used, stars earned!";
      setToast(msg);
    },
  }), [progress]);

  function handleStoryComplete(storyId) {
    setProgress((p) => completeStory(p, storyId));
    setToast(`🎉 Finished "${stories.find(s=>s.id===storyId)?.title}"! Sticker earned!`);
    setView("library");
    setActiveStory(null);
  }

  function handleSelectSkin(skin) {
    setProgress((p) => ({ ...p, settings: { ...p.settings, hangarSkin: skin } }));
    setToast(`✈️ Equipped ${skin}!`);
  }

  function handleSettingsUpdate(patch) {
    setProgress((p) => ({ ...p, settings: { ...p.settings, ...patch } }));
  }

  function handleClearProgress() {
    if (!confirm("Clear all progress? This cannot be undone.")) return;
    clearProgress();
    setProgress(loadProgress());
    setToast("Progress cleared");
    setShowParent(false);
  }

  // long-press for parent dashboard (hidden from child)
  function onParentPressStart() {
    const t = setTimeout(() => setShowParent(true), 900);
    setParentHoldTimer(t);
  }
  function onParentPressEnd() {
    if (parentHoldTimer) clearTimeout(parentHoldTimer);
    setParentHoldTimer(null);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-100 via-sky-50 to-amber-50">
      {/* header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b border-sky-100">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-white text-xl shadow">✈️</div>
            <div>
              <h1 className="font-black text-slate-800 leading-none text-lg">Reading Racer</h1>
              <p className="text-[11px] text-slate-500 font-semibold tracking-wide">FUEL YOUR AIRPLANE BY READING</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:block w-40">
              <FuelGauge current={progress.currentFuel} required={progress.settings.flightFuelRequired} total={progress.totalFuel} />
            </div>

            {/* parent hidden button: hold 900ms */}
            <button
              onMouseDown={onParentPressStart}
              onMouseUp={onParentPressEnd}
              onMouseLeave={onParentPressEnd}
              onTouchStart={onParentPressStart}
              onTouchEnd={onParentPressEnd}
              className="w-9 h-9 rounded-full bg-slate-100 border flex items-center justify-center text-slate-500 text-xs"
              title="Hold for Parent Settings"
              aria-label="Parent settings (hold)"
            >
              ⚙️
            </button>
          </div>
        </div>

        {/* mobile fuel */}
        <div className="sm:hidden px-4 pb-3">
          <FuelGauge current={progress.currentFuel} required={progress.settings.flightFuelRequired} total={progress.totalFuel} />
        </div>

        {/* nav */}
        {view !== "reading" && (
          <nav className="max-w-5xl mx-auto px-4 pb-3 flex gap-2">
            {[
              ["library", "📚 Library"],
              ["hangar", "🛩️ Hangar"],
              ["map", "🗺️ Map"],
            ].map(([k, label]) => (
              <button
                key={k}
                onClick={() => setView(k)}
                className={`flex-1 sm:flex-none px-5 py-2.5 rounded-full font-black text-sm border-2 transition ${view===k ? "bg-sky-500 text-white border-sky-600 shadow" : "bg-white text-slate-700 border-slate-200"}`}
              >
                {label}
              </button>
            ))}
            <button
              onClick={() => {
                if (progress.currentFuel >= progress.settings.flightFuelRequired) {
                  // Joy flight level bumps with harder stories completed
                  const joyLevel = progress.storiesCompleted.some((id) => {
                    const s = storiesData.find((x) => x.id === id);
                    return s && s.level === 3;
                  }) ? 2 : progress.storiesCompleted.length >= 3 ? 2 : 1;
                  setJoyFlight({ level: joyLevel, duration: getFlightDurationSeconds(joyLevel) });
                } else {
                  setToast(`Need ${progress.settings.flightFuelRequired - progress.currentFuel} more fuel to fly`);
                }
              }}
              className={`px-5 py-2.5 rounded-full font-black text-sm border-2 ${progress.currentFuel >= progress.settings.flightFuelRequired ? "bg-emerald-500 text-white border-emerald-600 animate-pulse" : "bg-white text-slate-400 border-slate-200"}`}
            >
              ✈️ FLY
            </button>
          </nav>
        )}
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {joyFlight ? (
          <div className="max-w-3xl mx-auto">
            <button onClick={() => setJoyFlight(null)} className="mb-4 text-sky-700 font-bold bg-white px-4 py-2 rounded-full shadow border">← Back</button>
            <FlightView
              level={joyFlight.level}
              durationSeconds={joyFlight.duration}
              fuelEarned={progress.settings.flightFuelRequired}
              skin={progress.settings.hangarSkin}
              onDone={({ ringsCollected }) => {
                setProgress((p) => consumeFuelForFlight(p, ringsCollected));
                setToast(`✈️ Joy flight! ${ringsCollected} rings collected!`);
                setJoyFlight(null);
              }}
            />
            <p className="text-center text-xs text-slate-500 mt-2">Joy flight • Level {joyFlight.level} • {joyFlight.duration}s — keep reading to unlock longer flights!</p>
          </div>
        ) : (
          <>
            {view === "library" && !activeStory && (
              <Library stories={stories} progress={progress} onSelect={(s) => { setActiveStory(s); setView("reading"); }} settings={progress.settings} onSettings={handleSettingsUpdate} />
            )}

            {view === "reading" && activeStory && (
              <StoryReader
                story={activeStory}
                progress={progressWithFlight}
                settings={progress.settings}
                onSentenceSuccess={handleSentenceSuccess}
                onStoryComplete={handleStoryComplete}
                onExit={() => { setActiveStory(null); setView("library"); }}
              />
            )}

            {view === "hangar" && (
              <Hangar progress={progress} onSelectSkin={handleSelectSkin} />
            )}

            {view === "map" && (
              <MapView progress={progress} />
            )}
          </>
        )}
      </main>

      <footer className="text-center text-[11px] text-slate-400 py-8">
        Reading Racer • Offline-capable • No ads • No tracking • Hold ⚙️ 1 sec for Parent Dashboard
      </footer>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-full shadow-xl font-bold text-sm z-40">
          {toast}
        </div>
      )}

      {showParent && (
        <ParentDashboard
          progress={progress}
          stories={stories}
          onUpdateSettings={handleSettingsUpdate}
          onClearProgress={handleClearProgress}
          onClose={() => setShowParent(false)}
        />
      )}
    </div>
  );
}
