import {$,state,sb,val,esc,toast,safeNumber} from './core.js';

let saleCart=[];

function money(value){
  return '$'+safeNumber(value).toFixed(2);
}

function cartSubtotal(){
  return saleCart.reduce((sum,item)=>{
    return sum + Math.max((safeNumber(item.unit_price)*safeNumber(item.quantity))-safeNumber(item.discount),0);
  },0);
}

function saleTotal(){
  return Math.max(
    cartSubtotal()
    - safeNumber($('#saleDiscount')?.value)
    + safeNumber($('#saleTax')?.value),
    0
  );
}

function updateSaleTotals(){
  $('#saleSubtotal').textContent=money(cartSubtotal());
  $('#saleDiscountLabel').textContent=money($('#saleDiscount').value);
  $('#saleTaxLabel').textContent=money($('#saleTax').value);
  $('#saleGrandTotal').textContent=money(saleTotal());
}

function renderSaleCart(){
  const body=$('#saleCartBody');
  if(!body)return;

  body.innerHTML=saleCart.length?saleCart.map((item,index)=>`
    <tr>
      <td>
        <b>${esc(item.name)}</b>
        <div class="muted">Existencia: ${item.stock}</div>
      </td>
      <td>${esc(item.sku||'—')}</td>
      <td>
        <input class="field mini-field" type="number" min="0" step="0.01"
          value="${safeNumber(item.unit_price)}"
          data-cart-price="${index}">
      </td>
      <td>
        <input class="field mini-field" type="number" min="1" max="${item.stock}" step="1"
          value="${item.quantity}"
          data-cart-qty="${index}">
      </td>
      <td>
        <input class="field mini-field" type="number" min="0" step="0.01"
          value="${safeNumber(item.discount)}"
          data-cart-discount="${index}">
      </td>
      <td><b>${money(Math.max((safeNumber(item.unit_price)*safeNumber(item.quantity))-safeNumber(item.discount),0))}</b></td>
      <td><button type="button" class="btn small danger" data-cart-remove="${index}">×</button></td>
    </tr>
  `).join(''):'<tr><td colspan="7" class="muted">Agrega al menos un producto.</td></tr>';

  updateSaleTotals();
}

function addProductToSale(product){
  const stock=safeNumber(product.quantity);
  if(stock<=0)return toast('Este producto no tiene existencia.');

  const existing=saleCart.find(x=>x.product_id===product.id);
  if(existing){
    if(existing.quantity>=stock)return toast('No hay más unidades disponibles.');
    existing.quantity++;
  }else{
    saleCart.push({
      product_id:product.id,
      name:product.name,
      sku:product.sku||'',
      stock,
      unit_price:safeNumber(product.sale_price),
      quantity:1,
      discount:0
    });
  }

  renderSaleCart();
  $('#saleProductSearch').value='';
  renderSaleSearchResults('');
}

function renderSaleSearchResults(query){
  const box=$('#saleSearchResults');
  if(!box)return;

  const q=(query||'').trim().toLowerCase();
  if(!q){
    box.innerHTML='<div class="muted">Escribe para buscar un producto.</div>';
    return;
  }

  const results=state.items.filter(product=>{
    const haystack=[
      product.name,
      product.sku,
      product.barcode,
      product.fcc_id,
      product.oem_number,
      product.serial_number,
      product.brand
    ].join(' ').toLowerCase();
    return haystack.includes(q);
  }).slice(0,10);

  box.innerHTML=results.length?results.map(product=>`
    <button type="button" class="pos-result" data-sale-add="${product.id}">
      <div>
        <b>${esc(product.name)}</b>
        <div class="muted">
          SKU ${esc(product.sku||'—')} · Stock ${safeNumber(product.quantity)} · ${money(product.sale_price)}
        </div>
      </div>
      <span class="btn small">Agregar</span>
    </button>
  `).join(''):'<div class="muted">No se encontraron productos.</div>';
}

function openSaleDialog(){
  saleCart=[];
  $('#saleForm').reset();
  $('#saleStatus').value='Completada';
  $('#salePayment').value='Efectivo';
  $('#saleDiscount').value='0';
  $('#saleTax').value='0';
  $('#saleError').textContent='';
  renderSaleCart();
  renderSaleSearchResults('');
  $('#saleDialog').showModal();
  setTimeout(()=>$('#saleProductSearch').focus(),100);
}


function shortSaleId(id){
  return String(id||'').slice(0,8).toUpperCase();
}

function statusClass(status){
  const s=String(status||'').toLowerCase();
  if(s==='completada')return 'sale-status completed';
  if(s==='cancelada')return 'sale-status cancelled';
  if(s==='cotización')return 'sale-status quote';
  return 'sale-status pending';
}

function openSaleDetail(sale){
  if(!sale)return;

  const items=sale.sale_items||[];
  const linesSubtotal=items.reduce((n,x)=>n+safeNumber(x.subtotal),0);

  $('#saleDetailTitle').textContent=`Venta ${shortSaleId(sale.id)}`;
  $('#saleDetailMeta').textContent=
    `${new Date(sale.created_at).toLocaleString()} · ${sale.customers?.name||'Venta general'}`;

  $('#saleDetailBody').innerHTML=`
    <div class="sale-detail-grid">
      <section>
        <div class="table">
          <table class="sale-detail-table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>SKU</th>
                <th>Cant.</th>
                <th>Precio</th>
                <th>Desc.</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${items.length?items.map(item=>`
                <tr>
                  <td><b>${esc(item.product_name||'Producto')}</b></td>
                  <td>${esc(item.sku||'—')}</td>
                  <td>${safeNumber(item.quantity)}</td>
                  <td>${money(item.unit_price)}</td>
                  <td>${money(item.discount)}</td>
                  <td><b>${money(item.subtotal)}</b></td>
                </tr>
              `).join(''):'<tr><td colspan="6" class="muted">Esta venta no tiene partidas disponibles.</td></tr>'}
            </tbody>
          </table>
        </div>
      </section>
      <aside class="sale-detail-summary">
        <div><span>Cliente</span><b>${esc(sale.customers?.name||'Venta general')}</b></div>
        <div><span>Estado</span><b>${esc(sale.status||'—')}</b></div>
        <div><span>Método</span><b>${esc(sale.payment_method||'—')}</b></div>
        <div><span>Partidas</span><b>${items.length}</b></div>
        <div><span>Unidades</span><b>${items.reduce((n,x)=>n+safeNumber(x.quantity),0)}</b></div>
        <div><span>Subtotal partidas</span><b>${money(linesSubtotal)}</b></div>
        <div class="sale-detail-total"><span>TOTAL</span><b>${money(sale.total)}</b></div>
        ${sale.notes?`<div class="sale-detail-notes"><span>Notas</span><p>${esc(sale.notes)}</p></div>`:''}
      </aside>
    </div>`;

  $('#saleDetailDialog').showModal();
}

function printSaleDetail(){
  const title=$('#saleDetailTitle').textContent;
  const meta=$('#saleDetailMeta').textContent;
  const body=$('#saleDetailBody').innerHTML;
  const win=window.open('','_blank','width=800,height=700');

  if(!win)return toast('El navegador bloqueó la ventana de impresión.');

  win.document.write(`<!doctype html>
    <html><head><meta charset="utf-8"><title>${esc(title)}</title>
    <style>
      body{font-family:Arial,sans-serif;padding:24px;color:#111}
      h1{font-size:22px;margin:0 0 6px}
      .muted{color:#666}.sale-detail-grid{display:block}
      table{width:100%;border-collapse:collapse;margin-top:18px}
      th,td{border-bottom:1px solid #ddd;padding:8px;text-align:left}
      .sale-detail-summary{margin-top:20px}
      .sale-detail-summary>div{display:flex;justify-content:space-between;padding:6px 0}
      .sale-detail-total{font-size:20px;font-weight:bold;border-top:2px solid #111;margin-top:8px;padding-top:10px!important}
      button{display:none}
    </style></head><body>
    <h1>${esc(title)}</h1><div class="muted">${esc(meta)}</div>${body}
    </body></html>`);
  win.document.close();
  win.focus();
  setTimeout(()=>win.print(),250);
}


export function renderOperational(){
  $('#purchaseSupplier').innerHTML=
    '<option value="">Selecciona proveedor</option>'+
    state.suppliers.map(x=>`<option value="${x.id}">${esc(x.name)}</option>`).join('');

  $('#saleCustomer').innerHTML=
    '<option value="">Venta general</option>'+
    state.customers.map(x=>`<option value="${x.id}">${esc(x.name)}</option>`).join('');

  $('#customersBody').innerHTML=state.customers.length
    ?state.customers.map(x=>`
      <div class="history-item">
        <b>${esc(x.name)}</b>${x.company?` · ${esc(x.company)}`:''}
        <div class="muted">${esc(x.phone||'')} ${esc(x.email||'')}</div>
      </div>`).join('')
    :'<div class="muted">No hay clientes.</div>';

  $('#suppliersBody').innerHTML=state.suppliers.length
    ?state.suppliers.map(x=>`
      <div class="history-item">
        <b>${esc(x.name)}</b>
        <div class="muted">${esc(x.contact_name||'')} ${esc(x.phone||'')}</div>
      </div>`).join('')
    :'<div class="muted">No hay proveedores.</div>';

  $('#purchasesBody').innerHTML=state.purchases.length
    ?state.purchases.map(x=>`
      <div class="history-item">
        <b>${esc(x.suppliers?.name||'Proveedor')}</b> · ${money(x.total)}
        <div class="muted">${esc(x.status||'')}</div>
      </div>`).join('')
    :'<div class="muted">No hay compras.</div>';

  $('#salesBody').innerHTML=state.sales.length
    ?state.sales.map(sale=>{
      const items=sale.sale_items||[];
      const units=items.reduce((n,x)=>n+safeNumber(x.quantity),0);
      return `<article class="sale-card" data-sale-id="${sale.id}">
        <div class="sale-card-main">
          <div class="sale-card-title">
            <b>Venta ${shortSaleId(sale.id)}</b>
            <span class="${statusClass(sale.status)}">${esc(sale.status||'—')}</span>
          </div>
          <div class="muted">
            ${new Date(sale.created_at).toLocaleString()} ·
            ${esc(sale.customers?.name||'Venta general')} ·
            ${esc(sale.payment_method||'Sin método')}
          </div>
          <div class="muted">${items.length} partida${items.length===1?'':'s'} · ${units} unidad${units===1?'':'es'}</div>
        </div>
        <div class="sale-card-total">
          <strong>${money(sale.total)}</strong>
          <button type="button" class="btn small" data-sale-view="${sale.id}">Ver detalle</button>
        </div>
      </article>`;
    }).join('')
    :'<div class="muted">No hay ventas.</div>';
}

export function initOperations({reload,switchView}){
  const open=id=>$(id).showModal();

  $('#newCustomer').onclick=()=>open('#customerDialog');
  $('#newSupplier').onclick=()=>open('#supplierDialog');

  $('#newPurchase').onclick=()=>{
    if(!state.suppliers.length){
      toast('Primero crea un proveedor');
      switchView('suppliers');
      return;
    }
    open('#purchaseDialog');
  };

  $('#newSale').onclick=openSaleDialog;

  [
    ['customerX','customerCancel','customerDialog'],
    ['supplierX','supplierCancel','supplierDialog'],
    ['purchaseX','purchaseCancel','purchaseDialog']
  ].forEach(([x,c,d])=>{
    $('#'+x).onclick=$('#'+c).onclick=()=>$('#'+d).close();
  });

  $('#saleX').onclick=$('#saleCancel').onclick=()=>$('#saleDialog').close();

  $('#saleDetailX').onclick=$('#saleDetailClose').onclick=()=>$('#saleDetailDialog').close();
  $('#salePrint').onclick=printSaleDetail;

  $('#salesBody').addEventListener('click',event=>{
    const button=event.target.closest('[data-sale-view]');
    if(!button)return;
    const sale=state.sales.find(x=>x.id===button.dataset.saleView);
    openSaleDetail(sale);
  });

  // Búsqueda POS
  $('#saleProductSearch').addEventListener('input',event=>{
    renderSaleSearchResults(event.target.value);
  });

  // Si un escáner USB/Bluetooth escribe un SKU/código exacto y manda Enter,
  // se agrega directamente sin usar el mouse.
  $('#saleProductSearch').addEventListener('keydown',event=>{
    if(event.key!=='Enter')return;
    event.preventDefault();

    const q=event.target.value.trim().toLowerCase();
    if(!q)return;

    const product=state.items.find(x=>[
      x.sku,x.barcode,x.fcc_id,x.oem_number,x.serial_number
    ].some(v=>String(v||'').trim().toLowerCase()===q));

    if(product){
      addProductToSale(product);
    }else{
      renderSaleSearchResults(q);
    }
  });

  $('#saleSearchResults').addEventListener('click',event=>{
    const button=event.target.closest('[data-sale-add]');
    if(!button)return;
    const product=state.items.find(x=>x.id===button.dataset.saleAdd);
    if(product)addProductToSale(product);
  });

  // Carrito
  $('#saleCartBody').addEventListener('input',event=>{
    let index;

    if(event.target.matches('[data-cart-price]')){
      index=Number(event.target.dataset.cartPrice);
      saleCart[index].unit_price=Math.max(safeNumber(event.target.value),0);
    }

    if(event.target.matches('[data-cart-qty]')){
      index=Number(event.target.dataset.cartQty);
      const max=saleCart[index].stock;
      let qty=Math.max(Math.floor(safeNumber(event.target.value)),1);
      qty=Math.min(qty,max);
      saleCart[index].quantity=qty;
      event.target.value=qty;
    }

    if(event.target.matches('[data-cart-discount]')){
      index=Number(event.target.dataset.cartDiscount);
      saleCart[index].discount=Math.max(safeNumber(event.target.value),0);
    }

    renderSaleCart();
  });

  $('#saleCartBody').addEventListener('click',event=>{
    const button=event.target.closest('[data-cart-remove]');
    if(!button)return;
    saleCart.splice(Number(button.dataset.cartRemove),1);
    renderSaleCart();
  });

  $('#saleDiscount').addEventListener('input',updateSaleTotals);
  $('#saleTax').addEventListener('input',updateSaleTotals);

  // Clientes
  $('#customerForm').onsubmit=async event=>{
    event.preventDefault();
    if(!val('#customerName'))return toast('Escribe el nombre del cliente');

    const result=await sb.from('customers').insert({
      company_id:state.companyId,
      name:val('#customerName'),
      phone:val('#customerPhone')||null,
      email:val('#customerEmail')||null,
      company:val('#customerCompany')||null,
      notes:val('#customerNotes')||null,
      created_by:state.session.user.id
    });

    if(result.error)return toast(result.error.message);
    $('#customerDialog').close();
    event.target.reset();
    toast('Cliente guardado');
    await reload();
  };

  // Proveedores
  $('#supplierForm').onsubmit=async event=>{
    event.preventDefault();
    if(!val('#supplierName'))return toast('Escribe el nombre del proveedor');

    const result=await sb.from('suppliers').insert({
      company_id:state.companyId,
      name:val('#supplierName'),
      contact_name:val('#supplierContact')||null,
      phone:val('#supplierPhone')||null,
      email:val('#supplierEmail')||null,
      website:val('#supplierWebsite')||null,
      notes:val('#supplierNotes')||null
    });

    if(result.error)return toast(result.error.message);
    $('#supplierDialog').close();
    event.target.reset();
    toast('Proveedor guardado');
    await reload();
  };

  // Compras (se mantiene el módulo actual)
  $('#purchaseForm').onsubmit=async event=>{
    event.preventDefault();

    if(!$('#purchaseSupplier').value)return toast('Selecciona un proveedor');

    const result=await sb.from('purchase_orders').insert({
      company_id:state.companyId,
      supplier_id:$('#purchaseSupplier').value,
      status:$('#purchaseStatus').value,
      expected_date:$('#purchaseExpected').value||null,
      total:safeNumber($('#purchaseTotal').value),
      notes:val('#purchaseNotes')||null,
      created_by:state.session.user.id
    });

    if(result.error)return toast(result.error.message);
    $('#purchaseDialog').close();
    event.target.reset();
    toast('Compra guardada');
    await reload();
  };

  // POS / Venta
  $('#saleForm').onsubmit=async event=>{
    event.preventDefault();

    const errorBox=$('#saleError');
    errorBox.textContent='';

    if(!saleCart.length){
      errorBox.textContent='Agrega al menos un producto.';
      return;
    }

    const button=$('#saleSave');
    button.disabled=true;
    button.textContent='Guardando…';

    try{
      const payload=saleCart.map(item=>({
        product_id:item.product_id,
        quantity:item.quantity,
        unit_price:item.unit_price,
        discount:item.discount
      }));

      const result=await sb.rpc('create_inventory_sale',{
        p_company_id:state.companyId,
        p_customer_id:$('#saleCustomer').value||null,
        p_status:$('#saleStatus').value,
        p_payment_method:$('#salePayment').value||null,
        p_notes:val('#saleNotes')||null,
        p_discount:safeNumber($('#saleDiscount').value),
        p_tax:safeNumber($('#saleTax').value),
        p_items:payload
      });

      if(result.error)throw result.error;

      $('#saleDialog').close();
      saleCart=[];
      toast('Venta guardada e inventario actualizado');
      await reload();
      switchView('sales');

    }catch(error){
      console.error('Venta POS:',error);

      if(String(error.message||'').includes('create_inventory_sale')){
        errorBox.textContent='Primero ejecuta pos-v4-4.sql en Supabase.';
      }else{
        errorBox.textContent=error.message||'No se pudo guardar la venta.';
      }
    }finally{
      button.disabled=false;
      button.textContent='Guardar venta';
    }
  };
}
