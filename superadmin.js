import {$,state,sb,esc,toast,safeNumber} from './core.js';

export async function loadSuperAdmin(){
  if(!state.isPlatformAdmin)return;

  $('#saCompanies').textContent='…';
  $('#saActive').textContent='…';
  $('#saUsers').textContent='…';
  $('#saProducts').textContent='…';
  $('#saBody').innerHTML='<tr><td colspan="8" class="muted">Cargando todas las empresas…</td></tr>';

  try{
    // IMPORTANTE:
    // Las consultas directas a companies/company_members/products están sujetas
    // a RLS y solo muestran la empresa del usuario actual.
    // Este RPC es SECURITY DEFINER y verifica platform_admins antes de devolver datos.
    const overview=await sb.rpc('superadmin_company_overview');

    if(overview.error)throw overview.error;

    const rows=overview.data||[];

    // Planes y suscripciones siguen siendo opcionales.
    let plans=[];
    let subscriptions=[];

    try{
      const r=await sb.from('subscription_plans').select('*').order('monthly_price');
      if(!r.error)plans=r.data||[];
    }catch(error){console.warn('subscription_plans:',error)}

    try{
      const r=await sb.from('company_subscriptions').select('*');
      if(!r.error)subscriptions=r.data||[];
    }catch(error){console.warn('company_subscriptions:',error)}

    state.saPlans=plans;

    const planMap=new Map(plans.map(x=>[x.id,x]));
    const subscriptionMap=new Map(subscriptions.map(x=>[x.company_id,x]));

    state.saCompanies=rows.map(company=>{
      const subscription=subscriptionMap.get(company.company_id)||{};
      const plan=planMap.get(subscription.plan_id)||{};

      return {
        company_id:company.company_id,
        company_name:company.company_name||'Empresa',
        owner_email:company.owner_email||'Sin propietario',
        plan_id:subscription.plan_id||null,
        plan_name:plan.name||'Gratis',
        subscription_status:subscription.status||'active',
        member_count:safeNumber(company.member_count),
        product_count:safeNumber(company.product_count),
        unit_count:safeNumber(company.unit_count),
        created_at:company.created_at,
        max_users:subscription.max_users ?? plan.max_users ?? 1,
        max_products:subscription.max_products ?? plan.max_products ?? 100,
        admin_notes:subscription.admin_notes||''
      };
    });

    renderSuperAdmin();

  }catch(error){
    console.error('Super Admin global:',error);

    $('#saCompanies').textContent='0';
    $('#saActive').textContent='0';
    $('#saUsers').textContent='0';
    $('#saProducts').textContent='0';

    let message=error.message||'No se pudieron cargar las empresas';

    if(message.includes('superadmin_company_overview')){
      message='Falta instalar superadmin-global.sql en Supabase.';
    }

    $('#saBody').innerHTML=
      `<tr><td colspan="8" class="module-error">${esc(message)}</td></tr>`;

    toast(message);
  }
}

export function renderSuperAdmin(){
  const q=($('#saSearch')?.value||'').trim().toLowerCase();
  const status=$('#saStatusFilter')?.value||'';

  const rows=(state.saCompanies||[]).filter(x=>{
    const statusOk=!status||x.subscription_status===status;
    const searchOk=!q||[
      x.company_name,x.owner_email,x.plan_name,x.subscription_status
    ].join(' ').toLowerCase().includes(q);

    return statusOk&&searchOk;
  });

  $('#saCompanies').textContent=(state.saCompanies||[]).length;
  $('#saActive').textContent=(state.saCompanies||[])
    .filter(x=>x.subscription_status==='active').length;
  $('#saUsers').textContent=(state.saCompanies||[])
    .reduce((n,x)=>n+safeNumber(x.member_count),0);
  $('#saProducts').textContent=(state.saCompanies||[])
    .reduce((n,x)=>n+safeNumber(x.product_count),0);

  $('#saCount').textContent=`${rows.length} empresa${rows.length===1?'':'s'}`;

  $('#saBody').innerHTML=rows.length?rows.map(x=>`
    <tr>
      <td>
        <b>${esc(x.company_name)}</b>
        <div class="muted">${esc(x.owner_email||'Sin propietario')}</div>
      </td>
      <td><span class="badge">${esc(x.plan_name||'Gratis')}</span></td>
      <td>${esc(x.subscription_status||'active')}</td>
      <td>${safeNumber(x.member_count)} / ${safeNumber(x.max_users)||'—'}</td>
      <td>${safeNumber(x.product_count)} / ${safeNumber(x.max_products)||'—'}</td>
      <td>${safeNumber(x.unit_count)}</td>
      <td>${x.created_at?new Date(x.created_at).toLocaleDateString():'—'}</td>
      <td>
        <button class="btn small" data-sa-edit="${x.company_id}">
          Administrar
        </button>
      </td>
    </tr>
  `).join(''):'<tr><td colspan="8" class="muted">No hay empresas para mostrar.</td></tr>';
}

function openAdmin(id){
  const x=(state.saCompanies||[]).find(a=>a.company_id===id);
  if(!x)return;

  $('#cadCompany').textContent=x.company_name;
  $('#cadCompanyId').value=id;

  if((state.saPlans||[]).length){
    $('#cadPlan').innerHTML=state.saPlans.map(p=>
      `<option value="${p.id}">${esc(p.name)}</option>`
    ).join('');
    $('#cadPlan').value=x.plan_id||state.saPlans[0]?.id||'';
  }else{
    $('#cadPlan').innerHTML='<option value="">Gratis</option>';
  }

  $('#cadStatus').value=x.subscription_status||'active';
  $('#cadMaxUsers').value=x.max_users||1;
  $('#cadMaxProducts').value=x.max_products||100;
  $('#cadNotes').value=x.admin_notes||'';
  $('#companyAdminDialog').showModal();
}

export function initSuperAdmin(){
  $('#saBody').addEventListener('click',event=>{
    const button=event.target.closest('[data-sa-edit]');
    if(button)openAdmin(button.dataset.saEdit);
  });

  $('#cadX').onclick=$('#cadCancel').onclick=()=>$('#companyAdminDialog').close();

  $('#companyAdminForm').onsubmit=async event=>{
    event.preventDefault();

    const companyId=$('#cadCompanyId').value;
    const payload={
      company_id:companyId,
      plan_id:$('#cadPlan').value||null,
      status:$('#cadStatus').value,
      max_users:safeNumber($('#cadMaxUsers').value),
      max_products:safeNumber($('#cadMaxProducts').value),
      admin_notes:$('#cadNotes').value||null
    };

    try{
      const existing=await sb
        .from('company_subscriptions')
        .select('company_id')
        .eq('company_id',companyId)
        .maybeSingle();

      if(existing.error)throw existing.error;

      const result=existing.data
        ? await sb.from('company_subscriptions')
            .update(payload)
            .eq('company_id',companyId)
        : await sb.from('company_subscriptions')
            .insert(payload);

      if(result.error)throw result.error;

      $('#companyAdminDialog').close();
      toast('Empresa actualizada');
      await loadSuperAdmin();

    }catch(error){
      console.error('Actualizar empresa:',error);
      toast(error.message||'No se pudo actualizar la empresa');
    }
  };

  $('#saSearch').oninput=renderSuperAdmin;
  $('#saStatusFilter').onchange=renderSuperAdmin;
  $('#saRefresh').onclick=loadSuperAdmin;
}
