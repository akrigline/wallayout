import { createStore } from '../js/store.js';
import { createLayouts } from '../js/layouts.js';
import * as L from '../js/layout.js';
import { hooksOf as hooksOfU } from '../js/hooks.js';
import { boundsOf } from '../js/selection.js';
import { num as numU, fmt as fmtU, parseLen as parseLenU, parseBulk as parseBulkU, unitWord as unitWordU } from '../js/units.js';

export const K = 20;                       // wall-plane pixels per inch
export const $ = s => document.querySelector(s);
export const { clamp, r16 } = L;
export const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
/* ---------- state ---------- */
export const store = createStore();
export const S = store.state;
export const layouts = createLayouts();
export const fresh = store.fresh;
export const T = { mode:'design', calibrating:false, uiHidden:false, drag:null, guides:[], num:new Map(), bad:new Map(), hsel:null, hdrag:null, u:1, cpTimer:null, sels:new Set(), marq:null, hkdrag:null, piecesOpen:false };
export const save = () => store.save();
export const num = v => numU(v, S.unit);
export const fmt = v => fmtU(v, S.unit);
export const parseLen = s => parseLenU(s, S.unit);
export const parseBulk = txt => parseBulkU(txt, S.unit);
export const unitWord = () => unitWordU(S.unit);
/* ---------- elements ---------- */
export const stage=$('#stage'), wall=$('#wall'), calsvg=$('#calsvg'), hud=$('#hud'), ptool=$('#ptool');
export const handles=[...document.querySelectorAll('.h')];
export const els=new Map();
export const area = () => L.areaOf(S);
export const normArea = () => { S.area = L.normArea(S.area, S.wall); };
/* ---------- selection ---------- */
// S.sel (persisted) is the primary selection; T.sels is the full set for this session. syncSel reconciles them with the frame list.
export const hooksOf = f => hooksOfU(f, S.hook);
export { boundsOf };
export const selFrames = () => S.frames.filter(f=>T.sels.has(f.id)&&!f.hidden);
export function syncSel(){
  const ids=new Set(S.frames.filter(f=>!f.hidden).map(f=>f.id));
  for (const id of [...T.sels]) if (!ids.has(id)) T.sels.delete(id);
  if (S.sel==null||!ids.has(S.sel)){ S.sel=null; T.sels.clear(); }
  else if (!T.sels.has(S.sel)) T.sels=new Set([S.sel]);
}
export function setSelection(ids){ T.sels=new Set(ids); S.sel=ids.length?ids[ids.length-1]:null; }
export function toggleSel(id){
  if (T.sels.has(id)){ T.sels.delete(id); const r=[...T.sels]; S.sel=r.length?r[r.length-1]:null; }
  else { T.sels.add(id); S.sel=id; }
}
export function dropFromSel(id){ T.sels.delete(id); if (S.sel===id){ const r=[...T.sels]; S.sel=r.length?r[r.length-1]:null; } }
export const V = { Hm:null, Hi:null };  // current wall-plane -> screen homography and its inverse
