/* PostHog on every Moona page (moonastudio.ai and anything added later).
   Cookieless: persistence is memory, so nothing is stored on the visitor's device.
   Records page views, clicks and session replays; every typed value is masked.
   The ?c= code from a client link is attached to the whole session, so a client's
   visit can be found in PostHog by filtering on code (e.g. code = chen).
   Google Analytics and Clarity are separate and still wait for consent (analytics.js). */
(function () {
  if (window.__moonaPostHog) return;
  var host = location.hostname;
  if (location.protocol === 'file:' || host === 'localhost' || /^127\./.test(host)) return;
  if (navigator.globalPrivacyControl === true || ['1', 'yes'].indexOf(String(navigator.doNotTrack).toLowerCase()) > -1) return;
  window.__moonaPostHog = true;

  !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="init capture register register_once unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);

  var params = new URLSearchParams(location.search);
  var code = (params.get('c') || '').toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 40);
  var page = location.pathname.replace(/index\.html$/, '');

  posthog.init('phc_tR7sebAcZCkQvnc475AGEXGYhpmXxFa4JZTD4fQXrhuW', {
    api_host: 'https://us.i.posthog.com',
    persistence: 'memory',
    capture_pageview: true,
    capture_pageleave: true,
    autocapture: true,
    session_recording: { maskAllInputs: true }
  });
  var props = { site: 'moona-studio', host: host, page: page };
  if (code) props.code = code;
  posthog.register(props);
})();
