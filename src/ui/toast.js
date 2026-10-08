import { $, S } from './ctx.js';

let toastT;
export function toast(m){ const t=$('#toast'); t.textContent=m; t.classList.add('show'); clearTimeout(toastT); toastT=setTimeout(()=>t.classList.remove('show'),2400); }
export function locked(){ if (S.locked){ toast('Layout is locked. Unlock to make changes.'); return true; } return false; }
