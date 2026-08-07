
import {createClient} from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

export const sb=createClient(
  'https://ngzoyfxnbonjqeprkpxp.supabase.co',
  'sb_publishable_IZfg7e_-acYq6QHpceVTxQ_GIiXLI-G'
);

export const $=s=>document.querySelector(s);
export const $$=s=>Array.from(document.querySelectorAll(s));
export const val=id=>$(id)?.value?.trim?.() ?? '';
export const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

export const state={
  mode:'login',session:null,profile:null,companyId:null,companyName:'',
  items:[],locations:[],movements:[],customers:[],suppliers:[],purchases:[],sales:[],
  saCompanies:[],saPlans:[],isPlatformAdmin:false,stream:null,scanTarget:'search',
  stockFilter:''
};

export function toast(message){
  const t=$('#toast');
  if(!t){console.log(message);return}
  t.textContent=message;
  t.classList.add('on');
  clearTimeout(toast._timer);
  toast._timer=setTimeout(()=>t.classList.remove('on'),2600);
}

export function setSync(text,ok=true){
  $('#cloud').textContent=text;
  $('#dot')?.classList.toggle('ok',ok);
}

export function safeNumber(v){const n=Number(v);return Number.isFinite(n)?n:0}
export function todayISO(){return new Date().toISOString().slice(0,10)}

export async function querySafe(label,promise,fallback=[]){
  try{
    const result=await promise;
    if(result.error){console.warn(label,result.error);return fallback}
    return result.data??fallback;
  }catch(error){console.warn(label,error);return fallback}
}

export function downloadText(filename,text,type='text/plain;charset=utf-8'){
  const blob=new Blob([text],{type});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);a.download=filename;a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href),500);
}
