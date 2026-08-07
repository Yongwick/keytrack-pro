import {$,state,sb,esc,toast,safeNumber} from './core.js';

function indexBy(list,key='id'){
  return new Map((list||[]).map(x=>[x[key],x]));
}

async function optionalTable(name,query,fallback=[]){
  try{
    const r=await query;
    if(r.error){
      console.warn(`Tabla opcional ${name}:`,r.error);
      return fallback;
    }
    return r.data||fallback;
  }catch(error){
    console.warn(`Tabla opcional ${name}:`,error);
    return fallback;
  }
}

export async function loadSuperAdmin(){
  if(!state.isPlatformAdmin)return;

  $('#saCompanies').textContent='…';
  $('#saActive').textContent='…';
  $('#saUsers').textContent='…';
  $('#saProducts').textContent='…';
  $('#saBody').innerHTML='<tr><td colspan="8" class="muted">Cargando empresas…</td></tr>';

  try{
    // Todas son tablas reales. No se usa ninguna VIEW.
    const companiesResult=await sb
      .from('companies')
      .select('*')
      .order('created_at',{ascending:true});

    if(companiesResult.error)throw companiesResult.error;

    const companies=companiesResult.data||[];

    const [members,products,subscriptions,plans,profiles]=await Promise.all([
      optionalTable(
        'company_members',
        sb.from('company_members').select('*').eq('status','active')
      ),
      optionalTable(
        'products',
        sb.from('products').select('id,company_id,quantity')
      ),
      optionalTable(
        'company_subscriptions',
        sb.from('company_subscriptions').select('*')
      ),
      optionalTable(
        'subscription_plans',
        sb.from('subscription_plans').select('*').order('monthly_price')
      ),
      optionalTable(
        'profiles',
        sb.from('profiles').select('*')
      )
    ]);

    state.saPlans=plans||[];

    const planMap=indexBy(plans);
    const profileMap=indexBy(profiles);
    const subscriptionMap=new Map((subscriptions||[]).map(x=>[x.company_id,x]));

    state.saCompanies=companies.map(company=>{
      const companyMembers=(members||[]).filter(x=>x.company_id===company.id);
      const companyProducts=(products||[]).filter(x=>x.company_id===company.id);
      const subscription=subscriptionMap.get(company.id)||{};
      const plan=planMap.get(subscription.plan_id)||{};

      const ownerMember=
        companyMembers.find(x=>x.role==='owner') ||
        companyMembers.find(x=>x.user_id===company.owner_user_id) ||
        companyMembers[0];

      const ownerProfile=ownerMember ? profileMap.get(ownerMember.user_id) : null;

      let ownerDisplay='Propietario';
      if(ownerMember?.user_id===state.session?.user?.id){
        ownerDisplay=state.session.user.email||ownerProfile?.full_name||'Propietario';
      }else if(ownerProfile?.email){
        ownerDisplay=ownerProfile.email;
      }else if(ownerProfile?.full_name){
        ownerDisplay=ownerProfile.full_name;
      }

      return {
        company_id:company.id,
        company_name:company.name||'Empresa',
        owner_email:ownerDisplay,
        plan_id:subscription.plan_id||null,
        plan_name:plan.name||subscription.plan_name||'Gratis',
        subscription_status:subscription.status||'active',
        member_count:companyMembers.length,
        product_count:companyProducts.length,
        unit_count:companyProducts.reduce((sum,p)=>sum+safeNumber(p.quantity),0),
        created_at:company.created_at,
        max_users:subscription.max_users ?? plan.max_users ?? 1,
        max_products:subscription.max_products ?? plan.max_products ?? 100,
        admin_notes:subscription.admin_notes||''
      };
    });

    renderSuperAdmin();

  }catch(error){
    console.error('Super Admin:',error);
    $('#saCompanies').textContent='0';
    $('#saActive').textContent='0';
    $('#saUsers').textContent='0';
    $('#saProducts').textContent='0';
    $('#saBody').innerHTML=
      `<tr><td colspan="8" class="module-error">${esc(error.message||'No se pudieron cargar las empresas')}</td></tr>`;
    toast(error.message||'No se pudo cargar Super Admin');
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
        <div class="muted">${esc(x.owner_email||'Propietario')}</div>
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
