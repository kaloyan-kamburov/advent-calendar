import {
  BoxGeometry,
  CanvasTexture,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  SphereGeometry,
  SRGBColorSpace,
  TorusGeometry,
  type Material,
} from "three";
import { easeInOutCubic, easeOutCubic, lerp, reduceMotion, segment } from "./anim.ts";

const BODY_W = 1;
const BODY_H = 0.84;
const BODY_D = 1;
const WALL = 0.07;
const LID_H = 0.16;
const LID_PAD = 0.05;
const RIBBON_W = 0.18;
const RIBBON_T = 0.03;

const PRESENT_COLOR = 0xe61722;
const LID_POP_END = 0.38;

export const PRESENT_HALF_HEIGHT = BODY_H / 2;
export const LID_THICKNESS = LID_H;
export const PRESENT_HALF_WIDTH = (BODY_W + LID_PAD) / 2;

const ribbonMat = new MeshPhysicalMaterial({
  color: 0xffffff,
  roughness: 0.24,
  metalness: 0.02,
  clearcoat: 0.45,
  clearcoatRoughness: 0.28,
});

const tissueMat = new MeshStandardMaterial({
  color: 0xf4e7d2,
  roughness: 0.95,
  metalness: 0,
});

const hitMat = new MeshBasicMaterial();

const loopGeo = new TorusGeometry(0.15, 0.042, 16, 36, Math.PI * 1.7);
const tailGeo = new BoxGeometry(0.08, 0.018, 0.3);
const knotGeo = new SphereGeometry(0.07, 20, 14);
const lidGeo = new BoxGeometry(BODY_W + LID_PAD, LID_H, BODY_D + LID_PAD);
const tagGeo = new PlaneGeometry(0.46, 0.46);

function colorForDay(): number {
  return PRESENT_COLOR;
}

export type Present = {
  day: number;
  group: Group;
  lid: Group;
  lidMat: MeshStandardMaterial;
  bodyMat: MeshStandardMaterial;
  ribbon: Group;
  tag: Mesh;
  hit: Mesh;
  lidBaseY: number;
  lidAnimating: boolean;
  lidTime: number;
  hoverLift: number;
};

export function createPresent(day: number): Present {
  const color = colorForDay();
  const bodyMat = new MeshStandardMaterial({
    color,
    roughness: 0.58,
    metalness: 0.03,
    emissive: color,
    emissiveIntensity: 0,
  });
  const lidMat = bodyMat.clone();
  const group = new Group();
  group.name = `day-${day}`;
  group.add(buildShell(bodyMat));

  const lidBaseY = BODY_H / 2 + LID_H / 2 + 0.012;
  const lid = new Group();
  lid.position.y = lidBaseY;
  lid.add(new Mesh(lidGeo, lidMat));
  group.add(lid);

  const ribbon = buildRibbon();
  group.add(ribbon);
  const tag = buildTag(day);
  group.add(tag);

  const hit = new Mesh(
    new BoxGeometry(BODY_W + LID_PAD, BODY_H + LID_H + 0.35, BODY_D + LID_PAD),
    hitMat,
  );
  hit.position.y = 0.12;
  hit.visible = false;
  hit.userData.day = day;
  group.add(hit);

  return {
    day,
    group,
    lid,
    lidMat,
    bodyMat,
    ribbon,
    tag,
    hit,
    lidBaseY,
    lidAnimating: false,
    lidTime: 0,
    hoverLift: 0,
  };
}

export function playLid(present: Present): void {
  if (!present.lid.visible || present.lidAnimating) return;
  present.lidAnimating = true;
  present.lidTime = 0;
  present.lidMat.transparent = true;
  present.lidMat.opacity = 1;
  present.lidMat.depthWrite = true;
  present.lidMat.needsUpdate = true;
}

export function stepLid(present: Present, dt: number): void {
  if (!present.lidAnimating) return;
  const duration = reduceMotion ? 0.4 : 1.85;
  present.lidTime += dt / duration;
  const pop = easeOutCubic(segment(present.lidTime, 0, LID_POP_END));
  const fade = easeInOutCubic(segment(present.lidTime, LID_POP_END, 1));
  present.lid.position.y = present.lidBaseY + pop * 1.15;
  present.lid.rotation.x = -pop * 1.25;
  present.lid.rotation.y = pop * 0.55;
  present.lid.rotation.z = pop * 0.42;
  present.lidMat.opacity = 1 - fade;
  present.lidMat.depthWrite = fade === 0;
  if (present.lidTime >= 1) {
    present.lid.visible = false;
    present.lidMat.opacity = 0;
    present.lidAnimating = false;
  }
}

function buildShell(material: Material): Group {
  const shell = new Group();
  const innerW = BODY_W - WALL * 2;
  const innerD = BODY_D - WALL * 2;
  shell.add(wall(new BoxGeometry(WALL, BODY_H, BODY_D), material, -BODY_W / 2 + WALL / 2, 0, 0));
  shell.add(wall(new BoxGeometry(WALL, BODY_H, BODY_D), material, BODY_W / 2 - WALL / 2, 0, 0));
  shell.add(wall(new BoxGeometry(innerW, BODY_H, WALL), material, 0, 0, BODY_D / 2 - WALL / 2));
  shell.add(wall(new BoxGeometry(innerW, BODY_H, WALL), material, 0, 0, -BODY_D / 2 + WALL / 2));
  shell.add(wall(new BoxGeometry(innerW, WALL, innerD), material, 0, -BODY_H / 2 + WALL / 2, 0));

  const tissueH = BODY_H * 0.38;
  const tissue = new Mesh(
    new BoxGeometry(innerW - 0.04, tissueH, innerD - 0.04),
    tissueMat.clone(),
  );
  tissue.userData.tissue = true;
  tissue.position.y = -BODY_H / 2 + WALL + tissueH / 2 + 0.01;
  shell.add(tissue);
  return shell;
}

function wall(geometry: BoxGeometry, material: Material, x: number, y: number, z: number): Mesh {
  const mesh = new Mesh(geometry, material);
  mesh.position.set(x, y, z);
  return mesh;
}

function buildRibbon(): Group {
  const ribbon = new Group();
  const halfW = (BODY_W + LID_PAD) / 2;
  const halfD = (BODY_D + LID_PAD) / 2;
  const topY = BODY_H / 2 + LID_H + 0.012;
  const bottomY = -BODY_H / 2;
  const midY = (topY + bottomY) / 2;
  const fullH = topY - bottomY;
  const frontZ = halfD + RIBBON_T / 2 + 0.006;

  ribbon.add(band(RIBBON_W, fullH, RIBBON_T, 0, midY, frontZ));
  ribbon.add(band(RIBBON_W, fullH, RIBBON_T, 0, midY, -frontZ));
  ribbon.add(band(RIBBON_T, fullH, RIBBON_W, -(halfW + RIBBON_T / 2 + 0.006), midY, 0));
  ribbon.add(band(RIBBON_T, fullH, RIBBON_W, halfW + RIBBON_T / 2 + 0.006, midY, 0));
  ribbon.add(band(RIBBON_W, RIBBON_T, halfD * 2 + 0.1, 0, topY + RIBBON_T / 2 + 0.004, 0));
  ribbon.add(band(halfW * 2 + 0.1, RIBBON_T, RIBBON_W, 0, topY + RIBBON_T + 0.008, 0));

  const bow = buildBow();
  bow.position.set(0, topY + 0.02, -0.12);
  ribbon.add(bow);
  return ribbon;
}

function band(width: number, height: number, depth: number, x: number, y: number, z: number): Mesh {
  const mesh = new Mesh(new BoxGeometry(width, height, depth), ribbonMat);
  mesh.position.set(x, y, z);
  return mesh;
}

function buildBow(): Group {
  const bow = new Group();
  const left = new Mesh(loopGeo, ribbonMat);
  left.position.set(-0.14, 0.05, 0);
  left.rotation.y = 0.42;
  left.rotation.z = 0.95;
  const right = new Mesh(loopGeo, ribbonMat);
  right.position.set(0.14, 0.05, 0);
  right.rotation.y = -0.42;
  right.rotation.z = -0.95;

  const tailL = new Mesh(tailGeo, ribbonMat);
  tailL.position.set(-0.2, 0.012, 0.04);
  tailL.rotation.y = 1.05;
  const tailR = new Mesh(tailGeo, ribbonMat);
  tailR.position.set(0.2, 0.012, 0.04);
  tailR.rotation.y = -1.05;

  const knot = new Mesh(knotGeo, ribbonMat);
  knot.scale.set(1.15, 0.7, 1);
  knot.position.set(0, 0.07, 0.04);

  bow.add(left, right, tailL, tailR, knot);
  return bow;
}

export function placeTag(present: Present): void {
  const openAmount = present.lidAnimating
    ? easeOutCubic(segment(present.lidTime, 0, LID_POP_END))
    : present.lid.visible
      ? 0
      : 1;
  const lidTop = present.lidBaseY + LID_H / 2;
  present.tag.rotation.set(lerp(-Math.PI / 2, -1.2, openAmount), 0, 0);
  present.tag.position.set(0, lerp(lidTop + 0.04, 0.2, openAmount), lerp(0.3, 0.05, openAmount));
}

function buildTag(day: number): Mesh {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Tag canvas is unavailable");
  ctx.clearRect(0, 0, 256, 256);
  ctx.fillStyle = "#f6efe4";
  ctx.beginPath();
  ctx.arc(128, 128, 108, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#2b221b";
  ctx.font = "700 112px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(String(day), 128, 134);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  const material = new MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false });
  const tag = new Mesh(tagGeo, material);
  const lidTop = BODY_H / 2 + LID_H + 0.012;
  tag.position.set(0, lidTop + 0.04, 0.3);
  tag.rotation.x = -Math.PI / 2;
  return tag;
}
