/*!
 * ETHOS Alumni Network — Analytics consent handler
 * Il tag Google è già nel <head> di ogni pagina con tracciamento bloccato.
 * Questo script lo sblocca solo se l'utente accetta dal banner cookie.
 */
(function () {
  'use strict';

  function grantConsent() {
    if (typeof gtag === 'function') {
      gtag('consent', 'update', { analytics_storage: 'granted' });
    }
  }

  /* Ascolta la scelta in tempo reale dal banner */
  document.addEventListener('ethos:consent', function (e) {
    if (e && e.detail && e.detail.analytics === true) {
      grantConsent();
    }
  });

  /* Se l'utente aveva già accettato in una sessione precedente, sblocca subito */
  document.addEventListener('DOMContentLoaded', function () {
    if (window.EthosConsent && window.EthosConsent.get() === window.EthosConsent.ACCEPTED) {
      grantConsent();
    }
  });
})();
