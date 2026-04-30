/*!
 * ETHOS Alumni Network — Analytics
 * Loads Plausible only after the user has accepted analytics via the
 * cookie consent banner. If consent was already given in a previous
 * session it loads immediately on DOMContentLoaded.
 *
 * To activate: replace PLAUSIBLE_DOMAIN below with the actual domain,
 * e.g. "ethosobservatory.github.io" or a custom domain if configured.
 */
(function () {
  'use strict';

  var PLAUSIBLE_DOMAIN = 'ethosobservatory.github.io';
  var loaded = false;

  function loadPlausible() {
    if (loaded) return;
    loaded = true;

    var script = document.createElement('script');
    script.defer = true;
    script.dataset.domain = PLAUSIBLE_DOMAIN;
    script.src = 'https://plausible.io/js/script.js';
    document.head.appendChild(script);
  }

  function handleConsent(e) {
    if (e && e.detail && e.detail.analytics === true) {
      loadPlausible();
    }
  }

  /* Listen for real-time consent decisions */
  document.addEventListener('ethos:consent', handleConsent);

  /* If consent was already given in a prior session, load immediately */
  document.addEventListener('DOMContentLoaded', function () {
    if (window.EthosConsent && window.EthosConsent.get() === window.EthosConsent.ACCEPTED) {
      loadPlausible();
    }
  });
})();
