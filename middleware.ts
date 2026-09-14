const LOCALE_PARAMETER = 'lang';
const COUNTRY_MARKER = 'moona-country';
const HEBREW = 'he';
const ISRAEL = 'IL';

/**
 * Give new visitors in Israel the Hebrew experience without treating location
 * as a saved preference. The marker lets the client bootstrap keep an existing
 * manual localStorage choice ahead of this country default.
 */
export default function middleware(request: Request) {
  const url = new URL(request.url);

  if (url.searchParams.has(LOCALE_PARAMETER)) return;
  if (request.headers.get('x-vercel-ip-country') !== ISRAEL) return;

  url.searchParams.set(LOCALE_PARAMETER, HEBREW);
  url.searchParams.set(COUNTRY_MARKER, ISRAEL);
  return Response.redirect(url, 307);
}

export const config = {
  matcher: ['/', '/privacy.html', '/accessibility.html']
};
