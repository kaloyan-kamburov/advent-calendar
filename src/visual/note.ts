import {
  CanvasTexture,
  DoubleSide,
  Euler,
  Group,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  Quaternion,
  SRGBColorSpace,
  Vector3,
  type PerspectiveCamera,
  type Scene,
} from "three";
import { clamp01, easeOutCubic, lerp, reduceMotion, segment } from "./anim.ts";

const PAPER_W = 1408;
const PAPER_H = 1024;
const NOTE_W = 1.58;
const NOTE_H = 1.15;
const NOTE_DISTANCE = 2.45;
const BACKDROP_DISTANCE = 4.4;
const ENTER_S = 1.9;
const EXIT_S = 0.42;
const TEXT_LEAD_S = 0.5;
const FOLD_ANGLE = 1.05;
const TEXT_TOP = 88;
const TEXT_BOTTOM = PAPER_H - 88;
const TUMBLE = new Quaternion().setFromEuler(new Euler(-0.75, 0.4, 1.45));

type Mode = "hidden" | "enter" | "hold" | "exit";

type NoteOptions = {
  onLuck: (text: string | null) => void;
  onReadyToClose: (ready: boolean) => void;
};

export function createNote(scene: Scene, camera: PerspectiveCamera, options: NoteOptions) {
  const paper = document.createElement("canvas");
  paper.width = PAPER_W;
  paper.height = PAPER_H;
  const ctx = paper.getContext("2d");
  if (!ctx) throw new Error("Note canvas is unavailable");
  const paperCtx: CanvasRenderingContext2D = ctx;
  const texture = new CanvasTexture(paper);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 8;

  const material = new MeshBasicMaterial({
    map: texture,
    side: DoubleSide,
    transparent: true,
    opacity: 1,
    depthTest: false,
    depthWrite: false,
  });
  const left = halfMesh(-1, material);
  const right = halfMesh(1, material);
  const root = new Group();
  root.add(left, right);
  root.visible = false;
  root.renderOrder = 11;
  left.renderOrder = 11;
  right.renderOrder = 11;
  scene.add(root);

  const backdropMat = new MeshBasicMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    depthTest: false,
    side: DoubleSide,
  });
  const backdrop = new Mesh(new PlaneGeometry(1, 1), backdropMat);
  backdrop.renderOrder = 2;
  backdrop.visible = false;
  scene.add(backdrop);

  let mode: Mode = "hidden";
  let time = 0;
  let delay = 0;
  let message = "";
  let laidLines: string[] = [];
  let revealed = 0;
  let origin = new Vector3();
  let exitScale = 0.32;
  let fold = 1;

  paint(0);

  return {
    play(nextOrigin: Vector3, text: string, nextDelay: number) {
      if (mode !== "hidden") return;
      origin = nextOrigin.clone();
      message = text.trim();
      laidLines = [];
      revealed = 0;
      delay = nextDelay;
      time = 0;
      fold = 1;
      mode = "enter";
      root.visible = true;
      root.position.copy(launchPoint());
      root.scale.setScalar(0.28);
      root.quaternion.copy(camera.quaternion).multiply(TUMBLE);
      applyFold(1);
      paint(0);
      options.onLuck(text);
      options.onReadyToClose(false);
    },
    update(dt: number) {
      stepBackdrop(dt);
      if (mode === "hidden") return;
      if (delay > 0) {
        delay -= dt;
        if (delay > 0) return;
      }
      if (mode === "enter") updateEnter(dt);
      else if (mode === "exit") updateExit(dt);
      if (mode === "hold") {
        applyHoldPose();
        revealText(dt);
        return;
      }
      if (mode === "enter" && time >= textStart()) revealText(dt);
    },
    close() {
      if (mode !== "hold" && mode !== "enter") return;
      exitScale = root.scale.x;
      time = 0;
      mode = "exit";
      options.onReadyToClose(false);
    },
    finishEnter() {
      if (mode !== "enter") return;
      mode = "hold";
      fold = 0;
      applyFold(0);
      applyHoldPose();
      options.onReadyToClose(true);
    },
    reposition() {
      if (mode === "hold") applyHoldPose();
      placeBackdrop();
    },
    isEntering: () => mode === "enter",
    canClose: () => mode === "hold",
    isBusy: () => mode !== "hidden",
  };

  function updateEnter(dt: number) {
    const duration = reduceMotion ? 0.45 : ENTER_S;
    time += dt / duration;
    const fly = easeOutCubic(segment(time, 0, 0.72));
    const spin = easeOutCubic(segment(time, 0, 0.82));
    fold = 1 - easeOutCubic(segment(time, 0.08, 0.78));
    const hold = cameraPoint(NOTE_DISTANCE);
    root.position.lerpVectors(launchPoint(), hold, fly);
    const tumbled = camera.quaternion.clone().multiply(TUMBLE);
    tumbled.slerp(camera.quaternion, spin);
    root.quaternion.copy(tumbled);
    root.scale.setScalar(
      lerp(0.28, fittedScale(camera, NOTE_DISTANCE), easeOutCubic(segment(time, 0.08, 1))),
    );
    applyFold(fold);
    placeBackdrop();
    if (time >= 1) {
      mode = "hold";
      applyFold(0);
      applyHoldPose();
      options.onReadyToClose(true);
    }
  }

  function updateExit(dt: number) {
    const duration = reduceMotion ? 0.2 : EXIT_S;
    time += dt / duration;
    const amount = easeOutCubic(clamp01(time));
    root.scale.setScalar(lerp(exitScale, 0.16, amount));
    root.position.lerpVectors(root.position, origin, amount * 0.35);
    if (time >= 1) hide();
  }

  function applyHoldPose() {
    root.position.copy(cameraPoint(NOTE_DISTANCE));
    root.quaternion.copy(camera.quaternion);
    root.scale.setScalar(fittedScale(camera, NOTE_DISTANCE));
    placeBackdrop();
  }

  function textStart(): number {
    const duration = reduceMotion ? 0.45 : ENTER_S;
    return 1 - Math.min(TEXT_LEAD_S, duration) / duration;
  }

  function revealText(dt: number) {
    const total = laidLines.reduce((sum, line) => sum + line.length, 0);
    if (revealed >= total) return;
    const rate = reduceMotion ? 80 : 22;
    const next = Math.min(total, revealed + rate * dt);
    if (Math.floor(next) !== Math.floor(revealed)) paint(next);
    revealed = next;
  }

  function paint(count: number) {
    redraw(count);
  }

  function redraw(count: number) {
    const context = paperCtx;
    context.clearRect(0, 0, PAPER_W, PAPER_H);
    context.fillStyle = "#f6efe4";
    context.fillRect(0, 0, PAPER_W, PAPER_H);
    context.strokeStyle = "rgba(43, 34, 27, 0.18)";
    context.lineWidth = 3;
    context.strokeRect(36, 36, PAPER_W - 72, PAPER_H - 72);
    context.beginPath();
    context.moveTo(PAPER_W / 2, 48);
    context.lineTo(PAPER_W / 2, PAPER_H - 48);
    context.stroke();

    const maxW = PAPER_W - 160;
    const laid = layoutLines(context, message, maxW, TEXT_BOTTOM - TEXT_TOP);
    laidLines = laid.lines;
    context.fillStyle = "#2b221b";
    context.font = `${laid.size}px "Wolgast Two", cursive`;
    context.textAlign = "left";
    context.textBaseline = "middle";
    const block = laid.lines.length * laid.size * 1.2;
    const start = TEXT_TOP + Math.max(0, (TEXT_BOTTOM - TEXT_TOP - block) / 2);
    let remaining = count;
    laid.lines.forEach((line, index) => {
      const shown = line.slice(0, Math.max(0, remaining));
      remaining -= line.length;
      const y = start + laid.size * 0.5 + index * laid.size * 1.2;
      const x = (PAPER_W - context.measureText(line).width) / 2;
      context.fillText(shown, x, y);
    });
    texture.needsUpdate = true;
  }

  function stepBackdrop(dt: number) {
    const target = mode === "enter" || mode === "hold" ? 0.4 : 0;
    const amount = reduceMotion ? 1 : 1 - Math.exp(-dt / 0.2);
    backdropMat.opacity += (target - backdropMat.opacity) * amount;
    if (backdropMat.opacity < 0.001) backdropMat.opacity = 0;
    backdrop.visible = backdropMat.opacity > 0.01;
    if (backdrop.visible) placeBackdrop();
  }

  function placeBackdrop() {
    const viewH = 2 * Math.tan((camera.fov * Math.PI) / 180 / 2) * BACKDROP_DISTANCE;
    backdrop.position.copy(cameraPoint(BACKDROP_DISTANCE));
    backdrop.quaternion.copy(camera.quaternion);
    backdrop.scale.set(viewH * camera.aspect * 1.25, viewH * 1.25, 1);
  }

  function cameraPoint(distance: number): Vector3 {
    const direction = new Vector3();
    camera.getWorldDirection(direction);
    return camera.position.clone().add(direction.multiplyScalar(distance));
  }

  function launchPoint(): Vector3 {
    const forward = new Vector3();
    camera.getWorldDirection(forward);
    return origin.clone().add(forward.multiplyScalar(1.1));
  }

  function applyFold(amount: number) {
    const angle = amount * FOLD_ANGLE;
    left.rotation.y = angle;
    right.rotation.y = -angle;
  }

  function hide() {
    mode = "hidden";
    root.visible = false;
    backdropMat.opacity = 0;
    backdrop.visible = false;
    options.onLuck(null);
    options.onReadyToClose(false);
  }
}

function halfMesh(side: -1 | 1, material: MeshBasicMaterial): Mesh {
  const geometry = new PlaneGeometry(NOTE_W / 2, NOTE_H);
  geometry.translate((side * NOTE_W) / 4, 0, 0);
  const uv = geometry.getAttribute("uv");
  for (let index = 0; index < uv.count; index += 1) {
    const u = uv.getX(index);
    uv.setX(index, side < 0 ? u * 0.5 : 0.5 + u * 0.5);
  }
  const mesh = new Mesh(geometry, material);
  return mesh;
}

function fittedScale(camera: PerspectiveCamera, distance: number): number {
  const viewH = 2 * Math.tan((camera.fov * Math.PI) / 180 / 2) * distance;
  const viewW = viewH * camera.aspect;
  return Math.min((viewW * 0.92) / NOTE_W, (viewH * 0.68) / NOTE_H);
}

function wrapMessage(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const paragraphs = text
    .split(/\n+/)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
  if (paragraphs.length === 0) return [""];
  const lines: string[] = [];
  for (const paragraph of paragraphs) {
    const words = paragraph.split(/\s+/);
    let current = "";
    for (const word of words) {
      const next = current ? `${current} ${word}` : word;
      if (current && ctx.measureText(next).width > maxWidth) {
        lines.push(current);
        current = word;
      } else {
        current = next;
      }
    }
    if (current) lines.push(current);
  }
  return lines.length > 0 ? lines : [""];
}

function layoutLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxHeight: number,
): { size: number; lines: string[] } {
  let size = 92;
  let lines = [""];
  while (size > 28) {
    ctx.font = `${size}px "Wolgast Two", cursive`;
    lines = wrapMessage(ctx, text, maxWidth);
    const tooWide = lines.some((line) => ctx.measureText(line).width > maxWidth + 1);
    const tooTall = lines.length * size * 1.2 > maxHeight;
    if (!tooWide && !tooTall) break;
    size -= 2;
  }
  return { size, lines };
}
