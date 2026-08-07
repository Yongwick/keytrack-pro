
import {$,state,sb,val,toast,setSync,querySafe} from './core.js';

function mode(m){
  state.mode=m;$('#namebox').classList.toggle('hidden',m==='login');$('#companybox').classList.toggle('hidden',m==='login');
  $('#tl').classList.toggle('primary',m==='login');$('#ts').classList.toggle('primary',m==='signup');$('#as').textContent=m==='login'?'Iniciar sesión':'Crear cuenta';$('#err').textContent='';
}

export function initAuth({onReady,onLogout}){
  $('#tl').onclick=()=>mode('login');$('#ts').onclick=()=>mode('signup');mode('login');
  $('#af').onsubmit=async e=>{
    e.preventDefault();$('#err').textContent='';
    if(state.mode==='signup'&&!val('#companyname'))return $('#err').textContent='Escribe el nombre de la empresa';
    const r=state.mode==='login'
      ? await sb.auth.signInWithPassword({email:val('#email'),password:val('#pass')})
      : await sb.auth.signUp({email:val('#email'),password:val('#pass'),options:{data:{full_name:val('#fullname'),company_name:val('#companyname')}}});
    if(r.error)$('#err').textContent=r.error.message;
    else if(state.mode==='signup'&&!r.data.session)toast('Revisa tu correo para confirmar la cuenta');
  };
  $('#logout').onclick=()=>sb.auth.signOut();

  sb.auth.onAuthStateChange(async(_,session)=>{
    state.session=session;
    if(!session){
      $('#auth').classList.remove('hidden');$('#app').classList.add('hidden');onLogout?.();return;
    }
    $('#auth').classList.add('hidden');$('#app').classList.remove('hidden');$('#user').textContent=session.user.email;
    await onReady(session);
  });
}
