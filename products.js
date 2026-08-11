
import {$,state,sb,val,esc,toast,safeNumber} from './core.js';
import {renderInventory} from './inventory.js';

function moneyForHistory(v){return '$'+Number(v||0).toFixed(2)}

export function openProduct(product=null){
  state.editingProductId=product?.id||null;
  $('#deleteProductFromEdit')?.classList.toggle('hidden',!product);
  $('#ititle').textContent=product?'Editar artículo':'Nuevo artículo';
  const set=(id,v='')=>{const el=$(id);if(el)el.value=v??''};
  set('#iid',product?.id);set('#oldimg',product?.image_url);set('#iname',product?.name);
  set('#icat',product?.category||'Llave');set('#iq',product?.quantity??1);set('#ibrand',product?.brand);
  set('#isku',product?.sku);set('#ioem',product?.oem_number);set('#iser',product?.serial_number);
  set('#iloc',product?.location_id);set('#imin',product?.minimum_quantity??2);set('#ibar',product?.barcode);
  set('#ifcc',product?.fcc_id);set('#iic',product?.ic_number);set('#ifreq',product?.frequency);
  set('#ichip',product?.chip_type);set('#ibuttons',product?.button_count);set('#ibattery',product?.battery_type);
  set('#icondition',product?.condition_status||'Nuevo');set('#isupplier',product?.supplier);
  set('#icost',product?.cost??0);set('#iprice',product?.sale_price??0);set('#ivehicle',product?.vehicle_compatibility);
  set('#iequiv',product?.equivalences);set('#inotes',product?.notes);
  $('#iphoto').value='';$('#iphotos').value='';$('#idoc').value='';
  if($('#itemError'))$('#itemError').textContent='';
  $('#item').showModal();
}

async function uploadFile(bucket,file){
  if(!file)return null;
  const ext=(file.name.split('.').pop()||'bin').toLowerCase();
  const path=`${state.companyId}/${state.session.user.id}/${crypto.randomUUID()}.${ext}`;
  const up=await sb.storage.from(bucket).upload(path,file,{upsert:false});
  if(up.error)throw up.error;
  return sb.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

export function renderProductDetail(product){
  $('#detailBody').innerHTML=`<div class="detail-grid">
    <div class="card">${product.image_url?`<img src="${esc(product.image_url)}" style="width:100%;max-height:320px;object-fit:contain;border-radius:12px">`:'<div class="muted">Sin fotografía</div>'}</div>
    <div class="card">
      <h2>${esc(product.name)}</h2>
      ${[
        ['Categoría',product.category],['Marca',product.brand],['SKU',product.sku],['OEM',product.oem_number],
        ['FCC ID',product.fcc_id],['IC',product.ic_number],['Frecuencia',product.frequency],['Chip',product.chip_type],
        ['Botones',product.button_count],['Batería',product.battery_type],['Ubicación',product.locations?.name||'Sin ubicación'],
        ['Cantidad',product.quantity],['Costo','$'+safeNumber(product.cost).toFixed(2)],['Precio','$'+safeNumber(product.sale_price).toFixed(2)],
        ['Vehículos',product.vehicle_compatibility],['Equivalencias',product.equivalences],['Notas',product.notes]
      ].map(([k,v])=>`<div class="history-item"><b>${k}:</b> ${esc(v??'—')}</div>`).join('')}
      <div class="row" style="margin-top:12px"><button id="detailEditButton" class="btn primary">Editar producto</button></div>
    </div></div>`;
  $('#detailEditButton').onclick=()=>openProduct(product);
}

export async function openHistory(product){
  $('#htitle').textContent='Historial · '+product.name;
  $('#hbody').innerHTML='<div class="muted">Cargando…</div>';
  $('#history').showModal();
  const r=await sb.from('inventory_movements').select('*').eq('company_id',state.companyId).eq('product_id',product.id).order('created_at',{ascending:false});
  if(r.error){$('#hbody').innerHTML=`<div class="module-error">${esc(r.error.message)}</div>`;return}
  $('#hbody').innerHTML=(r.data||[]).length?(r.data||[]).map(m=>{
    const saleId=String(m.note||'').match(/^Venta\s+([0-9a-f-]{36})$/i)?.[1];
    const sale=saleId?state.sales.find(s=>s.id===saleId):null;
    const item=sale?.sale_items?.find(x=>x.product_id===product.id);

    if(sale){
      return `<div class="history-item movement-history-card">
        <div class="movement-main">
          <b>💰 Venta · -${m.quantity} unidad${Number(m.quantity)===1?'':'es'}</b>
          <span>${moneyForHistory(sale.total)}</span>
        </div>
        <div class="muted">
          ${new Date(m.created_at).toLocaleString()} ·
          Venta ${sale.id.slice(0,8).toUpperCase()} ·
          ${esc(sale.payment_method||'Sin método')}
        </div>
        ${item?`<div class="muted">Precio unitario: ${moneyForHistory(item.unit_price)} · Subtotal: ${moneyForHistory(item.subtotal)}</div>`:''}
      </div>`;
    }

    const label=m.movement_type==='out'?'📤 Salida':m.movement_type==='in'?'📥 Entrada':'🔄 Movimiento';
    return `<div class="history-item">
      <b>${label} · ${m.quantity}</b>
      <div class="muted">${new Date(m.created_at).toLocaleString()} · ${esc(m.note||'Sin referencia')}</div>
    </div>`;
  }).join(''):'<div class="muted">Sin movimientos.</div>';
}

function openMove(product){
  $('#mid').value=product.id;$('#mtitle').textContent='Movimiento · '+product.name;$('#mtype').value='in';$('#mq').value=1;$('#mnote').value='';$('#move').showModal();
}

export function initProducts({reload,switchView}){
  // Bluetooth barcode field: scanners suelen enviar Enter.
  // Evita guardar accidentalmente el formulario al terminar el escaneo.
  setTimeout(()=>{
    $('#ibar')?.addEventListener('keydown',event=>{
      if(event.key==='Enter' || event.key==='Tab'){
        event.preventDefault();
        $('#ifcc')?.focus();
      }
    });
  },0);

  $('#add').onclick=()=>openProduct();
  $('#ix').onclick=$('#icancel').onclick=()=>$('#item').close();
  $('#mx').onclick=$('#mcancel').onclick=()=>$('#move').close();
  $('#hx').onclick=()=>$('#history').close();

  $('#if').onsubmit=async e=>{
    e.preventDefault();
    const btn=$('#itemSave')||e.submitter; if(btn){btn.disabled=true;btn.textContent='Guardando…'}
    const err=$('#itemError'); if(err)err.textContent='';
    try{
      const id=val('#iid'),sku=val('#isku');
      if(!val('#iname'))throw new Error('Escribe el nombre del producto.');
      if(sku){
        let q=sb.from('products').select('id,name').eq('company_id',state.companyId).ilike('sku',sku).limit(1);
        if(id)q=q.neq('id',id);
        const d=await q.maybeSingle(); if(d.error)throw d.error;
        if(d.data)throw new Error(`Ya existe un producto con el SKU "${sku}".`);
      }
      const payload={
        name:val('#iname'),category:$('#icat').value,quantity:safeNumber($('#iq').value),brand:val('#ibrand')||null,
        sku:sku||null,oem_number:val('#ioem')||null,serial_number:val('#iser')||null,location_id:$('#iloc').value||null,
        minimum_quantity:safeNumber($('#imin').value),barcode:val('#ibar')||null,fcc_id:val('#ifcc')||null,ic_number:val('#iic')||null,
        frequency:val('#ifreq')||null,chip_type:val('#ichip')||null,button_count:$('#ibuttons').value?safeNumber($('#ibuttons').value):null,
        battery_type:val('#ibattery')||null,condition_status:$('#icondition').value,supplier:val('#isupplier')||null,
        cost:safeNumber($('#icost').value),sale_price:safeNumber($('#iprice').value),vehicle_compatibility:val('#ivehicle')||null,
        equivalences:val('#iequiv')||null,notes:val('#inotes')||null
      };
      const result=id
        ? await sb.from('products').update(payload).eq('id',id).eq('company_id',state.companyId).select('id').single()
        : await sb.from('products').insert({...payload,company_id:state.companyId,created_by:state.session.user.id}).select('id').single();
      if(result.error)throw result.error;
      const productId=id||result.data.id;

      const main=$('#iphoto').files?.[0];
      if(main){try{const url=await uploadFile('product-images',main);await sb.from('products').update({image_url:url}).eq('id',productId)}catch(x){console.warn(x);toast('Producto guardado; la foto no pudo subirse.')}}
      const doc=$('#idoc').files?.[0];
      if(doc){try{const url=await uploadFile('product-documents',doc);await sb.from('products').update({document_url:url}).eq('id',productId)}catch(x){console.warn(x)}}
      const extras=Array.from($('#iphotos').files||[]);
      if(extras.length){
        const rows=[];
        for(let i=0;i<extras.length;i++){try{rows.push({company_id:state.companyId,product_id:productId,image_url:await uploadFile('product-images',extras[i]),sort_order:i})}catch(x){console.warn(x)}}
        if(rows.length)await sb.from('product_images').insert(rows);
      }
      $('#item').close();toast(id?'Producto actualizado':'Producto guardado');await reload();
    }catch(error){console.error(error);if(err)err.textContent=error.message;toast(error.message)}
    finally{if(btn){btn.disabled=false;btn.textContent='Guardar'}}
  };

  $('#mf').onsubmit=async e=>{
    e.preventDefault();
    const product=state.items.find(x=>x.id===$('#mid').value);
    if(!product)return toast('Producto no encontrado');
    const qty=safeNumber($('#mq').value),type=$('#mtype').value;
    if(qty<=0)return toast('Cantidad inválida');
    const next=type==='out'?safeNumber(product.quantity)-qty:safeNumber(product.quantity)+qty;
    if(next<0)return toast('No hay suficientes unidades');
    const u=await sb.from('products').update({quantity:next}).eq('id',product.id).eq('company_id',state.companyId);
    if(u.error)return toast(u.error.message);
    const m=await sb.from('inventory_movements').insert({company_id:state.companyId,product_id:product.id,movement_type:type,quantity:qty,note:val('#mnote')||null,created_by:state.session.user.id});
    if(m.error)return toast(m.error.message);
    $('#move').close();toast('Movimiento registrado');await reload();
  };

  $('#detailBackInventory')?.addEventListener('click',()=>switchView('inventory'));

  $('#body').addEventListener('click',async e=>{
    const b=e.target.closest('[data-product-action]');if(!b)return;
    const product=state.items.find(x=>x.id===b.dataset.id);if(!product)return;
    const a=b.dataset.productAction;
    if(a==='edit')openProduct(product);
    if(a==='view'){renderProductDetail(product);switchView('detail')}
    if(a==='history')await openHistory(product);
    if(a==='move')openMove(product);
  });

  const productDialog=$('#item');
  const deleteButton=$('#deleteProductFromEdit');
  const deleteDialog=$('#deleteProductDialog');
  const deleteCancel=$('#deleteProductCancel');
  const deleteConfirm=$('#deleteProductConfirm');

  function closeDeleteDialog(){
    if(deleteDialog?.open)deleteDialog.close();
  }

  function populateDeleteDialog(product){
    $('#deleteProductName').textContent=product?.name||'Producto';
    $('#deleteProductSku').textContent=product?.sku||'—';
    $('#deleteProductOem').textContent=product?.oem_number||product?.barcode||'—';

    const thumb=$('#deleteProductThumb');
    if(product?.image_url){
      thumb.innerHTML=`<img src="${esc(product.image_url)}" alt="">`;
    }else{
      thumb.textContent='🔑';
    }
  }

  productDialog?.addEventListener('close',()=>{
    state.editingProductId=null;
    deleteButton?.classList.add('hidden');
    closeDeleteDialog();
  });

  deleteButton?.addEventListener('click',()=>{
    const id=state.editingProductId;
    if(!id)return toast('Este producto todavía no ha sido guardado.');

    const product=state.items.find(x=>x.id===id);
    if(!product)return toast('Producto no encontrado.');

    populateDeleteDialog(product);
    deleteDialog.showModal();
  });

  deleteCancel?.addEventListener('click',closeDeleteDialog);

  deleteDialog?.addEventListener('cancel',event=>{
    event.preventDefault();
    closeDeleteDialog();
  });

  deleteConfirm?.addEventListener('click',async()=>{
    const id=state.editingProductId;
    if(!id)return closeDeleteDialog();

    const product=state.items.find(x=>x.id===id);
    if(!product)return toast('Producto no encontrado.');

    deleteConfirm.disabled=true;
    deleteConfirm.textContent='Eliminando…';

    try{
      const result=await sb.from('products')
        .delete()
        .eq('id',id)
        .eq('company_id',state.companyId);

      if(result.error)throw result.error;

      closeDeleteDialog();
      productDialog?.close();
      state.editingProductId=null;
      toast('Producto eliminado.');
      await reload();
    }catch(error){
      console.error('Eliminar producto:',error);
      toast(error.message||'No se pudo eliminar el producto.');
    }finally{
      deleteConfirm.disabled=false;
      deleteConfirm.textContent='Sí, eliminar producto';
    }
  });

}
