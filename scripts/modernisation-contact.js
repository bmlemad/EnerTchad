(function () {
  'use strict';
  var names = {
    amont: ['Étude de développement amont', 'Upstream development study'],
    depot: ['Étude de dépôt et de logistique', 'Storage and logistics study'],
    raffinage: ['Étude de raffinage et de distribution', 'Refining and distribution study'],
    petrochimie: ['Faisabilité pétrochimique', 'Petrochemical feasibility'],
    faisabilite: ['Études et faisabilité', 'Studies and feasibility'],
    conception: ['Conception et préparation', 'Design and preparation'],
    assistance: ['Assistance technique', 'Technical assistance'],
    suivi: ['Suivi de projets', 'Project monitoring']
  };
  function serviceName(key, en) { return Object.prototype.hasOwnProperty.call(names, key) ? names[key][en ? 1 : 0] : ''; }
  if (typeof module !== 'undefined') module.exports = { serviceName: serviceName };
  if (typeof document === 'undefined' || !/^(fr|en)(-|$)/.test(document.documentElement.lang)) return;
  var en = document.documentElement.lang.indexOf('en') === 0;
  var form = document.getElementById('ctForm');
  var key = new URLSearchParams(location.search).get('service') || '';
  var service = serviceName(key, en);
  if (!form || !service) return;
  var notice = document.createElement('p');
  notice.className = 'mod-context'; notice.id = 'mod-service-context';
  notice.textContent = (en ? 'Your project: ' : 'Votre projet : ') + service;
  form.prepend(notice);
  var message = form.querySelector('[name="message"]');
  if (message && !message.value.trim()) message.value = (en ? 'Project: ' : 'Projet : ') + service + '\n\n' + (en ? 'My requirements: ' : 'Mon besoin : ');
  document.querySelectorAll('a[href]').forEach(function (link) {
    var href = link.getAttribute('href');
    if (!/^\/contact(?:-en)?(?:[?#]|$)/.test(href)) return;
    var label = link.getAttribute('aria-label') || link.textContent.trim();
    if (!/^(FR|EN|Français|English|Version française|English version)$/i.test(label) && !link.hasAttribute('hreflang')) return;
    var url = new URL(href, location.origin);
    url.searchParams.set('service', key); link.setAttribute('href', url.pathname + url.search + '#ctForm');
  });
})();
