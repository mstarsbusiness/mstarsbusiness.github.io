#!/usr/bin/env node
/*
 * 辰星官網本機驗證工具
 * 用法：在「上傳到GitHub」資料夾執行 node validate-site.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const errors = [];
const warnings = [];

const htmlFiles = [
  ...fs.readdirSync(ROOT).filter(file => file.endsWith('.html')),
  ...fs.readdirSync(path.join(ROOT, 'posts')).filter(file => file.endsWith('.html')).map(file => `posts/${file}`)
];

for (const file of htmlFiles) {
  const absoluteFile = path.join(ROOT, file);
  const html = fs.readFileSync(absoluteFile, 'utf8');
  const baseDir = path.dirname(absoluteFile);
  const anchors = collectAnchors(html);

  const jsonLdRe = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g;
  let jsonLdMatch;
  while ((jsonLdMatch = jsonLdRe.exec(html))) {
    try {
      JSON.parse(jsonLdMatch[1]);
    } catch (error) {
      errors.push(`${file}: JSON-LD 解析失敗：${error.message}`);
    }
  }

  const imageRe = /<img[^>]+src="([^"]+)"/g;
  let imageMatch;
  while ((imageMatch = imageRe.exec(html))) {
    checkLocalTarget(file, baseDir, imageMatch[1], '圖片');
  }

  const assetRe = /<(?:script|link)[^>]+(?:src|href)="([^"]+)"/g;
  let assetMatch;
  while ((assetMatch = assetRe.exec(html))) {
    checkLocalTarget(file, baseDir, assetMatch[1], '資源');
  }

  const linkRe = /<a[^>]+href="([^"]+)"/g;
  let linkMatch;
  while ((linkMatch = linkRe.exec(html))) {
    checkLocalTarget(file, baseDir, linkMatch[1], '連結', { allowAnchor: true, anchors });
  }
}

const sitemap = fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8');
for (const required of ['office-guide.html', 'journal.html', '/posts/', 'privacy-policy.html', 'terms.html']) {
  if (!sitemap.includes(required)) errors.push(`sitemap.xml: 缺少 ${required}`);
}

for (const gallery of [
  ['images/gallery/xinyi', 9],
  ['images/gallery/wtc', 9]
]) {
  const dir = path.join(ROOT, gallery[0].replace(/\//g, path.sep));
  if (!fs.existsSync(dir)) {
    errors.push(`缺少相簿圖片資料夾 ${gallery[0]}`);
    continue;
  }
  const count = fs.readdirSync(dir).filter(file => /\.(png|jpe?g|webp|avif)$/i.test(file)).length;
  if (count !== gallery[1]) {
    errors.push(`${gallery[0]} 圖片數量應為 ${gallery[1]}，目前為 ${count}`);
  }
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

if (warnings.length) console.warn(warnings.join('\n'));
console.log(`OK：檢查 ${htmlFiles.length} 個 HTML、JSON-LD、圖片/資源/連結/錨點路徑、相簿資料夾與 sitemap。`);

function checkLocalTarget(file, baseDir, rawUrl, label, options = {}) {
  const value = String(rawUrl || '').trim();
  if (!value) return;
  if (/^(https?:|mailto:|tel:|line:|sms:|data:|javascript:|\$\{)/i.test(value)) return;

  const cleanUrl = value.split('#')[0].split('?')[0];
  const hash = value.includes('#') ? value.split('#')[1].split('?')[0] : '';
  if (!cleanUrl && options.allowAnchor) {
    if (hash && !options.anchors.has(decodeURIComponent(hash))) {
      errors.push(`${file}: 找不到頁內錨點 #${hash}`);
    }
    return;
  }
  if (!cleanUrl) return;

  const localPath = cleanUrl.startsWith('/')
    ? path.join(ROOT, cleanUrl.replace(/^\/+/, '').replace(/\//g, path.sep))
    : path.resolve(baseDir, cleanUrl.replace(/\//g, path.sep));

  if (!localPath.startsWith(ROOT)) {
    errors.push(`${file}: ${label} 指向網站資料夾外 ${value}`);
    return;
  }

  if (!fs.existsSync(localPath)) {
    errors.push(`${file}: 找不到${label} ${value}`);
    return;
  }

  if (hash && label === '連結') {
    const targetHtml = fs.existsSync(localPath) && fs.statSync(localPath).isFile()
      ? fs.readFileSync(localPath, 'utf8')
      : '';
    const targetAnchors = collectAnchors(targetHtml);
    if (!targetAnchors.has(decodeURIComponent(hash))) {
      errors.push(`${file}: ${value} 的錨點 #${hash} 不存在`);
    }
  }
}

function collectAnchors(html) {
  const anchors = new Set();
  const idRe = /\sid="([^"]+)"/g;
  const nameRe = /\sname="([^"]+)"/g;
  let match;
  while ((match = idRe.exec(html))) anchors.add(match[1]);
  while ((match = nameRe.exec(html))) anchors.add(match[1]);
  return anchors;
}
