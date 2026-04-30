/*!
 * ETHOS Alumni Network — Analytics (Google Analytics 4)
 *
 * Completamente gratuito. Per attivare:
 * 1. Vai su https://analytics.google.com e crea un account (gratis)
 * 2. Crea una "Property" e ottieni il tuo Measurement ID (formato: G-XXXXXXXXXX)
 * 3. Sostituisci il valore di GA_MEASUREMENT_ID qui sotto con il tuo ID
 *
 * Il tracciamento si attiva SOLO se l'utente accetta dal banner cookie.
 */
(function () {
  'use strict';

  var GA_MEASUREMENT_ID = 'G-YE4WLHTBXX';

  var loaded = false;

  function loadGA4() {
    if (loaded || GA_MEASUREMENT_ID === 'G-XXXXXXXXXX') return;
    loaded = true;

    /* Carica lo script di Google Analytics */
    var script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_MEASUREMENT_ID;
    document.head.appendChild(script);

    /* Inizializza gtag */
    window.dataLayer = window.dataLayer || [];
    function gtag() { window.dataLayer.push(arguments); }
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', GA_MEASUREMENT_ID, { anonymize_ip: true });
  }

  function handleConsent(e) {
    if (e && e.detail && e.detail.analytics === true) {
      loadGA4();
    }
  }

  /* Ascolta la scelta dell'utente dal banner cookie */
  document.addEventListener('ethos:consent', handleConsent);

  /* Se il consenso era già stato dato in una sessione precedente, carica subito */
  document.addEventListener('DOMContentLoaded', function () {
    if (window.EthosConsent && window.EthosConsent.get() === window.EthosConsent.ACCEPTED) {
      loadGA4();
    }
  });
})();
