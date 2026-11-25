import fs from 'node:fs';
import vm from 'node:vm';

export const cases = [
  {dob:'2024-01-31'},
  {dob:'2024-02-29', rotaBrand:'rotarix', products:{fluHistory:'one',varTiming:'routine'},actual:{rv1:'2024-06-30',rv2:'2024-09-01'}},
  {dob:'2024-01-31', actual:{g1:'2024-04-10',g2:'2024-05-10'}, ov:{g2:'2024-05-01'}, done:{g0:true,g1:true,g2:true}},
  {dob:'2023-12-31', rotaBrand:'rotateq', ov:{rv1:'2024-04-01',rv2:'2024-06-30',rv3:'2024-09-01',ha2:'2026-01-01'},products:{hepBrand:'vaqta',mmrBrand:'mmrv'}},
  {dob:'2024-01-01', rotaBrand:'rotarix', ov:{rv1:'2024-04-14',rv2:'2024-06-17',ha2:'2026-02-02'},products:{hepBrand:'havrix'}},
  {dob:'2024-01-01', rotaBrand:'rotateq', ov:{rv1:'2024-03-25',rv2:'2024-06-03',rv3:'2024-08-12'}}
];

export function engineOutput(record, source=new URL('../site/index.html',import.meta.url)) {
  const html=fs.readFileSync(source,'utf8');
  const ctx=vm.createContext({});
  vm.runInContext(html.slice(html.indexOf('var T='),html.indexOf('function nm()')),ctx);
  Object.assign(ctx.S,structuredClone(record));
  ctx.today=()=>ctx.pd('2026-11-25');
  return ctx.sched().map(r=>({id:r.v.id, date:ctx.iso(r.d), baseline:ctx.iso(r.baseline),
    earliest:r.earliest&&ctx.iso(r.earliest), source:r.source, warnings:ctx.rowWarnings(r,ctx.pd(ctx.S.dob))}));
}

