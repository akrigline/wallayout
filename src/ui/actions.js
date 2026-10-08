import { S, save, store } from './ctx.js';
import { locked, toast } from './toast.js';
import { checkpoint, renderAll } from './render.js';
import * as L from '../js/layout.js';

export const undo = () => store.undo();
export const redo = () => store.redo();
export const findSpot = (w,h) => L.findSpot(S,w,h);
export function addFrame(o,quiet){
  const id=S.nextId++, [x,y]=findSpot(o.w,o.h);
  const f={id,name:o.name||(o.kind==='obstacle'?'Obstacle':'Frame '+id),w:o.w,h:o.h,x,y,hue:Math.round((id*137.5)%360),kind:o.kind||'frame'};
  S.frames.push(f); S.sel=id;
  if (!quiet){ checkpoint(); renderAll(); }
  return f;
}
export const applyMoves = moves => { for (const m of moves){ const f=S.frames.find(x=>x.id===m.id); if (f){ f.x=m.x; f.y=m.y; } } };
export function arrange(shuffle){
  if (locked()) return;
  if (!S.frames.some(f=>f.kind!=='obstacle')){ toast('Add some frames first.'); return; }
  const r=L.arrange(S,{shuffle});
  applyMoves(r.moves);
  checkpoint(); renderAll();
  if (r.overflow) toast('These frames are too big to fit in the gallery area with that gap.');
}
export function centerGroup(){
  if (locked()) return;
  applyMoves(L.centerGroup(S));
  checkpoint(); renderAll();
}
export const sel=()=>S.frames.find(f=>f.id===S.sel);
export function setUnit(u){
  S.unit=u; save(); renderAll();
}
