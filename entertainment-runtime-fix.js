/* Apple Seed Entertainment runtime hardening.
 * Loaded only on entertainment.html from supabase-config.js.
 * This layer is intentionally additive: it does not replace existing page logic.
 */
(function () {
  'use strict';

  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn, { once: true });
    else fn();
  }

  function ensureTikTokStatus() {
    var frame = document.getElementById('tiktokFrame');
    if (!frame || document.getElementById('tiktokStatus')) return;
    var host = frame.closest('.social-player');
    if (!host) return;
    var status = document.createElement('div');
    status.id = 'tiktokStatus';
    status.className = 'tiktok-status';
    status.textContent = 'Sẵn sàng phát TikTok chính thức.';
    host.appendChild(status);
  }

  function hardenTikTokUrlParsing() {
    var input = document.getElementById('tiktokUrl');
    var button = document.getElementById('tiktokLoad');
    if (!input || !button || button.dataset.fixBound === '1') return;
    button.dataset.fixBound = '1';
    button.addEventListener('click', function () {
      var raw = input.value.trim();
      var match = raw.match(/(?:tiktok\.com\/@[^/]+\/video\/|tiktok\.com\/.*?\/video\/|\/video\/)(\d{8,30})/i);
      if (!match) {
        input.setCustomValidity('URL TikTok chưa đúng dạng video công khai.');
        input.reportValidity();
      }
    });
  }

  function hardenYouTubePlaceholder() {
    var poster = document.getElementById('youtubePoster');
    if (!poster || poster.dataset.fixBound === '1') return;
    poster.dataset.fixBound = '1';
    poster.addEventListener('error', function () {
      poster.removeAttribute('src');
      poster.style.display = 'none';
    }, { once: true });
  }

  function installNetworkFallbackNotice() {
    var refresh = document.getElementById('refresh');
    if (!refresh || refresh.dataset.fixBound === '1') return;
    refresh.dataset.fixBound = '1';
    refresh.addEventListener('click', function () {
      var grids = ['newsGrid', 'techGrid', 'sportGrid', 'entGrid'];
      window.setTimeout(function () {
        grids.forEach(function (id) {
          var el = document.getElementById(id);
          if (!el) return;
          var text = (el.textContent || '').trim();
          if (/Chưa lấy được RSS|Không tải được tin/.test(text)) {
            el.setAttribute('data-runtime-error', 'rss');
          }
        });
      }, 9000);
    });
  }

  function protectExternalLinks() {
    document.querySelectorAll('a[target="_blank"]').forEach(function (a) {
      var rel = (a.getAttribute('rel') || '').split(/\s+/).filter(Boolean);
      if (!rel.includes('noopener')) rel.push('noopener');
      if (!rel.includes('noreferrer')) rel.push('noreferrer');
      a.setAttribute('rel', rel.join(' '));
    });
  }

  ready(function () {
    ensureTikTokStatus();
    hardenTikTokUrlParsing();
    hardenYouTubePlaceholder();
    installNetworkFallbackNotice();
    protectExternalLinks();
  });
})();
