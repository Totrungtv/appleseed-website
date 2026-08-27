/* Apple Seed AI Board member account + Coin billing UI v1 */
(() => {
  'use strict';
  if (!/ai-board\.html$/i.test(location.pathname)) return;

  const sb = window.supabaseClient;
  const COST = Object.freeze({
    ai_analysis: 20,
    schematic_analysis: 10
  });

  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'
  }[c]));

  const money = v => Number(v || 0).toLocaleString('vi-VN');
  const dt = v => v ? new Date(v).toLocaleDateString('vi-VN') : '—';

  function injectStyle() {
    if (document.getElementById('as-member-coin-style')) return;
    const s = document.createElement('style');
    s.id = 'as-member-coin-style';
    s.textContent = `
      .as-member-bar{margin-top:16px;display:grid;grid-template-columns:1.2fr .8fr 1fr;gap:12px}
      .as-account-card,.as-coin-card,.as-price-card{background:#fff;border:1px solid #cfe2f7;border-radius:16px;padding:15px 17px;box-shadow:0 12px 34px #1e50821a}
      .as-account-card h3,.as-coin-card h3,.as-price-card h3{margin:0 0 7px;font-size:14px}
      .as-account-main{font-size:16px;font-weight:850}.as-account-sub{margin-top:4px;color:#647b98;font-size:12px;line-height:1.5}
      .as-coin-value{font-size:28px;font-weight:950;color:#1769ff;line-height:1.1}.as-coin-label{color:#647b98;font-size:12px;margin-top:4px}
      .as-coin-status{margin-top:8px;font-size:12px;color:#647b98}.as-price-list{display:grid;gap:7px}
      .as-price-row{display:flex;justify-content:space-between;gap:10px;font-size:12px;padding:7px 0;border-bottom:1px solid #edf2f7}
      .as-price-row:last-child{border-bottom:0}.as-price-row b{color:#1769ff}
      .as-billing-note{margin-top:12px;padding:10px 12px;background:#eef7ff;border:1px solid #c5e1ff;border-radius:11px;color:#145ca8;font-size:12px;line-height:1.5}
      .as-no-coin{margin-top:10px;padding:10px 12px;background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;color:#9a3412;font-size:12px}
      .as-balance-flash{animation:asCoinFlash .45s ease}.as-account-actions{margin-top:9px}
      @keyframes asCoinFlash{50%{transform:scale(1.04)}}
      @media(max-width:900px){.as-member-bar{grid-template-columns:1fr 1fr}}
      @media(max-width:600px){.as-member-bar{grid-template-columns:1fr}}
    `;
    document.head.appendChild(s);
  }

  function buildBar() {
    if (document.getElementById('as-member-bar')) return;
    const top = document.querySelector('.top');
    if (!top) return;
    const bar = document.createElement('section');
    bar.id = 'as-member-bar';
    bar.className = 'as-member-bar';
    bar.innerHTML = `
      <div class="as-account-card">
        <h3>👤 Tài khoản thành viên</h3>
        <div class="as-account-main" id="asMemberName">Đang tải…</div>
        <div class="as-account-sub" id="asMemberEmail">—</div>
        <div class="as-account-sub" id="asMemberStatus">Trạng thái: —</div>
      </div>
      <div class="as-coin-card">
        <h3>🪙 Số dư Coin</h3>
        <div class="as-coin-value" id="asMemberCoins">—</div>
        <div class="as-coin-label">Coin khả dụng</div>
        <div class="as-coin-status" id="asMemberTrial">Trial: —</div>
      </div>
      <div class="as-price-card">
        <h3>💰 Chi phí sử dụng AI Board</h3>
        <div class="as-price-list">
          <div class="as-price-row"><span>🧠 Phân tích AI</span><b>20 Coin / lần</b></div>
          <div class="as-price-row"><span>📐 Phân tích Schematic</span><b>10 Coin / lần</b></div>
        </div>
        <div class="as-billing-note">Coin chỉ bị trừ sau khi phân tích trả về kết quả thành công. Ảnh đính kèm không tính thêm Coin.</div>
      </div>
    `;
    top.insertAdjacentElement('afterend', bar);
  }

  function showMessage(text) {
    let box = document.getElementById('asCoinMessage');
    if (!box) {
      box = document.createElement('div');
      box.id = 'asCoinMessage';
      box.className = 'as-no-coin';
      const bar = document.getElementById('as-member-bar');
      bar?.insertAdjacentElement('afterend', box);
    }
    box.textContent = text;
    box.style.display = 'block';
    clearTimeout(box._timer);
    box._timer = setTimeout(() => box.style.display = 'none', 5000);
  }

  async function getAccount() {
    if (!sb) throw new Error('Chưa kết nối Supabase.');
    const { data: sessionData, error: sessionError } = await sb.auth.getSession();
    if (sessionError) throw sessionError;
    if (!sessionData?.session?.user) return null;

    const { data, error } = await sb.rpc('apple_seed_member_account_summary');
    if (error) throw error;
    if (!data?.ok) throw new Error(data?.message || 'Không đọc được tài khoản thành viên.');
    return data.account;
  }

  function renderAccount(a) {
    if (!a) return;
    const name = a.full_name || a.email || 'Thành viên';
    document.getElementById('asMemberName').textContent = name;
    document.getElementById('asMemberEmail').textContent = a.email || '—';
    document.getElementById('asMemberStatus').textContent = 'Trạng thái: ' + (a.status || '—');
    const coin = document.getElementById('asMemberCoins');
    coin.textContent = money(a.coins) + ' Coin';
    coin.classList.remove('as-balance-flash');
    void coin.offsetWidth;
    coin.classList.add('as-balance-flash');
    document.getElementById('asMemberTrial').textContent =
      a.status === 'trial'
        ? 'Trial đến: ' + dt(a.trial_expires_at)
        : 'Thời hạn: ' + dt(a.trial_expires_at);
  }

  async function refreshAccount() {
    try {
      const a = await getAccount();
      renderAccount(a);
      return a;
    } catch (e) {
      console.error('Apple Seed member account:', e);
      const el = document.getElementById('asMemberName');
      if (el) el.textContent = 'Không tải được tài khoản';
      const sub = document.getElementById('asMemberEmail');
      if (sub) sub.textContent = e?.message || 'Lỗi kết nối';
      return null;
    }
  }

  async function charge(action) {
    const cost = COST[action];
    const before = await getAccount();
    if (!before) throw new Error('Vui lòng đăng nhập thành viên.');
    if (Number(before.coins || 0) < cost) {
      throw new Error(`Không đủ Coin. ${action === 'ai_analysis' ? 'Phân tích AI' : 'Phân tích Schematic'} cần ${cost} Coin, bạn đang có ${money(before.coins)} Coin.`);
    }

    const { data, error } = await sb.rpc('apple_seed_consume_ai_board_coins', { p_action: action });
    if (error) throw error;
    if (!data?.ok) throw new Error(data?.message || 'Không thể trừ Coin.');
    renderAccount({...before, coins:data.balance});
    return data;
  }

  function wrapButton(id, action) {
    const btn = document.getElementById(id);
    if (!btn || btn.dataset.coinWrapped === '1' || typeof btn.onclick !== 'function') return false;
    const original = btn.onclick;
    btn.dataset.coinWrapped = '1';
    btn.onclick = async function(ev) {
      if (btn.disabled) return;
      btn.disabled = true;
      const oldText = btn.textContent;
      btn.textContent = '⏳ Kiểm tra Coin…';
      try {
        // Chạy AI trước, sau khi có kết quả thành công mới trừ Coin.
        const result = await original.call(this, ev);
        await charge(action);
        showMessage(`✅ Đã trừ ${COST[action]} Coin cho lần sử dụng này.`);
        return result;
      } catch (e) {
        const message = String(e?.message || e);
        if (/không đủ coin|vui lòng đăng nhập|chưa có tài khoản/i.test(message)) {
          showMessage('🪙 ' + message);
        }
        throw e;
      } finally {
        btn.disabled = false;
        btn.textContent = oldText;
        refreshAccount();
      }
    };
    return true;
  }

  function waitForButtons() {
    let tries = 0;
    const timer = setInterval(() => {
      tries++;
      const a = wrapButton('analyze','ai_analysis');
      const s = wrapButton('analyzeSchematic','schematic_analysis');
      if ((a && s) || tries > 200) clearInterval(timer);
    }, 50);
  }

  async function boot() {
    injectStyle();
    buildBar();
    const a = await refreshAccount();
    if (a) waitForButtons();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, {once:true});
  } else {
    boot();
  }

  if (sb?.auth) {
    sb.auth.onAuthStateChange((_event, session) => {
      if (session?.user) refreshAccount();
    });
  }
})();
