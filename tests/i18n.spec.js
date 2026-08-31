const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');

const BASE_URL = `http://127.0.0.1:${Number(process.env.PLAYWRIGHT_PORT || 4317)}`;
const HOME_EN_TITLE = 'Moona | Founder-led creative technology studio';
const HOME_EN_DESCRIPTION = 'Cinematic campaigns built through creative direction, custom software and specialist AI agents.';
const HOME_HE_TITLE = 'Moona | סטודיו קריאייטיב טכנולוגי בהובלת המייסד';
const HOME_HE_DESCRIPTION = 'קמפיינים קולנועיים שנבנים באמצעות קריאייטיב, פיתוח תוכנה וסוכני AI מתמחים.';
const LEAD_BRIEF = 'We need a cinematic launch film for a new energy-bar brand.';
const PROJECT_ROOT = path.resolve(__dirname, '..');

const errorsByPage = new WeakMap();

test.beforeEach(async ({ page }) => {
  const errors = [];
  errorsByPage.set(page, errors);
  page.on('console', message => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`);
  });
  page.on('pageerror', error => errors.push(`pageerror: ${error.message}`));
  await page.route('https://fonts.googleapis.com/**', route => route.fulfill({
    status: 200,
    contentType: 'text/css',
    body: '/* fonts are intentionally stubbed in E2E */'
  }));
});

test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.annotations.some(annotation => annotation.type === 'expected-console-error')) return;
  expect(errorsByPage.get(page) || [], 'browser console and page errors').toEqual([]);
});

async function waitForI18n(page) {
  await page.waitForFunction(() => Boolean(window.MoonaI18n));
}

async function openHome(page, path = '/') {
  await page.goto(path);
  await waitForI18n(page);
  await expect(page.locator('#loader')).toHaveClass(/done/);
}

async function seedLocaleOnce(page, locale) {
  await page.addInitScript(value => {
    if (sessionStorage.getItem('__moona_e2e_locale_seeded')) return;
    localStorage.setItem('moona.locale', value);
    sessionStorage.setItem('__moona_e2e_locale_seeded', '1');
  }, locale);
}

async function fillLeadForm(page, { brief = LEAD_BRIEF } = {}) {
  await page.evaluate(() => document.querySelector('[data-ask]').click());
  await expect(page.locator('#ask')).toHaveClass(/open/);
  await page.locator('#f-name').fill('Dana Cohen');
  await page.locator('[data-step="0"] [data-next]').click();
  await page.locator('#f-mail').fill('dana@example.com');
  await page.locator('[data-step="1"] [data-next]').click();
  await page.locator('#f-site').fill('example.com');
  await page.locator('[data-step="2"] [data-next]').click();
  await expect(page.locator('[data-step="3"]')).toHaveClass(/active/);
  if (brief !== null) await page.locator('#f-brief').fill(brief);
}

test('critical assets and legal links remain compatible with a direct-file preview', () => {
  const home = fs.readFileSync(path.join(PROJECT_ROOT, 'index.html'), 'utf8');
  const privacy = fs.readFileSync(path.join(PROJECT_ROOT, 'privacy.html'), 'utf8');
  const accessibility = fs.readFileSync(path.join(PROJECT_ROOT, 'accessibility.html'), 'utf8');

  expect(home).toContain('<script src="i18n.js"></script>');
  expect(home).toContain('<script defer src="analytics.js"></script>');
  expect(home).toContain("location.protocol!=='file:'");
  expect(home).toContain('window.__MOONA_BOOT_FAILSAFE__');
  expect(home).not.toContain('<script src="/i18n.js"></script>');
  for (const document of [home, privacy, accessibility]) {
    expect(document).not.toMatch(/(?:href|src)="\/(?:i18n\.js|privacy\.html|accessibility\.html|analytics\.js)"/);
  }
  for (const asset of ['moona-logo-lockup.svg', 'moona-logo-mark.svg']) {
    expect(fs.existsSync(path.join(PROJECT_ROOT, 'p', 'brand', asset))).toBe(true);
  }
});

function metadata(page) {
  return page.evaluate(() => ({
    lang: document.documentElement.lang,
    dir: document.documentElement.dir,
    title: document.title,
    description: document.querySelector('meta[name="description"]')?.content,
    ogLocale: document.querySelector('meta[property="og:locale"]')?.content,
    ogTitle: document.querySelector('meta[property="og:title"]')?.content,
    ogDescription: document.querySelector('meta[property="og:description"]')?.content,
    twitterTitle: document.querySelector('meta[name="twitter:title"]')?.content,
    canonical: document.querySelector('link[rel="canonical"]')?.href
  }));
}

test.describe('locale bootstrap, URL contract, and metadata', () => {
  test('defaults to English without adding a lang parameter', async ({ page }) => {
    await openHome(page, '/?campaign=moon#film');

    await expect.poll(() => metadata(page)).toEqual({
      lang: 'en',
      dir: 'ltr',
      title: HOME_EN_TITLE,
      description: HOME_EN_DESCRIPTION,
      ogLocale: 'en_US',
      ogTitle: HOME_EN_TITLE,
      ogDescription: HOME_EN_DESCRIPTION,
      twitterTitle: HOME_EN_TITLE,
      canonical: 'https://moona-studio-two.vercel.app/'
    });
    const url = new URL(page.url());
    expect(url.searchParams.get('campaign')).toBe('moon');
    expect(url.searchParams.has('lang')).toBe(false);
    expect(url.hash).toBe('#film');
    await expect(page.locator('[data-language-toggle]')).toHaveText('HE');
    await expect(page.locator('[data-language-toggle]')).toHaveAttribute('aria-label', 'Switch to Hebrew');
    await expect(page.locator('#moona-hebrew-fonts')).toHaveCount(0);
  });

  test('valid query wins over storage and Hebrew changes only dynamic metadata', async ({ page }) => {
    await seedLocaleOnce(page, 'en');
    await openHome(page, '/?campaign=moon&lang=he#studio');

    expect(await metadata(page)).toEqual({
      lang: 'he',
      dir: 'rtl',
      title: HOME_HE_TITLE,
      description: HOME_HE_DESCRIPTION,
      ogLocale: 'en_US',
      ogTitle: HOME_EN_TITLE,
      ogDescription: HOME_EN_DESCRIPTION,
      twitterTitle: HOME_EN_TITLE,
      canonical: 'https://moona-studio-two.vercel.app/'
    });
    expect(await page.evaluate(() => localStorage.getItem('moona.locale'))).toBe('he');
    const url = new URL(page.url());
    expect(url.searchParams.get('campaign')).toBe('moon');
    expect(url.searchParams.get('lang')).toBe('he');
    expect(url.hash).toBe('#studio');
    await expect(page.locator('[data-language-toggle]')).toHaveText('EN');
    await expect(page.locator('#moona-hebrew-fonts')).toHaveCount(1);
  });

  test('stored locale becomes shareable and survives reload', async ({ page }) => {
    await seedLocaleOnce(page, 'he');
    await openHome(page, '/?ref=stored#work');

    let url = new URL(page.url());
    expect(url.searchParams.get('lang')).toBe('he');
    expect(url.searchParams.get('ref')).toBe('stored');
    expect(url.hash).toBe('#work');
    await page.locator('[data-language-toggle]').click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    url = new URL(page.url());
    expect(url.searchParams.get('lang')).toBe('en');
    expect(url.searchParams.get('ref')).toBe('stored');
    expect(url.hash).toBe('#work');

    await page.reload();
    await waitForI18n(page);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    expect(await page.evaluate(() => localStorage.getItem('moona.locale'))).toBe('en');
  });

  test('invalid query falls back to storage while preserving query and hash', async ({ page }) => {
    await seedLocaleOnce(page, 'he');
    await openHome(page, '/?lang=fr&utm_source=e2e#contact');

    const url = new URL(page.url());
    expect(url.searchParams.get('lang')).toBe('he');
    expect(url.searchParams.get('utm_source')).toBe('e2e');
    expect(url.hash).toBe('#contact');
    await expect(page.locator('html')).toHaveAttribute('lang', 'he');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  });

  test('blocked storage is fail-safe for query load, switch, and reload', async ({ page }) => {
    await page.addInitScript(() => {
      const blocked = () => { throw new DOMException('E2E blocked storage', 'SecurityError'); };
      Object.defineProperty(Storage.prototype, 'getItem', { configurable: true, value: blocked });
      Object.defineProperty(Storage.prototype, 'setItem', { configurable: true, value: blocked });
    });
    await openHome(page, '/?lang=he&keep=1#film');
    await expect(page.locator('html')).toHaveAttribute('lang', 'he');
    await expect(page.locator('#analyticsConsent [data-locale-link]')).toHaveAttribute('href', '/privacy.html?lang=he');
    await page.locator('[data-language-toggle]').click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('#analyticsConsent [data-locale-link]')).toHaveAttribute('href', '/privacy.html?lang=en');
    expect(new URL(page.url()).searchParams.get('keep')).toBe('1');
    expect(new URL(page.url()).hash).toBe('#film');

    await page.reload();
    await waitForI18n(page);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
  });
});

test.describe('dictionary and first-paint privacy contract', () => {
  test('brand-first bilingual copy preserves the approved Hebrew DUSTLINE narrative', async ({ page }) => {
    await openHome(page, '/?lang=he');

    const headerWordmark = page.locator('.lockup-wordmark');
    await expect(headerWordmark).toHaveAttribute('src', 'p/brand/moona-logo-lockup.svg');
    await expect(headerWordmark).toHaveAttribute('alt', '');
    await expect(page.locator('.hero-wordmark, .hero-chroma, .hero-aperture, #markSvg, #heroIris, .lockup-iris, [data-scramble]')).toHaveCount(0);
    await expect(page.locator('.hero-kicker')).toHaveText('בהובלת המייסד · קריאייטיב טכנולוגי · תל אביב');
    await expect(page.locator('.hero-statement [data-i18n="hero.headline.lead"]')).toHaveText('MOONA STUDIO');
    await expect(page.locator('.hero-statement img')).toHaveAttribute('src', 'p/brand/moona-logo-lockup.svg');
    await expect(page.locator('.hero-statement')).toHaveAttribute('dir', 'ltr');
    await expect(page.locator('.hero-statement-accent')).toHaveCount(0);
    await expect(page.locator('.hero-position')).toHaveText('בימוי · פיתוח תוכנה · הפקת AI');
    await expect(page.locator('.film-head .film-eyebrow')).toHaveText('סרט הדגל');
    await expect(page.locator('.film-title')).toHaveText('יצרנו מותג. וצילמנו לו פרסומת.');
    await expect(page.locator('.film-head .film-note')).toHaveText('DUSTLINE הוא חטיף אנרגיה שאנחנו יצרנו מאפס.');
    await expect(page.locator('.film-credit')).toHaveText('נוצר ב־AI. בוים עד הפריים האחרון.');
    await expect(page.locator('.film-strip-head .film-eyebrow')).toHaveText('מאחורי הסרט');
    await expect(page.locator('.film-strip-head .film-note')).toHaveText('DUSTLINE הוא מותג קונספט מקורי שיצרנו ב־Moona מאפס. הכול התחיל בסיפור. כל פריים תוכנן כדי לשרת את הקריאייטיב ולשמור על עולם עקבי ואמין. אנחנו משלבים כלי AI מתקדמים עם תהליך הפקה קפדני ושליטה מלאה בבימוי, בעריכה ובפוסט.');
    await expect(page.locator('.film-story .film-beat')).toHaveCount(3);
    await expect(page.locator('.film-story .film-beat h3')).toHaveText([
      'לוקיישן שאפשר להאמין בו.',
      'הכול נמצא בפרטים.',
      'קריאייטיב שעובד.'
    ]);
    await expect(page.locator('.film-story .film-beat .beat-copy > p')).toHaveText([
      'הוא נבנה עד הפרט האחרון: מרווח של 0.90 מ׳ בין האבנים, מגדלים בגובה 21 מ׳, שמיים וקרקע שנבנו שכבה אחר שכבה. מבחינתנו, אמינות מתחילה בבסיס, בלוקיישן עצמו.',
      'אמינות הדמויות, העקביות בין השוטים, הלוקיישן ואווירת המסיבה נשמרים לאורך הסרט. הסיפור, התנועה, הצבע ורמת הגימור מקבלים את אותה תשומת לב. כשכל פרט מדויק, הסרט כולו מרגיש אמיתי.',
      'הכול מתחיל בקריאייטיב ובתסריט. הדמויות, הסטיילינג והשפה הוויזואלית נקבעים כבר בשלב הקריאייטיב. משם נבנים הליהוק, תנועות המצלמה, עיצוב הסאונד והעריכה. את החיבור ביניהם רואים בכל פריים של DUSTLINE.'
    ]);

    await expect(page.locator('#about h2')).toHaveText('טל צור');
    await expect(page.locator('.about-role')).toHaveText('מייסד · מנהל קריאייטיב · מפתח');
    await expect(page.locator('.about-body')).toHaveText('הקמתי את Moona בנקודת המפגש בין קריאייטיב לפיתוח תוכנה. אני מוביל כל פרויקט, בונה את המערכות שמאחורי העבודה ומקבל את ההחלטה היצירתית הסופית.');
    await expect(page.locator('.about-engine')).toHaveText('פיתוח תוכנה מותאם · מחקר ופיתוח מתמשך · סוכני AI מתמחים');
    await expect(page.locator('#crew-transition-title')).toHaveText('שישה סוכני AI. בהובלת טל.');
    await expect(page.locator('#crew-title')).toHaveText('המומחים שמאחורי העבודה.');
    await expect(page.locator('.crew-head > p')).toHaveText('בנויים בתוך הסטודיו. בהובלת טל.');
    await expect(page.locator('.work-note')).toHaveText('סרטי הקונספט האלה נוצרו ביוזמתנו כדי להראות מה נוכל ליצור עבור המותג הבא. המותגים המוצגים אינם לקוחות של Moona.');
    await expect(page.locator('[data-i18n="work.bullPadel.concept"]')).toHaveText('המחבט מחזיר חבטה.');
    await expect(page.locator('[data-i18n="work.koda.concept"]')).toHaveText('נבנה לפיד שבו הוא חי.');
    await expect(page.locator('.contact-line')).toHaveText('יש לכם פרויקט ששווה ליצור?');
    await expect(page.locator('.contact-body')).toHaveText('ספרו לנו מה אתם בונים. נחזור אליכם בתוך שני ימי עסקים.');
    await expect(page.locator('[data-i18n="nav.cta"]')).toHaveText('מתחילים פרויקט');
    await expect(page.locator('.hero-actions, .hero-work-link, .hero-project-cta')).toHaveCount(0);
    await expect(page.locator('.contact [data-i18n="hero.cta"]')).toHaveText('מתחילים פרויקט');
    await expect(page.locator('#askTitle')).toHaveText('מתחילים פרויקט');
    await expect(page.locator('#ask')).toHaveAttribute('aria-labelledby', 'askTitle');
    await expect(page.locator('#askSubmit [data-i18n="form.send"]')).toHaveText('שליחת הפרטים');
    await expect(page.locator('#analyticsAccept')).toHaveText('אישור עוגיות');
    await expect(page.locator('#analyticsReject')).toHaveText('דחיית עוגיות');

    expect(await page.evaluate(() => ({
      nav: window.MoonaI18n.t('nav.cta', {}, 'en'),
      hero: window.MoonaI18n.t('hero.cta', {}, 'en'),
      work: window.MoonaI18n.t('hero.workCta', {}, 'en'),
      contact: window.MoonaI18n.t('hero.projectCta', {}, 'en'),
      dialog: window.MoonaI18n.t('form.dialog', {}, 'en'),
      send: window.MoonaI18n.t('form.send', {}, 'en'),
      note: window.MoonaI18n.t('studio.note', {}, 'en')
    }))).toEqual({
      nav: 'Start a project',
      hero: 'Start a project',
      work: 'View work',
      contact: 'Start a project',
      dialog: 'Start a project',
      send: 'Send details',
      note: 'Reply within two business days'
    });

    const bidiContract = await page.evaluate(() => {
      const dustline = document.querySelector('.film-head .brand-ltr');
      const singleSpaceAfter = dustline.nextSibling?.nodeType === Node.TEXT_NODE
        && dustline.nextSibling.textContent === ' ';
      return {
        direction: dustline.getAttribute('dir'),
        text: dustline.textContent,
        singleSpaceAfter,
        brandTokensProtected: [...document.querySelectorAll('bdi.brand-ltr')]
          .every(element => element.getAttribute('dir') === 'ltr')
      };
    });
    expect(bidiContract).toEqual({
      direction: 'ltr',
      text: 'DUSTLINE',
      singleSpaceAfter: true,
      brandTokensProtected: true
    });

    await page.evaluate(() => window.MoonaI18n.setLocale('en', { source: 'programmatic' }));
    await expect(page.locator('.hero-kicker')).toHaveText('Founder-led · Creative technology · Tel Aviv');
    await expect(page.locator('.hero-statement [data-i18n="hero.headline.lead"]')).toHaveText('MOONA STUDIO');
    await expect(page.locator('.hero-statement img')).toHaveAttribute('src', 'p/brand/moona-logo-lockup.svg');
    await expect(page.locator('.hero-statement-accent')).toHaveCount(0);
    await expect(page.locator('.hero-position')).toHaveText('Direction · Software development · AI production');
    await expect(page.locator('.hero-actions, .hero-work-link, .hero-project-cta')).toHaveCount(0);
    await expect(page.locator('.film-title')).toHaveText('We created a brand. Then we shot its ad.');
    await expect(page.locator('.film-head .film-note')).toHaveText('DUSTLINE is an energy bar you cannot buy.');
    await expect(page.locator('.film-credit')).toHaveText('Made with AI. Directed to the final frame.');
    await expect(page.locator('.film-strip-head .film-note')).toHaveText('The world, cast and visual rules were built before motion began. The technology changed the production. It did not replace direction.');
    await expect(page.locator('#about h2')).toHaveText('Tal Tzur');
    await expect(page.locator('.about-role')).toHaveText('Founder · Creative Director · Developer');
    await expect(page.locator('#crew-transition-title')).toHaveText('Six AI agents. Directed by Tal.');
    await expect(page.locator('#crew-title')).toHaveText('Specialists behind the work.');

    const dictionarySource = fs.readFileSync(path.join(__dirname, '..', 'i18n.js'), 'utf8');
    const hebrewStart = dictionarySource.indexOf('\n    he: {');
    const hebrewEnd = dictionarySource.indexOf('\n    }\n  };', hebrewStart);
    expect(dictionarySource.slice(hebrewStart, hebrewEnd)).not.toContain('—');
  });

  test('all DOM keys resolve in both locales, plural forms interpolate, and emphasis survives', async ({ page }) => {
    await openHome(page);
    const homeKeys = await page.evaluate(() => {
      const attributes = [
        'data-i18n', 'data-i18n-alt', 'data-i18n-aria-label', 'data-i18n-placeholder',
        'data-i18n-title', 'data-hint-key', 'data-open-key'
      ];
      return [...new Set(attributes.flatMap(attribute =>
        [...document.querySelectorAll(`[${attribute}]`)].map(element => element.getAttribute(attribute))
      ).filter(Boolean))];
    });
    await page.goto('/privacy.html?lang=he');
    await waitForI18n(page);
    const privacyKeys = await page.evaluate(() => [...new Set(
      ['data-i18n', 'data-i18n-aria-label'].flatMap(attribute =>
        [...document.querySelectorAll(`[${attribute}]`)].map(element => element.getAttribute(attribute))
      ).filter(Boolean)
    )]);
    await page.goto('/accessibility.html?lang=he');
    await waitForI18n(page);
    const accessibilityKeys = await page.evaluate(() => [...new Set(
      ['data-i18n', 'data-i18n-aria-label'].flatMap(attribute =>
        [...document.querySelectorAll(`[${attribute}]`)].map(element => element.getAttribute(attribute))
      ).filter(Boolean)
    )]);
    const unresolved = await page.evaluate(keys => {
      const result = [];
      for (const locale of ['en', 'he']) {
        for (const key of keys) {
          if (window.MoonaI18n.t(key, { count: 3, size: '3.2 MB', name: 'asset.pdf' }, locale) === key) {
            result.push(`${locale}:${key}`);
          }
        }
      }
      return result;
    }, [...new Set([...homeKeys, ...privacyKeys, ...accessibilityKeys])]);
    expect(unresolved).toEqual([]);

    const plurals = await page.evaluate(() => [1, 2, 3].map(count =>
      window.MoonaI18n.t('form.files.notFit', { count, size: '3.2 MB' }, 'he')
    ));
    expect(new Set(plurals).size).toBe(3);
    plurals.forEach(value => expect(value).not.toMatch(/\{(?:count|size)\}/));

    const dictionarySource = fs.readFileSync(path.join(__dirname, '..', 'i18n.js'), 'utf8');
    const pluralBlocks = [...dictionarySource.matchAll(/'form\.files\.notFit':\s*\{([\s\S]*?)\n\s*\}/g)];
    expect(pluralBlocks).toHaveLength(2);
    for (const [, block] of pluralBlocks) {
      for (const category of ['one', 'two', 'many', 'other']) {
        expect(block).toMatch(new RegExp(`\\b${category}:`));
      }
    }

    const fallbacks = await page.evaluate(() => {
      const RealPluralRules = Intl.PluralRules;
      Intl.PluralRules = class { select() { return 'many'; } };
      const many = window.MoonaI18n.t('form.files.notFit', { count: 3, size: '3.2 MB' }, 'he');
      Intl.PluralRules = class { select() { return 'unknown-category'; } };
      const unknown = window.MoonaI18n.t('form.files.notFit', { count: 3, size: '3.2 MB' }, 'he');
      Intl.PluralRules = undefined;
      const withoutIntl = [1, 2, 3].map(count =>
        window.MoonaI18n.t('form.files.notFit', { count, size: '3.2 MB' }, 'he'));
      Intl.PluralRules = RealPluralRules;
      return { many, unknown, withoutIntl };
    });
    expect(fallbacks.many).not.toMatch(/\{(?:count|size)\}/);
    expect(fallbacks.unknown).toBe(plurals[2]);
    expect(new Set(fallbacks.withoutIntl).size).toBe(3);

    await page.goto('/?lang=en');
    await waitForI18n(page);
    const emphasis = await page.evaluate(async () => {
      const elements = [...document.querySelectorAll('em')]
        .filter(element => !element.closest('[hidden]'));
      window.__e2eEmphasisNodes = elements;
      window.MoonaI18n.setLocale('he', { source: 'programmatic' });
      await document.fonts.ready;
      const hebrew = elements.map(element => {
        const style = getComputedStyle(element);
        return {
          text: element.textContent,
          fontStyle: style.fontStyle,
          fontWeight: style.fontWeight,
          color: style.color
        };
      });
      window.MoonaI18n.setLocale('en', { source: 'programmatic' });
      return {
        count: elements.length,
        sameNodes: elements.every((element, index) => element === window.__e2eEmphasisNodes[index]),
        tags: elements.map(element => element.tagName),
        hebrew,
        english: elements.map(element => element.textContent)
      };
    });
    expect(emphasis.count).toBe(1);
    expect(emphasis.sameNodes).toBe(true);
    expect(emphasis.tags).toEqual(['EM']);
    expect(emphasis.hebrew.map(item => item.text)).not.toEqual(emphasis.english);
    for (const item of emphasis.hebrew) {
      expect(item.fontStyle).toBe('normal');
      expect(item.fontWeight).toBe('600');
      expect(item.color).toBe('rgb(243, 233, 210)');
    }
  });

  test('head bootstrap sets Hebrew direction and metadata before the shared runtime arrives', async ({ context, page }) => {
    await context.addCookies([{ name: 'e2e_i18n', value: 'delay', url: BASE_URL }]);
    await page.goto('/?lang=he', { waitUntil: 'commit' });
    await page.waitForFunction(expected => document.title === expected && !window.MoonaI18n, HOME_HE_TITLE);
    expect(await metadata(page)).toMatchObject({
      lang: 'he',
      dir: 'rtl',
      title: HOME_HE_TITLE,
      description: HOME_HE_DESCRIPTION
    });
    await waitForI18n(page);
  });

  test('privacy hides delayed Hebrew copy, then reveals it after translation', async ({ context, page }) => {
    await context.addCookies([{ name: 'e2e_i18n', value: 'delay', url: BASE_URL }]);
    await page.goto('/privacy.html?lang=he', { waitUntil: 'commit' });
    await page.waitForFunction(() => document.body && document.documentElement.classList.contains('i18n-pending'));
    expect(await page.evaluate(() => getComputedStyle(document.body).visibility)).toBe('hidden');

    await waitForI18n(page);
    await expect(page.locator('html')).not.toHaveClass(/i18n-pending/);
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('h1')).toHaveText('הודעת פרטיות');
    await expect(page.locator('.back')).toHaveAttribute('href', '/index.html?lang=he');
  });

  test('accessibility statement hides delayed Hebrew copy and keeps bootstrap metadata in sync', async ({ context, page }) => {
    await context.addCookies([{ name: 'e2e_i18n', value: 'delay', url: BASE_URL }]);
    await page.goto('/accessibility.html?lang=he', { waitUntil: 'commit' });
    await page.waitForFunction(() => document.body && document.documentElement.classList.contains('i18n-pending'));
    const beforeRuntime = await metadata(page);
    expect(beforeRuntime).toMatchObject({
      lang: 'he',
      dir: 'rtl',
      title: 'הצהרת נגישות | Moona',
      description: 'מידע על נגישות אתר Moona ודרכי פנייה בנושא נגישות.'
    });
    expect(await page.evaluate(() => getComputedStyle(document.body).visibility)).toBe('hidden');

    await waitForI18n(page);
    await expect(page.locator('html')).not.toHaveClass(/i18n-pending/);
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('h1')).toHaveText('הצהרת נגישות');
    expect(await metadata(page)).toMatchObject(beforeRuntime);
  });

  test('accessibility statement fails open if the shared translation runtime cannot load', async ({ context, page }, testInfo) => {
    testInfo.annotations.push({ type: 'expected-console-error', description: 'The mocked i18n.js 404 is intentional.' });
    await context.addCookies([{ name: 'e2e_i18n', value: 'fail', url: BASE_URL }]);
    await page.goto('/accessibility.html?lang=he');
    await expect(page.locator('html')).toHaveClass(/i18n-pending/);
    expect(await page.evaluate(() => getComputedStyle(document.body).visibility)).toBe('hidden');

    await expect(page.locator('html')).not.toHaveClass(/i18n-pending/, { timeout: 2_500 });
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('lang', 'he');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    expect(errorsByPage.get(page).some(error => error.includes('404'))).toBe(true);
  });

  test('privacy fails open when the translation runtime cannot load', async ({ context, page }, testInfo) => {
    testInfo.annotations.push({ type: 'expected-console-error', description: 'The mocked i18n.js 404 is intentional.' });
    await context.addCookies([{ name: 'e2e_i18n', value: 'fail', url: BASE_URL }]);
    await page.goto('/privacy.html?lang=he');
    await expect(page.locator('html')).toHaveClass(/i18n-pending/);
    expect(await page.evaluate(() => getComputedStyle(document.body).visibility)).toBe('hidden');

    await expect(page.locator('html')).not.toHaveClass(/i18n-pending/, { timeout: 2_500 });
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('lang', 'he');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    expect(errorsByPage.get(page).some(error => error.includes('404'))).toBe(true);
  });
});

test.describe('locale transitions and state preservation', () => {
  test('switching locale preserves the official header logo and physical hero media stage', async ({ page }) => {
    await openHome(page, '/?lang=en');
    const result = await page.evaluate(() => {
      const headerWordmark = document.querySelector('.lockup-wordmark');
      const heroMedia = document.querySelector('.hero-media');
      headerWordmark.dataset.e2eMarker = 'header-wordmark';
      heroMedia.dataset.e2eMarker = 'hero-media';
      window.MoonaI18n.setLocale('he', { source: 'programmatic' });
      return {
        headerMarker: headerWordmark.dataset.e2eMarker,
        heroMarker: heroMedia.dataset.e2eMarker,
        headerAsset: headerWordmark.getAttribute('src'),
        heroDirection: getComputedStyle(heroMedia).direction,
        statement: document.querySelector('.hero-statement').textContent.replace(/\s+/g, ' ').trim(),
        retiredHeroLayers: document.querySelectorAll('.hero-wordmark, .hero-chroma, .hero-aperture, .hero-actions').length,
        scrambleTargets: document.querySelectorAll('[data-scramble]').length,
        irisTargets: document.querySelectorAll('#markSvg, #heroIris, .lockup-iris').length,
        workTags: document.querySelectorAll('#work .tag').length,
        workSpecBadges: document.querySelectorAll('#work .specbadge').length,
        staleFinal: document.querySelectorAll('[data-final],[data-typed],[data-busy]').length
      };
    });

    expect(result.headerMarker).toBe('header-wordmark');
    expect(result.heroMarker).toBe('hero-media');
    expect(result.headerAsset).toBe('p/brand/moona-logo-lockup.svg');
    expect(result.heroDirection).toBe('ltr');
    expect(result.statement).toBe('MOONA STUDIO');
    expect(result.retiredHeroLayers).toBe(0);
    expect(result.scrambleTargets).toBe(0);
    expect(result.irisTargets).toBe(0);
    expect(result.workTags).toBe(0);
    expect(result.workSpecBadges).toBe(0);
    expect(result.staleFinal).toBe(0);
  });

  test('language switch preserves scroll, form values, step, dialog, and active validation', async ({ page }) => {
    await openHome(page, '/?lang=en&keep=form#work');
    await page.evaluate(() => window.scrollTo(0, 900));
    const beforeScroll = await page.evaluate(() => scrollY);
    await page.locator('[data-language-toggle]').click();
    await expect.poll(() => page.evaluate(() => scrollY)).toBe(beforeScroll);

    await page.evaluate(() => document.querySelector('[data-ask]').click());
    await expect(page.locator('#ask')).toHaveClass(/open/);
    await page.locator('#f-name').fill('Tal Zur');
    await page.locator('[data-step="0"] [data-next]').click();
    await page.locator('#f-mail').fill('invalid-address');
    await page.locator('[data-step="1"] [data-next]').click();
    await expect(page.locator('[data-step="1"] .qhint')).toHaveClass(/err/);
    const expectedHebrew = await page.evaluate(() => window.MoonaI18n.t('form.validation.email', {}, 'he'));

    await page.evaluate(() => window.MoonaI18n.setLocale('he', { source: 'user' }));
    await expect(page.locator('#ask')).toHaveClass(/open/);
    await expect(page.locator('[data-step="1"]')).toHaveClass(/active/);
    await expect(page.locator('#f-name')).toHaveValue('Tal Zur');
    await expect(page.locator('#f-mail')).toHaveValue('invalid-address');
    await expect(page.locator('[data-step="1"] .qhint')).toHaveText(expectedHebrew);
    await expect(page.locator('[data-step="1"] .qhint')).toHaveClass(/err/);
    const url = new URL(page.url());
    expect(url.searchParams.get('keep')).toBe('form');
    expect(url.searchParams.get('lang')).toBe('he');
    expect(url.hash).toBe('#work');
  });
});

test.describe('responsive header and dynamic UI', () => {
  test('DUSTLINE process is a responsive cinematic storyboard with accessible static frames', async ({ page }) => {
    test.setTimeout(90_000);
    for (const locale of ['he', 'en']) {
      for (const width of [360, 390, 700, 701, 768, 1000, 1001, 1440, 2268]) {
      await page.setViewportSize({ width, height: width >= 1001 ? 900 : 844 });
      await openHome(page, `/?lang=${locale}`);
      const story = page.locator('.film-story');
      await story.scrollIntoViewIfNeeded();
      await page.waitForFunction(() => [...document.querySelectorAll('.film-story img')]
        .every(image => image.complete && image.naturalWidth > 0));

      const layout = await story.evaluate(async section => {
        await document.fonts.ready;
        const rect = element => {
          const value = element.getBoundingClientRect();
          return {
            top: value.top, right: value.right, bottom: value.bottom, left: value.left,
            width: value.width, height: value.height
          };
        };
        const cards = [...section.querySelectorAll(':scope > .film-beat')];
        const images = [...section.querySelectorAll('.beat-media img')];
        const cardRects = cards.map(rect);
        const firstMedia = rect(cards[0].querySelector('.beat-media'));
        const firstCopy = rect(cards[0].querySelector('.beat-copy'));
        const bodyStyle = getComputedStyle(cards[0].querySelector('p'));
        const horizontalOverlap = Math.min(firstMedia.right, firstCopy.right)
          - Math.max(firstMedia.left, firstCopy.left);
        return {
          tags: cards.map(card => card.tagName),
          labelsResolve: cards.every(card => {
            const heading = card.querySelector('h3');
            return heading?.id && card.getAttribute('aria-labelledby') === heading.id;
          }),
          interactiveCount: section.querySelectorAll('button,[role="button"],[tabindex]').length,
          videoCount: section.querySelectorAll('video').length,
          imageCount: images.length,
          measurementCount: section.querySelectorAll('.beat-measure').length,
          proofLabels: [...section.querySelectorAll('.beat-media[role="img"]')]
            .map(figure => figure.getAttribute('aria-label')),
          worldMediaAspect: firstMedia.width / firstMedia.height,
          worldObjectPosition: getComputedStyle(cards[0].querySelector('.beat-media img')).objectPosition,
          creativeObjectPosition: getComputedStyle(cards[2].querySelector('.beat-media img')).objectPosition,
          images: images.map(image => ({
            file: new URL(image.currentSrc || image.src).pathname.split('/').pop(),
            srcset: image.getAttribute('srcset'),
            sizes: image.getAttribute('sizes'),
            alt: image.getAttribute('alt'),
            loading: image.loading,
            decoding: image.decoding,
            width: image.getAttribute('width'),
            height: image.getAttribute('height'),
            complete: image.complete,
            naturalWidth: image.naturalWidth
          })),
          cards: cardRects,
          media: firstMedia,
          copy: firstCopy,
          horizontalOverlap,
          bodyFontSize: parseFloat(bodyStyle.fontSize),
          bodyLineHeight: parseFloat(bodyStyle.lineHeight),
          copyFits: cards.every(card => {
            const copy = card.querySelector('.beat-copy');
            return copy.scrollHeight <= copy.clientHeight + 1;
          }),
          overflow: document.documentElement.scrollWidth - innerWidth
        };
      });

      expect(layout.tags).toEqual(['ARTICLE', 'ARTICLE', 'ARTICLE']);
      expect(layout.labelsResolve).toBe(true);
      expect(layout.interactiveCount).toBe(0);
      expect(layout.videoCount).toBe(0);
      expect(layout.imageCount).toBe(5);
      expect(layout.measurementCount).toBe(0);
      expect(layout.proofLabels).toHaveLength(3);
      expect(new Set(layout.proofLabels).size).toBe(3);
      expect(layout.proofLabels.every(Boolean)).toBe(true);
      expect(layout.worldMediaAspect).toBeLessThanOrEqual(2.6);
      expect(layout.worldObjectPosition).toBe('50% 0px');
      expect(layout.creativeObjectPosition).toBe('50% 0px');
      expect(layout.images[0].file).toMatch(/^dustline-world-crowd-(960|1600|2720)\.webp$/);
      expect(layout.images.slice(1, 4).map(image => image.file)).toEqual([
        'dustline-detail-a.webp',
        'dustline-detail-b.webp',
        'dustline-detail-male-12900.webp'
      ]);
      expect(layout.images[4].file).toMatch(/^dustline-creative-04300-(960|1600|1920)\.webp$/);
      expect(layout.images[0].srcset).toBe('p/dustline-world-crowd-960.webp 960w, p/dustline-world-crowd-1600.webp 1600w, p/dustline-world-crowd-2720.webp 2720w');
      expect(layout.images[0].sizes).toBe('(max-width:700px) calc(100vw - 44px), (max-width:1733px) 90vw, 1560px');
      expect(layout.images[4].srcset).toBe('p/dustline-creative-04300-960.webp 960w, p/dustline-creative-04300-1600.webp 1600w, p/dustline-creative-04300-1920.webp 1920w');
      expect(layout.images[4].sizes).toBe('(max-width:700px) calc(100vw - 44px), (max-width:1000px) 40vw, (max-width:1733px) 43vw, 732px');
      const expectedDimensions = [
        ['2720', '1536'],
        ['1280', '720'],
        ['1280', '720'],
        ['1920', '1126'],
        ['1920', '1126']
      ];
      for (const [index, image] of layout.images.entries()) {
        expect(image).toMatchObject({
          alt: '', loading: 'lazy', decoding: 'async',
          width: expectedDimensions[index][0], height: expectedDimensions[index][1], complete: true
        });
        expect(image.naturalWidth).toBeGreaterThan(0);
      }
      expect(layout.bodyFontSize).toBeGreaterThanOrEqual(16);
      expect(layout.bodyLineHeight / layout.bodyFontSize).toBeGreaterThanOrEqual(1.5);
      expect(layout.copyFits).toBe(true);
      expect(layout.overflow).toBeLessThanOrEqual(0);

      if (width <= 700) {
        expect(layout.cards[1].top).toBeGreaterThan(layout.cards[0].bottom);
        expect(layout.cards[2].top).toBeGreaterThan(layout.cards[1].bottom);
        expect(layout.copy.top).toBeGreaterThanOrEqual(layout.media.bottom - 1);
      } else if (width <= 1000) {
        expect(layout.cards[1].top).toBeGreaterThan(layout.cards[0].bottom);
        expect(layout.cards[2].top).toBeGreaterThan(layout.cards[1].bottom);
        expect(layout.horizontalOverlap).toBeLessThanOrEqual(1);
      } else {
        expect(layout.cards[0].width).toBeGreaterThan(layout.cards[1].width * 1.8);
        expect(Math.abs(layout.cards[1].top - layout.cards[2].top)).toBeLessThanOrEqual(1);
        expect(Math.abs(layout.cards[1].width - layout.cards[2].width)).toBeLessThanOrEqual(1);
      }
      }
    }
  });

  test('founder, crew placeholders, and the selected-work grid expose the rebuilt section contract', async ({ page }) => {
    const widths = [390, 1440];
    for (const width of widths) {
      await page.setViewportSize({ width, height: width === 1440 ? 900 : 844 });
      await openHome(page, '/?lang=he');
      const layout = await page.evaluate(async () => {
        await document.fonts.ready;
        const ids = ['film', 'about', 'crew', 'work', 'contact'];
        const sections = ids.map(id => document.getElementById(id));
        const portraits = [...document.querySelectorAll('#crew .crew-portrait')];
        const cards = [...document.querySelectorAll('#crew .crew-card')];
        const workGrid = document.querySelector('#work .work-grid');
        const isRendered = element => element.getClientRects().length > 0;
        return {
          idCounts: ids.map(id => document.querySelectorAll(`#${id}`).length),
          ordered: sections.every((section, index) => index === sections.length - 1
            || Boolean(section.compareDocumentPosition(sections[index + 1]) & Node.DOCUMENT_POSITION_FOLLOWING)),
          studioAlias: {
            parent: document.getElementById('studio')?.parentElement?.id,
            ariaHidden: document.getElementById('studio')?.getAttribute('aria-hidden')
          },
          about: {
            name: document.querySelector('#about h2')?.textContent,
            imageAlt: document.querySelector('#about img')?.alt
          },
          crewNames: cards.map(card => card.querySelector('h3')?.textContent),
          portraitSlots: portraits.map(portrait => {
            const rect = portrait.getBoundingClientRect();
            return {
              ariaHidden: portrait.getAttribute('aria-hidden'),
              childCount: portrait.childElementCount,
              text: portrait.textContent,
              aspectRatio: getComputedStyle(portrait).aspectRatio,
              renderedRatio: rect.width / rect.height
            };
          }),
          workCards: workGrid.querySelectorAll(':scope > [data-piece]').length,
          workColumns: getComputedStyle(workGrid).gridTemplateColumns.split(/\s+/).filter(Boolean).length,
          retiredWorkDetails: document.querySelectorAll('#work .tag, #work .specbadge').length,
          legacy: {
            ctagalRendered: [...document.querySelectorAll('.ctagal')].some(isRendered),
            marqueeRendered: [...document.querySelectorAll('.mq')].some(isRendered),
            sentenceRendered: [...document.querySelectorAll('.sentence')].some(isRendered)
          },
          staleRenderedCopy: /(?:ללא התחייבות|3 ימים|No commitment|3 days)/i.test(document.body.innerText),
          overflow: document.documentElement.scrollWidth - innerWidth
        };
      });

      expect(layout.idCounts).toEqual([1, 1, 1, 1, 1]);
      expect(layout.ordered).toBe(true);
      expect(layout.studioAlias).toEqual({ parent: 'about', ariaHidden: 'true' });
      expect(layout.about).toEqual({ name: 'טל צור', imageAlt: 'טל צור בתוך תא טייס קולנועי בחלל' });
      expect(layout.crewNames).toEqual(['Alma', 'Nara', 'Luc', 'Vera', 'Sona', 'Ivo']);
      expect(layout.portraitSlots).toHaveLength(6);
      for (const portrait of layout.portraitSlots) {
        expect(portrait).toMatchObject({
          ariaHidden: 'true',
          childCount: 0,
          text: '',
          aspectRatio: '5 / 7'
        });
        expect(portrait.renderedRatio).toBeCloseTo(5 / 7, 2);
      }
      expect(layout.workCards).toBe(4);
      expect(layout.workColumns).toBe(width > 760 ? 2 : 1);
      expect(layout.retiredWorkDetails).toBe(0);
      expect(layout.legacy).toEqual({
        ctagalRendered: false,
        marqueeRendered: false,
        sentenceRendered: false
      });
      expect(layout.staleRenderedCopy).toBe(false);
      expect(layout.overflow).toBeLessThanOrEqual(0);
    }
  });

  test('a preloaded concept film starts automatically after scrolling settles', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('moona-analytics-consent', 'denied'));
    await page.setViewportSize({ width: 390, height: 844 });
    await openHome(page, '/?lang=he');
    const piece = page.locator('[data-piece]').first();
    const video = piece.locator('video');

    await page.waitForFunction(() => {
      const first = document.querySelector('[data-piece] video');
      return first && first.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA;
    });
    await piece.evaluate(element => element.scrollIntoView({ block: 'center' }));

    await expect.poll(() => video.evaluate(element => element.paused), {
      message: 'the visible muted concept film should resume once scrolling is idle',
      timeout: 5_000
    }).toBe(false);
    await expect(video).toHaveJSProperty('muted', true);
    const before = await video.evaluate(element => element.currentTime);
    await page.waitForTimeout(450);
    await expect.poll(() => video.evaluate(element => element.currentTime)).toBeGreaterThan(before);

    await page.evaluate(() => window.scrollTo(0, 0));
    await expect.poll(() => video.evaluate(element => element.paused)).toBe(true);
    await piece.evaluate(element => element.scrollIntoView({ block: 'center' }));
    await expect.poll(() => video.evaluate(element => element.paused)).toBe(false);

    /* Keep the playback state and the click in one task. Playwright's actionability
       wait can otherwise overlap the scroll-idle observer and invert the button. */
    await piece.evaluate(async element => {
      const media = element.querySelector('video');
      if (media.paused) await media.play();
      element.querySelector('[data-media-play]').click();
    });
    await expect(piece).toHaveAttribute('data-user-paused', '1');
    await expect.poll(() => video.evaluate(element => element.paused)).toBe(true);
    await page.evaluate(() => window.scrollTo(0, 0));
    await piece.evaluate(element => element.scrollIntoView({ block: 'center' }));
    await page.waitForTimeout(350);
    await expect.poll(() => video.evaluate(element => element.paused)).toBe(true);
  });

  test('deferred concept playback is deduplicated and rechecks pause and visibility', async ({ page }) => {
    await openHome(page, '/?lang=en');
    const result = await page.evaluate(async () => {
      const piece = document.createElement('article');
      piece.dataset.piece = '';
      const video = document.createElement('video');
      piece.appendChild(video);
      document.body.appendChild(piece);

      let readyState = 0;
      let visible = true;
      let playCalls = 0;
      let readinessListeners = 0;
      Object.defineProperty(video, 'readyState', { configurable: true, get: () => readyState });
      video.load = () => {};
      video.play = () => { playCalls += 1; return Promise.resolve(); };
      const addEventListener = video.addEventListener;
      video.addEventListener = function(type, listener, options) {
        if (type === 'canplay' || type === 'loadeddata') readinessListeners += 1;
        return addEventListener.call(this, type, listener, options);
      };
      piece.getBoundingClientRect = () => ({
        top: visible ? 100 : innerHeight + 100,
        bottom: visible ? 300 : innerHeight + 300
      });

      startPiece(piece);
      startPiece(piece);
      piece.dataset.userPaused = '1';
      readyState = HTMLMediaElement.HAVE_FUTURE_DATA;
      video.dispatchEvent(new Event('canplay'));
      video.dispatchEvent(new Event('loadeddata'));
      await Promise.resolve();
      const afterExplicitPause = playCalls;

      delete piece.dataset.userPaused;
      readyState = 0;
      startPiece(piece);
      startPiece(piece);
      visible = false;
      readyState = HTMLMediaElement.HAVE_FUTURE_DATA;
      video.dispatchEvent(new Event('canplay'));
      video.dispatchEvent(new Event('loadeddata'));
      await Promise.resolve();
      const afterLeavingViewport = playCalls;

      visible = true;
      startPiece(piece);
      await Promise.resolve();
      video.dispatchEvent(new Event('canplay'));
      video.dispatchEvent(new Event('loadeddata'));
      await Promise.resolve();
      const finalPlayCalls = playCalls;
      cancelPieceStart(video);
      piece.remove();
      return { afterExplicitPause, afterLeavingViewport, finalPlayCalls, readinessListeners };
    });

    expect(result).toEqual({
      afterExplicitPause: 0,
      afterLeavingViewport: 0,
      finalPlayCalls: 1,
      readinessListeners: 4
    });
  });

  test('resuming motion restores a visible concept film that was still loading', async ({ page }) => {
    await openHome(page, '/?lang=en');
    const result = await page.evaluate(async () => {
      const piece = document.createElement('article');
      piece.dataset.piece = '';
      const video = document.createElement('video');
      piece.appendChild(video);
      document.body.appendChild(piece);

      let readyState = 0;
      let playCalls = 0;
      let readinessListeners = 0;
      Object.defineProperty(video, 'readyState', { configurable: true, get: () => readyState });
      video.load = () => {};
      video.play = () => { playCalls += 1; return Promise.resolve(); };
      const addEventListener = video.addEventListener;
      video.addEventListener = function(type, listener, options) {
        if (type === 'canplay' || type === 'loadeddata') readinessListeners += 1;
        return addEventListener.call(this, type, listener, options);
      };
      piece.getBoundingClientRect = () => ({ top: 100, bottom: 300 });

      startPiece(piece);
      setMotionPaused(true, { persist: false });
      setMotionPaused(false, { persist: false });
      readyState = HTMLMediaElement.HAVE_FUTURE_DATA;
      video.dispatchEvent(new Event('canplay'));
      await Promise.resolve();

      const state = { playCalls, readinessListeners };
      cancelPieceStart(video);
      piece.remove();
      return state;
    });

    expect(result).toEqual({ playCalls: 1, readinessListeners: 4 });
  });

  test('header targets remain separated and contained at the approved widths', async ({ page }) => {
    const widths = [360, 375, 385, 386, 387, 390, 1440];
    for (const locale of ['en', 'he']) {
      for (const width of widths) {
        await page.setViewportSize({ width, height: width === 1440 ? 900 : 844 });
        await page.goto(`/?lang=${locale}`);
        await waitForI18n(page);
        const layout = await page.evaluate(async () => {
          await document.fonts.ready;
          const rect = element => {
            const value = element.getBoundingClientRect();
            return { left: value.left, right: value.right, top: value.top, bottom: value.bottom, width: value.width, height: value.height };
          };
          const header = document.getElementById('hdr');
          const lockup = header.querySelector('.lockup');
          const headerLinks = header.querySelector('.header-links');
          const headerActions = header.querySelector('.header-actions');
          const isVisible = element => {
            const style = getComputedStyle(element);
            return style.display !== 'none' && style.visibility !== 'hidden' && element.getClientRects().length > 0;
          };
          const visibleTargets = [...header.querySelectorAll('a, button')]
            .filter(isVisible)
            .map(element => ({ ...rect(element), minimumHeight: element.matches('.cta-btn.sm') ? 40 : 44 }))
            .sort((a, b) => a.left - b.left);
          const visibleLinkTargets = [...headerLinks.querySelectorAll('button')]
            .filter(isVisible)
            .map(rect).sort((a, b) => a.left - b.left);
          const visibleActionTargets = [...headerActions.querySelectorAll('button')]
            .filter(isVisible)
            .map(rect).sort((a, b) => a.left - b.left);
          const visibleGroups = [lockup, headerLinks, headerActions]
            .filter(isVisible)
            .map(rect).sort((a, b) => a.left - b.left);
          const wordmark = lockup.querySelector('.lockup-wordmark');
          return {
            viewport: innerWidth,
            scrollWidth: document.documentElement.scrollWidth,
            header: rect(header),
            lockup: rect(lockup),
            wordmark: rect(wordmark),
            wordmarkDisplay: getComputedStyle(wordmark).display,
            wordmarkSrc: wordmark.getAttribute('src'),
            headerLinks: rect(headerLinks),
            headerActions: rect(headerActions),
            visibleTargets,
            visibleLinkTargets,
            visibleActionTargets,
            visibleGroups,
            headerLinksDisplay: getComputedStyle(headerLinks).display,
            menuToggleDisplay: getComputedStyle(headerActions.querySelector('[data-mobile-menu-toggle]')).display,
            desktopCtaDisplay: getComputedStyle(headerActions.querySelector('.cta-btn.sm')).display,
            sectionRendered: [...headerLinks.querySelectorAll('.nav-section')].map(isVisible),
            navLetterSpacing: getComputedStyle(headerLinks.querySelector('[data-goto]')).letterSpacing,
            containerType: getComputedStyle(header).containerType
          };
        });

        expect(layout.scrollWidth, `${locale} ${width}px horizontal overflow`).toBeLessThanOrEqual(layout.viewport);
        expect(layout.containerType).toBe('inline-size');
        expect(layout.lockup.width).toBeGreaterThanOrEqual(44);
        expect(layout.lockup.height).toBeGreaterThanOrEqual(44);
        expect(layout.wordmarkDisplay).not.toBe('none');
        expect(layout.wordmarkSrc).toBe('p/brand/moona-logo-lockup.svg');
        for (const target of layout.visibleTargets) {
          expect(target.width).toBeGreaterThanOrEqual(44);
          expect(target.height).toBeGreaterThanOrEqual(target.minimumHeight);
        }
        for (const target of [layout.lockup, layout.wordmark, layout.headerActions]) {
          expect(target.left).toBeGreaterThanOrEqual(-0.5);
          expect(target.right).toBeLessThanOrEqual(layout.viewport + 0.5);
        }
        for (let index = 1; index < layout.visibleGroups.length; index += 1) {
          expect(layout.visibleGroups[index].left - layout.visibleGroups[index - 1].right).toBeGreaterThanOrEqual(6);
        }
        for (const targets of [layout.visibleLinkTargets, layout.visibleActionTargets]) {
          for (let index = 1; index < targets.length; index += 1) {
            expect(targets[index].left - targets[index - 1].right).toBeGreaterThanOrEqual(6);
          }
        }
        expect(layout.menuToggleDisplay === 'none').toBe(width > 700);
        expect(layout.desktopCtaDisplay === 'none').toBe(width <= 700);
        expect(layout.headerLinksDisplay === 'none').toBe(width <= 700);
        expect(layout.sectionRendered.every(Boolean)).toBe(width > 700);
        if (width > 700) {
          expect(Math.abs((layout.headerLinks.left + layout.headerLinks.right) / 2 - layout.viewport / 2)).toBeLessThanOrEqual(2);
        }
        if (locale === 'he') expect(['0px', 'normal']).toContain(layout.navLetterSpacing);
      }
    }
  });

  test('future-video hero keeps media physical across locales and leaves the film unobstructed', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openHome(page, '/?lang=en');

    const heroVideo = page.locator('.hero-media-video');
    await expect(page.locator('.hero-media')).toBeVisible();
    await expect(page.locator('.hero-statement')).toBeVisible();
    await expect(page.locator('.hero-actions, .hero-corner, .hero-corner--work, .hero-corner--project, .hero-project-cta, .hero-work-link, .hero-aperture')).toHaveCount(0);
    await expect(heroVideo).toHaveAttribute('hidden', '');
    await expect(heroVideo).toHaveAttribute('muted', '');
    await expect(heroVideo).toHaveAttribute('loop', '');
    await expect(heroVideo).toHaveAttribute('playsinline', '');
    await expect(heroVideo).toHaveAttribute('preload', 'none');
    await expect(heroVideo).not.toHaveAttribute('autoplay', /.+/);
    await expect(page.locator('[data-mobile-menu-toggle]')).toBeHidden();

    const inspectDesktopHero = () => page.evaluate(() => {
      const box = element => {
        const value = element.getBoundingClientRect();
        return { left: value.left, right: value.right, top: value.top, bottom: value.bottom, width: value.width, height: value.height };
      };
      const media = document.querySelector('.hero-media');
      const fallback = document.querySelector('.hero-media-fallback');
      const video = document.querySelector('.hero-media-video');
      return {
        ratio: document.getElementById('hero-track').offsetHeight / innerHeight,
        viewportWidth: innerWidth,
        viewportHeight: innerHeight,
        media: box(media),
        stage: box(document.querySelector('.hero-brand-stage')),
        statement: box(document.querySelector('.hero-statement')),
        position: box(document.querySelector('.hero-position')),
        mediaDirection: getComputedStyle(media).direction,
        scrimTransform: getComputedStyle(media, '::after').transform,
        planetRight: getComputedStyle(fallback, '::after').right,
        videoPolicy: {
          hidden: video.hidden,
          muted: video.muted,
          loop: video.loop,
          playsInline: video.playsInline,
          preload: video.preload,
          autoplay: video.autoplay,
          paused: video.paused,
          objectFit: getComputedStyle(video).objectFit,
          objectPosition: getComputedStyle(video).objectPosition
        }
      };
    });

    const englishHero = await inspectDesktopHero();
    await page.evaluate(() => window.MoonaI18n.setLocale('he', { source: 'programmatic' }));
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    const hebrewHero = await inspectDesktopHero();

    for (const layout of [englishHero, hebrewHero]) {
      expect(layout.ratio).toBeCloseTo(1, 2);
      expect(layout.videoPolicy).toEqual({
        hidden: true,
        muted: true,
        loop: true,
        playsInline: true,
        preload: 'none',
        autoplay: false,
        paused: true,
        objectFit: 'cover',
        objectPosition: '50% 50%'
      });
      expect(layout.mediaDirection).toBe('ltr');
      expect(layout.scrimTransform).toBe('none');
      expect(layout.media.left).toBeGreaterThanOrEqual(-1);
      expect(layout.media.right).toBeLessThanOrEqual(layout.viewportWidth + 1);
      expect(layout.media.top).toBeGreaterThanOrEqual(-1);
      expect(layout.media.bottom).toBeLessThanOrEqual(layout.viewportHeight + 1);
      expect(layout.media.width).toBeCloseTo(layout.viewportWidth, 0);
      expect(layout.media.height).toBeCloseTo(layout.viewportHeight, 0);
      for (const element of [layout.statement, layout.position]) {
        expect(element.left).toBeGreaterThanOrEqual(-1);
        expect(element.right).toBeLessThanOrEqual(layout.viewportWidth + 1);
        expect(element.top).toBeGreaterThanOrEqual(-1);
        expect(element.bottom).toBeLessThanOrEqual(layout.viewportHeight + 1);
      }
    }
    expect(hebrewHero.planetRight).toBe(englishHero.planetRight);

    expect(englishHero.stage.left).toBeLessThanOrEqual(1);
    expect(englishHero.stage.right).toBeLessThan(englishHero.viewportWidth);
    expect(englishHero.statement.right).toBeLessThanOrEqual(englishHero.viewportWidth / 2);
    expect(hebrewHero.stage.right).toBeGreaterThanOrEqual(hebrewHero.viewportWidth - 1);
    expect(hebrewHero.stage.left).toBeGreaterThan(0);
    expect(hebrewHero.statement.left).toBeGreaterThanOrEqual(hebrewHero.viewportWidth / 2);

    await page.setViewportSize({ width: 390, height: 844 });
    await page.evaluate(() => window.scrollTo(0, 0));
    const mobileHero = await page.evaluate(() => {
      const box = element => {
        const value = element.getBoundingClientRect();
        return { left: value.left, right: value.right, top: value.top, bottom: value.bottom, width: value.width, height: value.height };
      };
      return {
        ratio: document.getElementById('hero-track').offsetHeight / innerHeight,
        filmTop: document.getElementById('film').getBoundingClientRect().top,
        viewportWidth: innerWidth,
        viewportHeight: innerHeight,
        pageWidth: document.documentElement.scrollWidth,
        media: box(document.querySelector('.hero-media')),
        statement: box(document.querySelector('.hero-statement')),
        kicker: box(document.querySelector('.hero-kicker')),
        position: box(document.querySelector('.hero-position'))
      };
    });
    expect(mobileHero.ratio).toBeCloseTo(1, 2);
    expect(mobileHero.filmTop).toBeLessThanOrEqual(mobileHero.viewportHeight + 1);
    expect(mobileHero.pageWidth).toBeLessThanOrEqual(mobileHero.viewportWidth + 1);
    expect(mobileHero.media.width).toBeCloseTo(mobileHero.viewportWidth, 0);
    expect(mobileHero.media.height).toBeCloseTo(mobileHero.viewportHeight, 0);
    for (const element of [mobileHero.statement, mobileHero.kicker, mobileHero.position]) {
      expect(element.left).toBeGreaterThanOrEqual(-1);
      expect(element.right).toBeLessThanOrEqual(mobileHero.viewportWidth + 1);
      expect(element.top).toBeGreaterThanOrEqual(-1);
      expect(element.bottom).toBeLessThanOrEqual(mobileHero.viewportHeight + 1);
    }

    await page.setViewportSize({ width: 320, height: 568 });
    await page.evaluate(() => window.scrollTo(0, 0));
    const narrowHero = await page.evaluate(() => {
      const box = element => {
        const value = element.getBoundingClientRect();
        return { left: value.left, right: value.right, top: value.top, bottom: value.bottom, width: value.width, height: value.height };
      };
      return {
        viewportWidth: innerWidth,
        viewportHeight: innerHeight,
        pageWidth: document.documentElement.scrollWidth,
        hero: box(document.getElementById('hero-stick')),
        kicker: box(document.querySelector('.hero-kicker')),
        statement: box(document.querySelector('.hero-statement')),
        position: box(document.querySelector('.hero-position'))
      };
    });
    expect(narrowHero.pageWidth).toBeLessThanOrEqual(narrowHero.viewportWidth + 1);
    expect(narrowHero.hero.height).toBeCloseTo(narrowHero.viewportHeight, 0);
    for (const element of [narrowHero.kicker, narrowHero.statement, narrowHero.position]) {
      expect(element.left).toBeGreaterThanOrEqual(-1);
      expect(element.right).toBeLessThanOrEqual(narrowHero.viewportWidth + 1);
      expect(element.top).toBeGreaterThanOrEqual(-1);
      expect(element.bottom).toBeLessThanOrEqual(narrowHero.viewportHeight + 1);
    }

    const menuToggle = page.locator('[data-mobile-menu-toggle]');
    await expect(menuToggle).toBeVisible();
    await expect(menuToggle).toHaveAttribute('aria-expanded', 'false');
    await menuToggle.click();
    await expect(menuToggle).toHaveAttribute('aria-expanded', 'true');
    await expect(menuToggle).toHaveAttribute('aria-label', 'סגירת תפריט');
    await expect(page.locator('#mobileMenu')).toBeVisible();
    const menuTargets = await page.locator('#mobileMenu button').evaluateAll(elements => elements.map(element => {
      const rect = element.getBoundingClientRect();
      return { width: rect.width, height: rect.height };
    }));
    menuTargets.forEach(target => {
      expect(target.width).toBeGreaterThanOrEqual(44);
      expect(target.height).toBeGreaterThanOrEqual(44);
    });
    await page.keyboard.press('Escape');
    await expect(page.locator('#mobileMenu')).toBeHidden();
    await expect(menuToggle).toBeFocused();
    await expect(menuToggle).toHaveAttribute('aria-expanded', 'false');
  });

  test('validation and uploaded-file labels rerender without losing files', async ({ page }) => {
    await openHome(page, '/?lang=en');
    await page.evaluate(() => document.querySelector('[data-ask]').click());
    await page.locator('[data-step="0"] [data-next]').click();
    await expect(page.locator('[data-step="0"] .qhint')).toHaveText('This one we need.');
    await page.evaluate(() => window.MoonaI18n.setLocale('he', { source: 'programmatic' }));
    await expect(page.locator('[data-step="0"] .qhint')).toHaveText('את זה צריך למלא.');

    const files = Array.from({ length: 7 }, (_, index) => ({
      name: index === 0 ? 'לוגו.pdf' : `asset-${index + 1}.pdf`,
      mimeType: 'application/pdf',
      buffer: Buffer.alloc(600 * 1024, index + 1)
    }));
    await page.locator('#f-files').setInputFiles(files);
    await expect(page.locator('.filechip')).toHaveCount(7);
    await expect(page.locator('.filechip.over')).toHaveCount(2);
    const expected = await page.evaluate(() => ({
      note: window.MoonaI18n.t('form.files.notFit', { count: 2, size: '3.2 MB' }),
      remove: window.MoonaI18n.t('form.files.remove', { name: 'לוגו.pdf' })
    }));
    await expect(page.locator('.filenote')).toHaveText(expected.note);
    await expect(page.locator('.filechip').first().locator('button')).toHaveAttribute('aria-label', expected.remove);
    await expect(page.locator('.filechip').first().locator('bdi')).toHaveAttribute('dir', 'auto');
    await expect(page.locator('.filechip').first().locator('b')).toHaveAttribute('dir', 'ltr');
    expect(await page.locator('#f-files').evaluate(input => input.files.length)).toBe(7);

    await page.evaluate(() => document.querySelector('.filechip button').click());
    await expect(page.locator('.filechip')).toHaveCount(6);
    expect(await page.locator('#f-files').evaluate(input => input.files.length)).toBe(6);
  });

  test('media and lightbox labels rerender while media and overlay nodes stay intact', async ({ page }) => {
    await openHome(page, '/?lang=en');
    const initial = await page.evaluate(() => {
      const video = document.querySelector('[data-piece] video');
      const play = video.closest('[data-piece]').querySelector('[data-media-play]');
      Object.defineProperty(video, 'paused', { configurable: true, get: () => true });
      video.dataset.e2eMarker = 'preserved';
      video.dispatchEvent(new Event('pause'));
      const soundVideo = document.querySelector('#film video');
      soundVideo.muted = true;
      return {
        playLabel: play.getAttribute('aria-label'),
        expectedPlay: window.MoonaI18n.t('media.playThisFilm'),
        openLabelsValid: [...document.querySelectorAll('[data-open-key]')].every(element =>
          element.getAttribute('aria-label') === window.MoonaI18n.t(
            element.dataset.openKey,
            { name: element.dataset.openName || 'Moona' }
          )
        )
      };
    });
    expect(initial.playLabel).toBe(initial.expectedPlay);
    expect(initial.openLabelsValid).toBe(true);

    await page.evaluate(() => {
      document.querySelector('#work [data-media-open]').click();
    });
    await expect(page.locator('#lb')).toHaveClass(/open/);
    await page.locator('#lb .lb-stage > *').evaluate(element => { element.dataset.e2eStage = 'preserved'; });
    const stageSource = await page.locator('#lb .lb-stage > *').getAttribute('src');

    await page.evaluate(() => window.MoonaI18n.setLocale('he', { source: 'programmatic' }));
    const translated = await page.evaluate(() => {
      const video = document.querySelector('[data-piece] video');
      const play = video.closest('[data-piece]').querySelector('[data-media-play]');
      const soundVideo = document.querySelector('#film video');
      const sound = document.querySelector('#film [data-media-sound]');
      return {
        mediaMarker: video.dataset.e2eMarker,
        paused: video.paused,
        playLabel: play.getAttribute('aria-label'),
        expectedPlay: window.MoonaI18n.t('media.playThisFilm'),
        muted: soundVideo.muted,
        soundLabel: sound.getAttribute('aria-label'),
        expectedSound: window.MoonaI18n.t('media.soundOn'),
        dialogLabel: document.getElementById('lb').getAttribute('aria-label'),
        expectedDialog: window.MoonaI18n.t('lightbox.label'),
        closeText: document.querySelector('#lb .lb-close').textContent,
        expectedClose: window.MoonaI18n.t('common.close'),
        openLabelsValid: [...document.querySelectorAll('[data-open-key]')].every(element =>
          element.getAttribute('aria-label') === window.MoonaI18n.t(
            element.dataset.openKey,
            { name: element.dataset.openName || 'Moona' }
          )
        )
      };
    });
    expect(translated.mediaMarker).toBe('preserved');
    expect(translated.paused).toBe(true);
    expect(translated.playLabel).toBe(translated.expectedPlay);
    expect(translated.muted).toBe(true);
    expect(translated.soundLabel).toBe(translated.expectedSound);
    expect(translated.dialogLabel).toBe(translated.expectedDialog);
    expect(translated.closeText).toBe(translated.expectedClose);
    expect(translated.openLabelsValid).toBe(true);
    await expect(page.locator('#lb')).toHaveClass(/open/);
    await expect(page.locator('#lb .lb-stage > *')).toHaveAttribute('data-e2e-stage', 'preserved');
    await expect(page.locator('#lb .lb-stage > *')).toHaveAttribute('src', stageSource);
  });

  test('crew rail is keyboard-scrollable and its controls localize and mirror in RTL', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openHome(page, '/?lang=he');
    const rail = page.locator('[data-crew-rail]');
    const previous = page.locator('[data-crew-prev]');
    const next = page.locator('[data-crew-next]');

    await expect(rail).toHaveAttribute('tabindex', '0');
    await expect(previous).toHaveAttribute('aria-label', 'חברי הצוות הקודמים');
    await expect(next).toHaveAttribute('aria-label', 'חברי הצוות הבאים');
    const rtlControls = await page.locator('.crew-controls button').evaluateAll(buttons => buttons.map(button => {
      const rect = button.getBoundingClientRect();
      return {
        width: rect.width,
        height: rect.height,
        arrowTransform: getComputedStyle(button.querySelector('span')).transform
      };
    }));
    for (const control of rtlControls) {
      expect(control.width).toBeGreaterThanOrEqual(44);
      expect(control.height).toBeGreaterThanOrEqual(44);
      expect(control.arrowTransform).not.toBe('none');
    }

    await rail.evaluate(element => { element.dataset.e2eMarker = 'preserved'; });
    const before = await rail.evaluate(element => element.scrollLeft);
    await rail.focus();
    await page.keyboard.press('ArrowRight');
    await expect.poll(() => rail.evaluate((element, start) => Math.abs(element.scrollLeft - start), before)).toBeGreaterThan(1);

    await page.evaluate(() => window.MoonaI18n.setLocale('en', { source: 'programmatic' }));
    await expect(rail).toHaveAttribute('data-e2e-marker', 'preserved');
    await expect(previous).toHaveAttribute('aria-label', 'Previous crew members');
    await expect(next).toHaveAttribute('aria-label', 'Next crew members');
    const ltrTransforms = await page.locator('.crew-controls button span').evaluateAll(spans =>
      spans.map(span => getComputedStyle(span).transform));
    expect(ltrTransforms).toEqual(['none', 'none']);
  });

  test('language control is keyboard operable, labelled, and is not a pressed-state toggle', async ({ page }) => {
    await openHome(page, '/?lang=en');
    const toggle = page.locator('[data-language-toggle]');
    await toggle.focus();
    await expect(toggle).toBeFocused();
    await expect(toggle).not.toHaveAttribute('aria-pressed', /.+/);
    await page.keyboard.press('Enter');
    await expect(page.locator('html')).toHaveAttribute('lang', 'he');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(toggle).toBeFocused();
    await expect(toggle).toHaveText('EN');
    await expect(toggle).toHaveAttribute('aria-label', 'מעבר לאנגלית');
    await expect(page.locator('.skip')).toHaveText('דילוג לעבודות');
  });
});

test.describe('lead submission mocks', () => {
  test('required brief validation gates the payload and success reaches data-step 4', async ({ page }) => {
    let payload;
    await page.route('**/api/lead', route => {
      payload = route.request().postDataJSON();
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true })
      });
    });
    await openHome(page, '/?lang=he');
    await expect(page.locator('#askForm > [data-step]')).toHaveCount(5);
    expect(await page.locator('#askForm > [data-step]').evaluateAll(steps =>
      steps.map(step => step.dataset.step))).toEqual(['0', '1', '2', '3', '4']);

    await fillLeadForm(page, { brief: null });
    await expect(page.locator('#f-brief')).toHaveAttribute('required', '');
    await expect(page.locator('#f-brief')).toHaveAttribute('minlength', '20');
    await page.locator('#askSubmit').click();
    await expect(page.locator('#brief-hint')).toHaveText('את זה צריך למלא.');
    await expect(page.locator('#f-brief')).toHaveAttribute('aria-invalid', 'true');
    expect(payload).toBeUndefined();

    await page.locator('#f-brief').fill('קצר מדי');
    await page.locator('#askSubmit').click();
    await expect(page.locator('#brief-hint')).toHaveText('נשמח לקצת יותר פרטים, בין 20 ל־1,200 תווים.');
    await expect(page.locator('#brief-hint')).toHaveClass(/err/);
    expect(payload).toBeUndefined();

    await page.locator('#f-brief').fill(LEAD_BRIEF);
    await page.locator('#askSubmit').click();
    await expect(page.locator('[data-step="4"]')).toHaveClass(/active/);
    await expect(page.locator('[data-step="4"] .qtitle')).toHaveText('קיבלנו.');
    await expect(page.locator('#doneMsg')).toHaveText('נעבור על הפרויקט ונחזור אליכם בתוך שני ימי עסקים.');
    await expect(page.locator('#doneTitle')).toBeFocused();
    expect(payload).toEqual({
      name: 'Dana Cohen',
      company: 'Example',
      website: 'https://example.com',
      email: 'dana@example.com',
      brief: LEAD_BRIEF,
      'bot-field': '',
      files: []
    });
  });

  test('mocked API and hosted fallback failure opens a translated mailto without navigation', async ({ page }) => {
    await page.route('**/api/lead', route => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: false, error: 'send' })
    }));
    await page.route('https://formsubmit.co/ajax/**', route => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: 'false' })
    }));
    await openHome(page, '/?lang=he');
    await page.evaluate(() => {
      window.__e2eMailto = '';
      window.openMailFallback = url => { window.__e2eMailto = url; };
    });
    await fillLeadForm(page);
    await page.locator('#askSubmit').click();
    await page.waitForFunction(() => Boolean(window.__e2eMailto));
    await expect(page.locator('[data-step="3"] .qhint')).toHaveText('לא ניתן לשלוח מכאן. המייל ייפתח במקום.');
    await expect(page.locator('[data-step="3"] .qhint')).toHaveClass(/err/);

    const mailto = await page.evaluate(() => window.__e2eMailto);
    const url = new URL(mailto);
    expect(url.protocol).toBe('mailto:');
    expect(url.pathname).toBe('moona.ai.studio@gmail.com');
    expect(url.searchParams.get('subject')).toBe('פנייה לפרויקט: ⁦Example⁩');
    expect(url.searchParams.get('body')).toContain('שם: Dana Cohen');
    expect(url.searchParams.get('body')).toContain('מותג: Example');
    expect(url.searchParams.get('body')).toContain('אתר: https://example.com');
    expect(url.searchParams.get('body')).toContain('מייל: dana@example.com');
    expect(url.searchParams.get('body')).toContain(`תיאור הפרויקט:\n${LEAD_BRIEF}`);
    expect(page.url()).toContain('?lang=he');
  });
});

test.describe('analytics consent mocks', () => {
  test('a language switch queues exactly one safe event and flushes after consent', async ({ context, page }) => {
    await context.addCookies([{ name: 'e2e_analytics', value: 'enabled', url: BASE_URL }]);
    const providerRequests = [];
    await page.route('https://www.googletagmanager.com/**', route => {
      providerRequests.push(route.request().url());
      return route.fulfill({ status: 200, contentType: 'application/javascript', body: '/* mocked gtag */' });
    });
    await openHome(page, '/?lang=en');
    await expect(page.locator('#analyticsConsent')).toBeVisible();

    await page.locator('[data-language-toggle]').click();
    await expect(page.locator('#analyticsConsent')).toHaveAttribute('aria-label', 'העדפות עוגיות אנליטיקה');
    await page.locator('#analyticsAccept').click();
    await expect(page.locator('#analyticsConsent')).toBeHidden();
    await expect.poll(() => providerRequests.length).toBe(1);
    expect(await page.evaluate(() => localStorage.getItem('moona-analytics-consent'))).toBe('granted');

    const events = await page.evaluate(() => (window.dataLayer || []).map(entry => Array.from(entry))
      .filter(entry => entry[0] === 'event' && entry[1] === 'language_switch')
      .map(entry => entry[2]));
    expect(events).toEqual([{ page_path: '/', from_locale: 'en', to_locale: 'he' }]);
  });

  test('declining consent persists and never requests a provider', async ({ context, page }) => {
    await context.addCookies([{ name: 'e2e_analytics', value: 'enabled', url: BASE_URL }]);
    const providerRequests = [];
    await page.route('https://www.googletagmanager.com/**', route => {
      providerRequests.push(route.request().url());
      return route.fulfill({ status: 200, contentType: 'application/javascript', body: '' });
    });
    await openHome(page);
    await expect(page.locator('#analyticsConsent')).toBeVisible();
    await page.locator('#analyticsReject').click();
    await expect(page.locator('#analyticsConsent')).toBeHidden();
    expect(await page.evaluate(() => localStorage.getItem('moona-analytics-consent'))).toBe('denied');
    await page.locator('[data-language-toggle]').click();
    expect(providerRequests).toEqual([]);

    await page.reload();
    await waitForI18n(page);
    await expect(page.locator('#analyticsConsent')).toBeHidden();
    expect(providerRequests).toEqual([]);
  });
});
