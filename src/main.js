import { num as numU, fmt as fmtU, parseLen as parseLenU, parseBulk as parseBulkU, unitWord as unitWordU } from './js/units.js';
import * as HS from './js/hangSheet.js';
import { encodeSpec as encodePlan, decodeSpec as decodePlan } from './js/shareCode.js';
import { createStore } from './js/store.js';
import * as L from './js/layout.js';
import { homography, inv3, mapPt } from './js/homography.js';

const K = 20;                       // wall-plane pixels per inch
const $ = s => document.querySelector(s);
const { clamp, r16 } = L;
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

/* ---------- state ---------- */
const store = createStore();
const S = store.state;
const fresh = store.fresh;
const T = { mode:'design', calibrating:false, uiHidden:false, drag:null, guides:[], num:new Map(), bad:new Map(), hsel:null, hdrag:null, u:1, cpTimer:null };
const save = () => store.save();


const num = v => numU(v, S.unit);
const fmt = v => fmtU(v, S.unit);
const parseLen = s => parseLenU(s, S.unit);
const parseBulk = txt => parseBulkU(txt, S.unit);
const unitWord = () => unitWordU(S.unit);

/* ---------- elements ---------- */
const stage=$('#stage'), wall=$('#wall'), calsvg=$('#calsvg'), hud=$('#hud'), ptool=$('#ptool');
const handles=[...document.querySelectorAll('.h')];
const els=new Map();
let Hm=null, Hi=null;

const area = () => L.areaOf(S);
const normArea = () => { S.area = L.normArea(S.area, S.wall); };
const refRect = () => S.cal.custom ? S.cal.ref : {x:0,y:0,w:S.wall.w,h:S.wall.h};

function initCorners(){
  if (S.cal.set) return;
  const sw=stage.clientWidth, sh=stage.clientHeight, r=refRect(), a=r.w/r.h;
  const w=Math.min(.8*sw,.8*sh*a), h=w/a;
  const x0=(sw-w)/2/sw, x1=1-x0, y0=(sh-h)/2/sh, y1=1-y0;
  S.cal.corners=[[x0,y0],[x1,y0],[x1,y1],[x0,y1]];
}

function layout(){
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
  Hm=h; Hi=h?inv3(h):null;
  if (!h||!Hi){ wall.style.visibility='hidden'; return; }
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

function toWall(cx,cy){
  const r=stage.getBoundingClientRect();
  if (!Hi) return [0,0];
  const p=mapPt(Hi,cx-r.left,cy-r.top);
  return [p[0]/K,p[1]/K];
}

/* ---------- frame geometry ---------- */
function computeBad(){ T.bad=L.computeBad(S); }
function renumber(){
  let n=0; T.num=new Map();
  for (const f of S.frames) if (f.kind!=='obstacle') T.num.set(f.id,++n);
}
const gapsOf = f => L.gapsOf(S.frames,f);
const hit = (x,y) => L.hit(S.frames,x,y);
function snapMove(f,nx,ny,free){
  const r=L.snapMove(S,f,nx,ny,free,8*T.u/K);
  T.guides=r.guides;
  return [r.x,r.y];
}

/* ---------- rendering ---------- */
function applyClasses(){
  const p=S.proj, proj=T.mode==='project';
  wall.className=[proj?'project':'design', proj?p.style:'', proj&&p.mono?'mono':'', proj&&!p.labels?'nolabels':'', !S.hooks?'nohooks':'', proj&&p.grid?'pgrid':'', proj&&p.edge?'edge':'', proj&&T.calibrating?'cal':''].join(' ');
}
function renderFrames(){
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
function renderArea(){
  const b=$('#areaBox'), a=S.area;
  b.classList.toggle('on',!!a); if (!a) return;
  b.style.left=a.x*K+'px'; b.style.top=a.y*K+'px'; b.style.width=a.w*K+'px'; b.style.height=a.h*K+'px'; b.style.boxSizing='border-box';
}
function renderGuides(){
  wall.querySelectorAll('.gd').forEach(n=>n.remove());
  for (const g of T.guides){
    const d=document.createElement('div'); d.className='gd '+g.axis;
    if (g.axis==='x') d.style.left=g.pos*K+'px'; else d.style.top=g.pos*K+'px';
    wall.appendChild(d);
  }
}
function updateHud(){
  const f=S.frames.find(x=>x.id===S.sel);
  const show=f && !(T.mode==='project'&&(T.uiHidden||T.calibrating));
  hud.hidden=!show; if (!show) return;
  const g=gapsOf(f), v=x=>x==null?'–':fmt(x), n=T.num.get(f.id);
  hud.textContent=`${n?'#'+n+' ':''}${f.name}: ${fmt(f.x)} from left, ${fmt(f.y)} from ceiling. Gaps: left ${v(g.L)}, right ${v(g.R)}, above ${v(g.T)}, below ${v(g.B)}`;
}
function renderList(){
  const L=$('#list');
  if (!S.frames.length){ L.innerHTML='<p class="note">No frames yet. Pick a common size above or paste a list.</p>'; }
  else L.innerHTML=S.frames.map(f=>{
    const n=T.num.get(f.id), b=T.bad.get(f.id);
    return `<button class="li ${f.id===S.sel?'sel':''} ${f.kind==='obstacle'?'obs':''}" data-act="select" data-id="${f.id}" style="--hh:${f.hue}"><i></i><span class="nm">${n?n+'. ':''}${esc(f.name)}</span><span class="dm">${num(f.w)} × ${num(f.h)}</span>${b?`<b class="warn" title="${esc(b)}">!</b>`:''}</button>`;
  }).join('');
  const c=S.frames.filter(f=>f.kind!=='obstacle').length, bad=T.bad.size;
  $('#cnt').textContent=`${c} on the wall${bad?`, ${bad} with conflicts`:''}`;
}
function renderProps(){
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
function updateXY(){
  const f=S.frames.find(x=>x.id===S.sel); if (!f) return;
  for (const k of ['x','y']){ const i=$(`#props [data-k="${k}"]`); if (i&&document.activeElement!==i) i.value=num(f[k]); }
}
function renderControls(){
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
function renderAll(){ applyClasses(); layout(); renderFrames(); renderList(); renderProps(); renderControls(); }

/* ---------- history ---------- */
const checkpoint = () => store.checkpoint();
store.subscribe(ev=>{ if (ev==='restore') renderAll(); else renderControls(); });
function sched(){ clearTimeout(T.cpTimer); T.cpTimer=setTimeout(()=>{ checkpoint(); renderList(); renderProps(); },450); }
const undo = () => store.undo();
const redo = () => store.redo();

/* ---------- actions ---------- */
let toastT;
function toast(m){ const t=$('#toast'); t.textContent=m; t.classList.add('show'); clearTimeout(toastT); toastT=setTimeout(()=>t.classList.remove('show'),2400); }
function locked(){ if (S.locked){ toast('Layout is locked. Unlock to make changes.'); return true; } return false; }
const findSpot = (w,h) => L.findSpot(S,w,h);
function addFrame(o,quiet){
  const id=S.nextId++, [x,y]=findSpot(o.w,o.h);
  const f={id,name:o.name||(o.kind==='obstacle'?'Obstacle':'Frame '+id),w:o.w,h:o.h,x,y,hue:Math.round((id*137.5)%360),kind:o.kind||'frame'};
  S.frames.push(f); S.sel=id;
  if (!quiet){ checkpoint(); renderAll(); }
  return f;
}
const applyMoves = moves => { for (const m of moves){ const f=S.frames.find(x=>x.id===m.id); if (f){ f.x=m.x; f.y=m.y; } } };
function arrange(shuffle){
  if (locked()) return;
  if (!S.frames.some(f=>f.kind!=='obstacle')){ toast('Add some frames first.'); return; }
  const r=L.arrange(S,{shuffle});
  applyMoves(r.moves);
  checkpoint(); renderAll();
  if (r.overflow) toast('These frames are too big to fit in the gallery area with that gap.');
}
function centerGroup(){
  if (locked()) return;
  applyMoves(L.centerGroup(S));
  checkpoint(); renderAll();
}
const sel=()=>S.frames.find(f=>f.id===S.sel);
function setUnit(u){
  S.unit=u; save(); renderAll();
}
/* ---------- hang sheet ---------- */
const sheetRows = () => HS.sheetRows(S);
const sheetText = () => HS.sheetText(S,S.unit);
function openSheet(){
  const rows=sheetRows(), bad=T.bad.size;
  $('#sheetBody').innerHTML=(bad?`<p style="color:var(--bad)">${HS.conflictNotice(bad)}</p>`:'')+
    `<p>Wall ${fmt(S.wall.w)} × ${fmt(S.wall.h)}. Hook sits ${fmt(S.hook)} below each frame's top edge. Measure from the wall's left edge and from the floor.</p>`+
    (rows.length?`<table><thead><tr><th>#</th><th>Name</th><th>Size</th><th>Left edge</th><th>Top (from ceiling)</th><th>Bottom (from floor)</th><th>Hook from left</th><th>Hook from floor</th></tr></thead><tbody>`+
    rows.map(r=>`<tr><td>${r.n}</td><td>${esc(r.f.name)}</td><td>${fmt(r.f.w)} × ${fmt(r.f.h)}</td><td>${fmt(r.left)}</td><td>${fmt(r.top)}</td><td>${fmt(r.floor)}</td><td>${fmt(r.hx)}</td><td>${fmt(r.hfloor)}</td></tr>`).join('')+`</tbody></table>`:'<p>No frames on the wall yet.</p>');
  $('#sheet').hidden=false; renderControls();
}
async function copyText(t){
  try { await navigator.clipboard.writeText(t); toast('Copied.'); return; } catch(e) {}
  const ta=document.createElement('textarea'); ta.value=t; ta.style.position='fixed'; ta.style.opacity='0'; document.body.appendChild(ta); ta.select();
  let ok=false; try { ok=document.execCommand('copy'); } catch(e) {}
  ta.remove(); toast(ok?'Copied.':'Copy blocked here. Select the table and copy instead.');
}

/* ---------- share code ---------- */
const encodeSpec = () => encodePlan(S);
const decodeSpec = txt => decodePlan(txt,{gap:S.gap,hook:S.hook});
function openShare(){ $('#codeOut').value=encodeSpec(); $('#codeIn').value=''; $('#share').hidden=false; }

/* ---------- mode ---------- */
function setMode(m){
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
function toggleFullscreen(){
  try {
    if (document.fullscreenElement) document.exitFullscreen();
    else { const p=stage.requestFullscreen&&stage.requestFullscreen(); if (p&&p.catch) p.catch(()=>toast('Fullscreen is blocked here. Use your browser\'s fullscreen (F11).')); }
  } catch(e) { toast('Fullscreen is blocked here. Use your browser\'s fullscreen (F11).'); }
}

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
      S.unit=d.unit; S.wall=d.wall; S.area=d.area; normArea(); S.gap=d.gap; S.hook=d.hook; S.frames=d.frames; S.nextId=d.frames.length+1; S.sel=null;
      checkpoint(); renderAll(); $('#share').hidden=true; toast(`Loaded ${d.frames.length} frame${d.frames.length===1?'':'s'}. Undo brings your old plan back.`); break;
    }
    case 'closeSheet': $('#sheet').hidden=true; break;
    case 'copySheet': copyText(sheetText()); break;
    case 'fullscreen': toggleFullscreen(); break;
    case 'hideUI': T.uiHidden=true; renderAll(); toast('Controls hidden. Double-click empty space or press H to bring them back.'); break;
    case 'calToggle': T.calibrating=!T.calibrating; T.hsel=null; renderAll(); break;
    case 'calDone': S.cal.set=true; T.calibrating=false; T.hsel=null; save(); renderAll(); break;
    case 'calReset': S.cal.set=false; initCorners(); S.cal.set=false; save(); renderAll(); break;
    case 'select': S.sel=+b.dataset.id; renderFrames(); renderList(); renderProps(); break;
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
    case 'rotate': { if (locked()) break; const f=sel(); if(!f) break; const cx=f.x+f.w/2, cy=f.y+f.h/2; [f.w,f.h]=[f.h,f.w]; f.x=r16(cx-f.w/2); f.y=r16(cy-f.h/2); checkpoint(); renderAll(); break; }
    case 'dup': { if (locked()) break; const f=sel(); if(!f) break; const n=addFrame({name:f.name,w:f.w,h:f.h,kind:f.kind}); break; }
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
  else { const v=parseLen(i.value); if (!isFinite(v)||((k==='w'||k==='h')&&v<=0)){ bad(); renderProps(); return; } f[k]=v; }
  checkpoint(); renderAll();
});

/* ---------- stage pointer ---------- */
stage.addEventListener('pointerdown',e=>{
  if (e.target.closest('.ui')||e.button>0) return;
  if (T.mode==='project'&&T.calibrating) return;
  const [x,y]=toWall(e.clientX,e.clientY), f=hit(x,y);
  if (f){
    S.sel=f.id; renderFrames(); renderList(); renderProps();
    if (!S.locked){ T.drag={f,ox:x-f.x,oy:y-f.y,moved:false,sx:e.clientX,sy:e.clientY}; try{ stage.setPointerCapture(e.pointerId); }catch(_){} }
    else toast('Layout is locked. Unlock to move frames.');
  } else {
    const eh=areaEdge(x,y);
    if (eh&&!S.locked){ T.adrag={eh,x,y,a:{...S.area}}; try{ stage.setPointerCapture(e.pointerId); }catch(_){} }
    else if (S.sel){ S.sel=null; renderFrames(); renderList(); renderProps(); }
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
  const d=T.drag;
  if (!d){ if (!e.target.closest('.ui')){ const [x,y]=toWall(e.clientX,e.clientY); const eh=!S.locked&&areaEdge(x,y); stage.style.cursor=(!(T.mode==='project'&&T.calibrating)&&hit(x,y)&&!S.locked)?'grab':(eh?edgeCursor(eh):'default'); } return; }
  if (!d.moved && Math.hypot(e.clientX-d.sx,e.clientY-d.sy)<3) return;
  d.moved=true; stage.style.cursor='grabbing';
  const [x,y]=toWall(e.clientX,e.clientY);
  const [nx,ny]=snapMove(d.f,x-d.ox,y-d.oy,e.altKey);
  d.f.x=nx; d.f.y=ny; renderFrames(); updateXY();
});
function endDrag(){
  if (T.adrag){ T.adrag=null; const a=S.area; ['x','y','w','h'].forEach(k=>a[k]=r16(a[k])); normArea(); checkpoint(); renderAll(); return; }
  const d=T.drag; if (!d) return; T.drag=null;
  if (d.moved){ d.f.x=r16(d.f.x); d.f.y=r16(d.f.y); T.guides=[]; checkpoint(); renderAll(); }
  stage.style.cursor='default';
}
stage.addEventListener('pointerup',endDrag);
stage.addEventListener('pointercancel',endDrag);
stage.addEventListener('dblclick',e=>{
  if (T.mode!=='project'||e.target.closest('.ui')) return;
  const [x,y]=toWall(e.clientX,e.clientY);
  if (!hit(x,y)){ T.uiHidden=!T.uiHidden; renderAll(); }
});

/* calibration handles */
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

/* keyboard */
document.addEventListener('keydown',e=>{
  const tag=(e.target.tagName||'').toLowerCase();
  if (tag==='input'||tag==='textarea'||tag==='select') return;
  if (e.key==='Escape'){ if (!$('#share').hidden) $('#share').hidden=true; else if (!$('#sheet').hidden) $('#sheet').hidden=true; else if (T.mode==='project') setMode('design'); return; }
  if ((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){ e.preventDefault(); if(!S.locked) e.shiftKey?redo():undo(); return; }
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
  const f=sel(); if (!f) return;
  if (e.key==='Delete'||e.key==='Backspace'){ e.preventDefault(); if(locked()) return; S.frames=S.frames.filter(x=>x!==f); S.sel=null; checkpoint(); renderAll(); return; }
  if (e.key==='r'||e.key==='R'){ if(locked()) return; const cx=f.x+f.w/2, cy=f.y+f.h/2; [f.w,f.h]=[f.h,f.w]; f.x=r16(cx-f.w/2); f.y=r16(cy-f.h/2); renderAll(); sched(); return; }
  if (e.key.startsWith('Arrow')){
    e.preventDefault(); if (locked()) return;
    const st=e.altKey?1/16:e.shiftKey?1:.25;
    f.x+=e.key==='ArrowRight'?st:e.key==='ArrowLeft'?-st:0; f.y+=e.key==='ArrowDown'?st:e.key==='ArrowUp'?-st:0;
    f.x=r16(f.x); f.y=r16(f.y); renderFrames(); updateXY(); sched();
  }
});
document.addEventListener('fullscreenchange',()=>{ requestAnimationFrame(()=>{ layout(); }); });
new ResizeObserver(()=>layout()).observe(stage);
$('#sheet').addEventListener('click',e=>{ if (e.target.id==='sheet') $('#sheet').hidden=true; });
$('#share').addEventListener('click',e=>{ if (e.target.id==='share') $('#share').hidden=true; });
$('#codeOut').addEventListener('focus',e=>e.target.select());

/* ---------- boot ---------- */
if (fresh){
  [['Harbor',24,36],['Portrait',16,20],['Botanical',11,14],['Sketch',8,10],['Square',12,12],['Postcard',5,7],['Mirror',18,24]]
    .forEach(([n,w,h])=>addFrame({name:n,w,h},true));
  S.sel=null;
  // inline arrange without checkpoint side-effects
  arrange(false);
}
S.sel = S.frames.some(f=>f.id===S.sel) ? S.sel : null;
store.resetHistory();
renderAll();
if (fresh) save();