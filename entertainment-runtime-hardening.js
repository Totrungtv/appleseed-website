/* Apple Seed Entertainment runtime hardening v2.
 * Loaded only on entertainment.html from supabase-config.js.
 * Additive safety layer: no data writes, no content scraping, no platform bypass.
 */
(function () {
  'use strict';

  function ready(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn, { once: true });
    } else {
      fn();
    }
  }

  function ensureTikTokStatus() {
    var frame = document.getElementById('tiktokFrame');
    if (!frame || document.getElementById('tiktokStatus')) return;
    var host = frame.closest('.social-player');
    if (!host) return;
    var status = document.createElement('div');
    status.id = 'tiktokStatus';
    status.className = 'tiktok-status';
    status.setAttribute('role', 'status');
    status.textContent = 'Sẵn sàng phát TikTok chính thức.';
    host.appendChild(status);
  }

  function hardenTikTokUrlParsing() {
    var input = document.getElementById('tiktokUrl');
    var button = document.getElementById('tiktokLoad');
    if (!input || !button || button.dataset.runtimeBound === '1') return;
    button.dataset.runtimeBound = '1';
    button.addEventListener('click', function () {
      var raw = input.value.trim();
      var match = raw.match(/(?:tiktok\\.com\\/@[^/]+\\/video\\/|tiktok\\.com\\/.*?\\/video\\/|\\/video\\/)(\\d{8,30})/i);
      if (!match) {
        input.setCustomValidity('URL TikTok chưa đúng dạng video công khai.');
        if (typeof input.reportValidity === 'function') input.reportValidity();
      } else {
        input.setCustomValidity('');
      }
    });
  }

  function hardenYouTubePlaceholder() {
    var poster = document.getElementById('youtubePoster');
    if (!poster || poster.dataset.runtimeBound === '1') return;
    poster.dataset.runtimeBound = '1';
    poster.addEventListener('error', function () {
      poster.removeAttribute('src');
      poster.style.display = 'none';
    }, { once: true });
  }

  function showRssFailureIfStuck() {
    var ids = ['newsGrid', 'techGrid', 'sportGrid', 'entGrid'];
    ids.forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      var text = (el.textContent || '').trim();
      if (!text || /Đang tải/.test(text)) {
        el.innerHTML = '<div class="empty" role="status">Không tải được nguồn tin lúc này.<br><small>Kiểm tra kết nối rồi bấm <b>↻ Cập nhật</b> để thử lại.</small></div>';
      }
    });
  }

  function installNetworkFallbackNotice() {
    var refresh = document.getElementById('refresh');
    if (!refresh || refresh.dataset.runtimeBound === '1') return;
    refresh.dataset.runtimeBound = '1';
    refresh.addEventListener('click', function () {
      window.setTimeout(showRssFailureIfStuck, 9000);
    });
  }

  function protectExternalLinks() {
    document.querySelectorAll('a[target="_blank"]').forEach(function (a) {
      var rel = (a.getAttribute('rel') || '').split(/\\s+/).filter(Boolean);
      if (!rel.includes('noopener')) rel.push('noopener');
      if (!rel.includes('noreferrer')) rel.push('noreferrer');
      a.setAttribute('rel', rel.join(' '));
    });
  }

  function lazyLoadNonCriticalFrames() {
    document.querySelectorAll('iframe').forEach(function (frame) {
      if (frame.id === 'tiktokFrame') return;
      if (!frame.getAttribute('loading')) frame.setAttribute('loading', 'lazy');
      if (!frame.getAttribute('referrerpolicy')) frame.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
    });
  }

  ready(function () {
    ensureTikTokStatus();
    hardenTikTokUrlParsing();
    hardenYouTubePlaceholder();
    installNetworkFallbackNotice();
    protectExternalLinks();
    lazyLoadNonCriticalFrames();
  });
})();
