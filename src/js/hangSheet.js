// Hang-sheet data and text. `plan` is {wall:{w,h}, hook, frames}; lengths are inches.
import { fmt } from './units.js';

export function sheetRows(plan) {
  const H = plan.wall.h, W = plan.wall.w; let n = 0;
  return plan.frames.filter(f => f.kind !== 'obstacle').map(f => ({
    n: ++n, f,
    left: f.x, right: W - (f.x + f.w), top: f.y, floor: H - (f.y + f.h), hx: f.x + f.w / 2, hfloor: H - (f.y + plan.hook),
  }));
}

export function sheetText(plan, unit) {
  const F = v => fmt(v, unit);
  let t = `Gallery wall: ${F(plan.wall.w)} wide × ${F(plan.wall.h)} tall\nHook is ${F(plan.hook)} below the top of each frame. Left = distance from the wall's left edge. Floor = height of the bottom edge above the floor.\n\n`;
  for (const r of sheetRows(plan)) t += `${r.n}. ${r.f.name} (${F(r.f.w)} × ${F(r.f.h)}): left edge ${F(r.left)}, top edge ${F(r.top)} below ceiling, bottom edge ${F(r.floor)} above floor. Hook ${F(r.hx)} from left, ${F(r.hfloor)} above floor.\n`;
  return t;
}

export function conflictNotice(count) {
  return count ? `${count} frame${count > 1 ? 's have' : ' has'} a conflict (overlap or off the wall). Fix before hanging.` : '';
}
