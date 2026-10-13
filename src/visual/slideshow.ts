import { reduceMotion } from "./anim.ts";

const DWELL_MS = 7000;
const FADE_MS = 1000;
const READY_COUNT = 3;

const imageModules = import.meta.glob("../slideshow/*.{jpg,jpeg,png,webp}", {
  import: "default",
});

type Slide = {
  status: "pending" | "ready" | "failed";
  url: string;
};

export type Slideshow = {
  untilReady: Promise<void>;
  stop: () => void;
};

export function createSlideshow(root: HTMLElement): Slideshow {
  const frames = [...root.querySelectorAll<HTMLImageElement>(".slide")];
  const firstFrame = frames[0];
  const secondFrame = frames[1];
  if (!firstFrame || !secondFrame) throw new Error("Slideshow markup is missing");

  const paths = shuffle(Object.keys(imageModules));
  const slides: Slide[] = paths.map(() => ({ status: "pending", url: "" }));
  let visibleFrame = 0;
  let shown = -1;
  let timer = 0;
  let settled = 0;
  let ready = 0;
  let opened = false;

  let resolveReady = (): void => {};
  const untilReady = new Promise<void>((resolve) => {
    resolveReady = resolve;
  });

  if (paths.length === 0) resolveReady();

  paths.forEach((path, index) => {
    const load = imageModules[path];
    if (!load) {
      finish(index, null);
      return;
    }
    void load()
      .then((url) =>
        typeof url === "string" ? decode(url) : Promise.reject(new Error("missing image")),
      )
      .then((url) => finish(index, url))
      .catch(() => finish(index, null));
  });

  return {
    untilReady,
    stop() {
      window.clearTimeout(timer);
    },
  };

  function finish(index: number, url: string | null): void {
    const slide = slides[index];
    if (!slide || slide.status !== "pending") return;
    settled += 1;
    if (url) {
      slide.status = "ready";
      slide.url = url;
      ready += 1;
      if (shown === -1) {
        shown = index;
        fadeTo(url);
        arm(dwellDelay());
      }
    } else {
      slide.status = "failed";
    }
    if (!opened && (ready >= READY_COUNT || settled === paths.length)) {
      opened = true;
      resolveReady();
    }
  }

  function arm(delay: number): void {
    window.clearTimeout(timer);
    timer = window.setTimeout(step, delay);
  }

  function step(): void {
    const next = nextReady(shown);
    if (next == null) {
      arm(DWELL_MS);
      return;
    }
    shown = next;
    const slide = slides[shown];
    if (!slide) return;
    fadeTo(slide.url);
    arm(dwellDelay());
  }

  function nextReady(from: number): number | null {
    for (let offset = 1; offset <= slides.length; offset += 1) {
      const index = (from + offset) % slides.length;
      if (index !== from && slides[index]?.status === "ready") return index;
    }
    return null;
  }

  function fadeTo(url: string): void {
    const show = visibleFrame === 0 ? secondFrame : firstFrame;
    const hide = visibleFrame === 0 ? firstFrame : secondFrame;
    show.classList.remove("is-shown");
    show.src = url;
    void show.offsetWidth;
    show.classList.add("is-shown");
    hide.classList.remove("is-shown");
    visibleFrame = visibleFrame === 0 ? 1 : 0;
  }
}

function dwellDelay(): number {
  return DWELL_MS + (reduceMotion ? 0 : FADE_MS);
}

function decode(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(url);
    image.onerror = () => reject(new Error("image failed"));
    image.src = url;
  });
}

function shuffle(items: string[]): string[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    const current = copy[index];
    const other = copy[swap];
    if (current === undefined || other === undefined) continue;
    copy[index] = other;
    copy[swap] = current;
  }
  return copy;
}
