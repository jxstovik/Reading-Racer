import { GAMES } from "../data/games.js";
import MapView from "./MapView.jsx";
export default function StickerBook({ progress, stories }) {
  return (
    <section className="sticker-book">
      <h1>⭐ My adventure book</h1>
      <p>
        Every story and mission adds a memory. Your stickers are always here.
      </p>
      <div className="sticker-grid">
        {GAMES.map((g) => {
          const n = progress.hangar.stickers.filter(
            (s) => s.gameId === g.id,
          ).length;
          return (
            <div className={`sticker ${n ? "earned" : ""}`} key={g.id}>
              <span>{g.emoji}</span>
              <h2>{g.name}</h2>
              <p>
                {n
                  ? `${n} ${n === 1 ? "adventure" : "adventures"} ✓`
                  : "A mission is waiting"}
              </p>
            </div>
          );
        })}
        {progress.hangar.stickers
          .filter((s) => s.storyId)
          .map((s) => {
            const story = stories.find((story) => story.id === s.storyId);
            return (
              <div className="sticker earned" key={s.storyId}>
                <span>{story?.coverEmoji || "📚"}</span>
                <h2>{story?.title || "A story adventure"}</h2>
                <p>Story completed ✓</p>
              </div>
            );
          })}
      </div>
      <MapView progress={progress} />
    </section>
  );
}
