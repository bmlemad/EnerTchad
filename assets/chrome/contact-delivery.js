/* Submit only to the site's form receiver; never send field values to Analytics. */
(function () {
  'use strict';
  var form = document.getElementById('ctForm');
  if (!form || form.name !== 'enertchad-contact') return;
  var english = document.documentElement.lang === 'en';
  var arabic = document.documentElement.lang === 'ar';
  var status = document.getElementById('ctDeliveryStatus');
  var button = document.getElementById('ctSend');
  var sending = false;
  var sent = false;
  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    if (sending || sent || !form.reportValidity()) return;
    var body = new URLSearchParams(new FormData(form));
    if (body.get('website')) return;
    if (!body.get('name').trim() || !body.get('message').trim()) {
      status.hidden = false;
      status.textContent = arabic ? 'يرجى إدخال الاسم والرسالة.' : english ? 'Please enter your name and message.' : 'Veuillez renseigner votre nom et votre message.';
      return;
    }
    sending = true;
    button.disabled = true;
    status.hidden = false;
    status.textContent = arabic ? 'جارٍ الإرسال…' : english ? 'Sending…' : 'Envoi en cours…';
    try {
      var response = await fetch(form.action, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: body.toString() });
      if (!response.ok) throw new Error('Submission not accepted');
      sent = true;
      status.textContent = arabic ? 'تم استلام طلبك. ستراجعه إينيرتشاد. لا تؤكد هذه الرسالة الموافقة على الطلب.' : english ? 'Your request has been received. EnerTchad will review it. This acknowledgement does not confirm approval of the request.' : 'Votre demande a été reçue. EnerTchad pourra l’examiner. Cet accusé de réception ne vaut pas acceptation de votre demande.';
      form.dispatchEvent(new CustomEvent('et:contact-received', { bubbles: true }));
      form.reset();
    } catch (error) {
      status.textContent = arabic ? 'لم يتم تأكيد الاستلام. حاول مجددًا أو استخدم البريد الإلكتروني أو واتساب. تم الاحتفاظ بالنص.' : english ? 'Receipt could not be confirmed. Retry or use email or WhatsApp. Your text has been kept.' : 'La réception n’a pas pu être confirmée. Réessayez ou utilisez l’e-mail ou WhatsApp. Votre texte est conservé.';
      button.disabled = false;
    } finally {
      sending = false;
      status.focus();
    }
  });
})();
