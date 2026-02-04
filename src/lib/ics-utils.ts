/**
 * Genera contenido .ics (iCalendar) para un evento.
 * Compatible con Google Calendar, Outlook, Apple Calendar, etc.
 */

export interface IcsEventPayload {
  name: string;
  event_date: string;
  event_time: string;
  end_date?: string | null;
  end_time?: string | null;
  duration_hours?: number;
  location: string;
  description?: string | null;
  url?: string | null;
  uid?: string;
}

/** Escapa caracteres especiales en valores de texto .ics (\, ;, newlines) */
function escapeIcsValue(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "");
}

/** Parsea fecha YYYY-MM-DD y hora HH:MM o HH:MM:SS a componentes para .ics */
function toIcsDateTime(dateStr: string, timeStr: string): string {
  const [y, m, d] = dateStr.split("T")[0].split("-").map(Number);
  const parts = timeStr.split(":");
  const h = Number(parts[0]) || 0;
  const min = Number(parts[1]) || 0;
  const sec = Number(parts[2]) || 0;
  return [
    String(y),
    String(m).padStart(2, "0"),
    String(d).padStart(2, "0"),
    "T",
    String(h).padStart(2, "0"),
    String(min).padStart(2, "0"),
    String(sec).padStart(2, "0"),
  ].join("");
}

/** Dobla líneas largas según RFC 5545 (máx 75 octets por línea, continuar con CRLF + space) */
function foldLine(line: string): string {
  const max = 75;
  if (line.length <= max) return line;
  const result: string[] = [];
  let remaining = line;
  while (remaining.length > max) {
    result.push(remaining.slice(0, max));
    remaining = " " + remaining.slice(max);
  }
  if (remaining.length > 0) result.push(remaining);
  return result.join("\r\n");
}

export function buildIcsContent(payload: IcsEventPayload): string {
  const {
    name,
    event_date,
    event_time,
    end_date,
    end_time,
    duration_hours = 1,
    location,
    description,
    url,
    uid,
  } = payload;

  const dtStart = toIcsDateTime(event_date, event_time);

  let dtEnd: string;
  if (end_date && end_time) {
    dtEnd = toIcsDateTime(end_date, end_time);
  } else if (end_time) {
    dtEnd = toIcsDateTime(event_date, end_time);
  } else {
    const [y, m, d] = event_date.split("T")[0].split("-").map(Number);
    const [h, min, sec] = event_time.split(":").map(Number);
    const startMs = new Date(y, m - 1, d, h || 0, min || 0, sec || 0).getTime();
    const endMs = startMs + duration_hours * 60 * 60 * 1000;
    const endDate = new Date(endMs);
    dtEnd = [
      endDate.getFullYear(),
      String(endDate.getMonth() + 1).padStart(2, "0"),
      String(endDate.getDate()).padStart(2, "0"),
      "T",
      String(endDate.getHours()).padStart(2, "0"),
      String(endDate.getMinutes()).padStart(2, "0"),
      String(endDate.getSeconds()).padStart(2, "0"),
    ].join("");
  }

  const now = new Date();
  const dtstamp =
    now.getUTCFullYear() +
    String(now.getUTCMonth() + 1).padStart(2, "0") +
    String(now.getUTCDate()).padStart(2, "0") +
    "T" +
    String(now.getUTCHours()).padStart(2, "0") +
    String(now.getUTCMinutes()).padStart(2, "0") +
    String(now.getUTCSeconds()).padStart(2, "0") +
    "Z";

  const eventUid = uid || `event-${event_date}-${event_time}-${name.slice(0, 20)}@holistia.io`;
  const safeEventId = eventUid.replace(/[^a-zA-Z0-9@.-]/g, "-");

  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Holistia//Eventos//ES",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${safeEventId}`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${escapeIcsValue(name)}`,
    `LOCATION:${escapeIcsValue(location)}`,
  ];

  if (description && description.trim()) {
    const plainDescription = description.replace(/<[^>]*>/g, "").trim();
    if (plainDescription) {
      lines.push(`DESCRIPTION:${escapeIcsValue(plainDescription)}`);
    }
  }

  if (url && url.trim()) {
    lines.push(`URL:${url.trim()}`);
  }

  lines.push("END:VEVENT", "END:VCALENDAR");

  return lines.map(foldLine).join("\r\n");
}
