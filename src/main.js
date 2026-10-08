import './css/tokens.css';
import './css/layout.css';
import './css/wall.css';
import './css/projection.css';
import './css/responsive.css';
import { S, store } from './ui/ctx.js';
import { addFrame, arrange } from './ui/actions.js';
import { initRender, renderAll } from './ui/render.js';
import { initProjection } from './ui/projection.js';
import { initModals } from './ui/modals.js';
import { initInteraction } from './ui/interaction.js';

initRender();
initProjection();
initModals();
initInteraction();

if (store.fresh) {
  [['Harbor',24,36],['Portrait',16,20],['Botanical',11,14],['Sketch',8,10],['Square',12,12],['Postcard',5,7],['Mirror',18,24]]
    .forEach(([n,w,h])=>addFrame({name:n,w,h},true));
  S.sel = null;
  arrange(false);
}
S.sel = S.frames.some(f=>f.id===S.sel) ? S.sel : null;
store.resetHistory();
renderAll();
if (store.fresh) store.save();
