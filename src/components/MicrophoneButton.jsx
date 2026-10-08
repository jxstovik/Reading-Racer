export default function MicrophoneButton({ isListening, onPress }) {
  return (
    <button
      className={`read-mic ${isListening ? "listening" : ""}`}
      aria-label={isListening ? "Finish listening" : "Read out loud"}
      aria-pressed={isListening}
      onClick={onPress}
    >
      <span aria-hidden="true">🎤</span>
      {isListening ? "Done reading" : "Read out loud"}
    </button>
  );
}
