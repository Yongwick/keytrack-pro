
import {$,$$,state,sb,toast,setSync,querySafe} from './core.js';
import {initAuth} from './auth.js';
import {initInventory,renderInventory} from './inventory.js';
import {renderDashboard} from './dashboard.js';
import {initProducts} from './products.js';
import {initOperations,renderOperational} from './operations.js';
import {initBranches,renderBranches} from './branches.js';
import {initSuperAdmin,loadSuperAdmin} from './superadmin.js';
import {initScanner} from './scanner.js';

const views=['inventory','dashboard','detail','movements','branches','customers','suppliers','purchases','sales','superadmin'];

function switchView(name){
  views.forEach(v=>$('#'+v+'View')?.classList.toggle('hidden',v!==name));
  $$('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===name));
  if(name==='inventory')renderInventory();
  if(name==='dashboard')renderDashboard();
  if(name==='branches')renderBranches();
  if(['customers','suppliers','purchases','sales'].includes(name))renderOperational();
  if(name==='movements')renderMovements();
  if(name==='superadmin')loadSuperAdmin();
}
window.switchView=switchView;

function renderMovements(){
  $('#movementsBody').innerHTML=state.movements.length?state.movements.map(m=>`<div class="history-item"><b>${m.products?.name||'Producto'}</b> · ${m.movement_type} ${m.quantity}<div class="muted">${new Date(m.created_at).toLocaleString()} · ${m.note||''}</div></div>`).join(''):'<div class="muted">Sin movimientos.</div>';
}

async function loadProfile(){
  const uid=state.session.user.id;
  let r=await sb.from('company_members').select('*,companies(*)').eq('user_id',uid).eq('status','active').limit(1).maybeSingle();
  if(r.error)throw r.error;
  if(!r.data){
    // Fallback profile (older installs may have profile/company bootstrap function)
    const p=await sb.from('profiles').select('*').eq('id',uid).maybeSingle();
    if(p.error)throw p.error;
    if(!p.data?.company_id)throw new Error('Tu usuario no está asociado a una empresa.');
    r=await sb.from('company_members').select('*,companies(*)').eq('company_id',p.data.company_id).eq('user_id',uid).maybeSingle();
  }
  state.profile=r.data;state.companyId=r.data.company_id;state.companyName=r.data.companies?.name||'Empresa';
  $('#companyBadge').textContent=state.companyName;$('#role').textContent=r.data.role||'member';
  const admin=await sb.from('platform_admins').select('user_id').eq('user_id',uid).maybeSingle();
  state.isPlatformAdmin=Boolean(admin.data);
  $('#superAdminNav').classList.toggle('hidden',!state.isPlatformAdmin);
}

export async function reload(){
  if(!state.companyId)return;
  setSync('Sincronizando…',false);
  try{
    const locations=await sb.from('locations').select('*').eq('company_id',state.companyId).order('name');
    if(locations.error)throw locations.error;state.locations=locations.data||[];
    $('#iloc').innerHTML='<option value="">Sin ubicación</option>'+state.locations.map(x=>`<option value="${x.id}">${x.name}</option>`).join('');

    const products=await sb.from('products').select('*,locations(name)').eq('company_id',state.companyId).order('created_at',{ascending:false});
    if(products.error)throw products.error;state.items=products.data||[];

    const [mov,customers,suppliers,purchases,sales]=await Promise.all([
      querySafe('movements',sb.from('inventory_movements').select('*,products(name)').eq('company_id',state.companyId).order('created_at',{ascending:false}).limit(100)),
      querySafe('customers',sb.from('customers').select('*').eq('company_id',state.companyId).order('created_at',{ascending:false})),
      querySafe('suppliers',sb.from('suppliers').select('*').eq('company_id',state.companyId).order('created_at',{ascending:false})),
      querySafe('purchases',sb.from('purchase_orders').select('*,suppliers(name)').eq('company_id',state.companyId).order('created_at',{ascending:false})),
      querySafe('sales',sb.from('sales').select('*,customers(name)').eq('company_id',state.companyId).order('created_at',{ascending:false}))
    ]);
    state.movements=mov;state.customers=customers;state.suppliers=suppliers;state.purchases=purchases;state.sales=sales;
    renderInventory();renderOperational();setSync('Sincronizado',true);
  }catch(e){console.error(e);setSync('Error al sincronizar',false);toast(e.message||'Error al sincronizar')}
}

$$('[data-view]').forEach(button=>button.addEventListener('click',()=>{
  if(button.dataset.view==='superadmin'&&!state.isPlatformAdmin)return toast('Acceso restringido');
  switchView(button.dataset.view);
}));

initInventory({switchView});
initProducts({reload,switchView});
initOperations({reload,switchView});
initBranches({reload});
initSuperAdmin();
initScanner({renderInventory});

initAuth({
  onReady:async()=>{try{await loadProfile();switchView('inventory');await reload()}catch(e){console.error(e);toast(e.message)}},
  onLogout:()=>{state.companyId=null;state.items=[]}
});

window.addEventListener('error',e=>console.error('KeyTrack runtime:',e.error||e.message));
window.addEventListener('unhandledrejection',e=>console.error('KeyTrack async:',e.reason));

if('serviceWorker' in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js').catch(console.warn));
