import { useCallback, useEffect, useRef, useState } from "react";

export function useSpeechRecognition() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [error, setError] = useState(null);
  const [isSupported] = useState(
    () => !!(window.SpeechRecognition || window.webkitSpeechRecognition),
  );
  const recRef = useRef(null);
  const accepting = useRef(false);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = "en-US";
    rec.maxAlternatives = 1;

    rec.onstart = () => {
      if (!accepting.current) return;
      setIsListening(true);
      setError(null);
    };
    rec.onend = () => {
      accepting.current = false;
      setIsListening(false);
    };
    rec.onerror = (e) => {
      if (!accepting.current) return;
      accepting.current = false;
      setError(e.error || "recognition error");
      setIsListening(false);
    };
    rec.onresult = (e) => {
      if (!accepting.current) return;
      let interim = "";
      let final = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        if (res.isFinal) final += res[0].transcript + " ";
        else interim += res[0].transcript + " ";
      }
      if (final) setTranscript(final.trim());
      setInterimTranscript(interim.trim());
    };
    recRef.current = rec;
    return () => {
      accepting.current = false;
      rec.onstart = rec.onend = rec.onerror = rec.onresult = null;
      try {
        rec.abort();
      } catch {}
    };
  }, []);

  const start = useCallback(() => {
    if (accepting.current) return;
    setTranscript("");
    setInterimTranscript("");
    setError(null);
    const rec = recRef.current;
    if (!rec) {
      setError("not-supported");
      return;
    }
    try {
      accepting.current = true;
      rec.start();
    } catch (e) {
      accepting.current = false;
      // already started
      setError(e.message);
    }
  }, []);

  const stop = useCallback(() => {
    try {
      recRef.current?.stop();
    } catch {}
  }, []);

  const reset = useCallback(() => {
    setTranscript("");
    setInterimTranscript("");
    setError(null);
  }, []);

  const cancel = useCallback(() => {
    accepting.current = false;
    try {
      recRef.current?.abort();
    } catch {}
    setIsListening(false);
    setTranscript("");
    setInterimTranscript("");
    setError(null);
  }, []);

  return {
    isListening,
    transcript,
    interimTranscript,
    error,
    isSupported,
    start,
    stop,
    reset,
    cancel,
  };
}
