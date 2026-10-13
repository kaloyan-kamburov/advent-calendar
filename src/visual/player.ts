const PLAYLIST_ID = "PLI-is5tEGAnSLIab_GIn7Lz4Eq1EseD5N";
const FIRST_VIDEO_ID = "apORQJa3NZw";
const START_VOLUME = 3;
const PLAYING = 1;
const CUED = 5;

type YouTubePlayer = {
  playVideo: () => void;
  pauseVideo: () => void;
  nextVideo: () => void;
  previousVideo: () => void;
  setVolume: (volume: number) => void;
  mute: () => void;
  unMute: () => void;
  setLoop: (loop: boolean) => void;
  getPlayerState: () => number;
  getVideoData: () => { title?: string };
  destroy: () => void;
};

type YouTubeEvent = {
  target: YouTubePlayer;
  data: number;
};

type YouTubeApi = {
  Player: new (
    element: HTMLElement,
    options: {
      width: number;
      height: number;
      videoId?: string;
      playerVars: Record<string, string | number>;
      events: {
        onReady: (event: YouTubeEvent) => void;
        onStateChange: (event: YouTubeEvent) => void;
        onError: () => void;
      };
    },
  ) => YouTubePlayer;
};

declare global {
  interface Window {
    YT?: YouTubeApi;
    onYouTubeIframeAPIReady?: () => void;
  }
}

export function createAudioPlayer(root: HTMLElement, mount: HTMLElement): { dispose: () => void } {
  const title = root.querySelector<HTMLElement>("#audio-title");
  const titleText = root.querySelector<HTMLElement>(".audio-title-text:not(.audio-title-clone)");
  const titleClone = root.querySelector<HTMLElement>(".audio-title-clone");
  const toggle = root.querySelector<HTMLButtonElement>("[data-audio='toggle']");
  const previous = root.querySelector<HTMLButtonElement>("[data-audio='prev']");
  const next = root.querySelector<HTMLButtonElement>("[data-audio='next']");
  const volumeInput = root.querySelector<HTMLInputElement>("[data-audio='volume']");
  if (!title || !titleText || !titleClone || !toggle || !previous || !next || !volumeInput) {
    throw new Error("Audio player markup is missing");
  }

  const titleEl = title;
  const titleTextEl = titleText;
  const titleCloneEl = titleClone;
  const toggleButton = toggle;
  const previousButton = previous;
  const nextButton = next;
  const volumeSlider = volumeInput;

  let player: YouTubePlayer | null = null;
  let disposed = false;
  let volume = START_VOLUME;
  let skips = 0;

  previousButton.addEventListener("click", () => player?.previousVideo());
  nextButton.addEventListener("click", () => player?.nextVideo());
  toggleButton.addEventListener("click", () => {
    if (!player) return;
    if (player.getPlayerState() === PLAYING) player.pauseVideo();
    else player.playVideo();
  });
  volumeSlider.addEventListener("input", () => {
    volume = clampVolume(Number(volumeSlider.value));
    player?.setVolume(volume);
    paintVolume();
  });
  paintVolume();

  void loadYouTube().then((api) => {
    if (disposed) return;
    player = new api.Player(mount, {
      width: 240,
      height: 135,
      videoId: FIRST_VIDEO_ID,
      playerVars: {
        list: PLAYLIST_ID,
        listType: "playlist",
        autoplay: 1,
        mute: 1,
        controls: 0,
        disablekb: 1,
        fs: 0,
        iv_load_policy: 3,
        modestbranding: 1,
        playsinline: 1,
        rel: 0,
        origin: window.location.origin,
      },
      events: {
        onReady(event) {
          player = event.target;
          event.target.setLoop(true);
          event.target.mute();
          event.target.setVolume(volume);
          event.target.playVideo();
          refresh();
          window.setTimeout(() => {
            if (disposed || !player || player.getPlayerState() === PLAYING) return;
            player.mute();
            player.playVideo();
            refresh();
          }, 800);
        },
        onStateChange(event) {
          if (event.data === PLAYING) {
            skips = 0;
            event.target.unMute();
            event.target.setVolume(volume);
          } else if (event.data === CUED) {
            event.target.mute();
            event.target.playVideo();
          }
          refresh();
        },
        onError() {
          skips += 1;
          if (skips < 4) player?.nextVideo();
          else setTitle("Music unavailable");
        },
      },
    });
  });

  return {
    dispose() {
      disposed = true;
      player?.destroy();
      player = null;
    },
  };

  function paintVolume(): void {
    volumeSlider.value = String(volume);
    volumeSlider.style.setProperty("--volume", `${volume}%`);
    volumeSlider.setAttribute("aria-valuetext", `${volume}%`);
  }

  function setTitle(name: string): void {
    if (titleTextEl.textContent === name) return;
    titleTextEl.textContent = name;
    titleCloneEl.textContent = name;
    titleEl.classList.remove("is-marquee");
    titleCloneEl.hidden = true;
    const overflowing = titleTextEl.scrollWidth > titleEl.clientWidth + 1;
    titleEl.classList.toggle("is-marquee", overflowing);
    titleCloneEl.hidden = !overflowing;
    if (overflowing) {
      const seconds = Math.max(8, titleTextEl.scrollWidth / 32);
      titleEl.style.setProperty("--marquee-duration", `${seconds}s`);
    }
  }

  function refresh(): void {
    if (!player) return;
    const name = player.getVideoData().title?.trim();
    if (name) setTitle(name);
    const playing = player.getPlayerState() === PLAYING;
    toggleButton.classList.toggle("is-playing", playing);
    toggleButton.classList.toggle("is-paused", !playing);
    toggleButton.setAttribute("aria-label", playing ? "Pause" : "Play");
    paintVolume();
  }
}

function clampVolume(value: number): number {
  if (Number.isNaN(value)) return START_VOLUME;
  return Math.min(100, Math.max(0, Math.round(value)));
}

function loadYouTube(): Promise<YouTubeApi> {
  const ready = window.YT?.Player ? window.YT : null;
  if (ready) return Promise.resolve(ready);
  return new Promise((resolve) => {
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      if (window.YT) resolve(window.YT);
    };
    if (document.querySelector("script[data-youtube-api]")) return;
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.dataset.youtubeApi = "true";
    document.head.append(script);
  });
}
