import { $, S, T, esc, fmt } from './ctx.js';
import { toast } from './toast.js';
import { renderControls } from './render.js';
import * as HS from '../js/hangSheet.js';
import { encodeSpec as encodePlan, decodeSpec as decodePlan } from '../js/shareCode.js';

export const sheetRows = () => HS.sheetRows(S);
export const sheetText = () => HS.sheetText(S,S.unit);
export function openSheet(){
  const rows=sheetRows(), bad=T.bad.size;
  $('#sheetBody').innerHTML=(bad?`<p style="color:var(--bad)">${HS.conflictNotice(bad)}</p>`:'')+
    `<p>Wall ${fmt(S.wall.w)} × ${fmt(S.wall.h)}. Hook sits ${fmt(S.hook)} below each frame's top edge. Measure from the wall's left edge and from the floor.</p>`+
    (rows.length?`<table><thead><tr><th>#</th><th>Name</th><th>Size</th><th>Left edge</th><th>Top (from ceiling)</th><th>Bottom (from floor)</th><th>Hook from left</th><th>Hook from floor</th></tr></thead><tbody>`+
    rows.map(r=>`<tr><td>${r.n}</td><td>${esc(r.f.name)}</td><td>${fmt(r.f.w)} × ${fmt(r.f.h)}</td><td>${fmt(r.left)}</td><td>${fmt(r.top)}</td><td>${fmt(r.floor)}</td><td>${fmt(r.hx)}</td><td>${fmt(r.hfloor)}</td></tr>`).join('')+`</tbody></table>`:'<p>No frames on the wall yet.</p>');
  $('#sheet').hidden=false; renderControls();
}
export async function copyText(t){
  try { await navigator.clipboard.writeText(t); toast('Copied.'); return; } catch(e) {}
  const ta=document.createElement('textarea'); ta.value=t; ta.style.position='fixed'; ta.style.opacity='0'; document.body.appendChild(ta); ta.select();
  let ok=false; try { ok=document.execCommand('copy'); } catch(e) {}
  ta.remove(); toast(ok?'Copied.':'Copy blocked here. Select the table and copy instead.');
}

/* ---------- share code ---------- */
export const encodeSpec = () => encodePlan(S);
export const decodeSpec = txt => decodePlan(txt,{gap:S.gap,hook:S.hook});
export function openShare(){ $('#codeOut').value=encodeSpec(); $('#codeIn').value=''; $('#share').hidden=false; }

export function initModals(){
  $('#sheet').addEventListener('click',e=>{ if (e.target.id==='sheet') $('#sheet').hidden=true; });
  $('#share').addEventListener('click',e=>{ if (e.target.id==='share') $('#share').hidden=true; });
  $('#codeOut').addEventListener('focus',e=>e.target.select());
}
