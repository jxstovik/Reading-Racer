import { useEffect, useRef, useState } from "react";
import {
  scoreReading,
  gradeFromScore,
  fuelForGrade,
} from "../utils/speechMatch.js";
import { useSpeechRecognition } from "../hooks/useSpeechRecognition.js";
import { speak, playSuccess, playGood } from "../utils/sounds.js";
import MicrophoneButton from "./MicrophoneButton.jsx";
import FlightView from "./FlightView.jsx";
import { getFlightDurationSeconds } from "../utils/storage.js";

export default function StoryReader({
  story,
  progress,
  onSentenceSuccess,
  onStoryComplete,
  onPosition,
  onFlightDone,
  onExit,
  settings,
  onSettings,
}) {
  const [idx, setIdx] = useState(() =>
    Math.min(
      progress.storyPositions[story.id] || 0,
      story.sentences.length - 1,
    ),
  );
  const [feedback, setFeedback] = useState(null);
  const [showFlight, setShowFlight] = useState(false);
  const [practiceMode, setPracticeMode] = useState(settings.practiceMode);
  const committed = useRef(false);
  const evaluated = useRef(false);
  const sentence = story.sentences[idx];
  const isLast = idx === story.sentences.length - 1;
  const {
    isListening,
    transcript,
    interimTranscript,
    error,
    isSupported,
    start,
    stop,
    reset,
    cancel,
  } = useSpeechRecognition();
  const usePractice = practiceMode || !isSupported || !!error;
  const canFly =
    progress.currentFuel + (feedback?.fuel || 0) >= settings.flightFuelRequired;

  useEffect(() => {
    speak(
      story.level === 0
        ? "Listen for help. Then say the words. You can do it!"
        : "Read this sentence out loud. Tap any word for help.",
      settings.soundEnabled,
    );
    return () => window.speechSynthesis?.cancel();
  }, [story.id, story.level, settings.soundEnabled]);

  useEffect(() => {
    if (!transcript || isListening || evaluated.current) return;
    evaluated.current = true;
    const result = scoreReading(sentence, transcript);
    const grade = gradeFromScore(result.score, settings);
    // Recognition is an aid, not a verdict on a child's reading. Every spoken attempt earns fuel.
    const fuel = Math.max(3, fuelForGrade(grade));
    setFeedback({ ...result, grade, fuel });
    if (settings.soundEnabled) {
      if (grade === "perfect") playSuccess();
      else playGood();
    }
    reset();
  }, [transcript, isListening, sentence, settings, reset]);

  function practice() {
    cancel();
    window.speechSynthesis?.cancel();
    evaluated.current = true;
    setFeedback({ grade: "practice", score: null, fuel: 7 });
    if (settings.soundEnabled) playGood();
  }
  function advance() {
    setShowFlight(false);
    setFeedback(null);
    reset();
    if (isLast) onStoryComplete(story.id);
    else {
      onPosition(idx + 1);
      setIdx((i) => i + 1);
      committed.current = false;
      evaluated.current = false;
    }
  }
  function continueReading(fly = false) {
    if (!feedback || committed.current) return;
    committed.current = true;
    cancel();
    window.speechSynthesis?.cancel();
    onSentenceSuccess({
      storyId: story.id,
      sentenceIndex: idx,
      score: feedback.score,
      grade: feedback.grade,
      fuel: feedback.fuel,
    });
    if (fly && canFly) setShowFlight(true);
    else advance();
  }
  function retry() {
    cancel();
    evaluated.current = false;
    setFeedback(null);
  }
  function hear(text) {
    cancel();
    speak(text); // Explicit help remains available even when automatic sounds are disabled.
  }
  if (showFlight)
    return (
      <div className="flight-session">
        <FlightView
          level={story.level}
          durationSeconds={getFlightDurationSeconds(story.level)}
          skin={settings.hangarSkin}
          soundEnabled={settings.soundEnabled}
          onDone={({ ringsCollected }) => {
            onFlightDone(ringsCollected);
            advance();
          }}
        />
      </div>
    );

  const encouragement =
    feedback?.grade === "perfect"
      ? "Wonderful reading!"
      : feedback?.grade === "practice"
        ? "Nice practicing!"
        : feedback?.grade === "good"
          ? "Great reading!"
          : "Good try, pilot!";
  return (
    <div className="reader">
      <div className="reader-toolbar">
        <button
          className="quiet-button"
          onClick={() => {
            cancel();
            onExit();
          }}
        >
          ⌂ Home
        </button>
        <span>
          Step {idx + 1} of {story.sentences.length}
        </span>
        <button
          className="quiet-button"
          onClick={() =>
            hear(
              "Listen if you need help. Tap the microphone and read out loud, or practice and tap I said it. Then choose Next.",
            )
          }
        >
          🔊 Help
        </button>
      </div>
      <div className="reader-grid">
        <aside className={`reader-scene bg-gradient-to-br ${story.color}`}>
          <span className="scene-cloud" aria-hidden="true">
            ☁
          </span>
          <span className="scene-emoji" aria-hidden="true">
            {story.coverEmoji}
          </span>
          <h1>{story.title}</h1>
          <p>
            {story.level === 0
              ? "Little words. Big discoveries."
              : "One sentence. One step closer to the sky."}
          </p>
          <div
            className="step-dots"
            aria-label={`${idx} of ${story.sentences.length} steps completed`}
          >
            {story.sentences.map((_, i) => (
              <span
                key={i}
                className={i < idx ? "done" : i === idx ? "current" : ""}
              >
                {i < idx ? "✓" : i + 1}
              </span>
            ))}
          </div>
        </aside>
        <section className="reading-workspace" aria-label="Read this sentence">
          <p className="eyebrow">
            {feedback ? "YOU’RE MAKING PROGRESS" : "YOUR TURN TO READ"}
          </p>
          <div
            className={`sentence ${settings.dyslexiaFont ? "spaced-reading" : ""}`}
          >
            {sentence.split(" ").map((word, i) => (
              <button
                key={`${idx}:${i}`}
                className={
                  feedback?.wordResults?.[i]?.status === "missed"
                    ? "word-help"
                    : ""
                }
                title="Hear this word"
                aria-label={`Hear word: ${word}`}
                onClick={() => hear(word)}
              >
                {word}
              </button>
            ))}
          </div>
          <p className="reading-hint">Tap a word to hear it.</p>
          {!feedback ? (
            <div className="reading-controls">
              <button className="listen-button" onClick={() => hear(sentence)}>
                🔊 Listen
              </button>
              {usePractice ? (
                <button className="primary-button" onClick={practice}>
                  ✓ I said it!
                </button>
              ) : (
                <MicrophoneButton
                  isListening={isListening}
                  isSupported={isSupported}
                  onPress={() => {
                    if (isListening) stop();
                    else {
                      window.speechSynthesis?.cancel();
                      evaluated.current = false;
                      start();
                    }
                  }}
                />
              )}
              <p className="mic-status" role="status">
                {error
                  ? "The microphone needs a break. Say the words, then tap I said it."
                  : usePractice
                    ? "Listen, say the words, then tap I said it."
                    : isListening
                      ? "I’m listening. Take your time!"
                      : "Tap the microphone, then read out loud."}
              </p>
              {interimTranscript && (
                <p className="heard-text">I heard: {interimTranscript}</p>
              )}
              {isSupported && (
                <button
                  className="mode-switch"
                  onClick={() => {
                    cancel();
                    reset();
                    setPracticeMode(!practiceMode);
                    onSettings({ practiceMode: !practiceMode });
                  }}
                >
                  {practiceMode
                    ? "🎤 Use microphone"
                    : "🌱 Practice without microphone"}
                </button>
              )}
            </div>
          ) : (
            <div className="reading-feedback" role="status">
              <div className="feedback-banner">
                <span aria-hidden="true">
                  {feedback.grade === "practice" ? "🌟" : "⭐"}
                </span>
                <div>
                  <h2>{encouragement}</h2>
                  <p>
                    +{feedback.fuel} fuel{" "}
                    {feedback.grade === "practice"
                      ? "for practicing"
                      : "for your reading try"}
                  </p>
                </div>
              </div>
              {feedback.wordResults?.some((w) => w.status === "missed") && (
                <p className="help-message">
                  Try the underlined words with the Listen button. The
                  microphone can miss words too.
                </p>
              )}
              <div className="next-actions">
                <button
                  className="primary-button"
                  onClick={() => continueReading(canFly)}
                >
                  {canFly
                    ? "✈ Let’s fly!"
                    : isLast
                      ? "Finish story ⭐"
                      : "Next →"}
                </button>
                {canFly && (
                  <button
                    className="quiet-button"
                    onClick={() => continueReading(false)}
                  >
                    {isLast ? "Finish story" : "Keep reading →"}
                  </button>
                )}
                <button className="quiet-button" onClick={retry}>
                  ↻ Try it again
                </button>
                <button
                  className="listen-button"
                  onClick={() => hear(sentence)}
                >
                  🔊 Listen
                </button>
              </div>
            </div>
          )}
          <div className="reader-fuel">
            <span>
              ⛽ {canFly ? "Ready to fly!" : "Reading fills your tank"}
            </span>
            <div className="fuel-track">
              <div
                style={{
                  width: `${Math.min(100, ((progress.currentFuel + (feedback?.fuel || 0)) / settings.flightFuelRequired) * 100)}%`,
                }}
              />
            </div>
            <span>
              {Math.min(
                progress.currentFuel + (feedback?.fuel || 0),
                settings.flightFuelRequired,
              )}{" "}
              / {settings.flightFuelRequired}
            </span>
          </div>
        </section>
      </div>
    </div>
  );
}
