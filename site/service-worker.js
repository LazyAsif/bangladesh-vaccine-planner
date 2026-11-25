// Child Vaccine Planner Phase 1 — offline PWA, no personal-data caching
const CACHE='bd-child-vax-public-phase1-r2';
const SHELL=['/','/index.html','/manifest.webmanifest','/assets/site.css','/assets/ui-v1.6.css','/assets/ui-v1.6.js','/assets/ui-v1.7.css','/assets/ui-v1.7.js','/assets/ui-v1.8.css','/assets/mobile-v1.9.css','/assets/mobile-v1.10.css','/assets/backup-v1.js','/assets/backup-v1.css','/assets/header-v1.4.css','/assets/header-v1.4.js','/assets/language-v1.5.css','/assets/language-v1.5.js','/assets/install.css','/assets/install.js','/assets/theme.css','/assets/theme.js'];
const EXTRA=['/assets/logo.svg','/assets/hero-family-v1.8.svg','/assets/icons/icon-192.png','/assets/icons/icon-512.png','/assets/icons/icon-192-maskable.png','/assets/icons/icon-512-maskable.png','/assets/social-preview.png','/assets/centres.js','/assets/private-centres.js','/assets/private-centres.json','/assets/districts.json','/centres/','/articles/','/articles/bcg/','/articles/six-weeks/','/articles/missed-vaccine/','/articles/rotavirus/','/articles/mr-mmr/','/articles/typhoid/','/about/','/privacy/','/contact/','/medical-disclaimer/','/sources/'];
const REQUIRED_DIRECTORY=['/centres/','/articles/','/assets/centres.js','/assets/private-centres.js','/assets/private-centres.json','/assets/districts.json'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(async cache=>{
  await cache.addAll([...SHELL,...REQUIRED_DIRECTORY]);
  await Promise.allSettled(EXTRA.filter(url=>!REQUIRED_DIRECTORY.includes(url)).map(url=>cache.add(url)));
}).then(()=>self.skipWaiting()));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('bd-child-vax-public-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{
 const req=event.request;if(req.method!=='GET'||new URL(req.url).origin!==self.location.origin)return;
 // Never cache routes that might contain personal data; this site currently only caches public static files.
 event.respondWith(fetch(req).then(response=>{
   if(response.ok && response.type!=='opaque' && !req.url.includes('/sitemap.xml') && !req.url.includes('/robots.txt')){
      const copy=response.clone();event.waitUntil(caches.open(CACHE).then(cache=>cache.put(req,copy)).catch(()=>{}));
   }return response;
 }).catch(async()=>{
   const cache=await caches.open(CACHE);
   let hit=await cache.match(req);
   if(req.mode==='navigate'){
     // Links use explicit index.html as well as the directory URLs in the precache.
     const path=new URL(req.url).pathname;
     if(!hit && path.endsWith('/index.html')) hit=await cache.match(path.slice(0,-10));
     if(hit?.redirected) return new Response(hit.body,{status:hit.status,headers:hit.headers});
     if(!hit) return new Response('পাতাটি অফলাইনে পাওয়া যাচ্ছে না। / This page is unavailable offline.',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}});
   }
   return hit || Response.error();
 }));
});
