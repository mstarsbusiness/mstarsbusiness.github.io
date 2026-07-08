#!/usr/bin/env node
/*
 * 辰星官網本機驗證工具
 * 用法：在「上傳到GitHub」資料夾執行 node validate-site.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const errors = [];

const htmlFiles = [
  ...fs.readdirSync(ROOT).filter(file => file.endsWith('.html')),
  ...fs.readdirSync(path.join(ROOT, 'posts')).filter(file => file.endsWith('.html')).map(file => `posts/${file}`)
];

for (const file of htmlFiles) {
  const absoluteFile = path.join(ROOT, file);
  const html = fs.readFileSync(absoluteFile, 'utf8');
  const baseDir = path.dirname(absoluteFile);

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
    const src = imageMatch[1];
    if (/^(https?:|data:|\$\{)/.test(src)) continue;
    const localPath = src.startsWith('/')
      ? path.join(ROOT, src.replace(/^\/+/, '').replace(/\//g, path.sep))
      : path.resolve(baseDir, src.replace(/\//g, path.sep));
    if (!localPath.startsWith(ROOT) || !fs.existsSync(localPath)) {
      errors.push(`${file}: 找不到圖片 ${src}`);
    }
  }
}

const sitemap = fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8');
for (const required of ['office-guide.html', 'journal.html', '/posts/', 'privacy-policy.html', 'terms.html']) {
  if (!sitemap.includes(required)) errors.push(`sitemap.xml: 缺少 ${required}`);
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log(`OK：檢查 ${htmlFiles.length} 個 HTML、JSON-LD、圖片路徑與 sitemap。`);
