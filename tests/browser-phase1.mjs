/* Isolated loopback integration test. Never attach to an existing browser/profile. */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import https from 'node:https';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';

const site=fileURLToPath(new URL('../site/',import.meta.url));
const binary=[process.env.CVP_TEST_BROWSER,'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe','/usr/bin/chromium'].find(p=>p && fs.existsSync(p));
if (!binary) throw Error('Set CVP_TEST_BROWSER to a Chromium executable.');
const temp=fs.realpathSync(os.tmpdir()),profile=fs.mkdtempSync(path.join(temp,'cvp-browser-'));
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.webmanifest':'application/manifest+json'};
let legacy=true, offline=false;
const legacySite=process.env.CVP_V110_SITE && path.resolve(process.env.CVP_V110_SITE);
const tls=process.env.CVP_TEST_PFX;
const serve=(req,res)=>{
  if (offline) {req.socket.destroy();return;}
  const route=new URL(req.url,'http://localhost').pathname;
  res.setHeader('Cache-Control','no-store');
  if (route==='/seed') {res.setHeader('Content-Type','text/html');res.end('<title>Synthetic fixture</title>');return;}
  if (route==='/service-worker.js' && legacy && !legacySite) {
    res.setHeader('Content-Type','text/javascript');
    res.end("self.addEventListener('install',e=>e.waitUntil(caches.open('bd-child-vax-public-v1.10').then(()=>self.skipWaiting())));self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));");return;
  }
  const root=legacy && legacySite ? legacySite : site;
  const file=path.resolve(root,'.'+route+(route.endsWith('/')?'index.html':''));
  if(!file.startsWith(path.resolve(root)+path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()){res.writeHead(404);res.end();return;}
  res.setHeader('Content-Type',mime[path.extname(file)] || 'application/octet-stream');res.end(fs.readFileSync(file));
};
const server=tls ? https.createServer({pfx:Buffer.from(tls,'base64'),passphrase:''},serve) : http.createServer(serve);
await new Promise((resolve,reject)=>server.once('error',reject).listen(0,'127.0.0.1',resolve));
const origin=(tls?'https':'http')+'://127.0.0.1:'+server.address().port;
const browser=spawn(binary,['--headless',...(tls?['--ignore-certificate-errors']:[]),'--disable-gpu','--disable-background-networking','--disable-component-update','--no-first-run','--no-default-browser-check',
  '--proxy-server=127.0.0.1:9','--proxy-bypass-list=127.0.0.1;localhost','--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'],
  {windowsHide:true,stdio:['ignore','ignore','pipe']});
let errors='',launchError;
browser.stderr.on('data',d=>{errors=(errors+d).slice(-1800);});
browser.on('error',e=>{launchError=e;});
const pause=ms=>new Promise(r=>setTimeout(r,ms));
async function until(fn,label) {
  for(let i=0;i<120;i++) {if(await fn())return;await pause(100);}
  throw Error(label);
}
let ws;
try {
  const portFile=path.join(profile,'DevToolsActivePort');
  await until(()=>{if(launchError || browser.exitCode!==null)throw Error(String(launchError || errors));return fs.existsSync(portFile);},'Browser startup: '+errors);
  const [port,socket]=fs.readFileSync(portFile,'utf8').trim().split(/\r?\n/);
  ws=new WebSocket('ws://127.0.0.1:'+port+socket);await once(ws,'open');
  let id=0;const pending=new Map();
  function rpc(method,params={},sessionId) {
    return new Promise((resolve,reject)=>{
      const n=++id,timer=setTimeout(()=>{pending.delete(n);reject(Error('Timed out: '+method));},15000);
      pending.set(n,msg=>{clearTimeout(timer);if(msg.error)reject(Error(msg.error.message));else resolve(msg.result);});
      ws.send(JSON.stringify({id:n,method,params,sessionId}));
    });
  }
  ws.addEventListener('message',e=>{const msg=JSON.parse(e.data);if(!pending.has(msg.id))return;pending.get(msg.id)(msg);pending.delete(msg.id);});
  async function page() {
    const {targetId}=await rpc('Target.createTarget',{url:'about:blank'});
    const {sessionId}=await rpc('Target.attachToTarget',{targetId,flatten:true});
    async function run(expression) {
      const r=await rpc('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true},sessionId);
      if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
      return r.result.value;
    }
    async function visit(url) {
      await rpc('Page.navigate',{url:origin+url},sessionId);
      await until(()=>run('location.pathname==='+JSON.stringify(url)+' && document.readyState==="complete"'),'load '+url);
    }
    return {run,visit,sessionId};
  }
  await rpc('Browser.setDownloadBehavior',{behavior:'allow',downloadPath:profile});
  const a=await page(),run=a.run;
  const saved={dob:'2024-01-31',name:"শিশু O'Brien\r\n\t<i>text</i>",done:{g0:true,rv3:false,g00:false},
    actual:{g1:'2024-04-10'},ov:{g1:'2024-04-08'},rotaBrand:'rotarix',products:{fluHistory:'one'},t:7};
  await a.visit('/seed');
  let oldTab;
  if(legacySite){
    await run("localStorage.setItem('vax-combined-blank-v4',"+JSON.stringify(JSON.stringify({...saved,name:'Legacy tab fixture'}))+")");
    oldTab=await page(); await oldTab.visit('/');
    assert.equal(await oldTab.run('typeof persist'), 'function');
  }
  await run("localStorage.setItem('vax-combined-blank-v4','{'); localStorage.setItem('cvp-language-v1','en');localStorage.setItem('vax-combined-blank-v3',"+JSON.stringify(JSON.stringify(saved))+")");
  await run("(async()=>{await navigator.serviceWorker.register('/service-worker.js');await navigator.serviceWorker.ready;return true})()");
  legacy=false;
  await a.visit('/');
  await run('window.testWrites=[];window.realSet=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){testWrites.push(k);return realSet.call(this,k,v)};window.confirm=()=>true;');
  await run("for(const method of ['removeItem','clear']){const original=Storage.prototype[method];Storage.prototype[method]=function(...args){testWrites.push(method);return original.apply(this,args)}}");
  assert.equal(await run('document.querySelector("#edit").disabled'),true);
  assert.equal(await run('S.dob'),saved.dob);
  async function choose(text) {
    await run('(()=>{const dt=new DataTransfer();dt.items.add(new File(['+JSON.stringify(text)+'], "synthetic.json"));const f=document.querySelector("#backup-file");f.files=dt.files;f.dispatchEvent(new Event("change"));})()');
  }
  async function acknowledge() {
    await run("(()=>{const ack=document.querySelector('#closed-old-tabs');if(ack && !ack.checked)ack.click()})()");
  }
  await choose('{"dob":"2024-01-01","dob":"2024-02-01"}');
  await until(()=>run('document.querySelector("#backup-status").textContent.includes("Duplicate")'),'duplicate message');
  const file=await run('CVPBackup.buildBackup(S)');
  await choose(file);
  await until(()=>run('!!document.querySelector("#confirm-restore")'),'file preview');
  await run("document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'}))");
  assert.deepEqual(await run('testWrites'),[]);
  // Capture the actual user-facing backup download from the recovery candidate.
  await run('window.madeBlob=null;window.createURL=URL.createObjectURL.bind(URL);URL.createObjectURL=b=>{madeBlob=b;return createURL(b)};document.querySelector("#exportBackup").click()');
  const exported=await run('madeBlob.text()');
  assert.deepEqual(JSON.parse(exported).record,saved);
  await choose(exported);
  await until(()=>run('!!document.querySelector("#confirm-restore")'),'exported preview');
  assert.equal(await run('document.querySelector("#confirm-restore").disabled'),true);
  await acknowledge();
  await run('document.querySelector("#confirm-restore").click()');
  await until(()=>run('document.querySelector("#backup-status").textContent.includes("Restore verified")'),'restore');
  assert.deepEqual(await run('JSON.parse(localStorage.getItem(CVPBackup.keys[0]))'),saved);
  assert.equal(await run('document.querySelector("#edit").disabled'),false);
  assert.deepEqual(await run('testWrites'),['cvp-phase1-restore-recovery','vax-combined-blank-v4']);
  const reopened=await page();await reopened.visit('/');
  assert.deepEqual(await reopened.run('CVPBackup.selected(CVPBackup.readCandidates(localStorage)).record'),saved);
  assert.deepEqual(await reopened.run("({done:S.done.g0,noDate:!('g0' in S.actual),hidden:!document.querySelector('.actual[data-id=rv3]'),actual:S.actual.g1,confirmed:S.ov.g1})"),
    {done:true,noDate:true,hidden:true,actual:saved.actual.g1,confirmed:saved.ov.g1});
  assert.equal(await run('new URL(document.querySelector(".calendar-row-link").href).searchParams.get("text").startsWith(S.name)'),true);
  assert.equal(await run('document.getElementById("title").querySelector("i")===null'),true);
  console.log('PASS recovery, duplicate rejection, cancel, export/import, verify and safe calendar link');
  await reopened.run("document.querySelector('#edit').click()");
  function measureActions() {
    const group=document.querySelector('.setup-actions');
    const bounds=group.getBoundingClientRect();
    const buttons=Array.from(group.querySelectorAll('button'),button=>{
      const box=button.getBoundingClientRect(), range=document.createRange();
      range.selectNodeContents(button);
      const text=range.getBoundingClientRect();
      return {x:box.left,y:box.top,right:box.right,bottom:box.bottom,height:box.height,
        fits:text.width>0 && text.left>=box.left-1 && text.right<=box.right+1 && text.top>=box.top-1 && text.bottom<=box.bottom+1};
    });
    return {buttons,left:bounds.left,right:bounds.right,scroll:document.documentElement.scrollWidth};
  }
  for(const width of [320,360,390,393,412,600,768,1280]){
    await rpc('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<=768},reopened.sessionId);
    for(const language of ['bn','en']) for(const theme of ['dark','light']){
      await reopened.run('cvpLanguage.set('+JSON.stringify(language)+');if(document.documentElement.dataset.theme!== '+JSON.stringify(theme)+')document.querySelector("#site-theme-button").click()');
      const layout=await reopened.run('('+measureActions.toString()+')()');
      const label=[width,language,theme].join(' ');
      assert(layout.scroll<=width,label+' overflow');
      const [primary,backup]=layout.buttons;
      for(const [i,button] of layout.buttons.entries()){
        assert(button.height>=44 && button.fits,label+' touch target or text bounds');
        if(width<=600) assert(Math.abs(button.x-layout.left)<1 && Math.abs(button.right-layout.right)<1,label+' full width');
        if(i){
          const previous=layout.buttons[i-1],sameRow=button.y===previous.y;
          const gap=sameRow ? button.x-previous.right : button.y-previous.bottom;
          assert.equal(gap,14,label+' button gap');
          if(width<=600) assert(!sameRow,label+' stacked');
        }
      }
      if(width===1280) assert.equal(primary.y,backup.y,label+' desktop pair alignment');
    }
  }
  console.log('PASS homepage edit actions: 14px gaps, full-width mobile stack, touch targets and text bounds across 32 layouts');
  async function dob(value,accept) {
    await run("document.querySelector('#edit').click();document.querySelector('#dob').value="+JSON.stringify(value)+";window.confirm=()=>"+accept+";document.querySelector('#setup').requestSubmit()");
  }
  await dob('2024-02-01',false);
  assert.equal(await run("document.querySelector('#original-name pre').textContent"),saved.name);
  assert.equal(await run('testWrites.length'),2);
  await run('document.querySelector("#cancel-edit").click()');
  await dob('2024-02-01',true);
  await until(()=>run('document.querySelector("#backup-status").textContent.includes("Saved on")'),'DOB save');
  const corrected=await run('JSON.parse(localStorage.getItem(CVPBackup.keys[0]))');
  assert.deepEqual({...corrected,t:7},{...saved,dob:'2024-02-01'});
  await run("document.querySelector('#edit').click();document.querySelector('#nm').value='Draft name';document.querySelector('#dob').value='2024-02-02';document.querySelector('#nm').dispatchEvent(new Event('input',{bubbles:true}))");
  const beforeCancel=await run('testWrites.length');
  await choose(exported);
  await until(()=>run('!!document.querySelector("#discard-form")'),'identity draft warning');
  await acknowledge();
  assert.equal(await run("document.querySelector('#confirm-restore').disabled"),true);
  await run("[...document.querySelectorAll('#backup-comparison button')].find(button=>button.textContent==='Cancel').click()");
  assert.deepEqual(await run("[document.querySelector('#nm').value,document.querySelector('#dob').value,testWrites.length]"),['Draft name','2024-02-02',beforeCancel]);
  await choose(exported); await until(()=>run('!!document.querySelector("#discard-form")'),'second draft preview'); await acknowledge();
  await run("document.querySelector('#discard-form').click();document.querySelector('#confirm-restore').click()");
  await until(()=>run('document.querySelector("#backup-status").textContent.includes("Restore verified")'),'explicit draft discard');
  assert.deepEqual(await run('JSON.parse(localStorage.getItem(CVPBackup.keys[0]))'),saved);
  await dob('2024-02-01',true);
  await until(()=>run('document.querySelector("#backup-status").textContent.includes("Saved on")'),'repeated correction');
  for(const [field,expected] of [['actual',saved.actual.g1],['ov',saved.ov.g1]]){
    await run("(()=>{const i=document.querySelector('input."+field+"[data-id=g1]');i.value='10000-01-01';i.dispatchEvent(new Event('change'))})()");
    for(const language of ['bn','en']){
      await run('cvpLanguage.set('+JSON.stringify(language)+')');
      const displayed=await run("(()=>{const i=document.querySelector('input."+field+"[data-id=g1]'),msg=document.getElementById(i.getAttribute('aria-describedby'));return [i.value,msg?.getAttribute('role'),msg?.textContent,document.getElementById('backup-status').textContent,document.getElementById('store').textContent]})()");
      assert.equal(displayed[0],expected);assert.equal(displayed[1],'alert');assert.equal(displayed[2],language==='en'?'Date rejected. The previous value has been restored.':'তারিখটি গ্রহণ করা হয়নি। আগের মান ফিরিয়ে দেওয়া হয়েছে।');
      assert.equal(displayed[3],displayed[2]);assert.equal(displayed[4],displayed[2]);
    }
  }
  console.log('PASS rejected dates reconciled in both languages, precise DOB-only name fidelity, form draft cancellation and explicit discard');
  const beforeFailedWrite=await run('JSON.parse(localStorage.getItem(CVPBackup.keys[0]))');
  await run("window.goodSet=Storage.prototype.setItem;Storage.prototype.setItem=function(){throw Error('quota')};document.querySelector('input.actual[data-id=g2]').value='2024-05-10';document.querySelector('input.actual[data-id=g2]').dispatchEvent(new Event('change'))");
  await until(()=>run('document.querySelector("#backup-status").textContent.includes("Unsaved changes")'),'failed save');
  assert.deepEqual(await run('JSON.parse(localStorage.getItem(CVPBackup.keys[0]))'),beforeFailedWrite);
  await run('Storage.prototype.setItem=goodSet;[...document.querySelectorAll("#backup-actions button")].find(b=>b.textContent==="Retry save").click()');
  await until(()=>run('JSON.parse(localStorage.getItem(CVPBackup.keys[0])).actual.g2==="2024-05-10"'),'retry');
  console.log('PASS DOB cancellation/correction, write failure, retained draft and retry');
  for (const width of [320,360,390,393,412,540,767,768]) {
    await rpc('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:true},a.sessionId);
    await choose(exported);
    await until(()=>run('!!document.querySelector("#confirm-restore")'),'mobile preview');
    for (const language of ['bn','en']) {
      await run('cvpLanguage.set('+JSON.stringify(language)+')');
      for (const theme of ['dark','light']) {
        await run("if(document.documentElement.dataset.theme!=="+JSON.stringify(theme)+")document.querySelector('#site-theme-button').click()");
        const ui=await run("(()=>{const row=document.querySelector('#rows tr'),td=row.firstElementChild,toggle=td.querySelector('.cvp-card-toggle');if(toggle.getAttribute('aria-expanded')!=='true')toggle.click();const detail=row.querySelector('.name-cell');const box=document.querySelector('#backup-comparison');return {overflow:document.documentElement.scrollWidth>innerWidth, overlap:td.getBoundingClientRect().bottom>detail.getBoundingClientRect().top+1,visible:box.getBoundingClientRect().width>0,lang:document.documentElement.lang,theme:document.documentElement.dataset.theme,title:document.querySelector('#backup-title').textContent}})()");
        assert.equal(ui.overflow,false,'document overflow at '+width);if(width<768)assert.equal(ui.overlap,false,'timeline overlap at '+width);
        assert.equal(ui.visible,true);assert.equal(ui.lang,language);assert.equal(ui.theme,theme);assert.equal(ui.title,language==='en'?'Backup & restore':'ব্যাকআপ ও পুনরুদ্ধার');
      }
    }
  }
  console.log('PASS 32 responsive preview combinations: 8 widths × 2 languages × 2 themes');
  await acknowledge();
  const b=await page();await b.visit('/');
  await b.run("document.querySelector('#edit').click();document.querySelector('#nm').value='Second tab';document.querySelector('#setup').requestSubmit()");
  await until(()=>run('document.querySelector("#confirm-restore").disabled'),'concurrent restore blocked');
  assert.equal(await run('JSON.parse(localStorage.getItem(CVPBackup.keys[0])).name'),'Second tab');
  await run("document.querySelector('input[type=checkbox][data-id=g1]').click()");
  await until(()=>run('document.querySelector("#backup-status").textContent.includes("Data changed")'),'stale edit blocked');
  assert.equal(await run('JSON.parse(localStorage.getItem(CVPBackup.keys[0])).name'),'Second tab');
  console.log('PASS real two-tab conflict during preview and stale edit');
  await run("(async()=>{const reg=await navigator.serviceWorker.ready;await reg.update();return true})()");
  await until(()=>run("caches.keys().then(k=>k.includes('bd-child-vax-public-phase1-r3')&&!k.includes('bd-child-vax-public-v1.10'))"),'updated worker');
  assert.equal(await run("caches.match('/assets/backup-v1.js').then(Boolean)"),true);
  offline=true;
  for(const [url,selector] of [['/centres/index.html','#divselect'],['/articles/index.html','a[href*="bcg"]']]){
    const link=await run("[...document.querySelectorAll('.cvp-mobnav a')].find(a=>a.pathname==="+JSON.stringify(url)+")?.pathname");
    assert.equal(link,url);const fresh=await page();await fresh.visit(link);
    assert.equal(await fresh.run("!!document.querySelector("+JSON.stringify(selector)+") && !document.querySelector('#backup-panel')"),true,url);
  }
  const missing=await page();await missing.visit('/unavailable/index.html');
  assert.equal(await missing.run("document.body.innerText.includes('unavailable offline')"),true);
  console.log('PASS first offline visits to Centres and Articles; unavailable route explicitly identified');
  await a.visit('/index.html');
  await until(()=>run("typeof recordPanel==='object'&&document.querySelector('#backup-title').textContent.length>0"),'offline boot');
  assert.equal(await run('S.name'),'Second tab');
  await choose(exported);
  await until(()=>run('!!document.querySelector("#confirm-restore")'),'offline preview');
  await acknowledge();
  await run('document.querySelector("#confirm-restore").click()');
  await until(()=>run('document.querySelector("#backup-status").textContent.includes("Restore verified")'),'offline restore');
  assert.deepEqual(await run('JSON.parse(localStorage.getItem(CVPBackup.keys[0]))'),saved);
  console.log('PASS previous worker update, offline reload and verified offline restore');
  offline=false;
  if(oldTab){
    await oldTab.run("document.querySelector('input[type=checkbox][data-id=g5]').click()");
    await until(()=>run("document.querySelector('#backup-status').textContent.includes('differs from this tab')"),'legacy overwrite immediately reported');
    assert.equal(await run('JSON.parse(localStorage.getItem(CVPBackup.keys[0])).name'),'Legacy tab fixture');
    await a.visit('/'); await until(()=>run("!!document.querySelector('#compare-intended')"),'recovery survives reload');
    await run("var originalURL=URL.createObjectURL.bind(URL);URL.createObjectURL=b=>{window.intentBlob=b;return originalURL(b)};document.querySelector('#export-intended').click()");
    assert.deepEqual(JSON.parse(await run('intentBlob.text()')).record,saved);
    await run("document.querySelector('#compare-intended').click()");
    assert.equal(await run("document.querySelector('#confirm-restore').disabled"),true);
    await acknowledge(); await run("document.querySelector('#confirm-restore').click()");
    await until(()=>run("document.querySelector('#backup-status').textContent.includes('Restore verified')"),'reviewed repair');
    assert.deepEqual(await run('JSON.parse(localStorage.getItem(CVPBackup.keys[0]))'),saved);
    console.log('PASS actual archived v1.10 writer, immediate warning, recovery after reload, export and explicit re-restore');
  }
  for(const [url,selector] of [['/centres/index.html','#divselect'],['/articles/index.html','a[href*="bcg"]']]){
    const online=await page();await online.visit(url);assert(await online.run('!!document.querySelector('+JSON.stringify(selector)+')'));
  }
  const restricted=await page();
  await rpc('Page.enable',{},restricted.sessionId);
  await rpc('Page.addScriptToEvaluateOnNewDocument',{source:"Object.defineProperty(navigator,'locks',{value:undefined})"},restricted.sessionId);
  await restricted.visit('/');
  assert.equal(await restricted.run('typeof navigator.locks'),'undefined','browser compatibility fixture');
  await restricted.run("const dt=new DataTransfer();dt.items.add(new File(["+JSON.stringify(exported)+"],'backup.json'));const f=document.querySelector('#backup-file');f.files=dt.files;f.dispatchEvent(new Event('change'))");
  await until(()=>restricted.run('!!document.querySelector("#confirm-restore")'),'no-lock preview');
  await restricted.run("document.querySelector('#closed-old-tabs').click()");
  assert.equal(await restricted.run('document.querySelector("#confirm-restore").disabled && document.querySelector("#clearRecords").disabled && !document.querySelector("#exportBackup").disabled'),true);
  assert.equal(await restricted.run('document.querySelector("#backup-lock").textContent.includes("Web Locks")'),true);
  assert.deepEqual(await restricted.run('JSON.parse(localStorage.getItem(CVPBackup.keys[0]))'),saved);
  console.log('PASS browser without Web Locks: preview/export available, restore/delete disabled');
  await a.visit('/seed');await a.visit('/');
  await run("var realSave=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(this===sessionStorage)throw Error('synthetic failure');return realSave.call(this,k,v)}");
  const beforeBlocked=await run("localStorage.getItem(CVPBackup.keys[0])");
  await choose(JSON.stringify({...saved,name:'Must not be written'}));
  await until(()=>run('!!document.querySelector("#confirm-restore")'),'session failure preview');await acknowledge();
  await run("document.querySelector('#confirm-restore').click()");
  await until(()=>run("document.querySelector('#backup-status').textContent.includes('Could not verify the recovery copy')"),'session failure status');
  assert.equal(await run("localStorage.getItem(CVPBackup.keys[0])"),beforeBlocked);
  console.log('PASS unavailable tab recovery storage prevents replacement');
  await rpc('Browser.close');
} finally {
  ws?.close();
  if(browser.exitCode===null && !launchError)browser.kill();
  server.closeAllConnections();server.close();
  const resolved=fs.realpathSync(profile);
  if(path.dirname(resolved)===temp && path.basename(resolved).startsWith('cvp-browser-')) {
    try {fs.rmSync(resolved,{recursive:true,force:true,maxRetries:10,retryDelay:150});}
    catch {console.warn('Ephemeral synthetic browser profile cleanup deferred to the OS.');}
  }
}

