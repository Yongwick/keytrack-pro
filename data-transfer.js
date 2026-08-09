import {$,state,sb,esc,toast,downloadText} from './core.js';

let parsedRows=[];

const CATEGORIES=['Llave','Control','Máquina','Herramienta','Accesorio','Otro'];
const CONDITIONS=['Nuevo','Reconstruido','Usado'];

function normalizeHeader(value){
  return String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .toLowerCase().replace(/[^a-z0-9]/g,'');
}
const HEADER_MAP={
  nombre:'name',nombreproducto:'name',categoria:'category',marca:'brand',sku:'sku',
  oem:'oem_number',oempartnumber:'oem_number',partnumber:'oem_number',
  serie:'serial_number',numeroserie:'serial_number',ubicacion:'location_name',
  cantidad:'quantity',minimo:'minimum_quantity',inventariominimo:'minimum_quantity',
  codigodebarras:'barcode',codigo:'barcode',fccid:'fcc_id',fcc:'fcc_id',
  ic:'ic_number',icnumber:'ic_number',frecuencia:'frequency',chip:'chip_type',
  tipodechip:'chip_type',botones:'button_count',bateria:'battery_type',
  estado:'condition_status',proveedor:'supplier',costo:'cost',precio:'sale_price',
  precioventa:'sale_price',compatibilidadvehicular:'vehicle_compatibility',
  vehiculo:'vehicle_compatibility',equivalencias:'equivalences',notas:'notes',
  urlimagen:'image_url',imagenurl:'image_url'
};
function cleanString(v){return String(v??'').trim()}
function num(v){
  if(v===''||v===null||v===undefined)return 0;
  const n=Number(String(v).replace(/[$,\s]/g,''));
  return Number.isFinite(n)?n:NaN;
}
function int(v){const n=num(v);return Number.isFinite(n)?Math.floor(n):NaN}

async function parseFile(file){
  if(!globalThis.XLSX)throw new Error('No se pudo cargar el lector de Excel. Verifica tu conexión.');
  const buffer=await file.arrayBuffer();
  const wb=globalThis.XLSX.read(buffer);
  const name=wb.SheetNames[0];
  if(!name)throw new Error('El archivo no contiene hojas.');
  return globalThis.XLSX.utils.sheet_to_json(wb.Sheets[name],{defval:'',raw:false});
}
function mapRow(raw,rowNumber){
  const result={_row:rowNumber};
  for(const [header,value] of Object.entries(raw)){
    const field=HEADER_MAP[normalizeHeader(header)];
    if(field)result[field]=value;
  }
  return result;
}
function locationByName(name){
  const q=cleanString(name).toLowerCase();
  if(!q)return null;
  return state.locations.find(x=>cleanString(x.name).toLowerCase()===q)||null;
}

function analyze(rawRows){
  const existingSku=new Map(state.items.filter(x=>cleanString(x.sku))
    .map(x=>[cleanString(x.sku).toLowerCase(),x]));
  const fileSkuCount=new Map();
  rawRows.forEach(r=>{
    const s=cleanString(r.sku).toLowerCase();
    if(s)fileSkuCount.set(s,(fileSkuCount.get(s)||0)+1);
  });

  return rawRows.map((r,index)=>{
    const errors=[],warnings=[];
    const name=cleanString(r.name),sku=cleanString(r.sku);
    const quantity=int(r.quantity),minimum=int(r.minimum_quantity);
    const buttons=(r.button_count===''||r.button_count===undefined)?null:int(r.button_count);
    const cost=num(r.cost),price=num(r.sale_price);
    let category=cleanString(r.category)||'Otro';
    let condition=cleanString(r.condition_status)||'Nuevo';

    if(!name)errors.push('Falta Nombre');
    if(!Number.isFinite(quantity)||quantity<0)errors.push('Cantidad inválida');
    if(!Number.isFinite(minimum)||minimum<0)errors.push('Mínimo inválido');
    if(buttons!==null&&(!Number.isFinite(buttons)||buttons<0))errors.push('Botones inválidos');
    if(!Number.isFinite(cost)||cost<0)errors.push('Costo inválido');
    if(!Number.isFinite(price)||price<0)errors.push('Precio inválido');

    if(!CATEGORIES.includes(category)){warnings.push(`Categoría "${category}" → Otro`);category='Otro'}
    if(!CONDITIONS.includes(condition)){warnings.push(`Estado "${condition}" → Nuevo`);condition='Nuevo'}
    if(sku&&fileSkuCount.get(sku.toLowerCase())>1)errors.push('SKU repetido dentro del archivo');

    const location=locationByName(r.location_name);
    if(cleanString(r.location_name)&&!location)warnings.push('Ubicación no encontrada; quedará sin ubicación');

    return {
      rowNumber:index+2,raw:r,name,sku:sku||null,category,condition_status:condition,
      quantity:Number.isFinite(quantity)?quantity:0,
      minimum_quantity:Number.isFinite(minimum)?minimum:0,
      button_count:buttons===null?null:(Number.isFinite(buttons)?buttons:null),
      cost:Number.isFinite(cost)?cost:0,sale_price:Number.isFinite(price)?price:0,
      location,existing:sku?existingSku.get(sku.toLowerCase())||null:null,
      errors,warnings,action:''
    };
  });
}
function determineAction(item,strategy){
  if(item.errors.length)return 'error';
  if(item.existing)return strategy==='update'?'update':'skip';
  return 'insert';
}
function badge(action){
  return action==='insert'?'<span class="import-status new">Nuevo</span>':
    action==='update'?'<span class="import-status update">Actualizar</span>':
    action==='skip'?'<span class="import-status skip">Omitir</span>':
    '<span class="import-status error">Error</span>';
}
function renderPreview(){
  const strategy=$('#importStrategy').value;
  parsedRows.forEach(x=>x.action=determineAction(x,strategy));
  const t={
    insert:parsedRows.filter(x=>x.action==='insert').length,
    update:parsedRows.filter(x=>x.action==='update').length,
    skip:parsedRows.filter(x=>x.action==='skip').length,
    error:parsedRows.filter(x=>x.action==='error').length,
    warning:parsedRows.filter(x=>x.warnings.length).length
  };
  $('#importSummary').classList.remove('hidden');
  $('#importSummary').innerHTML=`
    <div><b>${parsedRows.length}</b><span>filas</span></div>
    <div class="good"><b>${t.insert}</b><span>nuevos</span></div>
    <div class="update"><b>${t.update}</b><span>actualizar</span></div>
    <div><b>${t.skip}</b><span>omitir</span></div>
    <div class="${t.error?'bad':''}"><b>${t.error}</b><span>errores</span></div>
    <div class="${t.warning?'warn':''}"><b>${t.warning}</b><span>avisos</span></div>`;
  $('#importPreviewWrap').classList.remove('hidden');
  $('#importPreviewCount').textContent=`Mostrando ${Math.min(parsedRows.length,100)} de ${parsedRows.length}`;
  $('#importPreviewBody').innerHTML=parsedRows.slice(0,100).map(item=>{
    const obs=[...item.errors,...item.warnings];
    return `<tr><td>${item.rowNumber}</td><td><b>${esc(item.name||'—')}</b></td>
      <td>${esc(item.sku||'—')}</td><td>${item.quantity}</td>
      <td>${esc(item.location?.name||cleanString(item.raw.location_name)||'—')}</td>
      <td>${badge(item.action)}</td><td>${obs.length?esc(obs.join(' · ')):'✓'}</td></tr>`;
  }).join('');
  $('#importProductsConfirm').classList.toggle('hidden',!((t.insert+t.update)>0&&t.error===0));
}
function payload(item){
  const r=item.raw;
  return {
    name:item.name,category:item.category,quantity:item.quantity,brand:cleanString(r.brand)||null,
    sku:item.sku,oem_number:cleanString(r.oem_number)||null,
    serial_number:cleanString(r.serial_number)||null,location_id:item.location?.id||null,
    minimum_quantity:item.minimum_quantity,barcode:cleanString(r.barcode)||null,
    fcc_id:cleanString(r.fcc_id)||null,ic_number:cleanString(r.ic_number)||null,
    frequency:cleanString(r.frequency)||null,chip_type:cleanString(r.chip_type)||null,
    button_count:item.button_count,battery_type:cleanString(r.battery_type)||null,
    condition_status:item.condition_status,supplier:cleanString(r.supplier)||null,
    cost:item.cost,sale_price:item.sale_price,
    vehicle_compatibility:cleanString(r.vehicle_compatibility)||null,
    equivalences:cleanString(r.equivalences)||null,notes:cleanString(r.notes)||null,
    image_url:cleanString(r.image_url)||null
  };
}
function exportCsv(){
  const cols=['Nombre','Categoría','Marca','SKU','OEM','Serie','Ubicación','Cantidad','Mínimo',
    'Código','FCC ID','IC','Frecuencia','Chip','Botones','Batería','Estado','Proveedor',
    'Costo','Precio','Compatibilidad vehicular','Equivalencias','Notas','URL imagen'];
  const rows=state.items.map(x=>[x.name,x.category,x.brand,x.sku,x.oem_number,x.serial_number,
    x.locations?.name||'',x.quantity,x.minimum_quantity,x.barcode,x.fcc_id,x.ic_number,
    x.frequency,x.chip_type,x.button_count,x.battery_type,x.condition_status,x.supplier,
    x.cost,x.sale_price,x.vehicle_compatibility,x.equivalences,x.notes,x.image_url]);
  const csv=[cols,...rows].map(r=>r.map(v=>`"${String(v??'').replaceAll('"','""')}"`).join(',')).join('\n');
  downloadText('keytrack-inventario.csv','\ufeff'+csv,'text/csv;charset=utf-8');
}
function reset(){
  parsedRows=[];$('#productImportFile').value='';$('#importFileName').textContent='Ningún archivo seleccionado.';
  $('#importError').textContent='';$('#importOptions').classList.add('hidden');
  $('#importSummary').classList.add('hidden');$('#importPreviewWrap').classList.add('hidden');
  $('#importProductsConfirm').classList.add('hidden');
}

export function initDataTransfer({reload}){
  $('#csv').onclick=()=>{reset();$('#dataTransferDialog').showModal()};
  $('#dataTransferX').onclick=$('#dataTransferClose').onclick=()=>$('#dataTransferDialog').close();
  $('#exportInventoryCsv').onclick=exportCsv;
  $('#importStrategy').onchange=()=>{if(parsedRows.length)renderPreview()};

  $('#productImportFile').onchange=async event=>{
    const file=event.target.files?.[0];if(!file)return;
    $('#importError').textContent='';$('#importFileName').textContent=file.name;
    try{
      const raw=await parseFile(file);
      if(!raw.length)throw new Error('El archivo no contiene filas de productos.');
      parsedRows=analyze(raw.map((row,index)=>mapRow(row,index+2)));
      if(!parsedRows.some(x=>x.name))throw new Error('No encontré la columna "Nombre *". Usa la plantilla de KeyTrack Pro.');
      $('#importOptions').classList.remove('hidden');
      renderPreview();
    }catch(error){
      console.error('Importar Excel:',error);parsedRows=[];
      $('#importError').textContent=error.message||'No se pudo leer el archivo.';
      $('#importProductsConfirm').classList.add('hidden');
    }
  };

  $('#importProductsConfirm').onclick=async()=>{
    const strategy=$('#importStrategy').value;
    parsedRows.forEach(x=>x.action=determineAction(x,strategy));
    if(parsedRows.some(x=>x.action==='error'))return toast('Corrige los errores antes de importar.');
    const rows=parsedRows.filter(x=>x.action==='insert'||x.action==='update');
    if(!rows.length)return toast('No hay productos para importar.');

    const button=$('#importProductsConfirm');
    button.disabled=true;button.textContent=`Importando 0 / ${rows.length}…`;
    let done=0,failed=0;

    try{
      for(const item of rows){
        try{
          const p=payload(item);
          const result=item.action==='update'&&item.existing
            ? await sb.from('products').update(p).eq('id',item.existing.id).eq('company_id',state.companyId)
            : await sb.from('products').insert({...p,company_id:state.companyId,created_by:state.session.user.id});
          if(result.error)throw result.error;
          done++;
        }catch(error){
          failed++;item.errors.push(error.message||'Error al guardar');item.action='error';
          console.error(`Importación fila ${item.rowNumber}:`,error);
        }
        button.textContent=`Importando ${done+failed} / ${rows.length}…`;
      }
      await reload();renderPreview();
      if(failed){
        toast(`${done} importados · ${failed} con error`);
        $('#importError').textContent=`Se importaron ${done}. ${failed} filas no pudieron guardarse.`;
      }else{
        toast(`${done} productos importados correctamente`);
      }
    }finally{
      button.disabled=false;button.textContent='Importar productos';
    }
  };
}
