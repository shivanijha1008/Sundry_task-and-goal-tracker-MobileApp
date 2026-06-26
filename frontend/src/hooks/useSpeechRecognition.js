import { useCallback, useEffect, useRef, useState } from "react";
import { applyPunctuation } from "../lib/punctuation";

// Cross-browser Web Speech API support
function getRecognitionCtor() {
  if (typeof window === "undefined") return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

export function isSpeechSupported() {
  return !!getRecognitionCtor();
}

/**
 * useSpeechRecognition
 * Returns { listening, transcript, start, stop, supported, error }
 * `onResult(text)` fires with the appended (interim+final) transcript
 * `onFinal(text)` fires once with each final result chunk
 */
export function useSpeechRecognition({ onResult, onFinal, lang = "en-US", continuous = false } = {}) {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState(null);
  const recRef = useRef(null);

  const supported = isSpeechSupported();

  const stop = useCallback(() => {
    try {
      recRef.current?.stop();
    } catch (e) {
      /* ignore */
    }
    setListening(false);
  }, []);

  const start = useCallback(() => {
    if (!supported) {
      setError("not-supported");
      return false;
    }
    if (listening) return true;
    setError(null);
    setTranscript("");

    const Ctor = getRecognitionCtor();
    const rec = new Ctor();
    rec.lang = lang;
    rec.continuous = continuous;
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    let finalBuf = "";

    rec.onresult = (ev) => {
      let interim = "";
      let finals = "";
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const res = ev.results[i];
        const txt = res[0]?.transcript || "";
        if (res.isFinal) finals += txt;
        else interim += txt;
      }
      if (finals) {
        finalBuf += finals;
        const polishedFinal = applyPunctuation(finals);
        onFinal?.(polishedFinal);
      }
      const combined = applyPunctuation((finalBuf + interim).trim());
      setTranscript(combined);
      onResult?.(combined);
    };

    rec.onerror = (ev) => {
      setError(ev.error || "unknown");
      setListening(false);
    };
    rec.onend = () => {
      setListening(false);
    };

    try {
      rec.start();
      setListening(true);
      recRef.current = rec;
      return true;
    } catch (e) {
      setError(e?.message || "start-failed");
      setListening(false);
      return false;
    }
  }, [supported, listening, lang, continuous, onResult, onFinal]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      try {
        recRef.current?.abort();
      } catch (e) {
        /* ignore */
      }
    };
  }, []);

  return { listening, transcript, start, stop, supported, error };
}
