import { useCallback, useEffect, useRef, useState } from "react";

export function useSpeechRecognition() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [error, setError] = useState(null);
  const [isSupported, setIsSupported] = useState(false);
  const recRef = useRef(null);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    setIsSupported(!!SR);
    if (!SR) return;
    const rec = new SR();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = "en-US";
    rec.maxAlternatives = 1;

    rec.onstart = () => {
      setIsListening(true);
      setError(null);
    };
    rec.onend = () => setIsListening(false);
    rec.onerror = (e) => {
      setError(e.error || "recognition error");
      setIsListening(false);
    };
    rec.onresult = (e) => {
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
      try { rec.abort(); } catch {}
    };
  }, []);

  const start = useCallback(() => {
    setTranscript("");
    setInterimTranscript("");
    setError(null);
    const rec = recRef.current;
    if (!rec) {
      setError("not-supported");
      return;
    }
    try {
      rec.start();
    } catch (e) {
      // already started
      setError(e.message);
    }
  }, []);

  const stop = useCallback(() => {
    try { recRef.current?.stop(); } catch {}
  }, []);

  const reset = useCallback(() => {
    setTranscript("");
    setInterimTranscript("");
    setError(null);
  }, []);

  return { isListening, transcript, interimTranscript, error, isSupported, start, stop, reset };
}
