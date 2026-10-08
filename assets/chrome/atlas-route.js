(function () {
  var lang = document.documentElement.lang === 'en' ? '-en' : '';
  var routes = {
    'atlas-cadastre': 'carte', 'atl-cadastre': 'carte',
    'atl-geologie': 'bassins-champs', 'atl-bassins': 'bassins-champs',
    'atl-champs': 'bassins-champs', 'atl-reserves': 'bassins-champs', 'atl-stoiip': 'bassins-champs',
    'atl-infra': 'infrastructures', 'atl-assay': 'infrastructures', 'atl-reseaux': 'infrastructures',
    'atl-gaz': 'infrastructures', 'atl-climat': 'infrastructures',
    'atl-regime': 'cadre-sectoriel', 'atl-histoire': 'cadre-sectoriel',
    'atl-expansion': 'cadre-sectoriel', 'atl-entrer': 'cadre-sectoriel',
    'atl-sources': 'sources'
  };
  function follow() {
    var id = location.hash.slice(1);
    if (id === 'atl-investir') id = 'atl-entrer';
    if (id === 'donnees-secteur') id = 'atl-geologie';
    var route = routes[id];
    if (route) location.replace('/atlas/' + route + lang + '#' + id);
  }
  follow();
  addEventListener('hashchange', follow);
})();
