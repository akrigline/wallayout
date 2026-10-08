// Frame placement logic. Pure functions over a plan: {wall:{w,h}, area, gap, grid, snap, frames}.
// Lengths are inches. Nothing here touches the DOM or mutates its input.

export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const r16 = v => Math.round(v * 16) / 16;

const EPS = 1e-3;
const isFrame = f => f.kind !== 'obstacle';

export const areaOf = p => p.area || { x: 0, y: 0, w: p.wall.w, h: p.wall.h };

// Returns a copy of `area` clamped onto the wall (or null).
export function normArea(area, wall) {
  if (!area) return null;
  const a = { ...area };
  a.w = clamp(a.w, 2, wall.w); a.h = clamp(a.h, 2, wall.h);
  a.x = clamp(a.x, 0, wall.w - a.w); a.y = clamp(a.y, 0, wall.h - a.h);
  return a;
}

// Map of frame id -> conflict message.
export function computeBad(p) {
  const bad = new Map(), W = p.wall.w, H = p.wall.h, e = EPS, F = p.frames;
  for (const f of F) {
    if (f.x < -e || f.y < -e || f.x + f.w > W + e || f.y + f.h > H + e) bad.set(f.id, 'Extends past the wall');
  }
  if (p.area) {
    const a = p.area;
    for (const f of F) if (isFrame(f) && !bad.has(f.id) && (f.x < a.x - e || f.y < a.y - e || f.x + f.w > a.x + a.w + e || f.y + f.h > a.y + a.h + e)) bad.set(f.id, 'Outside the gallery area');
  }
  for (let i = 0; i < F.length; i++) for (let j = i + 1; j < F.length; j++) {
    const a = F[i], b = F[j];
    if (a.x < b.x + b.w - e && b.x < a.x + a.w - e && a.y < b.y + b.h - e && b.y < a.y + a.h - e) {
      if (!bad.has(a.id)) bad.set(a.id, 'Overlaps ' + b.name);
      if (!bad.has(b.id)) bad.set(b.id, 'Overlaps ' + a.name);
    }
  }
  return bad;
}

// Distance from `f` to its nearest neighbor on each side (null if none).
export function gapsOf(frames, f) {
  let L = null, R = null, Tp = null, B = null; const m = (a, g) => a == null ? g : Math.min(a, g);
  for (const o of frames) {
    if (o === f) continue;
    const ovY = f.y < o.y + o.h && o.y < f.y + f.h, ovX = f.x < o.x + o.w && o.x < f.x + f.w;
    if (ovY) { if (o.x + o.w <= f.x + 1e-6) L = m(L, f.x - (o.x + o.w)); else if (o.x >= f.x + f.w - 1e-6) R = m(R, o.x - (f.x + f.w)); }
    if (ovX) { if (o.y + o.h <= f.y + 1e-6) Tp = m(Tp, f.y - (o.y + o.h)); else if (o.y >= f.y + f.h - 1e-6) B = m(B, o.y - (f.y + f.h)); }
  }
  return { L, R, T: Tp, B };
}

// Topmost frame under the point.
export function hit(frames, x, y) {
  for (let i = frames.length - 1; i >= 0; i--) { const f = frames[i]; if (x >= f.x && x <= f.x + f.w && y >= f.y && y <= f.y + f.h) return f; }
  return null;
}

// Snapped position for dragging `f` toward (nx, ny). `thr` is the snap distance in inches.
export function snapMove(p, f, nx, ny, free, thr) {
  const W = p.wall.w, H = p.wall.h, g = p.gap, guides = [];
  if (!free && p.snap) {
    const O = p.frames.filter(o => o !== f);
    const pick = (mine, cands, axis) => {
      let best = thr, delta = null, pos = null;
      for (let i = 0; i < mine.length; i++) for (const t of cands[i]) {
        const d = t - mine[i]; if (Math.abs(d) < best) { best = Math.abs(d); delta = d; pos = t; }
      }
      return delta == null ? null : { delta, pos, axis };
    };
    const mx = [nx, nx + f.w / 2, nx + f.w], my = [ny, ny + f.h / 2, ny + f.h];
    const A = areaOf(p), cx = [[0, A.x], [W / 2, A.x + A.w / 2], [W, A.x + A.w]], cy = [[0, A.y], [H / 2, A.y + A.h / 2], [H, A.y + A.h]];
    for (const o of O) {
      cx[0].push(o.x, o.x + o.w, o.x + o.w / 2, o.x + o.w + g); cx[1].push(o.x + o.w / 2); cx[2].push(o.x + o.w, o.x, o.x + o.w / 2, o.x - g);
      cy[0].push(o.y, o.y + o.h, o.y + o.h / 2, o.y + o.h + g); cy[1].push(o.y + o.h / 2); cy[2].push(o.y + o.h, o.y, o.y + o.h / 2, o.y - g);
    }
    const sx = pick(mx, cx, 'x'), sy = pick(my, cy, 'y');
    if (sx) { nx += sx.delta; guides.push({ axis: 'x', pos: sx.pos }); }
    if (sy) { ny += sy.delta; guides.push({ axis: 'y', pos: sy.pos }); }
    if (!sx && p.grid > 0) nx = Math.round(nx / p.grid) * p.grid;
    if (!sy && p.grid > 0) ny = Math.round(ny / p.grid) * p.grid;
  } else if (!free && p.grid > 0) {
    nx = Math.round(nx / p.grid) * p.grid; ny = Math.round(ny / p.grid) * p.grid;
  }
  return { x: nx, y: ny, guides };
}

// First clear position for a new w x h frame, scanning the area in 1" steps.
export function findSpot(p, w, h) {
  const A = areaOf(p), g = p.gap / 2;
  for (let y = A.y + p.gap; y + h <= A.y + A.h - p.gap + 1e-6; y += 1) for (let x = A.x + p.gap; x + w <= A.x + A.w - p.gap + 1e-6; x += 1) {
    if (!p.frames.some(o => x < o.x + o.w + g && o.x < x + w + g && y < o.y + o.h + g && o.y < y + h + g)) return [x, y];
  }
  return [clamp(A.x + (A.w - w) / 2, 0, Math.max(0, p.wall.w - w)), clamp(A.y + (A.h - h) / 2, 0, Math.max(0, p.wall.h - h))];
}

// Row-pack all non-obstacle frames. Returns {moves:[{id,x,y}], overflow}; moves is empty if there are no frames.
export function arrange(p, { shuffle = false, rng = Math.random } = {}) {
  const fr = p.frames.filter(isFrame); if (!fr.length) return { moves: [], overflow: false };
  const Ar = areaOf(p), W = Ar.w, H = Ar.h, g = p.gap; const order = fr.slice();
  if (shuffle) { for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; } }
  else order.sort((a, b) => b.w * b.h - a.w * a.h);
  const totalArea = order.reduce((s, f) => s + (f.w + g) * (f.h + g), 0), maxW = Math.max(...order.map(f => f.w));
  let tw = clamp(Math.sqrt(totalArea * (W / H)), maxW, Math.max(maxW, W)), rows, th;
  for (let t = 0; t < 40; t++) {
    rows = []; let row = null;
    for (const f of order) {
      if (!row || row.w + g + f.w > tw + 1e-6) { row = { items: [], w: 0, h: 0 }; rows.push(row); }
      row.w += (row.items.length ? g : 0) + f.w; row.items.push(f); row.h = Math.max(row.h, f.h);
    }
    th = rows.reduce((s, r) => s + r.h, 0) + g * (rows.length - 1);
    if (th <= H || tw >= W) break; tw = Math.min(W, tw * 1.06);
  }
  const moves = [];
  let y = Ar.y + (H - th) / 2;
  for (const r of rows) { let x = Ar.x + (W - r.w) / 2; for (const f of r.items) { moves.push({ id: f.id, x: r16(x), y: r16(y + (r.h - f.h) / 2) }); x += f.w + g; } y += r.h + g; }
  return { moves, overflow: th > H + 1e-6 };
}

// Moves that center the bounding box of all non-obstacle frames in the area.
export function centerGroup(p) {
  const fr = p.frames.filter(isFrame); if (!fr.length) return [];
  const x0 = Math.min(...fr.map(f => f.x)), x1 = Math.max(...fr.map(f => f.x + f.w)), y0 = Math.min(...fr.map(f => f.y)), y1 = Math.max(...fr.map(f => f.y + f.h));
  const Ar = areaOf(p), dx = Ar.x + Ar.w / 2 - (x0 + x1) / 2, dy = Ar.y + Ar.h / 2 - (y0 + y1) / 2;
  return fr.map(f => ({ id: f.id, x: r16(f.x + dx), y: r16(f.y + dy) }));
}
