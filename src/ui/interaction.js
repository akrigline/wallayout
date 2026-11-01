import { $, K, S, T, area, boundsOf, clamp, dropFromSel, hooksOf, layouts, normArea, parseBulk, parseLen, r16, save, selFrames, setSelection, stage, store, syncSel, toggleSel } from './ctx.js';
import { locked, toast } from './toast.js';
import { initCorners, setMode, toggleFullscreen } from './projection.js';
import { checkpoint, hit, layout, renderAll, renderArea, renderControls, renderFrames, renderList, renderProps, sched, toWall, updateXY } from './render.js';
import { addFrame, applyMoves, arrange, centerGroup, redo, sel, setUnit, undo } from './actions.js';
import { copyText, decodeSpec, openLayouts, openShare, openSheet, renderLayouts, sheetText } from './modals.js';
import * as L from '../js/layout.js';
import { addedHook, scaleHooks, twoHooks } from '../js/hooks.js';
import { alignMoves, centerMoves, distributeMoves } from '../js/selection.js';

const refreshSel = () => { renderFrames(); renderList(); renderProps(); };
const visibleFrameIds = () => S.frames.filter(f=>f.kind!=='obstacle'&&!f.hidden).map(f=>f.id);
function hookHit(x,y){
  if (S.locked||!S.hooks||T.sels.size!==1) return null;
  const f=S.frames.find(g=>g.id===S.sel); if (!f||f.kind==='obstacle'||f.hidden) return null;
  let best=null, bd=12*T.u/K;
  hooksOf(f).forEach((h,i)=>{ const d=Math.hypot(f.x+h.x-x,f.y+h.y-y); if (d<=bd){ bd=d; best=i; } });
  return best==null?null:{f,i:best,moved:false};
}
// Custom hooks are created from the default on first edit.
function ensureHooks(f){ if (!f.hooks||!f.hooks.length) f.hooks=hooksOf(f).map(h=>({x:h.x,y:h.y})); }

export function snapMove(f,nx,ny,free,exclude){
  const r=L.snapMove(S,f,nx,ny,free,8*T.u/K,exclude);
  T.guides=r.guides;
  return [r.x,r.y];
}

export function initInteraction(){
  /* ---------- click delegation ---------- */
  document.addEventListener('click',e=>{
    const b=e.target.closest('[data-act]'); if (!b) return;
    const a=b.dataset.act;
    switch(a){
      case 'undo': if(!S.locked) undo(); break;
      case 'redo': if(!S.locked) redo(); break;
      case 'arrange': arrange(false); break;
      case 'shuffle': arrange(true); break;
      case 'centerGroup': centerGroup(); break;
      case 'project': setMode('project'); break;
      case 'exit': setMode('design'); break;
      case 'unit': setUnit(b.dataset.unit); break;
      case 'style': S.proj.style=b.dataset.v; save(); renderAll(); break;
      case 'tog': { const t=b.dataset.t; if (t==='hooks') S.hooks=!S.hooks; else S.proj[t]=!S.proj[t]; save(); renderAll(); break; }
      case 'toggleLock': S.locked=!S.locked; save(); renderAll(); toast(S.locked?'Layout locked.':'Layout unlocked.'); break;
      case 'unlock': S.locked=false; save(); renderAll(); break;
      case 'commit': S.locked=!S.locked; save(); renderAll(); $('#sheet').hidden=true; toast(S.locked?'Layout locked. Ready to hang.':'Layout unlocked.'); break;
      case 'sheet': openSheet(); break;
      case 'areaFit': {
        if (locked()) break;
        const fr=S.frames.filter(f=>f.kind!=='obstacle'); if (!fr.length){ toast('Add some frames first.'); break; }
        const x0=Math.min(...fr.map(f=>f.x)),x1=Math.max(...fr.map(f=>f.x+f.w)),y0=Math.min(...fr.map(f=>f.y)),y1=Math.max(...fr.map(f=>f.y+f.h));
        S.area={x:x0,y:y0,w:x1-x0,h:y1-y0}; normArea(); checkpoint(); renderAll(); break;
      }
      case 'share': openShare(); break;
      case 'closeShare': $('#share').hidden=true; break;
      case 'copyCode': copyText($('#codeOut').value); break;
      case 'importCode': {
        if (locked()) break;
        let d; try { d=decodeSpec($('#codeIn').value); } catch(err){ toast('That code didn\'t load. Paste the whole thing, starting with GWP1:'); break; }
        S.unit=d.unit; S.wall=d.wall; S.area=d.area; normArea(); S.margin=d.margin; S.gap=d.gap; S.hook=d.hook; S.frames=d.frames; S.nextId=d.frames.length+1; S.sel=null;
        checkpoint(); renderAll(); $('#share').hidden=true; toast(`Loaded ${d.frames.length} frame${d.frames.length===1?'':'s'}. Undo brings your old plan back.`); break;
      }
      case 'layouts': openLayouts(); break;
      case 'closeLayouts': $('#layouts').hidden=true; break;
      case 'saveLayout': {
        const e=layouts.save($('#layoutName').value,store.snapshot());
        if (!e){ toast('Couldn\'t save: browser storage is full or unavailable.'); break; }
        $('#layoutName').value=''; renderLayouts(); toast(`Saved "${e.name}".`); break;
      }
      case 'loadLayout': case 'updateLayout': case 'renameLayout': case 'deleteLayout': {
        const id=b.closest('[data-id]')?.dataset.id, e=id&&layouts.get(id); if (!e){ renderLayouts(); break; }
        if (a==='loadLayout'){
          if (locked()) break;
          store.applySnapshot(e.snap); renderAll(); toast(`Loaded "${e.name}". Undo brings your previous layout back.`);
        } else if (a==='updateLayout'){
          if (locked()) break;
          if (!window.confirm(`Replace "${e.name}" with the current layout?`)) break;
          if (!layouts.update(id,store.snapshot())) toast('Couldn\'t update: browser storage is full or unavailable.');
          else toast(`Updated "${e.name}".`);
          renderLayouts();
        } else if (a==='renameLayout'){
          const v=window.prompt('Rename layout',e.name); if (v===null) break;
          if (!layouts.rename(id,v)) toast('Couldn\'t rename: browser storage is full or unavailable.');
          renderLayouts();
        } else {
          if (!window.confirm(`Delete "${e.name}"? This can't be undone.`)) break;
          if (!layouts.remove(id)) toast('Couldn\'t delete: browser storage is full or unavailable.');
          else toast(`Deleted "${e.name}".`);
          renderLayouts();
        }
        break;
      }
      case 'closeSheet': $('#sheet').hidden=true; break;
      case 'copySheet': copyText(sheetText()); break;
      case 'fullscreen': toggleFullscreen(); break;
      case 'hideUI': T.uiHidden=true; renderAll(); toast('Controls hidden. Double-click empty space or press H to bring them back.'); break;
      case 'calToggle': T.calibrating=!T.calibrating; T.hsel=null; renderAll(); break;
      case 'calDone': S.cal.set=true; T.calibrating=false; T.hsel=null; save(); renderAll(); break;
      case 'calReset': S.cal.set=false; initCorners(); S.cal.set=false; save(); renderAll(); break;
      case 'select': { const id=+b.dataset.id; if (e.shiftKey||e.ctrlKey||e.metaKey) toggleSel(id); else setSelection([id]); refreshSel(); break; }
      case 'align': {
        if (locked()) break; const mem=selFrames(); if (mem.length<2) break;
        applyMoves(alignMoves(mem,b.dataset.v)); checkpoint(); renderAll(); break;
      }
      case 'dist': {
        if (locked()) break; const mem=selFrames(); if (mem.length<3){ toast('Select 3 or more pieces to distribute.'); break; }
        applyMoves(distributeMoves(mem,b.dataset.v==='disth'?'h':'v')); checkpoint(); renderAll(); break;
      }
      case 'centerSel': { if (locked()) break; const mem=selFrames(); if (!mem.length) break; applyMoves(centerMoves(mem,area())); checkpoint(); renderAll(); break; }
      case 'delSel': { if (locked()) break; S.frames=S.frames.filter(f=>!T.sels.has(f.id)); setSelection([]); checkpoint(); renderAll(); break; }
      case 'selAll': setSelection(visibleFrameIds()); refreshSel(); break;
      case 'selNone': setSelection([]); refreshSel(); break;
      case 'hkadd': {
        if (locked()) break; const f=sel(); if (!f) break; if (hooksOf(f).length>=6) break;
        const h=addedHook(f,S.hook); ensureHooks(f); f.hooks.push(h); checkpoint(); renderAll(); break;
      }
      case 'hktwo': { if (locked()) break; const f=sel(); if (!f) break; f.hooks=twoHooks(f,S.hook); checkpoint(); renderAll(); break; }
      case 'hkreset': { if (locked()) break; const f=sel(); if (!f) break; delete f.hooks; checkpoint(); renderAll(); break; }
      case 'hkdel': { if (locked()) break; const f=sel(); if (!f) break; ensureHooks(f); if (f.hooks.length>1){ f.hooks.splice(+b.dataset.i,1); checkpoint(); renderAll(); } break; }
      case 'vis': {
        const f=S.frames.find(g=>g.id===+b.dataset.id); if (!f) break;
        if (f.hidden) delete f.hidden; else { f.hidden=true; dropFromSel(f.id); }
        checkpoint(); renderAll(); break;
      }
      case 'showAll': S.frames.forEach(f=>{ delete f.hidden; }); checkpoint(); renderAll(); break;
      case 'pieces': T.piecesOpen=!T.piecesOpen; renderControls(); break;
      case 'chip': if(!locked()) addFrame({w:+b.dataset.w,h:+b.dataset.h}); break;
      case 'addCustom': {
        if (locked()) break;
        const w=parseLen($('#aW').value), h=parseLen($('#aH').value);
        if (!(w>0&&h>0)){ toast('Enter a width and height, e.g. 16 and 20.'); break; }
        addFrame({name:$('#aName').value.trim(),w,h,kind:$('#aObs').checked?'obstacle':'frame'});
        $('#aName').value=''; break;
      }
      case 'addBulk': {
        if (locked()) break;
        const list=parseBulk($('#bulk').value);
        if (!list.length){ toast('No sizes found. Use lines like "Harbor 24x36".'); break; }
        list.forEach(o=>addFrame(o,true)); S.sel=null; $('#bulk').value=''; checkpoint(); renderAll(); toast(`Added ${list.length} frame${list.length>1?'s':''}.`); break;
      }
      case 'clearAll':
        if (locked()) break;
        if (b._arm){ S.frames=[]; S.sel=null; b._arm=false; b.textContent='Clear all'; checkpoint(); renderAll(); }
        else { b._arm=true; b.textContent='Tap again to clear all'; setTimeout(()=>{ b._arm=false; b.textContent='Clear all'; },3000); }
        break;
      case 'rotate': { if (locked()) break; const f=sel(); if(!f) break; const cx=f.x+f.w/2, cy=f.y+f.h/2; [f.w,f.h]=[f.h,f.w]; delete f.hooks; f.x=r16(cx-f.w/2); f.y=r16(cy-f.h/2); checkpoint(); renderAll(); break; }
      case 'dup': { if (locked()) break; const f=sel(); if(!f) break; const n=addFrame({name:f.name,w:f.w,h:f.h,kind:f.kind,hooks:f.hooks}); break; }
      case 'cH': { if (locked()) break; const f=sel(); if(!f) break; const Ar=area(); f.x=r16(Ar.x+(Ar.w-f.w)/2); checkpoint(); renderAll(); break; }
      case 'cV': { if (locked()) break; const f=sel(); if(!f) break; const Ar=area(); f.y=r16(Ar.y+(Ar.h-f.h)/2); checkpoint(); renderAll(); break; }
      case 'del': { if (locked()) break; const i=S.frames.findIndex(f=>f.id===S.sel); if (i<0) break; S.frames.splice(i,1); S.sel=null; checkpoint(); renderAll(); break; }
    }
  });

  /* ---------- input handling ---------- */
  function bad(){ toast('That didn\'t look like a number. Try 16, 16.5 or 16 1/2.'); renderControls(); }
  $('#wW').addEventListener('change',e=>{ if(locked()){renderControls();return;} const v=parseLen(e.target.value); if(!(v>0)) return bad(); S.wall.w=v; normArea(); checkpoint(); renderAll(); });
  $('#wH').addEventListener('change',e=>{ if(locked()){renderControls();return;} const v=parseLen(e.target.value); if(!(v>0)) return bad(); S.wall.h=v; normArea(); checkpoint(); renderAll(); });
  $('#sArea').addEventListener('change',e=>{
    if (locked()){ renderControls(); return; }
    if (e.target.checked){ const W=S.wall.w,H=S.wall.h; S.area={x:r16(W*.1),y:r16(H*.1),w:r16(W*.8),h:r16(H*.8)}; } else S.area=null;
    checkpoint(); renderAll();
  });
  for (const [id,k] of [['#aX','x'],['#aY','y'],['#aAw','w'],['#aAh','h']]){
    $(id).addEventListener('change',e=>{ if (locked()||!S.area){ renderControls(); return; } const v=parseLen(e.target.value); if (!(v>=0)||((k==='w'||k==='h')&&v<=0)) return bad(); S.area[k]=v; normArea(); checkpoint(); renderAll(); });
  }
  $('#sGap').addEventListener('change',e=>{ const v=parseLen(e.target.value); if(!(v>=0)) return bad(); S.gap=v; save(); renderControls(); });
  $('#sMargin').addEventListener('change',e=>{ const v=parseLen(e.target.value); if(!(v>=0)) return bad(); S.margin=v; save(); renderAll(); });
  $('#sHook').addEventListener('change',e=>{ const v=parseLen(e.target.value); if(!(v>=0)) return bad(); S.hook=v; save(); renderAll(); });
  $('#sGrid').addEventListener('change',e=>{ S.grid=+e.target.value; save(); });
  $('#sSnap').addEventListener('change',e=>{ S.snap=e.target.checked; save(); });
  $('#sHooks').addEventListener('change',e=>{ S.hooks=e.target.checked; save(); renderAll(); });
  $('#calCustom').addEventListener('change',e=>{ S.cal.custom=e.target.checked; if (S.cal.custom && !S.cal.refSet){ S.cal.ref={x:0,y:0,w:Math.min(48,S.wall.w),h:Math.min(36,S.wall.h)}; } S.cal.set=false; initCorners(); S.cal.set=false; save(); renderAll(); });
  for (const [id,k] of [['#rX','x'],['#rY','y'],['#rW','w'],['#rH','h']]){
    $(id).addEventListener('change',e=>{ const v=parseLen(e.target.value); if (!(v>=0)||((k==='w'||k==='h')&&v<=0)) return bad(); S.cal.ref[k]=v; S.cal.refSet=true; save(); renderAll(); });
  }
  $('#props').addEventListener('change',e=>{
    const i=e.target.closest('[data-k]'); if (!i) return; const f=sel(); if (!f) return;
    if (locked()){ renderProps(); return; }
    const k=i.dataset.k;
    if (k==='name') f.name=i.value.trim()||f.name;
    else if (k==='kind') f.kind=i.checked?'obstacle':'frame';
    else { const v=parseLen(i.value); if (!isFinite(v)||((k==='w'||k==='h')&&v<=0)){ bad(); renderProps(); return; } const old=f[k]; f[k]=v; if (k==='w'||k==='h') scaleHooks(f,k,old,v); }
    checkpoint(); renderAll();
  });
  $('#piecesPanel').addEventListener('change',e=>{
    const i=e.target.closest('[data-vis]'); if (!i) return;
    const f=S.frames.find(g=>g.id===+i.dataset.vis); if (!f) return;
    if (i.checked) delete f.hidden; else { f.hidden=true; dropFromSel(f.id); }
    checkpoint(); renderAll();
  });
  $('#props').addEventListener('change',e=>{
    const i=e.target.closest('[data-hk]'); if (!i) return; const f=sel(); if (!f) return;
    if (locked()){ renderProps(); return; }
    const v=parseLen(i.value); if (!isFinite(v)||v<0){ bad(); renderProps(); return; }
    ensureHooks(f); const h=f.hooks[+i.dataset.i]; if (!h) return;
    const k=i.dataset.hk; h[k]=r16(clamp(v,0,k==='x'?f.w:f.h)); checkpoint(); renderAll();
  });

  /* ---------- stage pointer ---------- */
  stage.addEventListener('pointerdown',e=>{
    if (e.target.closest('.ui')||e.button>0) return;
    if (T.mode==='project'&&T.calibrating) return;
    const [x,y]=toWall(e.clientX,e.clientY), f=hit(x,y);
    const hkh=hookHit(x,y);
    if (hkh){ T.hkdrag=hkh; try{ stage.setPointerCapture(e.pointerId); }catch(_){} return; }
    const add=e.shiftKey||e.ctrlKey||e.metaKey;
    if (f){
      let collapse=null;
      if (add) toggleSel(f.id);
      else if (!T.sels.has(f.id)) setSelection([f.id]);
      else { S.sel=f.id; if (T.sels.size>1) collapse=f.id; }
      refreshSel();
      if (!T.sels.has(f.id)) return;
      if (!S.locked){
        const mem=selFrames(), bb=boundsOf(mem);
        T.drag={mem:mem.map(g=>({g,x:g.x,y:g.y})),px:x,py:y,bx:bb.x0,by:bb.y0,bw:bb.x1-bb.x0,bh:bb.y1-bb.y0,moved:false,collapse,sx:e.clientX,sy:e.clientY};
        try{ stage.setPointerCapture(e.pointerId); }catch(_){}
      } else toast('Layout is locked. Unlock to move frames.');
    } else {
      const eh=areaEdge(x,y);
      if (eh&&!S.locked){ T.adrag={eh,x,y,a:{...S.area}}; try{ stage.setPointerCapture(e.pointerId); }catch(_){} }
      else { T.marq={x0:x,y0:y,sx:e.clientX,sy:e.clientY,moved:false,add,base:new Set(T.sels)}; try{ stage.setPointerCapture(e.pointerId); }catch(_){} }
    }
  });
  function areaEdge(x,y){
    const a=S.area; if (!a||(T.mode==='project'&&T.calibrating)) return null;
    const t=10*T.u/K;
    if (x<a.x-t||x>a.x+a.w+t||y<a.y-t||y>a.y+a.h+t) return null;
    const l=Math.abs(x-a.x)<=t, r=Math.abs(x-(a.x+a.w))<=t, tp=Math.abs(y-a.y)<=t, b=Math.abs(y-(a.y+a.h))<=t;
    return (l||r||tp||b)?{l,r,t:tp,b}:null;
  }
  function edgeCursor(h){ if((h.l&&h.t)||(h.r&&h.b)) return 'nwse-resize'; if((h.r&&h.t)||(h.l&&h.b)) return 'nesw-resize'; return (h.l||h.r)?'ew-resize':'ns-resize'; }
  stage.addEventListener('pointermove',e=>{
    const ad=T.adrag;
    if (ad){
      const [x,y]=toWall(e.clientX,e.clientY), dx=x-ad.x, dy=y-ad.y, o=ad.a, a=S.area, W=S.wall.w, H=S.wall.h, m=4, h=ad.eh;
      let x0=o.x,x1=o.x+o.w,y0=o.y,y1=o.y+o.h;
      if (h.l) x0=clamp(o.x+dx,0,x1-m); if (h.r) x1=clamp(o.x+o.w+dx,x0+m,W);
      if (h.t) y0=clamp(o.y+dy,0,y1-m); if (h.b) y1=clamp(o.y+o.h+dy,y0+m,H);
      a.x=x0; a.y=y0; a.w=x1-x0; a.h=y1-y0; renderArea(); return;
    }
    const hd=T.hkdrag;
    if (hd){
      const [x,y]=toWall(e.clientX,e.clientY), f=hd.f; ensureHooks(f); const h=f.hooks[hd.i]; if (!h) return;
      let nx=clamp(x-f.x,0,f.w), ny=clamp(y-f.y,0,f.h);
      if (!e.altKey){
        const t=8*T.u/K;
        if (Math.abs(nx-f.w/2)<t) nx=f.w/2;
        for (const o of f.hooks){ if (o===h) continue; if (Math.abs(ny-o.y)<t){ ny=o.y; break; } }
      }
      h.x=r16(nx); h.y=r16(ny); hd.moved=true; renderFrames(); return;
    }
    const mq=T.marq;
    if (mq){
      if (!mq.moved&&Math.hypot(e.clientX-mq.sx,e.clientY-mq.sy)<4) return;
      mq.moved=true;
      const [x,y]=toWall(e.clientX,e.clientY), rx0=Math.min(x,mq.x0), ry0=Math.min(y,mq.y0), rx1=Math.max(x,mq.x0), ry1=Math.max(y,mq.y0);
      const m=$('#marq'); m.hidden=false; m.style.left=rx0*K+'px'; m.style.top=ry0*K+'px'; m.style.width=(rx1-rx0)*K+'px'; m.style.height=(ry1-ry0)*K+'px';
      const hits=S.frames.filter(f=>f.kind!=='obstacle'&&!f.hidden&&f.x<rx1&&rx0<f.x+f.w&&f.y<ry1&&ry0<f.y+f.h).map(f=>f.id);
      setSelection(mq.add?[...mq.base,...hits.filter(id=>!mq.base.has(id))]:hits); renderFrames();
      return;
    }
    const d=T.drag;
    if (!d){ if (!e.target.closest('.ui')){ const [x,y]=toWall(e.clientX,e.clientY); const eh=!S.locked&&areaEdge(x,y); const hh=!(T.mode==='project'&&T.calibrating)&&hookHit(x,y); stage.style.cursor=hh?'crosshair':(!(T.mode==='project'&&T.calibrating)&&hit(x,y)&&!S.locked)?'grab':(eh?edgeCursor(eh):'default'); } return; }
    if (!d.moved && Math.hypot(e.clientX-d.sx,e.clientY-d.sy)<3) return;
    d.moved=true; stage.style.cursor='grabbing';
    const [x,y]=toWall(e.clientX,e.clientY);
    const [nx,ny]=snapMove({w:d.bw,h:d.bh},d.bx+(x-d.px),d.by+(y-d.py),e.altKey,new Set(d.mem.map(m=>m.g)));
    const dx=nx-d.bx, dy=ny-d.by;
    d.mem.forEach(m=>{ m.g.x=m.x+dx; m.g.y=m.y+dy; });
    renderFrames(); updateXY();
  });
  function endDrag(){
    if (T.adrag){ T.adrag=null; const a=S.area; ['x','y','w','h'].forEach(k=>a[k]=r16(a[k])); normArea(); checkpoint(); renderAll(); return; }
    if (T.hkdrag){ const hd=T.hkdrag; T.hkdrag=null; if (hd.moved) checkpoint(); renderAll(); return; }
    if (T.marq){
      const mq=T.marq; T.marq=null; $('#marq').hidden=true;
      if (!mq.moved&&!mq.add) setSelection([]);
      refreshSel(); return;
    }
    const d=T.drag; if (!d) return; T.drag=null;
    if (d.moved){ d.mem.forEach(m=>{ m.g.x=r16(m.g.x); m.g.y=r16(m.g.y); }); T.guides=[]; checkpoint(); renderAll(); }
    else if (d.collapse!=null){ setSelection([d.collapse]); refreshSel(); }
    stage.style.cursor='default';
  }
  stage.addEventListener('pointerup',endDrag);
  stage.addEventListener('pointercancel',endDrag);
  stage.addEventListener('dblclick',e=>{
    if (T.mode!=='project'||e.target.closest('.ui')) return;
    const [x,y]=toWall(e.clientX,e.clientY);
    if (!hit(x,y)){ T.uiHidden=!T.uiHidden; renderAll(); }
  });

  /* keyboard */
  document.addEventListener('keydown',e=>{
    const tag=(e.target.tagName||'').toLowerCase();
    if (tag==='input'||tag==='textarea'||tag==='select') return;
    if (e.key==='Escape'){ if (!$('#layouts').hidden) $('#layouts').hidden=true; else if (!$('#share').hidden) $('#share').hidden=true; else if (!$('#sheet').hidden) $('#sheet').hidden=true; else if (T.mode==='project') setMode('design'); else if (T.sels.size){ setSelection([]); refreshSel(); } return; }
    if ((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){ e.preventDefault(); if(!S.locked) e.shiftKey?redo():undo(); return; }
    if ((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='a'){ e.preventDefault(); setSelection(visibleFrameIds()); refreshSel(); return; }
    if ((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='y'){ e.preventDefault(); if(!S.locked) redo(); return; }
    if (T.mode==='project'){
      if (e.key==='h'||e.key==='H'){ T.uiHidden=!T.uiHidden; renderAll(); return; }
      if (e.key==='f'||e.key==='F'){ toggleFullscreen(); return; }
    }
    if (T.mode==='project'&&T.calibrating&&T.hsel!=null&&e.key.startsWith('Arrow')){
      e.preventDefault(); const st=e.shiftKey?10:1, c=S.cal.corners[T.hsel];
      c[0]+=(e.key==='ArrowRight'?st:e.key==='ArrowLeft'?-st:0)/stage.clientWidth;
      c[1]+=(e.key==='ArrowDown'?st:e.key==='ArrowUp'?-st:0)/stage.clientHeight;
      layout(); save(); return;
    }
    syncSel(); const mem=selFrames(); if (!mem.length) return; const f=sel()||mem[0];
    if (e.key==='Delete'||e.key==='Backspace'){ e.preventDefault(); if(locked()) return; S.frames=S.frames.filter(x=>!T.sels.has(x.id)); setSelection([]); checkpoint(); renderAll(); return; }
    if (e.key==='r'||e.key==='R'){ if(mem.length>1||locked()) return; const cx=f.x+f.w/2, cy=f.y+f.h/2; [f.w,f.h]=[f.h,f.w]; delete f.hooks; f.x=r16(cx-f.w/2); f.y=r16(cy-f.h/2); renderAll(); sched(); return; }
    if (e.key.startsWith('Arrow')){
      e.preventDefault(); if (locked()) return;
      const st=e.altKey?1/16:e.shiftKey?1:.25;
      for (const g of mem){ g.x+=e.key==='ArrowRight'?st:e.key==='ArrowLeft'?-st:0; g.y+=e.key==='ArrowDown'?st:e.key==='ArrowUp'?-st:0; g.x=r16(g.x); g.y=r16(g.y); }
      renderFrames(); updateXY(); sched();
    }
  });
}
