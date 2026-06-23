/* =============================================================
 * 辰星商務中心 · 官網 AI 線上客服浮動視窗
 * 用法：在每頁結尾（body 收尾前）以外部載入方式引入 chat-widget.js 即可。
 * 後端：morning-stars-right.netlify.app/.netlify/functions/web-chat（伺服器端持金鑰）
 * ============================================================= */
(function () {
  if (window.__msChatLoaded) return; window.__msChatLoaded = true;
  var ENDPOINT = 'https://morning-stars-right.netlify.app/.netlify/functions/web-chat';
  var GOLD = '#b08642';
  var GREET = '您好！我是辰星商務中心線上客服 😊 想了解公司設址登記、辦公室，或會議室預約嗎？';
  var CHIPS = ['公司設址怎麼收費？', '會議室如何預約？', '我想預約參觀'];
  var STORE = 'ms_chat_v1';

  // ---- 對話記錄（跨頁延續，存 localStorage）----
  var history = [];
  try { history = JSON.parse(localStorage.getItem(STORE) || '[]') || []; } catch (e) { history = []; }
  function save() { try { localStorage.setItem(STORE, JSON.stringify(history.slice(-30))); } catch (e) {} }

  // ---- 樣式 ----
  var css = '\
  .msc-bubble{position:fixed;right:20px;bottom:20px;width:60px;height:60px;border-radius:50%;background:' + GOLD + ';color:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 6px 20px rgba(0,0,0,.28);z-index:2147483600;transition:transform .15s;font-size:26px;}\
  .msc-bubble:hover{transform:scale(1.06);}\
  .msc-bubble .dot{position:absolute;top:6px;right:8px;width:10px;height:10px;background:#e74c3c;border-radius:50%;border:2px solid #fff;}\
  .msc-panel{position:fixed;right:20px;bottom:20px;width:370px;max-width:calc(100vw - 32px);height:560px;max-height:calc(100vh - 90px);background:#fff;border-radius:16px;box-shadow:0 12px 40px rgba(0,0,0,.28);z-index:2147483601;display:none;flex-direction:column;overflow:hidden;font-family:"Microsoft JhengHei","PingFang TC",sans-serif;}\
  .msc-panel.open{display:flex;}\
  .msc-head{background:' + GOLD + ';color:#fff;padding:13px 16px;display:flex;align-items:center;gap:10px;}\
  .msc-head .t{font-weight:700;font-size:15px;line-height:1.3;flex:1;}\
  .msc-head .t small{display:block;font-weight:400;font-size:11px;opacity:.85;}\
  .msc-head .x{cursor:pointer;font-size:20px;opacity:.9;width:28px;height:28px;display:flex;align-items:center;justify-content:center;border-radius:8px;}\
  .msc-head .x:hover{background:rgba(255,255,255,.18);}\
  .msc-body{flex:1;overflow-y:auto;padding:14px;background:#f6f3ec;}\
  .msc-row{display:flex;margin-bottom:10px;}\
  .msc-row.u{justify-content:flex-end;}\
  .msc-msg{max-width:80%;padding:9px 12px;border-radius:14px;font-size:14px;line-height:1.55;white-space:pre-wrap;word-break:break-word;}\
  .msc-row.b .msc-msg{background:#fff;color:#222;border:1px solid #ece7dc;border-bottom-left-radius:4px;}\
  .msc-row.u .msc-msg{background:' + GOLD + ';color:#fff;border-bottom-right-radius:4px;}\
  .msc-msg a{color:inherit;text-decoration:underline;}\
  .msc-row.b .msc-msg a{color:' + GOLD + ';}\
  .msc-chips{display:flex;flex-wrap:wrap;gap:7px;padding:0 14px 10px;background:#f6f3ec;}\
  .msc-chip{border:1px solid ' + GOLD + ';color:' + GOLD + ';background:#fff;border-radius:16px;padding:6px 12px;font-size:12.5px;cursor:pointer;}\
  .msc-chip:hover{background:#faf6ee;}\
  .msc-foot{display:flex;gap:8px;padding:10px;border-top:1px solid #eee;background:#fff;}\
  .msc-foot input{flex:1;border:1px solid #d9d4c8;border-radius:10px;padding:11px 12px;font-size:14px;font-family:inherit;outline:none;}\
  .msc-foot input:focus{border-color:' + GOLD + ';}\
  .msc-foot button{border:0;background:' + GOLD + ';color:#fff;border-radius:10px;padding:0 16px;font-size:15px;font-weight:700;cursor:pointer;}\
  .msc-foot button:disabled{opacity:.5;}\
  .msc-typing{display:flex;gap:4px;padding:11px 13px;}\
  .msc-typing span{width:7px;height:7px;background:#c5bca8;border-radius:50%;animation:mscb 1s infinite;}\
  .msc-typing span:nth-child(2){animation-delay:.2s;}.msc-typing span:nth-child(3){animation-delay:.4s;}\
  @keyframes mscb{0%,60%,100%{opacity:.3;}30%{opacity:1;}}\
  .msc-note{font-size:10.5px;color:#aaa;text-align:center;padding:4px 0 8px;background:#fff;}\
  @media(max-width:480px){.msc-panel{right:8px;bottom:8px;height:calc(100vh - 80px);}.msc-bubble{right:14px;bottom:14px;}}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  // ---- DOM ----
  var bubble = document.createElement('div');
  bubble.className = 'msc-bubble'; bubble.setAttribute('aria-label', '線上客服');
  bubble.innerHTML = '<span>💬</span><span class="dot"></span>';
  var panel = document.createElement('div');
  panel.className = 'msc-panel';
  panel.innerHTML =
    '<div class="msc-head"><div class="t">辰星商務中心 線上客服<small>一般約幾秒回覆 · AI 即時為您服務</small></div><div class="x" role="button" aria-label="關閉">×</div></div>' +
    '<div class="msc-body" id="mscBody"></div>' +
    '<div class="msc-chips" id="mscChips"></div>' +
    '<div class="msc-foot"><input id="mscInput" type="text" placeholder="輸入訊息…" autocomplete="off"><button id="mscSend">送出</button></div>' +
    '<div class="msc-note">由 AI 提供即時回覆，細節將由專人為您確認</div>';
  document.body.appendChild(bubble); document.body.appendChild(panel);

  var body = panel.querySelector('#mscBody');
  var input = panel.querySelector('#mscInput');
  var sendBtn = panel.querySelector('#mscSend');
  var chipsBox = panel.querySelector('#mscChips');

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]; }); }
  function linkify(s) { return esc(s).replace(/(https?:\/\/[^\s）)]+)/g, function (u) { return '<a href="' + u + '" target="_blank" rel="noopener">' + u + '</a>'; }); }
  function addRow(role, text) {
    var row = document.createElement('div'); row.className = 'msc-row ' + (role === 'user' ? 'u' : 'b');
    row.innerHTML = '<div class="msc-msg">' + linkify(text) + '</div>';
    body.appendChild(row); body.scrollTop = body.scrollHeight; return row;
  }
  function showChips() {
    chipsBox.innerHTML = '';
    if (history.length > 1) { chipsBox.style.display = 'none'; return; }
    chipsBox.style.display = 'flex';
    CHIPS.forEach(function (c) { var b = document.createElement('div'); b.className = 'msc-chip'; b.textContent = c; b.onclick = function () { send(c); }; chipsBox.appendChild(b); });
  }
  function renderHistory() {
    body.innerHTML = '';
    if (!history.length) addRow('assistant', GREET);
    else history.forEach(function (m) { addRow(m.role, m.content); });
    showChips();
  }

  var busy = false;
  function send(text) {
    text = (text || input.value || '').trim(); if (!text || busy) return;
    input.value = '';
    history.push({ role: 'user', content: text }); save();
    addRow('user', text); showChips();
    busy = true; sendBtn.disabled = true;
    var typing = document.createElement('div'); typing.className = 'msc-row b';
    typing.innerHTML = '<div class="msc-msg"><div class="msc-typing"><span></span><span></span><span></span></div></div>';
    body.appendChild(typing); body.scrollTop = body.scrollHeight;
    fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: history.slice(-12) }) })
      .then(function (r) { return r.json(); })
      .then(function (j) {
        typing.remove();
        var reply = (j && j.reply) ? j.reply : '不好意思，請再說一次好嗎？😊';
        history.push({ role: 'assistant', content: reply }); save();
        addRow('assistant', reply);
      })
      .catch(function () {
        typing.remove();
        addRow('assistant', '不好意思，連線出了點狀況，您可以加 LINE @mstars 或電 0903-368-856 🙏');
      })
      .then(function () { busy = false; sendBtn.disabled = false; input.focus(); });
  }

  function open() { panel.classList.add('open'); bubble.style.display = 'none'; if (!body.childNodes.length) renderHistory(); setTimeout(function () { input.focus(); }, 50); }
  function close() { panel.classList.remove('open'); bubble.style.display = 'flex'; }
  bubble.onclick = open;
  panel.querySelector('.x').onclick = close;
  sendBtn.onclick = function () { send(); };
  input.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); send(); } });

  renderHistory();
})();
