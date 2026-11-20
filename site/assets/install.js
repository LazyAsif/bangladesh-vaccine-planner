/* Install helper: no tracking, storage or automatic prompts. */
(function(){
 'use strict';
 var deferred=null, overlay=null, lastFocus=null;
 var button=document.getElementById('site-install-button');
 if(!button)return;
 var strings={
  bn:{button:'⬇ অ্যাপ ইনস্টল',title:'হোম স্ক্রিনে অ্যাপ যোগ করুন',close:'বন্ধ করুন',installed:'অ্যাপটি ইনস্টল করা অবস্থায় চলছে। আবার ইনস্টল করার প্রয়োজন নেই।',prompt:'আপনার ব্রাউজারে ইনস্টল অপশন প্রস্তুত। নিচের বাটন চাপুন।',go:'ইনস্টল করুন',dismiss:'ইনস্টল বাতিল করা হয়েছে। চাইলে পরে আবার চেষ্টা করতে পারবেন।',success:'ইনস্টল সম্পন্ন হয়েছে। ফোনের Home Screen বা কম্পিউটারের অ্যাপ তালিকায় দেখুন।',ios:'iPhone / iPad-এ Safari থেকে:',iosSteps:['Safari-তে এই ওয়েবসাইট খুলুন (অ্যাপের ভেতরের ব্রাউজার নয়)।','Share (শেয়ার) বাটন চাপুন।','Add to Home Screen নির্বাচন করুন।','Open as Web App অপশন থাকলে চালু রেখে Add চাপুন।'],android:'Android-এ Chrome থেকে:',androidSteps:['Chrome-এ এই ওয়েবসাইট খুলুন।','উপরে তিন ডট (⋮) মেনু চাপুন।','Add to Home screen → Install / Install app চাপুন।','Home Screen বা app drawer থেকে অ্যাপটি খুলুন।'],desktop:'কম্পিউটারে Chrome / Edge থেকে:',desktopSteps:['Chrome বা Edge-এ এই ওয়েবসাইট খুলুন।','Address bar-এর Install icon চাপুন; অথবা browser menu-তে Install app খুঁজুন।','Install নির্বাচন করুন।'],unsupported:'এই ব্রাউজার থেকে সরাসরি ইনস্টল শুরু করা যাচ্ছে না। নিচের নির্দেশনাগুলো অনুসরণ করুন।',tip:'এটি ওয়েব অ্যাপের শর্টকাট/ইনস্টল; Android বা iOS-এর আলাদা native widget নয়।',err:'ব্রাউজার ইনস্টল prompt দেখাতে পারেনি। নিচের ম্যানুয়াল ধাপ ব্যবহার করুন।'},
  en:{button:'⬇ Install App',title:'Add the app to your Home Screen',close:'Close',installed:'You are already running the installed app. No need to install again.',prompt:'Your browser is ready to show the installation prompt. Select the button below.',go:'Install app',dismiss:'Installation was dismissed. You can try again later.',success:'Installation completed. Check your Home Screen or your computer\'s app list.',ios:'On iPhone / iPad in Safari:',iosSteps:['Open this site in Safari (not an in-app browser).','Tap the Share button.','Select Add to Home Screen.','Enable Open as Web App if offered, then tap Add.'],android:'On Android in Chrome:',androidSteps:['Open this website in Chrome.','Tap the three-dot (⋮) menu.','Choose Add to Home screen → Install / Install app.','Launch it from your Home Screen or app drawer.'],desktop:'On a computer using Chrome / Edge:',desktopSteps:['Open this website in Chrome or Edge.','Use the Install icon in the address bar, or find Install app in the browser menu.','Confirm Install.'],unsupported:'This browser cannot start installation directly. Follow the manual instructions below.',tip:'This installs or adds a web app shortcut, not a separate native Android or iOS widget.',err:'The browser did not display the install prompt. Use the manual instructions below.'}
 };
 function lang(){return document.documentElement.lang==='en'||document.body.classList.contains('en')?'en':'bn'}
 function installed(){return window.matchMedia('(display-mode: standalone)').matches||window.matchMedia('(display-mode: fullscreen)').matches||window.navigator.standalone===true}
 function platform(){var ua=navigator.userAgent||'';if(/iPad|iPhone|iPod/.test(ua)||(/Macintosh/.test(ua)&&navigator.maxTouchPoints>1))return 'ios';if(/Android/i.test(ua))return 'android';return 'desktop'}
 function safeText(node,text){node.textContent=text;return node}
 function ensureDialog(){if(overlay)return;overlay=document.createElement('div');overlay.className='install-overlay';overlay.hidden=true;overlay.innerHTML='<section class="install-panel" role="dialog" aria-modal="true" aria-labelledby="install-heading" tabindex="-1"><button class="install-close" type="button" aria-label="Close">×</button><h2 id="install-heading"></h2><div id="install-copy"></div><button class="install-action" type="button" hidden></button></section>';document.body.appendChild(overlay);overlay.querySelector('.install-close').addEventListener('click',close);overlay.addEventListener('click',function(e){if(e.target===overlay)close()});overlay.addEventListener('keydown',function(e){if(e.key==='Escape')close();if(e.key==='Tab'){var focusables=Array.from(overlay.querySelectorAll('button:not([hidden])'));if(!focusables.length)return;var first=focusables[0],last=focusables[focusables.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}}});}
 function close(){if(!overlay)return;overlay.hidden=true;document.body.style.overflow='';if(lastFocus&&document.contains(lastFocus))lastFocus.focus()}
 function addParagraph(parent,value){var p=document.createElement('p');safeText(p,value);parent.appendChild(p)}
 function addInstructions(parent,title,items){var h=document.createElement('strong');safeText(h,title);parent.appendChild(h);var ol=document.createElement('ol');items.forEach(function(item){var li=document.createElement('li');safeText(li,item);ol.appendChild(li)});parent.appendChild(ol)}
 function show(message){ensureDialog();var t=strings[lang()],p=platform();lastFocus=document.activeElement;var copy=overlay.querySelector('#install-copy');var action=overlay.querySelector('.install-action');safeText(overlay.querySelector('#install-heading'),t.title);safeText(overlay.querySelector('.install-close'), '×');overlay.querySelector('.install-close').setAttribute('aria-label',t.close);copy.replaceChildren();action.hidden=true;action.onclick=null;
  if(installed()){addParagraph(copy,t.installed)}
  else if(message==='success'){addParagraph(copy,t.success)}
  else{
   if(message==='dismiss')addParagraph(copy,t.dismiss);
   else if(message==='err')addParagraph(copy,t.err);
   else if(deferred){addParagraph(copy,t.prompt);safeText(action,t.go);action.hidden=false;action.onclick=install;}
   else addParagraph(copy,t.unsupported);
   if(p==='ios')addInstructions(copy,t.ios,t.iosSteps);
   else if(p==='android')addInstructions(copy,t.android,t.androidSteps);
   else addInstructions(copy,t.desktop,t.desktopSteps);
   var tip=document.createElement('p');tip.className='install-help';safeText(tip,t.tip);copy.appendChild(tip)
  }
  overlay.hidden=false;document.body.style.overflow='hidden';overlay.querySelector('.install-close').focus();
 }
 function install(){if(!deferred){show();return}var evt=deferred;deferred=null;try{evt.prompt();Promise.resolve(evt.userChoice).then(function(r){if(r&&r.outcome==='accepted'){close()}else{show('dismiss')}}).catch(function(){show('err')})}catch(e){show('err')}}
 button.addEventListener('click',function(){show()});
 window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();deferred=e});
 window.addEventListener('appinstalled',function(){deferred=null;if(overlay&&!overlay.hidden)show('success')});
 function updateLabel(){safeText(button,strings[lang()].button)}
 updateLabel();new MutationObserver(updateLabel).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
})();
