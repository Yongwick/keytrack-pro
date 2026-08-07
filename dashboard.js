
import {$,state,esc,safeNumber,todayISO} from './core.js';

export function renderDashboard(){
  const cost=state.items.reduce((n,x)=>n+safeNumber(x.cost)*safeNumber(x.quantity),0);
  const retail=state.items.reduce((n,x)=>n+safeNumber(x.sale_price)*safeNumber(x.quantity),0);
  $('#dashCost').textContent='$'+cost.toFixed(2);
  $('#dashRetail').textContent='$'+retail.toFixed(2);
  $('#dashMargin').textContent='$'+(retail-cost).toFixed(2);
  $('#dashMoves').textContent=state.movements.filter(m=>String(m.created_at||'').slice(0,10)===todayISO()).length;

  const critical=state.items
    .filter(x=>safeNumber(x.quantity)<=safeNumber(x.minimum_quantity))
    .sort((a,b)=>safeNumber(a.quantity)-safeNumber(b.quantity)).slice(0,8);
  $('#criticalList').innerHTML=critical.length?critical.map(x=>`<div class="history-item"><b>${esc(x.name)}</b><div class="muted">${x.quantity} unidades · mínimo ${x.minimum_quantity||0}</div></div>`).join(''):'<div class="muted">No hay productos críticos.</div>';

  const valuable=[...state.items].sort((a,b)=>(safeNumber(b.cost)*safeNumber(b.quantity))-(safeNumber(a.cost)*safeNumber(a.quantity))).slice(0,8);
  $('#valueList').innerHTML=valuable.length?valuable.map(x=>`<div class="history-item"><b>${esc(x.name)}</b><div class="muted">$${(safeNumber(x.cost)*safeNumber(x.quantity)).toFixed(2)}</div></div>`).join(''):'<div class="muted">Sin productos.</div>';

  $('#recentList').innerHTML=state.movements.length?state.movements.slice(0,8).map(m=>`<div class="history-item"><b>${esc(m.products?.name||'Producto')}</b><div class="muted">${esc(m.movement_type||'movimiento')} · ${m.quantity} · ${new Date(m.created_at).toLocaleString()}</div></div>`).join(''):'<div class="muted">Sin actividad reciente.</div>';
}
