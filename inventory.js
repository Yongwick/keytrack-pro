
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
  if(qty===0){
    return `<div class="stock-status stock-out">
      <span class="qty-pill qty-out">● ${qty}</span>
      <span class="stock-warning">⚠ Sin existencia</span>
    </div>`;
  }
  if(qty<=min){
    return `<div class="stock-status stock-low">
      <span class="qty-pill qty-low">● ${qty}</span>
      <span class="stock-warning">⚠ Stock bajo</span>
    </div>`;
  }
  return `<div class="stock-status stock-ok">
    <span class="qty-pill qty-ok">● ${qty}</span>
    <span class="stock-label">En stock</span>
  </div>`;
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
      <td class="product-photo-cell">${x.image_url?`<img class="product-photo" src="${esc(x.image_url)}" alt="">`:'<div class="photo-placeholder">🔑</div>'}</td>
      <td class="product-title-cell"><b>${esc(x.name)}</b><div class="muted">${esc(x.notes||'Sin notas')}</div></td>
      <td class="product-meta-pair product-brand-fcc">
        <div class="product-meta-field meta-brand"><span class="product-meta-label">Marca</span><span class="product-meta-value">${esc(x.brand||'—')}</span></div>
        <div class="product-meta-field meta-fcc"><span class="product-meta-label">FCC ID</span><span class="product-meta-value muted">${esc(x.fcc_id||'Sin FCC')}</span></div>
      </td>
      <td class="product-meta-pair product-sku-oem">
        <div class="product-meta-field meta-sku"><span class="product-meta-label">SKU</span><span class="product-meta-value strong">${esc(x.sku||'—')}</span></div>
        <div class="product-meta-field meta-oem"><span class="product-meta-label">OEM / PN</span><span class="product-meta-value muted">${esc(x.oem_number||x.barcode||'Sin OEM')}</span></div>
      </td>
      <td class="product-vehicle-cell">${vehicle(x.vehicle_compatibility)}</td>
      <td class="product-location-cell">${esc(x.locations?.name||'—')}</td>
      <td class="product-stock-cell">${qtyPill(qty,min)}</td>
      <td class="product-actions-cell"><div class="inventory-actions">
        <button class="btn small" data-product-action="move" data-id="${x.id}">±</button>
        <button class="btn small" data-product-action="view" data-id="${x.id}">Ficha</button>
        <button class="btn small" data-product-action="history" data-id="${x.id}">Historial</button>
        <button class="btn small" data-product-action="edit" data-id="${x.id}">Editar</button>
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
