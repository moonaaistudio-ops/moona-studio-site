const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');

const BASE_URL = `http://127.0.0.1:${Number(process.env.PLAYWRIGHT_PORT || 4317)}`;
const HOME_EN_TITLE = 'Moona | AI-native studio for cinematic brand films';
const HOME_EN_DESCRIPTION = 'We build the world, then film the ad. An AI-native studio making cinematic brand films with uncompromising craft.';
const HOME_HE_TITLE = 'Moona | סטודיו AI-native לסרטי מותג קולנועיים';
const HOME_HE_DESCRIPTION = 'סטודיו AI-native להפקת סרטי מותג ופרסומות ברמה קולנועית.';

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

async function fillLeadForm(page) {
  await page.evaluate(() => document.querySelector('[data-ask]').click());
  await expect(page.locator('#ask')).toHaveClass(/open/);
  await page.locator('#f-name').fill('Dana Cohen');
  await page.locator('[data-step="0"] [data-next]').click();
  await page.locator('#f-mail').fill('dana@example.com');
  await page.locator('[data-step="1"] [data-next]').click();
  await page.locator('#f-site').fill('example.com');
}

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
  test('approved Hebrew brand copy is applied without stale cards or long dashes', async ({ page }) => {
    await openHome(page, '/?lang=he');

    await expect(page.locator('#t1 h1')).toHaveText('סטודיו AI-native לסרטי מותג ופרסומות');
    await expect(page.locator('#t1 h1')).toHaveAccessibleName('סטודיו AI-native לסרטי מותג ופרסומות');
    await expect(page.locator('.statement-sub')).toContainText('מקריאטיב ובימוי ועד הפקה ופוסט,');
    await expect(page.locator('.statement-sub')).toContainText('בשליטה מלאה על כל פריים.');
    await expect(page.locator('#t3')).toHaveCount(0);
    await expect(page.locator('.film-strip-head .film-eyebrow')).toHaveText('מאחורי הסרט');
    await expect(page.locator('.film-title')).toHaveText('המותג שלנו והחוויה שאנחנו יצרנו לו');
    await expect(page.locator('.film-head .film-note')).toHaveText('DUSTLINE הוא חטיף אנרגיה שאנחנו יצרנו מאפס.');
    await expect(page.locator('.film-credit')).toHaveText('כל האלמנטים נוצרו ללא אולפן וללא מצלמה. הם 100% AI.');
    await expect(page.locator('.film-story .film-beat')).toHaveCount(3);
    await expect(page.locator('.film-story .film-beat h3')).toHaveText([
      'לוקיישן שאפשר להאמין בו.',
      'הכול נמצא בפרטים.',
      'קריאייטיב שעובד.'
    ]);
    await expect(page.locator('.work-note')).toHaveText('סרטי הקונספט האלה נוצרו ביוזמתנו כדי להראות מה נוכל ליצור עבור המותג הבא. המותגים המוצגים אינם לקוחות של Moona.');
    await expect(page.locator('[data-i18n="work.bullPadel.concept"]')).toHaveText('המחבט מחזיר חבטה.');
    await expect(page.locator('[data-i18n="work.koda.tag"]')).toHaveText('זה מוצר שהמצאנו מאפס');
    await expect(page.locator('.ctagal-h')).toHaveText('אנחנו מעדיפים להראות במקום לספר.');
    await expect(page.locator('.sentence p')).toHaveText('Moona הוא סטודיו AI-native שיוצר סרטי מותג ופרסומות ברמה קולנועית, גם בלי מצלמה.');
    await expect(page.locator('.contact-line')).toHaveText('עכשיו תורך.');
    await expect(page.locator('[data-i18n="nav.cta"]')).toHaveText('דברו איתנו');
    await expect(page.locator('.hero-cta [data-i18n="hero.workCta"]')).toHaveText('לצפייה בעבודות');
    await expect(page.locator('[data-i18n="hero.cta"]')).toHaveText(['דברו איתנו', 'דברו איתנו']);
    await expect(page.locator('.ctagal-body')).toHaveText('יצירה מוגמרת אחת עם המוצר שלכם.');
    await expect(page.locator('.ctagal-note')).toHaveText('בלי עלות ובלי התחייבות.');
    await expect(page.locator('.contact .cta-sub')).toHaveText('בלי עלות ובלי התחייבות.');
    await expect(page.locator('#askTitle')).toHaveText('ספרו לנו על המותג');
    await expect(page.locator('#ask')).toHaveAttribute('aria-labelledby', 'askTitle');
    await expect(page.locator('#askSubmit [data-i18n="form.send"]')).toHaveText('שליחת הפרטים');
    await expect(page.locator('#analyticsAccept')).toHaveText('אישור עוגיות');
    await expect(page.locator('#analyticsReject')).toHaveText('דחיית עוגיות');

    expect(await page.evaluate(() => ({
      nav: window.MoonaI18n.t('nav.cta', {}, 'en'),
      hero: window.MoonaI18n.t('hero.cta', {}, 'en'),
      work: window.MoonaI18n.t('hero.workCta', {}, 'en'),
      dialog: window.MoonaI18n.t('form.dialog', {}, 'en'),
      send: window.MoonaI18n.t('form.send', {}, 'en'),
      note: window.MoonaI18n.t('studio.note', {}, 'en')
    }))).toEqual({
      nav: 'Talk to us',
      hero: 'Talk to us',
      work: 'View our work',
      dialog: 'Tell us about your brand',
      send: 'Send details',
      note: 'No cost, no commitment.'
    });

    const bidiSpacing = await page.evaluate(() => {
      const heroAi = document.querySelector('#t1 [data-i18n="hero.headline.aiTerm"]');
      const statementAi = document.querySelector('.sentence bdi[lang="en"]:last-of-type');
      const isSingleExternalSpace = node =>
        node?.nodeType === Node.TEXT_NODE && node.textContent === ' ';
      const trimmedKeys = [
        'hero.headline.lead',
        'hero.headline.aiTerm',
        'studio.statement.afterBrand',
        'studio.statement.afterAi'
      ];
      return {
        heroBefore: isSingleExternalSpace(heroAi.previousSibling),
        heroAfter: isSingleExternalSpace(heroAi.nextSibling),
        statementBefore: isSingleExternalSpace(statementAi.previousSibling),
        statementAfter: isSingleExternalSpace(statementAi.nextSibling),
        dictionaryTrimmed: ['en', 'he'].every(locale => trimmedKeys.every(key => {
          const value = window.MoonaI18n.t(key, {}, locale);
          return value === value.trim();
        }))
      };
    });
    expect(bidiSpacing).toEqual({
      heroBefore: true,
      heroAfter: true,
      statementBefore: true,
      statementAfter: true,
      dictionaryTrimmed: true
    });

    const heroGaps = await page.evaluate(() => {
      const fixture = document.createElement('div');
      fixture.className = 'htxt';
      fixture.style.cssText = 'position:fixed;visibility:hidden;inset:0 auto auto 0;transform:none;width:max-content;';
      const clone = document.querySelector('#t1 h1').cloneNode(true);
      clone.removeAttribute('id');
      clone.style.cssText = 'white-space:nowrap;width:max-content;max-width:none;transform:none;';
      fixture.appendChild(clone);
      document.body.appendChild(fixture);
      const [lead, ai, emphasis] = clone.children;
      const gap = (a, b) => {
        const first = a.getBoundingClientRect();
        const second = b.getBoundingClientRect();
        return Math.max(first.left - second.right, second.left - first.right, 0);
      };
      const result = { before: gap(lead, ai), after: gap(ai, emphasis) };
      fixture.remove();
      return result;
    });
    expect(heroGaps.before).toBeGreaterThan(0);
    expect(heroGaps.after).toBeGreaterThan(0);
    expect(Math.abs(heroGaps.before - heroGaps.after)).toBeLessThanOrEqual(1.5);

    await page.evaluate(() => window.MoonaI18n.setLocale('en', { source: 'programmatic' }));
    await expect(page.locator('#t1 h1')).toHaveText('Cinematic ads, born without a camera');
    await expect(page.locator('#t1 h1')).toHaveAccessibleName('Cinematic ads, born without a camera');
    await expect(page.locator('.film-head .film-note')).toHaveText('DUSTLINE is an energy bar you cannot buy.');
    await expect(page.locator('.film-credit')).toHaveText('DUSTLINE · born without a camera');
    await expect(page.locator('.sentence p')).toHaveText('Moona is an AI-native studio making cinematic motion for brands. The camera was optional.');

    const dictionarySource = fs.readFileSync(path.join(__dirname, '..', 'i18n.js'), 'utf8');
    const hebrewStart = dictionarySource.indexOf('\n    he: {');
    const hebrewEnd = dictionarySource.indexOf('\n    }\n  };', hebrewStart);
    expect(dictionarySource.slice(hebrewStart, hebrewEnd)).not.toContain('—');
  });

  test('all DOM keys resolve in both locales, plural forms interpolate, and emphasis survives', async ({ page }) => {
    await openHome(page);
    const homeKeys = await page.evaluate(() => {
      const attributes = [
        'data-i18n', 'data-i18n-aria-label', 'data-i18n-placeholder',
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
      const elements = [...document.querySelectorAll('em')];
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
    expect(emphasis.count).toBe(4);
    expect(emphasis.sameNodes).toBe(true);
    expect(emphasis.tags).toEqual(['EM', 'EM', 'EM', 'EM']);
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
    await expect(page.locator('.back')).toHaveAttribute('href', '/?lang=he');
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

test.describe('animation cancellation and state preservation', () => {
  test('switching locale cancels scramble, active typing, and pending typing', async ({ page }) => {
    await openHome(page, '/?lang=en');
    const result = await page.evaluate(async () => {
      cancelTextAnimations();
      const wordmark = document.querySelector('[data-scramble]');
      const activeTag = document.querySelector('[data-piece] .tag');
      const syntheticPiece = document.createElement('article');
      syntheticPiece.innerHTML = '<p class="tag" data-i18n="work.strava.tag"></p>';
      document.body.appendChild(syntheticPiece);
      const pendingTag = syntheticPiece.querySelector('.tag');

      scramble(wordmark);
      typeTag(activeTag);
      startPiece(syntheticPiece);
      await new Promise(resolve => setTimeout(resolve, 80));
      const wasAnimating = wordmark.dataset.busy === '1' && activeTag.textContent.length > 0;
      window.MoonaI18n.setLocale('he', { source: 'programmatic' });
      const expectedActive = window.MoonaI18n.t(activeTag.dataset.i18n);
      const expectedPending = window.MoonaI18n.t(pendingTag.dataset.i18n);
      await new Promise(resolve => setTimeout(resolve, 850));
      return {
        wasAnimating,
        wordmark: wordmark.textContent,
        wordmarkBusy: wordmark.hasAttribute('data-busy'),
        activeText: activeTag.textContent,
        activeExpected: expectedActive,
        pendingText: pendingTag.textContent,
        pendingExpected: expectedPending,
        staleFinal: document.querySelectorAll('[data-final],[data-typed],[data-busy]').length
      };
    });

    expect(result.wasAnimating).toBe(true);
    expect(result.wordmark).toBe('MOONA');
    expect(result.wordmarkBusy).toBe(false);
    expect(result.activeText).toBe(result.activeExpected);
    expect(result.pendingText).toBe(result.pendingExpected);
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
          const nav = header.querySelector('nav');
          const buttons = [...nav.children]
            .filter(element => element.tagName === 'BUTTON' && getComputedStyle(element).display !== 'none')
            .map(rect).sort((a, b) => a.left - b.left);
          return {
            viewport: innerWidth,
            scrollWidth: document.documentElement.scrollWidth,
            header: rect(header),
            lockup: rect(lockup),
            nav: rect(nav),
            buttons,
            toggle: rect(nav.querySelector('[data-language-toggle]')),
            menuToggleDisplay: getComputedStyle(nav.querySelector('[data-mobile-menu-toggle]')).display,
            sectionDisplays: [...nav.querySelectorAll(':scope > .nav-section')].map(element => getComputedStyle(element).display),
            wordmarkDisplay: getComputedStyle(lockup.querySelector('.lockup-name')).display,
            navLetterSpacing: getComputedStyle(nav.querySelector('[data-goto]')).letterSpacing,
            containerType: getComputedStyle(header).containerType
          };
        });

        expect(layout.scrollWidth, `${locale} ${width}px horizontal overflow`).toBeLessThanOrEqual(layout.viewport);
        expect(layout.containerType).toBe('inline-size');
        expect(layout.lockup.width).toBeGreaterThanOrEqual(44);
        expect(layout.lockup.height).toBeGreaterThanOrEqual(44);
        for (const target of layout.buttons) {
          expect(target.width).toBeGreaterThanOrEqual(44);
          expect(target.height).toBeGreaterThanOrEqual(44);
        }
        expect(layout.lockup.left).toBeGreaterThanOrEqual(-0.5);
        expect(layout.nav.left).toBeGreaterThanOrEqual(-0.5);
        expect(layout.lockup.right).toBeLessThanOrEqual(layout.viewport + 0.5);
        expect(layout.nav.right).toBeLessThanOrEqual(layout.viewport + 0.5);
        const topLevel = [layout.lockup, layout.nav].sort((a, b) => a.left - b.left);
        expect(topLevel[1].left - topLevel[0].right).toBeGreaterThanOrEqual(6);
        for (let index = 1; index < layout.buttons.length; index += 1) {
          expect(layout.buttons[index].left - layout.buttons[index - 1].right).toBeGreaterThanOrEqual(6);
        }
        expect(layout.wordmarkDisplay === 'none').toBe(width <= 386);
        expect(layout.menuToggleDisplay === 'none').toBe(width > 700);
        expect(layout.sectionDisplays.every(display => display === 'none')).toBe(width <= 700);
        if (locale === 'he') expect(['0px', 'normal']).toContain(layout.navLetterSpacing);
      }
    }
  });

  test('single-beat hero leads to the work and mobile navigation stays accessible', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openHome(page, '/?lang=he');
    const desktopHeroRatio = await page.locator('#hero-track').evaluate(element => element.offsetHeight / innerHeight);
    expect(desktopHeroRatio).toBeGreaterThanOrEqual(1.69);
    expect(desktopHeroRatio).toBeLessThanOrEqual(1.71);
    await expect(page.locator('[data-mobile-menu-toggle]')).toBeHidden();

    await page.locator('.hero-cta').click();
    await expect(page.locator('#ask')).not.toHaveClass(/open/);
    await expect.poll(() => page.evaluate(() => {
      const film = document.getElementById('film');
      const header = document.getElementById('hdr');
      return Math.abs(film.getBoundingClientRect().top - header.offsetHeight);
    })).toBeLessThan(3);

    await page.setViewportSize({ width: 390, height: 844 });
    await page.evaluate(() => window.scrollTo(0, 0));
    const mobileHero = await page.evaluate(() => ({
      ratio: document.getElementById('hero-track').offsetHeight / innerHeight,
      filmTop: document.getElementById('film').getBoundingClientRect().top,
      viewport: innerHeight
    }));
    expect(mobileHero.ratio).toBeGreaterThanOrEqual(.95);
    expect(mobileHero.ratio).toBeLessThanOrEqual(.97);
    expect(mobileHero.filmTop).toBeLessThan(mobileHero.viewport);

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
      const item = document.querySelector('.mq .mq-track:not([aria-hidden]) .mq-item');
      item.click();
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

  test('RTL marquee keeps its physical LTR loop after a complete forced cycle', async ({ page }) => {
    await openHome(page, '/?lang=he');
    const result = await page.evaluate(async () => {
      const rows = [...document.querySelectorAll('.mq')];
      const before = rows.map(row => [...row.querySelectorAll('.mq-track')].map(track => track.children.length));
      rows.forEach(row => row.querySelectorAll('.mq-track').forEach(track => {
        track.style.animationDuration = '50ms';
        track.style.animationPlayState = 'running';
      }));
      await new Promise(resolve => setTimeout(resolve, 140));
      return rows.map((row, index) => {
        const tracks = [...row.querySelectorAll('.mq-track')];
        return {
          rowDirection: getComputedStyle(row).direction,
          trackDirections: tracks.map(track => getComputedStyle(track).direction),
          animationNames: tracks.map(track => getComputedStyle(track).animationName),
          before: before[index],
          after: tracks.map(track => track.children.length),
          widths: tracks.map(track => track.getBoundingClientRect().width),
          rowWidth: row.getBoundingClientRect().width
        };
      });
    });
    for (const row of result) {
      expect(row.rowDirection).toBe('ltr');
      expect(row.trackDirections).toEqual(['ltr', 'ltr']);
      expect(row.animationNames).toEqual(['mq', 'mq']);
      expect(row.after).toEqual(row.before);
      expect(row.after[0]).toBe(row.after[1]);
      row.widths.forEach(width => expect(width).toBeGreaterThanOrEqual(row.rowWidth));
    }
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
  test('successful mocked submission reaches the translated completion state', async ({ page }) => {
    await openHome(page, '/?lang=he');
    await fillLeadForm(page);
    await page.locator('#askSubmit').click();
    await expect(page.locator('[data-step="3"]')).toHaveClass(/active/);
    await expect(page.locator('[data-step="3"] .qtitle')).toHaveText('אנחנו על זה.');
    await expect(page.locator('#doneMsg')).toHaveText('העבודה תגיע למייל בתוך כמה ימים.');
    await expect(page.locator('#doneTitle')).toBeFocused();
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
    await expect(page.locator('[data-step="2"] .qhint')).toHaveText('לא ניתן לשלוח מכאן. המייל ייפתח במקום.');
    await expect(page.locator('[data-step="2"] .qhint')).toHaveClass(/err/);

    const mailto = await page.evaluate(() => window.__e2eMailto);
    const url = new URL(mailto);
    expect(url.protocol).toBe('mailto:');
    expect(url.pathname).toBe('moona.ai.studio@gmail.com');
    expect(url.searchParams.get('subject')).toBe('בקשה לפרסומת: ⁦Example⁩');
    expect(url.searchParams.get('body')).toContain('שם: Dana Cohen');
    expect(url.searchParams.get('body')).toContain('מותג: Example');
    expect(url.searchParams.get('body')).toContain('אתר: https://example.com');
    expect(url.searchParams.get('body')).toContain('מייל: dana@example.com');
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
