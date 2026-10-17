var EnerTchadCatalogueSession = (function () {
  'use strict';
  var key = 'et-catalogue-selection-v1';
  function valid(item, products) {
    return item && Number.isSafeInteger(item.id) && item.id >= 0 && item.id < products.length &&
      Number.isSafeInteger(item.variant) && item.variant >= 0 &&
      Array.isArray(products[item.id][11]) && item.variant < products[item.id][11].length &&
      Number.isSafeInteger(item.q) && item.q > 0;
  }
  function read(storage, products) {
    var cart = {};
    try {
      var raw = storage.getItem(key);
      if (!raw || raw.length > 65536) return cart;
      var data = JSON.parse(raw);
      if (data.version !== 1 || !Array.isArray(data.items)) return cart;
      data.items.slice(0, 200).forEach(function (item) {
        if (valid(item, products)) cart[item.id + ':' + item.variant] = {
          id: item.id, q: item.q, pack: products[item.id][11][item.variant]
        };
      });
    } catch (_) {}
    return cart;
  }
  function save(storage, cart, products) {
    try {
      var items = Object.keys(cart).map(function (key) {
        var item = cart[key];
        return item && {id: item.id, q: item.q, variant: products[item.id]?.[11]?.indexOf(item.pack)};
      }).filter(function (item) { return valid(item, products); });
      storage.setItem(key, JSON.stringify({version: 1, items: items}));
    } catch (_) {}
  }
  return {read: read, save: save};
})();
if (typeof module !== 'undefined') module.exports = EnerTchadCatalogueSession;
