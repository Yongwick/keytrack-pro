
import {$,state,esc,safeNumber,toast,downloadText} from './core.js';

export function filteredItems(){
  const q=($('#search')?.value||'').trim().toLowerCase();
  const category=$('#filter')?.value||'';
  return state.items.filter(x=>{
    const qty=safeNumber(x.quantity),min=safeNumber(x.minimum_quantity);
    const stock=!state.stockFilter ||
      (state.stockFilter==='low'&&qty>0&&qty<=min) ||
      (state.stockFilter==='out'&&qty===0);
    const cat=!category||x.category===category;
    const haystack=[
      x.name,x.sku,x.serial_number,x.barcode,x.fcc_id,x.ic_number,
      x.brand,x.oem_number,x.frequency,x.chip_type,x.vehicle_compatibility,
      x.supplier,x.equivalences,x.locations?.name,x.notes
    ].join(' ').toLowerCase();
    return stock&&cat&&(!q||haystack.includes(q));
  });
}

function qtyPill(qty,min){
  if(qty===0)return `<span class="qty-pill qty-out">● 0</span>`;
  if(qty<=min)return `<span class="qty-pill qty-low">● ${qty}</span>`;
  return `<span class="qty-pill qty-ok">● ${qty}</span>`;
}

function vehicle(text){
  if(!text)return '—';
  const raw=String(text).replace(/\s+/g,' ').trim();
  if(raw.length<90)return `<div class="vehicle-summary">${esc(raw)}</div>`;
  return `<div class="vehicle-summary">${esc(raw.slice(0,85))}…<details><summary>Mostrar completo</summary><div>${esc(raw)}</div></details></div>`;
}

export function renderInventory(){
  const rows=filteredItems();
  const body=$('#body');
  if(!body)return;

  body.innerHTML=rows.map(x=>{
    const qty=safeNumber(x.quantity),min=safeNumber(x.minimum_quantity);
    return `<tr>
      <td>${x.image_url?`<img class="product-photo" src="${esc(x.image_url)}" alt="">`:'<div class="photo-placeholder">🔑</div>'}</td>
      <td><b>${esc(x.name)}</b><div class="muted">${esc(x.notes||'Sin notas')}</div></td>
      <td><span class="nowrap">${esc(x.brand||'—')}</span><div class="muted nowrap">${esc(x.fcc_id||'Sin FCC')}</div></td>
      <td><b class="nowrap">${esc(x.sku||'—')}</b><div class="muted nowrap">${esc(x.oem_number||x.barcode||'Sin OEM')}</div></td>
      <td>${vehicle(x.vehicle_compatibility)}</td>
      <td>${esc(x.locations?.name||'—')}</td>
      <td>${qtyPill(qty,min)}</td>
      <td><div class="inventory-actions">
        <button class="btn small" data-product-action="move" data-id="${x.id}">±</button>
        <button class="btn small" data-product-action="view" data-id="${x.id}">Ficha</button>
        <button class="btn small" data-product-action="history" data-id="${x.id}">Historial</button>
        <button class="btn small" data-product-action="edit" data-id="${x.id}">Editar</button>
        ${['owner','admin','manager'].includes(state.profile?.role)?`<button class="btn small danger" data-product-action="delete" data-id="${x.id}">Borrar</button>`:''}
      </div></td>
    </tr>`;
  }).join('');

  $('#count').textContent=`${rows.length} resultado${rows.length===1?'':'s'}`;
  $('#si').textContent=state.items.length;
  $('#su').textContent=state.items.reduce((n,x)=>n+safeNumber(x.quantity),0);
  $('#sl').textContent=state.items.filter(x=>safeNumber(x.quantity)>0&&safeNumber(x.quantity)<=safeNumber(x.minimum_quantity)).length;
  $('#sz').textContent=state.items.filter(x=>safeNumber(x.quantity)===0).length;
}

export function initInventory({switchView}){
  $('#search').addEventListener('input',renderInventory);
  $('#filter').addEventListener('change',renderInventory);
  $('#clear').addEventListener('click',()=>{
    $('#search').value='';$('#filter').value='';state.stockFilter='';renderInventory();
  });
  $('#vehicleSearch').addEventListener('click',()=>{
    const q=[$('#vehicleMake').value,$('#vehicleModel').value,$('#vehicleYear').value].filter(Boolean).join(' ');
    $('#search').value=q;renderInventory();
  });
  $('#vehicleClear').addEventListener('click',()=>{
    $('#vehicleMake').value='';$('#vehicleModel').value='';$('#vehicleYear').value='';$('#search').value='';renderInventory();
  });

  // Cards behave as filters.
  const low=$('#sl')?.closest('.card');
  const out=$('#sz')?.closest('.card');
  [low,out].forEach(x=>x?.classList.add('kpi-click'));
  low?.addEventListener('click',()=>{state.stockFilter=state.stockFilter==='low'?'':'low';switchView('inventory');renderInventory()});
  out?.addEventListener('click',()=>{state.stockFilter=state.stockFilter==='out'?'':'out';switchView('inventory');renderInventory()});


}
