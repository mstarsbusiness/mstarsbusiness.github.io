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
  'terms.html', 'privacy-policy.html', '404.html',
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
  return body
    .replace(/<[^>]+>/g, '\n')
    .split('\n')
    .map((s) => s.trim())
    .filter((s) => s && /[一-鿿]/.test(s));
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
