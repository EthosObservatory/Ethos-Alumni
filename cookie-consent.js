/*!
 * ETHOS Alumni Network — Cookie Consent
 * Stores preference in localStorage (no cookies used).
 * Dispatches 'ethos:consent' event when user accepts analytics.
 */
(function () {
  'use strict';

  const STORAGE_KEY = 'ethos_cookie_consent';
  const ACCEPTED    = 'accepted';
  const DECLINED    = 'declined';

  function getConsent() {
    try { return localStorage.getItem(STORAGE_KEY); } catch { return null; }
  }

  function setConsent(value) {
    try { localStorage.setItem(STORAGE_KEY, value); } catch {}
  }

  function dispatchConsentEvent(accepted) {
    document.dispatchEvent(new CustomEvent('ethos:consent', { detail: { analytics: accepted } }));
  }

  function removeBanner() {
    const banner = document.getElementById('cookie-banner');
    if (banner) {
      banner.classList.add('cookie-banner--hiding');
      setTimeout(() => banner.remove(), 350);
    }
  }

  function accept() {
    setConsent(ACCEPTED);
    dispatchConsentEvent(true);
    removeBanner();
  }

  function decline() {
    setConsent(DECLINED);
    dispatchConsentEvent(false);
    removeBanner();
  }

  function showBanner() {
    if (document.getElementById('cookie-banner')) return;

    const banner = document.createElement('div');
    banner.id = 'cookie-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', 'Cookie consent');
    banner.setAttribute('aria-live', 'polite');
    banner.innerHTML = `
      <div class="cookie-inner">
        <div class="cookie-text">
          <strong>Privacy & Cookies</strong>
          <p>
            We use analytics to understand how visitors use this site and improve the experience.
            No personal data is sold or shared.
            <a href="privacy.html">Privacy notice</a>.
          </p>
        </div>
        <div class="cookie-actions">
          <button id="cookie-decline" class="btn btn-ghost btn-sm">Decline</button>
          <button id="cookie-accept" class="btn btn-primary btn-sm">Accept analytics</button>
        </div>
      </div>`;

    document.body.appendChild(banner);

    document.getElementById('cookie-accept').addEventListener('click', accept);
    document.getElementById('cookie-decline').addEventListener('click', decline);

    /* Keyboard: Escape = decline */
    document.addEventListener('keydown', function onKey(e) {
      if (e.key === 'Escape') { decline(); document.removeEventListener('keydown', onKey); }
    });
  }

  function init() {
    const consent = getConsent();

    if (consent === ACCEPTED) {
      dispatchConsentEvent(true);
      return;
    }
    if (consent === DECLINED) {
      dispatchConsentEvent(false);
      return;
    }

    /* No prior choice — show banner after brief delay */
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => setTimeout(showBanner, 800));
    } else {
      setTimeout(showBanner, 800);
    }
  }

  /* Public API: allow re-opening settings from the footer */
  window.EthosConsent = {
    show:    showBanner,
    accept:  accept,
    decline: decline,
    get:     getConsent,
    ACCEPTED, DECLINED
  };

  init();
})();
