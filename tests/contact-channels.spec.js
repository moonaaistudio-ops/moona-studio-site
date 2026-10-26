const { test, expect } = require('@playwright/test');

const PHONE = { width: 375, height: 812 };

test.beforeEach(async ({ page }) => {
  await page.route('https://fonts.googleapis.com/**', route => route.fulfill({
    status: 200, contentType: 'text/css', body: '/* fonts are intentionally stubbed in E2E */'
  }));
});

async function openHome(page, locale, viewport) {
  await page.setViewportSize(viewport);
  await page.goto(`/?lang=${locale}`);
  await page.waitForFunction(() => window.MoonaI18n && !document.documentElement.classList.contains('i18n-pending'));
  await expect(page.locator('#loader')).toHaveClass(/gone/);
}

for (const locale of ['en', 'he']) {
  test(`contact block shows the studio email without opening the form (${locale.toUpperCase()})`, async ({ page }) => {
    await openHome(page, locale, PHONE);
    await page.locator('#contact').scrollIntoViewIfNeeded();
    await expect(page.locator('#contact .or')).toHaveText(locale === 'he' ? 'או' : 'or');
    const email = page.locator('#contact .contact-direct [data-contact-channel="email"]');
    await expect(email).toHaveAttribute('href', 'mailto:tal@moonastudio.ai');
    await expect(email.locator('bdi')).toHaveText('tal@moonastudio.ai');
    await expect(email.locator('bdi')).toHaveAttribute('dir', 'ltr');
    const { height } = await email.boundingBox();
    expect(Math.round(height)).toBeGreaterThanOrEqual(44);
  });
}

test('a direct line reports which channel and where it was tapped', async ({ page }) => {
  await openHome(page, 'en', PHONE);
  await page.evaluate(() => {
    window.__captured = [];
    window.MoonaAnalytics = { ...window.MoonaAnalytics, capture: (name, props) => window.__captured.push([name, props]) };
    /* keep the test on the page: no mail client */
    document.querySelectorAll('[data-contact-channel]').forEach(link => link.addEventListener('click', e => e.preventDefault()));
  });
  await page.locator('#contact .contact-direct [data-contact-channel="email"]').evaluate(el => el.click());
  expect(await page.evaluate(() => window.__captured)).toEqual([
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
