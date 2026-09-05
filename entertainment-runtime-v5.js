/* Apple Seed Entertainment runtime resilience v5
 * UI-only guard for the Entertainment page.
 * It never fetches, stores, proxies, or rewrites third-party content.
 */
(function () {
  'use strict';

  var started = false;
  var RSS_TIMEOUT_MS = 12000;
  var RSS_LOADING_TEXT = ['đang tải', 'loading'];

  function isEntertainmentPage() {
    var name = (location.pathname.split('/').pop() || '').toLowerCase();
    return name === 'entertainment.html';
  }

  function isLoadingNode(node) {
    var text = (node && node.textContent || '').trim().toLowerCase();
    return RSS_LOADING_TEXT.some(function (term) { return text.indexOf(term) >= 0; });
  }

  function findRssLoadingNodes() {
    var nodes = [];
    document.querySelectorAll('.empty').forEach(function (node) {
      if (isLoadingNode(node)) nodes.push(node);
    });
    return nodes;
  }

  function showRssFailure(nodes) {
    nodes.forEach(function (node) {
      if (!node || !node.isConnected || !isLoadingNode(node)) return;

      node.classList.remove('spinner');
      node.setAttribute('role', 'status');
      node.replaceChildren();

      var title = document.createElement('strong');
      title.textContent = 'Nguồn tin đang không phản hồi.';

      var detail = document.createElement('div');
      detail.style.marginTop = '6px';
      detail.textContent = 'Apple Seed không tải lại hoặc lưu bài viết. Bạn có thể thử cập nhật lại nguồn tin.';

      var retry = document.createElement('button');
      retry.type = 'button';
      retry.textContent = '↻ Thử lại';
      retry.style.marginTop = '10px';
      retry.style.border = '1px solid #d8e1ee';
      retry.style.background = '#fff';
      retry.style.color = '#1769ff';
      retry.style.borderRadius = '9px';
      retry.style.padding = '8px 11px';
      retry.style.fontWeight = '900';
      retry.style.cursor = 'pointer';
      retry.addEventListener('click', function () { location.reload(); }, { once: true });

      node.append(title, detail, retry);
    });
  }

  function watchRss() {
    var deadline = Date.now() + RSS_TIMEOUT_MS;
    var timer = setInterval(function () {
      var loading = findRssLoadingNodes();
      if (!loading.length) {
        clearInterval(timer);
        return;
      }
      if (Date.now() >= deadline) {
        clearInterval(timer);
        showRssFailure(loading);
      }
    }, 500);
  }

  function hardenExternalLinks() {
    document.querySelectorAll('a[target="_blank"]').forEach(function (link) {
      var rel = (link.getAttribute('rel') || '').split(/\s+/).filter(Boolean);
      if (rel.indexOf('noopener') < 0) rel.push('noopener');
      if (rel.indexOf('noreferrer') < 0) rel.push('noreferrer');
      link.setAttribute('rel', rel.join(' '));
    });
  }

  function start() {
    if (started || !isEntertainmentPage()) return;
    started = true;
    hardenExternalLinks();
    watchRss();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
