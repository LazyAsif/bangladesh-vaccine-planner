/* Local single-child backup format. Storage keys are independent legacy sources. */
globalThis.CVPBackup = (() => {
  'use strict';
  const keys = ['vax-combined-blank-v4', 'vax-combined-blank-v3'];
  const limit = 1024 * 1024;
  const format = 'child-vaccine-planner-backup';
  const ids = 'g0 g00 g1 g2 g3 g4 g5 rv1 rv2 rv3 fl1 fl2 ha1 ha2 vz1 vz2 mm'.split(' ');
  const choices = {
    rotaBrand: ['unknown','rotarix','rotateq','rotavac','rotasiil','2','3'],
    fluBrand: ['unknown','influvac','vaxigrip','other'], fluHistory: ['unknown','one','two'],
    hepBrand: ['unknown','havrix','vaqta','avaxim','other'], varBrand: ['unknown','varilrix','varivax','other'],
    varTiming: ['early','routine'], mmrBrand: ['unknown','priorix','mmrii','mmrv','other']
  };
  function fail(code, path = '') {
    throw Object.assign(new Error(code), {code, path});
  }
  const copy = value => JSON.parse(JSON.stringify(value));
  function parse(text) {
    let value;
    text = text.replace(/^\uFEFF/, '');
    try { value = JSON.parse(text); } catch { fail('malformed'); }
    // JSON.parse checks grammar. Scan the same tokens before using its object so
    // escaped-equivalent duplicate names cannot disappear through last-key-wins.
    const stack = [];
    const tokens = /"(?:\\[\s\S]|[^"\\])*"|[{}\[\]]|-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/g;
    let token;
    while ((token = tokens.exec(text))) {
      const item = token[0];
      if (item === '{' || item === '[') {
        if (stack.length >= 12) fail('unsupported');
        stack.push(new Set());
      } else if (item === '}' || item === ']') {
        stack.pop();
      } else if (item[0] !== '"') {
        // All supported numeric fields originate as nonnegative safe integers.
        // Reject alternative spellings that could already have rounded in JSON.parse.
        if (!/^(0|[1-9]\d*)$/.test(item) || !Number.isSafeInteger(Number(item))) fail('unsupported');
      } else {
        let end = tokens.lastIndex;
        while (end < text.length && ' \t\n\r'.includes(text[end])) end++;
        if (text[end] !== ':') continue;
        const key = JSON.parse(item);
        if (['__proto__','constructor','prototype'].includes(key)) fail('unsupported', key);
        const seen = stack[stack.length-1];
        if (seen.has(key)) fail('duplicate', key);
        seen.add(key);
      }
    }
    return value;
  }
  function fields(value, allowed, path) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) fail('invalid', path);
    for (const key of Object.keys(value)) {
      if (!allowed.includes(key)) fail('unsupported', path + '.' + key);
    }
  }
  function date(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || value.startsWith('0000')) return false;
    const d = new Date(value + 'T00:00:00Z');
    return Number.isFinite(d.getTime()) && d.toISOString().slice(0,10) === value;
  }
  function localDay() {
    const d = new Date();
    return [d.getFullYear(), String(d.getMonth()+1).padStart(2,'0'), String(d.getDate()).padStart(2,'0')].join('-');
  }
  function validateRecord(r) {
    fields(r, ['name','dob','done','actual','ov','products','rotaBrand','t'], 'record');
    if (!date(r.dob)) fail('invalid', 'record.dob');
    if (r.dob < '2000-01-01' || r.dob > localDay()) fail('unsupported','record.dob');
    if ('name' in r && (typeof r.name !== 'string' || r.name.length > 60 || /[\uD800-\uDFFF]/u.test(r.name))) fail('invalid','record.name');
    if ('t' in r && (!Number.isSafeInteger(r.t) || r.t < 0)) fail('invalid','record.t');
    for (const k of ['done','actual','ov']) {
      if (!(k in r)) continue;
      fields(r[k], ids, 'record.' + k);
      for (const [id, value] of Object.entries(r[k])) {
        if (k === 'done' ? typeof value !== 'boolean' : !date(value)) fail('invalid','record.' + k + '.' + id);
      }
    }
    if ('rotaBrand' in r && !choices.rotaBrand.includes(r.rotaBrand)) fail('unsupported','record.rotaBrand');
    if ('products' in r) {
      fields(r.products, Object.keys(choices).filter(k => k !== 'rotaBrand'), 'record.products');
      for (const [k, v] of Object.entries(r.products)) if (!choices[k].includes(v)) fail('unsupported','record.products.'+k);
    }
    return r;
  }
  function parseBackup(text) {
    if (new TextEncoder().encode(text).length > limit) fail('size');
    const obj = parse(text);
    if (obj && typeof obj === 'object' && ['format','backupVersion','recordSchemaVersion','exportedAt','record'].some(k => k in obj)) {
      fields(obj,['format','backupVersion','recordSchemaVersion','exportedAt','record'],'backup');
      if (obj.format !== format || obj.backupVersion !== 1 || obj.recordSchemaVersion !== 1) fail('unsupported','backup');
      if (typeof obj.exportedAt !== 'string' || !/^\d{4}-\d\d-\d\dT(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d{3})?Z$/.test(obj.exportedAt) || !date(obj.exportedAt.slice(0,10))) fail('invalid','backup.exportedAt');
      return validateRecord(obj.record);
    }
    return validateRecord(obj);
  }
  function buildBackup(record) {
    return JSON.stringify({format,backupVersion:1,recordSchemaVersion:1,exportedAt:new Date().toISOString(),record:validateRecord(record)},null,2);
  }
  function readCandidates(storage) {
    return keys.map(key => {
      let raw;
      try { raw = storage.getItem(key); } catch { return {key,state:'unreadable'}; }
      if (raw === null) return {key,raw,state:'absent'};
      try { return {key,raw,state:'valid',record:validateRecord(parse(raw))}; }
      catch (e) { return {key,raw,state:e.code || 'malformed',path:e.path}; }
    });
  }
  const selected = snapshot => snapshot.find(item => item.state === 'valid');
  function checkSnapshot(storage, expected) {
    const fresh = readCandidates(storage);
    if ([...fresh,...expected].some(c => c.state === 'unreadable')) fail('unreadable');
    if (fresh.some((c,i) => c.raw !== expected[i].raw)) fail('conflict');
  }
  function same(a,b) {
    if (a === b) return true;
    if (!a || !b || typeof a !== 'object' || typeof b !== 'object') return false;
    return Object.keys(a).length === Object.keys(b).length &&
      Object.keys(a).every(k => Object.hasOwn(b,k) && same(a[k],b[k]));
  }
  const editable = snapshot => snapshot.every(c => c.state !== 'unreadable') &&
    (snapshot[0].state === 'valid' || (snapshot[0].state === 'absent' && ['valid','absent'].includes(snapshot[1].state)));
  async function commitRecord(storage, locks, expected, record, mode, current = () => true, prepareRestore) {
    const action = () => {
      if (!current()) fail('conflict');
      checkSnapshot(storage,expected);
      if (mode === 'edit' && !editable(expected)) fail('recovery');
      if (mode === 'delete') {
        // Preserve the primary copy if removing the fallback fails.
        try { for (const key of [...keys].reverse()) storage.removeItem(key); } catch { fail('uncertain'); }
      } else {
        const raw = JSON.stringify(validateRecord(record));
        if (mode === 'restore' && prepareRestore) prepareRestore(raw);
        try { storage.setItem(keys[0],raw); } catch { fail('write'); }
        const verified = readCandidates(storage);
        if (verified[0].raw !== raw || verified[0].state !== 'valid' || !same(verified[0].record,record) ||
            verified[1].state === 'unreadable' || verified[1].raw !== expected[1].raw) fail('uncertain');
        return verified;
      }
      const verified = readCandidates(storage);
      if (verified.some(c => c.state !== 'absent')) fail('uncertain');
      return verified;
    };
    if (locks && typeof locks.request === 'function') return locks.request('cvp-vaccination-record', action);
    if (mode !== 'edit') fail('noLock');
    return action();
  }
  function runtime(record) {
    return Object.assign({name:'',dob:'',done:{},actual:{},ov:{},products:{},rotaBrand:'unknown',t:0}, copy(record || {}));
  }
  return {keys,limit,copy,date,same,parseBackup,buildBackup,validateRecord,readCandidates,selected,editable,commitRecord,runtime,fail};
})();

/* DOM adapter. The engine sees a default-filled copy; only explicit edits
   change the exact legacy payload held in draft. */
function startRecordPanel(host) {
  'use strict';
  const api = CVPBackup;
  const get = id => document.getElementById(id);
  const storage = {
    getItem: key => window.localStorage.getItem(key),
    setItem: (key,value) => window.localStorage.setItem(key,value),
    removeItem: key => window.localStorage.removeItem(key)
  };
  let locks;
  try { if (typeof navigator.locks?.request === 'function') locks=navigator.locks; } catch { /* Opaque or restricted origin. */ }
  const tr = (en,bn) => host.language() === 'en' ? en : bn;
  const words = {
    saved:['Saved on this device.','এই ডিভাইসে সংরক্ষিত।'],
    restored:['Restore verified on this device.','পুনরুদ্ধার ও সংরক্ষণ যাচাই হয়েছে।'],
    saving:['Verifying storage…','সংরক্ষণ যাচাই চলছে…'],
    dateRejected:['Date rejected. The previous value has been restored.','তারিখটি গ্রহণ করা হয়নি। আগের মান ফিরিয়ে দেওয়া হয়েছে।'],
    dobRejected:['Enter a birth date from 2000 through today. This edit is unsaved.','২০০০ সাল থেকে আজকের মধ্যে একটি জন্মতারিখ দিন। এই পরিবর্তন সংরক্ষিত হয়নি।'],
    recoveryStorage:['Could not verify the recovery copy for this tab. Check the record and download a backup.','এই ট্যাবের পুনরুদ্ধার কপি যাচাই করা যায়নি। রেকর্ড দেখে ব্যাকআপ ডাউনলোড করুন।'],
    overwritten:['The saved record differs from this tab’s expected copy after restore. Compare both copies before continuing.','পুনরুদ্ধারের পর সংরক্ষিত রেকর্ডটি এই ট্যাবের প্রত্যাশিত কপি থেকে বদলে গেছে। এগোনোর আগে দুটি কপি তুলনা করুন।'],
    write:['Unsaved changes. Storage may be full or blocked. Retry or download your draft.','পরিবর্তন সংরক্ষিত হয়নি। স্টোরেজ পূর্ণ বা বন্ধ থাকতে পারে। আবার চেষ্টা করুন অথবা খসড়া ডাউনলোড করুন।'],
    invalid:['Invalid field','তথ্য সঠিক নয়'], malformed:['Invalid JSON','JSON সঠিক নয়'],
    duplicate:['Duplicate JSON member','JSON-এ একই নাম একাধিকবার আছে'],
    unsupported:['Unsupported field or format','অসমর্থিত তথ্য বা ফরম্যাট'],
    size:['Maximum file size is 1 MiB.','ফাইলের সর্বোচ্চ আকার ১ MiB।'],
    unreadable:['Storage could not be read.','স্টোরেজ পড়া যায়নি।'],
    recovery:['Review the stored copies before replacing data.','তথ্য প্রতিস্থাপনের আগে সংরক্ষিত কপিগুলো দেখুন।'],
    conflict:['Data changed. Download any draft, then review a fresh comparison before restoring.','তথ্য বদলেছে। প্রয়োজনে খসড়া ডাউনলোড করে নতুন তুলনা দেখে পুনরুদ্ধার করুন।'],
    uncertain:['Storage could not be verified. Download a copy and inspect storage again.','সংরক্ষণ যাচাই করা যায়নি। কপি ডাউনলোড করে আবার স্টোরেজ দেখুন।'],
    noLock:['Restore and deletion require a browser with Web Locks in a secure context. Export and preview are available.','পুনরুদ্ধার ও মোছার জন্য নিরাপদ সংযোগে Web Locks সমর্থিত ব্রাউজার প্রয়োজন। প্রিভিউ ও ডাউনলোড করা যাবে।'],
    absent:['Empty','খালি'], valid:['Readable record','পাঠযোগ্য রেকর্ড'],
    downloaded:['Download started. Check that you retained the file.','ডাউনলোড শুরু হয়েছে। ফাইলটি আপনার কাছে আছে কি না দেখে নিন।'],
    downloadError:['Download could not start.','ডাউনলোড শুরু করা যায়নি।'],
    fileError:['Could not read a UTF-8 JSON file.','UTF-8 JSON ফাইলটি পড়া যায়নি।']
  };
  const word = key => tr(...(words[key] || words.invalid));
  let snapshot = api.readCandidates(storage);
  let draft = api.copy(api.selected(snapshot)?.record || {});
  let dirty = false, busy = false, revision = 0, ticket = 0, preview = null;
  let status = initialStatus(), notice = null;
  let dateIssue=null, recovery=null, recoveryConflict=false;
  const sessionKey='cvp-phase1-restore-recovery';
  try {
    const raw=window.sessionStorage.getItem(sessionKey);
    if (raw!==null) {
      const data=JSON.parse(raw);
      api.validateRecord(data.record);
      if(typeof data.expected!=='string') api.fail('recoveryStorage');
      recovery=data;
      recoveryConflict=snapshot[0].raw!==data.expected;
    }
  } catch { notice={code:'recoveryStorage'}; }
  function remember(record,expected) {
    const data={record,expected}, raw=JSON.stringify(data);
    try {
      window.sessionStorage.setItem(sessionKey,raw);
      if(window.sessionStorage.getItem(sessionKey)!==raw) api.fail('recoveryStorage');
    } catch { api.fail('recoveryStorage'); }
    recovery=data;
  }
  function forget() {
    window.sessionStorage.removeItem(sessionKey);
    if(window.sessionStorage.getItem(sessionKey)!==null) api.fail('recoveryStorage');
    recovery=null; recoveryConflict=false;
  }
  function initialStatus() {
    if (snapshot.some(c => c.state === 'unreadable')) return 'unreadable';
    if (!api.editable(snapshot)) return 'recovery';
    return api.selected(snapshot) ? 'saved' : '';
  }
  function node(tag,text) {
    const n = document.createElement(tag);
    n.textContent = text;
    return n;
  }
  function button(parent,text,fn,disabled=false) {
    const b = node('button',text);
    b.type = 'button'; b.disabled = disabled || busy;
    b.onclick = fn; parent.append(b); return b;
  }
  function describe(problem) {
    return word(problem.code) + (problem.path ? ' · ' + problem.path.slice(0,100) : '');
  }
  function download(raw,name) {
    try {
      const url = URL.createObjectURL(new Blob([raw],{type:'application/json;charset=utf-8'}));
      const a = document.createElement('a');
      a.href=url; a.download=name; document.body.append(a); a.click(); a.remove();
      setTimeout(()=>URL.revokeObjectURL(url),5000);
      notice = {code:'downloaded'};
    } catch { notice = {code:'downloadError'}; }
    draw();
  }
  function exportRecord(r,filename='child-vaccine-backup.json') {
    try { download(api.buildBackup(r),filename); }
    catch(e) { notice=e; draw(); }
  }
  function clearPreview() {
    ++ticket; preview=null; get('backup-file').value='';
  }
  function compare(rawRecord,expected) {
    return {record:rawRecord, expected, revision, stale:false, closedTabs:false, discardForm:false};
  }
  function previewRecord(r) {
    clearPreview(); notice=null;
    preview=compare(r,api.readCandidates(storage)); draw();
    get('backup-comparison').focus();
  }
  async function chooseFile(file) {
    if (busy || !file) return;
    clearPreview(); notice=null;
    const token=ticket, expected=api.readCandidates(storage), version=revision;
    draw();
    try {
      if (file.size > api.limit) api.fail('size');
      const bytes = await file.arrayBuffer();
      const record = api.parseBackup(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
      if (ticket !== token || revision !== version) return;
      preview=compare(record,expected); draw(); get('backup-comparison').focus();
    } catch(e) {
      if (ticket !== token) return;
      notice=e.code && words[e.code] ? e : {code:'fileError'}; draw();
    }
  }
  function productSummary(r) {
    const labels={rotaBrand:tr('Rotavirus','রোটাভাইরাস'),fluBrand:tr('Influenza','ইনফ্লুয়েঞ্জা'),
      fluHistory:tr('Flu history','ফ্লুর ইতিহাস'),hepBrand:tr('Hepatitis A','হেপাটাইটিস-এ'),
      varBrand:tr('Varicella','চিকেনপক্স'),varTiming:tr('Second dose timing','দ্বিতীয় ডোজের সময়'),
      mmrBrand:tr('MMR','এমএমআর')};
    const values={unknown:tr('Unknown','অজানা'),other:tr('Other','অন্যান্য'),one:tr('One dose','এক ডোজ'),
      two:tr('Two doses','দুই ডোজ'),early:tr('Early','আগাম'),routine:tr('Routine','নিয়মিত'),
      '2':tr('Other two-dose product','অন্য দুই-ডোজের পণ্য'),'3':tr('Other three-dose product','অন্য তিন-ডোজের পণ্য'),
      rotarix:'Rotarix',rotateq:'RotaTeq',rotavac:'Rotavac',rotasiil:'Rotasiil',influvac:'Influvac',
      vaxigrip:'Vaxigrip',havrix:'Havrix',vaqta:'Vaqta',avaxim:'Avaxim',varilrix:'Varilrix',
      varivax:'Varivax',priorix:'Priorix',mmrii:'M-M-R II',mmrv:'MMRV'};
    const settings=Object.entries(r.products || {});
    if ('rotaBrand' in r) settings.unshift(['rotaBrand',r.rotaBrand]);
    return settings.map(([key,value])=>labels[key]+' · '+values[value]).join(', ') || '—';
  }
  function summary(parent,title,r) {
    const section=node('section',''); section.append(node('h4',title)); parent.append(section);
    if (!r) { section.append(node('p',word('absent'))); return; }
    const done=Object.keys(r.done || {}).filter(k=>r.done[k]);
    const items=[
      [tr('Name','নাম'),r.name || '—'],[tr('DOB','জন্মতারিখ'),r.dob],
      [tr('Completed / without actual date','সম্পন্ন / প্রকৃত তারিখ ছাড়া'),done.length+' / '+done.filter(k=>!r.actual?.[k]).length],
      [tr('Actual / confirmed dates','প্রকৃত / নিশ্চিত তারিখ'),Object.keys(r.actual||{}).length+' / '+Object.keys(r.ov||{}).length],
      [tr('Product settings','পণ্যের সেটিংস'),productSummary(r)]
    ];
    const dl=node('dl','');
    for (const [label,value] of items) dl.append(node('dt',label),node('dd',value));
    section.append(dl);
    if (Object.keys(r.actual||{}).some(id=>!r.done?.[id])) section.append(node('p',tr('An actual date has no completion flag. Both values will be preserved.','প্রকৃত তারিখ আছে কিন্তু সম্পন্ন হিসেবে চিহ্নিত নেই। উভয় মান রাখা হবে।')));
    const details=node('details',''); details.append(node('summary',tr('All stored fields','সংরক্ষিত সব তথ্য')),node('pre',JSON.stringify(r,null,2))); section.append(details);
  }
  function copies(parent,items) {
    for (const c of items) {
      if (c.state === 'absent') continue;
      const label=c.key.endsWith('v4')?'v4':'v3';
      const line=node('div',''); line.className='backup-actions';
      line.append(node('span',label+' · '+word(c.state)));
      if (c.state === 'valid') {
        button(line,tr('Back up','ব্যাকআপ')+' '+label,()=>exportRecord(c.record,'child-vaccine-'+label+'.json'));
        button(line,tr('Preview','প্রিভিউ')+' '+label,()=>previewRecord(c.record));
      } else if (typeof c.raw === 'string') {
        button(line,tr('Download original bytes as text','মূল তথ্য টেক্সট হিসেবে ডাউনলোড')+' '+label,()=>download(c.raw,'child-vaccine-'+label+'-recovery.txt'));
      }
      parent.append(line);
    }
  }
  function acknowledgement(parent,id,label,checked,change) {
    const wrapper=node('label',''), input=document.createElement('input');
    input.type='checkbox'; input.id=id; input.checked=checked; input.disabled=busy;
    input.onchange=()=>change(input.checked);
    wrapper.className='backup-check'; wrapper.append(input,document.createTextNode(label)); parent.append(wrapper);
  }
  function replaceAllowed(p) {
    return p && !p.stale && locks && p.expected.every(c=>c.state!=='unreadable') &&
      (p.expected.every(c=>c.state==='absent') || p.closedTabs) &&
      (!host.formDraft() || p.discardForm) &&
      (!recoveryConflict || api.same(p.record,recovery?.record));
  }
  function clearDateIssue(){
    dateIssue=null;
    const msg=get('date-rejection');
    if(msg){document.querySelector('[aria-describedby="date-rejection"]')?.removeAttribute('aria-describedby');msg.remove();}
    get('err').textContent=''; get('dob').removeAttribute('aria-invalid');
  }
  function dateMessage(){
    if(!dateIssue) return '';
    if(dateIssue.kind==='dob'){
      get('err').textContent=word('dobRejected');get('dob').setAttribute('aria-invalid','true');return word('dobRejected');
    }
    const input=get('rows').querySelector('input.'+dateIssue.kind+'[data-id="'+dateIssue.id+'"]');
    if(input){
      let msg=get('date-rejection');
      if(!msg){msg=node('span','');msg.className='inline-note';msg.id='date-rejection';msg.setAttribute('role','alert');input.parentElement.after(msg);}
      if(msg.textContent!==word('dateRejected')) msg.textContent=word('dateRejected');
      input.setAttribute('aria-describedby',msg.id);
    }
    return word('dateRejected');
  }
  function draw() {
    const panel=get('backup-panel'), output=get('backup-status');
    const issue=dateMessage();
    const savedStatus=recoveryConflict && ['saved','restored'].includes(status) ? '' : status;
    const message=[recoveryConflict && word('overwritten'), issue || (savedStatus && word(savedStatus)), dirty && tr('The chart contains unsaved changes.','চার্টে অসংরক্ষিত পরিবর্তন আছে।'),notice && describe(notice)].filter(Boolean).join(' ');
    output.textContent=message; get('store').textContent=message;
    const nameNote=get('original-name'), exact=host.storedName();
    nameNote.hidden=!exact;
    nameNote.querySelector('span').textContent=tr('Original stored name (preserved unless edited)','মূল সংরক্ষিত নাম (সম্পাদনা না করলে অপরিবর্তিত থাকবে)');
    nameNote.querySelector('pre').textContent=exact;
    get('backup-title').textContent=tr('Backup & restore','ব্যাকআপ ও পুনরুদ্ধার');
    get('backup-hint').textContent=tr('Private JSON file · maximum 1 MiB. Store it safely. The browser cannot verify that you kept a download. Close older planner tabs before restoring.','ব্যক্তিগত JSON ফাইল · সর্বোচ্চ ১ MiB। নিরাপদে রাখুন। ডাউনলোডটি রেখেছেন কি না ব্রাউজার যাচাই করতে পারে না। পুনরুদ্ধারের আগে প্ল্যানারের পুরোনো ট্যাব বন্ধ করুন।');
    get('file-label').textContent=tr('Choose a backup to preview','প্রিভিউ দেখতে ব্যাকআপ বেছে নিন');
    get('backup-file').disabled=busy;
    const actions=get('backup-actions'); actions.replaceChildren();
    const selected=api.selected(snapshot);
    if (selected) button(actions,['conflict','uncertain','unreadable'].includes(status)
      ? tr('Download last read record','সর্বশেষ পড়া রেকর্ড ডাউনলোড')
      : tr('Back up current saved record','বর্তমান সংরক্ষিত রেকর্ড ব্যাকআপ'),()=>exportRecord(selected.record)).id='exportBackup';
    const formBackup=get('backup-before-edit');
    formBackup.hidden=!host.editing() || !selected;
    formBackup.textContent=tr('Back up before editing','সম্পাদনার আগে ব্যাকআপ');
    formBackup.onclick=()=>selected && exportRecord(selected.record);
    if (dirty) {
      button(actions,tr('Download unsaved changes','অসংরক্ষিত পরিবর্তন ডাউনলোড'),()=>exportRecord(draft,'child-vaccine-unsaved.json'));
      button(actions,tr('Retry save','আবার সংরক্ষণ করুন'),()=>commit('edit'),!api.editable(snapshot));
    }
    if (recoveryConflict || ['conflict','uncertain','unreadable'].includes(status)) {
      button(actions,tr('Reload stored copies','সংরক্ষিত কপি আবার পড়ুন'),()=>{
        if ((dirty || host.formDraft()) && !confirm(tr('Discard unsaved chart or form changes and read storage again?','চার্ট বা ফর্মের অসংরক্ষিত পরিবর্তন বাদ দিয়ে স্টোরেজ আবার পড়বেন?'))) return;
        snapshot=api.readCandidates(storage);
        if (snapshot.some(c=>c.state==='unreadable')) { status='unreadable'; draw(); return; }
        draft=api.copy(api.selected(snapshot)?.record || {});
        dirty=false; revision++; clearPreview(); status=initialStatus(); notice=null;
        host.show(api.runtime(draft)); draw();
      });
    }
    if (snapshot.some(c=>c.state!=='absent')) {
      button(actions,tr('Delete saved records','সংরক্ষিত রেকর্ড মুছুন'),()=>{
        if (confirm(tr('Delete both stored copies from this browser?','এই ব্রাউজার থেকে উভয় সংরক্ষিত কপি মুছবেন?'))) commit('delete');
      },!locks || snapshot.some(c=>c.state==='unreadable')).id='clearRecords';
    }
    const recover=get('backup-copies'); recover.replaceChildren();
    const session=get('restore-recovery'); session.replaceChildren();
    if(recovery){
      session.append(node('h3',tr('Restore recovery copy','পুনরুদ্ধার কপি')),node('p',tr('This tab keeps the intended restore across reloads. Download it before closing this tab.','এই ট্যাব রিলোডের পরও পুনরুদ্ধারের কপি রাখে। ট্যাব বন্ধ করার আগে ডাউনলোড করুন।')));
      button(session,tr('Download intended restore','পুনরুদ্ধারের কপি ডাউনলোড'),()=>exportRecord(recovery.record,'child-vaccine-intended.json')).id='export-intended';
      button(session,tr('Compare with current storage','বর্তমান স্টোরেজের সঙ্গে তুলনা'),()=>previewRecord(recovery.record)).id='compare-intended';
      button(session,tr('Release this recovery copy','এই পুনরুদ্ধার কপি সরান'),()=>{
        if (!confirm(tr('Remove the recovery copy from this tab? The current saved record will be kept.','এই ট্যাবের পুনরুদ্ধার কপি সরাবেন? বর্তমান সংরক্ষিত রেকর্ড রাখা হবে।'))) return;
        try { forget(); clearPreview(); } catch {notice={code:'recoveryStorage'};} draw();
      });
    }
    if (snapshot.every(c=>c.state==='valid') && !api.same(snapshot[0].record,snapshot[1].record)) {
      recover.append(node('p',tr('Two different copies exist. The chart opened v4. Preview either copy below.','দুটি ভিন্ন কপি আছে। চার্টে v4 খোলা হয়েছে। নিচে যেকোনো কপি দেখুন।')));
    }
    if (snapshot[1].state!=='absent' || !api.editable(snapshot)) copies(recover,snapshot);
    const box=get('backup-comparison'); box.replaceChildren(); box.hidden=!preview;
    if (preview) {
      const p=preview, current=api.selected(p.expected);
      box.append(node('h3',tr('Review before restoring','পুনরুদ্ধারের আগে তুলনা করুন')));
      const cards=node('div',''); cards.className='backup-cards';
      summary(cards,tr('Currently stored','বর্তমানে সংরক্ষিত'),current?.record);
      summary(cards,tr('Incoming backup','নতুন ব্যাকআপ'),p.record); box.append(cards);
      copies(box,p.expected);
      if(p.expected.some(c=>c.state!=='absent')){
        box.append(node('p',tr('Download the current record above before replacement. An older v1.10 tab or installed window can overwrite a verified restore.','প্রতিস্থাপনের আগে উপরে বর্তমান রেকর্ড ডাউনলোড করুন। পুরোনো v1.10 ট্যাব বা ইনস্টল করা অ্যাপ যাচাই করা রেকর্ডও বদলে দিতে পারে।')));
        acknowledgement(box,'closed-old-tabs',tr('I have closed other planner tabs and installed windows.','আমি প্ল্যানারের অন্য ট্যাব ও ইনস্টল করা অ্যাপের উইন্ডো বন্ধ করেছি।'),p.closedTabs,v=>{p.closedTabs=v;get('confirm-restore').disabled=!replaceAllowed(p);});
      }
      if(host.formDraft()){
        acknowledgement(box,'discard-form',tr('Discard my unsubmitted name or DOB edit on restore. Saved backups exclude this form draft.','পুনরুদ্ধারের সময় ফর্মে অসম্পন্ন নাম বা জন্মতারিখের পরিবর্তন বাদ দিন। সংরক্ষিত ব্যাকআপে ফর্মের এই পরিবর্তন নেই।'),p.discardForm,v=>{p.discardForm=v;get('confirm-restore').disabled=!replaceAllowed(p);});
      }
      if(recoveryConflict && !api.same(p.record,recovery.record)) box.append(node('p',tr('Review and release the previous recovery copy before restoring a different file.','অন্য ফাইল পুনরুদ্ধারের আগে আগের পুনরুদ্ধার কপি পর্যালোচনা করে সরান।')));
      box.append(node('p',tr('Confirming keeps a recovery copy in this tab until released or replaced by the next restore.','নিশ্চিত করলে এই ট্যাবে একটি পুনরুদ্ধার কপি থাকবে। সরালে বা পরের পুনরুদ্ধারে এটি বদলাবে।')));
      if (dirty) box.append(node('p',tr('Continuing will also replace the unsaved chart. Download it first if needed.','এগোলে অসংরক্ষিত চার্টও প্রতিস্থাপিত হবে। প্রয়োজনে আগে ডাউনলোড করুন।')));
      box.append(node('p',tr('Confirming writes the incoming record to the primary copy (v4). The v3 copy is retained.','নিশ্চিত করলে প্রাথমিক কপিতে (v4) নতুন রেকর্ড লেখা হবে। v3 কপি রাখা হবে।')));
      button(box,tr('Cancel','বাতিল'),cancel);
      if (p.stale) button(box,tr('Refresh comparison','আবার তুলনা করুন'),()=>previewRecord(p.record));
      const blocked=p.expected.some(c=>c.state==='unreadable');
      if (blocked) box.append(node('p',word('unreadable')));
      button(box,current || p.expected[0].state!=='absent' ? tr('Confirm replacement','প্রতিস্থাপন নিশ্চিত করুন') : tr('Confirm restore','পুনরুদ্ধার নিশ্চিত করুন'),()=>commit('restore'),!replaceAllowed(p)).id='confirm-restore';
    }
    get('backup-lock').textContent=locks?'':word('noLock');
    panel.setAttribute('aria-busy',String(busy));
    get('view').inert=busy;
    get('setup').inert=busy || !api.editable(snapshot);
    // Keep recovery mode readable and keyboard accessible. Only editing is blocked.
    if (!api.editable(snapshot)) {
      get('view').querySelectorAll('input:enabled,select:enabled,.date-clear-btn:enabled,#edit:enabled').forEach(el=>{
        el.dataset.recoveryDisabled='1'; el.disabled=true;
      });
    } else {
      get('view').querySelectorAll('[data-recovery-disabled]').forEach(el=>{
        delete el.dataset.recoveryDisabled; el.disabled=false;
      });
    }
    get('cancel-edit').hidden=!host.editing();
    get('cancel-edit').textContent=tr('Cancel edit','সম্পাদনা বাতিল');
  }
  function cancel() { if (!busy) { clearPreview(); notice=null; draw(); get('backup-file').focus(); } }
  async function commit(mode) {
    if (busy || (mode==='restore' && !replaceAllowed(preview))) return;
    const prior=preview;
    const expected=mode==='restore'?prior.expected:snapshot;
    const incoming=mode==='restore'?prior.record:{...draft,t:Date.now()};
    busy=true; status='saving'; notice=null; draw();
    try {
      snapshot=await api.commitRecord(storage,locks,expected,incoming,mode,()=>mode!=='restore' ||
        (preview===prior && replaceAllowed(prior) && prior.revision===revision),
        raw=>remember(incoming,raw));
      if(mode==='restore') recoveryConflict=false;
      if(mode==='edit' && recovery && !recoveryConflict){
        try{remember(recovery.record,snapshot[0].raw);}catch{notice={code:'recoveryStorage'};}
      }
      if(mode==='delete' && recovery){try{forget();}catch{notice={code:'recoveryStorage'};}}
      clearDateIssue();
      draft=api.copy(api.selected(snapshot)?.record || {});
      dirty=false; revision++; clearPreview();
      status=mode==='restore'?'restored':initialStatus();
      host.show(api.runtime(draft));
    } catch(e) {
      status=words[e.code]?e.code:'write';
      if(recovery && api.readCandidates(storage)[0].raw!==recovery.expected) recoveryConflict=true;
      if (preview && ['conflict','uncertain','unreadable'].includes(status)) preview.stale=true;
      if (mode==='edit') dirty=true;
    } finally { busy=false; draw(); }
  }
  function edit(change) {
    if (busy || !api.editable(snapshot)) return;
    const next=api.copy(draft);
    change(next);
    try { api.validateRecord(next); } catch(e) { notice=e; draw(); return; }
    draft=next; dirty=true; revision++; clearPreview(); clearDateIssue();
    host.show(api.runtime(draft));
    return commit('edit');
  }
  function identity(name,dob,nameChanged) {
    if (draft.dob && draft.dob!==dob) {
      const counts=[Object.values(draft.done||{}).filter(Boolean).length,Object.keys(draft.actual||{}).length,Object.keys(draft.ov||{}).length];
      const early=[...Object.values(draft.actual||{}),...Object.values(draft.ov||{})].some(v=>v<dob);
      const message=tr('Correct DOB','জন্মতারিখ সংশোধন')+' '+draft.dob+' → '+dob+'?\n'+
        tr('Plans may move. Retained: completed / actual dates / confirmed plans','পরিকল্পনার তারিখ বদলাতে পারে। রাখা হবে: সম্পন্ন / প্রকৃত তারিখ / নিশ্চিত পরিকল্পনা')+' · '+counts.join(' / ')+
        (early?'\n'+tr('Some stored dates precede this DOB. They will be kept.','কিছু তারিখ নতুন জন্মতারিখের আগে। সেগুলো রাখা হবে।'):'');
      if (!confirm(message)) return;
    }
    return edit(r=>{if(nameChanged) r.name=name; r.dob=dob;});
  }
  get('backup-file').onclick=()=>{if (!busy) { clearPreview(); notice=null; draw(); }};
  get('backup-file').addEventListener('cancel',cancel);
  get('backup-file').onchange=e=>chooseFile(e.target.files[0]);
  get('setup').addEventListener('input',()=>{
    revision++; ++ticket;
    if (preview) { preview.stale=true; preview.discardForm=false; notice={code:'conflict'}; draw(); }
  });
  document.addEventListener('keydown',e=>{if(e.key==='Escape' && preview && !busy) cancel();});
  window.addEventListener('storage',e=>{
    if (e.key!==null && !api.keys.includes(e.key)) return;
    const fresh=api.readCandidates(storage);
    if(recovery && fresh[0].raw!==recovery.expected) recoveryConflict=true;
    if (snapshot.every((c,i)=>c.raw===fresh[i].raw && c.state===fresh[i].state) &&
        (!preview || preview.expected.every((c,i)=>c.raw===fresh[i].raw && c.state===fresh[i].state))) return;
    if (preview) preview.stale=true;
    status='conflict'; draw();
  });
  function rejectDate(id,kind){clearDateIssue();dateIssue={id,kind};notice=null;draw();}
  return {draw,edit,identity,rejectDate,clearDateIssue,initial:api.runtime(draft)};
}


