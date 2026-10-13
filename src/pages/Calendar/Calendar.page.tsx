import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { onValue, update } from "firebase/database";
import { database, ref } from "../../config";
import { readPerson, type Person } from "../../calendarData";
import { createAudioPlayer } from "../../visual/player";
import { createCalendar, type CalendarApp } from "../../visual/scene";
import { createSlideshow } from "../../visual/slideshow";
import { createSnow } from "../../visual/snow";
import "../../visual/calendar.css";

const CalendarPage = () => {
  const params = useParams();
  const [person, setPerson] = useState<Person | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "missing">("loading");
  const [booted, setBooted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const personRef = useRef<Person | null>(null);
  const openRef = useRef<(day: number) => void>(() => {});
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const slideshowRef = useRef<HTMLDivElement>(null);
  const snowRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLDivElement>(null);
  const youtubeRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const liveRef = useRef<HTMLParagraphElement>(null);

  personRef.current = person;

  openRef.current = (day: number) => {
    const current = personRef.current;
    if (!current) return;
    const entry = current.days[day - 1];
    if (!entry || entry.open) return;
    const days = current.days.slice();
    days[day - 1] = { ...entry, open: true };
    const next = { ...current, days };
    personRef.current = next;
    setPerson(next);
    void update(ref(database, `people/${current.id}/${day}`), {
      text: entry.text,
      open: true,
    }).catch((updateError) => {
      console.error(updateError);
    });
  };

  useEffect(() => {
    document.body.classList.add("advent-open");
    return () => document.body.classList.remove("advent-open");
  }, []);

  useEffect(() => {
    const peopleRef = ref(database, "people");
    return onValue(peopleRef, (snapshot) => {
      const data = snapshot.val() as Record<string, unknown> | null;
      const match = data
        ? Object.entries(data).find(([, value]) => {
            if (!value || typeof value !== "object") return false;
            return (value as { slug?: unknown }).slug === params.name;
          })
        : undefined;
      if (!match) {
        personRef.current = null;
        setPerson(null);
        setStatus("missing");
        return;
      }
      const next = readPerson(match[0], match[1]);
      if (!next) {
        personRef.current = null;
        setPerson(null);
        setStatus("missing");
        return;
      }
      setPerson((prev) => {
        if (prev && prev.id === next.id) {
          next.days = next.days.map((day, index) => ({
            ...day,
            open: day.open || prev.days[index]?.open === true,
          }));
        }
        personRef.current = next;
        return next;
      });
      setStatus("ready");
    });
  }, [params.name]);

  useEffect(() => {
    if (!person?.id) return;
    const canvas = canvasRef.current;
    const slideshowRoot = slideshowRef.current;
    const snowRoot = snowRef.current;
    const audioRoot = audioRef.current;
    const youtubeMount = youtubeRef.current;
    const closeButton = closeRef.current;
    const live = liveRef.current;
    if (!canvas || !slideshowRoot || !snowRoot || !audioRoot || !youtubeMount || !closeButton || !live) {
      return;
    }

    let cancelled = false;
    let calendar: CalendarApp | undefined;
    const photos = createSlideshow(slideshowRoot);
    createSnow(snowRoot);
    const audio = createAudioPlayer(audioRoot, youtubeMount);
    const onClose = () => calendar?.closeNote();
    closeButton.addEventListener("click", onClose);

    void (async () => {
      try {
        const slidesReady = photos.untilReady;
        await loadCalendarFonts();
        if (cancelled) return;
        const app = createCalendar({
          canvas,
          getDay: (day) => personRef.current?.days[day - 1] ?? { text: "", open: false },
          onOpen: (day) => openRef.current(day),
          onLuck(text) {
            live.textContent = text ?? "";
          },
          onReadyToClose(ready) {
            closeButton.hidden = !ready;
            if (ready) closeButton.focus();
          },
        });
        calendar = app;
        await Promise.all([app.whenReady, slidesReady]);
        if (cancelled) {
          app.dispose();
          return;
        }
        setBooted(true);
      } catch (loadError) {
        console.error(loadError);
        if (!cancelled) setError("The calendar could not be loaded.");
      }
    })();

    return () => {
      cancelled = true;
      closeButton.removeEventListener("click", onClose);
      calendar?.dispose();
      photos.stop();
      audio.dispose();
      snowRoot.replaceChildren();
      setBooted(false);
    };
  }, [person?.id]);

  if (status === "missing") {
    return (
      <div className="advent-screen">
        <div className="advent-missing">
          <div>
            <h1>Advent Calendar</h1>
            <p>This calendar could not be found.</p>
            <Link to="/">Back home</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="advent-screen">
      <div id="loader" className={booted ? "is-done" : undefined} role="status" aria-label="Loading" aria-hidden={booted}>
        <div className="loader-card">
          <div className="loader-bar" aria-hidden="true">
            <span />
          </div>
          <p className="loader-status" hidden={error == null}>
            {error}
          </p>
        </div>
      </div>
      <div id="slideshow" ref={slideshowRef} aria-hidden="true">
        <img className="slide" alt="" />
        <img className="slide" alt="" />
      </div>
      <div id="snow" ref={snowRef} aria-hidden="true" />
      <header>
        <h1>Advent Calendar</h1>
        {person?.name ? <p className="calendar-who">{person.name}</p> : null}
      </header>
      <canvas id="scene" ref={canvasRef} aria-label="Advent Calendar presents" />
      <p id="luck-live" className="sr-only" ref={liveRef} aria-live="polite" />
      <button id="close-luck" ref={closeRef} type="button" hidden>
        Close
      </button>
      <div id="audio-player" ref={audioRef}>
        <p id="audio-title">
          <span className="audio-title-track">
            <span className="audio-title-text">Loading</span>
            <span className="audio-title-text audio-title-clone" aria-hidden="true" hidden>
              Loading
            </span>
          </span>
        </p>
        <div className="audio-controls">
          <button type="button" data-audio="prev" aria-label="Previous song">
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <path d="M3.2 3h1.6v10H3.2zm2.5 5 7.1 4.2V3.8z" />
            </svg>
          </button>
          <button type="button" className="is-paused" data-audio="toggle" aria-label="Play">
            <svg className="icon-play" viewBox="0 0 16 16" aria-hidden="true">
              <path d="M5 3.2v9.6l8-4.8z" />
            </svg>
            <svg className="icon-pause" viewBox="0 0 16 16" aria-hidden="true">
              <path d="M4 3h2.6v10H4zm5.4 0H12v10H9.4z" />
            </svg>
          </button>
          <button type="button" data-audio="next" aria-label="Next song">
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <path d="M3.2 3.8v8.4L10.3 8zM11.2 3h1.6v10h-1.6z" />
            </svg>
          </button>
          <label className="audio-volume">
            <span className="sr-only">Volume</span>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              defaultValue="3"
              data-audio="volume"
              aria-label="Volume"
              aria-valuetext="3%"
            />
          </label>
        </div>
      </div>
      <div id="yt-audio" ref={youtubeRef} aria-hidden="true" />
    </div>
  );
};

async function loadCalendarFonts(): Promise<void> {
  const star = new FontFace("Merry Christmas Star", "url(/fonts/MerryChristmasStar.woff2)");
  const notes = new FontFace("Wolgast Two", "url(/fonts/WolgastTwo.woff2)");
  const [starFace, notesFace] = await Promise.all([star.load(), notes.load()]);
  document.fonts.add(starFace);
  document.fonts.add(notesFace);
  await Promise.all([
    document.fonts.load('96px "Merry Christmas Star"'),
    document.fonts.load('96px "Wolgast Two"'),
  ]);
}

export default CalendarPage;
