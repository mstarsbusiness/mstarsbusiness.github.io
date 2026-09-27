/* =============================================================
 * 辰星官網 GA4 事件追蹤（2026-09-27 依〈SEO＋GEO 工程說明書〉§九）
 * 背景：官網原本只有首頁三版型＋404＋privacy-policy 裝了 GA4 基本碼，
 *       服務頁與貼文完全沒裝，也沒有任何事件——GA4 後台無轉換可標。
 * 這支做兩件事：
 *   ① 頁面沒有 gtag 時自動載入 GA4（G-4PKTJLRH2N）；已有就沿用，不重複計數。
 *   ② 全站攔點擊：撥打電話（tel:）／加 LINE（line.me）／FB 私訊（m.me）／
 *      Google 地圖，送出對應事件；另提供 window.msTrack() 給表單與預約用。
 * 事件名（GA4 後台「關鍵事件」用這些名字標）：
 *   phone_click / line_click / messenger_click / map_click /
 *   form_submit（首頁諮詢表單）/ booking_submit（會議室預約）
 * ⚠️ 純追蹤、零視覺變動；掛載方式＝各頁 </body> 前一行 <script defer>。
 *    新增客戶頁時記得一起掛（貼文頁由 build-journal.js 樣板自動帶）。
 * ============================================================= */
(function () {
  'use strict';
  var GA_ID = 'G-4PKTJLRH2N';
  // ① GA4：頁面已有 gtag（首頁三版型等）就沿用；沒有才自行載入
  window.dataLayer = window.dataLayer || [];
  if (typeof window.gtag !== 'function') {
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', GA_ID);
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    (document.head || document.documentElement).appendChild(s);
  }
  // 事件送出（try/catch：追蹤失敗絕不影響頁面功能）
  function track(name, params) {
    try { window.gtag('event', name, params || {}); } catch (e) {}
  }
  window.msTrack = track;
  // ② 全站點擊事件（capture 階段＝target=_blank 的外連也攔得到）
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a') : null;
    if (!a || !a.href) return;
    var h = String(a.href);
    var name = '';
    if (h.indexOf('tel:') === 0) name = 'phone_click';
    else if (/(?:^|\/\/)(?:line\.me|lin\.ee|liff\.line\.me)\//i.test(h)) name = 'line_click';
    else if (/(?:^|\/\/)(?:m\.me|www\.messenger\.com)\//i.test(h)) name = 'messenger_click';
    else if (/maps\.app\.goo\.gl|goo\.gl\/maps|google\.[a-z.]+\/maps/i.test(h)) name = 'map_click';
    if (!name) return;
    track(name, {
      link_url: h.slice(0, 100),
      link_text: (a.textContent || '').trim().slice(0, 80),
      page_path: location.pathname,
    });
  }, true);
})();
