import {$,state,toast} from './core.js';

export function initScanner({renderInventory}){
  let detector=null;
  let animationId=null;
  let opening=false;
  let currentTarget='search';

  const video=$('#video');
  const message=$('#scanmsg');
  const loading=$('#cameraLoading');
  const errorActions=$('#cameraErrorActions');
  const help=$('#cameraHelp');

  function setMessage(text,type='normal'){
    message.textContent=text;
    message.classList.toggle('scanner-error',type==='error');
    message.classList.toggle('scanner-success',type==='success');
  }

  function setLoading(active){
    loading.classList.toggle('hidden',!active);
  }

  function setErrorActions(show){
    errorActions.classList.toggle('hidden',!show);
  }

  async function stopStreamOnly(){
    if(animationId){
      cancelAnimationFrame(animationId);
      animationId=null;
    }

    if(video){
      try{ video.pause(); }catch{}
      video.srcObject=null;
    }

    if(state.stream){
      state.stream.getTracks().forEach(track=>{
        try{track.stop()}catch{}
      });
      state.stream=null;
    }

    detector=null;
  }

  async function stop(closeDialog=true){
    opening=false;
    await stopStreamOnly();
    setLoading(false);
    setErrorActions(false);
    help.classList.add('hidden');

    if(closeDialog && $('#scanner').open){
      $('#scanner').close();
    }
  }

  function apply(code){
    const value=String(code||'').trim();
    if(!value)return;

    if(currentTarget==='field'){
      $('#ibar').value=value;
      $('#ibar').dispatchEvent(new Event('input',{bubbles:true}));
    }else{
      $('#search').value=value;
      renderInventory();
    }

    toast('Código: '+value);
  }

  async function getRearCameraConstraints(){
    // Primer intento: pedir cámara trasera de manera ideal.
    // Después del primer permiso podemos enumerar dispositivos y escoger
    // una cámara "back/rear/environment" si existe.
    const base={
      audio:false,
      video:{
        facingMode:{ideal:'environment'},
        width:{ideal:1920},
        height:{ideal:1080}
      }
    };

    try{
      const devices=await navigator.mediaDevices.enumerateDevices();
      const cameras=devices.filter(d=>d.kind==='videoinput');
      const rear=cameras.find(d=>
        /back|rear|environment|trasera|posterior/i.test(d.label||'')
      );

      if(rear?.deviceId){
        base.video={
          deviceId:{exact:rear.deviceId},
          width:{ideal:1920},
          height:{ideal:1080}
        };
      }
    }catch{}

    return base;
  }

  async function startDetector(){
    if(!('BarcodeDetector' in window)){
      setMessage('Cámara activa. Este navegador no ofrece detección automática; puedes ingresar el código manualmente.');
      return;
    }

    try{
      let formats=['qr_code','code_128','ean_13','ean_8','upc_a','upc_e','code_39'];
      if(typeof BarcodeDetector.getSupportedFormats==='function'){
        const supported=await BarcodeDetector.getSupportedFormats();
        formats=formats.filter(f=>supported.includes(f));
      }

      detector=new BarcodeDetector(formats.length?{formats}:undefined);
    }catch(error){
      console.warn('BarcodeDetector:',error);
      detector=null;
      setMessage('Cámara activa. Si no reconoce el código, usa ingreso manual.');
      return;
    }

    const tick=async()=>{
      if(!state.stream || !detector || $('#scanner').open!==true)return;

      if(video.readyState>=2 && !video.paused){
        try{
          const codes=await detector.detect(video);
          if(codes?.[0]?.rawValue){
            setMessage('Código detectado.', 'success');
            apply(codes[0].rawValue);
            setTimeout(()=>stop(true),120);
            return;
          }
        }catch(error){
          // Ignoramos frames individuales inválidos.
        }
      }

      animationId=requestAnimationFrame(tick);
    };

    animationId=requestAnimationFrame(tick);
  }

  async function waitForVideoReady(timeoutMs=5000){
    if(video.readyState>=2)return;

    await new Promise((resolve,reject)=>{
      let done=false;
      const timer=setTimeout(()=>{
        if(done)return;
        done=true;
        cleanup();
        reject(new Error('La cámara tardó demasiado en iniciar.'));
      },timeoutMs);

      const ready=()=>{
        if(done)return;
        done=true;
        clearTimeout(timer);
        cleanup();
        resolve();
      };

      const failed=()=>{
        if(done)return;
        done=true;
        clearTimeout(timer);
        cleanup();
        reject(new Error('No se pudo reproducir la cámara.'));
      };

      const cleanup=()=>{
        video.removeEventListener('loadedmetadata',ready);
        video.removeEventListener('canplay',ready);
        video.removeEventListener('error',failed);
      };

      video.addEventListener('loadedmetadata',ready,{once:true});
      video.addEventListener('canplay',ready,{once:true});
      video.addEventListener('error',failed,{once:true});
    });
  }

  function cameraErrorText(error){
    const name=error?.name||'';
    if(name==='NotAllowedError' || name==='PermissionDeniedError'){
      return 'La cámara está bloqueada. Permite el acceso a la cámara y toca Reintentar.';
    }
    if(name==='NotFoundError' || name==='DevicesNotFoundError'){
      return 'No se encontró una cámara disponible en este dispositivo.';
    }
    if(name==='NotReadableError' || name==='TrackStartError'){
      return 'La cámara está siendo usada por otra aplicación. Ciérrala e intenta nuevamente.';
    }
    if(name==='OverconstrainedError' || name==='ConstraintNotSatisfiedError'){
      return 'No se pudo seleccionar la cámara trasera. Toca Reintentar.';
    }
    if(!window.isSecureContext){
      return 'La cámara requiere una conexión segura HTTPS.';
    }
    return 'No se pudo abrir la cámara. '+(error?.message||'Intenta nuevamente.');
  }

  async function openCamera(){
    if(opening)return;
    opening=true;

    await stopStreamOnly();

    setLoading(true);
    setErrorActions(false);
    help.classList.add('hidden');
    setMessage('Solicitando permiso de cámara…');

    try{
      if(!navigator.mediaDevices?.getUserMedia){
        throw new Error('Este navegador no permite acceso a la cámara.');
      }

      // Primero intenta cámara trasera.
      let stream;
      try{
        const constraints=await getRearCameraConstraints();
        stream=await navigator.mediaDevices.getUserMedia(constraints);
      }catch(firstError){
        // Fallback más flexible para dispositivos que rechazan facingMode/deviceId.
        console.warn('Primer intento de cámara:',firstError);
        stream=await navigator.mediaDevices.getUserMedia({
          audio:false,
          video:true
        });
      }

      state.stream=stream;
      video.srcObject=stream;
      video.muted=true;
      video.setAttribute('playsinline','');
      video.setAttribute('autoplay','');

      await waitForVideoReady();

      try{
        await video.play();
      }catch(playError){
        console.warn('video.play():',playError);
        // Segundo intento después de un pequeño delay.
        await new Promise(r=>setTimeout(r,200));
        await video.play();
      }

      setLoading(false);
      setMessage('Apunta la cámara al código. Mantén el código dentro del recuadro.');
      await startDetector();

    }catch(error){
      console.error('Error de cámara:',error);
      await stopStreamOnly();
      setLoading(false);
      setMessage(cameraErrorText(error),'error');
      setErrorActions(true);
    }finally{
      opening=false;
    }
  }

  async function start(target){
    currentTarget=target;
    state.scanTarget=target;

    if(!$('#scanner').open){
      $('#scanner').showModal();
    }

    await openCamera();
  }

  $('#scan').onclick=()=>start('search');
  $('#scanField').onclick=()=>start('field');
  $('#sx').onclick=()=>stop(true);

  $('#retryCamera').onclick=()=>openCamera();

  $('#openCameraHelp').onclick=()=>{
    help.classList.toggle('hidden');
  };

  $('#manual').onclick=async()=>{
    const c=prompt('Escribe o pega el código');
    if(c){
      apply(c);
      await stop(true);
    }
  };

  // Si el diálogo se cierra con Escape, detener la cámara igualmente.
  $('#scanner').addEventListener('cancel',event=>{
    event.preventDefault();
    stop(true);
  });

  $('#scanner').addEventListener('close',()=>{
    stopStreamOnly();
  });

  // Evita dejar la cámara encendida si la PWA pasa a segundo plano.
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden && state.stream){
      stop(false);
      setMessage('Cámara pausada. Toca Reintentar cámara para continuar.');
      setErrorActions(true);
    }
  });
}
