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
  await page.evaluate(() => document.querySelector('[data-hero-contact-cta]').click());
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
  for (const asset of [
    'crew-placeholder-640.avif',
    'crew-placeholder-640.webp',
    'crew-placeholder-960.avif',
    'crew-placeholder-960.webp',
    'crew-placeholder-1600.avif',
    'crew-placeholder-1600.webp'
  ]) {
    expect(fs.existsSync(path.join(PROJECT_ROOT, 'p', 'crew', asset))).toBe(true);
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
    await expect(page.locator('#sky')).toBeVisible();
    await expect(page.locator('#moon')).toBeVisible();
    await expect(page.locator('.statement')).toHaveText('סטודיו AI-native לסרטי מותג ופרסומות');
    await expect(page.locator('.statement-sub span')).toHaveText([
      'מקריאטיב ובימוי ועד הפקה ופוסט,',
      'בשליטה מלאה על כל פריים.'
    ]);
    await expect(page.locator('.hero-cta [data-i18n="common.primaryCta"]')).toHaveText('בואו נדבר');
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
    await expect(page.locator('.crew-transition-body')).toHaveText('כל אנשי הצוות ב־Moona הם סוכני AI מתמחים שנבנו בתוך הסטודיו.');
    await expect(page.locator('#crew-title')).toHaveText('המומחים שמאחורי העבודה.');
    await expect(page.locator('.crew-head > p')).toHaveText('שישה מומחים לסיפור, תמונה, קולנוע, סאונד ומערכות.');
    await expect(page.locator('.work-note')).toHaveText('סרטי הקונספט האלה נוצרו ביוזמתנו כדי להראות מה נוכל ליצור עבור המותג הבא. המותגים המוצגים אינם לקוחות של Moona.');
    await expect(page.locator('[data-i18n="work.bullPadel.concept"]')).toHaveText('המחבט מחזיר חבטה.');
    await expect(page.locator('[data-i18n="work.koda.concept"]')).toHaveText('נבנה לפיד שבו הוא חי.');
    await expect(page.locator('.contact-line')).toHaveText('יש לכם פרויקט ששווה ליצור?');
    await expect(page.locator('.contact-body')).toHaveText('ספרו לנו מה אתם בונים. נחזור אליכם בתוך שני ימי עסקים.');
    await expect(page.locator('[data-header-contact-cta] [data-i18n="common.primaryCta"]')).toHaveText('בואו נדבר');
    await expect(page.locator('[data-i18n="common.primaryCta"]')).toHaveText(['בואו נדבר', 'בואו נדבר']);
    await expect(page.locator('.hero-actions, .hero-work-link, .hero-project-cta')).toHaveCount(0);
    await expect(page.locator('.contact [data-i18n="hero.cta"]')).toHaveText('מתחילים פרויקט');
    await expect(page.locator('#askTitle')).toHaveText('מתחילים פרויקט');
    await expect(page.locator('#ask')).toHaveAttribute('aria-labelledby', 'askTitle');
    await expect(page.locator('#askSubmit [data-i18n="form.send"]')).toHaveText('שליחת הפרטים');
    await expect(page.locator('#analyticsAccept')).toHaveText('אישור עוגיות');
    await expect(page.locator('#analyticsReject')).toHaveText('דחיית עוגיות');

    expect(await page.evaluate(() => ({
      primary: window.MoonaI18n.t('common.primaryCta', {}, 'en'),
      hero: window.MoonaI18n.t('hero.cta', {}, 'en'),
      contact: window.MoonaI18n.t('hero.projectCta', {}, 'en'),
      dialog: window.MoonaI18n.t('form.dialog', {}, 'en'),
      send: window.MoonaI18n.t('form.send', {}, 'en'),
      note: window.MoonaI18n.t('studio.note', {}, 'en')
    }))).toEqual({
      primary: 'LET’S TALK',
      hero: 'Start a project',
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
    await expect(page.locator('.statement')).toHaveText('Cinematic ads, born without a camera');
    await expect(page.locator('.statement-sub span')).toHaveText([
      'An AI-native studio for film and motion ads.',
      'Story, craft and taste first.'
    ]);
    await expect(page.locator('.hero-cta [data-i18n="common.primaryCta"]')).toHaveText('LET’S TALK');
    await expect(page.locator('[data-i18n="common.primaryCta"]')).toHaveText(['LET’S TALK', 'LET’S TALK']);
    await expect(page.locator('.hero-actions, .hero-work-link, .hero-project-cta')).toHaveCount(0);
    await expect(page.locator('.film-title')).toHaveText('We created a brand. Then we shot its ad.');
    await expect(page.locator('.film-head .film-note')).toHaveText('DUSTLINE is an energy bar you cannot buy.');
    await expect(page.locator('.film-credit')).toHaveText('Made with AI. Directed to the final frame.');
    await expect(page.locator('.film-strip-head .film-note')).toHaveText('The world, cast and visual rules were built before motion began. The technology changed the production. It did not replace direction.');
    await expect(page.locator('#about h2')).toHaveText('Tal Tzur');
    await expect(page.locator('.about-role')).toHaveText('Founder · Creative Director · Developer');
    await expect(page.locator('#crew-transition-title')).toHaveText('Six AI agents. Directed by Tal.');
    await expect(page.locator('.crew-transition-body')).toHaveText('Every member of the Moona crew is a specialist AI agent, built inside the studio.');
    await expect(page.locator('#crew-title')).toHaveText('Specialists behind the work.');
    await expect(page.locator('.crew-head > p')).toHaveText('Six specialists across story, image, film, sound and systems.');

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
          hero: Boolean(element.closest('#hero-stick')),
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
    expect(emphasis.count).toBe(2);
    expect(emphasis.sameNodes).toBe(true);
    expect(emphasis.tags).toEqual(['EM', 'EM']);
    expect(emphasis.hebrew.map(item => item.text)).not.toEqual(emphasis.english);
    for (const item of emphasis.hebrew) {
      expect(item.fontStyle).toBe('normal');
      expect(item.fontWeight).toBe(item.hero ? '600' : '700');
      expect(item.color).toBe('rgb(243, 233, 210)');
    }
  });

  test('the restored hero is the only serif typography on the site', async ({ page }) => {
    const displaySelectors = [
      '.film-title', '.film-title em', '.film-beat h3', '.about-copy h2',
      '.crew-transition h2', '.crew-head h2', '.crew-credit h3',
      '.contact .contact-line', '.q .qtitle'
    ];

    for (const locale of ['en', 'he']) {
      await openHome(page, `/?lang=${locale}`);
      const typography = await page.evaluate(selectors => {
        const family = element => getComputedStyle(element).fontFamily;
        const serifPattern = /Instrument Serif|Frank Ruhl Libre/i;
        const outsideHero = [...document.querySelectorAll('body *')]
          .filter(element => element.getClientRects().length > 0)
          .filter(element => !element.closest('#hero-stick'))
          .filter(element => serifPattern.test(family(element)))
          .map(element => `${element.tagName.toLowerCase()}.${element.className}`);
        return {
          heroFamily: family(document.querySelector('.htxt h1.statement')),
          display: selectors.flatMap(selector => [...document.querySelectorAll(selector)]
            .map(element => ({ selector, family: family(element) }))),
          filmEmStyle: getComputedStyle(document.querySelector('.film-title em')).fontStyle,
          filmWeight: getComputedStyle(document.querySelector('.film-title')).fontWeight,
          outsideHero
        };
      }, displaySelectors);

      expect(typography.heroFamily).toContain(locale === 'he' ? 'Frank Ruhl Libre' : 'Instrument Serif');
      expect(typography.display.length).toBeGreaterThanOrEqual(displaySelectors.length);
      for (const item of typography.display) {
        expect(item.family, `${locale} ${item.selector}`).toContain(locale === 'he' ? 'Assistant' : 'Space Grotesk');
      }
      expect(typography.filmEmStyle).toBe('normal');
      expect(typography.filmWeight).toBe(locale === 'he' ? '700' : '600');
      expect(typography.outsideHero).toEqual([]);

      for (const legalPage of ['privacy.html', 'accessibility.html']) {
        await page.goto(`/${legalPage}?lang=${locale}`);
        await waitForI18n(page);
        await expect(page.locator('h1')).toHaveCSS(
          'font-family',
          new RegExp(locale === 'he' ? 'Assistant' : 'Space Grotesk')
        );
      }
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
  test('switching locale preserves the official header logo and production canvas hero', async ({ page }) => {
    await openHome(page, '/?lang=en');
    const result = await page.evaluate(() => {
      const headerWordmark = document.querySelector('.lockup-wordmark');
      const sky = document.getElementById('sky');
      const moon = document.getElementById('moon');
      headerWordmark.dataset.e2eMarker = 'header-wordmark';
      sky.dataset.e2eMarker = 'hero-sky';
      moon.dataset.e2eMarker = 'hero-moon';
      window.MoonaI18n.setLocale('he', { source: 'programmatic' });
      return {
        headerMarker: headerWordmark.dataset.e2eMarker,
        skyMarker: sky.dataset.e2eMarker,
        moonMarker: moon.dataset.e2eMarker,
        headerAsset: headerWordmark.getAttribute('src'),
        statement: document.querySelector('.statement').textContent.replace(/\s+/g, ' ').trim(),
        canvasSizes: [sky, moon].map(canvas => ({ width: canvas.width, height: canvas.height })),
        retiredHeroLayers: document.querySelectorAll('.hero-media, .hero-media-video, .hero-media-fallback, .hero-brand-stage, .hero-wordmark, .hero-chroma, .hero-aperture, .hero-actions').length,
        scrambleTargets: document.querySelectorAll('[data-scramble]').length,
        irisTargets: document.querySelectorAll('#markSvg, #heroIris, .lockup-iris').length,
        workTags: document.querySelectorAll('#work .tag').length,
        workSpecBadges: document.querySelectorAll('#work .specbadge').length,
        staleFinal: document.querySelectorAll('[data-final],[data-typed],[data-busy]').length
      };
    });

    expect(result.headerMarker).toBe('header-wordmark');
    expect(result.skyMarker).toBe('hero-sky');
    expect(result.moonMarker).toBe('hero-moon');
    expect(result.headerAsset).toBe('p/brand/moona-logo-lockup.svg');
    expect(result.statement).toBe('סטודיו AI-native לסרטי מותג ופרסומות');
    expect(result.canvasSizes.every(size => size.width > 0 && size.height > 0)).toBe(true);
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

    await page.evaluate(() => document.querySelector('[data-hero-contact-cta]').click());
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

  test('founder, AI-team introduction, credits grid, and selected work expose the rebuilt section contract', async ({ page }) => {
    const widths = [390, 1440];
    for (const width of widths) {
      await page.setViewportSize({ width, height: width === 1440 ? 900 : 844 });
      await openHome(page, '/?lang=he');
      const firstCrewImage = page.locator('#crew img').first();
      await firstCrewImage.scrollIntoViewIfNeeded();
      await expect.poll(() => firstCrewImage.evaluate(image => image.complete && image.naturalWidth > 0)).toBe(true);
      const layout = await page.evaluate(async () => {
        await document.fonts.ready;
        const ids = ['film', 'work', 'about', 'crew-intro', 'crew', 'contact'];
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
            imageAlt: document.querySelector('#about img')?.alt,
            imageSrc: document.querySelector('#about img')?.getAttribute('src'),
            sourceSrcsets: [...document.querySelectorAll('#about source')]
              .map(source => source.getAttribute('srcset')),
            sourceMedia: [...document.querySelectorAll('#about source')]
              .map(source => source.getAttribute('media'))
          },
          crewTransition: {
            heading: document.querySelector('#crew-transition-title')?.textContent,
            body: document.querySelector('.crew-transition-body')?.textContent,
            mediaCount: document.querySelectorAll('#crew-intro :is(picture, img, source)').length
          },
          sectionAfterFilm: document.querySelector('#film')?.nextElementSibling?.id,
          sectionAfterWork: document.querySelector('#work')?.nextElementSibling?.id,
          sectionAfterAbout: document.querySelector('#about')?.nextElementSibling?.id,
          crewNames: cards.map(card => card.querySelector('h3')?.textContent),
          crewNumbering: document.querySelectorAll('#crew .crew-number').length,
          crewCreditLabels: cards.map(card => card.querySelector('.crew-credit > span')?.textContent),
          crewColumns: getComputedStyle(document.querySelector('#crew .crew-grid'))
            .gridTemplateColumns.split(/\s+/).filter(Boolean).length,
          legacyCrewNavigation: document.querySelectorAll('[data-crew-rail], [data-crew-prev], [data-crew-next]').length,
          portraitSlots: portraits.map(portrait => {
            const rect = portrait.getBoundingClientRect();
            const image = portrait.querySelector('img');
            const source = portrait.querySelector('source[type="image/avif"]');
            return {
              ariaHidden: portrait.getAttribute('aria-hidden'),
              childCount: portrait.childElementCount,
              aspectRatio: getComputedStyle(portrait).aspectRatio,
              renderedRatio: rect.width / rect.height,
              image: {
                alt: image.alt,
                src: image.getAttribute('src'),
                srcset: image.getAttribute('srcset'),
                sizes: image.getAttribute('sizes'),
                width: image.getAttribute('width'),
                height: image.getAttribute('height'),
                loading: image.getAttribute('loading'),
                decoding: image.getAttribute('decoding'),
                objectFit: getComputedStyle(image).objectFit
              },
              avifSrcset: source?.getAttribute('srcset')
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

      expect(layout.idCounts).toEqual([1, 1, 1, 1, 1, 1]);
      expect(layout.ordered).toBe(true);
      expect(layout.studioAlias).toEqual({ parent: 'about', ariaHidden: 'true' });
      expect(layout.about).toEqual({
        name: 'טל צור',
        imageAlt: 'טל צור עומד בחליפת חלל על נוף ירחי',
        imageSrc: 'p/tal/tal-lunar-1920.webp',
        sourceSrcsets: [
          'p/tal/tal-lunar-mobile-900.avif',
          'p/tal/tal-lunar-mobile-900.webp',
          'p/tal/tal-lunar-1920.avif'
        ],
        sourceMedia: [
          '(max-width: 980px) and (orientation: portrait)',
          '(max-width: 980px) and (orientation: portrait)',
          null
        ]
      });
      expect(layout.crewTransition).toEqual({
        heading: 'שישה סוכני AI. בהובלת טל.',
        body: 'כל אנשי הצוות ב־Moona הם סוכני AI מתמחים שנבנו בתוך הסטודיו.',
        mediaCount: 0
      });
      expect(layout.sectionAfterFilm).toBe('work');
      expect(layout.sectionAfterWork).toBe('about');
      expect(layout.sectionAfterAbout).toBe('crew-intro');
      expect(layout.crewNames).toEqual(['Alma', 'Nara', 'Luc', 'Vera', 'Sona', 'Ivo']);
      expect(layout.crewNumbering).toBe(0);
      expect(layout.crewCreditLabels).toEqual(Array(6).fill('AI CREW'));
      expect(layout.crewColumns).toBe(width > 980 ? 3 : 1);
      expect(layout.legacyCrewNavigation).toBe(0);
      expect(layout.portraitSlots).toHaveLength(6);
      for (const portrait of layout.portraitSlots) {
        expect(portrait).toMatchObject({
          ariaHidden: 'true',
          childCount: 1,
          aspectRatio: '10 / 11',
          image: {
            alt: '',
            src: 'p/crew/crew-placeholder-960.webp',
            width: '960',
            height: '1200',
            loading: 'lazy',
            decoding: 'async',
            objectFit: 'cover'
          }
        });
        expect(portrait.image.srcset).toContain('crew-placeholder-1600.webp 1600w');
        expect(portrait.image.sizes).toContain('(max-width:760px)');
        expect(portrait.avifSrcset).toContain('crew-placeholder-1600.avif 1600w');
        expect(portrait.renderedRatio).toBeCloseTo(10 / 11, 2);
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

  test('page rhythm and heading hierarchy stay stable across responsive sizes', async ({ page }) => {
    const viewports = [
      { width: 320, height: 568 },
      { width: 360, height: 800 },
      { width: 390, height: 844, baseline: 'mobile' },
      { width: 768, height: 1024 },
      { width: 918, height: 1022 },
      { width: 1024, height: 768 },
      { width: 844, height: 390 },
      { width: 1440, height: 900, baseline: 'desktop' }
    ];

    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await openHome(page, '/?lang=en');
      await page.locator('#about').scrollIntoViewIfNeeded();
      await expect(page.locator('.about-copy')).toHaveClass(/seen/);
      await expect(page.locator('.about-copy')).toHaveCSS('transform', 'none');
      const layout = await page.evaluate(async () => {
        await document.fonts.ready;
        const px = value => Number.parseFloat(value);
        const style = selector => getComputedStyle(document.querySelector(selector));
        const rect = selector => document.querySelector(selector).getBoundingClientRect();
        const levels = [...document.querySelectorAll('body h1, body h2, body h3')]
          .map(heading => Number(heading.tagName.slice(1)));
        const labelledSections = ['film', 'work', 'about', 'crew-intro', 'crew', 'contact'].map(id => {
          const section = document.getElementById(id);
          const labelId = section.getAttribute('aria-labelledby');
          return {
            id,
            labelId,
            labelTag: document.getElementById(labelId)?.tagName || null
          };
        });
        const junction = (before, after) => Math.abs(rect(after).top - rect(before).bottom);
        const about = document.querySelector('#about');
        const aboutLayout = document.querySelector('.about-layout');
        const aboutCopy = document.querySelector('.about-copy');
        const aboutMedia = document.querySelector('.about-media');
        const aboutImage = aboutMedia.querySelector('img');
        const aboutRect = about.getBoundingClientRect();
        const aboutLayoutRect = aboutLayout.getBoundingClientRect();
        const aboutCopyRect = aboutCopy.getBoundingClientRect();
        const aboutMediaRect = aboutMedia.getBoundingClientRect();
        const aboutImageRect = aboutImage.getBoundingClientRect();
        const aboutCopyStyle = getComputedStyle(aboutCopy);
        const aboutMediaStyle = getComputedStyle(aboutMedia);
        const aboutImageStyle = getComputedStyle(aboutImage);
        const aboutScrimStyle = getComputedStyle(aboutLayout, '::after');
        const aboutCopyBackdrop = aboutCopyStyle.backdropFilter || aboutCopyStyle.webkitBackdropFilter || 'none';
        const intersectionWidth = Math.max(0, Math.min(aboutCopyRect.right, aboutMediaRect.right) - Math.max(aboutCopyRect.left, aboutMediaRect.left));
        const intersectionHeight = Math.max(0, Math.min(aboutCopyRect.bottom, aboutMediaRect.bottom) - Math.max(aboutCopyRect.top, aboutMediaRect.top));

        return {
          overflow: document.documentElement.scrollWidth - innerWidth,
          h1Count: document.querySelectorAll('body h1').length,
          headingSkip: levels.some((level, index) => index > 0 && level > levels[index - 1] + 1),
          labelledSections,
          junctions: {
            filmWork: junction('#film', '#work'),
            workAbout: junction('#work', '#about'),
            aboutCrewIntro: junction('#about', '#crew-intro'),
            crewIntroCrew: junction('#crew-intro', '#crew'),
            crewContact: junction('#crew', '#contact')
          },
          spacing: {
            crewIntroCopyTop: px(style('.crew-transition-copy').paddingTop),
            crewIntroCopyBottom: px(style('.crew-transition-copy').paddingBottom),
            crewTop: px(style('#crew').paddingTop),
            crewBottom: px(style('#crew').paddingBottom),
            workTop: px(style('#work').paddingTop),
            workBottom: px(style('#work').paddingBottom),
            contactTop: px(style('#contact').paddingTop),
            contactBottom: px(style('#contact').paddingBottom)
          },
          aboutSplit: {
            imageLoaded: aboutImage.complete && aboutImage.naturalWidth > 0,
            imageObjectFit: getComputedStyle(aboutImage).objectFit,
            imageFillsMedia:
              Math.abs(aboutImageRect.left - aboutMediaRect.left) <= 1 &&
              Math.abs(aboutImageRect.top - aboutMediaRect.top) <= 1 &&
              Math.abs(aboutImageRect.right - aboutMediaRect.right) <= 1 &&
              Math.abs(aboutImageRect.bottom - aboutMediaRect.bottom) <= 1,
            mediaInsideSection:
              aboutMediaRect.left >= aboutRect.left - 1 &&
              aboutMediaRect.top >= aboutRect.top - 1 &&
              aboutMediaRect.right <= aboutRect.right + 1 &&
              aboutMediaRect.bottom <= aboutRect.bottom + 1,
            mediaCoversSection:
              Math.abs(aboutMediaRect.left - aboutRect.left) <= 1 &&
              Math.abs(aboutMediaRect.top - aboutRect.top) <= 1 &&
              Math.abs(aboutMediaRect.right - aboutRect.right) <= 1 &&
              Math.abs(aboutMediaRect.bottom - aboutRect.bottom) <= 1,
            layoutCoversSection:
              Math.abs(aboutLayoutRect.left - aboutRect.left) <= 1 &&
              Math.abs(aboutLayoutRect.top - aboutRect.top) <= 1 &&
              Math.abs(aboutLayoutRect.right - aboutRect.right) <= 1 &&
              Math.abs(aboutLayoutRect.bottom - aboutRect.bottom) <= 1,
            copyInsideSection:
              aboutCopyRect.left >= aboutRect.left - 1 &&
              aboutCopyRect.top >= aboutRect.top - 1 &&
              aboutCopyRect.right <= aboutRect.right + 1 &&
              aboutCopyRect.bottom <= aboutRect.bottom + 1,
            copyMediaOverlapRatio:
              (intersectionWidth * intersectionHeight) / (aboutCopyRect.width * aboutCopyRect.height),
            copyOverflowX: aboutCopy.scrollWidth - aboutCopy.clientWidth,
            copyOverflowY: aboutCopy.scrollHeight - aboutCopy.clientHeight,
            horizontalSeparation:
              aboutMediaRect.right <= aboutCopyRect.left + 1 ||
              aboutCopyRect.right <= aboutMediaRect.left + 1,
            verticalOverlapRatio: intersectionHeight / Math.min(aboutCopyRect.height, aboutMediaRect.height),
            copyAfterMedia: aboutCopyRect.top >= aboutMediaRect.bottom - 1,
            copyStartRatio: (aboutCopyRect.top - aboutRect.top) / aboutRect.height,
            mediaWidthRatio: aboutMediaRect.width / aboutRect.width,
            sectionAtLeastViewport: aboutRect.height >= innerHeight - 1,
            imageObjectPosition: aboutImageStyle.objectPosition,
            mediaBorderRadius: px(aboutMediaStyle.borderTopLeftRadius),
            scrimBackgroundImage: aboutScrimStyle.backgroundImage,
            copyBackgroundImage: aboutCopyStyle.backgroundImage,
            copyBackgroundColor: aboutCopyStyle.backgroundColor,
            copyBorderWidth: px(aboutCopyStyle.borderTopWidth),
            copyBorderRadius: px(aboutCopyStyle.borderTopLeftRadius),
            hasDepth:
              aboutCopyStyle.boxShadow !== 'none' ||
              aboutCopyBackdrop !== 'none'
          },
          type: {
            hero: px(style('.statement').fontSize),
            film: px(style('.film-title').fontSize),
            about: px(style('.about-copy h2').fontSize),
            crewIntro: px(style('.crew-transition h2').fontSize),
            crew: px(style('.crew-head h2').fontSize),
            contact: px(style('.contact-line').fontSize)
          },
          editorialGrid: {
            workHeadLeft: rect('.work-head').left,
            workHeadRight: rect('.work-head').right,
            workGridLeft: rect('.work-grid').left,
            workGridRight: rect('.work-grid').right,
            crewGridWidth: rect('.crew-grid').width,
            crewColumns: style('.crew-grid').gridTemplateColumns.split(/\s+/).filter(Boolean).length,
            crewCardWidth: rect('.crew-card').width,
            crewColumnGap: px(style('.crew-grid').columnGap)
          }
        };
      });

      expect(layout.overflow).toBeLessThanOrEqual(1);
      expect(layout.h1Count).toBe(1);
      expect(layout.headingSkip).toBe(false);
      expect(layout.labelledSections).toEqual([
        { id: 'film', labelId: 'film-title', labelTag: 'H2' },
        { id: 'work', labelId: 'work-title', labelTag: 'H2' },
        { id: 'about', labelId: 'about-title', labelTag: 'H2' },
        { id: 'crew-intro', labelId: 'crew-transition-title', labelTag: 'H2' },
        { id: 'crew', labelId: 'crew-title', labelTag: 'H2' },
        { id: 'contact', labelId: 'contact-title', labelTag: 'H2' }
      ]);
      Object.values(layout.junctions).forEach(gap => expect(gap).toBeLessThanOrEqual(1));
      expect(layout.aboutSplit.imageLoaded).toBe(true);
      expect(layout.aboutSplit.imageObjectFit).toBe('cover');
      expect(layout.aboutSplit.imageFillsMedia).toBe(true);
      expect(layout.aboutSplit.mediaInsideSection).toBe(true);
      expect(layout.aboutSplit.copyInsideSection).toBe(true);
      expect(layout.aboutSplit.copyOverflowX).toBeLessThanOrEqual(1);
      expect(layout.aboutSplit.copyOverflowY).toBeLessThanOrEqual(1);
      expect(layout.aboutSplit.copyBackgroundImage).toBe('none');
      expect(layout.aboutSplit.copyBackgroundColor).toBe('rgba(0, 0, 0, 0)');
      expect(layout.aboutSplit.copyBorderWidth).toBe(0);
      expect(layout.aboutSplit.copyBorderRadius).toBe(0);
      expect(layout.aboutSplit.hasDepth).toBe(false);
      const isPortraitPhone = viewport.width <= 760 && viewport.height > viewport.width;
      if (isPortraitPhone) {
        expect(layout.aboutSplit.copyMediaOverlapRatio).toBeGreaterThanOrEqual(.99);
        expect(layout.aboutSplit.mediaCoversSection).toBe(true);
        expect(layout.aboutSplit.layoutCoversSection).toBe(true);
        expect(layout.aboutSplit.sectionAtLeastViewport).toBe(true);
        expect(layout.aboutSplit.mediaWidthRatio).toBeCloseTo(1, 2);
        expect(layout.aboutSplit.mediaBorderRadius).toBe(0);
        expect(layout.aboutSplit.scrimBackgroundImage).toContain('linear-gradient');
        expect(layout.aboutSplit.imageObjectPosition).toBe('30% 50%');
        expect(layout.aboutSplit.copyStartRatio).toBeGreaterThan(.35);
      } else {
        expect(layout.aboutSplit.copyMediaOverlapRatio).toBeLessThanOrEqual(.002);
        expect(layout.aboutSplit.horizontalSeparation).toBe(true);
        expect(layout.aboutSplit.verticalOverlapRatio).toBeGreaterThan(.6);
        expect(layout.aboutSplit.mediaWidthRatio).toBeGreaterThan(.42);
      }
      const expectedCrewColumns = viewport.width <= 760 ? 1 : viewport.width <= 980 ? 2 : 3;
      expect(layout.editorialGrid.crewColumns).toBe(expectedCrewColumns);
      expect(layout.editorialGrid.crewCardWidth).toBeCloseTo(
        (layout.editorialGrid.crewGridWidth - layout.editorialGrid.crewColumnGap * (expectedCrewColumns - 1)) / expectedCrewColumns,
        1
      );

      if (viewport.baseline === 'mobile') {
        expect(layout.spacing).toEqual({
          crewIntroCopyTop: 82,
          crewIntroCopyBottom: 92,
          crewTop: 92,
          crewBottom: 110,
          workTop: 100,
          workBottom: 100,
          contactTop: 110,
          contactBottom: 60
        });
        expect(layout.type).toMatchObject({ hero: 34, film: 30, crewIntro: 50, crew: 54, contact: 56 });
        expect(layout.type.about).toBeCloseTo(46.8, 1);
        expect(layout.editorialGrid.crewGridWidth).toBeCloseTo(viewport.width - 44, 1);
        expect(layout.editorialGrid.crewCardWidth).toBeCloseTo(viewport.width - 44, 1);
      }

      if (viewport.baseline === 'desktop') {
        expect(layout.spacing.crewIntroCopyTop).toBeCloseTo(135, 1);
        expect(layout.spacing.crewIntroCopyBottom).toBeCloseTo(90, 1);
        expect(layout.spacing.crewTop).toBeCloseTo(187.2, 1);
        expect(layout.spacing.crewBottom).toBeCloseTo(201.6, 1);
        expect(layout.spacing.workTop).toBeCloseTo(201.6, 1);
        expect(layout.spacing.workBottom).toBeCloseTo(201.6, 1);
        expect(layout.spacing.contactTop).toBeCloseTo(180, 1);
        expect(layout.spacing.contactBottom).toBeCloseTo(60, 1);
        expect(layout.type.hero).toBeCloseTo(82, 1);
        expect(layout.type.film).toBeCloseTo(58, 1);
        expect(layout.type.about).toBeCloseTo(108, 1);
        expect(layout.type.crewIntro).toBeCloseTo(90.72, 1);
        expect(layout.type.crew).toBeCloseTo(86.4, 1);
        expect(layout.type.contact).toBeCloseTo(115.2, 1);
        expect(layout.editorialGrid.workHeadLeft).toBeCloseTo(layout.editorialGrid.workGridLeft, 1);
        expect(layout.editorialGrid.workHeadRight).toBeCloseTo(layout.editorialGrid.workGridRight, 1);
        expect(layout.editorialGrid.crewGridWidth).toBeCloseTo(viewport.width * .9, 1);
      }
    }
  });

  test('short landscape About deep links reveal the complete split composition', async ({ page }) => {
    await page.setViewportSize({ width: 844, height: 390 });

    for (const locale of ['en', 'he']) {
      await openHome(page, `/?lang=${locale}#about`);
      const copy = page.locator('.about-copy');
      await expect(copy).toHaveClass(/seen/);
      await expect(copy).toHaveCSS('opacity', '1');

      const layout = await page.evaluate(() => {
        const about = document.querySelector('#about').getBoundingClientRect();
        const copy = document.querySelector('.about-copy');
        const media = document.querySelector('.about-media');
        const image = media.querySelector('img');
        const copyRect = copy.getBoundingClientRect();
        const mediaRect = media.getBoundingClientRect();
        return {
          aboutTop: about.top,
          copyContained: copyRect.left >= about.left - 1 && copyRect.top >= about.top - 1 &&
            copyRect.right <= about.right + 1 && copyRect.bottom <= about.bottom + 1,
          mediaContained: mediaRect.left >= about.left - 1 && mediaRect.top >= about.top - 1 &&
            mediaRect.right <= about.right + 1 && mediaRect.bottom <= about.bottom + 1,
          horizontallySeparated: copyRect.right <= mediaRect.left + 1 || mediaRect.right <= copyRect.left + 1,
          copyVisible: copyRect.top >= 0 && copyRect.bottom <= innerHeight,
          mediaVisible: mediaRect.top >= 0 && mediaRect.bottom <= innerHeight,
          copyFits: copy.scrollWidth <= copy.clientWidth + 1 && copy.scrollHeight <= copy.clientHeight + 1,
          imageLoaded: image.complete && image.naturalWidth > 0,
          overflow: document.documentElement.scrollWidth - innerWidth
        };
      });

      expect(Math.abs(layout.aboutTop)).toBeLessThanOrEqual(2);
      expect(layout.copyContained).toBe(true);
      expect(layout.mediaContained).toBe(true);
      expect(layout.horizontallySeparated).toBe(true);
      expect(layout.copyVisible).toBe(true);
      expect(layout.mediaVisible).toBe(true);
      expect(layout.copyFits).toBe(true);
      expect(layout.imageLoaded).toBe(true);
      expect(layout.overflow).toBeLessThanOrEqual(1);
    }
  });

  test('founder composition overlays portrait phones and stays disjoint elsewhere', async ({ page }) => {
    for (const locale of ['en', 'he']) {
      for (const viewport of [
        { width: 320, height: 568 },
        { width: 360, height: 800 },
        { width: 390, height: 844 },
        { width: 568, height: 320 },
        { width: 768, height: 1024 },
        { width: 918, height: 1022 },
        { width: 1440, height: 900 }
      ]) {
        await page.setViewportSize(viewport);
        await openHome(page, `/?lang=${locale}#about`);
        const copy = page.locator('.about-copy');
        await copy.scrollIntoViewIfNeeded();
        await expect(copy).toHaveClass(/seen/);
        await expect(copy).toHaveCSS('transform', 'none');
        const split = await page.evaluate(() => {
          const about = document.querySelector('#about');
          const layout = document.querySelector('.about-layout');
          const copy = document.querySelector('.about-copy');
          const media = document.querySelector('.about-media');
          const image = media.querySelector('img');
          const aboutRect = about.getBoundingClientRect();
          const layoutRect = layout.getBoundingClientRect();
          const copyRect = copy.getBoundingClientRect();
          const mediaRect = media.getBoundingClientRect();
          const style = getComputedStyle(copy);
          const mediaStyle = getComputedStyle(media);
          const imageStyle = getComputedStyle(image);
          const scrimStyle = getComputedStyle(layout, '::after');
          const overlapWidth = Math.max(0, Math.min(copyRect.right, mediaRect.right) - Math.max(copyRect.left, mediaRect.left));
          const overlapHeight = Math.max(0, Math.min(copyRect.bottom, mediaRect.bottom) - Math.max(copyRect.top, mediaRect.top));
          return {
            portraitMobile: matchMedia('(max-width:760px) and (orientation:portrait)').matches,
            direction: style.direction,
            background: style.backgroundColor,
            borderWidth: Number.parseFloat(style.borderTopWidth),
            shadow: style.boxShadow,
            backdrop: style.backdropFilter || style.webkitBackdropFilter,
            overlapRatio: overlapWidth * overlapHeight / (copyRect.width * copyRect.height),
            copyContained:
              copyRect.left >= aboutRect.left - 1 &&
              copyRect.top >= aboutRect.top - 1 &&
              copyRect.right <= aboutRect.right + 1 &&
              copyRect.bottom <= aboutRect.bottom + 1,
            mediaFullBleed:
              Math.abs(mediaRect.left - aboutRect.left) <= 1 &&
              Math.abs(mediaRect.top - aboutRect.top) <= 1 &&
              Math.abs(mediaRect.right - aboutRect.right) <= 1 &&
              Math.abs(mediaRect.bottom - aboutRect.bottom) <= 1,
            layoutFullBleed:
              Math.abs(layoutRect.left - aboutRect.left) <= 1 &&
              Math.abs(layoutRect.top - aboutRect.top) <= 1 &&
              Math.abs(layoutRect.right - aboutRect.right) <= 1 &&
              Math.abs(layoutRect.bottom - aboutRect.bottom) <= 1,
            sectionAtLeastViewport: aboutRect.height >= innerHeight - 1,
            copyStartRatio: (copyRect.top - aboutRect.top) / aboutRect.height,
            mediaBorderRadius: Number.parseFloat(mediaStyle.borderTopLeftRadius),
            scrimBackgroundImage: scrimStyle.backgroundImage,
            scrimPointerEvents: scrimStyle.pointerEvents,
            imageObjectPosition: imageStyle.objectPosition,
            imageTransform: imageStyle.transform,
            headingSize: Number.parseFloat(getComputedStyle(copy.querySelector('h2')).fontSize),
            bodySize: Number.parseFloat(getComputedStyle(copy.querySelector('.about-body')).fontSize),
            copyAfterMedia: copyRect.top >= mediaRect.bottom - 1,
            copyBeforeMedia: copyRect.right <= mediaRect.left + 1,
            copyAfterMediaHorizontally: mediaRect.right <= copyRect.left + 1,
            overflow: document.documentElement.scrollWidth - innerWidth
          };
        });

        expect(split.direction).toBe(locale === 'he' ? 'rtl' : 'ltr');
        expect(split.background).toBe('rgba(0, 0, 0, 0)');
        expect(split.borderWidth).toBe(0);
        expect(split.shadow).toBe('none');
        expect(split.backdrop).toBe('none');
        expect(split.copyContained).toBe(true);
        expect(split.overflow).toBeLessThanOrEqual(1);
        expect(split.imageTransform).toBe('none');
        if (split.portraitMobile) {
          expect(split.overlapRatio).toBeGreaterThanOrEqual(.99);
          expect(split.copyAfterMedia).toBe(false);
          expect(split.mediaFullBleed).toBe(true);
          expect(split.layoutFullBleed).toBe(true);
          expect(split.sectionAtLeastViewport).toBe(true);
          expect(split.mediaBorderRadius).toBe(0);
          expect(split.scrimBackgroundImage).toContain('linear-gradient');
          expect(split.scrimPointerEvents).toBe('none');
          expect(split.imageObjectPosition).toBe(locale === 'he' ? '70% 50%' : '30% 50%');
          expect(split.copyStartRatio).toBeGreaterThan(.35);
          expect(split.headingSize).toBeGreaterThanOrEqual(42);
          expect(split.headingSize).toBeLessThanOrEqual(48);
          expect(split.bodySize).toBeGreaterThanOrEqual(15);
          expect(split.bodySize).toBeLessThanOrEqual(16);
        } else {
          expect(split.overlapRatio).toBeLessThanOrEqual(.002);
          expect(split.scrimBackgroundImage).toBe('none');
          if (viewport.width <= 760) {
            expect(split.copyAfterMedia).toBe(true);
          } else if (locale === 'he') {
            expect(split.copyAfterMediaHorizontally).toBe(true);
          } else {
            expect(split.copyBeforeMedia).toBe(true);
          }
        }
      }
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

  test('header contact CTA follows the hero without crowding the approved widths', async ({ page }) => {
    test.setTimeout(120_000);
    const widths = [320, 360, 375, 385, 386, 387, 390, 700, 701, 768, 1440];
    const readLayout = () => page.evaluate(async () => {
      await document.fonts.ready;
      const rect = element => {
        const value = element.getBoundingClientRect();
        return { left: value.left, right: value.right, top: value.top, bottom: value.bottom, width: value.width, height: value.height };
      };
      const header = document.getElementById('hdr');
      const lockup = header.querySelector('.lockup');
      const headerLinks = header.querySelector('.header-links');
      const headerActions = header.querySelector('.header-actions');
      const language = header.querySelector('[data-language-toggle]');
      const contactCta = header.querySelector('[data-header-contact-cta]');
      const heroCta = document.querySelector('[data-hero-contact-cta]');
      const isVisible = element => {
        const style = getComputedStyle(element);
        return style.display !== 'none' && style.visibility !== 'hidden' && element.getClientRects().length > 0;
      };
      const ctaContract = element => {
        const style = getComputedStyle(element);
        const arrow = getComputedStyle(element.querySelector('i'));
        const glow = getComputedStyle(element, '::before');
        return {
          shared: {
            borderRadius: style.borderRadius,
            borderTopWidth: style.borderTopWidth,
            borderTopStyle: style.borderTopStyle,
            borderTopColor: style.borderTopColor,
            backgroundImage: style.backgroundImage,
            backgroundClip: style.backgroundClip,
            backgroundOrigin: style.backgroundOrigin,
            backgroundSize: style.backgroundSize,
            color: style.color,
            fontFamily: style.fontFamily,
            fontWeight: style.fontWeight,
            textTransform: style.textTransform,
            whiteSpace: style.whiteSpace,
            arrowBorderTopColor: arrow.borderTopColor,
            arrowBorderRightColor: arrow.borderRightColor,
            glowDisplay: glow.display,
            glowBackgroundImage: glow.backgroundImage,
            glowFilter: glow.filter
          },
          height: element.getBoundingClientRect().height,
          fontSize: style.fontSize,
          letterSpacing: style.letterSpacing,
          arrowDirection: new DOMMatrix(arrow.transform).a
        };
      };
      const visibleTargets = [...header.querySelectorAll('a, button')]
        .filter(isVisible).map(rect).sort((a, b) => a.left - b.left);
      const visibleLinkTargets = [...headerLinks.querySelectorAll('button')]
        .filter(isVisible).map(rect).sort((a, b) => a.left - b.left);
      const visibleActionTargets = [...headerActions.querySelectorAll('button')]
        .filter(isVisible).map(rect).sort((a, b) => a.left - b.left);
      const visibleGroups = [lockup, headerLinks, headerActions]
        .filter(isVisible).map(rect).sort((a, b) => a.left - b.left);
      const wordmark = lockup.querySelector('.lockup-wordmark');
      const mark = lockup.querySelector('.lockup-mark');
      return {
        viewport: innerWidth,
        scrollWidth: document.documentElement.scrollWidth,
        header: rect(header),
        headerPosition: getComputedStyle(header).position,
        headerHasCta: header.classList.contains('has-header-cta'),
        lockup: rect(lockup),
        wordmark: rect(wordmark),
        wordmarkDisplay: getComputedStyle(wordmark).display,
        wordmarkSrc: wordmark.getAttribute('src'),
        mark: rect(mark),
        markDisplay: getComputedStyle(mark).display,
        markSrc: mark.getAttribute('src'),
        headerLinks: rect(headerLinks),
        headerActions: rect(headerActions),
        language: rect(language),
        contactCta: rect(contactCta),
        contactCtaVisible: isVisible(contactCta),
        contactCtaContract: ctaContract(contactCta),
        heroCtaContract: ctaContract(heroCta),
        visibleTargets,
        visibleLinkTargets,
        visibleActionTargets,
        visibleGroups,
        headerLinksDisplay: getComputedStyle(headerLinks).display,
        menuToggleDisplay: getComputedStyle(headerActions.querySelector('[data-mobile-menu-toggle]')).display,
        sectionRendered: [...headerLinks.querySelectorAll('.nav-section')].map(isVisible),
        navLetterSpacing: getComputedStyle(headerLinks.querySelector('[data-goto]')).letterSpacing,
        containerType: getComputedStyle(header).containerType
      };
    });
    const assertContained = (layout, label) => {
      expect(layout.scrollWidth, `${label} horizontal overflow`).toBeLessThanOrEqual(layout.viewport);
      expect(layout.headerPosition).toBe('fixed');
      expect(layout.containerType).toBe('inline-size');
      expect(layout.lockup.width).toBeGreaterThanOrEqual(44);
      expect(layout.lockup.height).toBeGreaterThanOrEqual(44);
      for (const target of layout.visibleTargets) {
        expect(target.width, `${label} target width`).toBeGreaterThanOrEqual(44);
        expect(target.height, `${label} target height`).toBeGreaterThanOrEqual(44);
      }
      for (const target of [layout.lockup, layout.headerActions]) {
        expect(target.left, `${label} left containment`).toBeGreaterThanOrEqual(-0.5);
        expect(target.right, `${label} right containment`).toBeLessThanOrEqual(layout.viewport + 0.5);
      }
      for (let index = 1; index < layout.visibleGroups.length; index += 1) {
        expect(layout.visibleGroups[index].left - layout.visibleGroups[index - 1].right, `${label} group spacing`).toBeGreaterThanOrEqual(6);
      }
      for (const targets of [layout.visibleLinkTargets, layout.visibleActionTargets]) {
        for (let index = 1; index < targets.length; index += 1) {
          expect(targets[index].left - targets[index - 1].right, `${label} target spacing`).toBeGreaterThanOrEqual(6);
        }
      }
    };

    for (const locale of ['en', 'he']) {
      for (const width of widths) {
        const mobile = width <= 700;
        await page.setViewportSize({ width, height: width === 1440 ? 900 : 844 });
        await page.goto(`/?lang=${locale}`);
        await waitForI18n(page);
        const headerCta = page.locator('[data-header-contact-cta]');
        await expect(headerCta).toBeHidden();

        const atHero = await readLayout();
        assertContained(atHero, `${locale} ${width}px hero`);
        expect(atHero.headerHasCta).toBe(false);
        expect(atHero.contactCtaVisible).toBe(false);
        expect(atHero.wordmarkDisplay).not.toBe('none');
        expect(atHero.markDisplay).toBe('none');
        expect(atHero.wordmarkSrc).toBe('p/brand/moona-logo-lockup.svg');
        expect(atHero.markSrc).toBe('p/brand/moona-logo-mark.svg');

        await page.evaluate(() => {
          const hero = document.getElementById('hero-track');
          window.scrollTo(0, hero.offsetTop + hero.offsetHeight - innerHeight / 2);
        });
        await expect(headerCta).toBeHidden();

        await page.evaluate(() => {
          const hero = document.getElementById('hero-track');
          window.scrollTo(0, hero.offsetTop + hero.offsetHeight + 2);
        });
        await expect(headerCta).toBeVisible();
        await expect(headerCta).toHaveText(locale === 'he' ? 'בואו נדבר' : 'LET’S TALK');

        const belowHero = await readLayout();
        assertContained(belowHero, `${locale} ${width}px below hero`);
        expect(belowHero.headerHasCta).toBe(true);
        expect(belowHero.contactCtaVisible).toBe(true);
        expect(belowHero.header.height).toBeCloseTo(atHero.header.height, 0);
        expect(belowHero.contactCtaContract.shared).toEqual(belowHero.heroCtaContract.shared);
        expect(belowHero.contactCtaContract.shared.borderRadius).toBe('999px');
        expect(belowHero.contactCtaContract.shared.backgroundImage).not.toBe('none');
        expect(belowHero.contactCtaContract.shared.glowDisplay).not.toBe('none');
        expect(belowHero.contactCtaContract.shared.glowBackgroundImage).not.toBe('none');
        expect(belowHero.contactCtaContract.height).toBeGreaterThanOrEqual(44);
        expect(belowHero.heroCtaContract.height).toBeGreaterThanOrEqual(44);
        expect(belowHero.contactCtaContract.height).toBeLessThan(belowHero.heroCtaContract.height);
        expect(Math.sign(belowHero.contactCtaContract.arrowDirection)).toBe(locale === 'he' ? -1 : 1);
        expect(Math.sign(belowHero.heroCtaContract.arrowDirection)).toBe(locale === 'he' ? -1 : 1);
        if (locale === 'he') {
          expect(belowHero.contactCtaContract.shared.fontFamily).toContain('Assistant');
          expect(['0px', 'normal']).toContain(belowHero.contactCtaContract.letterSpacing);
          expect(['0px', 'normal']).toContain(belowHero.heroCtaContract.letterSpacing);
        }
        const languageCtaGap = Math.max(
          belowHero.language.left - belowHero.contactCta.right,
          belowHero.contactCta.left - belowHero.language.right
        );
        expect(languageCtaGap, `${locale} ${width}px language/CTA adjacency`).toBeGreaterThanOrEqual(6);
        expect(languageCtaGap, `${locale} ${width}px language/CTA adjacency`).toBeLessThanOrEqual(14);

        expect(belowHero.menuToggleDisplay === 'none').toBe(!mobile);
        expect(belowHero.headerLinksDisplay === 'none').toBe(mobile);
        expect(belowHero.sectionRendered.every(Boolean)).toBe(!mobile);
        expect(belowHero.wordmarkDisplay === 'none').toBe(mobile);
        expect(belowHero.markDisplay === 'none').toBe(!mobile);
        if (!mobile) {
          expect(Math.abs((belowHero.headerLinks.left + belowHero.headerLinks.right) / 2 - belowHero.viewport / 2)).toBeLessThanOrEqual(2);
        }
        if (locale === 'he') expect(['0px', 'normal']).toContain(belowHero.navLetterSpacing);

        await page.evaluate(() => window.scrollTo(0, 0));
        await expect(headerCta).toBeHidden();
        await expect(page.locator('#hdr')).not.toHaveClass(/has-header-cta/);
        await expect(page.locator('.lockup-wordmark')).toBeVisible();
      }
    }
  });

  test('production canvas hero opens contact and mobile navigation stays accessible', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openHome(page, '/?lang=he');

    await expect(page.locator('#sky')).toBeVisible();
    await expect(page.locator('#moon')).toBeVisible();
    await expect(page.locator('.statement')).toHaveText('סטודיו AI-native לסרטי מותג ופרסומות');
    await expect(page.locator('.statement-sub span')).toHaveText([
      'מקריאטיב ובימוי ועד הפקה ופוסט,',
      'בשליטה מלאה על כל פריים.'
    ]);
    await expect(page.locator('.hero-cta')).toHaveText('בואו נדבר');
    await expect(page.locator('#hud-chapter')).toHaveText('CH·01');
    await expect(page.locator('#hud-progress')).toHaveText(/\d{3}/);
    await expect(page.locator('.hero-media, .hero-media-video, .hero-media-fallback, .hero-brand-stage')).toHaveCount(0);

    const desktopHeroRatio = await page.locator('#hero-track').evaluate(element => element.offsetHeight / innerHeight);
    expect(desktopHeroRatio).toBeGreaterThanOrEqual(1.69);
    expect(desktopHeroRatio).toBeLessThanOrEqual(1.71);
    await expect(page.locator('[data-mobile-menu-toggle]')).toBeHidden();

    await page.locator('.hero-cta').click();
    await expect(page.locator('#ask')).toHaveClass(/open/);
    await expect(page.locator('#f-name')).toBeFocused();
    await page.locator('#askClose').click();
    await expect(page.locator('#ask')).not.toHaveClass(/open/);
    await expect(page.locator('.hero-cta')).toBeFocused();

    await page.locator('.header-links [data-goto="crew-intro"]').click();
    await expect.poll(() => page.evaluate(() => {
      const intro = document.getElementById('crew-intro');
      const header = document.getElementById('hdr');
      return Math.abs(intro.getBoundingClientRect().top - header.offsetHeight);
    })).toBeLessThan(3);
    await expect(page.locator('#crew-intro')).toBeFocused();
    await expect(page.locator('#crew-intro')).toHaveCSS('outline-style', 'none');
    const headerContactCta = page.locator('[data-header-contact-cta]');
    await expect(headerContactCta).toBeVisible();
    await headerContactCta.click();
    await expect(page.locator('#ask')).toHaveClass(/open/);
    await page.locator('#askClose').click();
    await expect(headerContactCta).toBeFocused();

    await page.setViewportSize({ width: 390, height: 844 });
    await page.evaluate(() => window.scrollTo(0, 0));
    const mobileHero = await page.evaluate(() => ({
      ratio: document.getElementById('hero-track').offsetHeight / innerHeight,
      filmTop: document.getElementById('film').getBoundingClientRect().top,
      viewport: innerHeight,
      pageWidth: document.documentElement.scrollWidth,
      viewportWidth: innerWidth
    }));
    expect(mobileHero.ratio).toBeGreaterThanOrEqual(.95);
    expect(mobileHero.ratio).toBeLessThanOrEqual(.97);
    expect(mobileHero.filmTop).toBeLessThan(mobileHero.viewport);
    expect(mobileHero.pageWidth).toBeLessThanOrEqual(mobileHero.viewportWidth + 1);

    const mobileFilmCorners = await page.locator('#film .film-stage').evaluate(stage => {
      const frame = getComputedStyle(stage.querySelector('.film-frame'));
      const soundOverlay = getComputedStyle(stage.querySelector('.film-soundcta'));
      return {
        frameRadii: [frame.borderTopLeftRadius, frame.borderTopRightRadius, frame.borderBottomRightRadius, frame.borderBottomLeftRadius],
        soundRadii: [soundOverlay.borderTopLeftRadius, soundOverlay.borderTopRightRadius, soundOverlay.borderBottomRightRadius, soundOverlay.borderBottomLeftRadius],
        clipPath: frame.clipPath
      };
    });
    expect(new Set(mobileFilmCorners.frameRadii)).toEqual(new Set(['20px']));
    expect(mobileFilmCorners.soundRadii).toEqual(mobileFilmCorners.frameRadii);
    expect(mobileFilmCorners.clipPath).toBe('none');

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
    await page.evaluate(() => document.querySelector('[data-hero-contact-cta]').click());
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

  test('crew credits remain static, complete, and localized without nested horizontal scrolling', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openHome(page, '/?lang=he');
    const grid = page.locator('#crew .crew-grid');

    await expect(grid).not.toHaveAttribute('tabindex', /.+/);
    await expect(page.locator('[data-crew-rail], [data-crew-prev], [data-crew-next]')).toHaveCount(0);
    await expect(grid.locator('.crew-card')).toHaveCount(6);
    await expect(page.locator('#crew-transition-title')).toHaveText('שישה סוכני AI. בהובלת טל.');
    expect(await grid.evaluate(element => element.scrollWidth - element.clientWidth)).toBeLessThanOrEqual(1);

    await grid.evaluate(element => { element.dataset.e2eMarker = 'preserved'; });
    await page.evaluate(() => window.MoonaI18n.setLocale('en', { source: 'programmatic' }));
    await expect(grid).toHaveAttribute('data-e2e-marker', 'preserved');
    await expect(page.locator('#crew-transition-title')).toHaveText('Six AI agents. Directed by Tal.');
    await expect(page.locator('.crew-transition-body')).toHaveText('Every member of the Moona crew is a specialist AI agent, built inside the studio.');
    expect(await grid.evaluate(element => element.scrollWidth - element.clientWidth)).toBeLessThanOrEqual(1);
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
