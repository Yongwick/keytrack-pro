
import {$,state,sb,esc,toast,safeNumber} from './core.js';
export async function loadSuperAdmin(){
  if(!state.isPlatformAdmin)return;
  const [c,p]=await Promise.all([sb.from('admin_company_overview').select('*').order('created_at'),sb.from('subscription_plans').select('*').eq('active',true).order('monthly_price')]);
  if(c.error)return toast(c.error.message);if(p.error)return toast(p.error.message);
  state.saCompanies=c.data||[];state.saPlans=p.data||[];renderSuperAdmin();
}
export function renderSuperAdmin(){
  const q=($('#saSearch')?.value||'').toLowerCase(),status=$('#saStatusFilter')?.value||'';
  const rows=state.saCompanies.filter(x=>(!status||x.subscription_status===status)&&(!q||[x.company_name,x.owner_email,x.plan_name].join(' ').toLowerCase().includes(q)));
  $('#saCompanies').textContent=state.saCompanies.length;$('#saActive').textContent=state.saCompanies.filter(x=>x.subscription_status==='active').length;
  $('#saUsers').textContent=state.saCompanies.reduce((n,x)=>n+safeNumber(x.member_count),0);$('#saProducts').textContent=state.saCompanies.reduce((n,x)=>n+safeNumber(x.product_count),0);$('#saCount').textContent=rows.length+' empresas';
  $('#saBody').innerHTML=rows.map(x=>`<tr><td><b>${esc(x.company_name)}</b><div class="muted">${esc(x.owner_email||'')}</div></td><td>${esc(x.plan_name||'Gratis')}</td><td>${esc(x.subscription_status||'active')}</td><td>${safeNumber(x.member_count)}</td><td>${safeNumber(x.product_count)}</td><td>${safeNumber(x.unit_count)}</td><td>${x.created_at?new Date(x.created_at).toLocaleDateString():''}</td><td><button class="btn small" data-sa-edit="${x.company_id}">Administrar</button></td></tr>`).join('');
}
function openAdmin(id){
  const x=state.saCompanies.find(a=>a.company_id===id);if(!x)return;
  $('#cadCompany').textContent=x.company_name;$('#cadCompanyId').value=id;
  $('#cadPlan').innerHTML=state.saPlans.map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join('');
  $('#cadPlan').value=x.plan_id||'';$('#cadStatus').value=x.subscription_status||'active';$('#cadMaxUsers').value=x.max_users||1;$('#cadMaxProducts').value=x.max_products||100;$('#cadNotes').value=x.admin_notes||'';$('#companyAdminDialog').showModal();
}
export function initSuperAdmin(){
  $('#saBody').addEventListener('click',e=>{const b=e.target.closest('[data-sa-edit]');if(b)openAdmin(b.dataset.saEdit)});
  $('#cadX').onclick=$('#cadCancel').onclick=()=>$('#companyAdminDialog').close();
  $('#companyAdminForm').onsubmit=async e=>{
    e.preventDefault();const r=await sb.from('company_subscriptions').upsert({company_id:$('#cadCompanyId').value,plan_id:$('#cadPlan').value,status:$('#cadStatus').value,max_users:safeNumber($('#cadMaxUsers').value),max_products:safeNumber($('#cadMaxProducts').value),admin_notes:$('#cadNotes').value},{onConflict:'company_id'});
    if(r.error)return toast(r.error.message);$('#companyAdminDialog').close();toast('Empresa actualizada');await loadSuperAdmin();
  };
  $('#saSearch').oninput=renderSuperAdmin;$('#saStatusFilter').onchange=renderSuperAdmin;$('#saRefresh').onclick=loadSuperAdmin;
}
