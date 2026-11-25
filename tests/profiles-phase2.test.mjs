import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {cases,engineOutput} from './engine-baseline.mjs';
import '../site/assets/backup-v1.js';
import '../site/assets/profiles-v1.js';
const F=globalThis.CVPProfiles, B=globalThis.CVPBackup;
const sample={name:'  ডেমো\r\n A  ',dob:'2024-01-31',done:{g0:true,rv3:false,g00:true},actual:{g1:'2024-04-03'},ov:{g1:'2024-04-01',rv3:'2025-01-01'},rotaBrand:'rotarix',products:{fluHistory:'one',mmrBrand:'mmrv'},t:17};
const json=JSON.stringify, locks={request:(key,fn)=>{assert.equal(key,F.key);return fn()}};
const code=c=>e=>e.code===c;
function storage(seed={}){
  const map=new Map(Object.entries(seed)), writes=[];
  return {map,writes,getItem:k=>map.get(k)??null,setItem(k,v){writes.push(k);map.set(k,v)}};
}
test('both candidate sources survive verified migration, including damaged and conflicting v4',async()=>{
  for(const raw of ['{',json({...sample,name:'Different'})]){
    const db=storage({[B.keys[0]]:raw,[B.keys[1]]:json(sample)}),initial=F.read(db),legacy=B.readCandidates(db);
    const f=F.empty();const id=F.add(f,legacy[1].record);
    f.migration={source:B.keys[1],hashes:await F.fingerprints(legacy)};
    assert.equal(db.writes.length,0);
    await F.commit(db,locks,initial,f,legacy);
    assert.deepEqual(F.read(db).family.profilesById[id].record,sample);
    assert.deepEqual(db.writes,[F.key]);
    assert.equal(db.getItem(B.keys[0]),raw);assert.equal(db.getItem(B.keys[1]),json(sample));
    await assert.rejects(F.commit(db,locks,initial,f,legacy),code('conflict'));
    db.map.set(B.keys[1],json({...sample,t:19}));
    assert.notDeepEqual(await F.fingerprints(B.readCandidates(db)),f.migration.hashes);
    await assert.rejects(F.commit(db,locks,F.read(db),f,legacy),code('conflict'));
    assert.deepEqual(db.writes,[F.key]);
  }
});
test('strict family and individual formats, fresh IDs, unchanged sparse records, selected ID after reload',async()=>{
  const f=F.empty(), a=F.add(f,sample), sparse={dob:'2024-02-29'};
  const b=F.add(f,sparse);
  for(const [raw,r] of [[F.backup('child',sample),sample],[B.buildBackup(sample),sample],[json(sparse),sparse]]){
    const input=F.unpack(raw);const id=F.add(f,input.data);
    assert.notEqual(id,a);assert.deepEqual(f.profilesById[id].record,r);
  }
  f.activeChildId=b;
  const restored=F.unpack(F.backup('family',f));
  const db=storage();await F.commit(db,locks,F.read(db),restored.data);
  const saved=F.read(db).family;assert.notEqual(saved.revision,f.revision);
  assert.deepEqual({...saved,revision:f.revision},f);
  assert.notEqual(saved.profilesById[a].record.done,sample.done);
});
test('reject duplicate members, invalid metadata, ambiguous or oversized data without writes',()=>{
  const f=F.empty(),id=F.add(f,sample),raw=F.backup('family',f);
  assert.throws(()=>F.unpack(raw.replace('"schemaVersion":1','"schemaVersion":1,"schemaVersion":1')),code('duplicate'));
  for(const mutate of [x=>x.extra=true,x=>x.activeChildId='absent',x=>x.profilesById[id].id='bad',x=>x.profilesById[id].record.ov.g1='2024-02-30',x=>x.migration={},x=>x.revision=1]){
    const bad=structuredClone(f);mutate(bad);assert.throws(()=>F.unpack(json({format:'cvp-family-backup',version:1,family:bad})));
  }
  for(const raw of ['{','{"__proto__":{}}','{"format":"future"}',json(sample)+' '.repeat(B.limit),' '.repeat(F.limit+1)])assert.throws(()=>F.unpack(raw));
  assert.equal(F.unpack(raw+' '.repeat(B.limit)).kind,'family');
});
test('protect damaged bytes, missing locks, quota, unreadable and unverifiable storage',async()=>{
  const db=storage({[F.key]:'bad'}),snap=F.read(db),next=F.empty();assert.equal(snap.state,'damaged');
  await assert.rejects(F.commit(db,null,snap,next),code('noLock'));
  db.setItem=()=>{throw Error('quota')};await assert.rejects(F.commit(db,locks,snap,next),code('write'));assert.equal(db.getItem(F.key),'bad');
  db.setItem=()=>{};await assert.rejects(F.commit(db,locks,snap,next),code('uncertain'));
  db.getItem=()=>{throw Error('unavailable')};assert.equal(F.read(db).state,'unreadable');
  await assert.rejects(F.commit(db,locks,snap,next),code('unreadable'));
});
test('family-backed engine matches all six frozen fixtures after selecting each child',()=>{
  const f=F.empty(),fixture=JSON.parse(fs.readFileSync(new URL('./v1.10-engine.json',import.meta.url)));
  const ids=cases.map(r=>F.add(f,r));const restored=F.unpack(F.backup('family',f)).data;
  for(const [i,id] of ids.entries()){
    restored.activeChildId=id;
    const r=restored.profilesById[restored.activeChildId].record;
    assert.deepEqual(JSON.parse(json(engineOutput(B.runtime(r)))),fixture[i]);
  }
  assert.equal(fixture.flat().length,93);
});
