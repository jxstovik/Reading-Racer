export default function MicrophoneButton({ isListening, isSupported, onPress, disabled, size = "lg" }) {
  const sizeCls = size === "lg" ? "w-28 h-28 text-4xl" : "w-20 h-20 text-2xl";
  return (
    <div className="relative flex flex-col items-center">
      {isListening && (
        <>
          <span className="absolute inset-0 rounded-full bg-red-400/30 animate-ping" style={{ animationDuration: "1.2s" }} />
          <span className="absolute inset-0 rounded-full bg-red-400/20 animate-ping" style={{ animationDuration: "1.2s", animationDelay: "0.4s" }} />
        </>
      )}
      <button
        onClick={onPress}
        disabled={disabled}
        aria-label={isListening ? "Listening, tap to stop" : "Tap to speak"}
        className={`${sizeCls} relative rounded-full flex items-center justify-center shadow-xl border-4 transition-all
          ${isListening ? "bg-red-500 border-red-600 scale-105 shadow-red-300" : "bg-sky-500 border-sky-700 hover:bg-sky-400 hover:scale-105 active:scale-95"}
          disabled:opacity-40 disabled:scale-100`}
      >
        <span className={isListening ? "animate-pulse" : ""}>{isListening ? "🔴" : "🎤"}</span>
      </button>
      <span className={`mt-3 text-sm font-bold ${isListening ? "text-red-600 animate-pulse" : "text-sky-700"}`}>
        {isListening ? "Listening..." : isSupported ? "Tap to Read" : "Tap to confirm (mic not supported)"}
      </span>
      {!isSupported && <span className="text-[11px] text-slate-500 max-w-[14rem] text-center">Web Speech not available — use Parent Tap mode</span>}
    </div>
  );
}
