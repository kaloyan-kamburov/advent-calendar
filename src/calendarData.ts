export const DAY_COUNT = 25;

export type DayEntry = {
  text: string;
  open: boolean;
};

export type DayStatus = "locked" | "available" | "opened";

export type Person = {
  id: string;
  name: string;
  slug: string;
  days: DayEntry[];
};

export function blankDays(): DayEntry[] {
  return Array.from({ length: DAY_COUNT }, () => ({ text: "", open: false }));
}

export function slugify(text: string): string {
  return text.toString().trim().toLowerCase().replace(/\s+/g, "-");
}

export function calendarToday(): Date {
  const value = new URLSearchParams(window.location.search).get("today");
  if (value) {
    const parsed = new Date(`${value}T12:00:00`);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return new Date();
}

export function dayStatus(day: number, entry: DayEntry | undefined, now = calendarToday()): DayStatus {
  if (entry?.open) return "opened";
  if (day <= Math.min(DAY_COUNT, now.getDate())) return "available";
  return "locked";
}

export function readPerson(id: string, data: unknown): Person | null {
  if (!data || typeof data !== "object") return null;
  const record = data as Record<string, unknown>;
  const name = typeof record.name === "string" ? record.name : "";
  const slug = typeof record.slug === "string" ? record.slug : "";
  if (!name && !slug) return null;
  const days = blankDays();
  for (let day = 1; day <= DAY_COUNT; day += 1) {
    const raw = record[String(day)];
    if (!raw || typeof raw !== "object") continue;
    const entry = raw as { text?: unknown; open?: unknown };
    days[day - 1] = {
      text: typeof entry.text === "string" ? entry.text : "",
      open: entry.open === true,
    };
  }
  return { id, name, slug, days };
}

export function personPayload(name: string, days: DayEntry[]): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    name: name.trim(),
    slug: slugify(name),
  };
  days.forEach((day, index) => {
    payload[String(index + 1)] = {
      text: day.text,
      open: day.open,
    };
  });
  return payload;
}
