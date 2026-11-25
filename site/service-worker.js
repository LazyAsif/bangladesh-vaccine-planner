// Child Vaccine Planner v1.9 — offline PWA, no personal-data caching
const CACHE='bd-child-vax-public-v1.9';
const SHELL=['/','/index.html','/manifest.webmanifest','/assets/site.css','/assets/ui-v1.6.css','/assets/ui-v1.6.js','/assets/ui-v1.7.css','/assets/ui-v1.7.js','/assets/ui-v1.8.css','/assets/mobile-v1.9.css','/assets/header-v1.4.css','/assets/header-v1.4.js','/assets/language-v1.5.css','/assets/language-v1.5.js','/assets/install.css','/assets/install.js','/assets/theme.css','/assets/theme.js'];
const EXTRA=['/assets/logo.svg','/assets/hero-family-v1.8.svg','/assets/icons/icon-192.png','/assets/icons/icon-512.png','/assets/icons/icon-192-maskable.png','/assets/icons/icon-512-maskable.png','/assets/social-preview.png','/assets/centres.js','/assets/private-centres.js','/assets/private-centres.json','/assets/districts.json','/centres/','/articles/','/articles/bcg/','/articles/six-weeks/','/articles/missed-vaccine/','/articles/rotavirus/','/articles/mr-mmr/','/articles/typhoid/','/about/','/privacy/','/contact/','/medical-disclaimer/','/sources/'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(async cache=>{
  await cache.addAll(SHELL); // Critical shell must be complete.
  await Promise.allSettled(EXTRA.map(url=>cache.add(url)));
}).then(()=>self.skipWaiting()));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('bd-child-vax-public-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{
 const req=event.request;if(req.method!=='GET'||new URL(req.url).origin!==self.location.origin)return;
 // Never cache routes that might contain personal data; this site currently only caches public static files.
 event.respondWith(fetch(req).then(response=>{
   if(response.ok && response.type!=='opaque' && !req.url.includes('/sitemap.xml') && !req.url.includes('/robots.txt')){
      const copy=response.clone();event.waitUntil(caches.open(CACHE).then(cache=>cache.put(req,copy)).catch(()=>{}));
   }return response;
 }).catch(async()=> (await caches.match(req)) || (req.mode==='navigate'?await caches.match('/'):Response.error())));
});
