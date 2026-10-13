import { useEffect, useMemo, useState } from "react";
import { onValue } from "firebase/database";
import { database, ref, remove } from "../../config";
import { useAuth } from "../../AuthContext";
import { readPerson, type Person } from "../../calendarData";
import CalendarCreate from "./CreatePeople.component";
import CalendarEdit from "./EditPeople.component";

const PeoplePage = () => {
  const [people, setPeople] = useState<Person[]>([]);
  const [query, setQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Person | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [copiedId, setCopiedId] = useState("");
  const { logout } = useAuth();

  useEffect(() => {
    return onValue(ref(database, "people"), (snapshot) => {
      const data = snapshot.val() as Record<string, unknown> | null;
      const loaded = data
        ? Object.entries(data)
            .map(([id, value]) => readPerson(id, value))
            .filter((person): person is Person => person != null)
            .sort((a, b) => a.name.localeCompare(b.name))
        : [];
      setPeople(loaded);
    });
  }, []);

  useEffect(() => {
    if (!deleteTarget) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDeleteTarget(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [deleteTarget]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return people;
    return people.filter((person) => person.name.toLowerCase().includes(needle));
  }, [people, query]);

  const copyLink = async (person: Person) => {
    const url = `${window.location.origin}/${person.slug}`;
    await navigator.clipboard.writeText(url);
    setCopiedId(person.id);
    window.setTimeout(() => setCopiedId(""), 2000);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteError("");
    try {
      await remove(ref(database, `people/${deleteTarget.id}`));
      setDeleteTarget(null);
    } catch (error) {
      console.error(error);
      setDeleteError("Could not delete this calendar.");
    }
  };

  if (createOpen) return <CalendarCreate closeFn={() => setCreateOpen(false)} />;
  if (editOpen) return <CalendarEdit id={editOpen} closeFn={() => setEditOpen("")} />;

  return (
    <div className="admin-shell">
      <div className="admin-wrap">
        <div className="admin-bar">
          <div className="brand">
            <span className="brand-mark" aria-hidden="true" />
            Advent Calendar
          </div>
          <div className="admin-actions">
            <button type="button" className="btn-primary" onClick={() => setCreateOpen(true)}>
              New calendar
            </button>
            <button type="button" className="btn-ghost" onClick={logout}>
              Log out
            </button>
          </div>
        </div>

        <div className="page-intro">
          <div>
            <h1>Calendars</h1>
            <p className="muted">
              {people.length === 0 ? "No calendars yet." : `${people.length} ${people.length === 1 ? "person" : "people"}`}
            </p>
          </div>
        </div>

        {people.length > 0 ? (
          <input
            className="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name"
            aria-label="Search calendars"
          />
        ) : null}

        {people.length === 0 ? (
          <div className="empty-state">
            <h2>Create the first calendar</h2>
            <p className="muted">Add a person, write a note for each day, then share their link.</p>
          </div>
        ) : visible.length === 0 ? (
          <div className="empty-state">
            <h2>No matches</h2>
            <p className="muted">Try a different name.</p>
          </div>
        ) : (
          <div className="person-list">
            {visible.map((person) => {
              const opened = person.days.filter((day) => day.open).length;
              const written = person.days.filter((day) => day.text.trim()).length;
              return (
                <article className="person-card" key={person.id}>
                  <div className="avatar" aria-hidden="true">
                    {person.name.slice(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <h2>{person.name}</h2>
                    <p className="person-meta">
                      /{person.slug} · {written} messages · {opened} opened
                    </p>
                  </div>
                  <div className="card-actions">
                    <a className="btn" href={`/${person.slug}`} target="_blank" rel="noreferrer">
                      Open
                    </a>
                    <button type="button" onClick={() => void copyLink(person)}>
                      {copiedId === person.id ? "Copied" : "Copy link"}
                    </button>
                    <button type="button" onClick={() => setEditOpen(person.id)}>
                      Edit
                    </button>
                    <button type="button" className="btn-danger" onClick={() => setDeleteTarget(person)}>
                      Delete
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {deleteTarget ? (
        <div className="modal-backdrop" onClick={() => setDeleteTarget(null)}>
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="delete-title">Delete {deleteTarget.name}?</h2>
            <p>Their link will stop opening a calendar. This cannot be undone.</p>
            {deleteError ? <p className="form-error">{deleteError}</p> : null}
            <div className="modal-actions">
              <button type="button" onClick={() => setDeleteTarget(null)}>
                Keep
              </button>
              <button type="button" className="btn-danger" onClick={() => void confirmDelete()}>
                Delete calendar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default PeoplePage;
