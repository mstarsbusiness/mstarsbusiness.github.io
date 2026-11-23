/* 辰星商務中心 — 多語系「開機程式」（2026-11-23）
   為什麼：i18n.js（中英日字典＋翻譯引擎）約 387KB（壓縮後約 136KB），原本每一頁、每一位訪客都會下載。
   但絕大多數訪客看中文，中文頁根本不需要那份字典。
   做法：頁面改載這支小檔；只有在「訪客選過英文／日文」或「按了語言選單」時，才去載入完整的 i18n.js。
   用法（取代原本的 <script src="i18n.js?v=…">）：
     <script src="i18n-boot.js?v=YYYYMMDDNN" data-full="i18n.js?v=YYYYMMDDNN"></script>
     posts/ 子目錄：src="../i18n-boot.js?v=…" data-full="../i18n.js?v=…"
   ⚠️ 改 i18n.js（字典）時，data-full 的 ?v= 一樣要 bump（工具_多語覆蓋率檢查.js 會檢查）。
   ⚠️ 語言選單的樣式、EN_PAGES 與 i18n.js 各有一份，改一邊要改另一邊（i18n.js 載入後以它為準）。 */
(function(){
  var me = document.currentScript;
  var FULL = (me && me.getAttribute('data-full')) || 'i18n.js';

  /* ---- 語言選單樣式（地球鈕＋下拉＋主視覺多語換行）：與 i18n.js 同一份、同一個 id，i18n.js 看到已存在就不再注入 ---- */
  if (!document.getElementById('ms-i18n-css')) {
    var CSS = ''
      + '.langsw{position:relative;display:inline-flex;align-items:center;flex-shrink:0}'
      + '.lang-btn{display:flex;align-items:center;justify-content:center;width:34px;height:34px;border:0;background:none;color:#C8A24A;cursor:pointer;opacity:.9;transition:.2s;padding:0}'
      + '.lang-btn:hover{opacity:1;color:#E0BE72}'
      + '.lang-btn svg{width:21px;height:21px}'
      + '.lang-menu{position:absolute;right:0;top:calc(100% + 10px);min-width:132px;background:var(--navbg,#1A1712);border:1px solid rgba(183,154,106,.3);border-radius:10px;padding:6px;flex-direction:column;gap:2px;display:none;box-shadow:0 12px 30px rgba(0,0,0,.32);z-index:140}'
      + '.lang-menu.open{display:flex}'
      + '.lang-menu a{cursor:pointer;font-size:.82rem;letter-spacing:.04em;padding:9px 14px;border-radius:7px;color:#D8D2C4;text-decoration:none;white-space:nowrap;transition:.2s}'
      + '.lang-menu a:hover{background:rgba(255,255,255,.08);color:#fff}'
      + '.lang-menu a.cur{color:#D4AE72;background:rgba(169,128,63,.18)}'
      + 'html[lang="en"] .hero h1 span,html[lang="ja"] .hero h1 span{white-space:normal!important}'
      + 'html[lang="en"] .hero h1,html[lang="ja"] .hero h1{font-size:clamp(2rem,5.2vw,4.2rem)!important;letter-spacing:.02em!important}'
      + '.nav>.menu{margin-left:auto}'
      + '.nav>.langsw{margin-left:14px}';
    var st = document.createElement('style'); st.id = 'ms-i18n-css'; st.textContent = CSS;
    (document.head || document.documentElement).appendChild(st);
  }

  /* 有獨立英文頁的頁面，選 English 直接前往該頁（同 i18n.js 的 EN_PAGES） */
  var EN_PAGES = {'':'/en/index.html','index.html':'/en/index.html','light.html':'/en/index.html','dark.html':'/en/index.html','meeting-room.html':'/en/meeting-room.html','virtual-office.html':'/en/virtual-office.html'};
  function enPageForHere(){ var f=(location.pathname.split('/').pop()||'').toLowerCase(); return EN_PAGES[f]||null; }
  function stored(){ try{ return localStorage.getItem('ms_lang')||'zh'; }catch(e){ return 'zh'; } }
  function store(l){ try{ localStorage.setItem('ms_lang', l); }catch(e){} }
  function closeMenu(){ var m=document.getElementById('langMenu'); if(m) m.classList.remove('open'); }
  function markZh(){
    var a=document.querySelectorAll('.langsw a');
    for (var j=0;j<a.length;j++) a[j].className=(a[j].getAttribute('data-l')==='zh'?'cur':'');
  }

  var loading = false;
  function loadFull(){
    if (loading) return; loading = true;
    var s = document.createElement('script'); s.src = FULL; s.async = true;
    s.onerror = function(){ loading = false; };
    (document.body || document.documentElement).appendChild(s);
  }

  /* i18n.js 載入後會用自己的 setLang／toggleLangMenu 覆蓋這裡的版本 */
  window.setLang = function(l){
    if (l === 'en') { var u=enPageForHere(); if (u) { store('en'); location.href=u; return; } }
    if (l === 'zh') { store('zh'); markZh(); closeMenu(); return; }   // 還在中文、字典沒載過＝什麼都不用換
    store(l); closeMenu(); loadFull();                                    // 英／日：載入完整字典，它開機時會讀到剛存的語言並翻譯
  };
  window.toggleLangMenu = function(e){ if(e) e.stopPropagation(); var m=document.getElementById('langMenu'); if(m) m.classList.toggle('open'); };
  window.msI18nRefresh = window.msI18nRefresh || function(){};   // 中文訪客不需要重新翻譯
  document.addEventListener('click', function(e){ var m=document.getElementById('langMenu'); if(m && e.target.closest && !e.target.closest('.langsw')) m.classList.remove('open'); });

  function init(){
    var s = stored();
    if (s === 'en') { var u=enPageForHere(); if (u && location.pathname.indexOf('/en/')<0) { location.replace(u); return; } }
    if (s !== 'zh') { loadFull(); return; }   // 回訪的英／日訪客：載入完整字典
    markZh();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
