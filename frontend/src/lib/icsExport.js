// Minimal in-house .ics builder (RFC 5545 subset).
// Produces one VEVENT per goal item — all-day on the last day of the month.

function pad(n) {
  return String(n).padStart(2, "0");
}

function lastDayOfMonth(monthKey) {
  const [y, m] = monthKey.split("-").map((s) => parseInt(s, 10));
  // Day 0 of next month == last day of this month
  const d = new Date(y, m, 0);
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
}

function escapeText(s) {
  return String(s)
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

const LIST_EMOJI = {
  goals: "🎯",
  skills: "🧠",
  books: "📚",
  movies: "🎬",
  places: "🗺️",
};

const LIST_LABEL = {
  goals: "Goal",
  skills: "Skill",
  books: "Book",
  movies: "Movie/Series",
  places: "Place",
};

function dtstamp() {
  const d = new Date();
  return (
    d.getUTCFullYear().toString() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    "T" +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    "Z"
  );
}

/**
 * Build an ICS string for the given month_key + items array.
 * Items: [{id, list_type, title, checked, month_key}]
 */
export function buildIcsForMonth(monthKey, items) {
  const day = lastDayOfMonth(monthKey);
  const stamp = dtstamp();

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Sundry//Monthly Goals//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:Sundry — ${monthKey}`,
  ];

  for (const it of items) {
    const emoji = LIST_EMOJI[it.list_type] || "•";
    const lbl = LIST_LABEL[it.list_type] || "Item";
    const summary = `${emoji} ${lbl}: ${it.title}${it.checked ? " ✅" : ""}`;
    const uid = `${it.id || crypto?.randomUUID?.() || Math.random().toString(36).slice(2)}@sundry.app`;
    lines.push(
      "BEGIN:VEVENT",
      `UID:${uid}`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${day}`,
      `SUMMARY:${escapeText(summary)}`,
      `DESCRIPTION:${escapeText("Logged in Sundry — your monthly intentions.")}`,
      `CATEGORIES:Sundry,${lbl}`,
      "TRANSP:TRANSPARENT",
      "END:VEVENT"
    );
  }

  lines.push("END:VCALENDAR");
  // RFC 5545: CRLF line endings
  return lines.join("\r\n");
}

export function downloadIcs(monthKey, items) {
  const ics = buildIcsForMonth(monthKey, items);
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `sundry-${monthKey}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
