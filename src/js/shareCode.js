// GWP1 plan codes. Calibration and projection style are deliberately not included.

const MAX_CODE = 200000;
const MAX_FRAMES = 500;

export function encodeSpec(plan) {
  const d = {
    v: 1, unit: plan.unit, wall: plan.wall, area: plan.area, gap: plan.gap, hook: plan.hook,
    frames: plan.frames.map(f => ({ name: f.name, w: f.w, h: f.h, x: f.x, y: f.y, hue: f.hue, kind: f.kind })),
  };
  return 'GWP1:' + btoa(unescape(encodeURIComponent(JSON.stringify(d))));
}

// `defaults` supplies {gap, hook} for codes that omit them. Throws on anything invalid.
export function decodeSpec(txt, defaults) {
  const s = String(txt).trim().replace(/\s+/g, '');
  if (s.length > MAX_CODE) throw new Error('too large');
  const m = s.match(/GWP1:([A-Za-z0-9+/=]+)/);
  if (!m) throw new Error('no code');
  const d = JSON.parse(decodeURIComponent(escape(atob(m[1]))));
  const ok = v => typeof v === 'number' && isFinite(v);
  if (!d || !d.wall || !(d.wall.w > 0) || !(d.wall.h > 0) || !Array.isArray(d.frames)) throw new Error('bad');
  const frames = d.frames.slice(0, MAX_FRAMES).map((f, i) => {
    if (!f || !(f.w > 0 && f.h > 0) || !ok(f.x) || !ok(f.y)) throw new Error('bad');
    return { id: i + 1, name: String(f.name || 'Frame').slice(0, 80), w: f.w, h: f.h, x: f.x, y: f.y, hue: ok(f.hue) ? f.hue : Math.round(((i + 1) * 137.5) % 360), kind: f.kind === 'obstacle' ? 'obstacle' : 'frame' };
  });
  const a = d.area, area = a && ok(a.x) && ok(a.y) && a.w > 0 && a.h > 0 ? { x: a.x, y: a.y, w: a.w, h: a.h } : null;
  return { unit: d.unit === 'cm' ? 'cm' : 'in', wall: { w: d.wall.w, h: d.wall.h }, area, gap: ok(d.gap) && d.gap >= 0 ? d.gap : defaults.gap, hook: ok(d.hook) && d.hook >= 0 ? d.hook : defaults.hook, frames };
}
