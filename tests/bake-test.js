const fs=require('fs'); const FC=require('../js/font-core.js');
(async()=>{
 const p=process.argv[2]; const on=new Set((process.argv[3]||'').split(',').filter(Boolean)); const off=new Set((process.argv[4]||'').split(',').filter(Boolean)); const out=process.argv[5];
 const buf=fs.readFileSync(p); const f=await FC.readFont(buf.buffer.slice(buf.byteOffset,buf.byteOffset+buf.length));
 const a=FC.analyzeFeatures(f.tables);
 console.log(f.kind, a.features.map(x=>x.tag+(x.params?'*':'')).join(' '));
 const tables={...f.tables}; delete tables.DSIG;
 for(const t of ['GSUB','GPOS']){ if(tables[t]){ const r=FC.bakeLayout(tables[t],on,off); console.log(t,'changed',r.changed,r.newTag||'',r.newFeatureCount||0, tables[t].length,'->',r.bytes.length); tables[t]=r.bytes; } }
 const s=FC.buildSfnt(f.flavor,tables); fs.writeFileSync(out,s.bytes);
 const w=await FC.buildWoff(s); fs.writeFileSync(out+'.woff',w);
 const r2=await FC.readFont(w.buffer.slice(w.byteOffset,w.byteOffset+w.length)); console.log('woff roundtrip tables', Object.keys(r2.tables).length, Buffer.compare(Buffer.from(r2.tables.GSUB||[]),Buffer.from(tables.GSUB||[]))===0);
})();
