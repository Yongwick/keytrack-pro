
import {$,state,toast} from './core.js';
export function initScanner({renderInventory}){
  async function start(target){
    state.scanTarget=target;$('#scanner').showModal();$('#scanmsg').textContent='Solicitando cámara…';
    try{
      state.stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'}});
      $('#video').srcObject=state.stream;$('#scanmsg').textContent='Apunta la cámara al código.';
      // BarcodeDetector when supported.
      if('BarcodeDetector'in window){
        const detector=new BarcodeDetector({formats:['qr_code','code_128','ean_13','ean_8','upc_a','upc_e']});
        const tick=async()=>{if(!state.stream)return;try{const codes=await detector.detect($('#video'));if(codes[0]){apply(codes[0].rawValue);stop();return}}catch{}requestAnimationFrame(tick)};tick();
      }else $('#scanmsg').textContent='Cámara activa. Usa ingreso manual si el navegador no detecta códigos.';
    }catch(e){$('#scanmsg').textContent='No se pudo abrir la cámara: '+e.message}
  }
  function apply(code){if(state.scanTarget==='field')$('#ibar').value=code;else{$('#search').value=code;renderInventory()}toast('Código: '+code)}
  function stop(){if(state.stream)state.stream.getTracks().forEach(t=>t.stop());state.stream=null;$('#scanner').close()}
  $('#scan').onclick=()=>start('search');$('#scanField').onclick=()=>start('field');$('#sx').onclick=stop;
  $('#manual').onclick=()=>{const c=prompt('Escribe o pega el código');if(c){apply(c);stop()}};
}
