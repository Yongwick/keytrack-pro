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
    ?state.sales.map(x=>`
      <div class="history-item">
        <b>${esc(x.customers?.name||'Venta general')}</b> · ${money(x.total)}
        <div class="muted">${esc(x.status||'')}</div>
      </div>`).join('')
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

  // Búsqueda POS
  $('#saleProductSearch').addEventListener('input',event=>{
    renderSaleSearchResults(event.target.value);
  });

  $('#saleSearchResults').addEventListener('click',event=>{
    const button=event.target.closest('[data-sale-add]');
    if(!button)return;
    const product=state.items.find(x=>x.id===button.dataset.saleAdd);
    if(product)addProductToSale(product);
  });

  // Escáner simple: usa prompt como fallback seguro.
  $('#saleScan').onclick=()=>{
    const code=prompt('Escanea o escribe el código / SKU');
    if(!code)return;
    const q=code.trim().toLowerCase();
    const product=state.items.find(x=>[
      x.barcode,x.sku,x.fcc_id,x.oem_number
    ].some(v=>String(v||'').trim().toLowerCase()===q));

    if(product){
      addProductToSale(product);
    }else{
      $('#saleProductSearch').value=code;
      renderSaleSearchResults(code);
    }
  };

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
