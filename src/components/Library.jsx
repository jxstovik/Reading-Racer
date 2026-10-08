import { speak } from "../utils/sounds.js";
const LEVELS = [
  ["0", "🌱", "First words"],
  ["1", "🌿", "Short stories"],
  ["2", "🌳", "Growing readers"],
  ["3", "🚀", "Big adventures"],
  ["all", "📚", "All stories"],
];
export default function Library({
  stories,
  progress,
  onSelect,
  settings,
  onSettings,
  pilot,
  celebration,
  onFly,
}) {
  const filtered = stories.filter(
    (s) =>
      settings.levelFilter === "all" ||
      String(s.level) === String(settings.levelFilter),
  );
  const completed = new Set(progress.storiesCompleted);
  const recommended =
    filtered.find((s) => progress.storyPositions[s.id] > 0) ||
    filtered.find((s) => !completed.has(s.id)) ||
    filtered[0];
  const choices = filtered.filter((s) => s.id !== recommended?.id);
  const canFly = progress.currentFuel >= settings.flightFuelRequired;
  return (
    <div className="library">
      <section className="welcome-row">
        <div>
          <p className="eyebrow">YOUR NEXT ADVENTURE</p>
          <h1>
            {celebration ? "You did it, pilot!" : `Let’s go, ${pilot.name}!`}
          </h1>
          <p>
            {celebration
              ? `You finished ${celebration.title}. Pick a new adventure or take a break.`
              : "Pick a story. Read a little. Then take to the sky."}
          </p>
        </div>
        <button
          className="quiet-button"
          aria-label="How to play"
          onClick={() =>
            speak(
              "Choose a story. Listen for help, then read out loud. Reading fills your fuel tank so you can fly!",
            )
          }
        >
          🔊 How to play
        </button>
      </section>
      <div className="adventure-grid">
        {recommended && (
          <section className="mission-card">
            <div className="mission-copy">
              <span className="eyebrow">
                {progress.storyPositions[recommended.id] > 0
                  ? "CONTINUE YOUR STORY"
                  : "A STORY FOR YOU"}
              </span>
              <h2>{recommended.title}</h2>
              <p>
                {recommended.sentences.length} little reading steps ·{" "}
                {LEVELS.find(([id]) => id === String(recommended.level))?.[2]}
              </p>
              <button
                className="primary-button"
                onClick={() => onSelect(recommended)}
              >
                ▶{" "}
                {progress.storyPositions[recommended.id] > 0
                  ? "Keep reading"
                  : "Let’s read"}
              </button>
            </div>
            <div className="mission-art" aria-hidden="true">
              <span className="cloud cloud-one">☁</span>
              <span className="story-emoji">{recommended.coverEmoji}</span>
              <span className="cloud cloud-two">☁</span>
            </div>
          </section>
        )}
        <section className="flight-ticket">
          <span className="ticket-plane" aria-hidden="true">
            🛩️
          </span>
          <h2>{canFly ? "Ready for takeoff!" : "Fuel your adventure"}</h2>
          <p>
            {canFly
              ? "Your plane is ready. Let’s collect stars!"
              : "Every reading try helps fill your tank."}
          </p>
          <div
            className="fuel-track"
            role="progressbar"
            aria-label="Fuel for your next flight"
            aria-valuemin={0}
            aria-valuemax={settings.flightFuelRequired}
            aria-valuenow={Math.min(
              progress.currentFuel,
              settings.flightFuelRequired,
            )}
          >
            <div
              style={{
                width: `${Math.min(100, (progress.currentFuel / settings.flightFuelRequired) * 100)}%`,
              }}
            />
          </div>
          <span className="fuel-caption">
            {canFly
              ? "Tank full!"
              : `${progress.currentFuel} / ${settings.flightFuelRequired} fuel`}
          </span>
          <button
            className={canFly ? "primary-button fly-button" : "quiet-button"}
            onClick={
              canFly ? onFly : () => recommended && onSelect(recommended)
            }
          >
            {canFly ? "✈ Let’s fly" : "📖 Read to fill up"}
          </button>
        </section>
      </div>
      <section className="story-library" aria-label="Choose a story">
        <div className="section-heading">
          <h2>Choose your adventure</h2>
          <span>{filtered.length} stories to explore</span>
        </div>
        <div className="level-tabs" aria-label="Story difficulty">
          {LEVELS.map(([id, emoji, label]) => (
            <button
              key={id}
              aria-pressed={String(settings.levelFilter) === id}
              onClick={() => onSettings({ levelFilter: id })}
            >
              <span aria-hidden="true">{emoji}</span>
              {label}
            </button>
          ))}
        </div>
        <div className="story-grid">
          {choices.map((story) => (
            <article className="story-card" key={story.id}>
              <button className="story-open" onClick={() => onSelect(story)}>
                <span
                  className={`story-cover bg-gradient-to-br ${story.color}`}
                  aria-hidden="true"
                >
                  {story.coverEmoji}
                </span>
                <span className="story-card-copy">
                  <strong>{story.title}</strong>
                  <small>
                    {completed.has(story.id)
                      ? "⭐ Read again"
                      : progress.storyPositions[story.id] > 0
                        ? "▶ Keep reading"
                        : `${story.sentences.length} reading steps`}
                  </small>
                </span>
                <span aria-hidden="true">↗</span>
              </button>
              <button
                className="story-listen"
                aria-label={`Hear title: ${story.title}`}
                onClick={() => speak(story.title)}
              >
                🔊
              </button>
            </article>
          ))}
        </div>
        {!recommended && (
          <p>Choose another story level to find an adventure.</p>
        )}
      </section>
    </div>
  );
}
