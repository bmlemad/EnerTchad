/* Keep the current enquiry type when switching between French, English and Arabic. */
(function () {
  'use strict';
  var form = document.getElementById('ctForm');
  if (!form) return;
  var select = form.querySelector('#ctType');
  if (!select) return;
  var language = document.documentElement.lang;
  if (!/^(fr|en|ar)(-|$)/.test(language)) return;
  var arabic = language.slice(0, 2) === 'ar';
  var english = language.slice(0, 2) === 'en';
  var names = arabic
    ? {b2b: 'Supply', fournisseur: 'Supplier', partenariat: 'Partnership', invest: 'Investment', autre: 'Other'}
    : english
    ? {ep: 'E&P', b2b: 'Supply', partenariat: 'Industrial', b2g: 'Public contracts', invest: 'Investment', talents: 'Application', presse: 'Press', autre: 'Other'}
    : {ep: 'E&P', b2b: 'Approvisionnement', partenariat: 'Partenariat', b2g: 'Marchés publics', invest: 'Investissement', talents: 'Candidature', presse: 'Presse', autre: 'Autre'};
  var options = Array.from(select.options);
  function profileFor(option) {
    if (!option || !option.value) return '';
    if (option.dataset.contactProfile) return option.dataset.contactProfile;
    return Object.keys(names).find(function (key) {
      return option.value.indexOf(names[key]) !== -1;
    }) || '';
  }
  var incoming = (new URLSearchParams(location.search).get('profil') || '').toLowerCase();
  var option = options.find(function (item) { return incoming && profileFor(item) === incoming; });
  if (option) select.value = option.value;
  function syncLanguageLinks() {
    var current = options.find(function (item) { return item.value === select.value; });
    var profile = profileFor(current);
    document.querySelectorAll('a[href]').forEach(function (link) {
      var url = new URL(link.getAttribute('href'), location.origin);
      if (url.origin !== location.origin || !/^(?:\/contact(?:-en)?|\/ar-contact)$/.test(url.pathname)) return;
      var languageLink = /\bnx-lang\b/.test(link.getAttribute('class') || '') ||
        /^(fr|en|ar)$/.test(link.getAttribute('hreflang') || '') ||
        /^(Version française|English version|Français|English|FR|EN|ع)$/i.test(link.getAttribute('aria-label') || (link.textContent || '').trim());
      var followsSelection = link.getAttribute('data-et-contact-context') === 'true';
      // Keep explicit business routes (such as investor contact) independent
      // from the current form selection. Only language and generic links follow it.
      if (!languageLink && !followsSelection && url.searchParams.has('profil')) return;
      link.setAttribute('data-et-contact-context', 'true');
      if (languageLink && location.hash === '#ctForm') url.hash = 'ctForm';
      if (profile) url.searchParams.set('profil', profile);
      else url.searchParams.delete('profil');
      link.setAttribute('href', url.pathname + url.search + url.hash);
    });
  }
  select.addEventListener('change', syncLanguageLinks);
  syncLanguageLinks();
  if (location.hash === '#ctForm') form.focus({ preventScroll: true });
})();
