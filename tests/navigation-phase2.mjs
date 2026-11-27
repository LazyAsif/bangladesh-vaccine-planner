/* Run via browser-phase1.mjs --phase2 --navigation-only in a disposable Chromium profile. */
import assert from 'node:assert/strict';

export async function checkNavigation({page,rpc,until,disconnect}){
  const a=await page(),run=a.run;
  const prefs='cvp-install-dismiss-until-v1', familyKey='cvp-profiles-v1';
  const offer=`(()=>{const e=new Event('beforeinstallprompt',{cancelable:true});e.prompt=()=>{window.nativeCalls=(window.nativeCalls||0)+1};e.userChoice=Promise.resolve({outcome:'dismissed'});window.dispatchEvent(e)})()`;
  async function configure(p,source=''){
    await rpc('Page.enable',{},p.sessionId);
    await rpc('Page.addScriptToEvaluateOnNewDocument',{source:"addEventListener('beforeinstallprompt',e=>{if(e.isTrusted){e.preventDefault();e.stopImmediatePropagation()}},true);"+source},p.sessionId);
  }
  await configure(a);await a.visit('/index.html');await a.visit('/articles/index.html');
  await run('dispatchEvent(new Event("beforeinstallprompt",{cancelable:true}))');
  assert.equal(await run('getComputedStyle(document.querySelector("#site-install-button")).display'),'none');
  await run(offer);
  assert.equal(await run('!!document.querySelector(".cvp-install-nudge")'),true);
  const before=Date.now();
  await run('document.querySelector(".cvp-install-nudge button:last-child").click()');
  const expires=Number(await run('localStorage.getItem('+JSON.stringify(prefs)+')'));
  assert.ok(expires>=before+30*86400000 && expires<=Date.now()+30*86400000);
  for(const path of ['/centres/index.html','/index.html','/index.html']){
    await a.visit(path);await run(offer);
    assert.equal(await run('!!document.querySelector(".cvp-install-nudge")'),false);
    assert.ok(await run('document.documentElement.hasAttribute("data-cvp-install-action")'));
  }
  const reopened=await page();await configure(reopened);await reopened.visit('/index.html');await reopened.visit('/centres/index.html');await reopened.run(offer);
  assert.equal(await reopened.run('!!document.querySelector(".cvp-install-nudge")'),false);
  await reopened.run('document.querySelector("#site-install-button").click()');
  assert.equal(await reopened.run('window.nativeCalls'),1);
  assert.equal(await reopened.run('document.documentElement.hasAttribute("data-cvp-install-action")'),false);
  await run('for(const store of [localStorage,sessionStorage])store.setItem('+JSON.stringify(prefs)+',String(Date.now()-1))');
  await a.visit('/about/index.html');await run(offer);assert.ok(await run('!!document.querySelector(".cvp-install-nudge")'));
  await run('document.querySelector(".cvp-install-nudge button:last-child").click()');
  const installed=await page();await configure(installed,"Object.defineProperty(navigator,'standalone',{value:true})");await installed.visit('/index.html');await installed.run(offer);
  assert.ok(await installed.run('!document.documentElement.hasAttribute("data-cvp-install-action")&&!document.querySelector(".cvp-install-nudge")'));
  await run('localStorage.setItem('+JSON.stringify(prefs)+',String(Date.now()-1))');
  const denied=await page();await configure(denied,"const set=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(this===localStorage)throw new DOMException('Fixture quota','QuotaExceededError');return set.call(this,k,v)}");
  await denied.visit('/index.html');await denied.visit('/articles/index.html');await denied.run(offer);
  assert.ok(await denied.run('document.documentElement.hasAttribute("data-cvp-install-action")&&!document.querySelector(".cvp-install-nudge")'));
  const ios=await page();await configure(ios,"Object.defineProperty(navigator,'userAgent',{value:'Mozilla/5.0 (iPhone) Version/17.0 Mobile Safari/604.1'});Object.defineProperty(navigator,'share',{value:()=>{}})");
  await ios.visit('/index.html');await ios.run('cvpLanguage.set("en");document.querySelector("#site-install-button").click()');
  assert.ok(await ios.run('document.querySelector(".install-panel").innerText.includes("Add to Home Screen")'));
  console.log('PASS absent, offered, dismissed and expired install actions, 30-day navigation/reload and new-tab suppression, simulated installed mode, manual iOS guidance and denied writes');

  await a.visit('/index.html');
  const ids=await run(`(()=>{const f=CVPProfiles.empty(),ids=[];
    for(const name of ['',null,'River']){const r={dob:'2024-11-05',done:{g1:!!name}};if(name!==null)r.name=name;ids.push(CVPProfiles.add(f,r))}
    localStorage.setItem(CVPProfiles.key,JSON.stringify(f));cvpLanguage.set('en');return ids})()`);
  await a.visit('/index.html');
  const labels=()=>run('[...document.querySelector("#profile-select").options].map(o=>o.textContent)');
  const expected=['Unnamed child 1 · 5 Nov 2024','Unnamed child 2 · 5 Nov 2024','River · 5 Nov 2024'];
  assert.deepEqual(await labels(),expected);
  const original=await run('JSON.parse(localStorage.getItem(CVPProfiles.key)).profilesById');
  await run('const sel=document.querySelector("#profile-select");sel.value='+JSON.stringify(ids[1])+';sel.dispatchEvent(new Event("change"))');
  await until(()=>run('JSON.parse(localStorage.getItem(CVPProfiles.key)).activeChildId==='+JSON.stringify(ids[1])),'switch');
  assert.deepEqual(await run('JSON.parse(localStorage.getItem(CVPProfiles.key)).profilesById'),original);
  await a.visit('/index.html');assert.deepEqual(await labels(),expected);
  await run('cvpLanguage.set("bn");location.hash="profiles"');assert.match((await labels())[1],/নামহীন শিশু ২ · .*২০২৪/);
  await run('document.querySelector("#delete-child").click()');
  assert.match(await run('document.querySelector("#profile-preview").textContent'),/নামহীন শিশু ২/);
  for(const id of ids)assert.ok(!(await run('document.body.innerText')).includes(id.slice(-8)));
  await run('document.querySelector("#cancel-profile").click();cvpLanguage.set("en");const s=document.querySelector("#profile-select");s.value='+JSON.stringify(ids[0])+';s.dispatchEvent(new Event("change"))');
  await until(()=>run('JSON.parse(localStorage.getItem(CVPProfiles.key)).activeChildId==='+JSON.stringify(ids[0])),'switch first');
  await run('document.querySelector("#delete-child").click();document.querySelector("#confirm-profile").click()');
  await until(()=>run('Object.keys(JSON.parse(localStorage.getItem(CVPProfiles.key)).profilesById).length===2'),'delete one synthetic child');
  await a.visit('/index.html');assert.deepEqual(await labels(),expected.slice(1));
  const summary=await run('(()=>{const c=document.querySelector("#info div:last-child");return [document.querySelector("#cvp-next-text").textContent,c.querySelector("b").textContent,c.querySelector("time").textContent]})()');
  assert.equal(summary[0],summary[1]+' · '+summary[2]);
  console.log('PASS friendly bilingual DOB labels, stable duplicate numbers after switch/reload/deletion, exact record isolation and separated next dose/date');

  const en=['See Chart','Articles','Sources','Vaccine Centres','My Children','Backup & Restore','About','Privacy','Contact'];
  const bn=['চার্ট দেখুন','নিবন্ধ','উৎস','টিকাদান কেন্দ্র','আমার শিশুরা','ব্যাকআপ ও পুনরুদ্ধার','সম্পর্কে','গোপনীয়তা','যোগাযোগ'];
  for(const path of ['/index.html','/articles/bcg/index.html','/sources/index.html','/centres/index.html','/about/index.html','/privacy/index.html','/contact/index.html','/medical-disclaimer/index.html','/404.html']){
    await a.visit(path);
    for(const lang of ['en','bn']){
      await run('cvpLanguage.set('+JSON.stringify(lang)+')');
      for(const menu of ['#site-menu-panel','.cvp-more-dialog']){
        const items=await run('[...document.querySelectorAll("'+menu+' > a")].map(a=>a.querySelector(".cvp-only-'+lang+'").textContent)');
        assert.deepEqual(items,lang==='en'?en:bn,path+' '+menu);
        assert.equal(await run('document.querySelectorAll("'+menu+' > a")[3].pathname'),'/centres/index.html');
      }
    }
  }
  await a.visit('/index.html');
  for(const width of [320,768,1201,1440]){
    await rpc('Emulation.setDeviceMetricsOverride',{width,height:800,deviceScaleFactor:1,mobile:width<=767},a.sessionId);
    for(const hash of ['#chart','#profiles','#backup-panel']){
      await run('location.hash='+JSON.stringify(hash));
      const visible=await run(`(()=>{
        const mobile=innerWidth<=767,toggle=document.querySelector(".site-menu-toggle");
        if(mobile)document.querySelector(".cvp-mobnav button").click();
        else if(toggle.getClientRects().length && toggle.getAttribute("aria-expanded")!=="true")toggle.click();
        const menu=document.querySelector(mobile?".cvp-more-dialog":"#site-menu-panel");
        const links=[...menu.querySelectorAll(":scope > a")];const all=links.every(a=>{const r=a.getBoundingClientRect();return r.width>0 && r.left>=-1 && r.right<=innerWidth+1});
        if(mobile)document.querySelector(".cvp-more-close").click();return all;
      })()`);assert.ok(visible,width+' '+hash);
    }
  }
  await until(()=>run('!!navigator.serviceWorker.controller'),'offline ready');disconnect();await a.visit('/index.html');
  assert.equal(await run('["government","private"].every(k=>document.querySelector(\'a[href$="#\'+k+\'"]\')?.pathname==="/centres/index.html")'),true);
  await run('document.querySelectorAll("#site-menu-panel > a")[3].click()');
  await until(()=>run('location.pathname==="/centres/index.html" && document.readyState==="complete" && document.querySelector("#privateDivision")?.options.length>1'),'cached centres directory initialized');
  await run('document.getElementById("showGov").click()');assert.equal(await run('location.hash'),'#government');
  await run('document.getElementById("showPrivate").click()');assert.equal(await run('location.hash'),'#private');
  await a.visit('/unavailable/index.html');assert.ok(await run('document.body.textContent.includes("unavailable offline")'));
  console.log('PASS nine links in exact desktop/More order, both languages, chart/profile/backup visibility, nested pages, government/private routes and offline Centres');
}
