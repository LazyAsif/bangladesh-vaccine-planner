/* Called by the isolated Chromium harness in browser-phase1.mjs --phase2. */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

export async function exerciseProfiles({page,rpc,until,profile,upgrade,disconnect,rollback}){
  const a=await page(), run=a.run;
  const F='cvp-profiles-v1',v4='vax-combined-blank-v4',v3='vax-combined-blank-v3';
  const r={name:"  শিশু O'Brien\r\n<i>fixture</i>  ",dob:'2024-01-31',done:{g0:true,g00:true,rv3:false},actual:{g1:'2024-04-10'},ov:{g1:'2024-04-08',rv3:'2024-08-01'},products:{fluHistory:'one'},rotaBrand:'rotarix',t:7};
  const j=JSON.stringify, value=k=>run('localStorage.getItem('+j(k)+')');
  const f=async()=>JSON.parse(await value(F));
  const click=async id=>{
    const ok=await run('(()=>{const e=document.getElementById('+j(id)+');if(!e || e.disabled || e.closest("[inert]") || !e.getClientRects().length)return false;e.click();return true})()');
    assert.ok(ok,'available control '+id);
  };
  const waitFor=async expr=>until(()=>run(expr),expr);
  const settle=()=>waitFor('!document.querySelector("#backup-file").disabled || (document.querySelector("#profile-preview").hidden===false && !document.querySelector("#cancel-profile")?.disabled)');
  const field=(id,v)=>run('(()=>{const e=document.getElementById('+j(id)+');e.value='+j(v)+';e.dispatchEvent(new Event("input",{bubbles:true}))})()');
  const change=async id=>{await run('(()=>{const s=document.querySelector("#profile-select");s.value='+j(id)+';s.dispatchEvent(new Event("change"))})()');await settle()};
  const confirm=async()=>{await click('confirm-profile');await settle()};
  async function choose(raw){
    await run('(()=>{const e=document.querySelector("#backup-file"),d=new DataTransfer();d.items.add(new File(['+j(raw)+'],"synthetic.json",{type:"application/json"}));e.files=d.files;e.dispatchEvent(new Event("change"))})()');
    await settle();
  }
  const preview=()=>run('document.querySelector("#profile-preview").textContent');
  async function download(id,name){
    await click(id);const file=path.join(profile,name);
    await until(()=>fs.existsSync(file),'download '+name);return fs.readFileSync(file,'utf8');
  }
  async function checkZero(fn){
    const before=await run('JSON.stringify({...localStorage})');
    await run('window.qaWrites=0;window.qaOriginal=Storage.prototype.setItem;Storage.prototype.setItem=function(...a){window.qaWrites++;return window.qaOriginal.apply(this,a)}');
    try {await fn();assert.equal(await run('window.qaWrites'),0);assert.equal(await run('JSON.stringify({...localStorage})'),before)}
    finally{await run('Storage.prototype.setItem=window.qaOriginal')}
  }
  if(process.argv.includes('--continuity-only')){
    upgrade();await a.visit('/seed');
    await run('localStorage.setItem('+j(v4)+','+j(j({...r,name:'Phase 1 fixture'}))+');localStorage.setItem('+j(v3)+','+j(j(r))+')');
    await a.visit('/index.html');await waitFor('!!navigator.serviceWorker.controller');
    const selected=await run('(()=>{const f=CVPProfiles.empty();CVPProfiles.add(f,{dob:"2023-04-01"});const id=CVPProfiles.add(f,{dob:"2024-03-01",name:"Phase 2 fixture"});localStorage.setItem(CVPProfiles.key,JSON.stringify(f));return id})()');
    await a.visit('/index.html');await continuity(selected,'2024-03-01');return;
  }
  await a.visit('/seed');
  await run('localStorage.setItem('+j(v4)+','+j(j({...r,name:'older'}))+');localStorage.setItem('+j(v3)+','+j(j(r))+');localStorage.setItem("cvp-language-v1","en")');
  await a.visit('/');
  await waitFor('typeof startRecordPanel==="function" && !document.getElementById("profiles") && navigator.serviceWorker.controller');
  assert.ok((await run('caches.keys()')).includes('bd-child-vax-public-phase1-r3'));
  const old=await page();await old.visit('/');
  upgrade();
  await run('(async()=>{const reg=await navigator.serviceWorker.ready;await reg.update()})()');
  await waitFor('caches.keys().then(keys=>keys.includes("bd-child-vax-public-phase2-r1")&&!keys.includes("bd-child-vax-public-phase1-r3"))');
  await a.visit('/index.html');
  assert.ok(await run('document.querySelector("#migrate-v4")&&!!document.querySelector("#migrate-v3")'));
  await checkZero(async()=>{await click('migrate-v3');assert.match(await preview(),/v3/);await click('cancel-profile')});
  await old.run('localStorage.setItem('+j(v4)+',"bad")');
  await waitFor('!document.querySelector("#migrate-v4") && !!document.querySelector("#copy-v4")');
  await click('migrate-v3');await confirm();
  const migrated=await f(), A=migrated.activeChildId;
  assert.deepEqual(migrated.profilesById[A].record,r);
  assert.equal(await value(v4),'bad');assert.equal(await value(v3),j(r));
  await a.visit('/index.html');await waitFor('!!document.querySelector("#show-legacy")');
  assert.equal(await value(F),j(migrated));assert.equal(await run('!!document.querySelector("#migrate-v3")'),false);
  await old.run('localStorage.setItem('+j(v4)+','+j(j({...r,name:'later old tab'}))+')');
  await waitFor('!!document.querySelector("#migrate-v4")');
  assert.equal(await value(F),j(migrated));
  assert.equal(await run('document.querySelector("#title i")'),null);
  assert.ok(await run('!decodeURIComponent(document.querySelector(".calendar-row-link").href).includes("fixture")'));
  console.log('PASS released Phase 1 r3 upgrade, v3/v4 conflict and cancel zero writes, malformed v4 recovery, verified migration, reload idempotence and later legacy discrepancy');
  await click('add-child');await field('add-dob','2024-03-01');await confirm();
  let family=await f();const B=family.activeChildId;
  assert.notEqual(A,B);
  const blank=family.profilesById[B].record;
  assert.deepEqual(blank.done,{});assert.deepEqual(blank.actual,{});assert.deepEqual(blank.ov,{});assert.deepEqual(blank.products,{});
  assert.equal(blank.rotaBrand,'unknown');assert.equal(await run('document.querySelector("#profile-select").selectedOptions[0].text.includes("Unnamed child")'),true);
  await run('document.querySelector("#s-a").click();document.querySelector("#rows input[type=checkbox][data-id=g0]").click()');await settle();
  await run('const brand=document.querySelector("#rotaBrand");brand.value="rotateq";brand.dispatchEvent(new Event("change"))');await settle();
  for(const [kind,date] of [['actual','2024-06-08'],['ov','2024-06-06']]){
    await run('(()=>{const i=document.querySelector("#rows .'+kind+'[data-id=g1]");i.value='+j(date)+';i.dispatchEvent(new Event("change"))})()');await settle();
  }
  const bClinical=(await f()).profilesById[B].record;
  assert.equal(bClinical.actual.g1,'2024-06-08');assert.equal(bClinical.ov.g1,'2024-06-06');assert.equal(bClinical.rotaBrand,'rotateq');assert.equal(bClinical.done.g0,true);
  assert.deepEqual((await f()).profilesById[A].record,r);
  await click('edit-child');await field('nm','discard me');
  await checkZero(async()=>{await change(A);await click('cancel-profile');assert.equal(await run('document.querySelector("#nm").value'),'discard me')});
  await change(A);await click('discard-switch');await settle();assert.equal((await f()).activeChildId,A);assert.deepEqual((await f()).profilesById[B].record,bClinical);
  await click('edit-child');await field('dob','2024-05-01');await click('go');assert.match(await preview(),/precede/);await confirm();
  const corrected=(await f()).profilesById[A].record;
  assert.deepEqual({...corrected,dob:r.dob,t:r.t},r);
  await click('edit-child');await field('nm','Saved after retry');await change(B);
  await run('window.realWrite=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k===CVPProfiles.key)throw new DOMException("Synthetic quota","QuotaExceededError");return window.realWrite.call(this,k,v)}');
  await click('save-switch');await settle();
  assert.match(await run('document.querySelector("#profile-status").textContent'),/write failed/);
  assert.equal((await f()).activeChildId,A);assert.equal(await run('document.querySelector("#nm").value'),'Saved after retry');
  await run('Storage.prototype.setItem=window.realWrite');await click('save-switch');await settle();
  assert.equal((await f()).activeChildId,B);assert.equal((await f()).profilesById[A].record.name,'Saved after retry');
  console.log('PASS profile isolation, hidden history, exact original name, DOB warning, Save/Discard/Cancel and quota failure with intact draft');
  const familyFile=await download('export-family','cvp-family.json'), childFile=await download('export-child','cvp-child.json');
  const beforeRestore=await f();
  await checkZero(async()=>{await choose(familyFile);assert.match(await preview(),/entire current family/);await click('cancel-profile')});
  for(const raw of [childFile,j({format:'child-vaccine-planner-backup',backupVersion:1,recordSchemaVersion:1,exportedAt:'2025-03-01T00:00:00Z',record:r}),j(r)]){
    await choose(raw);await confirm();const added=await f();
    assert.ok(!beforeRestore.profilesById[added.activeChildId]);
    assert.deepEqual(added.profilesById[added.activeChildId].record,raw===childFile?bClinical:r);
  }
  assert.equal(Object.keys((await f()).profilesById).length,5);
  await checkZero(async()=>{for(const raw of ['{','{"dob":"2024-01-01","dob":"2024-01-02"}',j(r)+' '.repeat(1024*1024)]){
    await choose(raw);assert.equal(await run('document.querySelector("#profile-preview").hidden'),true);
  }});
  await choose(familyFile);
  await run('window.sessionWrite=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(this===sessionStorage)throw Error("unavailable");return sessionWrite.call(this,k,v)}');
  await confirm();assert.match(await run('document.querySelector("#profile-status").textContent'),/recovery copy/);
  assert.equal(Object.keys((await f()).profilesById).length,5);
  await run('Storage.prototype.setItem=window.sessionWrite');await confirm();await a.visit('/index.html');
  const after=await f();assert.deepEqual({...after,revision:beforeRestore.revision},beforeRestore);
  const other=await page();await other.visit('/index.html');
  await choose(childFile);
  await other.run('document.querySelector("#s-a").click();document.querySelector("#rows input[type=checkbox][data-id=g0]").click()');
  await waitFor('document.querySelector("#profile-status").textContent.includes("changed")');
  assert.equal(await run('document.querySelector("#confirm-profile").disabled'),true);
  await click('cancel-profile');await click('reload-family');await settle();
  console.log('PASS real family/child downloads, restore/reload fidelity, same-identity imports, both legacy formats, invalid files, failed session checkpoint and concurrent tab conflict');
  for(const width of [320,360,390,393,412,600,767,768,1280]){
    await rpc('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<=768},a.sessionId);
    for(const lang of ['bn','en'])for(const theme of ['light','dark']){
      await run('cvpLanguage.set('+j(lang)+');if(document.documentElement.dataset.theme!=='+j(theme)+')document.querySelector("#site-theme-button").click()');
      await waitFor('!!document.querySelector("#rows .cvp-card-toggle") || innerWidth>768');
      const metrics=await run(`(()=>{
        const el=id=>document.getElementById(id), rr=x=>x.getBoundingClientRect();
        const btns=[...el("profile-actions").children].map(rr);
        const row=document.querySelector("#rows tr"),toggle=row?.querySelector(".cvp-card-toggle");
        let overlap=false;
        if(toggle&&rr(toggle).height){if(toggle.getAttribute("aria-expanded")!=="true")toggle.click();overlap=rr(row.firstElementChild).bottom>rr(row.querySelector(".name-cell")).top+1;}
        return {lang:document.documentElement.lang,theme:document.documentElement.dataset.theme,title:el("profile-title").textContent,
          overflow:document.documentElement.scrollWidth>innerWidth, short:btns.some(b=>b.height<44),overlap,
          touching:btns.some((r,i)=>btns.slice(i+1).some(b=>r.left<b.right+1&&r.right>b.left-1&&r.top<b.bottom+1&&r.bottom>b.top-1))};
      })()`);
      assert.deepEqual(metrics,{lang,theme,title:lang==='bn'?'আমার শিশুরা':'My Children',overflow:false,short:false,overlap:false,touching:false},width+' '+lang+' '+theme);
      await click('edit-child');
      assert.ok(await run(`(()=>{const group=document.querySelector(".setup-actions"),bounds=group.getBoundingClientRect();
        const buttons=[...group.querySelectorAll("button")].filter(b=>b.getClientRects().length);
        return document.documentElement.scrollWidth<=innerWidth && buttons.every((button,i)=>{
          const b=button.getBoundingClientRect(),range=document.createRange();range.selectNodeContents(button);
          const t=range.getBoundingClientRect();
          if(b.height<44||t.left<b.left-1||t.right>b.right+1||t.bottom>b.bottom+1||t.top<b.top-1)return false;
          if(innerWidth<=600 && (Math.abs(b.left-bounds.left)>1||Math.abs(b.right-bounds.right)>1))return false;
          if(i===0)return true;const prev=buttons[i-1].getBoundingClientRect();
          return Math.abs((b.top===prev.top?b.left-prev.right:b.top-prev.bottom)-14)<1;
        })})()`),'identity actions '+width);
      await click('cancel-edit');
    }
  }
  console.log('PASS 36 viewport/language/theme combinations, touch targets, button separation, overflow and visible accordion layout');
  await click('delete-child');assert.match(await preview(),/removes this child/);await confirm();let rest=await f();
  assert.equal(rest.activeChildId,A);assert.deepEqual(rest.profilesById[A],beforeRestore.profilesById[A]);
  await click('delete-child');await confirm();rest=await f();assert.deepEqual(rest.profilesById,{});assert.equal(rest.activeChildId,null);
  await run('localStorage.setItem(CVPProfiles.key,"damaged")');await a.visit('/index.html');
  assert.ok(await run('!!document.querySelector("#damaged-family")'));assert.equal(await value(F),'damaged');
  await checkZero(async()=>{await choose(familyFile);await click('cancel-profile')});
  await choose(familyFile);await confirm();
  assert.deepEqual((await f()).profilesById,beforeRestore.profilesById);
  await choose(familyFile);
  await run('window.savedSet=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k!==CVPProfiles.key)return savedSet.call(this,k,v)}');
  await confirm();assert.match(await run('document.querySelector("#profile-status").textContent'),/could not be verified/);
  await run('Storage.prototype.setItem=window.savedSet');await a.visit('/index.html');
  assert.ok(await run('!!document.querySelector("#export-pending")'));
  assert.deepEqual(JSON.parse(await download('export-pending','cvp-family-recovery.json')).family.profilesById,beforeRestore.profilesById);
  console.log('PASS targeted deletion, last-child empty state, damaged family and interrupted replacement recovery');
  await continuity(B,bClinical.dob);

  async function continuity(selected,dob){
    const readOnly=await page();
    await rpc('Page.enable',{},readOnly.sessionId);
    await rpc('Page.addScriptToEvaluateOnNewDocument',{source:'Object.defineProperty(navigator,"locks",{value:undefined})'},readOnly.sessionId);
    await readOnly.visit('/index.html');
    assert.equal(await readOnly.run('typeof navigator.locks'),'undefined');
    assert.equal(await readOnly.run('document.querySelector("#add-child").disabled && !document.querySelector("#export-family").disabled'),true);
    const ics=await download('cvp-ics','child-vaccine-planner.ics');assert.match(ics,/BEGIN:VEVENT/);
    assert.ok(ics.includes('DTSTART;VALUE=DATE:'+dob.replaceAll('-','')));
    const cached=await run('caches.open("bd-child-vax-public-phase2-r1").then(async c=>(await c.keys()).map(r=>new URL(r.url).pathname))');
    for(const name of ['profiles-ui.js','profiles-v1.js','profiles-v1.css'])assert.ok(cached.includes('/assets/'+name));
    disconnect();const pwa=await page();await pwa.visit('/index.html');
    assert.equal(await pwa.run('S.dob'),dob);assert.equal(await pwa.run('document.querySelector("#profile-select").value'),selected);
    for(const route of ['/centres/index.html','/articles/index.html']){await pwa.visit(route);assert.ok(await pwa.run('document.querySelector("main")?.innerText.length>30'))}
    console.log('PASS Web Locks fallback, selected child calendar download, cached assets and offline PWA reopen/navigation');
    const savedFamily=await value(F), savedV3=await value(v3), savedV4=await value(v4);
    rollback();
    const updateWorker=()=>run('(async()=>{const reg=await navigator.serviceWorker.ready;await reg.update()})()');
    await updateWorker();
    await waitFor('caches.keys().then(k=>k.includes("bd-child-vax-public-phase1-r3")&&!k.includes("bd-child-vax-public-phase2-r1"))');
    await a.visit('/index.html');
    assert.equal(await run('!document.querySelector("#profiles") && S.name===JSON.parse(localStorage.getItem(CVPBackup.keys[0])).name'),true);
    assert.equal(await value(F),savedFamily);
    upgrade();await updateWorker();
    await waitFor('caches.keys().then(k=>k.includes("bd-child-vax-public-phase2-r1")&&!k.includes("bd-child-vax-public-phase1-r3"))');
    await a.visit('/index.html');
    assert.equal(await run('document.querySelector("#profile-select").value'),selected);
    assert.equal(await value(F),savedFamily);assert.equal(await value(v3),savedV3);assert.equal(await value(v4),savedV4);
    console.log('PASS code rollback to released Phase 1 reads legacy record; Phase 2 re-upgrade retains all three stored values and active selection');
  }
}
