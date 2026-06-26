// Punctuation-hint transform for voice transcripts.
// Replaces spoken commands like "period", "comma", "new line" with their punctuation.
// Designed to be safe on short transcripts too (no surprise edits when not used).

const TOKEN_MAP = [
  // Multi-word tokens first so they match before single-word fallbacks.
  { re: /\b(new line|newline)\b/gi, out: "\n" },
  { re: /\b(new paragraph|newpara)\b/gi, out: "\n\n" },
  { re: /\b(question mark)\b/gi, out: "?" },
  { re: /\b(exclamation (point|mark))\b/gi, out: "!" },
  { re: /\b(open (quote|quotes))\b/gi, out: "\u201C" },
  { re: /\b(close (quote|quotes))\b/gi, out: "\u201D" },
  { re: /\b(open (paren|parenthesis))\b/gi, out: "(" },
  { re: /\b(close (paren|parenthesis))\b/gi, out: ")" },
  // Single-word punctuation (kept conservative — must be standalone words).
  { re: /\s*\b(period|full stop)\b/gi, out: "." },
  { re: /\s*\bcomma\b/gi, out: "," },
  { re: /\s*\bcolon\b/gi, out: ":" },
  { re: /\s*\bsemicolon\b/gi, out: ";" },
  { re: /\s*\b(dash|hyphen)\b/gi, out: " — " },
  { re: /\s*\bellipsis\b/gi, out: "…" },
];

/**
 * Transform a transcript by replacing spoken-punctuation commands.
 * - Preserves casing of the surrounding text.
 * - Inserts a space after sentence-end punctuation.
 * - Capitalizes the first letter after a period / question mark / exclamation.
 */
export function applyPunctuation(transcript) {
  if (!transcript) return transcript;
  let s = String(transcript);

  for (const { re, out } of TOKEN_MAP) {
    s = s.replace(re, out);
  }

  // Tidy spacing around punctuation
  s = s
    .replace(/\s+([.,!?;:])/g, "$1") // no space before punctuation
    .replace(/([.,!?;:])([^\s\n])/g, "$1 $2") // ensure space after
    .replace(/ +\n/g, "\n") // drop space sitting right before a newline
    .replace(/\n /g, "\n") // no space right after newline
    .replace(/ {2,}/g, " ");

  // Capitalize after sentence-end punctuation
  s = s.replace(/([.!?]\s+|^|\n+)([a-z])/g, (_, p1, p2) => p1 + p2.toUpperCase());

  // Capitalize stand-alone "i"
  s = s.replace(/\bi\b/g, "I");

  return s;
}
