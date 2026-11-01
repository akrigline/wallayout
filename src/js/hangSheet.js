// Hang-sheet data and text. `plan` is {wall:{w,h}, hook, frames}; lengths are inches.
import { fmt } from './units.js';
import { hooksOf } from './hooks.js';

// Numbers are stable labels shared with the wall: hidden frames keep theirs but are not listed.
export function sheetRows(plan) {
  const H = plan.wall.h, W = plan.wall.w; let n = 0;
  return plan.frames.filter(f => f.kind !== 'obstacle').map(f => ({ f, n: ++n })).filter(r => !r.f.hidden).map(({ f, n }) => {
    const hooks = hooksOf(f, plan.hook).map(h => ({ hx: f.x + h.x, hfloor: H - (f.y + h.y) }));
    return { n, f, left: f.x, right: W - (f.x + f.w), top: f.y, floor: H - (f.y + f.h), hooks, hx: hooks[0].hx, hfloor: hooks[0].hfloor };
  });
}

export const hiddenCount = plan => plan.frames.filter(f => f.hidden && f.kind !== 'obstacle').length;

export function sheetText(plan, unit) {
  const F = v => fmt(v, unit);
  let t = `Gallery wall: ${F(plan.wall.w)} wide × ${F(plan.wall.h)} tall\nDefault hook is ${F(plan.hook)} below the top of a frame; frames with several hooks list each one. Left = distance from the wall's left edge. Floor = height of the bottom edge above the floor.\n\n`;
  for (const r of sheetRows(plan)) {
    const hk = r.hooks.map((h, k) => (r.hooks.length > 1 ? (k + 1) + ') ' : '') + `${F(h.hx)} from left, ${F(h.hfloor)} above floor`).join('; ');
    t += `${r.n}. ${r.f.name} (${F(r.f.w)} × ${F(r.f.h)}): left edge ${F(r.left)}, top edge ${F(r.top)} below ceiling, bottom edge ${F(r.floor)} above floor. ${r.hooks.length > 1 ? 'Hooks' : 'Hook'}: ${hk}.\n`;
  }
  return t;
}

export function conflictNotice(count) {
  return count ? `${count} frame${count > 1 ? 's have' : ' has'} a conflict (overlap or off the wall). Fix before hanging.` : '';
}
