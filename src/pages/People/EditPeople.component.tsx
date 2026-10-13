import { useEffect, useState } from "react";
import { get } from "firebase/database";
import { database, ref, update } from "../../config";
import { personPayload, readPerson, type DayEntry, type Person } from "../../calendarData";
import PersonForm from "./PersonForm";

type Props = {
  id: string;
  closeFn: () => void;
};

const CalendarEdit = ({ id, closeFn }: Props) => {
  const [person, setPerson] = useState<Person | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    let active = true;
    void get(ref(database, `people/${id}`)).then((snapshot) => {
      if (!active) return;
      const next = readPerson(id, snapshot.val());
      if (!next) setMissing(true);
      else setPerson(next);
    });
    return () => {
      active = false;
    };
  }, [id]);

  const onSubmit = async (name: string, days: DayEntry[]) => {
    await update(ref(database, `people/${id}`), personPayload(name, days));
    closeFn();
  };

  if (missing) {
    return (
      <div className="admin-shell">
        <div className="admin-wrap">
          <div className="empty-state">
            <h2>Calendar not found</h2>
            <p className="muted">It may have been deleted.</p>
            <button type="button" className="btn-primary" onClick={closeFn}>
              Back to calendars
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!person) {
    return (
      <div className="admin-shell">
        <div className="admin-loading">Loading calendar…</div>
      </div>
    );
  }

  return (
    <PersonForm
      heading={`Edit ${person.name}`}
      initialName={person.name}
      initialDays={person.days}
      originalSlug={person.slug}
      submitLabel="Save changes"
      onSubmit={onSubmit}
      onCancel={closeFn}
    />
  );
};

export default CalendarEdit;
