import { FormEvent, useMemo, useState } from "react";
import { DAY_COUNT, slugify, type DayEntry } from "../../calendarData";

type Props = {
  heading: string;
  initialName: string;
  initialDays: DayEntry[];
  originalSlug?: string;
  submitLabel: string;
  onSubmit: (name: string, days: DayEntry[]) => Promise<void>;
  onCancel: () => void;
};

const PersonForm = ({
  heading,
  initialName,
  initialDays,
  originalSlug,
  submitLabel,
  onSubmit,
  onCancel,
}: Props) => {
  const [name, setName] = useState(initialName);
  const [days, setDays] = useState<DayEntry[]>(initialDays);
  const [selected, setSelected] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const slug = slugify(name);
  const entry = days[selected - 1] ?? { text: "", open: false };
  const readyCount = useMemo(() => days.filter((day) => day.text.trim().length > 0).length, [days]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim() || saving) return;
    setSaving(true);
    setError("");
    try {
      await onSubmit(name.trim(), days);
    } catch (submitError) {
      console.error(submitError);
      setError("Could not save this calendar. Try again.");
      setSaving(false);
    }
  };

  return (
    <div className="admin-shell">
      <div className="admin-wrap">
        <form onSubmit={submit}>
          <div className="editor-bar">
            <div className="editor-heading">
              <p className="eyebrow">Admin</p>
              <h1>{heading}</h1>
            </div>
            <div className="editor-actions">
              <button type="button" className="btn-ghost" onClick={onCancel} disabled={saving}>
                Back
              </button>
              <button type="submit" className="btn-primary" disabled={!name.trim() || saving}>
                {saving ? "Saving…" : submitLabel}
              </button>
            </div>
          </div>

          <label className="field" htmlFor="person-name">
            Name
            <input
              id="person-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Who is this calendar for?"
              autoComplete="name"
            />
          </label>
          <p className="hint">
            Public link: /{slug || "name"} · {readyCount} of {DAY_COUNT} messages written
          </p>
          {originalSlug && slug && slug !== originalSlug ? (
            <p className="hint">Saving changes the link from /{originalSlug} to /{slug}.</p>
          ) : null}

          <div className="editor-layout">
            <div className="day-grid" role="tablist" aria-label="Days">
              {days.map((day, index) => {
                const number = index + 1;
                const flag = day.open ? "Opened" : day.text.trim() ? "Ready" : "Empty";
                return (
                  <button
                    key={number}
                    type="button"
                    className={`day-cell${selected === number ? " is-selected" : ""}`}
                    role="tab"
                    aria-selected={selected === number}
                    onClick={() => setSelected(number)}
                  >
                    <span className="day-num">{number}</span>
                    <span className="day-flag">{flag}</span>
                  </button>
                );
              })}
            </div>
            <div className="editor-card day-editor">
              <div className="day-editor-top">
                <h2>December {selected}</h2>
                <span className="muted">{entry.text.trim().length} characters</span>
              </div>
              <label className="field" htmlFor="day-text">
                Message inside the present
                <textarea
                  id="day-text"
                  value={entry.text}
                  onChange={(event) => {
                    const text = event.target.value;
                    setDays((current) =>
                      current.map((day, index) => (index === selected - 1 ? { ...day, text } : day)),
                    );
                  }}
                  placeholder="Write the note for this day."
                />
              </label>
              <p className="hint">
                {entry.open
                  ? "This day has already been opened. The message stays available."
                  : "The present stays closed until that day of the month."}
              </p>
            </div>
          </div>
          {error ? <p className="form-error">{error}</p> : null}
        </form>
      </div>
    </div>
  );
};

export default PersonForm;
