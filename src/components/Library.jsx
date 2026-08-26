export default function Library({ stories, progress, onSelect, settings, onSettings }) {
  const filter = settings.levelFilter;
  const filtered = stories.filter((s) => filter === "all" || String(s.level) === String(filter));
  const completed = new Set(progress.storiesCompleted);

  return (
    <div>
      <div className="flex flex-wrap gap-2 justify-center mb-4">
        {[
          ["all", "All Stories"],
          ["1", "Level 1"],
          ["2", "Level 2"],
          ["3", "Level 3"],
        ].map(([val, label]) => (
          <button
            key={val}
            onClick={() => onSettings({ ...settings, levelFilter: val })}
            className={`px-4 py-2 rounded-full font-bold text-sm border-2 ${String(settings.levelFilter) === String(val) ? "bg-sky-500 text-white border-sky-600" : "bg-white text-slate-600 border-slate-200"}`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((story) => {
          const done = completed.has(story.id);
          return (
            <button
              key={story.id}
              onClick={() => onSelect(story)}
              className={`text-left rounded-3xl p-5 shadow-lg border-4 transition hover:scale-[1.02] hover:shadow-xl bg-gradient-to-br ${story.color} text-white relative overflow-hidden ${done ? "border-emerald-300" : "border-white/50"}`}
            >
              {done && <span className="absolute top-3 right-3 bg-emerald-500 text-white text-xs font-black px-2 py-1 rounded-full">✓ DONE</span>}
              <div className="text-5xl mb-2">{story.coverEmoji}</div>
              <h3 className="font-black text-lg leading-tight drop-shadow">{story.title}</h3>
              <p className="text-white/80 text-xs mt-1">Level {story.level} • {story.sentences.length} sentences</p>
              <div className="mt-3 flex flex-wrap gap-1">
                {story.vocabulary.slice(0, 3).map((w) => (
                  <span key={w} className="text-[10px] bg-white/20 px-2 py-1 rounded-full">{w}</span>
                ))}
              </div>
              <div className="mt-4 bg-white text-slate-800 font-black text-center py-2 rounded-full text-sm">
                {done ? "Read again →" : "Read →"}
              </div>
            </button>
          );
        })}
      </div>
      {filtered.length === 0 && <p className="text-center text-slate-500 mt-8">No stories at this level. Switch filter.</p>}
    </div>
  );
}
