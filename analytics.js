/* Moona analytics gateway.
   Google Analytics, Microsoft Clarity and PostHog start only after an explicit
   visitor choice. Events intentionally contain no form values or other PII. */
(() => {
  const config = window.MOONA_ANALYTICS_CONFIG || {};
  const consentKey = 'moona-analytics-consent';
  const hasProvider = Boolean(config.gaMeasurementId || config.clarityProjectId || config.posthogKey);
  const doNotTrack = navigator.globalPrivacyControl === true || ['1', 'yes'].includes(String(navigator.doNotTrack).toLowerCase());
  const queuedEvents = [];
  let started = false;
  let posthogReady = false;

  const eventProperties = (properties = {}) => ({
    page_path: location.pathname,
    ...properties
  });

  function capture(name, properties) {
    const safeProperties = eventProperties(properties);
    if (!started) {
      queuedEvents.push([name, safeProperties]);
      return;
    }
    if (typeof window.gtag === 'function') window.gtag('event', name, safeProperties);
    if (typeof window.clarity === 'function') window.clarity('event', name);
    if (posthogReady && window.posthog && typeof window.posthog.capture === 'function') {
      window.posthog.capture(name, safeProperties);
    } else if (config.posthogKey) {
      queuedEvents.push([name, safeProperties]);
    }
  }

  function loadScript(src, onload) {
    const script = document.createElement('script');
    script.async = true;
    script.src = src;
    if (onload) script.onload = onload;
    document.head.appendChild(script);
  }

  function startGoogleAnalytics() {
    const id = config.gaMeasurementId;
    if (!/^G-[A-Z0-9]+$/i.test(id || '')) return;
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function gtag() { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', id);
    loadScript(`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`);
  }

  function startClarity() {
    const id = config.clarityProjectId;
    if (!/^[a-z0-9]+$/i.test(id || '')) return;
    window.clarity = window.clarity || function clarity() { (window.clarity.q = window.clarity.q || []).push(arguments); };
    window.clarity('consent');
    loadScript(`https://www.clarity.ms/tag/${encodeURIComponent(id)}`);
  }

  function startPostHog() {
    const key = config.posthogKey;
    if (!key) return;
    const host = /^https:\/\/[a-z0-9.-]+$/i.test(config.posthogHost || '') ? config.posthogHost : 'https://us.i.posthog.com';
    const assetHost = host.replace('.i.posthog.com', '-assets.i.posthog.com');
    loadScript(`${assetHost}/static/array.js`, () => {
      if (!window.posthog || typeof window.posthog.init !== 'function') return;
      window.posthog.init(key, {
        api_host: host,
        defaults: '2026-05-30',
        autocapture: false,
        capture_pageview: true,
        capture_performance: false,
        disable_session_recording: true
      });
      posthogReady = true;
      const pending = queuedEvents.splice(0);
      pending.forEach(([name, properties]) => window.posthog.capture(name, properties));
    });
  }

  function start() {
    if (started || doNotTrack || !hasProvider) return;
    started = true;
    startGoogleAnalytics();
    startClarity();
    startPostHog();
    const pending = queuedEvents.splice(0);
    pending.forEach(([name, properties]) => capture(name, properties));
  }

  function saveConsent(value) {
    try { localStorage.setItem(consentKey, value); } catch (_) { /* storage is optional */ }
  }

  function readConsent() {
    try { return localStorage.getItem(consentKey); } catch (_) { return null; }
  }

  window.MoonaAnalytics = {
    grantConsent() { saveConsent('granted'); start(); },
    denyConsent() { saveConsent('denied'); },
    capture
  };

  const banner = document.getElementById('analyticsConsent');
  const hideBanner = () => { if (banner) banner.hidden = true; };
  document.getElementById('analyticsAccept')?.addEventListener('click', () => {
    window.MoonaAnalytics.grantConsent();
    hideBanner();
  });
  document.getElementById('analyticsReject')?.addEventListener('click', () => {
    window.MoonaAnalytics.denyConsent();
    hideBanner();
  });

  if (readConsent() === 'granted') start();
  else if (hasProvider && !doNotTrack && readConsent() !== 'denied' && banner) banner.hidden = false;

  document.addEventListener('click', event => {
    const link = event.target.closest('a[href^="mailto:"]');
    if (link) capture('email_link_clicked', { link_text: link.textContent.trim().slice(0, 80) });
  });
})();
