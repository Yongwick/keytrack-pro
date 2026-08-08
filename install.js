import {$,toast} from './core.js';

let deferredInstallPrompt=null;

function isStandalone(){
  return window.matchMedia('(display-mode: standalone)').matches
    || window.navigator.standalone === true;
}

function isIOS(){
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

function isSafari(){
  const ua=navigator.userAgent.toLowerCase();
  return ua.includes('safari')
    && !ua.includes('chrome')
    && !ua.includes('crios')
    && !ua.includes('android')
    && !ua.includes('fxios')
    && !ua.includes('edgios');
}

function hideInstallButton(){
  $('#installApp')?.classList.add('hidden');
}

function showInstallButton(){
  if(isStandalone())return hideInstallButton();
  $('#installApp')?.classList.remove('hidden');
}

function openHelp(){
  const ios=isIOS() && isSafari();
  $('#iosInstallSteps')?.classList.toggle('hidden',!ios);
  $('#genericInstallSteps')?.classList.toggle('hidden',ios);
  $('#installHelpDialog')?.showModal();
}

async function requestInstall(){
  if(isStandalone()){
    hideInstallButton();
    return toast('KeyTrack Pro ya está instalado.');
  }

  if(deferredInstallPrompt){
    deferredInstallPrompt.prompt();
    const choice=await deferredInstallPrompt.userChoice;
    if(choice.outcome==='accepted'){
      toast('Instalando KeyTrack Pro…');
      hideInstallButton();
    }
    deferredInstallPrompt=null;
    return;
  }

  openHelp();
}

export function initInstallApp(){
  const button=$('#installApp');
  if(!button)return;

  if(isStandalone()){
    hideInstallButton();
  }else if(isIOS()){
    showInstallButton();
  }

  window.addEventListener('beforeinstallprompt',event=>{
    event.preventDefault();
    deferredInstallPrompt=event;
    showInstallButton();
  });

  window.addEventListener('appinstalled',()=>{
    deferredInstallPrompt=null;
    hideInstallButton();
    toast('KeyTrack Pro se instaló correctamente.');
  });

  button.addEventListener('click',requestInstall);
  $('#installHelpX')?.addEventListener('click',()=>$('#installHelpDialog')?.close());
  $('#installHelpClose')?.addEventListener('click',()=>$('#installHelpDialog')?.close());

  if(!isStandalone() && !isIOS()){
    setTimeout(()=>{
      if(!deferredInstallPrompt)showInstallButton();
    },3000);
  }
}
