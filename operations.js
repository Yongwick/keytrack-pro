
import {$,state,sb,val,esc,toast,safeNumber} from './core.js';

export function renderOperational(){
  $('#purchaseSupplier').innerHTML='<option value="">Selecciona proveedor</option>'+state.suppliers.map(x=>`<option value="${x.id}">${esc(x.name)}</option>`).join('');
  $('#saleCustomer').innerHTML='<option value="">Venta general</option>'+state.customers.map(x=>`<option value="${x.id}">${esc(x.name)}</option>`).join('');
  $('#customersBody').innerHTML=state.customers.length?state.customers.map(x=>`<div class="history-item"><b>${esc(x.name)}</b>${x.company?` · ${esc(x.company)}`:''}<div class="muted">${esc(x.phone||'')} ${esc(x.email||'')}</div></div>`).join(''):'<div class="muted">No hay clientes.</div>';
  $('#suppliersBody').innerHTML=state.suppliers.length?state.suppliers.map(x=>`<div class="history-item"><b>${esc(x.name)}</b><div class="muted">${esc(x.contact_name||'')} ${esc(x.phone||'')}</div></div>`).join(''):'<div class="muted">No hay proveedores.</div>';
  $('#purchasesBody').innerHTML=state.purchases.length?state.purchases.map(x=>`<div class="history-item"><b>${esc(x.suppliers?.name||'Proveedor')}</b> · $${safeNumber(x.total).toFixed(2)}<div class="muted">${esc(x.status||'')}</div></div>`).join(''):'<div class="muted">No hay compras.</div>';
  $('#salesBody').innerHTML=state.sales.length?state.sales.map(x=>`<div class="history-item"><b>${esc(x.customers?.name||'Venta general')}</b> · $${safeNumber(x.total).toFixed(2)}<div class="muted">${esc(x.status||'')}</div></div>`).join(''):'<div class="muted">No hay ventas.</div>';
}

export function initOperations({reload,switchView}){
  const open=id=>$(id).showModal();
  $('#newCustomer').onclick=()=>open('#customerDialog');
  $('#newSupplier').onclick=()=>open('#supplierDialog');
  $('#newPurchase').onclick=()=>{if(!state.suppliers.length){toast('Primero crea un proveedor');switchView('suppliers');return}open('#purchaseDialog')};
  $('#newSale').onclick=()=>open('#saleDialog');

  [['customerX','customerCancel','customerDialog'],['supplierX','supplierCancel','supplierDialog'],
   ['purchaseX','purchaseCancel','purchaseDialog'],['saleX','saleCancel','saleDialog']].forEach(([x,c,d])=>{
     $('#'+x).onclick=$('#'+c).onclick=()=>$('#'+d).close();
   });

  $('#customerForm').onsubmit=async e=>{
    e.preventDefault();if(!val('#customerName'))return toast('Escribe el nombre del cliente');
    const r=await sb.from('customers').insert({company_id:state.companyId,name:val('#customerName'),phone:val('#customerPhone')||null,email:val('#customerEmail')||null,company:val('#customerCompany')||null,notes:val('#customerNotes')||null,created_by:state.session.user.id});
    if(r.error)return toast(r.error.message);$('#customerDialog').close();e.target.reset();toast('Cliente guardado');await reload();
  };
  $('#supplierForm').onsubmit=async e=>{
    e.preventDefault();if(!val('#supplierName'))return toast('Escribe el nombre del proveedor');
    const r=await sb.from('suppliers').insert({company_id:state.companyId,name:val('#supplierName'),contact_name:val('#supplierContact')||null,phone:val('#supplierPhone')||null,email:val('#supplierEmail')||null,website:val('#supplierWebsite')||null,notes:val('#supplierNotes')||null});
    if(r.error)return toast(r.error.message);$('#supplierDialog').close();e.target.reset();toast('Proveedor guardado');await reload();
  };
  $('#purchaseForm').onsubmit=async e=>{
    e.preventDefault();if(!$('#purchaseSupplier').value)return toast('Selecciona un proveedor');
    const r=await sb.from('purchase_orders').insert({company_id:state.companyId,supplier_id:$('#purchaseSupplier').value,status:$('#purchaseStatus').value,expected_date:$('#purchaseExpected').value||null,total:safeNumber($('#purchaseTotal').value),notes:val('#purchaseNotes')||null,created_by:state.session.user.id});
    if(r.error)return toast(r.error.message);$('#purchaseDialog').close();e.target.reset();toast('Compra guardada');await reload();
  };
  $('#saleForm').onsubmit=async e=>{
    e.preventDefault();
    const r=await sb.from('sales').insert({company_id:state.companyId,customer_id:$('#saleCustomer').value||null,status:$('#saleStatus').value,total:safeNumber($('#saleTotal').value),payment_method:$('#salePayment').value||null,notes:val('#saleNotes')||null,created_by:state.session.user.id});
    if(r.error)return toast(r.error.message);$('#saleDialog').close();e.target.reset();toast('Venta guardada');await reload();
  };
}
