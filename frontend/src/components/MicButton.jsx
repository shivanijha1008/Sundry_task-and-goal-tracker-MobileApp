import { Mic, MicOff } from "lucide-react";
import { toast } from "sonner";
import { useSpeechRecognition } from "../hooks/useSpeechRecognition";

/**
 * MicButton
 * Tap to dictate. Calls onTranscript(text) with the latest combined transcript.
 * Shows a subtle pulse while listening and a fallback toast if unsupported.
 *
 * Props:
 *   onTranscript(text)   - called continuously with the latest transcript
 *   onFinal?(text)       - optional, called once per final chunk
 *   size                 - icon size (default 14)
 *   testid               - data-testid suffix; full id will be `mic-{testid}`
 *   className            - extra classes
 *   title                - tooltip / aria-label
 */
export function MicButton({
  onTranscript,
  onFinal,
  size = 14,
  testid = "default",
  className = "",
  title = "Tap to dictate",
}) {
  const { listening, start, stop, supported } = useSpeechRecognition({
    onResult: onTranscript,
    onFinal,
  });

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!supported) {
      toast.error("Speech-to-text isn't supported in this browser. Try Chrome, Edge, or Safari.");
      return;
    }
    if (listening) stop();
    else start();
  };

  return (
    <button
      type="button"
      data-testid={`mic-${testid}`}
      data-listening={listening ? "true" : "false"}
      onClick={handleClick}
      title={listening ? "Listening… tap to stop" : title}
      aria-label={listening ? "Stop dictation" : "Start dictation"}
      aria-pressed={listening}
      className={`mic-btn relative inline-flex items-center justify-center rounded-full w-9 h-9 flex-shrink-0 ${
        listening ? "mic-btn--listening" : ""
      } ${className}`}
      style={{
        background: listening
          ? "linear-gradient(135deg, #FF2D92 0%, #B026FF 100%)"
          : "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.18)",
        color: listening ? "#fff" : "var(--text)",
        transition: "background .2s ease, transform .15s ease",
      }}
    >
      {listening ? (
        <MicOff size={size} strokeWidth={2.5} />
      ) : (
        <Mic size={size} strokeWidth={2.5} />
      )}
      {listening && (
        <>
          <span data-testid={`mic-pulse-${testid}`} className="mic-pulse" aria-hidden="true" />
          <span className="sr-only">Listening</span>
        </>
      )}
    </button>
  );
}
