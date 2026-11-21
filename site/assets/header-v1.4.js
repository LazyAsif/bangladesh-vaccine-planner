/* Child Vaccine Planner v1.4 – shared mobile header behaviour */
(function(){'use strict';
  var header=document.querySelector('.app-header');
  if(!header)return;
  var trigger=header.querySelector('.site-menu-toggle');
  var panel=header.querySelector('#site-menu-panel');
  if(!trigger||!panel)return;
  var cutoff=window.matchMedia('(max-width: 1200px)');
  function isOpen(){return trigger.getAttribute('aria-expanded')==='true'}
  function setOpen(open,returnFocus){
    var shouldOpen=!!open&&cutoff.matches;
    trigger.setAttribute('aria-expanded',String(shouldOpen));
    trigger.setAttribute('aria-label',shouldOpen?'Close navigation menu':'Open navigation menu');
    panel.classList.toggle('is-open',shouldOpen);
    if(!shouldOpen&&returnFocus&&cutoff.matches)trigger.focus();
  }
  trigger.addEventListener('click',function(){setOpen(!isOpen());});
  document.addEventListener('keydown',function(e){
    if(e.key==='Escape'&&isOpen()){e.preventDefault();setOpen(false,true);}
  });
  document.addEventListener('pointerdown',function(e){
    if(isOpen()&&!header.contains(e.target))setOpen(false);
  });
  panel.addEventListener('click',function(e){
    var link=e.target.closest('a');
    if(link&&panel.contains(link))setOpen(false);
    // Leave the menu open when theme/install buttons are pressed.
  });
  if(cutoff.addEventListener)cutoff.addEventListener('change',function(){setOpen(false)});
  else if(cutoff.addListener)cutoff.addListener(function(){setOpen(false)});
  // Avoid an already-open menu lingering in browser back-forward cache.
  window.addEventListener('pageshow',function(e){if(e.persisted)setOpen(false)});
})();
