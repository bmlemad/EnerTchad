(function () {
  'use strict';
  // The compiled configurator reads its configuration only when it mounts.
  // A hash change does not mount it again, unlike opening a shared link.
  window.addEventListener('hashchange', function () {
    var profile = new URLSearchParams(window.location.hash.slice(1)).get('p');
    if (['operateur', 'industriel', 'etat'].includes(profile)) {
      window.location.reload();
    }
  });
})();
