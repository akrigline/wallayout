import { $, K, S, T, V, boundsOf, calsvg, els, esc, fmt, handles, hooksOf, hud, num, ptool, selFrames, stage, store, syncSel, unitWord, wall } from './ctx.js';
import { refRect } from './projection.js';
import * as L from '../js/layout.js';
import { homography, inv3, mapPt } from '../js/homography.js';

export function layout(){
  const sw=stage.clientWidth, sh=stage.clientHeight; if (!sw||!sh) return;
  const W=S.wall.w*K, Ht=S.wall.h*K;
  wall.style.width=W+'px'; wall.style.height=Ht+'px';
  let src,dst;
  const proj = T.mode==='project';
  if (proj){
    const r=refRect();
    src=[[r.x*K,r.y*K],[(r.x+r.w)*K,r.y*K],[(r.x+r.w)*K,(r.y+r.h)*K],[r.x*K,(r.y+r.h)*K]];
    dst=S.cal.corners.map(c=>[c[0]*sw,c[1]*sh]);
  } else {
    const pl=54, pt=40, pr=26, pb=26, aw=Math.max(50,sw-pl-pr), ah=Math.max(50,sh-pt-pb);
    const sc=Math.min(aw/W,ah/Ht), ox=pl+(aw-W*sc)/2, oy=pt+(ah-Ht*sc)/2;
    src=[[0,0],[W,0],[W,Ht],[0,Ht]];
    dst=[[ox,oy],[ox+W*sc,oy],[ox+W*sc,oy+Ht*sc],[ox,oy+Ht*sc]];
    const dT=$('#dimT'), dL=$('#dimL');
    dT.hidden=dL.hidden=false;
    dT.textContent=fmt(S.wall.w); dT.style.left=(ox+W*sc/2)+'px'; dT.style.top=(oy-8)+'px';
    dL.textContent=fmt(S.wall.h); dL.style.left=(ox-8)+'px'; dL.style.top=(oy+Ht*sc/2)+'px';
  }
  if (proj){ $('#dimT').hidden=$('#dimL').hidden=true; }
  const h=homography(src,dst);
  V.Hm=h; V.Hi=h?inv3(h):null;
  if (!h||!V.Hi){ wall.style.visibility='hidden'; return; }
  wall.style.visibility='';
  wall.style.transform=`matrix3d(${h[0]},${h[3]},0,${h[6]}, ${h[1]},${h[4]},0,${h[7]}, 0,0,1,0, ${h[2]},${h[5]},0,1)`;
  const cx=W/2, cy=Ht/2, p0=mapPt(h,cx,cy), p1=mapPt(h,cx+K,cy);
  const s=Math.hypot(p1[0]-p0[0],p1[1]-p0[1])/K;
  T.u = s>1e-6 ? 1/s : 1;
  wall.style.setProperty('--u', T.u+'px');
  const gridIn = S.unit==='cm' ? 25/2.54 : 12;
  wall.style.setProperty('--gs', (gridIn*K)+'px');
  // calibration handles
  handles.forEach((el,i)=>{
    const show = proj && T.calibrating;
    el.style.display = show ? 'flex' : 'none';
    el.style.left = dst[i] ? (S.cal.corners[i][0]*sw)+'px' : '0';
    el.style.top = (S.cal.corners[i][1]*sh)+'px';
    el.classList.toggle('on', T.hsel===i);
  });
  // calibration overlay (in wall plane)
  if (proj && T.calibrating){
    const r=refRect(), x=r.x*K,y=r.y*K,w=r.w*K,hh=r.h*K, sk=T.u*3;
    calsvg.setAttribute('width',W); calsvg.setAttribute('height',Ht);
    calsvg.innerHTML=`<rect x="${x}" y="${y}" width="${w}" height="${hh}" fill="none" stroke="#35e0ff" stroke-width="${sk}"/>
      <path d="M${x} ${y}L${x+w} ${y+hh}M${x+w} ${y}L${x} ${y+hh}" stroke="#35e0ff" stroke-width="${sk*.55}" opacity=".7"/>
      <path d="M${x+w/2} ${y}V${y+hh}M${x} ${y+hh/2}H${x+w}" stroke="#35e0ff" stroke-width="${sk*.4}" opacity=".5"/>`;
  } else calsvg.innerHTML='';
}

export function toWall(cx,cy){
  const r=stage.getBoundingClientRect();
  if (!V.Hi) return [0,0];
  const p=mapPt(V.Hi,cx-r.left,cy-r.top);
  return [p[0]/K,p[1]/K];
}
export function computeBad(){ T.bad=L.computeBad(S); }
const mgs=new Map();
export function renderMargins(){
  const m=S.margin, mgl=$('#mgl');
  for (const [id,el] of mgs) if (!(m>0)||!S.frames.some(f=>f.id===id&&f.kind!=='obstacle'&&!f.hidden)){ el.remove(); mgs.delete(id); }
  if (!(m>0)) return;
  for (const f of S.frames){
    if (f.kind==='obstacle'||f.hidden) continue;
    let el=mgs.get(f.id); if (!el){ el=document.createElement('div'); el.className='mg'; mgl.appendChild(el); mgs.set(f.id,el); }
    el.style.left=(f.x-m)*K+'px'; el.style.top=(f.y-m)*K+'px'; el.style.width=(f.w+2*m)*K+'px'; el.style.height=(f.h+2*m)*K+'px';
    el.style.setProperty('--hh',f.hue);
  }
}
export function renumber(){
  let n=0; T.num=new Map();
  for (const f of S.frames) if (f.kind!=='obstacle') T.num.set(f.id,++n);
}
export const gapsOf = f => L.gapsOf(S.frames,f);
export const hit = (x,y) => L.hit(S.frames,x,y);
export function applyClasses(){
  const p=S.proj, proj=T.mode==='project';
  wall.className=[proj?'project':'design', proj?p.style:'', proj&&p.mono?'mono':'', proj&&!p.labels?'nolabels':'', proj&&!p.margin?'nomargin':'', !S.hooks?'nohooks':'', proj&&p.grid?'pgrid':'', proj&&p.edge?'edge':'', proj&&T.calibrating?'cal':''].join(' ');
}
export function renderFrames(){
  syncSel(); computeBad(); renumber();
  for (const [id,el] of els) if (!S.frames.some(f=>f.id===id)){ el.remove(); els.delete(id); }
  const hideSel = T.mode==='project' && (T.uiHidden || T.calibrating);
  for (const f of S.frames){
    let el=els.get(f.id);
    if (!el){ el=document.createElement('div'); el.className='fr'; el.innerHTML='<div class="lb"></div>'; wall.insertBefore(el,calsvg); els.set(f.id,el); }
    el.style.left=f.x*K+'px'; el.style.top=f.y*K+'px'; el.style.width=f.w*K+'px'; el.style.height=f.h*K+'px'; el.style.display=f.hidden?'none':'';
    el.style.setProperty('--hh',f.hue);
    const hs=f.kind==='obstacle'?[]:hooksOf(f), hk=el._hk||(el._hk=[]);
    while (hk.length>hs.length) hk.pop().remove();
    while (hk.length<hs.length){ const i=document.createElement('i'); i.className='hk'; el.appendChild(i); hk.push(i); }
    hs.forEach((h,i)=>{ hk[i].style.left=`calc(${h.x*K}px - var(--lw))`; hk[i].style.top=`calc(${h.y*K}px - var(--lw))`; });
    el.classList.toggle('sel',T.sels.has(f.id)&&!hideSel);
    el.classList.toggle('bad',T.bad.has(f.id));
    el.classList.toggle('obs',f.kind==='obstacle');
    const n=T.num.get(f.id);
    const html=`${n?'<b>'+n+'</b> ':''}${esc(f.name)}<small>${num(f.w)} × ${num(f.h)}</small>`;
    const lb=el.firstChild; if (lb._h!==html){ lb.innerHTML=html; lb._h=html; }
  }
  // keep DOM order = array order for stacking
  S.frames.forEach(f=>wall.insertBefore(els.get(f.id),calsvg));
  renderMargins(); renderArea(); renderGuides(); updateHud();
}
export function renderArea(){
  const b=$('#areaBox'), a=S.area;
  b.classList.toggle('on',!!a); if (!a) return;
  b.style.left=a.x*K+'px'; b.style.top=a.y*K+'px'; b.style.width=a.w*K+'px'; b.style.height=a.h*K+'px'; b.style.boxSizing='border-box';
}
export function renderGuides(){
  wall.querySelectorAll('.gd').forEach(n=>n.remove());
  for (const g of T.guides){
    const d=document.createElement('div'); d.className='gd '+g.axis;
    if (g.axis==='x') d.style.left=g.pos*K+'px'; else d.style.top=g.pos*K+'px';
    wall.appendChild(d);
  }
}
export function updateHud(){
  syncSel();
  if (T.hkdrag){ const {f,i}=T.hkdrag, h=f.hooks&&f.hooks[i]; if (h){ hud.hidden=false; hud.textContent=`Hook ${i+1}: ${fmt(h.x)} from frame's left, ${fmt(h.y)} below its top. On the wall: ${fmt(f.x+h.x)} from left, ${fmt(S.wall.h-(f.y+h.y))} above floor`; return; } }
  const f=S.frames.find(x=>x.id===S.sel);
  const show=f && !(T.mode==='project'&&(T.uiHidden||T.calibrating));
  hud.hidden=!show; if (!show) return;
  if (T.sels.size>1){ const b=boundsOf(selFrames()); hud.textContent=`${T.sels.size} selected, ${fmt(b.x1-b.x0)} × ${fmt(b.y1-b.y0)} overall, ${fmt(b.x0)} from left, ${fmt(b.y0)} from ceiling`; return; }
  const g=gapsOf(f), v=x=>x==null?'–':fmt(x), n=T.num.get(f.id);
  hud.textContent=`${n?'#'+n+' ':''}${f.name}: ${fmt(f.x)} from left, ${fmt(f.y)} from ceiling. Gaps: left ${v(g.L)}, right ${v(g.R)}, above ${v(g.T)}, below ${v(g.B)}`;
}
const eyeSvg=on=>`<svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true"><path d="M1 8s2.5-4.5 7-4.5S15 8 15 8s-2.5 4.5-7 4.5S1 8 1 8z"/><circle cx="8" cy="8" r="2"/>${on?'':'<path d="M2.5 13.5l11-11"/>'}</svg>`;
export function renderList(){
  syncSel();
  const L=$('#list');
  if (!S.frames.length){ L.innerHTML='<p class="note">No frames yet. Pick a common size above or paste a list.</p>'; }
  else L.innerHTML=S.frames.map(f=>{
    const n=T.num.get(f.id), b=T.bad.get(f.id);
    return `<div class="lr"><button class="li ${T.sels.has(f.id)?'sel':''} ${f.kind==='obstacle'?'obs':''} ${f.hidden?'hid':''}" data-act="select" data-id="${f.id}" style="--hh:${f.hue}"><i></i><span class="nm">${n?n+'. ':''}${esc(f.name)}</span><span class="dm">${num(f.w)} × ${num(f.h)}</span>${b?`<b class="warn" title="${esc(b)}">!</b>`:''}</button><button class="eye" data-act="vis" data-id="${f.id}" aria-pressed="${f.hidden?'false':'true'}" title="${f.hidden?'Show':'Hide'} ${esc(f.name)}" aria-label="${f.hidden?'Show':'Hide'} ${esc(f.name)}">${eyeSvg(!f.hidden)}</button></div>`;
  }).join('');
  const c=S.frames.filter(f=>f.kind!=='obstacle'&&!f.hidden).length, hid=S.frames.filter(f=>f.hidden).length, bad=T.bad.size;
  $('#cnt').textContent=`${c} on the wall${hid?`, ${hid} hidden`:''}${bad?`, ${bad} with conflicts`:''}`;
}
const ICONS={
  left:'<path d="M2 1.5v13"/><rect x="4" y="3.5" width="10" height="3.5"/><rect x="4" y="9" width="6" height="3.5"/>',
  hcenter:'<path d="M8 1.5v13"/><rect x="2.5" y="3.5" width="11" height="3.5"/><rect x="4.5" y="9" width="7" height="3.5"/>',
  right:'<path d="M14 1.5v13"/><rect x="2" y="3.5" width="10" height="3.5"/><rect x="6" y="9" width="6" height="3.5"/>',
  top:'<path d="M1.5 2h13"/><rect x="3.5" y="4" width="3.5" height="10"/><rect x="9" y="4" width="3.5" height="6"/>',
  vcenter:'<path d="M1.5 8h13"/><rect x="3.5" y="2.5" width="3.5" height="11"/><rect x="9" y="4.5" width="3.5" height="7"/>',
  bottom:'<path d="M1.5 14h13"/><rect x="3.5" y="2" width="3.5" height="10"/><rect x="9" y="6" width="3.5" height="6"/>',
  disth:'<path d="M2 1.5v13M14 1.5v13"/><rect x="6.25" y="4" width="3.5" height="8"/>',
  distv:'<path d="M1.5 2h13M1.5 14h13"/><rect x="4" y="6.25" width="8" height="3.5"/>'
};
const alignBtn=(act,v,label,off)=>`<button data-act="${act}" data-v="${v}" title="${label}" aria-label="${label}"${off?' disabled':''}><svg viewBox="0 0 16 16" aria-hidden="true">${ICONS[v]}</svg></button>`;
function hookPanel(f){
  const hs=hooksOf(f), u=unitWord(), custom=!!(f.hooks&&f.hooks.length);
  return `<h2 style="font-size:13px;margin:6px 0 4px">Hooks ${custom?'':'<span style="color:var(--mut);font-weight:400">(default)</span>'}</h2>
    <p class="note" style="margin:0 0 8px">Measured from the frame's top-left corner. Drag the crosshairs on the wall, or type exact numbers (${u}).</p>`+
    hs.map((h,i)=>`<div class="hkrow"><span class="hkn">${i+1}</span>
      <label>From left <input data-hk="x" data-i="${i}" inputmode="decimal" value="${num(h.x)}"></label>
      <label>Below top <input data-hk="y" data-i="${i}" inputmode="decimal" value="${num(h.y)}"></label>
      <button data-act="hkdel" data-i="${i}" ${hs.length<2?'disabled':''} title="Remove hook ${i+1}" aria-label="Remove hook ${i+1}">✕</button></div>`).join('')+
    `<div class="btnrow"><button data-act="hkadd" ${hs.length>=6?'disabled':''}>Add hook</button><button data-act="hktwo">Two hooks</button><button data-act="hkreset" ${custom?'':'disabled'}>Reset to default</button></div>`;
}
export function renderProps(){
  syncSel();
  const P=$('#props'), f=S.frames.find(x=>x.id===S.sel);
  if (!f){ P.hidden=true; P.innerHTML=''; return; }
  P.hidden=false;
  if (T.sels.size>1){
    const few=T.sels.size<3;
    P.innerHTML=`<h2>${T.sels.size} selected</h2>
      <p class="note" style="margin-top:0">Drag any selected piece to move them all together. Arrow keys nudge the group. Shift-click adds or removes a piece.</p>
      <div class="tools" role="group" aria-label="Align and distribute">
        ${alignBtn('align','left','Align left edges')}${alignBtn('align','hcenter','Align horizontal centers')}${alignBtn('align','right','Align right edges')}<span class="sep"></span>
        ${alignBtn('align','top','Align top edges')}${alignBtn('align','vcenter','Align vertical centers')}${alignBtn('align','bottom','Align bottom edges')}<span class="sep"></span>
        ${alignBtn('dist','disth','Distribute evenly, left to right',few)}${alignBtn('dist','distv','Distribute evenly, top to bottom',few)}
      </div>
      <p class="note" style="margin-top:0">Align uses the selection's outer edges. Distribute keeps the two outermost pieces fixed and evens out the gaps between all of them (needs 3 or more).</p>
      <div class="btnrow"><button data-act="centerSel">Center in gallery area</button><button data-act="delSel">Delete selected</button><button data-act="selNone">Select none</button></div>`;
    return;
  }
  const u=unitWord(), n=T.num.get(f.id);
  P.innerHTML=`<h2>${n?'#'+n+' ':''}${esc(f.name)}</h2>
    <label>Name <input data-k="name" value="${esc(f.name)}" autocomplete="off"></label>
    <div class="grid2">
      <label>Width (${u}) <input data-k="w" inputmode="decimal" value="${num(f.w)}"></label>
      <label>Height (${u}) <input data-k="h" inputmode="decimal" value="${num(f.h)}"></label>
      <label>From left (${u}) <input data-k="x" inputmode="decimal" value="${num(f.x)}"></label>
      <label>From ceiling (${u}) <input data-k="y" inputmode="decimal" value="${num(f.y)}"></label>
    </div>
    <label class="chk"><input type="checkbox" data-k="kind" ${f.kind==='obstacle'?'checked':''}> Obstacle, not a frame</label>
    ${f.kind==='obstacle'?'':hookPanel(f)}
    <div class="btnrow">
      <button data-act="vis" data-id="${f.id}">${f.hidden?'Show':'Hide'}</button><button data-act="rotate">Rotate 90°</button><button data-act="dup">Duplicate</button>
      <button data-act="cH">Center left–right</button><button data-act="cV">Center up–down</button>
      <button data-act="del">Delete</button>
    </div>`;
}
export function updateXY(){
  const f=S.frames.find(x=>x.id===S.sel); if (!f) return;
  for (const k of ['x','y']){ const i=$(`#props [data-k="${k}"]`); if (i&&document.activeElement!==i) i.value=num(f[k]); }
}
export function renderControls(){
  $('#wW').value=num(S.wall.w); $('#wH').value=num(S.wall.h);
  $('#sGap').value=num(S.gap); $('#sMargin').value=num(S.margin); $('#sHook').value=num(S.hook);
  $('#sArea').checked=!!S.area; $('#areaFields').hidden=!S.area;
  if (S.area){ $('#aX').value=num(S.area.x); $('#aY').value=num(S.area.y); $('#aAw').value=num(S.area.w); $('#aAh').value=num(S.area.h); }
  $('#sGrid').value=String(S.grid); $('#sSnap').checked=S.snap; $('#sHooks').checked=S.hooks;
  document.querySelectorAll('#unitSeg button').forEach(b=>b.classList.toggle('on',b.dataset.unit===S.unit));
  document.querySelectorAll('#pStyle button').forEach(b=>b.classList.toggle('on',b.dataset.v===S.proj.style));
  document.querySelectorAll('#ptool [data-act="tog"]').forEach(b=>{ const t=b.dataset.t; b.classList.toggle('on', t==='hooks'?S.hooks:S.proj[t]); });
  $('#pLock').classList.toggle('on',S.locked); $('#pLock').textContent=S.locked?'Locked':'Lock';
  $('#pCal').classList.toggle('on',T.calibrating);
  $('#calPanel').hidden=!T.calibrating;
  $('#piecesPanel').hidden=!T.piecesOpen; $('#pPieces').classList.toggle('on',!!T.piecesOpen);
  if (T.piecesOpen){
    const pp=$('#piecesPanel');
    pp.innerHTML=S.frames.length?`<p>Tick what should be projected. Hiding a piece also removes it from snapping and the hang sheet.</p>`+S.frames.map(f=>`<label class="chk"><input type="checkbox" data-vis="${f.id}" ${f.hidden?'':'checked'}> ${T.num.get(f.id)?T.num.get(f.id)+'. ':''}${esc(f.name)} <span style="opacity:.6">${num(f.w)} × ${num(f.h)}</span></label>`).join('')+`<div class="row"><button data-act="showAll">Show all</button></div>`:'<p>No pieces yet.</p>';
  }
  $('#calCustom').checked=S.cal.custom; $('#calRef').hidden=!S.cal.custom;
  const r=S.cal.ref; $('#rX').value=num(r.x); $('#rY').value=num(r.y); $('#rW').value=num(r.w); $('#rH').value=num(r.h);
  $('#lockBadge').hidden=!S.locked; $('#lockBanner').hidden=!S.locked;
  $('#bUndo').disabled=!store.canUndo(); $('#bRedo').disabled=!store.canRedo();
  $('#bCommit').textContent=S.locked?'Unlock to keep editing':'Lock layout';
  ptool.hidden=!(T.mode==='project'&&!T.uiHidden);
  const chips=$('#chips');
  if (!chips._d){ chips._d=1; chips.innerHTML=[[4,6],[5,7],[8,10],[11,14],[12,12],[16,20],[18,24],[24,36]].map(([w,h])=>`<button class="chip" data-act="chip" data-w="${w}" data-h="${h}">${w}×${h}</button>`).join(''); }
  $('#aW').placeholder=$('#aH').placeholder='e.g. '+(S.unit==='cm'?'40.6':'16');
}
export function renderAll(){ applyClasses(); layout(); renderFrames(); renderList(); renderProps(); renderControls(); }
export const checkpoint = () => store.checkpoint();
export function sched(){ clearTimeout(T.cpTimer); T.cpTimer=setTimeout(()=>{ checkpoint(); renderList(); renderProps(); },450); }

export function initRender(){
  store.subscribe(ev=>{ if (ev==='restore') renderAll(); else renderControls(); });
}
