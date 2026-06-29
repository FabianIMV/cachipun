// Tiny dependency-free tween engine driven from the render loop.
// Lets us do GSAP-style eased animations without an extra library.
// NOTE: durations and delays are in SECONDS, matching the per-frame
// delta time (also seconds) that the render loop passes to updateTweens.

const active = [];

export const Ease = {
  linear: (t) => t,
  outCubic: (t) => 1 - Math.pow(1 - t, 3),
  inOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  outBack: (t) => {
    const c1 = 1.70158, c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
  outElastic: (t) => {
    const c4 = (2 * Math.PI) / 3;
    if (t === 0 || t === 1) return t;
    return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  },
  outBounce: (t) => {
    const n1 = 7.5625, d1 = 2.75;
    if (t < 1 / d1) return n1 * t * t;
    if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
    if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
    return n1 * (t -= 2.625 / d1) * t + 0.984375;
  },
};

// duration / delay are in seconds.
export function tween({ duration = 0.6, delay = 0, ease = Ease.outCubic, onUpdate, onComplete }) {
  const t = { elapsed: -delay, duration, ease, onUpdate, onComplete, done: false };
  active.push(t);
  return t;
}

export function updateTweens(dt) {
  for (let i = active.length - 1; i >= 0; i--) {
    const t = active[i];
    t.elapsed += dt;
    if (t.elapsed < 0) continue;
    const raw = Math.min(t.elapsed / t.duration, 1);
    const v = t.ease(raw);
    if (t.onUpdate) t.onUpdate(v, raw);
    if (raw >= 1) {
      t.done = true;
      active.splice(i, 1);
      if (t.onComplete) t.onComplete();
    }
  }
}

export function clearTweens() {
  active.length = 0;
}
