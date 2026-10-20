/* Référencement fournisseur : regroupe les champs structurés dans « message » et envoie
   au récepteur du site (contact.php). Aucune valeur n'est transmise à Analytics. */
(function () {
  'use strict';
  var form = document.getElementById('sfForm');
  if (!form) return;
  var css = document.createElement('link');
  css.rel = 'stylesheet';
  css.href = '/assets/chrome/fournisseur-form.css?b=202610201800';
  document.head.appendChild(css);
  var en = document.documentElement.lang === 'en';
  var status = document.getElementById('sfStatus');
  var button = form.querySelector('button[type=submit]');
  var sending = false, sent = false;
  var T = en ? {
    sending: 'Sending…',
    ok: 'Your file has been received. EnerTchad procurement will review it and ask for the supporting documents by e-mail. This acknowledgement is not a listing decision.',
    ko: 'Receipt could not be confirmed. Please try again, or e-mail the same information to the address shown on the Contact page.',
    families: 'Please tick at least one purchasing family.'
  } : {
    sending: 'Envoi en cours…',
    ok: 'Votre dossier a été reçu. Le service achats l’examinera et vous demandera les pièces justificatives par courriel. Cet accusé de réception ne vaut pas décision de référencement.',
    ko: 'La réception n’a pas pu être confirmée. Réessayez, ou envoyez les mêmes informations par courriel à l’adresse indiquée sur la page Contact.',
    families: 'Cochez au moins une famille d’achat.'
  };
  function say(t) { status.hidden = false; status.textContent = t; }
  function labelOf(el) {
    var l = el.closest('label');
    if (!l) return el.name;
    var c = l.cloneNode(true);
    c.querySelectorAll('input,select,textarea,.hint').forEach(function (n) { n.remove(); });
    return c.textContent.replace(/\s+/g, ' ').trim();
  }
  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    if (sending || sent) return;
    var fams = Array.prototype.filter.call(form.querySelectorAll('input[name=sf_famille]'), function (c) { return c.checked; });
    var first = form.querySelector('input[name=sf_famille]');
    first.setCustomValidity(fams.length ? '' : T.families);
    if (!form.reportValidity()) return;
    var data = new FormData(form);
    if (data.get('website')) return;
    var lines = [];
    form.querySelectorAll('fieldset').forEach(function (fs) {
      lines.push('', '== ' + fs.querySelector('legend').textContent.trim() + ' ==');
      fs.querySelectorAll('input,select,textarea').forEach(function (el) {
        if (el.type === 'hidden' || el.name === 'sf_famille' || el.name === 'sf_code') return;
        var v = (el.value || '').trim();
        lines.push(labelOf(el) + ' : ' + (v || '—'));
      });
      if (fs.querySelector('input[name=sf_famille]')) {
        lines.push((en ? 'Purchasing families' : 'Familles d’achat') + ' : ' + fams.map(function (c) { return c.value; }).join(', '));
      }
    });
    lines.push('', (en ? 'Code of conduct acknowledged' : 'Code d’éthique pris en compte') + ' : ' + (form.querySelector('input[name=sf_code]').checked ? (en ? 'yes' : 'oui') : (en ? 'no' : 'non')));
    var body = new URLSearchParams();
    ['form-name', 'language', 'request_type', 'website', 'name', 'email', 'organization'].forEach(function (k) { body.set(k, data.get(k) || ''); });
    body.set('message', lines.join('\n').trim().slice(0, 4900));
    sending = true; button.disabled = true; say(T.sending);
    var controller = new AbortController();
    var timer = setTimeout(function () { controller.abort(); }, 30000);
    try {
      var r = await fetch(form.action, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: body.toString(), signal: controller.signal });
      if (!r.ok) throw new Error('not accepted');
      sent = true; say(T.ok); form.reset();
    } catch (e) {
      say(T.ko); button.disabled = false;
    } finally {
      clearTimeout(timer); sending = false; status.focus();
    }
  });
  form.querySelectorAll('input[name=sf_famille]').forEach(function (c) {
    c.addEventListener('change', function () { form.querySelector('input[name=sf_famille]').setCustomValidity(''); });
  });
})();
