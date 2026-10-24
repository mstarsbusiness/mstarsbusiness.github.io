/* 辰星官網 文字對比保護（2026-10-24）
 * 起因：多份樣式表（pages.css／subpage-polish.css／各頁內嵌）疊加後，部分區塊出現「淺字配淺底」「深字配深底」，
 *       客人看不到說明（老闆 10/24 回報相簿圖說、CTA 框、其他服務連結等）。
 * 作法：頁面載入後掃描所有含文字的元素，算出「文字色 vs 實際背景色」對比；低於 3:1 就改用深色或淺色字（取對比較高者）。
 *       背景是照片／影片（CSS 背景圖或後面疊了 <img>/<video>）的不動，避免誤判。
 * 只改 color，不動版面、文案、SEO。新增頁面只要載入本檔就自動受保護。 */
(function () {
  var DARK = { r: 43, g: 33, b: 23 }, GOLD_D = { r: 122, g: 90, b: 34 }, LIGHT = { r: 247, g: 242, b: 232 }, MIN = 3;
  function parse(c) { var m = String(c || '').match(/rgba?\(([^)]+)\)/); if (!m) return null; var p = m[1].split(',').map(parseFloat); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; }
  function lum(c) { function f(v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); } return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); }
  function blend(t, b) { return { r: t.r * t.a + b.r * (1 - t.a), g: t.g * t.a + b.g * (1 - t.a), b: t.b * t.a + b.b * (1 - t.a), a: 1 }; }
  function ratio(a, b) { var A = lum(a), B = lum(b); return (Math.max(A, B) + 0.05) / (Math.min(A, B) + 0.05); }
  function bgOf(el) {
    var stack = [];
    while (el && el.nodeType === 1) {
      var cs = getComputedStyle(el);
      if (cs.backgroundImage && cs.backgroundImage !== 'none') {
        if (!/gradient/.test(cs.backgroundImage)) return null;               // 照片背景：不判斷
        var cols = (cs.backgroundImage.match(/rgba?\([^)]+\)/g) || []).map(parse).filter(function (c) { return c && c.a > 0.5; });
        if (cols.length) { stack.push(cols[cols.length - 1]); if (cols[cols.length - 1].a >= 0.95) break; }
      }
      var b = parse(cs.backgroundColor);
      if (b && b.a > 0) { stack.push(b); if (b.a >= 0.95) break; }
      el = el.parentElement;
    }
    var base = { r: 255, g: 255, b: 255, a: 1 };
    for (var i = stack.length - 1; i >= 0; i--) base = blend(stack[i], base);
    return base;
  }
  /* 文字底下是否疊著照片／影片：往上找 5 層祖先，看有沒有與文字範圍重疊的 img/video/picture/canvas（不受捲動位置影響） */
  function overMedia(el) {
    var r = el.getBoundingClientRect(); if (!r.width || !r.height) return false;
    var p = el.parentElement;
    for (var d = 0; d < 5 && p; d++, p = p.parentElement) {
      var ms = p.querySelectorAll('img,video,picture,canvas,iframe');
      for (var i = 0; i < ms.length; i++) {
        if (ms[i].contains(el)) continue;
        var m = ms[i].getBoundingClientRect();
        if (m.width > 40 && m.height > 40 && m.left < r.right && m.right > r.left && m.top < r.bottom && m.bottom > r.top) return true;
      }
    }
    return false;
  }
  function run() {
    var els = document.body ? document.body.querySelectorAll('*') : [];
    for (var i = 0; i < els.length; i++) {
      var el = els[i], tag = el.tagName;
      if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT' || tag === 'OPTION' || el.closest('svg')) continue;
      if (el.getAttribute('data-cg') === '1') continue;
      var has = false;
      for (var k = 0; k < el.childNodes.length; k++) { var n = el.childNodes[k]; if (n.nodeType === 3 && n.textContent.trim()) { has = true; break; } }
      if (!has) continue;
      var cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden') continue;
      var fg = parse(cs.color); if (!fg) continue;
      var bg = bgOf(el); if (!bg) continue;
      if (ratio(blend(fg, bg), bg) >= MIN) continue;
      if (overMedia(el)) continue;
      var useDark = ratio(DARK, bg) >= ratio(LIGHT, bg);
      /* 原本是金色系的字（標籤、按鈕）在淺底上改深金，保留品牌感；其他改深棕／米白 */
      var gold = (Math.max(fg.r, fg.g, fg.b) - Math.min(fg.r, fg.g, fg.b) > 60) && fg.r > fg.b;
      var to = useDark ? (gold && ratio(GOLD_D, bg) >= 4.5 ? 'rgb(122,90,34)' : 'rgb(43,33,23)') : 'rgb(247,242,232)';
      el.style.setProperty('color', to, 'important');
      el.setAttribute('data-cg', '1');
    }
  }
  function go() { try { run(); } catch (e) { /* 保護機制失敗不影響頁面 */ } }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { go(); setTimeout(go, 1500); });
  else { go(); setTimeout(go, 1500); }
  window.addEventListener('load', function () { setTimeout(go, 300); });
})();
