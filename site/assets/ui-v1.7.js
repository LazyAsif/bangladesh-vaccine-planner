/* Child Vaccine Planner v1.7 — presentation-only accordion and PWA installation placement.
   Vaccination scheduling, saved records and clinician overrides are not modified. */
(function () {
  'use strict';
  const isEnglish = () => document.documentElement.dataset.cvpLang === 'en' || document.documentElement.lang === 'en';
  const text = (bn, en) => isEnglish() ? en : bn;
  function inInstalledApp() {
    return !!(navigator.standalone === true ||
      (window.matchMedia && (
        window.matchMedia('(display-mode: standalone)').matches ||
        window.matchMedia('(display-mode: fullscreen)').matches
      )) || (document.referrer || '').startsWith('android-app://'));
  }

  function installControls() {
    const original = document.getElementById('site-install-button');
    const settings = document.querySelector('.cvp-settings-panel');
    // Keep the original element: install.js has already attached its click handler to it.
    if (original && settings && original.parentElement !== settings) {
      original.style.removeProperty('display');
      original.classList.add('cvp-settings-install');
      settings.appendChild(original);
    }
    if (settings && !settings.querySelector('.cvp-install-caption')) {
      const caption = document.createElement('p');
      caption.className = 'cvp-install-caption';
      caption.innerHTML = '<span class="cvp-only-bn">ওয়েবসাইটকে অ্যাপ হিসেবে ব্যবহার করুন</span><span class="cvp-only-en">Install this website as an app</span>';
      if (original) settings.insertBefore(caption, original);
    }
    const update = () => {
      const installed = inInstalledApp();
      if (original) {
        original.hidden = installed;
        original.setAttribute('aria-hidden', String(installed));
        original.tabIndex = installed ? -1 : 0;
      }
      document.querySelectorAll('.cvp-more-dialog > button:not(.cvp-more-close)').forEach(button => {
        // v1.6 creates the mobile Install App action as the last direct button.
        if (button.classList.contains('cvp-v17-install') || /অ্যাপ ইনস্টল|Install App/i.test(button.textContent || '')) {
          button.classList.add('cvp-v17-install');
          button.hidden = installed;
          button.setAttribute('aria-hidden', String(installed));
          button.tabIndex = installed ? -1 : 0;
        }
      });
      document.querySelectorAll('.cvp-install-nudge').forEach(node => {if (installed) node.remove();});
      const caption = settings?.querySelector('.cvp-install-caption');
      if (caption) caption.hidden = installed;
    };
    update();
    window.addEventListener('pageshow', update);
    window.addEventListener('appinstalled', update);
    document.addEventListener('visibilitychange', update);
    if (window.matchMedia) {
      ['standalone', 'fullscreen'].forEach(mode => {
        const m = window.matchMedia('(display-mode: ' + mode + ')');
        if (m.addEventListener) m.addEventListener('change', update);
        else if (m.addListener) m.addListener(update);
      });
    }
    // v1.6 normally creates the nudge during initialisation. Keep its standalone
    // visibility correct even when older browser cache creates it after load.
    const bodyObserver = new MutationObserver(mutations => {
      if (!inInstalledApp()) return;
      for (const m of mutations) {
        for (const n of m.addedNodes) {
          if (n.nodeType === 1 && n.classList?.contains('cvp-install-nudge')) n.remove();
        }
      }
    });
    bodyObserver.observe(document.body, {childList:true});
  }

  function timelineAccordions() {
    const tbody = document.querySelector('#view #rows');
    if (!tbody) return;
    const openState = new Map();
    let defaultSet = false;
    window.addEventListener('cvp-profile-change', () => { openState.clear(); defaultSet = false; });
    function enhance() {
      const rows = Array.from(tbody.querySelectorAll(':scope > tr'));
      if (!rows.length) return;
      // First incomplete card is open on initial render. All others start compact.
      const firstIncomplete = rows.find(row => !row.querySelector('input[type="checkbox"]')?.checked) || rows[0];
      for (const row of rows) {
        const firstCell = row.querySelector('td:first-child');
        const checkbox = firstCell?.querySelector('input[type="checkbox"][data-id]');
        if (!firstCell || !checkbox) continue;
        const id = checkbox.dataset.id;
        const title = row.querySelector('.name-cell .vn')?.textContent?.trim() || id;
        const date = row.querySelector('.date-cell .date')?.textContent?.trim() || '';
        let expanded;
        if (openState.has(id)) expanded = openState.get(id);
        else {
          expanded = !defaultSet && row === firstIncomplete;
          openState.set(id, expanded);
        }
        row.dataset.cvpAccordion = 'true';
        row.classList.toggle('cvp-accordion-open', expanded);
        row.classList.toggle('cvp-accordion-closed', !expanded);
        let toggle = firstCell.querySelector('.cvp-card-toggle');
        if (!toggle) {
          toggle = document.createElement('button');
          toggle.type = 'button';
          toggle.className = 'cvp-card-toggle';
          // The original checkbox stays interactive even when the card is closed.
          firstCell.appendChild(toggle);
          toggle.addEventListener('click', () => {
            const next = !openState.get(id);
            openState.set(id, next);
            row.classList.toggle('cvp-accordion-open', next);
            row.classList.toggle('cvp-accordion-closed', !next);
            toggle.setAttribute('aria-expanded', String(next));
            toggle.querySelector('.cvp-toggle-indicator').textContent = next ? '−' : '+';
            toggle.querySelector('.cvp-toggle-action').textContent = next ? text('মিনিমাইজ করুন','Collapse') : text('বিস্তারিত দেখুন','Expand');
          });
        }
        toggle.setAttribute('aria-expanded', String(expanded));
        toggle.setAttribute('aria-label', text('টিকার বিস্তারিত খুলুন বা বন্ধ করুন: ','Expand or collapse vaccine details: ') + title);
        toggle.replaceChildren();
        const summary = document.createElement('span'); summary.className = 'cvp-card-summary';
        const name = document.createElement('strong'); name.className = 'cvp-card-name'; name.textContent = title;
        const when = document.createElement('small'); when.className = 'cvp-card-date';
        when.textContent = date ? text('পরিকল্পিত: ','Planned: ') + date : text('বিস্তারিত তথ্য','Details');
        summary.append(name,when);
        const action = document.createElement('span'); action.className='cvp-toggle-action'; action.textContent = expanded ? text('মিনিমাইজ করুন','Collapse') : text('বিস্তারিত দেখুন','Expand');
        const icon = document.createElement('span'); icon.className='cvp-toggle-indicator'; icon.setAttribute('aria-hidden','true'); icon.textContent=expanded?'−':'+';
        toggle.append(summary,action,icon);
      }
      defaultSet = true;
    }
    // render() replaces all table rows, including after a date change or tab switch.
    // Observe direct row replacement only, avoiding feedback from v1.6 badge updates.
    new MutationObserver(mutations => {
      if (mutations.some(m => m.target === tbody && m.type === 'childList')) enhance();
    }).observe(tbody, {childList:true});
    window.addEventListener('cvp-language-change', () => queueMicrotask(enhance));
    enhance();
  }

  function init() { installControls(); timelineAccordions(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true});
  else init();
})();
