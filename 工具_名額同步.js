/* =============================================================
 * 官網名額同步（2026-11-19 老闆同意「官網名額單一來源＋自動同步 CRM」）
 *
 * 為什麼要有這支：世貿館借址名額的「尚有名額／額滿可候補」散在 13 個檔、40 幾處
 * （頁面文字、meta 說明、結構化資料、FAQ、llms.txt、英文頁、影片字卡）。
 * 以前名額一變就要人工逐頁改，漏一處＝官網對外說有名額、AI 客服卻說額滿。
 *
 * 單一來源＝CRM（後台站 /.netlify/functions/site-status，與 AI 客服同一套名額算法）。
 * 這支把官網文字切到 CRM 現在的狀態；GitHub Actions（.github/workflows/sync-availability.yml）
 * 每天台灣 08:40、14:40 自動跑，有變才提交並觸發 FTP 部署。
 *
 * 目前自動同步的範圍：**世貿館借址登記**（open＝尚有名額／full＝額滿可候補）。
 *   信義館借址、兩館辦公室、兩館座位＝老闆宣告或極少變動，維持人工改；
 *   CRM 顯示它們有空位而官網仍寫額滿時，這支只「提醒」不自動改（文案要看釋出的是哪一種空間）。
 *
 * 用法（在官網資料夾開 cmd／PowerShell）：
 *   node 工具_名額同步.js              只檢查：CRM 狀態 vs 官網目前寫法，不改檔
 *   node 工具_名額同步.js --apply      依 CRM 狀態改檔（CRM 讀不到＝不改）
 *   node 工具_名額同步.js --state=full --apply   不問 CRM，手動切到指定狀態（open／full）
 *   node 工具_名額同步.js --selftest   在記憶體裡 open→full→open 來回切一次，確認每一處都對得上、能還原
 *
 * 安全設計：
 *   ① 每一組文字都要「open 版＋full 版」在該檔出現的次數剛好等於設定值，對不上（有人改過那段字）就跳過並警告，不硬改。
 *   ② CRM 回應不是 ok:true 或缺館別＝一律不改檔（官網維持原樣，不會因為 CRM 當機被改成錯的）。
 *   ③ full 版的中文句子都已預先加進 i18n.js 字典（英／日不會變中文）；新增或改句子時兩邊要一起改，
 *      改完跑 --selftest＋`node 工具_多語覆蓋率檢查.js`。
 *   ④ 頁面上看得到的 FAQ 與 FAQPage schema 用同一組文字替換（鐵則：兩者一字不差）。
 * ============================================================= */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = __dirname;
const API = process.env.SITE_STATUS_URL || 'https://morning-stars-right.netlify.app/.netlify/functions/site-status';

/* ── 世貿館借址：每組 [open 版, full 版]，n＝該檔應出現幾次（預設 1） ── */
const WTC_ADDR = [
  // company-setup.html
  { f: ['company-setup.html'], open: '世貿館尚有名額、信義館額滿可候補', full: '兩館目前皆額滿、可登記候補' },
  { f: ['company-setup.html'], open: '目前尚有名額）→ Simpany', full: '目前額滿可候補）→ Simpany' },
  { f: ['company-setup.html'], open: '首期合計 19,500 元；目前尚有名額）","availability":"https://schema.org/LimitedAvailability"', full: '首期合計 19,500 元；目前額滿，可登記候補）","availability":"https://schema.org/SoldOut"' },
  { f: ['company-setup.html'], open: '<b>世貿館尚有名額，信義館額滿可候補</b>', full: '<b>兩館借址登記目前皆額滿，可登記候補</b>' },
  { f: ['company-setup.html'], open: '<b>世貿館登記地址尚有名額；信義館目前額滿，開放候補登記</b>', full: '<b>兩館登記地址目前皆額滿，開放候補登記</b>' },
  { f: ['company-setup.html'], open: '<b>世貿館尚有名額・信義館額滿可候補</b>', full: '<b>兩館目前皆額滿・可登記候補</b>' },
  // 首頁三版型 meta
  { f: ['index.html', 'dark.html', 'light.html'], open: '含稅，目前尚有名額）、獨立辦公室', full: '含稅，目前額滿可候補）、獨立辦公室' },
  { f: ['index.html'], open: '借址登記｜世貿館年繳 NT$18,000 起（尚有名額）→', full: '借址登記｜世貿館年繳 NT$18,000 起（目前額滿・可候補）→' },
  // office-guide.html／virtual-office.html 名額列
  { f: ['office-guide.html'], open: '借址登記世貿館尚有名額、信義館額滿可候補；', full: '借址登記兩館皆額滿可候補；' },
  { f: ['virtual-office.html'], open: '世貿館借址登記尚有名額，可直接申請；信義館已額滿，開放候補。', full: '兩館借址登記目前皆額滿，開放候補。' },
  { f: ['virtual-office.html'], open: '首期合計 19,500 元。目前尚有名額。', full: '首期合計 19,500 元。目前已額滿，可登記候補。' },
  { f: ['virtual-office.html'], open: ['"availability": "https://schema.org/LimitedAvailability",', '"availableAtOrFrom": { "@type": "Place", "name": "辰星商務中心 世貿館"'],
    full: ['"availability": "https://schema.org/SoldOut",', '"availableAtOrFrom": { "@type": "Place", "name": "辰星商務中心 世貿館"'] },
  // wtc.html
  { f: ['wtc.html'], open: '含稅，目前尚有名額；會議室', full: '含稅，目前額滿可候補；會議室' },
  { f: ['wtc.html'], open: '24 小時門禁。借址登記目前尚有名額。', full: '24 小時門禁。借址登記目前額滿，可登記候補。' },
  { f: ['wtc.html'], open: '每月贈 6 小時會議室。目前尚有名額。","availability":"https://schema.org/LimitedAvailability"', full: '每月贈 6 小時會議室。目前已額滿，可登記候補。","availability":"https://schema.org/SoldOut"' },
  { f: ['wtc.html'], n: 2, open: '有。世貿館的借址登記目前尚有名額（年費 18,000＋押金 1,500＝首期 19,500 含稅），歡迎來電 0903-368-856 或加 LINE @mstars 預約參觀辦理。信義館的借址名額目前已額滿，可登記候補。',
    full: '目前沒有。世貿館的借址登記目前已額滿（年費 18,000＋押金 1,500＝首期 19,500 含稅），可來電 0903-368-856 或加 LINE @mstars 登記候補，有名額會依登記順序通知。信義館的借址名額目前也已額滿。' },
  { f: ['wtc.html'], open: '<b>借址登記目前尚有名額</b>', full: '<b>借址登記目前額滿，可登記候補</b>' },
  { f: ['wtc.html'], open: '次年起僅繳 18,000</td><td><span class="tag-ok">尚有名額</span>', full: '次年起僅繳 18,000</td><td><span class="tag-no">已額滿・可候補</span>' },
  { f: ['wtc.html'], open: '借址登記目前尚有名額，看過現場即可辦理。', full: '借址登記目前額滿，可先登記候補，有名額會依序通知。' },
  // xinyi.html（信義館額滿時引導到世貿館的句子）
  { f: ['xinyi.html'], n: 2, open: '世貿館的借址登記目前尚有名額（年費 18,000＋押金 1,500＝首期 19,500 含稅），可改至世貿館辦理。', full: '世貿館的借址登記目前也已額滿（年費 18,000＋押金 1,500＝首期 19,500 含稅），一樣可登記候補。' },
  { f: ['xinyi.html'], open: '的借址登記<b>目前尚有名額</b>（首期 19,500 含稅），可改至世貿館辦理。', full: '的借址登記<b>目前也已額滿</b>（首期 19,500 含稅），一樣可登記候補。' },
  { f: ['xinyi.html'], open: '</a>尚有名額，可直接辦理。', full: '</a>目前也已額滿，可登記候補。' },
  // video.html 字卡（只有中文）
  { f: ['video.html'], open: "cap:{t:'世貿館設址尚有名額', s:'信義館額滿可登記候補'", full: "cap:{t:'兩館設址目前額滿', s:'歡迎先登記候補'" },
  { f: ['video.html'], open: "vo:'世貿館設址登記尚有名額，信義館目前額滿可登記候補。'", full: "vo:'兩館設址登記目前皆額滿，歡迎先登記候補。'" },
  // llms.txt（AI 引擎讀的摘要）
  { f: ['llms.txt'], open: '；世貿館尚有名額；共享座位', full: '；世貿館目前亦額滿、可候補；共享座位' },
  { f: ['llms.txt'], open: '**借址登記尚有名額（平均每月 1,500；', full: '**借址登記目前額滿、可登記候補（平均每月 1,500；' },
  { f: ['llms.txt'], open: '- 借址登記：世貿館尚有名額，可直接申請（', full: '- 借址登記：世貿館目前額滿，可登記候補（' },
  { f: ['llms.txt'], open: '- 額滿方案（信義館借址、兩館獨立辦公室', full: '- 額滿方案（兩館借址、兩館獨立辦公室' },
  { f: ['llms.txt'], open: '世貿館尚有名額、信義館額滿可候補（見「目前狀態」）', full: '兩館目前皆額滿可候補（見「目前狀態」）' },
  { f: ['llms.txt', 'en/virtual-office.html'], open: 'the WTC Branch currently has registration addresses available; the Xinyi Branch is full with a waiting list open', full: 'registration addresses at both branches are currently full, with a waiting list open' },
  // 英文頁
  { f: ['en/index.html'], open: 'From NT$18,000 / year · WTC Branch available', full: 'From NT$18,000 / year · waiting list open' },
  { f: ['en/index.html', 'en/virtual-office.html'], open: '<em>WTC Branch available; Xinyi Branch full — waiting list open.</em>', full: '<em>Both branches currently full — waiting list open.</em>' },
  { f: ['en/virtual-office.html'], n: 2, open: 'The WTC Branch has places available; the Xinyi Branch is full with a waiting list open.', full: 'Both branches are currently full, with a waiting list open.' },
  { f: ['en/virtual-office.html'],
    open: '(WTC Branch, places available; Xinyi Branch NT$21,600 per year, about NT$1,800 per month, currently full with waiting list).","priceSpecification":{"@type":"UnitPriceSpecification","price":"18000","priceCurrency":"TWD","unitText":"year","referenceQuantity":{"@type":"QuantitativeValue","value":1,"unitCode":"ANN"},"valueAddedTaxIncluded":true},"availability":"https://schema.org/LimitedAvailability"',
    full: '(WTC Branch; Xinyi Branch NT$21,600 per year, about NT$1,800 per month; both branches currently full with waiting list).","priceSpecification":{"@type":"UnitPriceSpecification","price":"18000","priceCurrency":"TWD","unitText":"year","referenceQuantity":{"@type":"QuantitativeValue","value":1,"unitCode":"ANN"},"valueAddedTaxIncluded":true},"availability":"https://schema.org/SoldOut"' },
];

/* 人工維護、只提醒的品項：官網目前寫「額滿」，CRM 若顯示有空位就提醒 */
const MANUAL = [
  { key: ['信義館', 'addr'], label: '信義館借址登記' },
  { key: ['世貿館', 'office'], label: '世貿館獨立辦公室' },
  { key: ['信義館', 'office'], label: '信義館獨立辦公室' },
  { key: ['世貿館', 'seat'], label: '世貿館共享座位' },
  { key: ['信義館', 'seat'], label: '信義館共享座位' },
];

/* ── 比對工具 ── */
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function rx(v) { return new RegExp((Array.isArray(v) ? v.map(esc).join('(\\s+)') : esc(v)), 'g'); }
function count(src, v) { return (src.match(rx(v)) || []).length; }
function swap(src, from, to) {
  if (!Array.isArray(from)) return src.split(from).join(to);
  return src.replace(rx(from), function () { const ws = [].slice.call(arguments, 1, from.length); return to.map((p, i) => p + (i < ws.length ? ws[i] : '')).join(''); });
}

function readAll(files) { const m = {}; for (const f of files) m[f] = fs.readFileSync(path.join(ROOT, f), 'utf8'); return m; }
function allFiles() { return [...new Set(WTC_ADDR.flatMap(p => p.f))]; }

/* 回傳 { state:'open'|'full'|'mixed'|'unknown', bad:[…] }；bad＝次數對不上的組 */
function detect(files) {
  let o = 0, fu = 0; const bad = [];
  for (const p of WTC_ADDR) for (const f of p.f) {
    const n = p.n || 1, a = count(files[f], p.open), b = count(files[f], p.full);
    if (a + b !== n) { bad.push(f + '：「' + String(Array.isArray(p.open) ? p.open[0] : p.open).slice(0, 40) + '…」open ' + a + '／full ' + b + '（應合計 ' + n + '）'); continue; }
    o += a; fu += b;
  }
  return { state: o && !fu ? 'open' : (fu && !o ? 'full' : (o || fu ? 'mixed' : 'unknown')), open: o, full: fu, bad };
}
function applyState(files, target) {
  const out = Object.assign({}, files); let changes = 0;
  for (const p of WTC_ADDR) for (const f of p.f) {
    const n = p.n || 1, a = count(out[f], p.open), b = count(out[f], p.full);
    if (a + b !== n) continue;                                   // 對不上就不碰（detect 會列出來）
    const from = target === 'full' ? p.open : p.full, to = target === 'full' ? p.full : p.open;
    const k = count(out[f], from); if (!k) continue;
    out[f] = swap(out[f], from, to); changes += k;
  }
  if (changes && out['llms.txt']) out['llms.txt'] = out['llms.txt'].replace(/- 資訊更新：\d{4}-\d{2}-\d{2}/, '- 資訊更新：' + twDate());
  return { files: out, changes };
}
function twDate() { return new Date(Date.now() + 8 * 3600000).toISOString().slice(0, 10); }

async function fetchCRM() {
  const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 15000);
  try {
    const r = await fetch(API, { signal: ctl.signal, headers: { 'User-Agent': 'mstars-site-sync' } });
    const j = await r.json().catch(() => null);
    if (!r.ok || !j || j.ok !== true || !j.venues || !j.venues['世貿館'] || !j.venues['信義館']) return { err: 'HTTP ' + r.status + ' ' + JSON.stringify(j).slice(0, 120) };
    for (const v of ['世貿館', '信義館']) for (const k of ['addr', 'office', 'seat']) if (!/^(open|full)$/.test(j.venues[v][k])) return { err: '狀態格式不對：' + v + '.' + k };
    return { data: j };
  } catch (e) { return { err: String(e && e.message || e) }; } finally { clearTimeout(t); }
}

function ghOut(k, v) { if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, k + '=' + v + '\n'); }
function warn(msg) { console.log((process.env.GITHUB_ACTIONS ? '::warning::' : '⚠️ ') + msg); }

async function main() {
  const args = process.argv.slice(2);
  const APPLY = args.includes('--apply'), SELF = args.includes('--selftest');
  const forced = (args.find(a => a.startsWith('--state=')) || '').split('=')[1];
  const files = readAll(allFiles());
  const cur = detect(files);
  console.log('官網目前（世貿館借址）：' + cur.state + '（open ' + cur.open + ' 處／full ' + cur.full + ' 處）');
  cur.bad.forEach(b => warn('文字對不上、這組不自動改：' + b));

  if (SELF) {
    const a = applyState(files, 'full'), da = detect(a.files);
    const b = applyState(a.files, 'open'), db = detect(b.files);
    const back = applyState(b.files, cur.state === 'full' ? 'full' : 'open');
    const same = Object.keys(files).every(f => back.files[f].replace(/- 資訊更新：\d{4}-\d{2}-\d{2}/, '') === files[f].replace(/- 資訊更新：\d{4}-\d{2}-\d{2}/, ''));
    console.log('selftest：→full 改 ' + a.changes + ' 處（' + da.state + '）→open 改 ' + b.changes + ' 處（' + db.state + '）→還原 ' + (same ? '一致 ✅' : '不一致 ❌'));
    if (args.includes('--write-full')) { for (const f of Object.keys(a.files)) { const d = path.join(ROOT, '_selftest_full', f); fs.mkdirSync(path.dirname(d), { recursive: true }); fs.writeFileSync(d, a.files[f]); } console.log('full 版另存到 _selftest_full/（檢查完請刪除，不要提交）'); }
    process.exit(same && !cur.bad.length && da.state === 'full' && db.state === 'open' ? 0 : 1);
  }

  let target = forced, crm = null;
  if (!target) {
    const r = await fetchCRM();
    if (r.err) { warn('讀不到 CRM 名額（' + r.err + '）——官網維持原樣，不改檔'); ghOut('changed', 'false'); return; }
    crm = r.data; target = crm.venues['世貿館'].addr;
    console.log('CRM（' + crm.updated + '）：' + ['世貿館', '信義館'].map(v => v + ' 借址 ' + crm.venues[v].addr + '／辦公室 ' + crm.venues[v].office + '／座位 ' + crm.venues[v].seat).join('；'));
    for (const m of MANUAL) if (crm.venues[m.key[0]][m.key[1]] === 'open') warn('CRM 顯示「' + m.label + '」有空位，官網仍寫額滿——這項不自動改，請通知 Claude 依實際釋出的空間改文案');
  }
  if (!/^(open|full)$/.test(target)) { warn('目標狀態不明：' + target); ghOut('changed', 'false'); return; }
  if (cur.state === target) { console.log('官網已是 ' + target + '，不用改'); ghOut('changed', 'false'); return; }
  const r = applyState(files, target);
  console.log((APPLY ? '' : '（只檢查）') + '要切到 ' + target + '：共 ' + r.changes + ' 處');
  if (!APPLY) { ghOut('changed', 'false'); return; }
  const changed = [];
  for (const f of Object.keys(r.files)) if (r.files[f] !== files[f]) { fs.writeFileSync(path.join(ROOT, f), r.files[f]); changed.push(f); }
  console.log('已改檔：' + changed.join('、'));
  ghOut('changed', changed.length ? 'true' : 'false');
  ghOut('target', target);
}
main().catch(e => { warn('名額同步失敗：' + (e && e.message || e)); ghOut('changed', 'false'); });
