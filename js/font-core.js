/* ===== FontCore: OpenType parsing / feature baking / name editing =====
 * Pure JS, no dependencies. Works in the browser and in Node (module.exports). */
const FontCore = (() => {
  const dvOf = u8 => new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
  const tag4 = (dv, o) => String.fromCharCode(dv.getUint8(o), dv.getUint8(o + 1), dv.getUint8(o + 2), dv.getUint8(o + 3));
  const putTag = (u8, o, t) => { for (let i = 0; i < 4; i++) u8[o + i] = t.charCodeAt(i) || 32; };
  const pad4 = n => (n + 3) & ~3;
  const fail = (code, msg) => { const e = new Error(msg || code); e.code = code; return e; };

  function checksum(u8) {
    const dv = dvOf(u8);
    const len = u8.length, full = len & ~3;
    let sum = 0;
    for (let i = 0; i < full; i += 4) sum = (sum + dv.getUint32(i)) >>> 0;
    if (len & 3) {
      let last = 0;
      for (let i = 0; i < 4; i++) last = ((last << 8) | (full + i < len ? u8[full + i] : 0)) >>> 0;
      sum = (sum + last) >>> 0;
    }
    return sum;
  }

  async function pipe(u8, Ctor, fmt) {
    const s = new Blob([u8]).stream().pipeThrough(new Ctor(fmt));
    return new Uint8Array(await new Response(s).arrayBuffer());
  }
  const inflate = u8 => pipe(u8, DecompressionStream, 'deflate');
  const deflate = u8 => pipe(u8, CompressionStream, 'deflate');

  /* ---------- container read / write ---------- */
  async function readFont(buf) {
    const u8 = new Uint8Array(buf);
    if (u8.length < 12) throw fail('BAD', 'small');
    const dv = dvOf(u8);
    const sig = dv.getUint32(0);
    const tables = {};
    if (sig === 0x774F4632) throw fail('WOFF2');
    if (sig === 0x74746366) throw fail('TTC');
    if (sig === 0x774F4646) {
      const flavor = dv.getUint32(4), n = dv.getUint16(12);
      for (let i = 0; i < n; i++) {
        const o = 44 + 20 * i;
        const tag = tag4(dv, o), off = dv.getUint32(o + 4), cl = dv.getUint32(o + 8), ol = dv.getUint32(o + 12);
        if (off + cl > u8.length) throw fail('BAD', 'table range');
        const raw = u8.slice(off, off + cl);
        tables[tag] = cl < ol ? await inflate(raw) : raw;
      }
      const kind = 'woff';
      return { kind, flavor, tables, isCFF: !!(tables['CFF '] || tables['CFF2']) };
    }
    if (sig === 0x00010000 || sig === 0x4F54544F || sig === 0x74727565) {
      const n = dv.getUint16(4);
      for (let i = 0; i < n; i++) {
        const o = 12 + 16 * i;
        const tag = tag4(dv, o), off = dv.getUint32(o + 8), len = dv.getUint32(o + 12);
        if (off + len > u8.length) throw fail('BAD', 'table range');
        tables[tag] = u8.slice(off, off + len);
      }
      const isCFF = !!(tables['CFF '] || tables['CFF2']);
      return { kind: isCFF ? 'otf' : 'ttf', flavor: sig, tables, isCFF };
    }
    throw fail('UNSUPPORTED');
  }

  function buildSfnt(flavor, tables) {
    const tags = Object.keys(tables).sort();
    const n = tags.length;
    let sr = 1, es = 0;
    while (sr * 2 <= n) { sr *= 2; es++; }
    sr *= 16;
    let total = 12 + 16 * n;
    const offs = {};
    for (const t of tags) { offs[t] = total; total += pad4(tables[t].length); }
    const out = new Uint8Array(total), dv = dvOf(out);
    dv.setUint32(0, flavor); dv.setUint16(4, n); dv.setUint16(6, sr); dv.setUint16(8, es); dv.setUint16(10, n * 16 - sr);
    const dir = [];
    tags.forEach((t, i) => {
      let data = tables[t];
      if (t === 'head') { data = data.slice(); dvOf(data).setUint32(8, 0); }
      out.set(data, offs[t]);
      const cs = checksum(data);
      const o = 12 + 16 * i;
      putTag(out, o, t);
      dv.setUint32(o + 4, cs); dv.setUint32(o + 8, offs[t]); dv.setUint32(o + 12, tables[t].length);
      dir.push({ tag: t, checksum: cs, offset: offs[t], length: tables[t].length });
    });
    if (offs.head !== undefined) {
      const whole = checksum(out);
      dv.setUint32(offs.head + 8, (0xB1B0AFBA - whole) >>> 0);
    }
    return { bytes: out, dir, flavor };
  }

  async function buildWoff(sfnt) {
    const n = sfnt.dir.length;
    const parts = [];
    for (const d of sfnt.dir) {
      const raw = sfnt.bytes.subarray(d.offset, d.offset + d.length);
      const c = await deflate(raw);
      parts.push(c.length < raw.length ? c : raw);
    }
    let off = 44 + 20 * n;
    const offs = parts.map(p => { const o = off; off += pad4(p.length); return o; });
    const out = new Uint8Array(off), dv = dvOf(out);
    dv.setUint32(0, 0x774F4646); dv.setUint32(4, sfnt.flavor); dv.setUint32(8, off);
    dv.setUint16(12, n); dv.setUint16(14, 0); dv.setUint32(16, sfnt.bytes.length);
    dv.setUint16(20, 1); dv.setUint16(22, 0);
    sfnt.dir.forEach((d, i) => {
      const o = 44 + 20 * i;
      putTag(out, o, d.tag);
      dv.setUint32(o + 4, offs[i]); dv.setUint32(o + 8, parts[i].length);
      dv.setUint32(o + 12, d.length); dv.setUint32(o + 16, d.checksum);
      out.set(parts[i], offs[i]);
    });
    return out;
  }

  /* ---------- tiny ZIP writer (stored) ---------- */
  let crcTable = null;
  function crc32(u8) {
    if (!crcTable) {
      crcTable = new Uint32Array(256);
      for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; crcTable[n] = c >>> 0; }
    }
    let c = 0xFFFFFFFF;
    for (let i = 0; i < u8.length; i++) c = crcTable[(c ^ u8[i]) & 0xFF] ^ (c >>> 8);
    return (c ^ 0xFFFFFFFF) >>> 0;
  }
  function makeZip(files) { // [{name, data:Uint8Array}]
    const enc = new TextEncoder();
    const locals = [], centrals = [];
    let offset = 0;
    for (const f of files) {
      const name = enc.encode(f.name), crc = crc32(f.data), size = f.data.length;
      const lh = new Uint8Array(30 + name.length), l = dvOf(lh);
      l.setUint32(0, 0x04034B50, true); l.setUint16(4, 20, true); l.setUint16(6, 0x0800, true); l.setUint16(8, 0, true);
      l.setUint16(10, 0, true); l.setUint16(12, 0x21, true); l.setUint32(14, crc, true); l.setUint32(18, size, true); l.setUint32(22, size, true);
      l.setUint16(26, name.length, true); l.setUint16(28, 0, true); lh.set(name, 30);
      const ch = new Uint8Array(46 + name.length), c = dvOf(ch);
      c.setUint32(0, 0x02014B50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true); c.setUint16(10, 0, true);
      c.setUint16(12, 0, true); c.setUint16(14, 0x21, true); c.setUint32(16, crc, true); c.setUint32(20, size, true); c.setUint32(24, size, true);
      c.setUint16(28, name.length, true); c.setUint32(42, offset, true); ch.set(name, 46);
      locals.push(lh, f.data); centrals.push(ch);
      offset += lh.length + size;
    }
    const cdSize = centrals.reduce((a, b) => a + b.length, 0);
    const end = new Uint8Array(22), e = dvOf(end);
    e.setUint32(0, 0x06054B50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true);
    e.setUint32(12, cdSize, true); e.setUint32(16, offset, true);
    const all = [...locals, ...centrals, end];
    const out = new Uint8Array(all.reduce((a, b) => a + b.length, 0));
    let p = 0; for (const a of all) { out.set(a, p); p += a.length; }
    return out;
  }

  /* ---------- GSUB / GPOS ---------- */
  function parseLayout(u8) {
    const dv = dvOf(u8);
    const major = dv.getUint16(0), minor = dv.getUint16(2);
    const hasFV = major === 1 && minor >= 1;
    const headerLen = hasFV ? 14 : 10;
    const slOff = dv.getUint16(4), flOff = dv.getUint16(6), llOff = dv.getUint16(8);
    const fvOff = hasFV ? dv.getUint32(10) : 0;
    const parseLS = lo => {
      const req = dv.getUint16(lo + 2), n = dv.getUint16(lo + 4), feats = [];
      for (let i = 0; i < n; i++) feats.push(dv.getUint16(lo + 6 + 2 * i));
      return { req, feats };
    };
    const scripts = [];
    const sc = dv.getUint16(slOff);
    for (let i = 0; i < sc; i++) {
      const r = slOff + 2 + i * 6, tag = tag4(dv, r), so = slOff + dv.getUint16(r + 4);
      const defOff = dv.getUint16(so), lc = dv.getUint16(so + 2);
      const s = { tag, def: defOff ? parseLS(so + defOff) : null, langs: [] };
      for (let j = 0; j < lc; j++) {
        const lr = so + 4 + j * 6;
        s.langs.push({ tag: tag4(dv, lr), ls: parseLS(so + dv.getUint16(lr + 4)) });
      }
      scripts.push(s);
    }
    const features = [];
    const fc = dv.getUint16(flOff);
    for (let i = 0; i < fc; i++) {
      const r = flOff + 2 + i * 6, tag = tag4(dv, r), rel = dv.getUint16(r + 4), fo = flOff + rel;
      const paramsOff = dv.getUint16(fo), n = dv.getUint16(fo + 2), lookups = [];
      for (let k = 0; k < n; k++) lookups.push(dv.getUint16(fo + 4 + 2 * k));
      const f = { tag, rel, lookups, params: null };
      if (paramsOff) {
        const po = fo + paramsOff;
        try {
          if (/^ss\d\d$/.test(tag)) f.params = { kind: 'ss', nameId: dv.getUint16(po + 2) };
          else if (/^cv\d\d$/.test(tag)) {
            const cc = dv.getUint16(po + 12), chars = [];
            for (let c = 0; c < cc && c < 64; c++) chars.push((dv.getUint8(po + 14 + 3 * c) << 16) | dv.getUint16(po + 15 + 3 * c));
            f.params = { kind: 'cv', labelId: dv.getUint16(po + 2), tipId: dv.getUint16(po + 4), sampleId: dv.getUint16(po + 6), chars };
          }
        } catch (e) { /* ignore */ }
      }
      features.push(f);
    }
    const lookupCount = llOff ? dv.getUint16(llOff) : 0;
    return { major, minor, hasFV, headerLen, slOff, flOff, llOff, fvOff, scripts, features, lookupCount };
  }

  function analyzeFeatures(tables) {
    const map = new Map();
    const scriptSet = new Set();
    for (const tn of ['GSUB', 'GPOS']) {
      const t = tables[tn];
      if (!t) continue;
      let L;
      try { L = parseLayout(t); } catch (e) { continue; }
      const entry = tag => {
        if (!map.has(tag)) map.set(tag, { tag, tables: new Set(), scripts: new Set(), langs: new Set(), lookups: new Set(), params: null });
        return map.get(tag);
      };
      const visit = (st, lt, ls) => {
        const idxs = [...ls.feats];
        if (ls.req !== 0xFFFF) idxs.push(ls.req);
        for (const fi of idxs) {
          const f = L.features[fi];
          if (!f) continue;
          const e = entry(f.tag);
          e.tables.add(tn); e.scripts.add(st); e.langs.add(lt);
          f.lookups.forEach(x => e.lookups.add(tn + ':' + x));
          if (f.params && !e.params) e.params = f.params;
        }
      };
      for (const s of L.scripts) {
        scriptSet.add(s.tag);
        if (s.def) visit(s.tag, 'dflt', s.def);
        for (const l of s.langs) visit(s.tag, l.tag, l.ls);
      }
    }
    return { features: [...map.values()].sort((a, b) => (a.tag < b.tag ? -1 : 1)), scripts: [...scriptSet].sort() };
  }

  /* Rebuild ScriptList + FeatureList with baked / disabled features. */
  function bakeLayout(u8, tagsOn, tagsOff) {
    const L = parseLayout(u8);
    const nOld = L.features.length;
    const used = new Set(L.features.map(f => f.tag));
    const cands = ['rclt', 'clig', 'rlig', 'calt', 'liga', 'ccmp'];
    let newTag = cands.find(t => !used.has(t)), tagWarning = false;
    if (!newTag) { newTag = 'rclt'; tagWarning = true; }

    const scripts = L.scripts.map(s => ({
      tag: s.tag,
      def: s.def ? { req: s.def.req, feats: [...s.def.feats] } : null,
      langs: s.langs.map(l => ({ tag: l.tag, ls: { req: l.ls.req, feats: [...l.ls.feats] } }))
    }));
    const newFeats = [], keyMap = new Map();
    let touched = false;
    const proc = ls => {
      const on = new Set(), keep = [];
      for (const fi of ls.feats) {
        const f = L.features[fi];
        if (!f) continue;
        if (tagsOn.has(f.tag)) { f.lookups.forEach(x => on.add(x)); touched = true; continue; }
        if (tagsOff.has(f.tag)) { touched = true; continue; }
        keep.push(fi);
      }
      if (ls.req !== 0xFFFF) {
        const rf = L.features[ls.req];
        if (rf && tagsOff.has(rf.tag)) { ls.req = 0xFFFF; touched = true; }
      }
      if (on.size) {
        const arr = [...on].sort((a, b) => a - b), key = arr.join(',');
        let ni = keyMap.get(key);
        if (ni === undefined) { ni = nOld + newFeats.length; newFeats.push({ lookups: arr }); keyMap.set(key, ni); }
        keep.push(ni);
      }
      ls.feats = keep;
    };
    for (const s of scripts) { if (s.def) proc(s.def); s.langs.forEach(l => proc(l.ls)); }
    if (!touched) return { bytes: u8, changed: false };

    // sort feature records
    const recs = L.features.map((f, i) => ({ tag: f.tag, old: i, rel: f.rel }))
      .concat(newFeats.map((nf, k) => ({ tag: newTag, nw: k })));
    recs.sort((a, b) => (a.tag < b.tag ? -1 : a.tag > b.tag ? 1 : 0));
    const perm = new Array(recs.length);
    recs.forEach((r, p) => { perm[r.old !== undefined ? r.old : nOld + r.nw] = p; });

    // Layout strategy: keep every original byte after the header where it is (opaque region),
    // put fresh ScriptList + FeatureList right after the header, shift the rest.
    const oldH = 2 + 6 * nOld;
    for (const f of L.features) if (!(L.flOff + f.rel >= L.headerLen)) throw fail('LAYOUT', 'feature offsets');

    // FeatureList (records point at the old, untouched Feature tables)
    const n2 = recs.length, H2 = 2 + 6 * n2;
    const newTablesLen = newFeats.reduce((a, f) => a + 4 + 2 * f.lookups.length, 0);
    const flLen = H2 + newTablesLen;
    const fl = new Uint8Array(flLen), fdv = dvOf(fl);
    fdv.setUint16(0, n2);
    const newOffs = [];
    { let p = H2; for (const nf of newFeats) { newOffs.push(p); fdv.setUint16(p, 0); fdv.setUint16(p + 2, nf.lookups.length); nf.lookups.forEach((x, i) => fdv.setUint16(p + 4 + 2 * i, x)); p += 4 + 2 * nf.lookups.length; } }
    recs.forEach((r, p) => {
      const o = 2 + 6 * p;
      putTag(fl, o, r.tag);
      let rel;
      if (r.old !== undefined) rel = (L.flOff + r.rel) + flLen - L.headerLen; // old table absolute pos -> relative to new FL
      else rel = newOffs[r.nw];
      if (rel > 0xFFFF) throw fail('LAYOUT', 'feature offset overflow');
      fdv.setUint16(o + 4, rel);
    });

    // ScriptList
    const buildLS = ls => {
      const idx = ls.feats.map(i => perm[i]).sort((a, b) => a - b);
      const b = new Uint8Array(6 + 2 * idx.length), d = dvOf(b);
      d.setUint16(0, 0); d.setUint16(2, ls.req === 0xFFFF ? 0xFFFF : perm[ls.req]); d.setUint16(4, idx.length);
      idx.forEach((v, i) => d.setUint16(6 + 2 * i, v));
      return b;
    };
    const scriptBlobs = scripts.map(s => {
      const uniq = new Map(), order = [];
      const reg = ls => {
        const key = ls.req + ':' + ls.feats.join(',');
        if (!uniq.has(key)) { uniq.set(key, { b: buildLS(ls), off: 0 }); order.push(key); }
        return key;
      };
      const defKey = s.def ? reg(s.def) : null;
      const langKeys = s.langs.map(l => reg(l.ls));
      let p = 4 + 6 * s.langs.length;
      for (const k of order) { uniq.get(k).off = p; p += uniq.get(k).b.length; }
      if (p > 0xFFFF) throw fail('LAYOUT', 'script too large');
      const out = new Uint8Array(p), d = dvOf(out);
      d.setUint16(0, defKey ? uniq.get(defKey).off : 0); d.setUint16(2, s.langs.length);
      s.langs.forEach((l, i) => { putTag(out, 4 + 6 * i, l.tag); d.setUint16(4 + 6 * i + 4, uniq.get(langKeys[i]).off); });
      for (const k of order) out.set(uniq.get(k).b, uniq.get(k).off);
      return out;
    });
    let slLen = 2 + 6 * scripts.length;
    const sOffs = scriptBlobs.map(b => { const o = slLen; slLen += b.length; return o; });
    if (slLen > 0xFFFF) throw fail('LAYOUT', 'script list too large');
    const sl = new Uint8Array(slLen), sdv = dvOf(sl);
    sdv.setUint16(0, scripts.length);
    scripts.forEach((s, i) => { putTag(sl, 2 + 6 * i, s.tag); sdv.setUint16(2 + 6 * i + 4, sOffs[i]); sl.set(scriptBlobs[i], sOffs[i]); });

    // assemble
    const rest = u8.slice(L.headerLen);
    const shift = slLen + flLen;
    if (L.llOff + shift > 0xFFFF) throw fail('LAYOUT', 'lookup list offset overflow');
    const rd = dvOf(rest);
    // zero the now-dead record arrays (helps compression); Script/Feature tables themselves stay put
    rest.fill(0, L.slOff - L.headerLen, L.slOff - L.headerLen + 2 + 6 * scripts.length);
    rest.fill(0, L.flOff - L.headerLen, L.flOff - L.headerLen + oldH);
    if (L.fvOff) {
      const fv = L.fvOff - L.headerLen;
      const cnt = rd.getUint32(fv + 4);
      for (let i = 0; i < cnt; i++) {
        const so = rd.getUint32(fv + 8 + 8 * i + 4);
        if (!so) continue;
        const fts = fv + so, sc = rd.getUint16(fts + 4);
        for (let j = 0; j < sc; j++) {
          const p = fts + 6 + 6 * j, old = rd.getUint16(p);
          if (old < perm.length) rd.setUint16(p, perm[old]);
        }
      }
    }
    const restStart = L.headerLen + shift;
    const out = new Uint8Array(restStart + rest.length), od = dvOf(out);
    od.setUint16(0, L.major); od.setUint16(2, L.minor);
    od.setUint16(4, L.headerLen); od.setUint16(6, L.headerLen + slLen); od.setUint16(8, L.llOff + shift);
    if (L.hasFV) od.setUint32(10, L.fvOff ? L.fvOff + shift : 0);
    out.set(sl, L.headerLen); out.set(fl, L.headerLen + slLen); out.set(rest, restStart);
    return { bytes: out, changed: true, newTag, tagWarning, newFeatureCount: newFeats.length };
  }

  /* ---------- name table ---------- */
  function parseName(u8) {
    const dv = dvOf(u8);
    const fmt = dv.getUint16(0), count = dv.getUint16(2), so = dv.getUint16(4);
    const recs = [];
    for (let i = 0; i < count; i++) {
      const o = 6 + 12 * i, len = dv.getUint16(o + 8), off = dv.getUint16(o + 10);
      recs.push({ p: dv.getUint16(o), e: dv.getUint16(o + 2), l: dv.getUint16(o + 4), n: dv.getUint16(o + 6), b: u8.slice(so + off, so + off + len) });
    }
    const langTags = [];
    if (fmt === 1) {
      const lc = dv.getUint16(6 + 12 * count);
      for (let j = 0; j < lc; j++) {
        const o = 8 + 12 * count + 4 * j, len = dv.getUint16(o), off = dv.getUint16(o + 2);
        langTags.push(u8.slice(so + off, so + off + len));
      }
    }
    return { recs, langTags };
  }
  function buildName(N) {
    const recs = [...N.recs].sort((a, b) => a.p - b.p || a.e - b.e || a.l - b.l || a.n - b.n);
    const count = recs.length, lc = N.langTags.length, fmt = lc ? 1 : 0;
    const hdr = 6 + 12 * count + (fmt ? 2 + 4 * lc : 0);
    const store = [], seen = new Map();
    let sp = 0;
    const place = b => {
      const k = Array.from(b).join(',');
      if (seen.has(k)) return seen.get(k);
      const o = sp; seen.set(k, o); store.push(b); sp += b.length; return o;
    };
    const roffs = recs.map(r => place(r.b));
    const loffs = N.langTags.map(b => place(b));
    const out = new Uint8Array(hdr + sp), dv = dvOf(out);
    dv.setUint16(0, fmt); dv.setUint16(2, count); dv.setUint16(4, hdr);
    recs.forEach((r, i) => { const o = 6 + 12 * i; dv.setUint16(o, r.p); dv.setUint16(o + 2, r.e); dv.setUint16(o + 4, r.l); dv.setUint16(o + 6, r.n); dv.setUint16(o + 8, r.b.length); dv.setUint16(o + 10, roffs[i]); });
    if (fmt) { const b = 6 + 12 * count; dv.setUint16(b, lc); N.langTags.forEach((t, j) => { dv.setUint16(b + 2 + 4 * j, t.length); dv.setUint16(b + 4 + 4 * j, loffs[j]); }); }
    let p = hdr; for (const s of store) { out.set(s, p); p += s.length; }
    if (out.length > 0xFFFF && hdr + sp > 0xFFFF) throw fail('NAME', 'name table too large');
    return out;
  }
  function decodeRec(r) {
    if (r.p === 1) {
      try { return new TextDecoder('macintosh').decode(r.b); } catch (e) { return String.fromCharCode(...r.b); }
    }
    let s = '';
    for (let i = 0; i + 1 < r.b.length; i += 2) s += String.fromCharCode((r.b[i] << 8) | r.b[i + 1]);
    return s;
  }
  const isEnglish = r => (r.p === 3 && r.l === 0x409) || (r.p === 1 && r.l === 0) || (r.p === 0);
  const isArabic = r => r.p === 3 && (r.l & 0x3FF) === 1;
  function getName(N, id, lang = 'en') {
    const cand = N.recs.filter(r => r.n === id);
    if (!cand.length) return '';
    const rank = r => {
      let s = 0;
      if (lang === 'ar') { if (isArabic(r)) s += 10; } else if (isEnglish(r)) s += 10;
      if (r.p === 3) s += 3; else if (r.p === 0) s += 2; else s += 1;
      return s;
    };
    cand.sort((a, b) => rank(b) - rank(a));
    return decodeRec(cand[0]);
  }
  function encodeUTF16(s) { const b = new Uint8Array(s.length * 2); for (let i = 0; i < s.length; i++) { const c = s.charCodeAt(i); b[2 * i] = c >> 8; b[2 * i + 1] = c & 255; } return b; }
  function setName(N, id, value) {
    const isAscii = /^[\x20-\x7E]*$/.test(value);
    const others = N.recs.filter(r => r.n !== id);
    const mine = N.recs.filter(r => r.n === id);
    if (value === '') { N.recs = others; return; }
    const kept = [];
    let hasWin = false;
    for (const r of mine) {
      if (!isEnglish(r)) continue; // other-language variants are dropped
      if (r.p === 1) { if (isAscii) { r.b = Uint8Array.from(value, c => c.charCodeAt(0)); kept.push(r); } continue; }
      r.b = encodeUTF16(value); kept.push(r);
      if (r.p === 3) hasWin = true;
    }
    if (!hasWin) kept.push({ p: 3, e: 1, l: 0x409, n: id, b: encodeUTF16(value) });
    N.recs = others.concat(kept);
  }

  /* ---------- info ---------- */
  function parseCmap(u8) {
    const set = new Set();
    if (!u8) return set;
    const dv = dvOf(u8);
    const n = dv.getUint16(2), done = new Set();
    for (let i = 0; i < n; i++) {
      const p = dv.getUint16(4 + 8 * i), e = dv.getUint16(6 + 8 * i), off = dv.getUint32(8 + 8 * i);
      if (!(p === 0 || (p === 3 && (e === 1 || e === 10)))) continue;
      if (done.has(off)) continue; done.add(off);
      try {
        const fmt = dv.getUint16(off);
        if (fmt === 4) {
          const sc = dv.getUint16(off + 6) / 2;
          const endO = off + 14, startO = endO + 2 * sc + 2, deltaO = startO + 2 * sc, rangeO = deltaO + 2 * sc;
          for (let s = 0; s < sc; s++) {
            const end = dv.getUint16(endO + 2 * s), start = dv.getUint16(startO + 2 * s), delta = dv.getInt16(deltaO + 2 * s), ro = dv.getUint16(rangeO + 2 * s);
            for (let c = start; c <= end && c < 0xFFFF; c++) {
              let g;
              if (ro === 0) g = (c + delta) & 0xFFFF;
              else { const gp = rangeO + 2 * s + ro + 2 * (c - start); if (gp + 2 > u8.length) break; g = dv.getUint16(gp); if (g) g = (g + delta) & 0xFFFF; }
              if (g) set.add(c);
            }
          }
        } else if (fmt === 12) {
          const ng = dv.getUint32(off + 12);
          for (let g = 0; g < ng; g++) {
            const o = off + 16 + 12 * g, s = dv.getUint32(o), e2 = dv.getUint32(o + 4), sg = dv.getUint32(o + 8);
            if (e2 - s > 0x30000) continue;
            for (let c = s; c <= e2 && c <= 0x10FFFF; c++) if (sg + (c - s) > 0) set.add(c);
          }
        } else if (fmt === 6) {
          const fc = dv.getUint16(off + 6), ec = dv.getUint16(off + 8);
          for (let k = 0; k < ec; k++) if (dv.getUint16(off + 10 + 2 * k)) set.add(fc + k);
        }
      } catch (err) { /* skip broken subtable */ }
    }
    return set;
  }

  function parseFvar(u8) {
    if (!u8) return null;
    const dv = dvOf(u8);
    const axesOff = dv.getUint16(4), ac = dv.getUint16(8), asz = dv.getUint16(10), ic = dv.getUint16(12), isz = dv.getUint16(14);
    const axes = [], instances = [];
    for (let i = 0; i < ac; i++) {
      const o = axesOff + i * asz;
      axes.push({ tag: tag4(dv, o), min: dv.getInt32(o + 4) / 65536, def: dv.getInt32(o + 8) / 65536, max: dv.getInt32(o + 12) / 65536, nameId: dv.getUint16(o + 18) });
    }
    const base = axesOff + ac * asz;
    for (let j = 0; j < ic; j++) {
      const o = base + j * isz, coords = [];
      for (let i = 0; i < ac; i++) coords.push(dv.getInt32(o + 4 + 4 * i) / 65536);
      instances.push({ nameId: dv.getUint16(o), coords });
    }
    return { axes, instances };
  }

  function readInfo(tables) {
    const info = {};
    const I = { u16: (t, o) => (t && o + 2 <= t.length ? dvOf(t).getUint16(o) : null), i16: (t, o) => (t && o + 2 <= t.length ? dvOf(t).getInt16(o) : null) };
    const head = tables.head, os2 = tables['OS/2'], hhea = tables.hhea, post = tables.post, maxp = tables.maxp;
    if (head) {
      const d = dvOf(head);
      info.unitsPerEm = d.getUint16(18);
      info.fontRevision = d.getInt32(4) / 65536;
      const date = o => { const s = d.getUint32(o) * 4294967296 + d.getUint32(o + 4); const t = (s - 2082844800) * 1000; return t > 0 && t < 4e12 ? new Date(t) : null; };
      info.created = date(20); info.modified = date(28);
      info.bbox = [d.getInt16(36), d.getInt16(38), d.getInt16(40), d.getInt16(42)];
      info.macStyle = d.getUint16(44);
    }
    if (maxp) info.numGlyphs = dvOf(maxp).getUint16(4);
    if (hhea) { info.ascender = I.i16(hhea, 4); info.descender = I.i16(hhea, 6); info.lineGap = I.i16(hhea, 8); }
    if (os2) {
      const d = dvOf(os2);
      info.os2Version = d.getUint16(0); info.weight = d.getUint16(4); info.width = d.getUint16(6); info.fsType = d.getUint16(8);
      info.fsSelection = d.getUint16(62);
      if (os2.length >= 78) { info.typoAsc = d.getInt16(68); info.typoDesc = d.getInt16(70); info.typoGap = d.getInt16(72); info.winAsc = d.getUint16(74); info.winDesc = d.getUint16(76); }
      if (info.os2Version >= 2 && os2.length >= 90) { info.xHeight = d.getInt16(86); info.capHeight = d.getInt16(88); }
    }
    if (post) { const d = dvOf(post); info.italicAngle = d.getInt32(4) / 65536; info.underlinePos = d.getInt16(8); info.underlineThick = d.getInt16(10); info.fixedPitch = d.getUint32(12) !== 0; }
    info.hasColor = !!(tables.COLR || tables.CBDT || tables.sbix || tables['SVG ']);
    info.cmap = parseCmap(tables.cmap);
    info.fvar = parseFvar(tables.fvar);
    return info;
  }

  return { readFont, buildSfnt, buildWoff, makeZip, parseLayout, analyzeFeatures, bakeLayout, parseName, buildName, getName, setName, decodeRec, readInfo, checksum, crc32 };
})();
if (typeof module !== 'undefined') module.exports = FontCore;
