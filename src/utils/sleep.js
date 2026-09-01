export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Counts down `totalSeconds`, calling `onTick(remainingSeconds)` roughly once
// a second until `shouldStop()` becomes true or time runs out. Unlike naively
// looping `sleep(1000)` and decrementing a counter, this recomputes the
// remaining time from wall-clock timestamps on every tick, so a single
// `sleep` call that runs long (e.g. the OS/browser throttling timers while
// the window is minimized or the app is backgrounded) doesn't push the total
// wait out further than intended — the countdown catches back up to the
// original end time instead of drifting.
export async function waitWithCountdown(totalSeconds, { onTick, shouldStop }) {
  const endTime = Date.now() + totalSeconds * 1000;
  while (!shouldStop()) {
    const remainingMs = endTime - Date.now();
    if (remainingMs <= 0) return;
    onTick(Math.ceil(remainingMs / 1000));
    await sleep(Math.min(1000, remainingMs));
  }
}
