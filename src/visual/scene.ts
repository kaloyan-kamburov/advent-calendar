import {
  ACESFilmicToneMapping,
  AmbientLight,
  BoxGeometry,
  Color,
  DirectionalLight,
  Group,
  HemisphereLight,
  Mesh,
  MeshPhysicalMaterial,
  PerspectiveCamera,
  Raycaster,
  Scene,
  SRGBColorSpace,
  Vector2,
  Vector3,
  WebGLRenderer,
} from "three";
import { dayStatus, type DayEntry } from "../calendarData.ts";
import { lerp, reduceMotion } from "./anim.ts";
import { createNote } from "./note.ts";
import {
  createPresent,
  LID_THICKNESS,
  placeTag,
  playLid,
  PRESENT_HALF_HEIGHT,
  PRESENT_HALF_WIDTH,
  stepLid,
  type Present,
} from "./presents.ts";

const STEP = 1.7;
const BASE_TILT = 0.98;
const FOLLOW = (5 * Math.PI) / 180;

function calendarCorners(tableHalf: number): Vector3[] {
  const presentReach = 2 * STEP + PRESENT_HALF_WIDTH + 0.16;
  const presentTop = PRESENT_HALF_HEIGHT + LID_THICKNESS + 0.46;
  const tableTop = -PRESENT_HALF_HEIGHT - 0.004;
  const points: Vector3[] = [];
  for (const x of [-tableHalf, tableHalf]) {
    for (const z of [-tableHalf, tableHalf]) points.push(new Vector3(x, tableTop, z));
  }
  for (const x of [-presentReach, presentReach]) {
    for (const z of [-presentReach, presentReach]) {
      points.push(new Vector3(x, presentTop, z));
      points.push(new Vector3(x, 0, z));
    }
  }
  return points;
}

export type CalendarApp = {
  dispose: () => void;
  whenReady: Promise<void>;
  closeNote: () => void;
};

type Options = {
  canvas: HTMLCanvasElement;
  getDay: (day: number) => DayEntry;
  onOpen: (day: number) => void;
  onLuck: (text: string | null) => void;
  onReadyToClose: (ready: boolean) => void;
};

export function createCalendar(options: Options): CalendarApp {
  const { canvas } = options;

  function entryFor(day: number): DayEntry {
    return options.getDay(day) ?? { text: "", open: false };
  }

  function statusFor(day: number) {
    return dayStatus(day, entryFor(day));
  }
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true });
  if (!renderer.getContext()) throw new Error("WebGL is not available");
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;

  const scene = new Scene();
  scene.background = null;
  const camera = new PerspectiveCamera(30, 1, 0.1, 100);
  scene.add(camera);

  scene.add(new AmbientLight(0xffffff, 0.22));
  scene.add(new HemisphereLight(0xfff4e8, 0x121212, 0.55));
  const key = new DirectionalLight(0xffffff, 2.7);
  key.position.set(5.5, 9, 7);
  scene.add(key);
  const fill = new DirectionalLight(0xb7c4ff, 0.5);
  fill.position.set(-7, 3.5, 4);
  scene.add(fill);
  const rim = new DirectionalLight(0xffe1bf, 0.8);
  rim.position.set(-1, 6, -8);
  scene.add(rim);

  const grid = new Group();
  scene.add(grid);
  const presentGap = STEP - PRESENT_HALF_WIDTH * 2;
  const tableHalf = 2 * STEP + PRESENT_HALF_WIDTH + presentGap;
  const tableTop = new MeshPhysicalMaterial({
    color: 0xf3f7fb,
    roughness: 0.08,
    metalness: 0,
    transmission: 0.9,
    thickness: LID_THICKNESS,
    ior: 1.5,
    clearcoat: 1,
    clearcoatRoughness: 0.02,
    specularIntensity: 1,
    attenuationColor: new Color(0xd4e2f2),
    attenuationDistance: 0.4,
    transparent: true,
    opacity: 1,
    depthWrite: false,
  });
  const tableEdge = new MeshPhysicalMaterial({
    color: 0xffffff,
    roughness: 0.18,
    metalness: 0,
    clearcoat: 1,
    clearcoatRoughness: 0.05,
    specularIntensity: 1,
    transparent: true,
    opacity: 0.9,
  });
  const table = new Mesh(new BoxGeometry(tableHalf * 2, LID_THICKNESS, tableHalf * 2), [
    tableEdge,
    tableEdge,
    tableTop,
    tableTop,
    tableEdge,
    tableEdge,
  ]);
  table.position.y = -PRESENT_HALF_HEIGHT - LID_THICKNESS / 2 - 0.004;
  scene.add(table);
  const presents = Array.from({ length: 25 }, (_, index) => createPresent(index + 1));
  const byDay = new Map<number, Present>();
  const hits = presents.map((present) => present.hit);
  for (const present of presents) {
    const index = present.day - 1;
    const col = index % 5;
    const row = Math.floor(index / 5);
    present.group.position.set((col - 2) * STEP, 0, (row - 2) * STEP);
    const status = statusFor(present.day);
    present.ribbon.visible = status === "locked";
    present.lid.visible = status !== "opened";
    grid.add(present.group);
    byDay.set(present.day, present);
  }

  const note = createNote(scene, camera, {
    onLuck: options.onLuck,
    onReadyToClose: options.onReadyToClose,
  });

  const pointer = new Vector2();
  const raycaster = new Raycaster();
  const lookTarget = new Vector3(0, 0.15, 0);
  const projected = new Vector3();
  const framePoints = calendarCorners(tableHalf);
  let hovered: number | null = null;
  let aimX = 0;
  let aimY = 0;
  let followYaw = 0;
  let followPitch = 0;
  let cameraDistance = 12;
  let last = performance.now();
  let frameId = 0;
  let disposed = false;

  resize();

  const whenReady = renderer.compileAsync(scene, camera).then(() => {
    renderer.render(scene, camera);
  });

  frameId = requestAnimationFrame(frame);
  canvas.addEventListener("pointermove", onMove);
  canvas.addEventListener("pointerleave", onLeave);
  canvas.addEventListener("click", onClick);
  window.addEventListener("resize", resize);
  window.visualViewport?.addEventListener("resize", resize);
  window.visualViewport?.addEventListener("scroll", resize);
  window.addEventListener("keydown", onKey);

  return {
    whenReady,
    closeNote: () => note.close(),
    dispose() {
      if (disposed) return;
      disposed = true;
      cancelAnimationFrame(frameId);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerleave", onLeave);
      canvas.removeEventListener("click", onClick);
      window.removeEventListener("resize", resize);
      window.visualViewport?.removeEventListener("resize", resize);
      window.visualViewport?.removeEventListener("scroll", resize);
      window.removeEventListener("keydown", onKey);
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };

  function frame(now: number): void {
    if (disposed) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    placeCamera(dt);
    for (const present of presents) {
      const status = statusFor(present.day);
      present.ribbon.visible = status === "locked";
      if (status === "opened" && !present.lidAnimating) present.lid.visible = false;
      const bob =
        status === "available"
          ? (Math.sin((now / 1000) * 1.7 + present.day) * 0.5 + 0.5) * 0.04
          : 0;
      const liftTarget = hovered === present.day && status === "available" ? 0.07 : 0;
      if (reduceMotion) present.hoverLift = liftTarget;
      else present.hoverLift = lerp(present.hoverLift, liftTarget, 1 - Math.exp(-dt / 0.22));
      present.group.position.y = bob + present.hoverLift;
      stepLid(present, dt);
      placeTag(present);
    }
    note.update(dt);
    renderer.render(scene, camera);
    frameId = requestAnimationFrame(frame);
  }

  function resize(): void {
    const viewport = window.visualViewport;
    const width = Math.max(1, Math.round(viewport?.width ?? window.innerWidth));
    const height = Math.max(1, Math.round(viewport?.height ?? window.innerHeight));
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    canvas.style.top = `${viewport?.offsetTop ?? 0}px`;
    canvas.style.left = `${viewport?.offsetLeft ?? 0}px`;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.fov = width < 800 ? 36 : 28;
    camera.updateProjectionMatrix();
    cameraDistance = distanceThatFits(width, height);
    placeCamera(0);
    note.reposition();
  }

  function distanceThatFits(width: number, height: number): number {
    const header = document.querySelector("header")?.getBoundingClientRect().height ?? 0;
    const player = document.querySelector("#audio-player")?.getBoundingClientRect().height ?? 0;
    const left = -1 + (20 / width) * 2;
    const right = 1 - (20 / width) * 2;
    const top = 1 - ((header + 12) / height) * 2;
    const bottom = -1 + ((Math.max(player, 44) + 18) / height) * 2;
    let near = 8;
    let far = 80;
    let best = far;
    for (let step = 0; step < 18; step += 1) {
      const distance = (near + far) / 2;
      cameraDistance = distance;
      placeCamera(0);
      if (calendarFits(left, right, top, bottom)) {
        best = distance;
        far = distance;
      } else near = distance;
    }
    return best;
  }

  function calendarFits(left: number, right: number, top: number, bottom: number): boolean {
    camera.updateMatrixWorld();
    for (const point of framePoints) {
      projected.copy(point).project(camera);
      if (projected.x < left || projected.x > right || projected.y < bottom || projected.y > top) {
        return false;
      }
    }
    return true;
  }

  function onMove(event: PointerEvent): void {
    const rect = canvas.getBoundingClientRect();
    aimX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    aimY = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    hovered = pick(event);
    canvas.style.cursor = cursorFor(hovered);
  }

  function onLeave(): void {
    hovered = null;
    aimX = 0;
    aimY = 0;
    canvas.style.cursor = note.isBusy() ? "pointer" : "default";
  }

  function onClick(event: MouseEvent): void {
    if (note.isEntering()) {
      note.finishEnter();
      return;
    }
    if (note.canClose()) {
      note.close();
      return;
    }
    if (note.isBusy()) return;
    const day = pick(event);
    if (day == null) return;
    openDay(day);
  }

  function onKey(event: KeyboardEvent): void {
    if (event.key !== "Escape") return;
    if (note.isEntering()) note.finishEnter();
    else note.close();
  }

  function openDay(day: number): void {
    const present = byDay.get(day);
    if (!present) return;
    const entry = entryFor(day);
    const status = statusFor(day);
    if (status === "locked") return;
    const origin = present.group.getWorldPosition(new Vector3());
    origin.y += 0.1;
    if (status === "available") {
      options.onOpen(day);
      present.ribbon.visible = false;
      playLid(present);
    }
    note.play(origin, entry.text, status === "available" ? 0.14 : 0);
  }

  function pick(event: { clientX: number; clientY: number }): number | null {
    const rect = canvas.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObjects(hits, false)[0];
    const day = hit?.object.userData.day;
    return typeof day === "number" ? day : null;
  }

  function cursorFor(day: number | null): string {
    if (note.isEntering() || note.canClose()) return "pointer";
    if (day == null) return "default";
    const status = statusFor(day);
    return status === "available" || status === "opened" ? "pointer" : "default";
  }

  function placeCamera(dt: number): void {
    if (reduceMotion) {
      followYaw = 0;
      followPitch = 0;
    } else {
      const amount = dt === 0 ? 1 : 1 - Math.exp(-dt / 0.16);
      const aimLen = Math.hypot(aimX, aimY);
      const aimScale = aimLen > 1 ? 1 / aimLen : 1;
      followYaw += (aimX * aimScale * FOLLOW - followYaw) * amount;
      followPitch += (aimY * aimScale * FOLLOW - followPitch) * amount;
    }
    const pitch = BASE_TILT + followPitch;
    const horizontal = Math.cos(pitch) * cameraDistance;
    camera.position.set(
      Math.sin(followYaw) * horizontal,
      Math.sin(pitch) * cameraDistance,
      Math.cos(followYaw) * horizontal,
    );
    camera.lookAt(lookTarget);
  }
}
