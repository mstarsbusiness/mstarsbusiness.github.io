#!/usr/bin/env node
/*
 * 辰星商務中心：由 data/posts.json 產生貼文頁、Journal 與 sitemap。
 * 維護原則：Journal / posts/*.html 為輸出檔，若要改版型請改這支產生器與 assets/pages.css。
 */
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const SITE = 'https://www.morning-stars.com.tw';
const BRAND = '辰星商務中心 Morning Stars';
const DEFAULT_IMAGE = '/images/og-cover.jpg';

const esc = value => String(value == null ? '' : value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

const paras = value => (Array.isArray(value) ? value : String(value || '').split(/\r?\n+/))
  .map(item => String(item).trim())
  .filter(Boolean);

const plainText = value => paras(value).join(' ').replace(/\s+/g, ' ').trim();

const excerpt = (value, length = 118) => {
  const text = plainText(value);
  return text.length > length ? `${text.slice(0, length)}…` : text;
};

const isoDate = value => {
  const parts = String(value || '').split(/[./-]/).filter(Boolean);
  if (!parts.length) return '';
  return `${parts[0]}-${(parts[1] || '01').padStart(2, '0')}-${(parts[2] || '01').padStart(2, '0')}`;
};

const displayDate = value => String(value || '').replace(/\./g, '.');

const readingMinutes = value => {
  const count = plainText(value).length;
  return Math.max(1, Math.ceil(count / 450));
};

const localImageExists = value => {
  if (!value || /^https?:\/\//i.test(value)) return Boolean(value);
  const clean = String(value).replace(/^\/+/, '').replace(/\//g, path.sep);
  return fs.existsSync(path.join(ROOT, clean));
};

const safeImagePath = value => localImageExists(value) ? value : DEFAULT_IMAGE;

const absoluteImageUrl = value => {
  const safe = safeImagePath(value);
  return /^https?:\/\//i.test(safe) ? safe : SITE + safe;
};

const fonts = `<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&family=Noto+Serif+TC:wght@500;600&family=Noto+Sans+TC:wght@300;400;500;600&display=swap" rel="stylesheet">`;

const header = prefix => `<header class="top">
  <div class="wrap">
    <a class="brand" href="${prefix}index.html" style="display:inline-flex;align-items:center;gap:9px;text-decoration:none"><img src="${prefix}images/img-23a7d345e5.png" alt="辰星商務中心 Logo" style="height:36px;width:36px;object-fit:contain"><span><b>辰星商務中心</b><small>Morning Stars</small></span></a>
    <nav class="topnav" aria-label="主要導覽">
      <a class="lnk" href="${prefix}office-guide.html">方案指南</a>
      <a class="lnk" href="${prefix}virtual-office.html">借址登記</a>
      <a class="lnk" href="${prefix}private-office.html">獨立辦公室</a>
      <a class="lnk" href="${prefix}meeting-room.html">會議室</a>
      <a class="book" href="${prefix}index.html#contact">預約參觀</a>
      <div class="langsw"><button class="lang-btn" aria-label="Language 語言 言語" onclick="toggleLangMenu(event)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3c2.6 2.6 3.9 5.7 3.9 9s-1.3 6.4-3.9 9c-2.6-2.6-3.9-5.7-3.9-9S9.4 5.6 12 3z"/></svg></button><div class="lang-menu" id="langMenu"><a data-l="zh" onclick="setLang('zh')">中文</a><a data-l="en" onclick="setLang('en')">English</a><a data-l="ja" onclick="setLang('ja')">日本語</a></div></div>
    </nav>
  </div>
</header>`;

const footer = prefix => `<footer class="ft">
  <div class="wrap">
    <div class="cols">
      <b>辰星商務中心 Morning Stars</b>
      <div>電話 0903-368-856</div>
      <div>Email mstars.business@gmail.com</div>
      <div>LINE @mstars</div>
    </div>
    <div class="cols">
      <b>服務</b>
      <div><a href="${prefix}office-guide.html">辦公方案選擇指南</a></div>
      <div><a href="${prefix}virtual-office.html">借址登記</a></div>
      <div><a href="${prefix}private-office.html">獨立辦公室</a></div>
      <div><a href="${prefix}meeting-room.html">會議室租借</a></div>
    </div>
  </div>
</footer>`;

const mobileContactBar = prefix => `<div class="mobile-contact-bar" aria-label="快速聯絡">
  <a href="tel:0903368856">電話</a>
  <a class="primary" href="https://line.me/R/ti/p/@mstars" target="_blank" rel="noopener">LINE</a>
  <a href="${prefix}index.html#contact">預約</a>
</div>`;

function postPage(post, allPosts) {
  const text = paras(post.body);
  const description = excerpt(post.body, 155);
  const url = `${SITE}/posts/${post.id}.html`;
  const displayImage = safeImagePath(post.img);
  const image = absoluteImageUrl(post.img);
  const relatedPosts = allPosts.filter(item => item.id !== post.id).slice(0, 3);
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description,
    image,
    datePublished: isoDate(post.date),
    dateModified: isoDate(post.date),
    inLanguage: 'zh-Hant',
    mainEntityOfPage: url,
    author: { '@type': 'Organization', name: BRAND, url: `${SITE}/` },
    publisher: { '@type': 'Organization', name: BRAND, logo: { '@type': 'ImageObject', url: `${SITE}/images/logo-dark.png` } }
  };

  return `<!DOCTYPE html>
<html lang="zh-Hant">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(post.title)}｜辰星商務中心 Journal</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${url}">
<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1">
<meta name="author" content="${BRAND}">
<meta property="og:type" content="article">
<meta property="og:title" content="${esc(post.title)}｜辰星商務中心 Journal">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${esc(image)}">
<meta property="og:site_name" content="${BRAND}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="../favicon.svg">
${fonts}
<link rel="stylesheet" href="../assets/pages.css">
<script type="application/ld+json">${JSON.stringify(schema)}</script>
</head>
<body>
${header('../')}
<main class="journal-shell">
  <div class="wrap">
    <nav class="crumb" aria-label="麵包屑"><a href="../index.html">首頁</a> ／ <a href="../journal.html">最新貼文</a> ／ ${esc(post.title)}</nav>
    <article class="article-layout">
      <aside class="article-aside">
        <a class="back-link" href="../journal.html">← 返回 Journal</a>
        <div class="aside-card">
          <span>Need a space?</span>
          <b>想找信義區辦公空間？</b>
          <p>可從借址登記、獨立辦公室或會議室開始比較。</p>
          <a href="../office-guide.html">看方案指南</a>
        </div>
      </aside>
      <article class="article-card">
        <div class="article-kicker">${esc(post.tag || '最新消息')}</div>
        <h1>${esc(post.title)}</h1>
        <div class="article-meta">
          <span>${esc(displayDate(post.date))}</span>
          <span>${readingMinutes(post.body)} 分鐘閱讀</span>
          <span>辰星商務中心</span>
        </div>
        <p class="article-summary">${esc(description)}</p>
        <div class="post-hero-img"><img src="${esc(displayImage)}" alt="${esc(post.title)}" loading="eager" decoding="async"></div>
        <div class="article-body">${text.map(item => `<p>${esc(item)}</p>`).join('')}</div>
        ${post.link ? `<p class="article-action"><a class="btn solid" href="${esc(post.link)}" target="_blank" rel="noopener">${esc(post.linkText || '查看更多')}</a></p>` : ''}
        <div class="article-cta">
          <span>下一步</span>
          <h2>想把辦公空間也整理好嗎？</h2>
          <p>辰星提供信義區借址登記、獨立辦公室、共享座位與會議室租借，適合個人工作者與 1–6 人小型團隊。</p>
          <div class="related">
            <a href="../office-guide.html">比較辦公方案</a>
            <a href="../virtual-office.html">借址登記</a>
            <a href="../index.html#contact">預約參觀 →</a>
          </div>
        </div>
      </article>
    </article>
    ${relatedPosts.length ? `<section class="more-posts"><div class="section-head"><span>More Stories</span><h2>延伸閱讀</h2></div><div class="post-grid compact">${relatedPosts.map(post => card(post, { prefix: '../' })).join('')}</div></section>` : ''}
  </div>
</main>
${footer('../')}
${mobileContactBar('../')}
<script src="../i18n.js?v=20260825"></script>
</body>
</html>`;
}

function card(post, options = {}) {
  const displayImage = safeImagePath(post.img);
  const href = `${options.prefix || ''}posts/${esc(post.id)}.html`;
  return `<a class="post-card ${options.featured ? 'featured' : ''}" data-tag="${esc(post.tag || '最新消息')}" href="${href}">
    <div class="thumb"><img src="${esc(displayImage)}" alt="${esc(post.title)}" loading="lazy" decoding="async"></div>
    <div class="pb">
      <span class="post-tag">${esc(post.tag || '最新消息')}</span>
      <h3>${esc(post.title)}</h3>
      <p>${esc(excerpt(post.body, options.featured ? 140 : 82))}</p>
      <span class="date">${esc(displayDate(post.date))} ・ ${readingMinutes(post.body)} 分鐘閱讀</span>
    </div>
  </a>`;
}

function journalPage(posts) {
  const [featured, ...rest] = posts;
  const categories = [...new Set(posts.map(post => post.tag).filter(Boolean))];
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: '辰星商務中心 Journal',
    description: '辰星商務中心最新消息、信義區商圈情報、創業與辦公空間知識。',
    url: `${SITE}/journal.html`,
    inLanguage: 'zh-Hant',
    publisher: { '@type': 'Organization', name: BRAND, url: `${SITE}/` }
  };

  return `<!DOCTYPE html>
<html lang="zh-Hant">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>最新貼文 Journal｜辰星商務中心・信義區辦公空間與創業資訊</title>
<meta name="description" content="辰星商務中心 Journal，整理場館動態、信義區商圈情報、借址登記、共享辦公室、會議室租借與創業經營資訊。">
<link rel="canonical" href="${SITE}/journal.html">
<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1">
<meta name="author" content="${BRAND}">
<meta property="og:type" content="website">
<meta property="og:title" content="最新貼文 Journal｜辰星商務中心">
<meta property="og:description" content="場館動態、信義區商圈情報與辦公空間知識。">
<meta property="og:url" content="${SITE}/journal.html">
<meta property="og:image" content="${SITE}/images/og-cover.jpg">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="favicon.svg">
${fonts}
<link rel="stylesheet" href="assets/pages.css">
<script type="application/ld+json">${JSON.stringify(schema)}</script>
</head>
<body>
${header('')}
<section class="journal-hero">
  <div class="wrap">
    <div class="hero-copy">
      <div class="kick">Journal</div>
      <h1>辰星最新貼文與辦公靈感</h1>
      <p class="sub">場館動態、信義區商圈情報，以及借址登記與辦公空間的選擇知識——在辰星，找辦公室這件事可以更清楚、更省心。</p>
      <div class="hero-pills" id="tagPills"><button type="button" class="tag-pill is-on" data-t="__all">全部</button>${categories.map(item => `<button type="button" class="tag-pill" data-t="${esc(item)}">${esc(item)}</button>`).join('')}</div>
    </div>
    <div class="hero-panel">
      <span>Quick Answer</span>
      <p>如果你正在找台北信義區辦公空間，可先閱讀方案指南，再依需求選擇借址登記、獨立辦公室或會議室租借。</p>
      <a href="office-guide.html">查看辦公方案指南 →</a>
    </div>
  </div>
</section>
<main>
  ${featured ? `<section class="featured-post"><div class="wrap"><div class="section-head"><span>Featured</span><h2>精選文章</h2></div>${card(featured, { featured: true })}</div></section>` : ''}
  <section>
    <div class="wrap">
      <div class="section-head"><span>All Posts</span><h2 id="allPostsTitle">所有貼文</h2></div>
      <div class="post-grid" id="postGrid">${rest.map(post => card(post)).join('')}</div>
      <p id="noPost" style="display:none;text-align:center;color:#9a8c66;padding:26px 0">這個分類目前沒有其他文章，換一個分類看看吧 😊</p>
    </div>
  </section>
  <section class="journal-guide">
    <div class="wrap guide-strip">
      <div>
        <span>Choose smarter</span>
        <h2>不知道該選借址、辦公室還是會議室？</h2>
        <p>我們把常見需求整理成一頁比較表，適合讓 Google 與 AI 搜尋直接抓到答案，也適合訪客快速判斷。</p>
      </div>
      <a class="btn solid" href="office-guide.html">看方案指南</a>
    </div>
  </section>
</main>
<style>
.hero-pills .tag-pill{font:inherit;font-size:.86rem;letter-spacing:.04em;color:#C9A24B;background:transparent;border:1px solid rgba(201,162,75,.42);border-radius:999px;padding:7px 16px;cursor:pointer;transition:.18s}
.hero-pills .tag-pill:hover{background:rgba(201,162,75,.14)}
.hero-pills .tag-pill.is-on{background:#C9A24B;color:#241B10;border-color:#C9A24B;font-weight:600}
</style>
<script>
(function(){
  var pills=document.getElementById('tagPills'), grid=document.getElementById('postGrid'),
      none=document.getElementById('noPost'), ttl=document.getElementById('allPostsTitle'),
      feat=document.querySelector('.featured-post');
  if(!pills||!grid) return;
  function apply(t){
    var cards=grid.querySelectorAll('.post-card'), n=0;
    cards.forEach(function(c){
      var ok=(t==='__all')||(c.getAttribute('data-tag')===t);
      c.style.display=ok?'':'none'; if(ok)n++;
    });
    if(ttl) ttl.textContent=(t==='__all')?'所有貼文':t;
    if(none) none.style.display=n?'none':'block';
    if(feat) feat.style.display=(t==='__all')?'':'none';
    pills.querySelectorAll('.tag-pill').forEach(function(b){ b.classList.toggle('is-on', b.getAttribute('data-t')===t); });
    try{ history.replaceState(null,'',(t==='__all')?location.pathname:(location.pathname+'?tag='+encodeURIComponent(t))); }catch(e){}
  }
  pills.addEventListener('click',function(e){
    var b=e.target.closest('.tag-pill'); if(!b) return;
    apply(b.getAttribute('data-t'));
    var head=document.querySelector('#allPostsTitle'); if(head) head.scrollIntoView({behavior:'smooth',block:'start'});
  });
  var q=new URLSearchParams(location.search).get('tag');
  if(q) apply(q);
})();
</script>
${footer('')}
${mobileContactBar('')}
<script src="i18n.js?v=20260825"></script>
</body>
</html>`;
}

function sitemap(posts) {
  const today = new Date().toISOString().slice(0, 10);
  const pages = [
    ['/', '1.0', 'weekly'],
    ['/virtual-office.html', '.9', 'monthly'],
    ['/private-office.html', '.9', 'monthly'],
    ['/meeting-room.html', '.9', 'monthly'],
    ['/office-guide.html', '.9', 'monthly'],
    ['/registration-check.html', '.8', 'monthly'],
    ['/meeting-room-price.html', '.8', 'monthly'],   // AI 事實頁（2026-08-22 新增）
    ['/mail-handling.html', '.8', 'monthly'],        // AI 事實頁（2026-08-22 新增）
    ['/en/index.html', '.9', 'monthly'],             // 英文首頁（2026-08-22 新增）
    ['/en/virtual-office.html', '.8', 'monthly'],   // 英文版（2026-08-07 新增，供英文搜尋流量）
    ['/en/meeting-room.html', '.8', 'monthly'],
    ['/journal.html', '.7', 'weekly'],
    ['/crm.html', '.6', 'monthly'],
    /* ['/video.html', '.7', 'monthly'],  ← 2026-08-25 移除：影片導覽頁做好了但老闆決定不上線，
       檔案從未上傳 → sitemap 指到不存在的網址，Google Search Console 連發兩封
       「找不到網頁 (404)」通知（一封整站、一封 Sitemap 專屬）。
       日後若決定要上線，先把 video.html 傳上去，再把這一行取消註解。*/
    [`/${encodeURIComponent('辰星場館相簿-信義館.html')}`, '.7', 'monthly'],
    [`/${encodeURIComponent('辰星場館相簿-世貿館.html')}`, '.7', 'monthly'],
    ['/privacy-policy.html', '.3', 'yearly'],
    ['/terms.html', '.3', 'yearly']
  ];
  const urls = pages.map(([url, priority, frequency]) => `<url><loc>${SITE}${url}</loc><lastmod>${today}</lastmod><changefreq>${frequency}</changefreq><priority>${priority}</priority></url>`);
  posts.forEach(post => {
    urls.push(`<url><loc>${SITE}/posts/${esc(post.id)}.html</loc><lastmod>${isoDate(post.date) || today}</lastmod><changefreq>monthly</changefreq><priority>.6</priority></url>`);
  });
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join('')}</urlset>`;
}

const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'posts.json'), 'utf8'));
const posts = (Array.isArray(data) ? data : data.posts || []).filter(post => post && post.id);
const output = path.join(ROOT, 'posts');

fs.mkdirSync(output, { recursive: true });
posts.forEach(post => fs.writeFileSync(path.join(output, `${post.id}.html`), postPage(post, posts)));
fs.writeFileSync(path.join(ROOT, 'journal.html'), journalPage(posts));
fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), sitemap(posts));
