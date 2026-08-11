
import {$,state,esc,safeNumber,toast,downloadText} from './core.js';

export function filteredItems(){
  const q=($('#search')?.value||'').trim().toLowerCase();
  const category=$('#filter')?.value||'';
  const make=($('#vehicleMake')?.value||'').trim().toLowerCase();
  const model=($('#vehicleModel')?.value||'').trim().toLowerCase();
  const year=($('#vehicleYear')?.value||'').trim().toLowerCase();

  return state.items.filter(x=>{
    const qty=safeNumber(x.quantity),min=safeNumber(x.minimum_quantity);
    const stock=!state.stockFilter ||
      (state.stockFilter==='low'&&qty>0&&qty<=min) ||
      (state.stockFilter==='out'&&qty===0);
    const cat=!category||x.category===category;

    const vehicleText=String(x.vehicle_compatibility||'').toLowerCase();
    const brandText=String(x.brand||'').toLowerCase();
    const haystack=[
      x.name,x.sku,x.serial_number,x.barcode,x.fcc_id,x.ic_number,
      x.brand,x.oem_number,x.frequency,x.chip_type,x.vehicle_compatibility,
      x.supplier,x.equivalences,x.locations?.name,x.notes
    ].join(' ').toLowerCase();

    const qOk=!q||haystack.includes(q);
    const makeOk=!make||brandText.includes(make)||vehicleText.includes(make);
    const modelOk=!model||vehicleText.includes(model);
    const yearOk=!year||vehicleText.includes(year);

    return stock&&cat&&qOk&&makeOk&&modelOk&&yearOk;
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
    return `<div class="inventory-card" data-product-id="${x.id}">
      <div class="inventory-card-head">
        <div class="inventory-card-photo">
          ${x.image_url?`<img class="product-photo" src="${esc(x.image_url)}" alt="">`:'<div class="photo-placeholder">🔑</div>'}
        </div>

        <div class="inventory-card-title">
          <b>${esc(x.name)}</b>
          <div class="muted">${esc(x.notes||'Sin notas')}</div>
        </div>

        <div class="inventory-card-stock">
          ${qtyPill(qty,min)}
        </div>
      </div>

      <div class="inventory-card-meta">
        <div class="inventory-meta-box">
          <span class="product-meta-label">Marca</span>
          <span class="product-meta-value">${esc(x.brand||'—')}</span>
        </div>
        <div class="inventory-meta-box">
          <span class="product-meta-label">FCC ID</span>
          <span class="product-meta-value muted">${esc(x.fcc_id||'Sin FCC')}</span>
        </div>
        <div class="inventory-meta-box">
          <span class="product-meta-label">SKU</span>
          <span class="product-meta-value strong">${esc(x.sku||'—')}</span>
        </div>
        <div class="inventory-meta-box">
          <span class="product-meta-label">OEM / PN</span>
          <span class="product-meta-value muted">${esc(x.oem_number||x.barcode||'Sin OEM')}</span>
        </div>
      </div>

      <div class="inventory-card-info">
        <div class="inventory-info-box inventory-vehicle-box">
          <span class="product-meta-label">Vehículo</span>
          <div class="product-info-value">${vehicle(x.vehicle_compatibility)}</div>
        </div>

        <div class="inventory-info-box inventory-location-box">
          <span class="product-meta-label">Ubicación</span>
          <div class="product-info-value">${esc(x.locations?.name||'—')}</div>
        </div>
      </div>

      <div class="inventory-card-actions">
        <button class="btn small" data-product-action="move" data-id="${x.id}">±</button>
        <button class="btn small" data-product-action="view" data-id="${x.id}">Ficha</button>
        <button class="btn small" data-product-action="history" data-id="${x.id}">Historial</button>
        <button class="btn small" data-product-action="edit" data-id="${x.id}">Editar</button>
      </div>
    </div>`;
  }).join('');

  $('#count').textContent=`${rows.length} resultado${rows.length===1?'':'s'}`;
  $('#si').textContent=state.items.length;
  $('#su').textContent=state.items.reduce((n,x)=>n+safeNumber(x.quantity),0);
  $('#sl').textContent=state.items.filter(x=>safeNumber(x.quantity)>0&&safeNumber(x.quantity)<=safeNumber(x.minimum_quantity)).length;
  $('#sz').textContent=state.items.filter(x=>safeNumber(x.quantity)===0).length;
}


function exactScannerMatch(raw){
  const q=String(raw||'').trim().toLowerCase();
  if(!q)return null;

  const matches=state.items.filter(x=>[
    x.barcode,x.sku,x.oem_number,x.fcc_id,x.serial_number,x.ic_number
  ].some(v=>String(v||'').trim().toLowerCase()===q));

  return matches.length===1?matches[0]:null;
}

function openExactScannerResult(raw){
  const product=exactScannerMatch(raw);
  if(!product)return false;

  const search=$('#search');
  search.value=String(raw||'').trim();
  renderInventory();

  requestAnimationFrame(()=>{
    const button=document.querySelector(
      `[data-product-action="view"][data-id="${product.id}"]`
    );
    button?.click();
  });
  return true;
}

export function initInventory({switchView}){
  $('#search').addEventListener('input',renderInventory);

  // Scanner Bluetooth / USB: normalmente se comporta como teclado.
  // Si envía Enter después del código, abre directamente la ficha cuando
  // existe una coincidencia exacta por barcode, SKU, OEM, FCC, serie o IC.
  $('#search').addEventListener('keydown',event=>{
    if(event.key!=='Enter' && event.key!=='Tab')return;
    const raw=event.currentTarget.value.trim();
    if(!raw)return;
    event.preventDefault();

    if(!openExactScannerResult(raw)){
      renderInventory();
      toast('Código recibido. No hay coincidencia exacta.');
    }
  });

  // Mantener la búsqueda preparada al entrar al inventario.
  setTimeout(()=>$('#search')?.focus({preventScroll:true}),120);

  // Captura opcional de scanners tipo "keyboard wedge" aun cuando el
  // campo de búsqueda no tenga foco. Solo acepta ráfagas rápidas.
  let btBuffer='';
  let btLast=0;
  let btTimer=null;

  document.addEventListener('keydown',event=>{
    if(document.querySelector('dialog[open]'))return;

    const active=document.activeElement;
    const editable=active && (
      active.tagName==='INPUT' ||
      active.tagName==='TEXTAREA' ||
      active.tagName==='SELECT' ||
      active.isContentEditable
    );
    if(editable)return;

    const now=Date.now();

    if(event.key==='Enter' || event.key==='Tab'){
      if(btBuffer.length>=4 && now-btLast<400){
        event.preventDefault();
        const value=btBuffer;
        btBuffer='';
        clearTimeout(btTimer);
        $('#search').value=value;
        if(!openExactScannerResult(value))renderInventory();
      }
      return;
    }

    if(event.key.length!==1 || event.ctrlKey || event.altKey || event.metaKey)return;

    // Los scanners escriben mucho más rápido que una persona.
    if(now-btLast>180)btBuffer='';
    btBuffer+=event.key;
    btLast=now;

    clearTimeout(btTimer);
    btTimer=setTimeout(()=>{btBuffer='';},450);
  });

  $('#filter').addEventListener('change',renderInventory);

  ['vehicleMake','vehicleModel','vehicleYear'].forEach(id=>{
    $('#'+id)?.addEventListener('input',renderInventory);
  });

  $('#toggleVehicleFilters')?.addEventListener('click',()=>{
    const box=$('#vehicleFilters');
    if(!box)return;
    const open=box.classList.toggle('open');
    $('#toggleVehicleFilters').textContent=open?'✕ Ocultar filtros':'⚙ Filtros';
  });

  $('#clear').addEventListener('click',()=>{
    $('#search').value='';
    $('#filter').value='';
    if($('#vehicleMake'))$('#vehicleMake').value='';
    if($('#vehicleModel'))$('#vehicleModel').value='';
    if($('#vehicleYear'))$('#vehicleYear').value='';
    state.stockFilter='';
    renderInventory();
  });

  // Cards behave as filters.
  const low=$('#sl')?.closest('.card');
  const out=$('#sz')?.closest('.card');
  [low,out].forEach(x=>x?.classList.add('kpi-click'));
  low?.addEventListener('click',()=>{state.stockFilter=state.stockFilter==='low'?'':'low';switchView('inventory');renderInventory()});
  out?.addEventListener('click',()=>{state.stockFilter=state.stockFilter==='out'?'':'out';switchView('inventory');renderInventory()});


}
