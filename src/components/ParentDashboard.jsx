import { getStats } from "../utils/storage.js";
import { useEffect, useRef } from "react";

export default function ParentDashboard({
  progress,
  stories,
  onUpdateSettings,
  onClearProgress,
  onClose,
}) {
  const dialog = useRef(null);
  useEffect(() => {
    const previous = document.activeElement;
    dialog.current?.querySelector("button")?.focus();
    return () => previous?.focus();
  }, []);
  function dialogKeyDown(event) {
    if (event.key === "Escape") onClose();
    if (event.key !== "Tab") return;
    const elements = dialog.current.querySelectorAll("button, input, select");
    const first = elements[0];
    const last = elements[elements.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
  const stats = getStats(progress);
  const recent = [...progress.sentenceHistory].slice(-8).reverse();

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div
        ref={dialog}
        role="dialog"
        aria-modal="true"
        aria-label="Parent Dashboard"
        onKeyDown={dialogKeyDown}
        className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-auto shadow-2xl"
      >
        <div className="sticky top-0 bg-white p-6 border-b flex items-center justify-between">
          <h2 className="text-2xl font-black text-slate-800">
            👨‍👩‍👧 Parent Dashboard
          </h2>
          <button
            onClick={onClose}
            className="bg-slate-100 px-4 py-2 rounded-full font-bold"
          >
            ✕ Close
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-sky-50 rounded-2xl p-3 text-center border">
              <div className="text-2xl font-black text-sky-700">
                {stats.totalSentences}
              </div>
              <div className="text-xs text-slate-600">Sentences read</div>
            </div>
            <div className="bg-emerald-50 rounded-2xl p-3 text-center border">
              <div className="text-2xl font-black text-emerald-700">
                {stats.scoredCount
                  ? `${Math.round(stats.avgScore * 100)}%`
                  : "—"}
              </div>
              <div className="text-xs text-slate-600">Microphone match</div>
            </div>
            <div className="bg-amber-50 rounded-2xl p-3 text-center border">
              <div className="text-2xl font-black text-amber-700">
                {progress.storiesCompleted.length}/{stories.length}
              </div>
              <div className="text-xs text-slate-600">Stories done</div>
            </div>
          </div>

          <div className="bg-slate-50 rounded-2xl p-4 border">
            <h3 className="font-bold text-slate-700">Progress</h3>
            <p className="text-sm text-slate-600">
              Total fuel earned: {progress.totalFuel} • Current in tank:{" "}
              {progress.currentFuel} • Flights: {progress.flightsFlown} • Stars:{" "}
              {progress.starsCollected}
            </p>
            <div className="mt-2 flex flex-wrap gap-1">
              {stories.map((s) => (
                <span
                  key={s.id}
                  className={`text-xs px-2 py-1 rounded-full border ${progress.storiesCompleted.includes(s.id) ? "bg-emerald-100 border-emerald-300 text-emerald-800" : "bg-white border-slate-200"}`}
                >
                  {s.coverEmoji} {s.title}
                </span>
              ))}
            </div>
          </div>

          {/* recent history */}
          <div>
            <h3 className="font-bold text-slate-700">Recent reads</h3>
            {recent.length === 0 ? (
              <p className="text-sm text-slate-500">No reads yet.</p>
            ) : (
              <div className="mt-2 space-y-1 max-h-40 overflow-auto">
                {recent.map((r, i) => (
                  <div
                    key={i}
                    className="flex justify-between text-xs bg-white border p-2 rounded"
                  >
                    <span>
                      {r.storyId} #{r.sentenceIndex + 1}
                    </span>
                    <span
                      className={`font-bold ${r.grade === "perfect" ? "text-emerald-600" : r.grade === "good" ? "text-sky-600" : "text-amber-600"}`}
                    >
                      {r.grade} •{" "}
                      {Number.isFinite(r.score)
                        ? `${Math.round(r.score * 100)}% match`
                        : "unscored practice"}{" "}
                      • +{r.fuel}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* settings */}
          <div className="bg-indigo-50 rounded-2xl p-4 border border-indigo-200">
            <h3 className="font-bold text-indigo-800">Settings</h3>

            <label className="flex items-center justify-between mt-3">
              <span className="text-sm font-semibold">
                Pass threshold (strictness)
              </span>
              <input
                type="range"
                min="0.5"
                max="0.95"
                step="0.05"
                value={progress.settings.passThreshold}
                onChange={(e) =>
                  onUpdateSettings({
                    passThreshold: parseFloat(e.target.value),
                  })
                }
              />
              <span className="text-xs bg-white px-2 py-1 rounded border">
                {Math.round(progress.settings.passThreshold * 100)}%
              </span>
            </label>
            <p className="text-[11px] text-slate-500">
              Lower = more generous (recommended 75-80% for young readers)
            </p>

            <label className="flex items-center justify-between mt-3">
              <span className="text-sm font-semibold">
                Fuel needed per flight
              </span>
              <select
                value={progress.settings.flightFuelRequired}
                onChange={(e) =>
                  onUpdateSettings({
                    flightFuelRequired: parseInt(e.target.value),
                  })
                }
                className="bg-white border rounded-full px-3 py-1 text-sm"
              >
                <option value={20}>20 (frequent flights)</option>
                <option value={28}>28 (default)</option>
                <option value={35}>35 (more reading)</option>
              </select>
            </label>

            <label className="flex items-center gap-2 mt-3">
              <input
                type="checkbox"
                checked={progress.settings.dyslexiaFont}
                onChange={(e) =>
                  onUpdateSettings({ dyslexiaFont: e.target.checked })
                }
              />
              <span className="text-sm font-semibold">
                Dyslexia-friendly spacing/font
              </span>
            </label>

            <label className="flex items-center gap-2 mt-3">
              <input
                type="checkbox"
                checked={progress.settings.soundEnabled}
                onChange={(e) =>
                  onUpdateSettings({ soundEnabled: e.target.checked })
                }
              />
              <span className="text-sm font-semibold">
                Sound effects & speech
              </span>
            </label>

            <div className="mt-4">
              <p className="text-xs font-bold text-slate-600">
                Microphone test
              </p>
              <p className="text-[11px] text-slate-500">
                Use the Read view microphone. Listen-and-practice mode works
                without it and records unscored practice. Microphone matches are
                estimates, not reading assessments. {stats.practiceCount}{" "}
                practice steps saved.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClearProgress}
              className="flex-1 bg-rose-50 text-rose-700 border border-rose-200 font-bold py-3 rounded-full"
            >
              🗑️ Clear progress
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-slate-900 text-white font-bold py-3 rounded-full"
            >
              Done
            </button>
          </div>

          <p className="text-[11px] text-slate-400 text-center">
            Progress stays in this browser. The app does not record audio. Your
            browser’s speech recognition provider may process voice online.
          </p>
        </div>
      </div>
    </div>
  );
}
