import { S, T, clamp, handles, save, stage } from './ctx.js';
import { toast } from './toast.js';
import { layout, renderAll } from './render.js';

export const refRect = () => S.cal.custom ? S.cal.ref : {x:0,y:0,w:S.wall.w,h:S.wall.h};
export function initCorners(){
  if (S.cal.set) return;
  const sw=stage.clientWidth, sh=stage.clientHeight, r=refRect(), a=r.w/r.h;
  const w=Math.min(.8*sw,.8*sh*a), h=w/a;
  const x0=(sw-w)/2/sw, x1=1-x0, y0=(sh-h)/2/sh, y1=1-y0;
  S.cal.corners=[[x0,y0],[x1,y0],[x1,y1],[x0,y1]];
}

/* ---------- mode ---------- */
export function setMode(m){
  T.mode=m; stage.classList.toggle('projecting',m==='project');
  if (m==='project'){
    T.uiHidden=false;
    const req=stage.requestFullscreen||stage.webkitRequestFullscreen;
    try { const p=req&&req.call(stage); if (p&&p.catch) p.catch(()=>{}); } catch(e) {}
    requestAnimationFrame(()=>{ initCorners(); T.calibrating=!S.cal.set; renderAll(); });
    T.calibrating=!S.cal.set;
  } else {
    T.calibrating=false; T.uiHidden=false;
    try { if (document.fullscreenElement) document.exitFullscreen(); } catch(e) {}
  }
  renderAll();
}
export function toggleFullscreen(){
  try {
    if (document.fullscreenElement) document.exitFullscreen();
    else { const p=stage.requestFullscreen&&stage.requestFullscreen(); if (p&&p.catch) p.catch(()=>toast('Fullscreen is blocked here. Use your browser\'s fullscreen (F11).')); }
  } catch(e) { toast('Fullscreen is blocked here. Use your browser\'s fullscreen (F11).'); }
}

export function initProjection(){
  handles.forEach((h,i)=>{
    h.addEventListener('pointerdown',e=>{ e.preventDefault(); e.stopPropagation(); T.hsel=i; T.hdrag=i; try{ h.setPointerCapture(e.pointerId); }catch(_){} layout(); });
    h.addEventListener('pointermove',e=>{
      if (T.hdrag!==i) return;
      const r=stage.getBoundingClientRect();
      S.cal.corners[i]=[clamp((e.clientX-r.left)/r.width,-.3,1.3),clamp((e.clientY-r.top)/r.height,-.3,1.3)];
      layout();
    });
    const up=()=>{ if (T.hdrag===i){ T.hdrag=null; save(); } };
    h.addEventListener('pointerup',up); h.addEventListener('pointercancel',up);
  });

  document.addEventListener('fullscreenchange',()=>{ requestAnimationFrame(()=>{ layout(); }); });
  new ResizeObserver(()=>layout()).observe(stage);
}
