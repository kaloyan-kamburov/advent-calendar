export function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

export function lerp(from: number, to: number, amount: number): number {
  return from + (to - from) * amount;
}

export function segment(value: number, start: number, end: number): number {
  return clamp01((value - start) / (end - start));
}

export function easeOutCubic(value: number): number {
  return 1 - (1 - value) ** 3;
}

export function easeInCubic(value: number): number {
  return value * value * value;
}

export function easeInOutCubic(value: number): number {
  return value < 0.5 ? 4 * value * value * value : 1 - (-2 * value + 2) ** 3 / 2;
}

export const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
