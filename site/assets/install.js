/* Bangladesh Child Vaccine Planner - user-initiated PWA install helper.
   Native prompt is only possible when the browser supplies beforeinstallprompt.
   No telemetry, no remote calls, no persistent flags. */
(function () {
  'use strict';
  var promptEvent = null;
  var overlay = null;
  var lastFocused = null;
  var button = document.getElementById('site-install-button');
  if (!button) return;

  var text = {
    bn: {
      button: '⬇ অ্যাপ ইনস্টল', title: 'হোম স্ক্রিনে অ্যাপ যোগ করুন', close: 'বন্ধ করুন',
      installed: 'আপনি ইতিমধ্যে ইনস্টল করা অ্যাপের ভেতরে আছেন। নতুন করে ইনস্টল করার প্রয়োজন নেই।',
      unavailable: 'Chrome এখন সরাসরি ইনস্টল করার অনুমতি দিচ্ছে না। এটি আপনার ফোনের সমস্যা নয়। নিচের পদ্ধতিতে ইনস্টল করুন।',
      cancelled: 'ইনস্টল বাতিল হয়েছে। চাইলে আবার মেনুতে চাপতে পারেন।',
      error: 'Chrome ইনস্টল উইন্ডো খুলতে পারেনি। নিচের ম্যানুয়াল পদ্ধতি ব্যবহার করুন।',
      accepted: 'ইনস্টল অনুরোধ গ্রহণ করা হয়েছে। অ্যাপ আইকন তৈরি হতে কিছুটা সময় লাগতে পারে।',
      success: 'অ্যাপ ইনস্টল হয়েছে। Home Screen বা app drawer-এ দেখুন।',
      androidTitle: 'Android Chrome:',
      androidSteps: ['Chrome-এ ওয়েবসাইটটি সরাসরি খুলুন; Facebook বা Messenger-এর ভেতর নয়।',
        'Chrome-এর ⋮ (তিন ডট) মেনু চাপুন।',
        '“Install app” অথবা “Add to Home screen” → “Install” নির্বাচন করুন।',
        'Home Screen ও App Drawer—দুই জায়গায় আইকন খুঁজে দেখুন।'],
      iosTitle: 'iPhone / iPad Safari:',
      iosSteps: ['Safari-তে এই ওয়েবসাইট খুলুন।', 'Share বাটন চাপুন।',
        '“Add to Home Screen” নির্বাচন করুন।', '“Open as Web App” থাকলে চালু রেখে Add চাপুন।'],
      desktopTitle: 'Windows / Mac Chrome বা Edge:',
      desktopSteps: ['Address bar-এর Install আইকনে ক্লিক করুন অথবা browser-এর menu খুলুন।',
        '“Install app” নির্বাচন করে নিশ্চিত করুন।'],
      detail: 'ব্রাউজার উপযুক্ত মনে করলে তবেই ওয়েবসাইট থেকে সরাসরি ইনস্টল উইন্ডো খোলা যায়। Chrome-এর নিজস্ব মেনু থেকে ইনস্টল করা স্বাভাবিক এবং সমানভাবে বৈধ।',
      noWidget: 'এটি PWA অ্যাপ/শর্টকাট, ফোনের আলাদা native widget নয়।'
    },
    en: {
      button: '⬇ Install App', title: 'Add the app to your Home Screen', close: 'Close',
      installed: 'You are already running the installed app. There is no need to install it again.',
      unavailable: 'Chrome is not offering an in-page installation prompt right now. Use the browser menu steps below instead.',
      cancelled: 'Installation was cancelled. You can try again from the menu.',
      error: 'Chrome could not show the install prompt. Use the manual browser steps below.',
      accepted: 'Installation was accepted. The app icon may take a moment to appear.',
      success: 'App installed. Look on your Home Screen or in your app drawer.',
      androidTitle: 'Android Chrome:',
      androidSteps: ['Open this website directly in Chrome, not inside Facebook or Messenger.',
        'Tap the Chrome three-dot (⋮) menu.', 'Choose “Install app”, or “Add to Home screen” → “Install”.',
        'Check both the Home Screen and the app drawer for the icon.'],
      iosTitle: 'iPhone / iPad Safari:',
      iosSteps: ['Open this website in Safari.', 'Tap Share.', 'Choose “Add to Home Screen”.',
        'Enable “Open as Web App” if available, then tap Add.'],
      desktopTitle: 'Windows / Mac Chrome or Edge:',
      desktopSteps: ['Select the Install icon in the address bar, or open your browser menu.',
        'Choose “Install app” and confirm.'],
      detail: 'The website can open a native install prompt only when the browser offers that feature. Installing through the browser menu is equally valid.',
      noWidget: 'This is a PWA app or shortcut, not a separate native home-screen widget.'
    }
  };
  function currentLanguage() {
    return document.documentElement.lang === 'en' || document.body.classList.contains('en') ? 'en' : 'bn';
  }
  function isInstalledWindow() {
    return !!(window.matchMedia && (
      window.matchMedia('(display-mode: standalone)').matches ||
      window.matchMedia('(display-mode: fullscreen)').matches
    )) || navigator.standalone === true;
  }
  function platform() {
    var ua = navigator.userAgent || '';
    if (/iPhone|iPad|iPod/i.test(ua) || (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1)) return 'ios';
    if (/Android/i.test(ua)) return 'android';
    return 'desktop';
  }
  function element(tag, value) {
    var n = document.createElement(tag); n.textContent = value; return n;
  }
  function ensureOverlay() {
    if (overlay) return;
    overlay = document.createElement('div');
    overlay.className = 'install-overlay'; overlay.hidden = true;
    overlay.innerHTML = '<section class="install-panel" role="dialog" aria-modal="true" aria-labelledby="install-heading" tabindex="-1"><button class="install-close" type="button" aria-label="Close">×</button><h2 id="install-heading"></h2><div id="install-copy"></div></section>';
    document.body.appendChild(overlay);
    overlay.querySelector('.install-close').addEventListener('click', close);
    overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });
    overlay.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { close(); return; }
      if (e.key !== 'Tab') return;
      var focusable = overlay.querySelector('.install-close');
      if (focusable) { e.preventDefault(); focusable.focus(); }
    });
  }
  function close() {
    if (!overlay) return;
    overlay.hidden = true;
    document.body.style.overflow = '';
    if (lastFocused && document.contains(lastFocused)) lastFocused.focus();
  }
  function show(reason) {
    ensureOverlay();
    var t = text[currentLanguage()];
    var copy = overlay.querySelector('#install-copy');
    var p = platform();
    lastFocused = document.activeElement;
    overlay.querySelector('#install-heading').textContent = t.title;
    overlay.querySelector('.install-close').setAttribute('aria-label', t.close);
    copy.replaceChildren();
    if (isInstalledWindow()) {
      copy.appendChild(element('p', t.installed));
    } else {
      var intro = reason === 'cancelled' ? t.cancelled :
                  reason === 'error' ? t.error :
                  reason === 'accepted' ? t.accepted :
                  reason === 'success' ? t.success : t.unavailable;
      copy.appendChild(element('p', intro));
      if (reason !== 'accepted' && reason !== 'success') {
        var heading = p === 'ios' ? t.iosTitle : p === 'android' ? t.androidTitle : t.desktopTitle;
        var steps = p === 'ios' ? t.iosSteps : p === 'android' ? t.androidSteps : t.desktopSteps;
        copy.appendChild(element('strong', heading));
        var list = document.createElement('ol');
        steps.forEach(function (step) { list.appendChild(element('li', step)); });
        copy.appendChild(list);
      }
      var detail = element('p', t.detail + ' ' + t.noWidget);
      detail.className = 'install-help'; copy.appendChild(detail);
    }
    overlay.hidden = false;
    document.body.style.overflow = 'hidden';
    overlay.querySelector('.install-close').focus();
  }
  function tryPrompt() {
    if (isInstalledWindow()) { show('installed'); return; }
    if (!promptEvent) { show('unavailable'); return; }
    // Important: prompt() is invoked synchronously in the actual click handler,
    // preserving Chrome's transient user activation on Android.
    var e = promptEvent;
    promptEvent = null; // The browser event may only be used once.
    try {
      var result = e.prompt();
      Promise.resolve(e.userChoice || result).then(function (choice) {
        if (choice && choice.outcome === 'accepted') {
          show('accepted');
        } else if (choice && choice.outcome === 'dismissed') {
          show('cancelled');
        }
      }).catch(function () { show('error'); });
    } catch (_) { show('error'); }
  }
  // Capture browser permission when Chrome decides the PWA is installable.
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    promptEvent = e;
  });
  window.addEventListener('appinstalled', function () {
    promptEvent = null;
    if (overlay && !overlay.hidden) show('success');
  });
  button.addEventListener('click', tryPrompt);
  function updateLabel() { button.textContent = text[currentLanguage()].button; }
  updateLabel();
  new MutationObserver(updateLabel).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
})();
