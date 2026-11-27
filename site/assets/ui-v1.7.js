/* Child Vaccine Planner v1.7 — presentation-only accordion and PWA installation placement.
   Vaccination scheduling, saved records and clinician overrides are not modified. */
(function () {
  'use strict';
  const isEnglish = () => document.documentElement.dataset.cvpLang === 'en' || document.documentElement.lang === 'en';
  const text = (bn, en) => isEnglish() ? en : bn;

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
