/* ===== خطوط أحمد النهر — application ===== */
(() => {
'use strict';
const FC = FontCore;
const $ = s => document.querySelector(s);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ar = n => Number(n).toLocaleString('ar-EG');

/* ---------- dictionaries ---------- */
const FEATURES = {
  liga: ['الوصلات القياسية', 'دمج حروف متجاورة في شكل واحد'],
  clig: ['الوصلات السياقية', 'وصلات تعتمد على الحروف المحيطة'],
  dlig: ['الوصلات الاختيارية', 'وصلات زخرفية لا تعمل تلقائياً'],
  hlig: ['الوصلات التاريخية', 'وصلات بطراز قديم'],
  rlig: ['الوصلات الإلزامية', 'وصلات لا يكتمل شكل الكلمة بدونها'],
  calt: ['الأشكال السياقية', 'يغيّر شكل الحرف بحسب جيرانه'],
  rclt: ['الأشكال السياقية الإلزامية', 'استبدالات سياقية مطلوبة لسلامة النص'],
  ccmp: ['التركيب والتفكيك', 'تركيب الحروف أو تفكيكها قبل بقية المعالجة'],
  locl: ['الأشكال المحلية', 'أشكال خاصة بلغة أو منطقة معيّنة'],
  salt: ['أشكال بديلة أسلوبية', 'بدائل أسلوبية للحروف'],
  aalt: ['كل الأشكال البديلة', 'قائمة بجميع البدائل المتاحة للحرف'],
  nalt: ['بدائل للترقيم', 'أشكال بديلة للأرقام والرموز المحاطة'],
  swsh: ['التزيينات (Swash)', 'ذيول وامتدادات زخرفية للحروف'],
  cswh: ['التزيينات السياقية', 'تزيينات تظهر بحسب موضع الحرف'],
  jalt: ['بدائل التبرير', 'أشكال ممتدة تُستخدم لضبط عرض السطر'],
  hist: ['الأشكال التاريخية', 'أشكال حروف قديمة'],
  ornm: ['الزخارف', 'رموز زخرفية وفواصل'],
  titl: ['حروف العناوين', 'أشكال مخصصة للعناوين الكبيرة'],
  case: ['ضبط الحالة', 'يضبط علامات الترقيم مع الحروف الكبيرة'],
  smcp: ['حروف كبيرة صغيرة', 'يحوّل الحروف الصغيرة إلى كبيرة مصغّرة'],
  c2sc: ['الكبيرة إلى كبيرة مصغّرة', 'يحوّل الحروف الكبيرة إلى كبيرة مصغّرة'],
  init: ['الشكل الأول', 'شكل الحرف في بداية الكلمة'],
  medi: ['الشكل الأوسط', 'شكل الحرف في وسط الكلمة'],
  fina: ['الشكل الأخير', 'شكل الحرف في نهاية الكلمة'],
  isol: ['الشكل المنفرد', 'شكل الحرف حين يقف وحده'],
  med2: ['الشكل الأوسط ٢', 'شكل أوسط إضافي'],
  fin2: ['الشكل الأخير ٢', 'شكل أخير إضافي'],
  fin3: ['الشكل الأخير ٣', 'شكل أخير إضافي'],
  stch: ['مدّ الحروف', 'تمديد الحروف لملء العرض المطلوب'],
  rtlm: ['الأشكال المعكوسة', 'أشكال تُستخدم في النص من اليمين إلى اليسار'],
  rtla: ['بدائل الاتجاه (يمين→يسار)', 'استبدالات خاصة بالكتابة من اليمين'],
  ltra: ['بدائل الاتجاه (يسار→يمين)', 'استبدالات خاصة بالكتابة من اليسار'],
  ltrm: ['أشكال معكوسة (يسار→يمين)', 'أشكال خاصة بالكتابة من اليسار'],
  curs: ['الوصل المتدرّج', 'ربط الحروف على خط أساس متصل'],
  kern: ['التقريب بين الحروف', 'ضبط المسافة بين أزواج الحروف (Kerning)'],
  mark: ['تموضع العلامات', 'وضع التشكيل والعلامات فوق الحروف أو تحتها'],
  mkmk: ['تموضع العلامات على العلامات', 'ضبط تراكب عدة علامات فوق الحرف الواحد'],
  mset: ['تموضع علامات التشكيل', 'ضبط علامات التشكيل العربية'],
  abvm: ['علامات علوية', 'تموضع العلامات فوق الحروف'],
  blwm: ['علامات سفلية', 'تموضع العلامات تحت الحروف'],
  dist: ['تباعد المسافات', 'ضبط المسافات بحسب النظام الكتابي'],
  cpsp: ['تباعد الحروف الكبيرة', 'يزيد المسافة بين الحروف الكبيرة'],
  palt: ['عرض متناسب', 'مسافات متناسبة للحروف'],
  halt: ['عرض نصفي', 'مسافات نصف عرض'],
  onum: ['أرقام قديمة الطراز', 'أرقام بارتفاعات مختلفة (Oldstyle)'],
  lnum: ['أرقام على خط السطر', 'أرقام بارتفاع الحروف الكبيرة (Lining)'],
  pnum: ['أرقام متناسبة العرض', 'أرقام بعرض مختلف حسب شكلها'],
  tnum: ['أرقام ثابتة العرض', 'أرقام متساوية العرض للجداول'],
  zero: ['صفر مشطوب', 'صفر بخط مائل أو نقطة'],
  frac: ['الكسور', 'يحوّل 1/2 إلى كسر منسّق'],
  numr: ['البسط', 'أرقام البسط في الكسور'],
  dnom: ['المقام', 'أرقام المقام في الكسور'],
  ordn: ['الأرقام الترتيبية', 'مثل 1st أو 2ª'],
  sups: ['رموز علوية', 'أرقام وحروف مرفوعة'],
  subs: ['رموز سفلية', 'أرقام وحروف منخفضة'],
  sinf: ['رموز سفلية علمية', 'أرقام صغيرة للمعادلات'],
  rvrn: ['بدائل المحاور المتغيّرة', 'تبديل أشكال بحسب قيم محاور الخط المتغيّر'],
  ital: ['مائل', 'أشكال الحروف المائلة'],
  vert: ['الكتابة العمودية', 'أشكال للنص العمودي'],
  ' RQD': ['ميزة إلزامية', 'ميزة يطبّقها الخط دائماً']
};
const DEFAULT_ON = new Set('ccmp locl rlig rclt calt liga clig curs kern dist mark mkmk mset abvm blwm isol init medi med2 fina fin2 fin3 rphf rkrf pref blwf abvf half pstf vatu cjct cfar pres abvs blws psts haln akhn nukt ltra ltrm rtla rtlm rvrn stch vert vrt2 vkrn vpal vhal ljmo vjmo tjmo'.split(' '));
const GROUP_OF = {};
[['forms', 'liga clig dlig hlig rlig rclt calt cswh salt swsh jalt hist aalt nalt ccmp locl init medi fina isol fin2 fin3 med2 stch rtlm rtla ltra ltrm ornm titl case smcp c2sc pcap c2pc unic'],
 ['num', 'onum lnum pnum tnum zero frac numr dnom ordn sups subs sinf afrc'],
 ['pos', 'kern mark mkmk mset abvm blwm curs dist cpsp palt halt vkrn vpal vhal opbd lfbd rtbd']].forEach(([g, s]) => s.split(' ').forEach(t => GROUP_OF[t] = g));
const GROUPS = [['forms', 'الأشكال والوصلات'], ['num', 'الأرقام والكسور'], ['pos', 'التموضع والتباعد'], ['other', 'ميزات أخرى']];
const SCRIPTS = { arab: 'العربية', latn: 'اللاتينية', DFLT: 'الافتراضي', cyrl: 'السيريلية', grek: 'اليونانية', hebr: 'العبرية', deva: 'الديفاناغارية', dev2: 'الديفاناغارية', thai: 'التايلندية', hani: 'الهان', kana: 'الكانا', armn: 'الأرمنية', geor: 'الجورجية', math: 'الرياضيات', syrc: 'السريانية', thaa: 'التانا', 'nko ': 'النكو', tfng: 'التيفيناغ', beng: 'البنغالية', gujr: 'الغوجاراتية', guru: 'الغورموخية', knda: 'الكانادا', mlym: 'الملايالامية', taml: 'التاميلية', telu: 'التيلوغوية', khmr: 'الخميرية', 'lao ': 'اللاوية', mong: 'المنغولية', ethi: 'الإثيوبية' };
const SAMPLES = [
  ['بيت شعر يضم كل الحروف', 'صِفْ خَلْقَ خَوْدٍ كَمِثْلِ الشَّمْسِ إذْ بَزَغَتْ يَحْظَى الضَّجِيعُ بِهَا نَجْلاءَ مِعْطَارِ'],
  ['الأبجدية', 'أبجد هوّز حطّي كلمن سعفص قرشت ثخذ ضظغ'],
  ['البسملة', 'بسم الله الرحمن الرحيم'],
  ['عبارة قصيرة', 'الحرف العربي جمال يتنفس بين السطور'],
  ['أرقام وعلامات', '٠١٢٣٤٥٦٧٨٩ ۰۱۲۳۴۵۶۷۸۹ 0123456789 ؟ ، ؛ « »'],
  ['لاتيني', 'The quick brown fox jumps over the lazy dog'],
  ['وصلات لاتينية', 'office fifty affluent — fi fl ffi ffl st ct 1/2 3/4']
];
const COVER = [
  ['الحروف العربية الأساسية', [[0x621, 0x63A], [0x641, 0x64A]]],
  ['حروف الفارسية والأردية', [[0x67E, 0x67E], [0x686, 0x686], [0x698, 0x698], [0x6AF, 0x6AF], [0x6A9, 0x6A9], [0x6CC, 0x6CC], [0x6BE, 0x6BE], [0x6D2, 0x6D2], [0x679, 0x679], [0x688, 0x688], [0x691, 0x691], [0x6BA, 0x6BA], [0x6C1, 0x6C1], [0x6D3, 0x6D3]]],
  ['علامات التشكيل', [[0x64B, 0x652], [0x670, 0x670]]],
  ['الأرقام الهندية ٠–٩', [[0x660, 0x669]]],
  ['الأرقام الفارسية ۰–۹', [[0x6F0, 0x6F9]]],
  ['علامات الترقيم العربية', [[0x60C, 0x60C], [0x61B, 0x61B], [0x61F, 0x61F], [0x66A, 0x66D]]],
  ['اللاتينية الأساسية', [[0x20, 0x7E]]]
];
const GLYPH_SETS = [
  ['الحروف العربية', [[0x621, 0x64A], [0x671, 0x6D3]]],
  ['التشكيل والعلامات', [[0x64B, 0x65F], [0x670, 0x670]]],
  ['الأرقام', [[0x30, 0x39], [0x660, 0x669], [0x6F0, 0x6F9]]],
  ['أشكال العرض العربية (أ)', [[0xFB50, 0xFDFF]]],
  ['أشكال العرض العربية (ب)', [[0xFE70, 0xFEFF]]],
  ['اللاتينية', [[0x21, 0x7E], [0xA1, 0x17F]]],
  ['علامات الترقيم والرموز', [[0x2010, 0x2027], [0x2030, 0x205E], [0x20A0, 0x20BF], [0x2190, 0x21FF]]]
];
const META_FIELDS = [
  [1, 'اسم العائلة', 'text', true], [2, 'النمط (Style)', 'text', true], [4, 'الاسم الكامل', 'text', true], [6, 'اسم PostScript', 'text', true],
  [16, 'العائلة المفضّلة (Typographic)', 'text'], [17, 'النمط المفضّل', 'text'], [5, 'الإصدار', 'text'], [3, 'المعرّف الفريد', 'text'],
  [9, 'المصمم', 'text'], [8, 'الناشر', 'text'], [0, 'حقوق النشر', 'area'], [7, 'العلامة التجارية', 'text'],
  [10, 'الوصف', 'area'], [13, 'نص الترخيص', 'area'], [14, 'رابط الترخيص', 'text'], [11, 'رابط الناشر', 'text'], [12, 'رابط المصمم', 'text'], [19, 'نص تجريبي', 'text']
];
const AXIS_NAMES = { wght: 'الوزن', wdth: 'العرض', slnt: 'الميل', ital: 'المائل', opsz: 'الحجم البصري', GRAD: 'التدرّج', SOFT: 'النعومة', WONK: 'الغرابة', XHGT: 'ارتفاع x', YTLC: 'ارتفاع الحروف الصغيرة', YTUC: 'ارتفاع الحروف الكبيرة' };
const WEIGHTS = { 100: 'رفيع جداً', 200: 'خفيف جداً', 300: 'خفيف', 400: 'عادي', 500: 'متوسط', 600: 'شبه غامق', 700: 'غامق', 800: 'غامق جداً', 900: 'أسود' };
const WIDTHS = { 1: 'ضيق جداً', 2: 'ضيق', 3: 'شبه ضيق', 4: 'شبه ضيق قليلاً', 5: 'عادي', 6: 'شبه عريض قليلاً', 7: 'شبه عريض', 8: 'عريض', 9: 'عريض جداً' };
const TABS = [['overview', 'الخصائص'], ['sets', 'مجموعات الأساليب'], ['features', 'الميزات'], ['glyphs', 'الأحرف'], ['meta', 'بيانات الخط'], ['dl', 'التنزيل']];

/* ---------- state ---------- */
const S = { font: null, info: null, N: null, feats: [], scripts: [], fam: '', on: {}, axes: {}, nameEdits: {}, tab: 'overview', dir: 'auto', filter: { q: '', mode: 'all' }, glyphSet: 0, outFmt: 'same', zip: false, fileName: '' };
let famN = 0, dlCap = null, dlCapReady = false;
try { const p = window.claude && window.claude.use && window.claude.use('downloads'); if (p) p.then(c => { dlCap = c; dlCapReady = true; }, () => { dlCapReady = true; }); else dlCapReady = true; } catch (e) { dlCapReady = true; }

const meta = tag => {
  if (FEATURES[tag]) return { name: FEATURES[tag][0], desc: FEATURES[tag][1] };
  let m = /^ss(\d\d)$/.exec(tag);
  if (m) return { name: 'مجموعة الأسلوب ' + ar(+m[1]), desc: 'مجموعة أشكال بديلة يحدّدها مصمم الخط' };
  m = /^cv(\d\d)$/.exec(tag);
  if (m) return { name: 'متغيّر الحرف ' + ar(+m[1]), desc: 'شكل بديل لحرف أو أكثر' };
  return { name: 'ميزة OpenType', desc: 'ميزة غير مدرجة في القاموس' };
};
const groupOf = tag => GROUP_OF[tag] || 'other';
const curOn = tag => (tag in S.on) ? S.on[tag] : DEFAULT_ON.has(tag);
const nm = (id, lang) => (S.N ? FC.getName(S.N, id, lang) : '');
function ffs(o = {}) {
  const parts = [];
  for (const f of S.feats) {
    const d = DEFAULT_ON.has(f.tag);
    let v = curOn(f.tag);
    if (o.on === f.tag) v = true;
    if (o.off === f.tag) v = false;
    if (v !== d) parts.push(`"${f.tag}" ${v ? 1 : 0}`);
  }
  return parts.join(', ') || 'normal';
}
const axesCSS = () => (S.font && S.info.fvar) ? S.info.fvar.axes.map(a => `"${a.tag}" ${S.axes[a.tag] ?? a.def}`).join(', ') : 'normal';
const stage = $('#stage');
const snippet = (n = 16) => [...(stage.textContent || '').replace(/\s+/g, ' ').trim()].slice(0, n).join('');
function toast(msg) {
  const t = $('#toast');
  t.innerHTML = `<div>${esc(msg)}</div>`;
  clearTimeout(toast._t); toast._t = setTimeout(() => { t.innerHTML = ''; }, 3200);
}
function showErr(msg) { const e = $('#err'); e.hidden = !msg; e.textContent = msg || ''; }

/* ---------- loading ---------- */
async function loadFile(file) {
  showErr('');
  try {
    const buf = await file.arrayBuffer();
    const font = await FC.readFont(buf);
    const fam = 'AFUser' + (++famN);
    const face = new FontFace(fam, buf.slice(0));
    await face.load();
    document.fonts.add(face);
    Object.assign(S, { font, fam, fileName: file.name, baseName: file.name.replace(/\.[^.]+$/, ''), on: {}, axes: {}, nameEdits: {}, tab: 'overview', outFmt: 'same', zip: false });
    S.N = font.tables.name ? FC.parseName(font.tables.name) : { recs: [], langTags: [] };
    S.info = FC.readInfo(font.tables);
    const an = FC.analyzeFeatures(font.tables);
    S.feats = an.features; S.scripts = an.scripts;
    document.documentElement.style.setProperty('--uf', `'${fam}','IBM Plex Sans Arabic',sans-serif`);
    const hasAr = S.info.cmap.has(0x628);
    $('#sample').value = hasAr ? '0' : '5';
    stage.textContent = SAMPLES[hasAr ? 0 : 5][1];
    $('#lang').value = hasAr ? 'ar' : 'en';
    stage.lang = $('#lang').value;
    $('#hero').hidden = true; $('#ws').hidden = false; $('#dock').hidden = false;
    renderBar(); buildAxes(); renderTabs(); renderPane(); syncUI();
    if (innerWidth < 600) { stage.style.setProperty('--size', '44px'); $('#size').value = 44; $('#sizeOut').textContent = ar(44); }
    window.scrollTo({ top: 0 });
  } catch (e) {
    const m = e && e.code === 'WOFF2' ? 'صيغة WOFF2 غير مدعومة حالياً. حوّل الملف إلى TTF أو OTF أو WOFF ثم أعد رفعه.'
      : e && e.code === 'TTC' ? 'ملفات مجموعات الخطوط (TTC) غير مدعومة. استخرج الخط المطلوب منها كملف مستقل ثم أعد رفعه.'
      : e && (e.code === 'UNSUPPORTED' || e.code === 'BAD') ? 'هذا الملف ليس خطاً مدعوماً. اختر ملفاً بصيغة TTF أو OTF أو WOFF.'
      : 'تعذّر فتح الخط: المتصفح رفض الملف، وقد يكون تالفاً.';
    if ($('#ws').hidden) showErr(m); else toast(m);
  }
}

/* ---------- header bar ---------- */
function renderBar() {
  const fam = nm(16) || nm(1) || S.baseName, style = nm(17) || nm(2);
  $('#fname').textContent = fam + (style && style !== 'Regular' ? ' ' + style : '');
  const kind = { ttf: 'TrueType', otf: 'OpenType CFF', woff: 'WOFF' }[S.font.kind];
  const bits = [`<span class="badge">${kind}</span>`, `<span>${ar(S.info.numGlyphs || 0)} رمزاً</span>`, `<span>${ar(S.feats.length)} ميزة</span>`];
  if (S.info.fvar) bits.push(`<span class="badge">خط متغيّر · ${ar(S.info.fvar.axes.length)} محاور</span>`);
  $('#fmeta').innerHTML = bits.join('');
}

/* ---------- axes ---------- */
function buildAxes() {
  const box = $('#axes'), fv = S.info.fvar;
  if (!fv || !fv.axes.length) { box.hidden = true; box.innerHTML = ''; return; }
  box.hidden = false;
  const step = a => { const r = a.max - a.min; return r > 20 ? 1 : r > 2 ? 0.1 : 0.01; };
  let h = fv.axes.map(a => `<label><span>${esc(AXIS_NAMES[a.tag] || nm(a.nameId) || a.tag)} <span class="mono">${esc(a.tag)}</span></span><input type="range" data-axis="${esc(a.tag)}" min="${a.min}" max="${a.max}" step="${step(a)}" value="${S.axes[a.tag] ?? a.def}"><output class="mono">${S.axes[a.tag] ?? a.def}</output></label>`).join('');
  const insts = fv.instances.filter(i => nm(i.nameId));
  if (insts.length) h += `<div class="inst">${insts.map((i, k) => `<button class="btn small" data-inst="${k}">${esc(nm(i.nameId))}</button>`).join('')}</div>`;
  h += `<div class="inst"><small style="color:var(--muted)">قيم المحاور للمعاينة فقط؛ لا تُدمج في الملف الناتج.</small></div>`;
  box.innerHTML = h;
}

/* ---------- tabs ---------- */
function renderTabs() {
  const sets = S.feats.filter(f => /^(ss|cv)\d\d$/.test(f.tag)).length;
  const others = S.feats.filter(f => !/^(ss|cv)\d\d$/.test(f.tag)).length;
  const counts = { sets, features: others };
  $('#tabs').innerHTML = TABS.map(([id, label]) => `<button class="tab" role="tab" data-tab="${id}" aria-selected="${S.tab === id}">${label}${counts[id] ? `<span class="n">${ar(counts[id])}</span>` : ''}</button>`).join('');
}
function renderPane() {
  const p = $('#pane');
  ({ overview: renderOverview, sets: renderSets, features: renderFeatures, glyphs: renderGlyphs, meta: renderMeta, dl: renderDl })[S.tab](p);
  syncUI();
}

/* ---------- overview ---------- */
function renderOverview(p) {
  const I = S.info, has = id => !!nm(id);
  const dt = d => d ? d.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' }) : '—';
  const rows = [];
  const add = (k, v) => { if (v !== '' && v != null) rows.push(`<dt>${k}</dt><dd>${v}</dd>`); };
  const b = v => v ? `<bdi>${esc(v)}</bdi>` : '';
  add('العائلة', b(nm(1))); if (has(16) && nm(16) !== nm(1)) add('العائلة المفضّلة', b(nm(16)));
  add('النمط', b(nm(2))); add('الاسم الكامل', b(nm(4))); add('اسم PostScript', `<span class="mono">${esc(nm(6))}</span>`);
  add('الإصدار', b(nm(5))); add('المصمم', b(nm(9))); add('الناشر', b(nm(8)));
  add('الصيغة', { ttf: 'TrueType', otf: 'OpenType بمخططات CFF', woff: 'WOFF' + (S.font.isCFF ? ' (CFF)' : ' (TrueType)') }[S.font.kind]);
  add('الرموز (Glyphs)', ar(I.numGlyphs || 0)); add('الأحرف المُرمَّزة', ar(I.cmap.size)); add('وحدات EM', ar(I.unitsPerEm || 0));
  if (I.weight) add('الوزن', `${ar(I.weight)} — ${WEIGHTS[Math.round(I.weight / 100) * 100] || ''}`);
  if (I.width) add('العرض', `${ar(I.width)} — ${WIDTHS[I.width] || ''}`);
  add('مائل', (I.macStyle & 2) || (I.fsSelection & 1) ? 'نعم' : 'لا');
  add('ثابت العرض (Monospace)', I.fixedPitch ? 'نعم' : 'لا');
  add('خط متغيّر', I.fvar ? `نعم — ${ar(I.fvar.axes.length)} محاور: ${I.fvar.axes.map(a => `<span class="mono">${esc(a.tag)}</span>`).join(' ')}` : 'لا');
  if (I.hasColor) add('خط ملوّن', 'نعم');
  if (I.ascender != null) add('الصعود / النزول / التباعد', `<span class="mono">${I.ascender} / ${I.descender} / ${I.lineGap}</span>`);
  if (I.xHeight) add('ارتفاع x', `<span class="mono">${I.xHeight}</span>`);
  if (I.capHeight) add('ارتفاع الحروف الكبيرة', `<span class="mono">${I.capHeight}</span>`);
  if (I.bbox) add('مستطيل الحدود', `<span class="mono">${I.bbox.join(', ')}</span>`);
  add('تاريخ الإنشاء', dt(I.created)); add('آخر تعديل', dt(I.modified));

  const cov = COVER.map(([label, ranges]) => {
    let tot = 0, got = 0;
    ranges.forEach(([a, z]) => { for (let c = a; c <= z; c++) { tot++; if (I.cmap.has(c)) got++; } });
    return `<div class="cov"><span>${label}</span><span>${ar(got)} / ${ar(tot)}</span><div class="meter"><i style="width:${(got / tot * 100).toFixed(1)}%"></i></div></div>`;
  }).join('');
  let pres = 0; I.cmap.forEach(c => { if ((c >= 0xFB50 && c <= 0xFDFF) || (c >= 0xFE70 && c <= 0xFEFF)) pres++; });
  const fs = I.fsType || 0;
  const fsTxt = fs === 0 ? 'قابل للتثبيت والتضمين دون قيود' : fs & 2 ? 'محظور التضمين (Restricted)' : fs & 4 ? 'معاينة وطباعة فقط' : fs & 8 ? 'قابل للتحرير' : 'قيود مخصصة';
  const lic = nm(13), licUrl = nm(14);
  p.innerHTML = `
    <h3>خصائص الخط</h3>
    <dl class="props">${rows.join('')}</dl>
    <h4>تغطية الأحرف</h4>
    ${cov}
    <div class="cov"><span>أشكال العرض العربية (A/B)</span><span>${ar(pres)} رمزاً</span></div>
    <h4>الأنظمة الكتابية في جداول الميزات</h4>
    <div class="tags">${S.scripts.length ? S.scripts.map(s => `<span class="tag">${esc(SCRIPTS[s] || s)}</span>`).join('') : '<span class="tag">لا يوجد جدول GSUB أو GPOS</span>'}</div>
    <h4>الترخيص والتضمين</h4>
    <div class="note ${fs & 2 ? 'bad' : 'good'}"><span>${fsTxt}. تأكد أن ترخيص الخط يسمح بالتعديل وإعادة التوزيع قبل تنزيل نسخة معدّلة.</span></div>
    ${lic || licUrl ? `<details><summary>نص الترخيص المضمَّن</summary><p dir="auto" style="white-space:pre-wrap;color:var(--muted);font-size:13.5px">${esc(lic)} ${licUrl ? `<br><span class="mono">${esc(licUrl)}</span>` : ''}</p></details>` : ''}`;
}

/* ---------- style sets ---------- */
function featLabel(f) {
  const q = f.params;
  if (q) { const id = q.kind === 'ss' ? q.nameId : q.labelId; if (id) { if (id in S.nameEdits) return S.nameEdits[id]; const s = nm(id); if (s) return s; } }
  return meta(f.tag).name;
}
function setCard(f) {
  const cur = curOn(f.tag), q = f.params, id = q ? (q.kind === 'ss' ? q.nameId : q.labelId) : 0;
  const chars = q && q.kind === 'cv' && q.chars.length ? `الأحرف: <span style="font-family:var(--uf);font-size:16px">${q.chars.map(c => esc(String.fromCodePoint(c))).join(' ')}</span>` : '';
  return `<article class="set ${cur ? 'on' : ''} ${cur !== DEFAULT_ON.has(f.tag) ? 'mod' : ''}" data-item="${esc(f.tag)}">
    <header><span class="tag mono">${esc(f.tag)}</span><h4 data-title="${esc(f.tag)}">${esc(featLabel(f))}</h4><button class="sw" role="switch" data-tag="${esc(f.tag)}" aria-checked="${cur}" aria-label="${esc(featLabel(f))}"></button></header>
    <div class="ba"><span>قبل</span><div class="smp" data-fs-off="${esc(f.tag)}" dir="auto"></div><span>بعد</span><div class="smp" data-fs-on="${esc(f.tag)}" dir="auto"></div></div>
    <footer><span>${ar(f.lookups.size)} قاعدة</span>${chars ? `<span>${chars}</span>` : ''}${id ? `<button class="link" data-rename="${esc(f.tag)}">تعديل الاسم</button>` : ''}</footer>
  </article>`;
}
function renderSets(p) {
  const ss = S.feats.filter(f => /^ss\d\d$/.test(f.tag)), cv = S.feats.filter(f => /^cv\d\d$/.test(f.tag));
  let h = `<h3>مجموعات الأساليب</h3><p class="hint">لكل مجموعة معاينة قبل وبعد على بداية نصّك؛ إن لم يظهر فرق فاكتب في المعاينة نصاً يحوي الأحرف المتأثرة. فعّل ما يعجبك، وعدّل اسم المجموعة إن كان معرَّفاً داخل الخط.</p>`;
  if (!ss.length && !cv.length) {
    h += `<div class="empty">لا يحتوي هذا الخط على مجموعات أساليب (ss01–ss20) أو متغيّرات حروف (cv01–cv99).<br>يمكنك تجربة الميزات الأخرى من تبويب «الميزات».</div>`;
  } else {
    if (ss.length) h += `<div class="sets">${ss.map(setCard).join('')}</div>`;
    if (cv.length) h += `<div class="grp">متغيّرات الحروف</div><div class="sets">${cv.map(setCard).join('')}</div>`;
    h += `<p style="margin-top:14px"><button class="btn small" data-act="offsets">إيقاف كل المجموعات</button></p>`;
  }
  p.innerHTML = h;
}

/* ---------- all features ---------- */
function rowHtml(f) {
  const m = meta(f.tag), def = DEFAULT_ON.has(f.tag), cur = curOn(f.tag);
  const sc = [...f.scripts].filter(s => s !== 'DFLT').slice(0, 5).map(s => `<span>${esc(SCRIPTS[s] || s)}</span>`).join('');
  return `<div class="row ${cur !== def ? 'mod' : ''} ${cur ? 'on' : ''}" data-item="${esc(f.tag)}">
    <button class="sw" role="switch" data-tag="${esc(f.tag)}" aria-checked="${cur}" aria-label="${esc(m.name)}"></button>
    <div><div class="nm"><b>${esc(m.name)}</b><span class="mono">${esc(f.tag)}</span></div><div class="ds">${esc(m.desc)}</div>
    <div class="bd">${def ? '<span class="def">مفعّلة افتراضياً</span>' : ''}${[...f.tables].map(t => `<span class="mono">${t}</span>`).join('')}${sc}<span>${ar(f.lookups.size)} قاعدة</span></div></div></div>`;
}
function featureListHtml() {
  const q = S.filter.q.trim().toLowerCase(), mode = S.filter.mode;
  const list = S.feats.filter(f => !/^(ss|cv)\d\d$/.test(f.tag)).filter(f => {
    const m = meta(f.tag);
    if (q && !(f.tag.toLowerCase().includes(q) || m.name.includes(q) || m.desc.includes(q))) return false;
    if (mode === 'on' && !curOn(f.tag)) return false;
    if (mode === 'changed' && curOn(f.tag) === DEFAULT_ON.has(f.tag)) return false;
    return true;
  });
  if (!list.length) return '<div class="empty">لا توجد ميزات مطابقة.</div>';
  return GROUPS.map(([g, label]) => {
    const items = list.filter(f => groupOf(f.tag) === g);
    return items.length ? `<div class="grp">${label}</div><div class="rows">${items.map(rowHtml).join('')}</div>` : '';
  }).join('');
}
function renderFeatures(p) {
  const modes = [['all', 'الكل'], ['on', 'العاملة'], ['changed', 'المعدَّلة']];
  p.innerHTML = `<h3>ميزات OpenType</h3><p class="hint">كل ميزة موجودة في جدولَي GSUB وGPOS. المفعّلة افتراضياً تعمل في أي برنامج دون طلب؛ الباقية تحتاج إلى تفعيل.</p>
    <div class="filters"><input class="search" id="q" type="search" placeholder="ابحث بالاسم أو الرمز" value="${esc(S.filter.q)}" aria-label="بحث في الميزات">
    <div class="seg" role="group">${modes.map(([k, l]) => `<button data-mode="${k}" aria-pressed="${S.filter.mode === k}">${l}</button>`).join('')}</div></div>
    <div id="flist">${featureListHtml()}</div>
    <p style="margin-top:14px"><button class="btn small" data-act="reset">إعادة كل الميزات إلى وضعها الأصلي</button></p>`;
}

/* ---------- glyph gallery ---------- */
function renderGlyphs(p) {
  const cells = [], [, ranges] = GLYPH_SETS[S.glyphSet];
  outer: for (const [a, z] of ranges) for (let c = a; c <= z; c++) { if (S.info.cmap.has(c)) { cells.push(c); if (cells.length >= 500) break outer; } }
  const isMark = c => (c >= 0x64B && c <= 0x65F) || c === 0x670;
  p.innerHTML = `<h3>معرض الأحرف</h3><p class="hint">تظهر الأحرف بالميزات المفعّلة حالياً. اضغط حرفاً لإضافته إلى نص المعاينة.</p>
    <select id="gset" aria-label="مجموعة الأحرف">${GLYPH_SETS.map(([l], i) => `<option value="${i}" ${i === S.glyphSet ? 'selected' : ''}>${l}</option>`).join('')}</select>
    ${cells.length ? `<div class="gal">${cells.map(c => `<button data-cp="${c}" title="U+${c.toString(16).toUpperCase().padStart(4, '0')}" dir="rtl" lang="ar">${isMark(c) ? 'ـ' : ''}${esc(String.fromCodePoint(c))}</button>`).join('')}</div>` : '<div class="empty">لا يحتوي الخط على أحرف من هذه المجموعة.</div>'}`;
}

/* ---------- metadata ---------- */
const origName = id => nm(id, 'en');
const valName = id => (id in S.nameEdits) ? S.nameEdits[id] : origName(id);
function metaError(id, v) {
  if ([1, 2, 4, 6].includes(id) && !v.trim()) return 'هذا الحقل مطلوب';
  if (id === 6 && !/^[\x21-\x7E]{1,63}$/.test(v)) return 'اسم PostScript: أحرف لاتينية وأرقام وشرطة فقط، دون مسافات (حتى ٦٣ حرفاً)';
  if (id === 6 && /[\[\](){}<>\/%]/.test(v)) return 'اسم PostScript لا يقبل الأقواس ولا الرمزين / و %';
  return '';
}
function renderMeta(p) {
  if (!S.font.tables.name) { p.innerHTML = '<h3>بيانات الخط</h3><div class="empty">لا يحتوي الخط على جدول أسماء (name).</div>'; return; }
  const fields = META_FIELDS.filter(([id, , , core]) => core || origName(id) || (id in S.nameEdits) || [9, 8, 0, 10].includes(id));
  const f = ([id, label, type]) => {
    const v = valName(id), mod = id in S.nameEdits;
    const input = type === 'area' ? `<textarea data-name="${id}" dir="auto">${esc(v)}</textarea>` : `<input type="text" data-name="${id}" dir="auto" value="${esc(v)}">`;
    return `<div class="field ${mod ? 'mod' : ''}" data-field="${id}"><label><span>${label}</span><span class="mono">ID ${id}</span></label>${input}<div class="err" data-err="${id}"></div></div>`;
  };
  p.innerHTML = `<h3>بيانات الخط</h3><p class="hint">تُطبَّق الحقول المعدّلة فقط على الملف الناتج، وتحلّ محل الترجمات الأخرى لنفس الحقل.</p>
    <div class="ftwo">${fields.map(f).join('')}</div>
    <p><button class="btn small" data-act="gennames">توليد الاسم الكامل واسم PostScript من اسم العائلة</button></p>
    ${S.font.isCFF ? '<div class="note"><span>خطوط CFF تحمل اسم PostScript داخل جدول CFF أيضاً، ولا يُعدَّل هناك.</span></div>' : ''}
    <p><button class="btn small" data-act="resetnames">التراجع عن تعديلات البيانات</button></p>`;
}
function setNameEdit(id, v) {
  const err = metaError(id, v);
  const box = document.querySelector(`[data-err="${id}"]`); if (box) box.textContent = err;
  const fld = document.querySelector(`[data-field="${id}"]`);
  if (err) { delete S.nameEdits[id]; if (fld) fld.classList.remove('mod'); }
  else if (v === origName(id)) { delete S.nameEdits[id]; if (fld) fld.classList.remove('mod'); }
  else { S.nameEdits[id] = v; if (fld) fld.classList.add('mod'); }
  syncDock();
}
function genNames() {
  const fam = valName(1).trim(), style = valName(2).trim() || 'Regular';
  if (!fam) return toast('اكتب اسم العائلة أولاً');
  const asciiFam = fam.replace(/[^A-Za-z0-9]/g, '');
  const ps = (asciiFam || 'AlNahrFont') + '-' + (style.replace(/[^A-Za-z0-9]/g, '') || 'Regular');
  const set = (id, v) => { const i = document.querySelector(`[data-name="${id}"]`); if (i) i.value = v; setNameEdit(id, v); };
  set(4, fam + ' ' + style); set(6, ps); set(3, ps + ';AhmedAlNahr');
  if (origName(16)) set(16, fam);
  toast('تم توليد الأسماء التقنية');
}

/* ---------- build & download ---------- */
function changes() {
  const on = [], off = [];
  for (const f of S.feats) { const d = DEFAULT_ON.has(f.tag), c = curOn(f.tag); if (c && !d) on.push(f.tag); else if (!c && d) off.push(f.tag); }
  const names = Object.keys(S.nameEdits).filter(id => !metaError(+id, S.nameEdits[id]));
  const axes = S.info.fvar ? S.info.fvar.axes.filter(a => (S.axes[a.tag] ?? a.def) !== a.def).map(a => a.tag) : [];
  return { on, off, names, axes, total: on.length + off.length + names.length };
}
async function buildResult() {
  const ch = changes(), t = { ...S.font.tables }, notes = [];
  delete t.DSIG;
  const on = new Set(ch.on), off = new Set(ch.off);
  if (on.size || off.size) {
    for (const tn of ['GSUB', 'GPOS']) {
      if (!t[tn]) continue;
      const r = FC.bakeLayout(t[tn], on, off);
      if (r.changed) { t[tn] = r.bytes; if (r.tagWarning) notes.push('الخط يستخدم كل الأسماء الداخلية المتاحة للدمج، وقد تتأثر بعض البرامج.'); }
    }
  }
  if (ch.names.length && t.name) {
    const N = FC.parseName(t.name);
    ch.names.forEach(id => FC.setName(N, +id, S.nameEdits[id]));
    t.name = FC.buildName(N);
  }
  const sfnt = FC.buildSfnt(S.font.flavor, t);
  const woff = S.outFmt === 'woff' || S.font.kind === 'woff';
  const bytes = woff ? await FC.buildWoff(sfnt) : sfnt.bytes;
  const ext = woff ? 'woff' : (S.font.flavor === 0x4F54544F ? 'otf' : 'ttf');
  return { bytes, ext, notes };
}
function syncDock() {
  const c = changes();
  $('#dockInfo').textContent = c.total ? `${ar(c.total)} ${c.total === 1 ? 'تعديل جاهز' : c.total <= 10 ? 'تعديلات جاهزة' : 'تعديلاً جاهزاً'} للتنزيل` : 'لا تعديلات بعد';
  renderChips(c);
}
function renderChips(c) {
  const box = $('#chips');
  if (!c.on.length && !c.off.length) { box.innerHTML = 'لا تعديلات على الميزات. فعّل ميزة من اللوحة لتراها على النص.'; return; }
  box.innerHTML = c.on.map(t => `<button class="chip" data-revert="${esc(t)}" title="إلغاء"><span class="mono">${esc(t)}</span><b>✕</b></button>`).join('')
    + c.off.map(t => `<button class="chip off" data-revert="${esc(t)}" title="استرجاع"><span class="mono">${esc(t)}</span><b>✕</b></button>`).join('')
    + `<button class="link" data-act="reset">إعادة الضبط</button>`;
}
function fileBase() { const i = $('#fn'); return ((i && i.value.trim()) || (S.baseName + '-modified')).replace(/[\\/:*?"<>|]/g, '-'); }
async function saveFile(filename, bytes) {
  if (!dlCapReady) await new Promise(r => setTimeout(r, 1200));
  if (dlCap) {
    try { await dlCap.save({ filename, data: new Blob([bytes]) }); toast('تم حفظ الملف'); }
    catch (e) { toast(e && e.code === 'declined' ? 'أُلغي التنزيل' : e && e.code === 'too_large' ? 'الملف كبير جداً للتنزيل' : 'تعذّر التنزيل'); }
    return;
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([bytes])); a.download = filename; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  toast('بدأ التنزيل');
}
async function downloadNow(btn) {
  if (btn) btn.disabled = true;
  try {
    const r = await buildResult();
    const base = fileBase();
    if (r.ext === 'ttf' && !S.zip) await saveFile(base + '.ttf', r.bytes);
    else if (dlCap || S.zip) await saveFile(base + '.zip', FC.makeZip([{ name: base + '.' + r.ext, data: r.bytes }]));
    else await saveFile(base + '.' + r.ext, r.bytes);
  } catch (e) {
    toast(e && e.code === 'LAYOUT' ? 'بنية جداول هذا الخط لا تسمح بدمج الميزات: ' + e.message : 'تعذّر بناء الملف');
  }
  if (btn) btn.disabled = false;
}
function cssSnippet(c) {
  const parts = [...c.on.map(t => `"${t}" 1`), ...c.off.map(t => `"${t}" 0`)];
  return parts.length ? `font-feature-settings: ${parts.join(', ')};` : '/* لا تعديلات على الميزات */';
}
function renderDl(p) {
  const c = changes(), items = [];
  if (c.on.length) items.push(`دمج الميزات المفعّلة داخل الخط: <span class="mono">${c.on.join(' ')}</span>`);
  if (c.off.length) items.push(`إيقاف الميزات الافتراضية: <span class="mono">${c.off.join(' ')}</span>`);
  if (c.names.length) items.push(`تعديل ${ar(c.names.length)} من بيانات الخط وأسمائه`);
  const warn = [];
  if ((S.info.fsType || 0) & 2) warn.push(['bad', 'ترخيص الخط يمنع التضمين. لا تنزّل نسخة معدّلة أو توزّعها دون إذن المالك.']);
  if (c.axes.length) warn.push(['', 'قيم المحاور المتغيّرة (' + c.axes.join('، ') + ') للمعاينة فقط ولن تُحفظ في الملف.']);
  if (c.off.some(t => ['init', 'medi', 'fina', 'isol', 'ccmp', 'rlig', 'mark', 'mkmk'].includes(t))) warn.push(['', 'إيقاف ميزات الأشكال أو التموضع الأساسية قد يفسد اتصال الحروف أو مواضع التشكيل.']);
  const isWoff = S.font.kind === 'woff';
  p.innerHTML = `<h3>تنزيل الخط</h3>
    ${items.length ? `<ul class="sum">${items.map(i => `<li><span>${i}</span></li>`).join('')}</ul>` : '<p class="hint">لا تعديلات بعد. سيكون الملف الناتج نسخة مطابقة للأصل.</p>'}
    ${warn.map(([k, t]) => `<div class="note ${k}"><span>${t}</span></div>`).join('')}
    <h4>خيارات الملف</h4>
    <div class="ftwo">
      <div class="field"><label><span>اسم الملف</span></label><input type="text" id="fn" dir="ltr" value="${esc(S.baseName)}-modified"></div>
      ${isWoff ? '' : `<div class="field"><label><span>الصيغة</span></label><select id="ofmt"><option value="same" ${S.outFmt === 'same' ? 'selected' : ''}>${S.font.kind === 'otf' ? 'OTF (كالأصل)' : 'TTF (كالأصل)'}</option><option value="woff" ${S.outFmt === 'woff' ? 'selected' : ''}>WOFF (للمواقع)</option></select></div>`}
    </div>
    <label style="display:flex;gap:8px;align-items:center;margin-bottom:8px"><input type="checkbox" id="zip" ${S.zip ? 'checked' : ''}> تسليم الملف داخل ZIP</label>
    <p class="hint">ملفات OTF وWOFF تُسلَّم داخل ZIP تلقائياً، فمنصة العرض تسمح بحفظ ملفات TTF مباشرة فقط.</p>
    <p><button class="btn primary" id="dlBtn">تنزيل الخط المعدّل</button></p>
    <h4>فحص النسخة الناتجة</h4>
    <div id="verify"><p class="hint">جارٍ بناء النسخة…</p></div>
    <h4>أو استخدم الميزات في CSS دون تعديل الملف</h4>
    <pre class="code" id="cssOut">${esc(cssSnippet(c))}</pre>
    <p><button class="btn small" data-act="copycss">نسخ الكود</button></p>`;
  runVerify();
}
let verifyN = 0;
async function runVerify() {
  const box = $('#verify'); if (!box) return;
  const my = ++verifyN;
  try {
    const r = await buildResult();
    if (my !== verifyN || !$('#verify')) return;
    const fam = 'AFBaked' + my;
    const face = new FontFace(fam, r.bytes.buffer.slice(r.bytes.byteOffset, r.bytes.byteOffset + r.bytes.length));
    await face.load(); document.fonts.add(face);
    if (my !== verifyN || !$('#verify')) return;
    const txt = esc(snippet(36) || 'خطوط أحمد النهر');
    box.innerHTML = `<div class="note good"><span>اجتازت النسخة الناتجة فحص المتصفح. الحجم ${ar(Math.max(1, Math.round(r.bytes.length / 1024)))} كيلوبايت. المعاينتان أدناه يجب أن تتطابقا.</span></div>
      <div class="cmp"><div><small>الأصل مع الميزات المفعّلة</small><div class="v" dir="auto" lang="${esc($('#lang').value)}" style="font-family:'${S.fam}';font-feature-settings:${ffs()}">${txt}</div></div>
      <div><small>النسخة الناتجة دون أي إعدادات</small><div class="v" dir="auto" lang="${esc($('#lang').value)}" style="font-family:'${fam}'">${txt}</div></div></div>
      ${r.notes.map(n => `<div class="note"><span>${esc(n)}</span></div>`).join('')}`;
  } catch (e) {
    if (my !== verifyN || !$('#verify')) return;
    box.innerHTML = `<div class="note bad"><span>${e && e.code === 'LAYOUT' ? 'بنية جداول هذا الخط لا تسمح بدمج الميزات (' + esc(e.message) + ').' : 'رفض المتصفح النسخة الناتجة، وقد لا تصلح للاستخدام.'} جرّب تقليل التعديلات.</span></div>`;
  }
}

/* ---------- live sync ---------- */
function syncUI() {
  if (!S.font) return;
  stage.style.fontFeatureSettings = ffs();
  stage.style.fontVariationSettings = axesCSS();
  const txt = snippet(14);
  document.querySelectorAll('[data-fs-on]').forEach(el => { el.style.fontFeatureSettings = ffs({ on: el.dataset.fsOn }); el.style.fontVariationSettings = axesCSS(); if (el.textContent !== txt) el.textContent = txt; });
  document.querySelectorAll('[data-fs-off]').forEach(el => { el.style.fontFeatureSettings = ffs({ off: el.dataset.fsOff }); el.style.fontVariationSettings = axesCSS(); if (el.textContent !== txt) el.textContent = txt; });
  document.querySelectorAll('.sw[data-tag]').forEach(b => b.setAttribute('aria-checked', curOn(b.dataset.tag)));
  document.querySelectorAll('[data-item]').forEach(el => { const t = el.dataset.item; el.classList.toggle('on', curOn(t)); el.classList.toggle('mod', curOn(t) !== DEFAULT_ON.has(t)); });
  document.querySelectorAll('.gal button').forEach(b => { b.style.fontFeatureSettings = ffs(); b.style.fontVariationSettings = axesCSS(); });
  syncDock();
}
function toggle(tag) {
  const cur = curOn(tag), next = !cur;
  if (next === DEFAULT_ON.has(tag)) delete S.on[tag]; else S.on[tag] = next;
  syncUI();
  if (S.tab === 'features' && S.filter.mode !== 'all') { const l = $('#flist'); if (l) l.innerHTML = featureListHtml(); syncUI(); }
  if (S.tab === 'dl') scheduleVerify();
}
let vt = 0;
function scheduleVerify() { clearTimeout(vt); vt = setTimeout(runVerify, 350); }
function startRename(tag) {
  const f = S.feats.find(x => x.tag === tag), q = f && f.params; if (!q) return;
  const id = q.kind === 'ss' ? q.nameId : q.labelId;
  const h = document.querySelector(`[data-title="${CSS.escape(tag)}"]`); if (!h) return;
  const inp = document.createElement('input');
  inp.className = 'rn'; inp.value = featLabel(f); inp.setAttribute('aria-label', 'اسم المجموعة'); inp.dir = 'auto';
  h.replaceChildren(inp); inp.focus(); inp.select();
  const done = save => {
    if (save) { const v = inp.value.trim(); if (!v) delete S.nameEdits[id]; else if (v === nm(id, 'en')) delete S.nameEdits[id]; else S.nameEdits[id] = v; }
    h.textContent = featLabel(f); syncDock();
    const sw = h.parentElement.querySelector('.sw'); if (sw) sw.setAttribute('aria-label', featLabel(f));
  };
  inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); inp.blur(); } if (e.key === 'Escape') { inp.value = featLabel(f); inp.blur(); } });
  inp.addEventListener('blur', () => done(true), { once: true });
}

/* ---------- events ---------- */
const fileIn = $('#file');
fileIn.addEventListener('change', () => { if (fileIn.files[0]) loadFile(fileIn.files[0]); fileIn.value = ''; });
$('#change').addEventListener('click', () => fileIn.click());
const drop = $('#drop');
['dragenter', 'dragover'].forEach(ev => document.addEventListener(ev, e => { e.preventDefault(); drop.classList.add('over'); }));
['dragleave', 'drop'].forEach(ev => document.addEventListener(ev, e => { e.preventDefault(); if (ev === 'drop' || e.target === document || e.relatedTarget === null) drop.classList.remove('over'); }));
document.addEventListener('drop', e => { const f = e.dataTransfer && e.dataTransfer.files[0]; if (f) loadFile(f); });
drop.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileIn.click(); } });

try { stage.contentEditable = 'plaintext-only'; } catch (e) { /* fall back */ }
if (stage.contentEditable !== 'plaintext-only') stage.contentEditable = 'true';
stage.addEventListener('input', () => { syncUI(); if (S.tab === 'dl') scheduleVerify(); });
stage.addEventListener('paste', e => { e.preventDefault(); const t = (e.clipboardData || window.clipboardData).getData('text'); document.execCommand('insertText', false, t); });
$('#sample').innerHTML = SAMPLES.map(([l], i) => `<option value="${i}">${l}</option>`).join('');
$('#sample').addEventListener('change', e => { stage.textContent = SAMPLES[+e.target.value][1]; syncUI(); });
$('#lang').addEventListener('change', e => { stage.lang = e.target.value; if (S.tab === 'dl') scheduleVerify(); });
$('#size').addEventListener('input', e => { stage.style.setProperty('--size', e.target.value + 'px'); $('#sizeOut').textContent = ar(e.target.value); });
document.querySelector('.seg[aria-label="اتجاه النص"]').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  stage.dir = b.dataset.dir;
  e.currentTarget.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x === b));
});
$('#axes').addEventListener('input', e => {
  const a = e.target.dataset.axis; if (!a) return;
  S.axes[a] = +e.target.value; e.target.nextElementSibling.textContent = e.target.value; syncUI();
});
$('#axes').addEventListener('click', e => {
  const b = e.target.closest('[data-inst]'); if (!b) return;
  const inst = S.info.fvar.instances[+b.dataset.inst];
  S.info.fvar.axes.forEach((a, i) => { S.axes[a.tag] = inst.coords[i]; });
  buildAxes(); syncUI();
});
$('#tabs').addEventListener('click', e => {
  const b = e.target.closest('[data-tab]'); if (!b) return;
  S.tab = b.dataset.tab; renderTabs(); renderPane();
});
$('#chips').addEventListener('click', e => {
  const r = e.target.closest('[data-revert]'); if (r) { delete S.on[r.dataset.revert]; syncUI(); if (S.tab === 'dl') scheduleVerify(); return; }
  if (e.target.closest('[data-act="reset"]')) { S.on = {}; syncUI(); if (S.tab === 'features') renderPane(); }
});
$('#dockDl').addEventListener('click', e => downloadNow(e.currentTarget));
const pane = $('#pane');
pane.addEventListener('click', e => {
  const sw = e.target.closest('.sw[data-tag]'); if (sw) return toggle(sw.dataset.tag);
  const mode = e.target.closest('[data-mode]'); if (mode) { S.filter.mode = mode.dataset.mode; pane.querySelectorAll('[data-mode]').forEach(b => b.setAttribute('aria-pressed', b === mode)); $('#flist').innerHTML = featureListHtml(); return syncUI(); }
  const cp = e.target.closest('[data-cp]'); if (cp) { stage.textContent += String.fromCodePoint(+cp.dataset.cp); syncUI(); return toast('أُضيف الحرف إلى نص المعاينة'); }
  const rn = e.target.closest('[data-rename]'); if (rn) return startRename(rn.dataset.rename);
  if (e.target.id === 'dlBtn') return downloadNow(e.target);
  const act = e.target.closest('[data-act]'); if (!act) return;
  const a = act.dataset.act;
  if (a === 'reset') { S.on = {}; renderPane(); }
  else if (a === 'offsets') { S.feats.filter(f => /^(ss|cv)\d\d$/.test(f.tag)).forEach(f => delete S.on[f.tag]); syncUI(); }
  else if (a === 'gennames') genNames();
  else if (a === 'resetnames') { S.nameEdits = {}; renderPane(); }
  else if (a === 'copycss') { const t = $('#cssOut').textContent; (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(() => toast('نُسخ الكود'), () => { const r = document.createRange(); r.selectNodeContents($('#cssOut')); const s = getSelection(); s.removeAllRanges(); s.addRange(r); toast('حدّد الكود ثم انسخه يدوياً'); }); }
});
pane.addEventListener('input', e => {
  const t = e.target;
  if (t.id === 'q') { S.filter.q = t.value; $('#flist').innerHTML = featureListHtml(); syncUI(); }
  else if (t.dataset.name) setNameEdit(+t.dataset.name, t.value);
  else if (t.id === 'zip') S.zip = t.checked;
});
pane.addEventListener('change', e => {
  const t = e.target;
  if (t.id === 'gset') { S.glyphSet = +t.value; renderPane(); }
  else if (t.id === 'ofmt') { S.outFmt = t.value; scheduleVerify(); }
  else if (t.dataset.name && S.tab === 'meta') { /* already applied on input */ }
});
})();
