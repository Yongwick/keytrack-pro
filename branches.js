
import {$,state,sb,val,esc,toast} from './core.js';

function descendants(root){
  const out=[];const walk=id=>state.locations.filter(x=>x.parent_id===id).forEach(x=>{out.push(x.id);walk(x.id)});walk(root);return out;
}
function icon(t){return({branch:'🏢',warehouse:'📦',showroom:'🏪',shelf:'🗄️',safe:'🔐',vehicle:'🚐'})[t]||'📍'}
function tree(nodes,map,level=0){
  return nodes.map(n=>`<div class="tree-item" style="margin-left:${level*12}px"><div><b>${icon(n.location_type)} ${esc(n.name)}</b><div class="muted">${esc(n.code||n.location_type||'Ubicación')}</div></div><div class="row"><button class="btn small" data-loc-edit="${n.id}">Editar</button><button class="btn small danger" data-loc-del="${n.id}">Eliminar</button></div></div>${(map.get(n.id)||[]).length?tree(map.get(n.id),map,level+1):''}`).join('');
}
export function renderBranches(){
  const roots=state.locations.filter(x=>!x.parent_id),map=new Map();
  state.locations.filter(x=>x.parent_id).forEach(x=>{if(!map.has(x.parent_id))map.set(x.parent_id,[]);map.get(x.parent_id).push(x)});
  $('#branchesBody').innerHTML=roots.length?roots.map(b=>`<article class="branch-card"><div class="row"><h3>🏢 ${esc(b.name)}</h3><span class="muted">${b.is_active===false?'Inactiva':'Activa'}</span></div><div class="branch-meta"><div>📍 ${esc([b.address,b.city,b.state].filter(Boolean).join(', ')||'Sin dirección')}</div><div>👤 ${esc(b.manager_name||'Sin responsable')}</div></div><div class="branch-actions"><button class="btn small" data-loc-edit="${b.id}">Editar</button><button class="btn small" data-loc-add="${b.id}">+ Ubicación</button><button class="btn small danger" data-loc-del="${b.id}">Eliminar</button></div><div class="branch-tree">${tree(map.get(b.id)||[],map)}</div></article>`).join(''):'<div class="empty-state">No hay sucursales.</div>';
}
function parents(selected=''){
  $('#branchParent').innerHTML='<option value="">Selecciona sucursal</option>'+state.locations.filter(x=>!x.parent_id).map(x=>`<option value="${x.id}">${esc(x.name)}</option>`).join('');
  $('#branchParent').value=selected;
}
function open(x=null,parent=''){
  $('#branchForm').reset();$('#branchId').value=x?.id||'';
  const isChild=Boolean(x?.parent_id||parent);
  $('#branchDialogTitle').textContent=x?(isChild?'Editar ubicación':'Editar sucursal'):(isChild?'Nueva ubicación':'Nueva sucursal');
  $('#branchMode').value=isChild?'location':'branch';$('#parentBranchBox').classList.toggle('hidden',!isChild);parents(x?.parent_id||parent);
  $('#branchType').disabled=!isChild;$('#branchType').value=x?.location_type||(isChild?'warehouse':'branch');
  const map={branchName:'name',branchCode:'code',branchAddress:'address',branchCity:'city',branchState:'state',branchCountry:'country',branchZip:'postal_code',branchPhone:'phone',branchEmail:'email',branchManager:'manager_name',branchHours:'business_hours'};
  Object.entries(map).forEach(([id,key])=>$('#'+id).value=x?.[key]||'');
  $('#branchActive').value=String(x?.is_active!==false);$('#branchDialog').showModal();
}
export function initBranches({reload}){
  $('#newBranch').onclick=()=>open();$('#newLocation').onclick=()=>open(null,'');
  $('#branchX').onclick=$('#branchCancel').onclick=()=>$('#branchDialog').close();
  $('#branchesBody').addEventListener('click',async e=>{
    const edit=e.target.closest('[data-loc-edit]'),add=e.target.closest('[data-loc-add]'),del=e.target.closest('[data-loc-del]');
    if(edit)open(state.locations.find(x=>x.id===edit.dataset.locEdit));
    if(add)open(null,add.dataset.locAdd);
    if(del){
      const id=del.dataset.locDel,x=state.locations.find(a=>a.id===id);if(!x||!confirm(`¿Eliminar "${x.name}"?`))return;
      const ids=[id,...descendants(id)];
      await sb.from('products').update({location_id:null}).in('location_id',ids).eq('company_id',state.companyId);
      const r=await sb.from('locations').delete().in('id',ids).eq('company_id',state.companyId);
      if(r.error)return toast(r.error.message);toast('Ubicación eliminada');await reload();
    }
  });
  $('#branchForm').onsubmit=async e=>{
    e.preventDefault();const id=val('#branchId'),child=$('#branchMode').value==='location';
    if(child&&!$('#branchParent').value)return toast('Selecciona la sucursal');
    const payload={company_id:state.companyId,name:val('#branchName'),code:val('#branchCode')||null,parent_id:child?$('#branchParent').value:null,location_type:child?$('#branchType').value:'branch',address:val('#branchAddress')||null,city:val('#branchCity')||null,state:val('#branchState')||null,country:val('#branchCountry')||null,postal_code:val('#branchZip')||null,phone:val('#branchPhone')||null,email:val('#branchEmail')||null,manager_name:val('#branchManager')||null,business_hours:val('#branchHours')||null,is_active:$('#branchActive').value==='true',created_by:state.session.user.id};
    const r=id?await sb.from('locations').update(payload).eq('id',id).eq('company_id',state.companyId):await sb.from('locations').insert(payload);
    if(r.error)return toast(r.error.message);$('#branchDialog').close();toast('Guardado');await reload();
  };
}
