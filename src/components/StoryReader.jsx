import { useEffect, useState } from "react";
import { scoreReading, gradeFromScore, fuelForGrade } from "../utils/speechMatch.js";
import { useSpeechRecognition } from "../hooks/useSpeechRecognition.js";
import { speak, playSuccess, playGood, playTryAgain } from "../utils/sounds.js";
import MicrophoneButton from "./MicrophoneButton.jsx";
import FlightView from "./FlightView.jsx";
import { getFlightDurationSeconds } from "../utils/storage.js";

export default function StoryReader({ story, progress, onSentenceSuccess, onStoryComplete, onExit, settings }) {
  const [idx, setIdx] = useState(0);
  const [feedback, setFeedback] = useState(null); // { grade, fuel, score, wordResults, transcript }
  const [showFlight, setShowFlight] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);

  const sentence = story.sentences[idx];
  const isLast = idx === story.sentences.length - 1;

  const { isListening, transcript, interimTranscript, error, isSupported, start, stop, reset } = useSpeechRecognition();

  // auto-evaluate when transcript arrives and not listening
  useEffect(() => {
    if (!transcript || isListening) return;
    handleTranscript(transcript);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transcript, isListening]);

  function handleTranscript(text) {
    const result = scoreReading(sentence, text);
    const grade = gradeFromScore(result.score, settings);
    const fuel = fuelForGrade(grade);
    const fb = { ...result, grade, fuel, transcript: text };
    setFeedback(fb);
    // sounds
    if (!settings.soundEnabled) {} else {
      if (grade === "perfect") playSuccess();
      else if (grade === "good") playGood();
      else playTryAgain();
    }

    if (grade === "perfect" || grade === "good" || grade === "try-again") {
      // award fuel even for try-again (encouraging), except needs-help gets 0 but we allow parent override
      if (fuel > 0) {
        onSentenceSuccess({ storyId: story.id, sentenceIndex: idx, score: result.score, grade, fuel });
      }
      // check flight trigger: if currentFuel after award would exceed threshold
      // parent component manages fuel; we approximate via progress.currentFuel + fuel
      const projected = progress.currentFuel + fuel;
      if (projected >= progress.settings.flightFuelRequired && (idx + 1) % 2 === 0) {
        // fly every 2 sentences if enough fuel, or at story end
        setShowFlight(true);
      }
    }
    reset();
  }

  function handleParentApprove() {
    // Parent taps "Great job!" — counts as good
    const grade = "good";
    const fuel = fuelForGrade(grade);
    const fb = {
      score: 0.75,
      grade,
      fuel,
      transcript: "(parent approved)",
      wordResults: sentence.split(" ").map((w) => ({ word: w.replace(/[^a-zA-Z]/g, ""), status: "correct" })),
      correctCount: sentence.split(" ").length,
      totalWords: sentence.split(" ").length,
    };
    setFeedback(fb);
    onSentenceSuccess({ storyId: story.id, sentenceIndex: idx, score: 0.75, grade, fuel });
    if (settings.soundEnabled) playGood();
    const projected = progress.currentFuel + fuel;
    if (projected >= progress.settings.flightFuelRequired) {
      setShowFlight(true);
    }
  }

  function nextSentence() {
    setFeedback(null);
    setAttemptCount(0);
    if (isLast) {
      onStoryComplete(story.id);
    } else {
      setIdx((i) => i + 1);
    }
  }

  function retry() {
    setFeedback(null);
    setAttemptCount((c) => c + 1);
  }

  function hearSentence() {
    speak(sentence, settings.soundEnabled);
  }

  if (showFlight) {
    const flightDuration = getFlightDurationSeconds(story.level);
    return (
      <div className="max-w-2xl mx-auto p-4">
        <FlightView
          level={story.level}
          durationSeconds={flightDuration}
          fuelEarned={progress.settings.flightFuelRequired}
          skin={progress.settings.hangarSkin}
          onDone={({ ringsCollected }) => {
            setShowFlight(false);
            if (progress.onFlightDone) progress.onFlightDone(ringsCollected);
            // also move to next sentence after flight
            nextSentence();
          }}
        />
        <p className="text-center text-xs text-slate-500 mt-2">Level {story.level} flight — {flightDuration}s • Steer up/down to collect rings!</p>
      </div>
    );
  }

  const words = sentence.split(" ");

  return (
    <div className="max-w-2xl mx-auto">
      {/* top bar */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={onExit} className="text-sky-700 font-bold bg-white px-4 py-2 rounded-full shadow border">← Library</button>
        <span className="text-sm font-bold text-slate-600 bg-white px-3 py-1 rounded-full shadow">
          {idx + 1} / {story.sentences.length}
        </span>
      </div>

      {/* illustration header */}
      <div className={`rounded-3xl p-6 text-center bg-gradient-to-br ${story.color} text-white shadow-lg relative overflow-hidden`}>
        <div className="absolute -top-6 -right-6 text-[80px] opacity-20 rotate-12">{story.coverEmoji}</div>
        <div className="text-6xl mb-2" style={{ animation: "float 3s ease-in-out infinite" }}>{story.coverEmoji}</div>
        <h2 className="text-2xl font-black drop-shadow">{story.title}</h2>
        <p className="text-white/80 text-sm mt-1">Level {story.level} • {story.sentences.length} sentences</p>
        <div className="mt-3 h-2 bg-white/30 rounded-full overflow-hidden">
          <div className="h-full bg-white rounded-full transition-all" style={{ width: `${((idx) / story.sentences.length) * 100}%` }} />
        </div>
      </div>

      {/* sentence card */}
      <div
        className={`mt-6 bg-white rounded-3xl p-8 shadow-xl border-4 text-center ${settings.dyslexiaFont ? "tracking-widest leading-relaxed" : ""}`}
        style={settings.dyslexiaFont ? { fontFamily: "Comic Sans MS, Chalkboard, sans-serif", letterSpacing: "0.04em" } : {}}
      >
        <div className="flex flex-wrap justify-center gap-x-2 gap-y-1 text-[28px] sm:text-[32px] font-black leading-tight">
          {words.map((w, i) => {
            let cls = "text-slate-800";
            if (feedback?.wordResults) {
              const wr = feedback.wordResults[i];
              if (wr) cls = wr.status === "correct" ? "text-emerald-600 bg-emerald-50 rounded px-1" : "text-rose-500 bg-rose-50 rounded px-1 line-through decoration-2";
            }
            return <span key={i} className={cls}>{w}</span>;
          })}
        </div>

        {!feedback && (
          <div className="mt-6 flex flex-col items-center gap-4">
            <MicrophoneButton
              isListening={isListening}
              isSupported={isSupported}
              onPress={() => (isListening ? stop() : start())}
              disabled={false}
            />
            {interimTranscript && <p className="text-sm text-slate-500 italic">Heard: “{interimTranscript}”</p>}
            {error && <p className="text-xs text-amber-700 bg-amber-50 px-3 py-2 rounded">Mic note: {error} — try Parent Tap below.</p>}
            <div className="flex gap-2 flex-wrap justify-center">
              <button onClick={hearSentence} className="bg-indigo-50 text-indigo-700 font-bold px-4 py-2 rounded-full border border-indigo-200">🔊 Hear it</button>
              <button onClick={handleParentApprove} className="bg-emerald-50 text-emerald-700 font-bold px-4 py-2 rounded-full border border-emerald-200">👨‍👩‍👧 Parent: Great job!</button>
            </div>
          </div>
        )}

        {feedback && (
          <div className="mt-6">
            {feedback.grade === "perfect" && (
              <div className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-4">
                <p className="text-2xl">🎉 Amazing!</p>
                <p className="font-bold text-emerald-700">+{feedback.fuel} fuel! You read it perfectly.</p>
                <p className="text-xs text-slate-500 mt-1">Heard: “{feedback.transcript}” • {Math.round(feedback.score * 100)}% match</p>
              </div>
            )}
            {feedback.grade === "good" && (
              <div className="bg-sky-50 border-2 border-sky-200 rounded-2xl p-4">
                <p className="text-xl">⭐ Great job!</p>
                <p className="font-bold text-sky-700">+{feedback.fuel} fuel!</p>
                <p className="text-xs text-slate-500 mt-1">Heard: “{feedback.transcript}” • {Math.round(feedback.score * 100)}% — Try to say the highlighted words again next time.</p>
                <div className="mt-2 text-sm text-slate-600">
                  {feedback.wordResults.filter(w => w.status==="missed").length > 0 && (
                    <span>Missed: <b className="text-rose-600">{feedback.wordResults.filter(w=>w.status==="missed").map(w=>w.word).join(", ")}</b></span>
                  )}
                </div>
              </div>
            )}
            {feedback.grade === "try-again" && (
              <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4">
                <p className="text-xl">💪 Good try!</p>
                <p className="font-bold text-amber-700">+{feedback.fuel} fuel for trying.</p>
                <p className="text-sm text-slate-600">Let’s try once more — tap the words for help or listen.</p>
                <p className="text-xs text-slate-500 mt-1">Heard: “{feedback.transcript}” • {Math.round(feedback.score * 100)}%</p>
              </div>
            )}
            {feedback.grade === "needs-help" && (
              <div className="bg-rose-50 border-2 border-rose-200 rounded-2xl p-4">
                <p className="text-xl">🤗 Let’s try together</p>
                <p className="text-sm text-slate-600">Heard: “{feedback.transcript || "(nothing heard)"}” — that was {Math.round(feedback.score * 100)}%. Tap Hear it, then try again.</p>
                <p className="text-xs text-rose-600 mt-1">No fuel this time, but next try will count!</p>
              </div>
            )}

            <div className="mt-4 flex gap-3 justify-center flex-wrap">
              {(feedback.grade === "perfect" || feedback.grade === "good" || feedback.grade === "try-again") && (
                <button onClick={nextSentence} className="bg-emerald-500 hover:bg-emerald-400 text-white font-black px-8 py-3 rounded-full shadow-lg text-lg">
                  {isLast ? "Finish Story 🎉" : "Next →"}
                </button>
              )}
              {feedback.grade === "needs-help" && (
                <>
                  <button onClick={hearSentence} className="bg-indigo-500 text-white font-bold px-6 py-3 rounded-full">🔊 Hear it</button>
                  <button onClick={retry} className="bg-sky-500 text-white font-bold px-6 py-3 rounded-full">🔄 Try Again</button>
                  <button onClick={handleParentApprove} className="bg-amber-500 text-white font-bold px-6 py-3 rounded-full">Parent Approve +7</button>
                </>
              )}
              {feedback.grade === "try-again" && (
                <>
                  <button onClick={retry} className="bg-white border-2 border-amber-300 text-amber-700 font-bold px-6 py-2 rounded-full">Retry for 10</button>
                  <button onClick={nextSentence} className="bg-amber-500 text-white font-bold px-6 py-2 rounded-full">Keep +{feedback.fuel} & Continue</button>
                </>
              )}
              {feedback.grade === "good" && attemptCount < 2 && (
                <button onClick={retry} className="text-sm text-slate-500 underline">Try again for 10 fuel</button>
              )}
            </div>

            {/* word tap help */}
            <div className="mt-4 flex flex-wrap justify-center gap-1 text-xs">
              {words.map((w, i) => (
                <button
                  key={i}
                  onClick={() => speak(w.replace(/[^a-zA-Z]/g, ""), settings.soundEnabled)}
                  className="bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded-full border"
                  title="Tap to hear word"
                >
                  🔊 {w.replace(/[^a-zA-Z]/g, "")}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <p className="text-center text-[11px] text-slate-400 mt-4">Tip: Be encouraging — any attempt earns fuel. No timers, no penalties.</p>
    </div>
  );
}
