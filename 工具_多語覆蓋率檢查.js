/* =============================================================
 * 官網多語覆蓋率檢查（2026-08-07）
 *
 * 為什麼要有這支：官網的英/日版是「前端翻譯」——把中文字句對照 i18n.js 的字典換掉。
 * 只要有人新增中文內容而沒同步加進字典，該句就會維持中文 → 英/日版變成中英夾雜。
 * 這種劣化是「無聲」的（畫面不會報錯），所以需要主動檢查。
 *
 * 用法（在本資料夾開 cmd 或 PowerShell）：
 *     node 工具_多語覆蓋率檢查.js
 *
 * 輸出：每頁的覆蓋率，以及尚未收錄的中文句子清單（複製給 Claude 補字典即可）。
 * 專有名詞（人名、客戶公司名、Google 評論內容）本來就不該翻譯，已列入忽略清單。
 * ============================================================= */
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PAGES = [
  'index.html', 'virtual-office.html', 'private-office.html', 'meeting-room.html',
  'office-guide.html', 'registration-check.html', 'crm.html',
  'terms.html', 'privacy-policy.html', 'privacy.html', '404.html',
  'journal.html', 'dark.html', 'light.html',
  '辰星場館相簿-信義館.html', '辰星場館相簿-世貿館.html',
];

/* 不需要翻譯的：專有名詞與使用者原文 */
const IGNORE_PATTERNS = [
  /^[一-鿿]{1,4}$/,                 // 1–4 字：多為人名（李昕哲、陳炳勳…）
  /有限公司|股份有限公司|事務所|工程行|企業社/, // 客戶公司名
  /^(信義館|世貿館)[・·]/,                    // 「世貿館・1週前」評論標記
  /👍|🏼|😊|📍/,                              // 含表情符號的評論多為使用者原文
  /^©/,                                      // 版權宣告
  /^(辦公室環境|服務人員|交通方便)/,          // Google 評論原文（使用者所寫，維持原文）
  /document\.referrer|window\.close/,        // 相簿頁的 inline JS 片段（非可見文字）
];

function shouldIgnore(text) {
  return IGNORE_PATTERNS.some((re) => re.test(text));
}

/* 從 i18n.js 取出字典收錄的中文 key */
function loadDictKeys() {
  const src = fs.readFileSync(path.join(ROOT, 'i18n.js'), 'utf8');
  const keys = new Set();
  const patterns = [/"([^"]*[一-鿿][^"]*)"\s*:\s*\[/g, /'([^']*[一-鿿][^']*)'\s*:\s*\[/g];
  for (const re of patterns) {
    let m;
    while ((m = re.exec(src)) !== null) keys.add(m[1]);
  }
  return keys;
}

/* 取出頁面上「使用者看得到」的中文字句 */
function visibleChinese(file) {
  const html = fs.readFileSync(path.join(ROOT, file), 'utf8');
  let body = html.slice(html.indexOf('<body'));
  body = body.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '');
  // journal 的貼文卡片（標題/摘要/日期）是「內容」——由 build-journal 自動產生、每發文就變，
  // 不透過字典翻譯（中文部落格維持中文為合理設計），故剝除不檢查。
  if (file === 'journal.html') {
    body = body.replace(/<a class="post-card[\s\S]*?<\/a>/g, '');
  }
  // ⚠️ 必須與 i18n.js 引擎的判讀方式一致：
  //    引擎走訪的是「文字節點」＝兩個標籤之間的整段文字，只做首尾 trim，
  //    段落中間的換行與空白會保留在 key 裡。
  //    （早期版本用 \n 切段，導致跨行的句子被切成兩半、字典 key 對不上而「補了也沒生效」。）
  const nodes = [];
  const re = />([^<]+)</g;
  let m;
  while ((m = re.exec(body)) !== null) {
    const raw = m[1];
    const key = raw.trim();
    if (key && /[一-鿿]/.test(key)) nodes.push(key);
  }
  // 屬性值（placeholder / aria-label / title / alt）引擎也會翻譯
  const attrRe = /(?:placeholder|aria-label|title|alt)="([^"]*[一-鿿][^"]*)"/g;
  while ((m = attrRe.exec(body)) !== null) nodes.push(m[1].trim());
  return nodes;
}

const dict = loadDictKeys();
console.log('字典收錄：' + dict.size + ' 句\n');

let totalMissing = 0;
const allMissing = new Map();

for (const page of PAGES) {
  if (!fs.existsSync(path.join(ROOT, page))) continue;
  const lines = visibleChinese(page);
  const missing = lines.filter((l) => !dict.has(l) && !shouldIgnore(l));
  const pct = lines.length ? Math.round(((lines.length - missing.length) / lines.length) * 100) : 100;
  const mark = missing.length === 0 ? '✅' : (pct >= 95 ? '🟡' : '🔴');
  console.log(`${mark} ${page.padEnd(26)} 覆蓋率 ${String(pct).padStart(3)}%　未收錄 ${missing.length} 句`);
  missing.forEach((m) => {
    if (!allMissing.has(m)) allMissing.set(m, []);
    allMissing.get(m).push(page);
  });
  totalMissing += missing.length;
}

console.log('\n========================================');
if (allMissing.size === 0) {
  console.log('✅ 全部頁面的中文字句都已收錄，英／日版不會出現中文。');
} else {
  console.log(`🔴 共 ${allMissing.size} 句尚未收錄（英／日版會顯示中文）：\n`);
  let i = 1;
  for (const [text, pages] of allMissing) {
    console.log(`${String(i++).padStart(3)}. ${text}`);
    console.log(`     ↳ ${pages.join(', ')}`);
  }
  console.log('\n把上面清單交給 Claude，會補進 i18n.js 的字典。');
}
console.log('========================================');

/* ---- 快取檢查：改完 i18n.js 一定要 bump 版本號，否則訪客瀏覽器會一直用舊字典 ---- */
const htmls = fs.readdirSync(ROOT).filter((f) => f.endsWith('.html'));
const vers = new Set();
let noVer = [];
for (const f of htmls) {
  const src = fs.readFileSync(path.join(ROOT, f), 'utf8');
  const m = src.match(/src="(?:\.\.\/)?i18n\.js(\?v=(\d+))?"/);
  if (!m) continue;
  if (!m[2]) noVer.push(f); else vers.add(m[2]);
}
console.log('\n【快取檢查】i18n.js 版本參數');
if (noVer.length) {
  console.log('🔴 下列頁面引用 i18n.js 沒有 ?v= 版本號，訪客會讀到舊字典：');
  noVer.forEach((f) => console.log('   - ' + f));
} else if (vers.size > 1) {
  console.log('🟡 版本號不一致：' + [...vers].join(' / ') + '（建議全站統一）');
} else {
  console.log('✅ 全站統一為 ?v=' + [...vers][0]);
  console.log('   ⚠️ 每次修改 i18n.js 後，請把所有頁面的 ?v= 換成當天日期（例 ?v=20260808），');
  console.log('      否則回訪的訪客瀏覽器會沿用快取中的舊字典，新翻譯不會生效。');
}
console.log('========================================');
