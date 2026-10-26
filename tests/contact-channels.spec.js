const { test, expect } = require('@playwright/test');

const WHATSAPP = 'https://wa.me/972544443653';
const MESSAGES = {
  en: 'Hi, I came from the Moona website and would like to talk about a film.',
  he: 'היי, הגעתי מהאתר של Moona ואשמח לדבר על סרטון.'
};
const PHONE = { width: 375, height: 812 };
const DESKTOP = { width: 1440, height: 900 };

test.beforeEach(async ({ page }) => {
  await page.route('https://fonts.googleapis.com/**', route => route.fulfill({
    status: 200, contentType: 'text/css', body: '/* fonts are intentionally stubbed in E2E */'
  }));
});

/* the WhatsApp lines ship switched off; most tests flip the switch to check them */
async function openHome(page, locale, viewport, { whatsapp = 'on' } = {}) {
  await page.setViewportSize(viewport);
  await page.goto(`/?lang=${locale}`);
  await page.waitForFunction(() => window.MoonaI18n && !document.documentElement.classList.contains('i18n-pending'));
  await expect(page.locator('#loader')).toHaveClass(/gone/);
  if (whatsapp) await page.evaluate(value => { document.documentElement.dataset.whatsappSwitch = value; }, whatsapp);
}

const box = (page, selector) => page.locator(selector).first().evaluate(el => {
  const r = el.getBoundingClientRect();
  return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height };
});
const overlaps = (a, b) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;

for (const locale of ['en', 'he']) {
  test(`WhatsApp and phone ship switched off until the inbox works, the email stays (${locale.toUpperCase()})`, async ({ page }) => {
    for (const viewport of [PHONE, DESKTOP]) {
      await openHome(page, locale, viewport, { whatsapp: null });
      await expect(page.locator('html')).toHaveAttribute('data-whatsapp-switch', 'off');
      await page.evaluate(() => window.scrollTo(0, innerHeight * 2));
      await expect(page.locator('.wa-float')).toBeHidden();
      await page.locator('#contact').scrollIntoViewIfNeeded();
      await expect(page.locator('#contact [data-contact-channel="whatsapp"]')).toBeHidden();
      await expect(page.locator('#contact [data-contact-channel="phone"]')).toBeHidden();
      await expect(page.locator('#contact [data-contact-channel="email"]')).toBeVisible();
      const focusable = await page.evaluate(() => [...document.querySelectorAll('[data-whatsapp-line] a, a[data-whatsapp-line]')]
        .filter(link => link.offsetParent !== null || getComputedStyle(link).position === 'fixed' && getComputedStyle(link).display !== 'none').length);
      expect(focusable).toBe(0);
    }
  });
}

for (const locale of ['en', 'he']) {
  test(`floating WhatsApp opens a ${locale.toUpperCase()} first line and clears the hero HUD on a phone`, async ({ page }) => {
    await openHome(page, locale, PHONE);
    const float = page.locator('.wa-float');
    await expect(float).toBeVisible();
    await expect(float).toHaveAttribute('target', '_blank');
    await expect(float).toHaveAttribute('rel', /noopener/);
    await expect(float).toHaveAttribute('aria-label', locale === 'he'
      ? 'וואטסאפ לסטודיו, 054-4443653 (נפתח בוואטסאפ)'
      : 'WhatsApp the studio at 054-4443653 (opens WhatsApp)');

    const href = new URL(await float.getAttribute('href'));
    expect(`${href.origin}${href.pathname}`).toBe(WHATSAPP);
    expect(href.searchParams.get('text')).toBe(MESSAGES[locale]);

    const rect = await box(page, '.wa-float');
    expect(rect.width).toBeGreaterThanOrEqual(44);
    expect(rect.height).toBeGreaterThanOrEqual(44);
    expect(PHONE.width - rect.right).toBeLessThanOrEqual(20);
    for (const hud of ['#hud-chapter', '#hud-name', '#hud-progress']) {
      expect(overlaps(rect, await box(page, hud)), `${hud} stays clear of the button`).toBe(false);
    }
  });

  test(`contact block shows WhatsApp, phone and email in ${locale.toUpperCase()}`, async ({ page }) => {
    await openHome(page, locale, PHONE);
    await page.locator('#contact').scrollIntoViewIfNeeded();
    const row = page.locator('#contact .contact-direct');
    await expect(row.locator('a')).toHaveCount(3);

    const whatsapp = row.locator('[data-contact-channel="whatsapp"]');
    await expect(whatsapp).toHaveText(locale === 'he' ? 'וואטסאפ' : 'WhatsApp');
    expect(new URL(await whatsapp.getAttribute('href')).searchParams.get('text')).toBe(MESSAGES[locale]);

    const phone = row.locator('[data-contact-channel="phone"]');
    await expect(phone).toHaveAttribute('href', 'tel:+972544443653');
    await expect(phone.locator('bdi')).toHaveText('054-4443653');
    await expect(phone.locator('bdi')).toHaveAttribute('dir', 'ltr');

    const email = row.locator('[data-contact-channel="email"]');
    await expect(email).toHaveAttribute('href', 'mailto:tal@moonastudio.ai');
    await expect(email.locator('bdi')).toHaveText('tal@moonastudio.ai');
    await expect(email.locator('bdi')).toHaveAttribute('dir', 'ltr');

    for (const link of await row.locator('a').all()) {
      const { height } = await link.boundingBox();
      expect(Math.round(height)).toBeGreaterThanOrEqual(44);
    }
  });

  test(`the button never sits on the consent notice or the last footer line (${locale.toUpperCase()})`, async ({ page }) => {
    for (const viewport of [{ width: 320, height: 568 }, { width: 360, height: 800 }, PHONE, { width: 390, height: 844 }, DESKTOP]) {
      await openHome(page, locale, viewport);
      await page.evaluate(() => { document.getElementById('analyticsConsent').hidden = false; });
      await page.evaluate(() => window.scrollTo(0, innerHeight * 2));
      await expect(page.locator('.wa-float')).toBeVisible();
      await page.waitForTimeout(450);
      expect(overlaps(await box(page, '.wa-float'), await box(page, '#analyticsConsent'))).toBe(false);

      await page.evaluate(() => { document.getElementById('analyticsConsent').hidden = true; });
      await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
      await page.waitForTimeout(450);
      const float = await box(page, '.wa-float');
      for (const target of await page.locator('.legal-nav :is(a,button), .contact .copy').all()) {
        const rect = await target.evaluate(el => el.getBoundingClientRect().toJSON());
        expect(overlaps(float, rect), 'footer controls stay clear of the button').toBe(false);
      }
    }
  });
}

test('on desktop the button waits until the hero has scrolled away', async ({ page }) => {
  await openHome(page, 'en', DESKTOP);
  await expect(page.locator('.wa-float')).toBeHidden();
  await page.evaluate(() => window.scrollTo(0, innerHeight * 1.5));
  await expect(page.locator('.wa-float')).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(page.locator('.wa-float')).toBeHidden();
});

test('a language switch rewrites the WhatsApp first line', async ({ page }) => {
  await openHome(page, 'en', PHONE);
  await page.evaluate(() => window.MoonaI18n.setLocale('he', { source: 'user' }));
  await expect(page.locator('html')).toHaveAttribute('lang', 'he');
  for (const link of await page.locator('[data-whatsapp]').all()) {
    expect(new URL(await link.getAttribute('href')).searchParams.get('text')).toBe(MESSAGES.he);
  }
});

test('every direct line reports which channel and where it was tapped', async ({ page }) => {
  await openHome(page, 'en', PHONE);
  await page.evaluate(() => {
    window.__captured = [];
    window.MoonaAnalytics = { ...window.MoonaAnalytics, capture: (name, props) => window.__captured.push([name, props]) };
    /* keep the test on the page: no WhatsApp tab, no dialer, no mail client */
    document.querySelectorAll('[data-contact-channel]').forEach(link => link.addEventListener('click', e => e.preventDefault()));
  });
  await page.locator('.wa-float').click();
  await page.locator('#contact').scrollIntoViewIfNeeded();
  for (const channel of ['whatsapp', 'phone', 'email']) {
    await page.locator(`#contact .contact-direct [data-contact-channel="${channel}"]`).evaluate(el => el.click());
  }
  const captured = await page.evaluate(() => window.__captured);
  expect(captured).toEqual([
    ['contact_channel_clicked', { channel: 'whatsapp', cta_location: 'float' }],
    ['contact_channel_clicked', { channel: 'whatsapp', cta_location: 'contact' }],
    ['contact_channel_clicked', { channel: 'phone', cta_location: 'contact' }],
    ['contact_channel_clicked', { channel: 'email', cta_location: 'contact' }]
  ]);
});

test('the loader words vanish the moment the curtain lifts, and the curtain is then removed', async ({ page }) => {
  await page.setViewportSize(PHONE);
  /* read the loader in the same task that lifts it, before any frame of the fade
     is painted: that is the state a busy phone or an unpainted tab can hold for seconds */
  await page.addInitScript(() => {
    const watch = loader => new MutationObserver((records, observer) => {
      if (!loader.classList.contains('done')) return;
      window.__atLift = {
        opacity: Number(getComputedStyle(loader).opacity),
        words: [...loader.children].map(child => getComputedStyle(child).visibility)
      };
      observer.disconnect();
    }).observe(loader, { attributes: true, attributeFilter: ['class'] });
    new MutationObserver((records, observer) => {
      const loader = document.getElementById('loader');
      if (!loader) return;
      observer.disconnect();
      watch(loader);
    }).observe(document, { childList: true, subtree: true });
  });
  await page.goto('/?lang=he');
  await page.waitForFunction(() => window.__atLift);
  const atLift = await page.evaluate(() => window.__atLift);
  expect(atLift.opacity, 'the curtain is still up when it starts to lift').toBeGreaterThan(0.5);
  expect(atLift.words, 'MOONA / 100 never print over the headline').toEqual(['hidden', 'hidden', 'hidden', 'hidden']);
  await expect(page.locator('#loader')).toHaveClass(/gone/, { timeout: 2000 });
  await expect(page.locator('#loader')).toBeHidden();
});

test('option: a second door that closes the concept films', async ({ page }) => {
  await openHome(page, 'he', PHONE);
  const band = page.locator('.midcta');
  await expect(band.locator('.midcta-line')).toHaveText('רוצים סרט כזה למוצר שלכם?');
  /* it closes the concept films, before the solutions, far above the footer */
  const order = await page.evaluate(() => {
    const top = el => el.getBoundingClientRect().top + scrollY;
    return [top(document.getElementById('work')), top(document.querySelector('.midcta')),
      top(document.getElementById('solutions')), top(document.getElementById('contact'))];
  });
  expect(order).toEqual([...order].sort((a, b) => a - b));
  await page.evaluate(() => {
    window.__captured = [];
    window.MoonaAnalytics = { ...window.MoonaAnalytics, capture: (name, props) => window.__captured.push([name, props]) };
    document.querySelectorAll('.midcta [data-contact-channel]').forEach(link => link.addEventListener('click', e => e.preventDefault()));
  });
  await band.locator('[data-ask]').evaluate(el => el.click());
  await expect(page.locator('#ask')).toHaveClass(/open/);
  await page.keyboard.press('Escape');
  await band.locator('[data-contact-channel="whatsapp"]').evaluate(el => el.click());
  expect(await page.evaluate(() => window.__captured)).toEqual([
    ['lead_form_opened', { cta_location: 'work', intent: 'product' }],
    ['contact_channel_clicked', { channel: 'whatsapp', cta_location: 'work' }]
  ]);
});

test('option: with the switch off the band keeps only its line and the CTA', async ({ page }) => {
  await openHome(page, 'en', PHONE, { whatsapp: null });
  await expect(page.locator('.midcta [data-ask]')).toBeAttached();
  await expect(page.locator('.midcta [data-whatsapp-line]')).toHaveCount(2);
  for (const line of await page.locator('.midcta [data-whatsapp-line]').all()) await expect(line).toBeHidden();
});
