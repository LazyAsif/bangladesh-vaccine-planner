/* Family persistence. Only this key is writable by the Phase 2 application. */
globalThis.CVPProfiles = (() => {
  'use strict';
  const B = CVPBackup;
  const key = 'cvp-profiles-v1';
  const familyFormat = 'cvp-family-backup', childFormat = 'cvp-child-backup';
  const limit = 8 * 1024 * 1024;
  const token = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/;
  const bytes = s => new TextEncoder().encode(s);
  const empty = () => ({schemaVersion:1,revision:crypto.randomUUID(),activeChildId:null,profilesById:{},migration:null});
  function validate(f) {
    B.fields(f,['schemaVersion','revision','activeChildId','profilesById','migration'],'family');
    if (f.schemaVersion !== 1 || typeof f.revision !== 'string' || !token.test(f.revision)) B.fail('unsupported');
    const map = f.profilesById;
    if (!map || Array.isArray(map) || typeof map !== 'object') B.fail('invalid');
    for (const [id,p] of Object.entries(map)) {
      B.fields(p,['id','record'],'profile');
      if (!token.test(id) || p.id !== id) B.fail('invalid');
      B.validateRecord(p.record);
    }
    if (Object.keys(map).length ? typeof f.activeChildId !== 'string' || !Object.hasOwn(map,f.activeChildId) : f.activeChildId !== null) B.fail('invalid');
    if (f.migration !== null) {
      B.fields(f.migration,['source','hashes'],'migration');
      if (!B.keys.includes(f.migration.source) || !Array.isArray(f.migration.hashes) || f.migration.hashes.length !== 2 ||
          !f.migration.hashes.every(h=>h===null || typeof h==='string' && /^[0-9a-f]{64}$/.test(h)) ||
          !f.migration.hashes[B.keys.indexOf(f.migration.source)]) B.fail('invalid');
    }
    return f;
  }
  function read(db) {
    let raw;
    try { raw=db.getItem(key); } catch { return {state:'unreadable'}; }
    if (raw===null) return {state:'absent',raw};
    try {
      const family=validate(B.parse(raw));
      backup('family',family);
      return {state:'valid',raw,family};
    }
    catch { return {state:'damaged',raw}; }
  }
  async function fingerprints(candidates) {
    return Promise.all(candidates.map(async c=>{
      if (c.state==='unreadable') B.fail('unreadable');
      if (c.raw===null) return null;
      const digest=await crypto.subtle.digest('SHA-256',bytes(c.raw));
      return Array.from(new Uint8Array(digest),n=>n.toString(16).padStart(2,'0')).join('');
    }));
  }
  function add(f,record) {
    B.validateRecord(record);
    let id;
    do { id=crypto.randomUUID(); } while (Object.hasOwn(f.profilesById,id));
    f.profilesById[id]={id,record:B.copy(record)};
    f.activeChildId=id;
    return id;
  }
  function backup(kind,data) {
    const file=kind==='family' ? {format:familyFormat,version:1,family:validate(data)} : {format:childFormat,version:1,record:B.validateRecord(data)};
    const raw=JSON.stringify(file);
    if (bytes(raw).length>(kind==='family'?limit:B.limit)) B.fail('size');
    return raw;
  }
  function unpack(raw) {
    if (bytes(raw).length>limit) B.fail('size');
    const obj=B.parse(raw);
    if (obj?.format===familyFormat || obj?.format===childFormat) {
      const family=obj.format===familyFormat;
      B.fields(obj,['format','version',family?'family':'record'],'backup');
      if (obj.version!==1) B.fail('unsupported');
      if (!family && bytes(raw).length>B.limit) B.fail('size');
      return family ? {kind:'family',data:validate(obj.family)} : {kind:'child',data:B.validateRecord(obj.record)};
    }
    return {kind:'legacy',data:B.parseBackup(raw)};
  }
  async function commit(db,locks,snapshot,next,legacy,beforeWrite) {
    if (!locks?.request) B.fail('noLock');
    const candidate=B.copy(validate(next));
    candidate.revision=crypto.randomUUID();
    backup('family',candidate); // Every accepted store can also be exported and imported.
    const raw=JSON.stringify(candidate);
    return locks.request(key,()=>{
      const current=read(db);
      if (current.state==='unreadable' || snapshot.state==='unreadable') B.fail('unreadable');
      if (current.raw!==snapshot.raw) B.fail('conflict');
      if (legacy) B.checkSnapshot(db,legacy);
      if (beforeWrite) beforeWrite(candidate);
      try { db.setItem(key,raw); } catch { B.fail('write'); }
      const saved=read(db);
      if (saved.state!=='valid' || saved.raw!==raw) B.fail('uncertain');
      return saved;
    });
  }
  return {key,limit,empty,validate,read,fingerprints,add,backup,unpack,commit};
})();
