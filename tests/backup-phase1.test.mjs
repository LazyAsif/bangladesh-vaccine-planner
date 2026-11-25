import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {cases, engineOutput} from './engine-baseline.mjs';
import '../site/assets/backup-v1.js';

const api=globalThis.CVPBackup;
const [v4,v3]=api.keys;
const sample={dob:'2024-01-31',name:"ডেমো O'Brien <sample>",done:{g0:true,g1:true,rv3:false,g00:false},actual:{g1:'2024-04-10',fl2:'2025-02-01'},ov:{g1:'2024-04-08',rv3:'2024-06-10'},rotaBrand:'rotarix',products:{fluHistory:'one'},t:123};
const locks={request:(_name,fn)=>Promise.resolve().then(fn)};
class Storage {
  constructor(seed={}) {this.data=new Map(Object.entries(seed));this.writes=[];}
  getItem(k) {return this.data.get(k)??null;}
  setItem(k,v) {this.data.set(k,v);this.writes.push(k);}
  removeItem(k) {this.data.delete(k);this.writes.push(k);}
}
const json=JSON.stringify;
const expectCode=code=>e=>e.code===code;

test('original v1.10 full row outputs survive file round trip and verified reload',async()=>{
  const baseline=JSON.parse(fs.readFileSync(new URL('./v1.10-engine.json',import.meta.url)));
  for (const [i,r] of cases.entries()) {
    assert.deepEqual(JSON.parse(json(engineOutput(r))),baseline[i]);
    const db=new Storage();
    const incoming=api.parseBackup(api.buildBackup(r));
    await api.commitRecord(db,locks,api.readCandidates(db),incoming,'restore');
    const saved=api.selected(api.readCandidates(db)).record;
    assert.deepEqual(saved,r);
    assert.deepEqual(JSON.parse(json(engineOutput(saved))),baseline[i]);
  }
});
test('archived v1.10 engine independently reproduces all frozen rows',{skip:!process.env.CVP_V110_SITE},()=>{
  const baseline=JSON.parse(fs.readFileSync(new URL('./v1.10-engine.json',import.meta.url)));
  for(const [index,record] of cases.entries()){
    const rows=engineOutput(record,path.join(process.env.CVP_V110_SITE,'index.html'));
    assert.deepEqual(JSON.parse(json(rows)),baseline[index]);
  }
});
test('a stale preview or failed tab recovery preparation cannot write the primary record',async()=>{
  const db=new Storage({[v4]:json(sample)}), expected=api.readCandidates(db);
  let attempts=0;
  const blocked=()=>{attempts++;api.fail('recoveryStorage')};
  await assert.rejects(api.commitRecord(db,locks,expected,sample,'restore',()=>false,blocked),expectCode('conflict'));
  assert.equal(attempts,0);
  await assert.rejects(api.commitRecord(db,locks,expected,sample,'restore',()=>true,blocked),expectCode('recoveryStorage'));
  assert.equal(attempts,1);assert.deepEqual(db.writes,[]);assert.equal(db.getItem(v4),json(sample));
});
test('raw and enveloped records preserve field presence and hidden data',async()=>{
  for (const r of [{dob:'2024-02-29'},{dob:'2024-02-29',name:'',ov:{},t:0},sample]) {
    const raw=json(r), db=new Storage({[v3]:raw});
    for (const file of [raw,api.buildBackup(r)]) {
      const next=api.parseBackup('\uFEFF'+file);
      const view=api.runtime(next); view.products.varTiming='early'; view.done.g0=false;
      assert.deepEqual(next,r);
      await api.commitRecord(db,locks,api.readCandidates(db),next,'restore');
      assert.equal(db.getItem(v3),raw);
      assert.deepEqual(JSON.parse(db.getItem(v4)),r);
    }
  }
});
test('each legacy key is inspected independently; startup and preview are read only',()=>{
  const raw=json(sample), alternate=json({dob:'2023-03-03'});
  for (const [primary,alt,states,source,editable] of [
    [null,null,['absent','absent'],null,true],[raw,null,['valid','absent'],v4,true],
    [null,raw,['absent','valid'],v3,true],[raw,raw,['valid','valid'],v4,true],
    [raw,alternate,['valid','valid'],v4,true],['{',raw,['malformed','valid'],v3,false],
    ['',raw,['malformed','valid'],v3,false],['{"future":1}',raw,['unsupported','valid'],v3,false],
    [raw,'{',['valid','malformed'],v4,true],['{','{',['malformed','malformed'],null,false]
  ]) {
    const db=new Storage({[v4]:primary,[v3]:alt});
    const snapshot=api.readCandidates(db);
    assert.deepEqual(snapshot.map(x=>x.state),states);
    assert.equal(api.selected(snapshot)?.key??null,source);
    assert.equal(api.editable(snapshot),editable);
    assert.deepEqual(db.writes,[]);
  }
  const db=new Storage({[v3]:raw});
  db.getItem=k=>{if (k===v4) throw Error(); return raw;};
  assert.deepEqual(api.readCandidates(db).map(c=>c.state),['unreadable','valid']);
});
test('rejects malformed, duplicate, unsafe, unsupported and oversize files',()=>{
  const invalid=[
    ['{','malformed'],['[]','invalid'],['{}','invalid'],['null','invalid'],
    ['{"dob":"2023-02-29"}','invalid'],['{"dob":"2999-01-01"}','unsupported'],
    [json({...sample,done:{g0:1}}),'invalid'],[json({...sample,t:-1}),'unsupported'],
    ['{"dob":"2024-01-01","t":1.00000000000000001}','unsupported'],
    [json({...sample,name:'x'.repeat(61)}),'invalid'],[json({...sample,extra:3}),'unsupported'],
    [json({...sample,done:{xx:false}}),'unsupported'],[json({...sample,rotaBrand:2}),'unsupported'],
    [json({...sample,products:{fluHistory:'new'}}),'unsupported'],
    ['{"dob":"2024-01-01","actual":{"g0":"2024-01-01","\\u00670":"2024-01-02"}}','duplicate'],
    ['{"dob":"2024-01-01","__proto__":{}}','unsupported'],
    [json({...JSON.parse(api.buildBackup(sample)),backupVersion:2}),'unsupported'],
    [json({...JSON.parse(api.buildBackup(sample)),exportedAt:'2026-02-30T00:00:00Z'}),'invalid'],
    [' '.repeat(api.limit+1),'size']
  ];
  for(const [file,code] of invalid) assert.throws(()=>api.parseBackup(file),expectCode(code));
  assert.equal(api.parseBackup(json({dob:'2024-01-01'}).padEnd(api.limit,' ')).dob,'2024-01-01');
});
test('writes require exact snapshots, check both keys inside the lock',async()=>{
  for(const key of [v4,v3]) {
    const db=new Storage(), expected=api.readCandidates(db);
    const delay={request:(_name,fn)=>{db.data.set(key,'{}');return fn();}};
    await assert.rejects(api.commitRecord(db,delay,expected,sample,'restore'),expectCode('conflict'));
    assert.deepEqual(db.writes,[]);
  }
  const db=new Storage(), snap=api.readCandidates(db);
  await api.commitRecord(db,locks,snap,sample,'restore');
  await assert.rejects(api.commitRecord(db,locks,snap,{...sample,name:'stale'},'edit'),expectCode('conflict'));
  assert.equal(db.writes.length,1);
});
test('without Web Locks preview/export work; restore and delete cannot write',async()=>{
  const db=new Storage({[v4]:json(sample)}), snap=api.readCandidates(db);
  assert.deepEqual(api.parseBackup(api.buildBackup(snap[0].record)),sample);
  for(const mode of ['restore','delete']) await assert.rejects(api.commitRecord(db,null,snap,sample,mode),expectCode('noLock'));
  assert.deepEqual(db.writes,[]);
});
test('write and verification errors stay distinct; no automatic rollback',async()=>{
  const db=new Storage({[v4]:json(sample)}),snap=api.readCandidates(db);
  db.setItem=()=>{throw Error('quota');};
  await assert.rejects(api.commitRecord(db,locks,snap,{...sample,name:'draft'},'edit'),expectCode('write'));
  assert.equal(db.getItem(v4),json(sample));
  db.setItem=(k,v)=>{db.data.set(k,v);db.getItem=()=>{throw Error();};};
  await assert.rejects(api.commitRecord(db,locks,snap,sample,'restore'),expectCode('uncertain'));
  const other=new Storage();
  other.setItem=(k)=>other.data.set(k,json({dob:'2023-01-01'}));
  await assert.rejects(api.commitRecord(other,locks,api.readCandidates(other),sample,'restore'),expectCode('uncertain'));
  assert.equal(other.getItem(v4),json({dob:'2023-01-01'}));
});
test('recovery needs confirmation; stale preview and unreadable destination cannot write',async()=>{
  const db=new Storage({[v4]:'{',[v3]:json(sample)}),snap=api.readCandidates(db);
  await assert.rejects(api.commitRecord(db,locks,snap,sample,'edit'),expectCode('recovery'));
  await assert.rejects(api.commitRecord(db,locks,snap,sample,'restore',()=>false),expectCode('conflict'));
  assert.deepEqual(db.writes,[]);
  await api.commitRecord(db,locks,snap,sample,'restore');
  assert.equal(db.getItem(v3),json(sample));
  db.getItem=()=>{throw Error();};
  await assert.rejects(api.commitRecord(db,locks,api.readCandidates(db),sample,'restore'),expectCode('unreadable'));
});

