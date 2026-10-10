import { createStore } from '../js/store.js';
import { createLayouts } from '../js/layouts.js';
import * as L from '../js/layout.js';
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
export const T = { mode:'design', calibrating:false, uiHidden:false, drag:null, guides:[], num:new Map(), bad:new Map(), hsel:null, hdrag:null, u:1, cpTimer:null };
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
export const V = { Hm:null, Hi:null };  // current wall-plane -> screen homography and its inverse
