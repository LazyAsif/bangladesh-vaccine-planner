/* Child Vaccine Planner v1.5 – browser-local language preference shared by all pages. */
(function(){'use strict';
 var KEY='cvp-language-v1';
 function stored(){try{var l=localStorage.getItem(KEY);return l==='bn'||l==='en'?l:null}catch(e){return null}}
 function read(){return stored() || (location.hash==='#en'?'en':location.hash==='#bn'?'bn':'bn')}
 function apply(lang,notify){if(lang!=='bn'&&lang!=='en')return;document.documentElement.lang=lang;document.documentElement.dataset.cvpLang=lang;
   document.querySelectorAll('[data-cvp-language]').forEach(function(b){b.setAttribute('aria-pressed',String(b.dataset.cvpLanguage===lang))});
   document.querySelectorAll('[data-cvp-bn][data-cvp-en]').forEach(function(node){node.textContent=node.getAttribute('data-cvp-'+lang)});
   document.querySelectorAll('[data-cvp-placeholder-bn][data-cvp-placeholder-en]').forEach(function(node){node.placeholder=node.getAttribute('data-cvp-placeholder-'+lang)});
   if(notify)window.dispatchEvent(new CustomEvent('cvp-language-change',{detail:{lang:lang}}));
 }
 function select(lang){try{localStorage.setItem(KEY,lang)}catch(e){}apply(lang,true)}
 document.querySelectorAll('[data-cvp-language]').forEach(function(b){b.addEventListener('click',function(){select(b.dataset.cvpLanguage)})});
 window.cvpLanguage={get:read,set:select,refresh:function(){apply(read(),false)}};
 apply(read(),true);
 window.addEventListener('pageshow',function(e){if(e.persisted)apply(read(),true)});
})();
