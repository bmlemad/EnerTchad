(function () {
  'use strict';
  function normal(value) { return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase(); }
  function matches(doc, filters) {
    return (!filters.query || normal(doc.text).includes(normal(filters.query))) &&
      ['category', 'language', 'format'].every(function (key) { return !filters[key] || doc[key] === filters[key]; });
  }
  if (typeof module !== 'undefined') module.exports = { matches: matches };
  if (typeof document === 'undefined') return;
  var en = document.documentElement.lang.indexOf('en') === 0;
  var filters = document.querySelector('[data-document-filter]');
  if (!filters) return;
  var library = document.getElementById('mod-library');
  var counter = document.querySelector('[data-document-count]');
  var anchors = Array.from(document.querySelectorAll('a[data-document-format]'));
  var records = anchors.map(function (anchor) {
    var shell = document.createElement('div'); shell.className = 'mod-doc-shell';
    anchor.parentNode.insertBefore(shell, anchor); shell.appendChild(anchor);
    var record = { anchor: anchor, shell: shell, text: anchor.textContent,
      format: anchor.dataset.documentFormat, language: anchor.dataset.documentLanguage, category: anchor.dataset.documentCategory };
    if (record.format === 'PDF') {
      var button = document.createElement('button'); button.type = 'button'; button.className = 'mod-preview';
      button.textContent = en ? 'Preview PDF' : 'Aperçu PDF';
      button.setAttribute('aria-label', (en ? 'Preview: ' : 'Aperçu : ') + (anchor.querySelector('h3,b,strong') || anchor).textContent.trim());
      button.addEventListener('click', function () { preview(anchor.getAttribute('href'), anchor.textContent.trim(), button); });
      shell.appendChild(button);
    }
    return record;
  });
  function refresh() {
    var values = Object.fromEntries(new FormData(filters));
    var shown = 0;
    records.forEach(function (record) {
      var visible = matches(record, values);
      record.shell.hidden = !visible;
      var li = record.shell.parentElement;
      if (li && li.tagName === 'LI') li.hidden = !visible;
      if (visible) shown++;
    });
    counter.textContent = shown + ' document' + (shown === 1 ? '' : 's') + (en ? ' shown' : shown === 1 ? ' affiché' : ' affichés') + (shown ? '' : (en ? ' — reset the filters to see all files.' : ' — réinitialisez les filtres pour retrouver les fichiers.'));
  }
  filters.addEventListener('submit', function (event) { event.preventDefault(); refresh(); });
  filters.addEventListener('input', refresh);
  filters.addEventListener('reset', function () { setTimeout(refresh, 0); });
  library.hidden = false; filters.hidden = false; refresh();
  var dialog;
  function preview(href, title, opener) {
    if (!/^\/[A-Za-z0-9_\-]+\.pdf$/.test(href)) return;
    if (!dialog) {
      dialog = document.createElement('dialog'); dialog.className = 'mod-preview-dialog';
      var heading = document.createElement('h2'); heading.id = 'mod-preview-title';
      var close = document.createElement('button'); close.type = 'button'; close.className = 'mod-button'; close.textContent = en ? 'Close preview' : 'Fermer l’aperçu';
      close.addEventListener('click', function () { dialog.close(); });
      var link = document.createElement('a'); link.className = 'mod-preview-open mod-button'; link.target = '_blank'; link.rel = 'noopener';
      link.textContent = en ? 'Open the PDF in a new tab' : 'Ouvrir le PDF dans un nouvel onglet';
      var frame = document.createElement('iframe'); frame.title = en ? 'PDF preview' : 'Aperçu du document PDF';
      dialog.setAttribute('aria-labelledby', heading.id); dialog.append(close, heading, link, frame); document.body.appendChild(dialog);
    }
    dialog.querySelector('h2').textContent = title.slice(0, 180);
    dialog.querySelector('a').href = href; dialog.querySelector('iframe').src = href;
    dialog.onclose = function () { dialog.querySelector('iframe').removeAttribute('src'); opener.focus(); };
    dialog.showModal();
  }
})();
