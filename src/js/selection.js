// Geometry for multi-select: bounds, align, distribute. Each function returns moves [{id,x,y}] and never mutates. No DOM access.
import { r16 } from './layout.js';

export const boundsOf = a => ({
  x0: Math.min(...a.map(f => f.x)), y0: Math.min(...a.map(f => f.y)),
  x1: Math.max(...a.map(f => f.x + f.w)), y1: Math.max(...a.map(f => f.y + f.h)),
});

// how: left | hcenter | right | top | vcenter | bottom, relative to the group's outer box.
export function alignMoves(frames, how) {
  if (frames.length < 2) return [];
  const b = boundsOf(frames);
  return frames.map(f => {
    let x = f.x, y = f.y;
    if (how === 'left') x = b.x0; else if (how === 'right') x = b.x1 - f.w; else if (how === 'hcenter') x = (b.x0 + b.x1) / 2 - f.w / 2;
    else if (how === 'top') y = b.y0; else if (how === 'bottom') y = b.y1 - f.h; else if (how === 'vcenter') y = (b.y0 + b.y1) / 2 - f.h / 2;
    return { id: f.id, x: r16(x), y: r16(y) };
  });
}

// Equal gaps between 3+ frames along an axis ('h' or 'v'), outermost two fixed, ordered by center.
export function distributeMoves(frames, axis) {
  if (frames.length < 3) return [];
  const horiz = axis === 'h', b = boundsOf(frames);
  const sorted = frames.slice().sort((p, q) => horiz ? (p.x + p.w / 2) - (q.x + q.w / 2) : (p.y + p.h / 2) - (q.y + q.h / 2));
  const size = f => horiz ? f.w : f.h, total = sorted.reduce((t, f) => t + size(f), 0);
  const gap = ((horiz ? b.x1 - b.x0 : b.y1 - b.y0) - total) / (sorted.length - 1);
  let pos = horiz ? b.x0 : b.y0;
  return sorted.map(f => { const m = horiz ? { id: f.id, x: r16(pos), y: f.y } : { id: f.id, x: f.x, y: r16(pos) }; pos += size(f) + gap; return m; });
}

// Translate the group so its outer box is centered in `area`.
export function centerMoves(frames, area) {
  if (!frames.length) return [];
  const b = boundsOf(frames), dx = area.x + area.w / 2 - (b.x0 + b.x1) / 2, dy = area.y + area.h / 2 - (b.y0 + b.y1) / 2;
  return frames.map(f => ({ id: f.id, x: r16(f.x + dx), y: r16(f.y + dy) }));
}
