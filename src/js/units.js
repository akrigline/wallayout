// Unit formatting and parsing. Lengths are stored in inches; `unit` is 'in' or 'cm'.

export function fracIn(v) {
  const sign = v < 0 ? '-' : ''; v = Math.abs(v);
  let w = Math.floor(v), n = Math.round((v - w) * 8), d = 8;
  if (n === 8) { w++; n = 0; }
  if (!n) return sign + w;
  while (n % 2 === 0) { n /= 2; d /= 2; }
  return sign + (w ? w + ' ' : '') + n + '/' + d;
}

export const num = (v, unit) => unit === 'cm' ? String(Math.round(v * 25.4) / 10) : fracIn(v);
export const fmt = (v, unit) => unit === 'cm' ? num(v, unit) + ' cm' : num(v, unit) + '″';
export const unitWord = unit => unit === 'cm' ? 'cm' : 'in';

export function parseLen(s, unit) {
  s = String(s).trim().toLowerCase().replace(/["”″]/g, '').replace(/\b(inches|inch|in)\b/g, '').replace(/\bcm\b/g, '').trim();
  let v; const m = s.match(/^(-?\d+)?\s*(\d+)\/(\d+)$/);
  if (m) { const w = m[1] ? parseFloat(m[1]) : 0; v = (w < 0 ? -1 : 1) * (Math.abs(w) + (+m[2]) / (+m[3])); }
  else v = parseFloat(s);
  if (!isFinite(v)) return NaN;
  return unit === 'cm' ? v / 2.54 : v;
}

export function parseBulk(txt, unit) {
  const N = '(\\d+(?:\\.\\d+)?(?:\\s+\\d+/\\d+)?|\\d+/\\d+)';
  const re = new RegExp('^(.*?)\\s*' + N + '\\s*(?:x|×|\\*|by)\\s*' + N + '\\s*(?:["”″]|in|cm)?\\s*(.*)$', 'i');
  const out = [];
  for (const line of txt.split(/\n/)) {
    const m = line.trim().match(re); if (!m) continue;
    const w = parseLen(m[2], unit), h = parseLen(m[3], unit); if (!(w > 0 && h > 0)) continue;
    out.push({ name: (m[1] + ' ' + m[4]).replace(/[-–:,]+\s*$/, '').trim(), w, h });
  }
  return out;
}
