/* Profile selection, migration and backup share one verified family snapshot. */
function startProfiles(host) {
  'use strict';
  const B=CVPBackup, F=CVPProfiles, el=id=>document.getElementById(id);
  const db={getItem:k=>localStorage.getItem(k),setItem:(k,v)=>localStorage.setItem(k,v)};
  let locks;
  try { locks=navigator.locks; } catch {}
  let snap=F.read(db), legacy=B.readCandidates(db), legacyMatches=false;
  let draft=B.copy(record() || {}), busy=false, panel=null, message=null, stale=false, dateIssue=null;
  let displayed=snap.family?.activeChildId;
  const recoveryKey='cvp-family-pending-restore-v1';
  let pending=null, inspectLegacy=false;
  try { pending=sessionStorage.getItem(recoveryKey); } catch {}
  const tr=(en,bn)=>host.language()==='en'?en:bn;
  function record(){return snap.family?.profilesById[snap.family.activeChildId]?.record}
  function hasLegacy(){return legacy.some(c=>c.state!=='absent')}
  function dirty(){return !B.same(draft,record() || {}) || host.formDraft()}
  function label(id,r){return (r.name?.trim() || tr('Unnamed child','নামহীন শিশু'))+' · '+r.dob+' · '+id.slice(-8)}
  function summary(r){
    return [r.name || tr('Unnamed child','নামহীন শিশু'),r.dob,
      tr('Completed','সম্পন্ন')+' '+Object.values(r.done || {}).filter(Boolean).length,
      tr('Actual dates','প্রকৃত তারিখ')+' '+Object.keys(r.actual || {}).length,
      tr('Clinician dates','চিকিৎসকের তারিখ')+' '+Object.keys(r.ov || {}).length].join(' · ');
  }
  function familyList(f){return Object.entries(f?.profilesById || {}).map(([id,p])=>label(id,p.record)+'\n'+summary(p.record)).join('\n\n') || tr('No saved children','কোনো শিশু সংরক্ষিত নেই')}
  function historical(r){return [...Object.values(r.actual || {}),...Object.values(r.ov || {})].some(d=>d<r.dob)}
  const reviewDates=()=>tr('Some recorded dates precede this DOB. Review them with your vaccinator. All history is retained.','কিছু সংরক্ষিত তারিখ জন্মতারিখের আগে। টিকাদানকারীর সঙ্গে যাচাই করুন। সব ইতিহাস রাখা হবে।');
  function note(en,bn){message=[en,bn]}
  function problem(e){
    const codes={
      already:['These legacy sources have already been migrated.','এই পুরোনো উৎসগুলোর স্থানান্তর আগেই হয়েছে।'],
      recoveryCopy:['Could not verify the tab recovery copy. Replacement stopped.','ট্যাবের পুনরুদ্ধার কপি যাচাই করা যায়নি। প্রতিস্থাপন বন্ধ হয়েছে।'],
      write:['Storage write failed. Your changes are unsaved. Check browser space and retry.','সংরক্ষণ ব্যর্থ। পরিবর্তন সংরক্ষিত হয়নি। ব্রাউজারে জায়গা দেখে আবার চেষ্টা করুন।'],
      conflict:['Stored data changed. Back up your draft and reload the saved family before continuing.','সংরক্ষিত তথ্য বদলেছে। খসড়া ব্যাকআপ নিয়ে সংরক্ষিত পরিবার আবার লোড করুন।'],
      uncertain:['Write could not be verified. Keep a backup and inspect the saved family before retrying.','লেখা যাচাই করা যায়নি। আবার চেষ্টা করার আগে ব্যাকআপ নিন ও সংরক্ষিত পরিবার দেখুন।'],
      unreadable:['Browser storage cannot be read. Check storage access and reload.','ব্রাউজার স্টোরেজ পড়া যাচ্ছে না। অনুমতি দেখে আবার লোড করুন।'],
      size:['File exceeds the size limit.','ফাইলের আকার সীমা ছাড়িয়েছে।'],
      noLock:['Safe saving requires a browser with Web Locks on HTTPS. Preview and downloads are available.','নিরাপদ সংরক্ষণের জন্য HTTPS ও Web Locks সমর্থিত ব্রাউজার প্রয়োজন। প্রিভিউ ও ডাউনলোড করা যাবে।'],
      dob:['Enter a valid birth date from 2000 through today.','২০০০ সাল থেকে আজকের মধ্যে একটি বৈধ জন্মতারিখ দিন।']
    };
    message=codes[e.code] || ['Invalid or unsupported data. Check the file, dates and format.','তথ্য অবৈধ বা অসমর্থিত। ফাইল, তারিখ ও ফরম্যাট যাচাই করুন।'];
    if (['conflict','uncertain','unreadable'].includes(e.code)) stale=true;
  }
  function text(parent,tag,value){const n=document.createElement(tag);n.textContent=value;parent.append(n);return n}
  function button(parent,id,value,fn,disabled=false){
    const n=text(parent,'button',value);n.type='button';n.id=id;n.className='btn o';n.disabled=disabled||busy;n.onclick=fn;return n;
  }
  function download(raw,name){
    const url=URL.createObjectURL(new Blob([raw],{type:'application/json'}));
    const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);
  }
  function childCopy(r,unsaved=false){download(F.backup('child',r),unsaved?'cvp-unsaved-child.json':'cvp-child.json')}
  function rawCopy(raw,name){
    // Blob strings use UTF-8. Escape lone UTF-16 surrogates to make damaged text recoverable.
    if(/[\uD800-\uDFFF]/u.test(raw))download(JSON.stringify({raw}),name+'.escaped.json');
    else download(raw,name);
  }
  function familyCopy(){if(snap.family)download(F.backup('family',snap.family),'cvp-family.json');else if(snap.state==='damaged')rawCopy(snap.raw,'cvp-damaged-family.txt')}
  function close(){panel=null;el('backup-file').value='';draw();el('profile-select').focus()}
  function preview(p){if(busy)return;panel=p;message=null;draw();el('profile-preview').focus()}
  function updateChart(){
    draft=B.copy(record() || {});
    if(displayed!==snap.family?.activeChildId){
      displayed=snap.family?.activeChildId;
      window.dispatchEvent(new Event('cvp-profile-change'));
    }
    dateIssue=null;
    host.show(B.runtime(draft));
  }
  async function compareLegacy(){
    const captured=legacy, marker=snap.family?.migration;
    legacyMatches=false;
    if (!marker) return;
    try {
      const hashes=await F.fingerprints(captured);
      if(captured===legacy && marker===snap.family?.migration){legacyMatches=B.same(hashes,marker.hashes);draw()}
    } catch {draw()}
  }
  function reload(){
    if (dirty() && !confirm(tr('Discard this tab’s unsaved changes and reload the stored family?','এই ট্যাবের অসংরক্ষিত পরিবর্তন বাদ দিয়ে সংরক্ষিত পরিবার লোড করবেন?'))) return;
    snap=F.read(db);legacy=B.readCandidates(db);panel=null;message=null;stale=false;legacyMatches=false;updateChart();compareLegacy();
  }
  async function transact(change,{base,checkLegacy,replacement=false}={}){
    if (busy || stale) return;
    if (!locks){problem({code:'noLock'});draw();return}
    busy=true;message=null;dateIssue=null;draw();
    try {
      const next=B.copy(base || snap.family || F.empty());
      await change(next);
      snap=await F.commit(db,locks,snap,next,checkLegacy,replacement?family=>{
        const intended=F.backup('family',family);
        try{
          sessionStorage.setItem(recoveryKey,intended);
          pending=sessionStorage.getItem(recoveryKey);
          if(pending!==intended)throw Error();
        }catch{B.fail('recoveryCopy')}
      }:undefined);
      if(replacement){
        try{sessionStorage.removeItem(recoveryKey);pending=sessionStorage.getItem(recoveryKey)}catch{}
      }
      panel=null;el('backup-file').value='';
      note('Saved and verified on this device.','এই ডিভাইসে সংরক্ষণ ও যাচাই হয়েছে।');
      updateChart();compareLegacy();
    } catch(e){problem(e)}
    finally {busy=false;draw()}
  }
  function formRecord(){
    const result=B.copy(draft);
    if (host.formDraft()){
      result.dob=el('dob').value;
      if (!B.date(result.dob) || result.dob<'2000-01-01' || result.dob>el('dob').max) B.fail('dob');
      if(host.nameChanged()) result.name=el('nm').value;
    }
    return B.validateRecord(result);
  }
  function edit(fn){
    if(busy || panel || stale || !record())return;
    const id=snap.family.activeChildId;
    fn(draft);draft.t=Date.now();
    host.show(B.runtime(draft));
    transact(f=>{f.profilesById[id].record=B.copy(draft)});
  }
  function switchChild(id){
    if (!snap.family?.profilesById[id] || id===snap.family.activeChildId || busy)return;
    if (dirty()) return preview({type:'switch',id});
    transact(f=>{f.activeChildId=id});
  }
  function saveSwitch(p,save){
    let edited;
    try {if(save)edited=formRecord()}catch(e){problem(e);draw();return}
    if (edited && edited.dob!==record().dob && !p.dobConfirmed){
      preview({...p,type:'switch-dob',edited});return;
    }
    transact(f=>{
      if(edited){edited.t=Date.now();f.profilesById[f.activeChildId].record=edited}
      f.activeChildId=p.id;
    });
  }
  function identity(name,dob,nameChanged){
    if(busy || panel || stale || (!record() && (snap.state==='damaged' || hasLegacy() && snap.state==='absent')))return;
    const r=record()?B.copy(draft):B.runtime({});
    r.dob=dob;if(nameChanged || !record())r.name=name;
    try{B.validateRecord(r)}catch(e){problem(e);draw();return}
    if(record() && record().dob!==dob) return preview({type:'dob',r});
    storeIdentity(r);
  }
  function storeIdentity(r){transact(f=>{r.t=Date.now();if(f.activeChildId)f.profilesById[f.activeChildId].record=r;else F.add(f,r)}, {checkLegacy:snap.state==='absent'?legacy:undefined})}
  async function chooseFile(file){
    if(!file || busy || panel)return;
    busy=true;message=null;draw();let p;
    try{
      if(file.size>F.limit)B.fail('size');
      const data=F.unpack(new TextDecoder('utf-8',{fatal:true}).decode(await file.arrayBuffer()));
      if(snap.state==='damaged' && data.kind!=='family') B.fail('unsupported');
      p={type:data.kind,...data,legacy};
    }catch(e){problem(e)}
    finally{busy=false;el('backup-file').value='';if(p)preview(p);else draw()}
  }
  function renderPreview(){
    const box=el('profile-preview');box.hidden=!panel;box.replaceChildren();if(!panel)return;
    const p=panel;
    const titles={
      add:['Add child','শিশু যোগ করুন'],switch:['Unsaved changes','অসংরক্ষিত পরিবর্তন'],
      'switch-dob':['Confirm DOB and switch','জন্মতারিখ নিশ্চিত করে শিশু বদলান'],dob:['Review DOB correction','জন্মতারিখ সংশোধন যাচাই'],
      delete:['Delete this child?','এই শিশুর রেকর্ড মুছবেন?'],family:['Restore family backup','পরিবারের ব্যাকআপ পুনরুদ্ধার'],
      child:['Import individual child','এক শিশুর ব্যাকআপ আমদানি'],legacy:['Import Phase 1 record','ফেজ ১ রেকর্ড আমদানি'],migrate:['Migration preview','স্থানান্তরের প্রিভিউ']
    };
    text(box,'h3',tr(...titles[p.type]));
    const blocked=busy || !locks || stale || snap.state==='unreadable' || (pending!==null && (p.type==='family' || snap.state==='damaged'));
    const action=(id,label,fn)=>button(box,id,label,fn,blocked);
    if(dirty() && !['switch','switch-dob','dob'].includes(p.type)){
      const label=text(box,'label',tr('Discard this tab’s unsaved edits when I confirm','নিশ্চিত করলে এই ট্যাবের অসংরক্ষিত পরিবর্তন বাদ দিন'));
      const check=document.createElement('input');check.type='checkbox';check.checked=!!p.discard;check.disabled=busy;
      check.onchange=()=>{p.discard=check.checked;draw();el('discard-ack').focus()};check.id='discard-ack';label.prepend(check);
    }
    if(p.type==='add'){
      for(const [key,title,type] of [['name',tr('Name (optional)','নাম (ঐচ্ছিক)'),'text'],['dob',tr('Date of birth','জন্মতারিখ'),'date']]){
        const l=text(box,'label',title);l.htmlFor='add-'+key;
        const n=document.createElement('input');n.id=l.htmlFor;n.type=type;n.maxLength=60;if(type==='date')n.max=el('dob').max;
        n.value=p[key] || '';n.disabled=busy;n.oninput=()=>{p[key]=n.value};box.append(n);
      }
      action('confirm-profile',tr('Create child','শিশু তৈরি করুন'),()=>{
        const r=B.runtime({name:p.name || '',dob:p.dob || '',t:Date.now()});
        try{B.validateRecord(r)}catch{problem({code:'dob'});draw();return}
        transact(f=>F.add(f,r),{checkLegacy:snap.state==='absent'?legacy:undefined});
      });
    }else if(p.type==='switch'){
      text(box,'p',tr('Switch to ','যে শিশুর রেকর্ড খুলবেন · ')+label(p.id,snap.family.profilesById[p.id].record));
      action('save-switch',tr('Save and switch','সংরক্ষণ করে বদলান'),()=>saveSwitch(p,true));
      action('discard-switch',tr('Discard and switch','পরিবর্তন বাদ দিয়ে বদলান'),()=>saveSwitch(p,false));
    }else if(p.type==='dob' || p.type==='switch-dob'){
      const r=p.r || p.edited;
      text(box,'p',record().dob+' → '+r.dob+' · '+tr('Recorded history and products will be kept.','সংরক্ষিত ইতিহাস ও পণ্য রাখা হবে।'));
      if(historical(r))text(box,'p',reviewDates());
      action('confirm-profile',tr('Confirm correction','সংশোধন নিশ্চিত করুন'),()=>p.type==='dob'?storeIdentity(r):saveSwitch({...p,dobConfirmed:true},true));
    }else if(p.type==='delete'){
      text(box,'p',label(p.id,record())+' · '+tr('This removes this child and all their vaccination history from this device.','এই ডিভাইস থেকে এই শিশুর সব টিকার ইতিহাস মুছে যাবে।'));
      button(box,'copy-before-delete',tr('Back up this child','এই শিশুর ব্যাকআপ'),()=>childCopy(record()));
      action('confirm-profile',tr('Confirm deletion','মুছে ফেলা নিশ্চিত করুন'),()=>transact(f=>{delete f.profilesById[p.id];f.activeChildId=Object.keys(f.profilesById)[0] || null}));
    }else{
      const isFamily=p.type==='family',migration=p.type==='migrate',r=migration?p.c.record:p.data;
      if(isFamily || snap.state==='damaged'){
        text(box,'p',tr('Replace the entire current family on this device.','এই ডিভাইসের বর্তমান পরিবারের সব তথ্য প্রতিস্থাপন হবে।'));
        text(box,'pre',familyList(snap.family));
        if(snap.raw!==null)button(box,'copy-before-replace',tr('Download current stored copy','বর্তমান সংরক্ষিত কপি ডাউনলোড'),familyCopy);
      }
      if(isFamily){
        text(box,'p',tr('Incoming children','ব্যাকআপে শিশু')+' · '+Object.keys(r.profilesById).length);
        text(box,'pre',familyList(r));
        if(r.activeChildId)text(box,'p',tr('Selected child','নির্বাচিত শিশু')+' · '+label(r.activeChildId,r.profilesById[r.activeChildId].record));
      }else{
        text(box,'p',tr('Creates one new child. Existing legacy records are retained.','একটি নতুন শিশু তৈরি হবে। পুরোনো রেকর্ড রাখা হবে।'));
        if(migration)text(box,'p',p.c.key);
        text(box,'p',summary(r));
      }
      action('confirm-profile',tr('Confirm','নিশ্চিত করুন'),()=>transact(async f=>{
        if(migration){
          const hashes=await F.fingerprints(p.legacy);
          if(B.same(hashes,f.migration?.hashes))B.fail('already');
          f.migration={source:p.c.key,hashes};
        }
        if(!isFamily)F.add(f,r);
      },{base:isFamily?r:undefined,checkLegacy:migration || snap.state==='absent'?p.legacy:undefined,replacement:isFamily || snap.state==='damaged'}));
    }
    button(box,'cancel-profile',tr('Cancel','বাতিল'),close);
    if(el('discard-ack') && !p.discard)el('confirm-profile').disabled=true;
  }
  function draw(){
    const valid=!!snap.family, selected=record(), id=snap.family?.activeChildId;
    const trapped=!!panel || busy, blocked=trapped || !locks || stale || snap.state==='unreadable';
    const lockedSetup=snap.state==='damaged' || snap.state==='unreadable' || (!valid && hasLegacy());
    el('setup').inert=trapped || lockedSetup || stale;el('view').inert=trapped || stale;
    el('setup').toggleAttribute('hidden',lockedSetup);
    el('profile-title').textContent=tr('My Children','আমার শিশুরা');
    el('profile-label').textContent=tr('View child','শিশুর রেকর্ড দেখুন');
    const sel=el('profile-select');sel.replaceChildren();sel.disabled=blocked || !selected;
    for(const [pid,p] of Object.entries(snap.family?.profilesById || {}))sel.add(new Option(label(pid,p.record),pid));
    if(id)sel.value=id;else sel.add(new Option(tr('No child selected','কোনো শিশু নির্বাচিত নেই'),''));
    el('profile-current').textContent=id?tr('Selected child','নির্বাচিত শিশু')+' · '+label(id,selected):'';
    const actions=el('profile-actions');actions.replaceChildren();
    if(valid || !lockedSetup)button(actions,'add-child',tr('Add child','শিশু যোগ করুন'),()=>preview({type:'add'}),blocked);
    if(selected){
      button(actions,'edit-child',tr('Edit child','শিশুর তথ্য সম্পাদনা'),()=>el('edit').click(),blocked || host.editing());
      button(actions,'delete-child',tr('Delete child','শিশুর রেকর্ড মুছুন'),()=>preview({type:'delete',id}),blocked);
    }
    el('backup-title').textContent=tr('Backup & restore','ব্যাকআপ ও পুনরুদ্ধার');
    el('backup-hint').textContent=tr('Private local files. Family limit 8 MiB, individual limit 1 MiB. Profiles do not sync between browsers, private sessions or devices. Clearing browser data can erase them. Downloads contain the last read saved data. The browser cannot verify that you kept a copy.','ব্যক্তিগত স্থানীয় ফাইল। পরিবারের সীমা ৮ MiB, এক শিশুর ১ MiB। ব্রাউজার, ব্যক্তিগত সেশন বা ডিভাইসের মধ্যে রেকর্ড সিঙ্ক হয় না। ব্রাউজারের তথ্য মুছলে রেকর্ড হারাতে পারে। ডাউনলোডে সর্বশেষ পড়া সংরক্ষিত তথ্য থাকে। কপি রেখেছেন কি না ব্রাউজার যাচাই করতে পারে না।');
    el('file-label').textContent=tr('Choose a JSON backup to preview','প্রিভিউ দেখতে JSON ব্যাকআপ বেছে নিন');
    el('backup-file').disabled=trapped;
    const backups=el('backup-actions');backups.replaceChildren();
    if(valid)button(backups,'export-family',tr('Back up all children','সব শিশুর ব্যাকআপ'),familyCopy);
    if(selected)button(backups,'export-child',tr('Back up this child','এই শিশুর ব্যাকআপ'),()=>childCopy(selected));
    if(!B.same(draft,selected || {}) && draft.dob){
      button(backups,'export-draft',tr('Download unsaved chart','অসংরক্ষিত চার্ট ডাউনলোড'),()=>childCopy(draft,true));
      button(backups,'retry-edit',tr('Retry save','আবার সংরক্ষণ করুন'),()=>edit(()=>{}),blocked || host.editing());
    }
    if(host.formDraft())button(backups,'export-form-draft',tr('Download unsaved profile edits','অসংরক্ষিত প্রোফাইল ডাউনলোড'),()=>{
      try{childCopy(formRecord(),true)}catch(e){problem(e);draw()}
    });
    if(stale || snap.state==='unreadable')button(backups,'reload-family',tr('Reload saved family','সংরক্ষিত পরিবার পুনরায় লোড'),reload);
    const recovery=el('legacy-sources');recovery.replaceChildren();
    if(snap.state==='damaged'){
      text(recovery,'p',tr('Family data is damaged. Download the stored bytes before replacing it with a family backup or a reviewed legacy record.','পরিবারের তথ্য ক্ষতিগ্রস্ত। পরিবারের ব্যাকআপ বা যাচাইকৃত পুরোনো রেকর্ড দিয়ে প্রতিস্থাপনের আগে সংরক্ষিত কপি ডাউনলোড করুন।'));
      button(recovery,'damaged-family',tr('Download damaged copy','ক্ষতিগ্রস্ত কপি ডাউনলোড'),familyCopy);
    }
    if(legacyMatches && hasLegacy())button(recovery,'show-legacy',tr('Original legacy copies','মূল পুরোনো কপি'),()=>{inspectLegacy=!inspectLegacy;draw()});
    if((hasLegacy() || snap.family?.migration) && (!legacyMatches || inspectLegacy)){
      text(recovery,'p',legacyMatches?tr('Original sources retained after migration.','স্থানান্তরের পর মূল উৎসগুলো রাখা হয়েছে।'):valid?tr('Legacy records differ or have not been imported. Review before adding a separate child.','পুরোনো রেকর্ড বদলেছে বা আমদানি হয়নি। আলাদা শিশু যোগ করার আগে যাচাই করুন।'):tr('Review each legacy source. Close older planner tabs and download a copy before migration.','প্রতিটি পুরোনো উৎস যাচাই করুন। স্থানান্তরের আগে পুরোনো ট্যাব বন্ধ করে কপি ডাউনলোড করুন।'));
      for(const c of legacy.filter(c=>c.state!=='absent')){
        const v=c.key.slice(-2);
        text(recovery,'p',v+' · '+(c.record?summary(c.record):tr('Unreadable or unsupported record','অপাঠ্য বা অসমর্থিত রেকর্ড')));
        if(typeof c.raw==='string')button(recovery,'copy-'+v,tr('Download original','মূল কপি ডাউনলোড')+' '+v,()=>rawCopy(c.raw,'cvp-legacy-'+v+'.json'));
        if(c.record && !legacyMatches)button(recovery,'migrate-'+v,tr('Preview migration','স্থানান্তরের প্রিভিউ')+' '+v,()=>preview({type:'migrate',c,legacy}),blocked || legacy.some(x=>x.state==='unreadable'));
      }
    }
    if(pending!==null){
      text(recovery,'p',tr('This tab has a recovery copy from a family replacement. Compare it with the stored family. Download it before closing this tab.','এই ট্যাবে পরিবার প্রতিস্থাপনের পুনরুদ্ধার কপি আছে। সংরক্ষিত পরিবারের সঙ্গে মিলিয়ে ট্যাব বন্ধের আগে ডাউনলোড করুন।'));
      button(recovery,'export-pending',tr('Download replacement copy','প্রতিস্থাপনের কপি ডাউনলোড'),()=>download(pending,'cvp-family-recovery.json'));
      button(recovery,'dismiss-pending',tr('Dismiss recovery copy','পুনরুদ্ধার কপি সরান'),()=>{
        if(confirm(tr('Remove the recovery copy from this tab?','এই ট্যাব থেকে পুনরুদ্ধার কপি সরাবেন?'))){try{sessionStorage.removeItem(recoveryKey);pending=sessionStorage.getItem(recoveryKey)}catch{problem({code:'unreadable'})}draw()}
      });
    }
    const status=busy?tr('Verifying…','যাচাই চলছে…'):message?tr(...message):snap.state==='unreadable'?tr('Cannot read browser storage.','ব্রাউজার স্টোরেজ পড়া যাচ্ছে না।'):'';
    const msg=[status,dirty() && tr('This tab has unsaved edits.','এই ট্যাবে অসংরক্ষিত পরিবর্তন আছে।'),selected && historical(draft) && reviewDates()].filter(Boolean).join(' ');
    const oldIssue=el('date-rejection');
    if(oldIssue){el('rows').querySelector('[aria-describedby="date-rejection"]')?.removeAttribute('aria-describedby');oldIssue.remove()}
    el('dob').toggleAttribute('aria-invalid',dateIssue?.kind==='dob');
    if(dateIssue?.kind==='dob'){el('dob').setAttribute('aria-invalid','true');el('err').textContent=status}
    else if(dateIssue){
      const input=el('rows').querySelector('input.'+dateIssue.kind+'[data-id="'+dateIssue.id+'"]');
      if(input){const n=document.createElement('span');n.id='date-rejection';n.className='inline-note';n.setAttribute('role','alert');n.textContent=status;input.parentElement.after(n);input.setAttribute('aria-describedby',n.id)}
    }
    el('profile-status').textContent=msg;el('backup-status').textContent=msg;el('store').textContent=msg;
    el('backup-lock').textContent=locks?'':tr('Saving requires Web Locks on a secure origin. Preview and export remain available.','সংরক্ষণ করতে নিরাপদ সংযোগে Web Locks প্রয়োজন। প্রিভিউ ও ব্যাকআপ করা যাবে।');
    const before=el('backup-before-edit');before.hidden=!host.editing() || !selected;before.textContent=tr('Back up before editing','সম্পাদনার আগে ব্যাকআপ');before.onclick=()=>childCopy(selected);
    el('cancel-edit').hidden=!host.editing();el('cancel-edit').textContent=tr('Cancel edit','সম্পাদনা বাতিল');
    el('original-name').hidden=!host.storedName();el('original-name').querySelector('pre').textContent=host.storedName();
    el('original-name').querySelector('span').textContent=tr('Original name (preserved unless edited)','মূল নাম (সম্পাদনা না করলে অপরিবর্তিত থাকবে)');
    renderPreview();
  }
  el('profile-select').onchange=e=>{const id=e.target.value;e.target.value=snap.family.activeChildId;switchChild(id)};
  el('backup-file').onchange=e=>chooseFile(e.target.files[0]);
  el('setup').addEventListener('input',()=>{if(!busy && !panel){message=null;dateIssue=null;el('err').textContent='';draw()}});
  window.addEventListener('storage',e=>{
    if(e.key===null || e.key===F.key){if(F.read(db).raw!==snap.raw){problem({code:'conflict'});draw()}}
    if(e.key===null || B.keys.includes(e.key)){legacy=B.readCandidates(db);legacyMatches=false;compareLegacy();draw()}
  });
  function rejectDate(id,kind){
    dateIssue={id,kind};
    message=kind==='dob'?['Enter a valid birth date from 2000 through today.','২০০০ সাল থেকে আজকের মধ্যে একটি বৈধ জন্মতারিখ দিন।']:['Invalid date. Previous date retained.','তারিখ অবৈধ। আগের তারিখ রাখা হয়েছে।'];
    if(kind==='dob')el('err').textContent=tr(...message);draw();
  }
  queueMicrotask(compareLegacy);
  return {initial:B.runtime(draft),edit,identity,draw,rejectDate,clearDateIssue(){message=null;dateIssue=null}};
}
