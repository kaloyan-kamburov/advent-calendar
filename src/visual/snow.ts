const FLAKE_COUNT = 65;

export function createSnow(root: HTMLElement): void {
  const flakes = document.createDocumentFragment();
  for (let index = 0; index < FLAKE_COUNT; index += 1) {
    const flake = document.createElement("span");
    flake.className = "snowflake";
    flake.style.setProperty("--size", `${randomInt(5) * 0.2}vw`);
    flake.style.setProperty("--left-ini", `${randomInt(20) - 10}vw`);
    flake.style.setProperty("--left-end", `${randomInt(20) - 10}vw`);
    flake.style.left = `${randomInt(100)}vw`;
    flake.style.animationDuration = `${5 + randomInt(10)}s`;
    flake.style.animationDelay = `-${randomInt(10)}s`;
    flakes.append(flake);
  }
  root.append(flakes);
}

function randomInt(max: number): number {
  return 1 + Math.floor(Math.random() * max);
}
