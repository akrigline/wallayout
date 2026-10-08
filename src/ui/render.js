import { $, K, S, T, V, calsvg, els, esc, fmt, handles, hud, num, ptool, stage, store, unitWord, wall } from './ctx.js';
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
export function renumber(){
  let n=0; T.num=new Map();
  for (const f of S.frames) if (f.kind!=='obstacle') T.num.set(f.id,++n);
}
export const gapsOf = f => L.gapsOf(S.frames,f);
export const hit = (x,y) => L.hit(S.frames,x,y);
export function applyClasses(){
  const p=S.proj, proj=T.mode==='project';
  wall.className=[proj?'project':'design', proj?p.style:'', proj&&p.mono?'mono':'', proj&&!p.labels?'nolabels':'', !S.hooks?'nohooks':'', proj&&p.grid?'pgrid':'', proj&&p.edge?'edge':'', proj&&T.calibrating?'cal':''].join(' ');
}
export function renderFrames(){
  computeBad(); renumber();
  for (const [id,el] of els) if (!S.frames.some(f=>f.id===id)){ el.remove(); els.delete(id); }
  const hideSel = T.mode==='project' && (T.uiHidden || T.calibrating);
  for (const f of S.frames){
    let el=els.get(f.id);
    if (!el){ el=document.createElement('div'); el.className='fr'; el.innerHTML='<div class="lb"></div><i class="hk"></i>'; wall.insertBefore(el,calsvg); els.set(f.id,el); }
    el.style.left=f.x*K+'px'; el.style.top=f.y*K+'px'; el.style.width=f.w*K+'px'; el.style.height=f.h*K+'px';
    el.style.setProperty('--hh',f.hue);
    el.querySelector('.hk').style.top=S.hook*K+'px';
    el.classList.toggle('sel',f.id===S.sel&&!hideSel);
    el.classList.toggle('bad',T.bad.has(f.id));
    el.classList.toggle('obs',f.kind==='obstacle');
    const n=T.num.get(f.id);
    const html=`${n?'<b>'+n+'</b> ':''}${esc(f.name)}<small>${num(f.w)} × ${num(f.h)}</small>`;
    const lb=el.firstChild; if (lb._h!==html){ lb.innerHTML=html; lb._h=html; }
  }
  // keep DOM order = array order for stacking
  S.frames.forEach(f=>wall.insertBefore(els.get(f.id),calsvg));
  renderArea(); renderGuides(); updateHud();
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
  const f=S.frames.find(x=>x.id===S.sel);
  const show=f && !(T.mode==='project'&&(T.uiHidden||T.calibrating));
  hud.hidden=!show; if (!show) return;
  const g=gapsOf(f), v=x=>x==null?'–':fmt(x), n=T.num.get(f.id);
  hud.textContent=`${n?'#'+n+' ':''}${f.name}: ${fmt(f.x)} from left, ${fmt(f.y)} from ceiling. Gaps: left ${v(g.L)}, right ${v(g.R)}, above ${v(g.T)}, below ${v(g.B)}`;
}
export function renderList(){
  const L=$('#list');
  if (!S.frames.length){ L.innerHTML='<p class="note">No frames yet. Pick a common size above or paste a list.</p>'; }
  else L.innerHTML=S.frames.map(f=>{
    const n=T.num.get(f.id), b=T.bad.get(f.id);
    return `<button class="li ${f.id===S.sel?'sel':''} ${f.kind==='obstacle'?'obs':''}" data-act="select" data-id="${f.id}" style="--hh:${f.hue}"><i></i><span class="nm">${n?n+'. ':''}${esc(f.name)}</span><span class="dm">${num(f.w)} × ${num(f.h)}</span>${b?`<b class="warn" title="${esc(b)}">!</b>`:''}</button>`;
  }).join('');
  const c=S.frames.filter(f=>f.kind!=='obstacle').length, bad=T.bad.size;
  $('#cnt').textContent=`${c} on the wall${bad?`, ${bad} with conflicts`:''}`;
}
export function renderProps(){
  const P=$('#props'), f=S.frames.find(x=>x.id===S.sel);
  if (!f){ P.hidden=true; P.innerHTML=''; return; }
  P.hidden=false;
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
    <div class="btnrow">
      <button data-act="rotate">Rotate 90°</button><button data-act="dup">Duplicate</button>
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
  $('#sGap').value=num(S.gap); $('#sHook').value=num(S.hook);
  $('#sArea').checked=!!S.area; $('#areaFields').hidden=!S.area;
  if (S.area){ $('#aX').value=num(S.area.x); $('#aY').value=num(S.area.y); $('#aAw').value=num(S.area.w); $('#aAh').value=num(S.area.h); }
  $('#sGrid').value=String(S.grid); $('#sSnap').checked=S.snap; $('#sHooks').checked=S.hooks;
  document.querySelectorAll('#unitSeg button').forEach(b=>b.classList.toggle('on',b.dataset.unit===S.unit));
  document.querySelectorAll('#pStyle button').forEach(b=>b.classList.toggle('on',b.dataset.v===S.proj.style));
  document.querySelectorAll('#ptool [data-act="tog"]').forEach(b=>{ const t=b.dataset.t; b.classList.toggle('on', t==='hooks'?S.hooks:S.proj[t]); });
  $('#pLock').classList.toggle('on',S.locked); $('#pLock').textContent=S.locked?'Locked':'Lock';
  $('#pCal').classList.toggle('on',T.calibrating);
  $('#calPanel').hidden=!T.calibrating;
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
