/* Preserve the request context when visitors arrive from a business page. */
(function () {
  var form = document.getElementById('ctForm');
  if (!form) return;
  var profile = new URLSearchParams(location.search).get('profil');
  if (!profile) return;
  profile = profile.toLowerCase();
  var english = document.documentElement.lang === 'en';
  var names = english
    ? {ep: 'E&P', b2b: 'Supply', partenariat: 'Industrial', b2g: 'Public contracts', invest: 'Investment', talents: 'Application', presse: 'Press'}
    : {ep: 'E&P', b2b: 'Approvisionnement', partenariat: 'Partenariat', b2g: 'Marchés publics', invest: 'Investissement', talents: 'Candidature', presse: 'Presse'};
  var select = form.querySelector('#ctType');
  if (!select) return;
  var option = Array.from(select.options).find(function (item) {
    return item.dataset.contactProfile === profile || (names[profile] && item.value.indexOf(names[profile]) !== -1);
  });
  if (!option) return;
  select.value = option.value;
  // Language switching should keep the same request type.
  document.querySelectorAll('a[href="/contact"], a[href="/contact-en"]').forEach(function (link) {
    var url = new URL(link.getAttribute('href'), location.origin);
    url.searchParams.set('profil', profile);
    link.setAttribute('href', url.pathname + url.search);
  });
})();
