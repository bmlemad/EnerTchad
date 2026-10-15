/* Sharing starts only after the visitor clicks; page metadata stays local until then. */
(function () {
  'use strict';
  var ar = document.documentElement.lang.indexOf('ar') === 0;
  var en = document.documentElement.lang.indexOf('en') === 0;
  var copied = ar ? 'تم نسخ الرابط' : en ? 'Link copied' : 'Lien copié';
  var manual = ar ? 'انسخ هذا الرابط لمشاركة الصفحة.' : en ? 'Copy this link to share the page.' : 'Copiez ce lien pour partager la page.';
  var linkLabel = ar ? 'رابط المشاركة' : en ? 'Sharing link' : 'Lien à partager';
  document.querySelectorAll('[data-page-share]').forEach(function (button) {
    if (button.dataset.shareReady) return;
    button.dataset.shareReady = 'true';
    button.disabled = false;
    var status = document.createElement('p');
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    status.hidden = true;
    status.style.cssText = 'margin:8px 0;font:inherit;color:inherit';
    var input = document.createElement('input');
    input.type = 'text';
    input.readOnly = true;
    input.setAttribute('aria-label', linkLabel);
    input.hidden = true;
    input.style.cssText = 'box-sizing:border-box;max-width:100%;width:100%;padding:8px;font:inherit;color:inherit;background:transparent;border:1px solid currentColor';
    var group = button.parentElement;
    group.insertAdjacentElement('afterend', status);
    status.insertAdjacentElement('afterend', input);
    // Match the adjacent social icon, including footers that stay dark in light mode.
    function syncAppearance() {
      var reference = group.querySelector('a');
      if (!reference) return;
      var appearance = getComputedStyle(reference);
      ['color', 'backgroundColor', 'borderColor', 'borderRadius', 'width', 'height'].forEach(function (property) {
        button.style[property] = appearance[property];
      });
      status.style.color = appearance.color;
      input.style.color = appearance.color;
    }
    syncAppearance();
    if (typeof MutationObserver === 'function') {
      new MutationObserver(syncAppearance).observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'style'] });
    }
    addEventListener('load', syncAppearance, { once: true });
    addEventListener('resize', syncAppearance);
    addEventListener('pageshow', syncAppearance);
    var busy = false;
    button.addEventListener('click', async function () {
      if (busy) return;
      var canonical = document.querySelector('link[rel="canonical"]');
      var url = location.origin + location.pathname;
      if (canonical) {
        try { var candidate = new URL(canonical.href, location.href); if (candidate.origin === location.origin) url = candidate.href; } catch (_) {}
      }
      var data = { title: document.title, url: url };
      busy = true;
      status.hidden = true;
      input.hidden = true;
      try {
        if (typeof navigator.share === 'function') {
          try { await navigator.share(data); return; }
          catch (error) { if (error && error.name === 'AbortError') return; }
        }
        if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
          try { await navigator.clipboard.writeText(url); status.textContent = copied; status.hidden = false; return; } catch (_) {}
        }
        status.textContent = manual;
        status.hidden = false;
        input.value = url;
        input.hidden = false;
        input.focus();
        input.select();
      } finally { busy = false; }
    });
  });
})();
