// Per-frame hooks. A hook is {x, y}: inches from the frame's top-left corner. No DOM access.
import { clamp, r16 } from './layout.js';

export const MAX_HOOKS_UI = 6;
export const MAX_HOOKS_IMPORT = 8;

// The frame's own hooks, else one default hook at its horizontal center `defaultY` below the top.
export const hooksOf = (f, defaultY) => f.hooks && f.hooks.length ? f.hooks : [{ x: f.w / 2, y: defaultY }];

// Valid, clamped copies of f.hooks, or undefined when none are usable.
export function cleanHooks(f) {
  if (!Array.isArray(f.hooks)) return undefined;
  const ok = v => typeof v === 'number' && isFinite(v);
  const hs = f.hooks.slice(0, MAX_HOOKS_IMPORT).filter(h => h && ok(h.x) && ok(h.y)).map(h => ({ x: clamp(h.x, 0, f.w), y: clamp(h.y, 0, f.h) }));
  return hs.length ? hs : undefined;
}

// Adjust custom hooks after a frame's width or height changed from `old` to `now`.
export function scaleHooks(f, axis, old, now) {
  if (!f.hooks) return;
  if (axis === 'w') { if (old > 0) f.hooks.forEach(h => { h.x = r16(h.x * now / old); }); }
  else f.hooks.forEach(h => { h.y = Math.min(h.y, now); });
}

// The hook list after "Add hook": a new one a quarter of the width right of the last (or left if that would leave the frame).
export function addedHook(f, defaultY) {
  const hs = hooksOf(f, defaultY), last = hs[hs.length - 1];
  let x = last.x + f.w * .25; if (x > f.w) x = last.x - f.w * .25;
  return { x: r16(clamp(x, 0, f.w)), y: last.y };
}

// Two hooks at 25% and 75% of the width, at the first hook's height.
export const twoHooks = (f, defaultY) => { const y = hooksOf(f, defaultY)[0].y; return [{ x: r16(f.w * .25), y }, { x: r16(f.w * .75), y }]; };
