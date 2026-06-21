#!/usr/bin/env node
/*
 * 辰星商務中心 — 貼文靜態頁 / Journal 列表 / sitemap 產生器
 * ---------------------------------------------------------------
 * 用途：讀取 data/posts.json，產生可被搜尋引擎索引的靜態頁面：
 *   - journal.html            （貼文總覽列表）
 *   - posts/<id>.html         （每篇貼文獨立頁）
 *   - sitemap.xml             （含首頁、服務頁、journal、各貼文）
 *
 * 使用方式（在本資料夾執行）：
 *   node build-journal.js
 *
 * 之後若用 CMS 後台（/admin）新增或修改貼文（會更新 data/posts.json），
 * 只要再跑一次  node build-journal.js  重新產生即可，再上傳 GitHub。
 */
const fs = require('fs');
const path = require('path');

const SITE = 'https://www.morning-stars.com.tw';
const ROOT = __dirname;
const FONTS = '<link rel="preconnect" href="https://fonts.googleapis.com">\n<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&family=Noto+Serif+TC:wght@500;600&family=Noto+Sans+TC:wght@300;400;500&display=swap" rel="stylesheet">';

// 靜態頁清單（給 sitemap 用）
const STATIC_PAGES = [
  { loc: SITE + '/',                     changefreq: 'weekly',  priority: '1.0' },
  { loc: SITE + '/virtual-office.html',  changefreq: 'monthly', priority: '0.9' },
  { loc: SITE + '/private-office.html',  changefreq: 'monthly', priority: '0.9' },
  { loc: SITE + '/meeting-room.html',    changefreq: 'monthly', priority: '0.9' },
  { loc: SITE + '/journal.html',         changefreq: 'weekly',  priority: '0.7' },
  { loc: SITE + '/privacy-policy.html',  changefreq: 'yearly',  priority: '0.3' }
];

function esc(s){ return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function bodyToParas(body){
  if (Array.isArray(body)) return body.map(t => String(t).trim()).filter(Boolean);
  return String(body || '').split(/\r?\n+/).map(t => t.trim()).filter(Boolean);
}
// "2026.06" -> "2026-06-01"；"2026.06.18" -> "2026-06-18"
function isoDate(d){
  const parts = String(d || '').split(/[.\/-]/).map(x => x.trim()).filter(Boolean);
  if (!parts.length) return '';
  const y = parts[0];
  const m = (parts[1] || '01').padStart(2, '0');
  const day = (parts[2] || '01').padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function header(prefix){
  return `<header class="top"><div class="wrap">
  <a class="brand" href="${prefix}index.html"><b>辰星商務中心</b><small>Morning Stars</small></a>
  <nav class="topnav">
    <a class="lnk" href="${prefix}index.html#services">服務</a>
    <a class="lnk" href="${prefix}virtual-office.html">借址登記</a>
    <a class="lnk" href="${prefix}meeting-room.html">會議室</a>
    <a class="lnk" href="${prefix}journal.html">最新貼文</a>
    <a class="book" href="${prefix}index.html#contact">預約參觀</a>
  </nav>
</div></header>`;
}
function footer(prefix){
  return `<footer class="ft"><div class="wrap">
  <div class="cols"><b>辰星商務中心 Morning Stars</b>
    <div style="margin-top:10px">電話 0903-368-856</div>
    <div>Email mstars.business@gmail.com</div>
    <div>LINE @mstars</div></div>
  <div class="cols"><b>據點</b>
    <div style="margin-top:10px">信義館｜基隆路二段 145 號 10 樓</div>
    <div>世貿館｜基隆路一段 398 號 4 樓</div>
    <div>平日 10:00–17:00</div></div>
  <div class="cols"><b>服務</b>
    <div style="margin-top:10px"><a href="${prefix}virtual-office.html">借址登記・虛擬辦公室</a></div>
    <div><a href="${prefix}meeting-room.html">會議室租借</a></div>
    <div><a href="${prefix}private-office.html">獨立辦公室</a></div>
    <div><a href="${prefix}journal.html">最新貼文</a></div></div>
</div>
<div class="wrap" style="margin-top:24px;font-size:.78rem;color:#6E6250">© 2026 辰星商務中心 Morning Stars Ltd. All rights reserved.</div></footer>`;
}

function postPage(p){
  const paras = bodyToParas(p.body);
  const desc = paras.join(' ').slice(0, 150);
  const url = `${SITE}/posts/${p.id}.html`;
  const img = p.img ? (p.img.startsWith('http') ? p.img : SITE + p.img) : `${SITE}/images/og-cover.jpg`;
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: p.title,
    image: img,
    datePublished: isoDate(p.date),
    dateModified: isoDate(p.date),
    author: { '@type': 'Organization', name: '辰星商務中心 Morning Stars' },
    publisher: {
      '@type': 'Organization',
      name: '辰星商務中心 Morning Stars',
      logo: { '@type': 'ImageObject', url: `${SITE}/images/logo-dark.png` }
    },
    mainEntityOfPage: url,
    articleSection: p.tag || '最新消息',
    description: desc
  };
  const bodyHtml = paras.map(t => `<p>${esc(t)}</p>`).join('\n      ');
  const linkHtml = p.link ? `\n      <p><a class="btn solid" href="${esc(p.link)}" target="_blank" rel="noopener">${esc(p.linkText || '查看更多 →')}</a></p>` : '';
  const imgHtml = p.img ? `<div class="post-hero-img"><img src="${esc(p.img)}" alt="${esc(p.title)}"></div>` : '';
  return `<!DOCTYPE html>
<html lang="zh-Hant">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(p.title)}｜辰星商務中心 最新貼文</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${url}">
<meta name="robots" content="index,follow">
<meta property="og:type" content="article">
<meta property="og:title" content="${esc(p.title)}｜辰星商務中心">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${esc(img)}">
<meta property="og:site_name" content="辰星商務中心 Morning Stars">
<meta property="og:locale" content="zh_TW">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" type="image/svg+xml" href="../favicon.svg">
${FONTS}
<link rel="stylesheet" href="../assets/pages.css">
<script type="application/ld+json">
${JSON.stringify(ld, null, 2)}
</script>
</head>
<body>
${header('../')}
<div class="wrap"><div class="crumb"><a href="../index.html">首頁</a> ／ <a href="../journal.html">最新貼文</a> ／ ${esc(p.title)}</div></div>
<main>
  <article class="wrap" style="padding:30px 24px 50px">
    <span class="post-tag">${esc(p.tag || '最新消息')}</span>
    <h1 style="font-family:'Noto Serif TC',serif;font-weight:600;font-size:clamp(1.6rem,4vw,2.4rem);line-height:1.4;color:#3A2E22;margin-bottom:8px">${esc(p.title)}</h1>
    <div class="post-meta">${esc(p.date)}</div>
    ${imgHtml}
    <div style="margin-top:18px">
      ${bodyHtml}${linkHtml}
    </div>
    <div class="related" style="margin-top:36px">
      <a href="../journal.html">← 返回貼文列表</a>
      <a href="../index.html#contact">預約參觀 →</a>
    </div>
  </article>
</main>
${footer('../')}
</body>
</html>
`;
}

function journalIndex(posts){
  const cards = posts.map(p => {
    const thumb = p.img
      ? `<div class="thumb"><img src="${esc(p.img)}" alt="${esc(p.title)}" loading="lazy"></div>`
      : '';
    return `    <a class="post-card" href="posts/${esc(p.id)}.html">
      ${thumb}
      <div class="pb"><span class="post-tag">${esc(p.tag || '最新消息')}</span><h3>${esc(p.title)}</h3><span class="date">${esc(p.date)}</span></div>
    </a>`;
  }).join('\n');
  return `<!DOCTYPE html>
<html lang="zh-Hant">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>最新貼文 Journal｜辰星商務中心 台北信義共享辦公空間</title>
<meta name="description" content="辰星商務中心最新消息、場館動態與講座活動。台北信義區共享辦公空間、借址登記、會議室租借與獨立辦公室的第一手資訊。">
<link rel="canonical" href="${SITE}/journal.html">
<meta name="robots" content="index,follow">
<meta property="og:type" content="website">
<meta property="og:title" content="最新貼文 Journal｜辰星商務中心">
<meta property="og:description" content="辰星商務中心最新消息、場館動態與講座活動。">
<meta property="og:url" content="${SITE}/journal.html">
<meta property="og:image" content="${SITE}/images/og-cover.jpg">
<meta property="og:site_name" content="辰星商務中心 Morning Stars">
<meta property="og:locale" content="zh_TW">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" type="image/svg+xml" href="favicon.svg">
${FONTS}
<link rel="stylesheet" href="assets/pages.css">
</head>
<body>
${header('')}
<section class="hero2"><div class="wrap">
  <div class="kick">Journal</div>
  <h1>最新貼文</h1>
  <p class="sub">場館動態、最新消息與講座活動——辰星商務中心的第一手資訊。</p>
</div></section>
<div class="wrap"><div class="crumb"><a href="index.html">首頁</a> ／ 最新貼文</div></div>
<main><section><div class="wrap">
  <div class="post-grid">
${cards}
  </div>
</div></section></main>
${footer('')}
</body>
</html>
`;
}

function sitemap(posts){
  const today = new Date().toISOString().slice(0, 10);
  const urls = STATIC_PAGES.map(pg =>
    `  <url>\n    <loc>${pg.loc}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${pg.changefreq}</changefreq>\n    <priority>${pg.priority}</priority>\n  </url>`
  );
  posts.forEach(p => {
    urls.push(`  <url>\n    <loc>${SITE}/posts/${p.id}.html</loc>\n    <lastmod>${isoDate(p.date) || today}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.6</priority>\n  </url>`);
  });
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;
}

// ---- run ----
const raw = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'posts.json'), 'utf8'));
const posts = (raw && raw.posts ? raw.posts : (Array.isArray(raw) ? raw : []))
  .filter(p => p && p.id);

const postsDir = path.join(ROOT, 'posts');
fs.mkdirSync(postsDir, { recursive: true });
posts.forEach(p => {
  fs.writeFileSync(path.join(postsDir, `${p.id}.html`), postPage(p));
  console.log('  ✓ posts/' + p.id + '.html');
});
fs.writeFileSync(path.join(ROOT, 'journal.html'), journalIndex(posts));
console.log('  ✓ journal.html');
fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), sitemap(posts));
console.log('  ✓ sitemap.xml');
console.log(`完成：共產生 ${posts.length} 篇貼文頁。`);
