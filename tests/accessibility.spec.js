const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;

const errorsByPage = new WeakMap();

test.beforeEach(async ({ page }) => {
  const errors = [];
  errorsByPage.set(page, errors);
  page.on('console', message => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`);
  });
  page.on('pageerror', error => errors.push(`pageerror: ${error.message}`));

  await page.addInitScript(() => {
    localStorage.setItem('moona-analytics-consent', 'denied');
  });
  await page.route('https://fonts.googleapis.com/**', route => route.fulfill({
    status: 200,
    contentType: 'text/css',
    body: '/* fonts are intentionally stubbed in accessibility E2E */'
  }));
});

test.afterEach(async ({ page }) => {
  expect(errorsByPage.get(page) || [], 'browser console and page errors').toEqual([]);
});

async function openPage(page, path) {
  await page.goto(path);
  await page.waitForFunction(() => Boolean(window.MoonaI18n));
  await page.waitForFunction(() => !document.documentElement.classList.contains('i18n-pending'));
  if (await page.locator('body').getAttribute('data-page') === 'home') {
    await expect(page.locator('#loader')).toHaveClass(/done/);
  }
}

async function expectNoAxeViolations(page, include) {
  let builder = new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']);
  if (include) builder = builder.include(include);
  const results = await builder.analyze();
  const summary = results.violations.map(violation => ({
    id: violation.id,
    impact: violation.impact,
    help: violation.help,
    targets: violation.nodes.map(node => node.target.join(' '))
  }));
  expect(summary, 'axe WCAG A/AA violations').toEqual([]);
}

async function canvasSnapshots(page) {
  return Promise.all([
    page.locator('#sky').screenshot(),
    page.locator('#moon').screenshot()
  ]);
}

for (const locale of ['en', 'he']) {
  test(`home passes axe and exposes the correct ${locale.toUpperCase()} document structure`, async ({ page }) => {
    await openPage(page, `/?lang=${locale}`);

    await expect(page.locator('html')).toHaveAttribute('lang', locale);
    await expect(page.locator('html')).toHaveAttribute('dir', locale === 'he' ? 'rtl' : 'ltr');
    await expect(page.locator('main#main-content')).toHaveCount(1);
    await expect(page.locator('footer')).toHaveCount(1);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('.skip')).toHaveAttribute('href', '#film');
    if (locale === 'he') {
      const footerLabelStyle = await page.locator('.legal-nav a').first().evaluate(element => {
        const style = getComputedStyle(element);
        return { family: style.fontFamily, size: style.fontSize, spacing: style.letterSpacing };
      });
      expect(footerLabelStyle.family).toContain('Assistant');
      expect(footerLabelStyle.size).toBe('11px');
      expect(footerLabelStyle.spacing).toMatch(/^(normal|0px)$/);
    }
    await expectNoAxeViolations(page);
  });
}

for (const locale of ['en', 'he']) {
  test(`founder image overlay passes mobile axe in ${locale.toUpperCase()}`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openPage(page, `/?lang=${locale}`);
    await page.locator('#about').scrollIntoViewIfNeeded();
    await expect(page.locator('.about-copy')).toHaveClass(/seen/);
    await expectNoAxeViolations(page, '#about');
  });
}

test('mobile menu is keyboard operated, focuses its content, and restores focus', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openPage(page, '/?lang=he');

  const toggle = page.locator('[data-mobile-menu-toggle]');
  const menu = page.locator('#mobileMenu');
  const firstItem = menu.locator('button').first();
  await toggle.focus();
  await page.keyboard.press('Enter');

  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(menu).toBeVisible();
  await expect(firstItem).toBeFocused();
  const targetSizes = await menu.locator('button').evaluateAll(buttons => buttons.map(button => {
    const rect = button.getBoundingClientRect();
    return { width: rect.width, height: rect.height };
  }));
  for (const size of targetSizes) {
    expect(size.width).toBeGreaterThanOrEqual(44);
    expect(size.height).toBeGreaterThanOrEqual(44);
  }
  await expectNoAxeViolations(page);

  await page.keyboard.press('Escape');
  await expect(menu).toBeHidden();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(toggle).toBeFocused();
});

test('required fields have descriptions and expose an announced validation state', async ({ page }) => {
  await openPage(page, '/?lang=he');
  const opener = page.locator('#hdr [data-ask]');
  await opener.click();
  await expect(page.locator('#ask')).toHaveClass(/open/);
  await expect(page.locator('#f-name')).toBeFocused();

  for (const id of ['f-name', 'f-mail', 'f-site', 'f-brief']) {
    const field = page.locator(`#${id}`);
    await expect(field).toHaveAttribute('required', '');
    await expect(field).toHaveAttribute('aria-required', 'true');
    await expect(field).toHaveAttribute('aria-invalid', 'false');
    const descriptionId = await field.getAttribute('aria-describedby');
    expect(descriptionId).toBeTruthy();
    await expect(page.locator(`#${descriptionId}`)).toHaveAttribute('aria-live', 'polite');
  }

  const fileInput = page.locator('#f-files');
  await expect(fileInput).not.toHaveCSS('display', 'none');
  await expect(fileInput).toHaveAttribute('aria-describedby', 'upload-detail');
  expect(await fileInput.evaluate(input => input.tabIndex)).toBeGreaterThanOrEqual(0);

  await page.locator('[data-step="0"] [data-next]').click();
  await expect(page.locator('#f-name')).toBeFocused();
  await expect(page.locator('#f-name')).toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('#name-hint')).toHaveAttribute('role', 'alert');
  await expect(page.locator('#name-hint')).toHaveText('את זה צריך למלא.');

  await page.locator('#f-name').fill('דנה כהן');
  await page.locator('[data-step="0"] [data-next]').click();
  await page.locator('#f-mail').fill('dana@example.com');
  await page.locator('[data-step="1"] [data-next]').click();
  await page.locator('#f-site').fill('example.com');
  await page.locator('[data-step="2"] [data-next]').click();
  await expect(page.locator('[data-step="3"]')).toHaveClass(/active/);
  await expect(page.locator('#f-brief')).toBeFocused();

  await page.locator('#askSubmit').click();
  await expect(page.locator('#f-brief')).toBeFocused();
  await expect(page.locator('#f-brief')).toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('#brief-hint')).toHaveAttribute('role', 'alert');
  await expect(page.locator('#brief-hint')).toHaveText('את זה צריך למלא.');

  await page.locator('#f-brief').fill('קצר מדי');
  await page.locator('#askSubmit').click();
  await expect(page.locator('#f-brief')).toBeFocused();
  await expect(page.locator('#brief-hint')).toHaveText('נשמח לקצת יותר פרטים, בין 20 ל־1,200 תווים.');
  await expectNoAxeViolations(page, '#ask');

  await page.keyboard.press('Escape');
  await expect(page.locator('#ask')).not.toHaveClass(/open/);
  await expect(opener).toBeFocused();
});

test('lightbox traps focus, makes the background inert, and restores its opener', async ({ page }) => {
  await openPage(page, '/?lang=en');
  const opener = page.locator('[data-media-open]').first();
  await opener.focus();
  await opener.evaluate(button => button.click());

  const lightbox = page.locator('#lb');
  const close = lightbox.locator('.lb-close');
  await expect(lightbox).toHaveClass(/open/);
  await expect(close).toBeFocused();
  for (const selector of ['#hdr', 'main', 'footer']) {
    await expect(page.locator(selector)).toHaveAttribute('aria-hidden', 'true');
    expect(await page.locator(selector).evaluate(element => element.inert)).toBe(true);
  }
  await expectNoAxeViolations(page, '#lb');

  await page.keyboard.press('Tab');
  expect(await lightbox.evaluate(element => element.contains(document.activeElement))).toBe(true);
  await page.keyboard.press('Escape');
  await expect(lightbox).not.toHaveClass(/open/);
  await expect(opener).toBeFocused();
  expect(await page.locator('main').evaluate(element => element.inert)).toBe(false);
  await expect(page.locator('main')).not.toHaveAttribute('aria-hidden', 'true');
});

test('every reachable media opener has a localized, non-empty, unique accessible name', async ({ page }) => {
  for (const locale of ['en', 'he']) {
    await openPage(page, `/?lang=${locale}`);
    const labels = await page.locator([
      '#film .film-frame[tabindex="0"]',
      '#work [data-media-open]'
    ].join(',')).evaluateAll(elements => elements.map(element => element.getAttribute('aria-label')?.trim() || ''));

    expect(labels).toHaveLength(5);
    expect(labels.every(Boolean)).toBe(true);
    expect(new Set(labels).size, `duplicate ${locale} media labels: ${labels.join(' | ')}`).toBe(labels.length);
    if (locale === 'he') {
      expect(labels.join(' ')).not.toMatch(/flat lay|studio portrait|San Miguel can|ForgeSkin bag|L'Occitane duo|sunset/i);
    }
  }
});

test('action-labelled media and motion controls do not expose a contradictory pressed state', async ({ page }) => {
  await openPage(page, '/?lang=he');
  const controls = page.locator('[data-motion-toggle], [data-media-play], [data-media-sound]');
  expect(await controls.count()).toBeGreaterThan(2);
  for (const control of await controls.all()) {
    await expect(control).not.toHaveAttribute('aria-pressed', /.+/);
    await expect(control).toHaveAttribute('aria-label', /.+/);
  }
});

test('Hebrew content reflows at the supported narrow width with WCAG text spacing', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await openPage(page, '/?lang=he');
  await page.locator('#about').scrollIntoViewIfNeeded();
  await expect(page.locator('.about-copy')).toHaveClass(/seen/);
  await expect(page.locator('.about-copy')).toHaveCSS('transform', 'none');
  await page.addStyleTag({ content: `
    :where(h1,h2,h3,p,li,a,button,label,input,span){
      line-height:1.5!important;
      letter-spacing:.12em!important;
      word-spacing:.16em!important;
    }
    p{margin-bottom:2em!important}
  ` });
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));

  const layout = await page.evaluate(() => {
    const withinViewport = element => {
      const rect = element.getBoundingClientRect();
      return rect.left >= -1 && rect.right <= innerWidth + 1;
    };
    const headline = document.querySelector('.film-title');
    const cta = document.querySelector('.contact .cta-btn.lg');
    const header = document.getElementById('hdr');
    const headlineRange = document.createRange();
    headlineRange.selectNodeContents(headline);
    const headlineText = headlineRange.getBoundingClientRect();
    const about = document.querySelector('#about');
    const aboutCopy = about.querySelector('.about-copy');
    const aboutMedia = about.querySelector('.about-media');
    const aboutRect = about.getBoundingClientRect();
    const aboutCopyRect = aboutCopy.getBoundingClientRect();
    const aboutMediaRect = aboutMedia.getBoundingClientRect();
    return {
      pageFits: document.documentElement.scrollWidth <= innerWidth + 1,
      headlineFits: withinViewport(headline) && headlineText.left >= -1 && headlineText.right <= innerWidth + 1,
      ctaFits: withinViewport(cta) && cta.scrollWidth <= cta.clientWidth + 1,
      headerFits: withinViewport(header),
      aboutCopyFits:
        withinViewport(aboutCopy) &&
        aboutCopy.scrollWidth <= aboutCopy.clientWidth + 1 &&
        aboutCopy.scrollHeight <= aboutCopy.clientHeight + 1,
      aboutCopyContained:
        aboutCopyRect.top >= aboutRect.top - 1 &&
        aboutCopyRect.bottom <= aboutRect.bottom + 1,
      aboutImageCoversSection:
        Math.abs(aboutMediaRect.left - aboutRect.left) <= 1 &&
        Math.abs(aboutMediaRect.top - aboutRect.top) <= 1 &&
        Math.abs(aboutMediaRect.right - aboutRect.right) <= 1 &&
        Math.abs(aboutMediaRect.bottom - aboutRect.bottom) <= 1
    };
  });
  expect(layout).toEqual({
    pageFits: true,
    headlineFits: true,
    ctaFits: true,
    headerFits: true,
    aboutCopyFits: true,
    aboutCopyContained: true,
    aboutImageCoversSection: true
  });
});

test('privacy notice is localized, linked, and passes axe', async ({ page }) => {
  await openPage(page, '/privacy.html?lang=he');

  await expect(page.locator('html')).toHaveAttribute('lang', 'he');
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(page.locator('h1')).toHaveText('הודעת פרטיות');
  await expect(page.locator('.skip')).toHaveAttribute('href', '#privacyNotice');
  await expect(page.locator('a[href^="/accessibility.html"]')).toHaveAttribute('href', '/accessibility.html?lang=he');
  await expectNoAxeViolations(page);
});

for (const locale of ['en', 'he']) {
  test(`accessibility statement is complete, localized, and passes axe in ${locale.toUpperCase()}`, async ({ page }) => {
    await openPage(page, `/accessibility.html?lang=${locale}`);

    await expect(page.locator('html')).toHaveAttribute('lang', locale);
    await expect(page.locator('html')).toHaveAttribute('dir', locale === 'he' ? 'rtl' : 'ltr');
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
    await expect(page.locator('main#statement')).toHaveAttribute('tabindex', '-1');
    await expect(page.locator('article h1')).toHaveCount(1);
    await expect(page.locator('article h2')).toHaveCount(6);
    await expect(page.locator('[data-i18n="accessibility.limitations.media"]')).toBeVisible();
    await expect(page.locator('[data-i18n="accessibility.limitations.testing"]')).toBeVisible();
    await expect(page.locator('a[href^="mailto:"]')).toHaveAttribute('dir', 'ltr');
    await expect(page.locator('[data-i18n="accessibility.audit.date"]')).toBeVisible();
    await expect(page.locator('[data-i18n="accessibility.updated.date"]')).toBeVisible();
    await expectNoAxeViolations(page);
  });
}

test.describe('motion accessibility', () => {
  test('system reduced motion freezes canvases, CSS animation, and autoplay media', async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();
    const errors = [];
    page.on('console', message => {
      if (message.type() === 'error') errors.push(`console: ${message.text()}`);
    });
    page.on('pageerror', error => errors.push(`pageerror: ${error.message}`));
    await page.addInitScript(() => localStorage.setItem('moona-analytics-consent', 'denied'));
    await page.route('https://fonts.googleapis.com/**', route => route.fulfill({ status: 200, contentType: 'text/css', body: '' }));
    await openPage(page, '/?lang=he');

    const control = page.locator('[data-motion-toggle]');
    await expect(control).toBeDisabled();
    await expect(control).toHaveAttribute('aria-label', 'התנועה הופחתה לפי הגדרת המערכת');
    expect(await page.locator('video').evaluateAll(videos => videos.every(video => video.paused))).toBe(true);
    expect(await page.locator('.grain,.scrollcue i,.cta-btn').evaluateAll(elements =>
      elements.every(element => getComputedStyle(element).animationName === 'none'))).toBe(true);
    await page.locator('.film-story').scrollIntoViewIfNeeded();
    const storyMotion = await page.locator('.film-story').evaluate(section => ({
      cards: [...section.querySelectorAll('.film-beat')].every(card => {
        const style = getComputedStyle(card);
        return style.opacity === '1' && style.transform === 'none'
          && style.transitionDuration.split(',').every(value => parseFloat(value) === 0);
      }),
      images: [...section.querySelectorAll('.beat-media img')].every(image => {
        const style = getComputedStyle(image);
        return style.opacity === '1' && style.transform === 'none'
          && style.transitionDuration.split(',').every(value => parseFloat(value) === 0);
      }),
      lines: [...section.querySelectorAll('.beat-line')].every(line => {
        const style = getComputedStyle(line);
        return style.transform === 'none'
          && style.transitionDuration.split(',').every(value => parseFloat(value) === 0);
      })
    }));
    expect(storyMotion).toEqual({ cards: true, images: true, lines: true });

    const before = await canvasSnapshots(page);
    await page.waitForTimeout(350);
    const after = await canvasSnapshots(page);
    expect(after[0].equals(before[0])).toBe(true);
    expect(after[1].equals(before[1])).toBe(true);
    expect(errors).toEqual([]);
    await context.close();
  });

  test('user motion preference pauses, persists, and can be resumed', async ({ page }) => {
    await openPage(page, '/?lang=en');
    const control = page.locator('[data-motion-toggle]');
    await control.evaluate(button => button.click());

    await expect(page.locator('html')).toHaveClass(/motion-paused/);
    await expect(control).toHaveAttribute('aria-label', 'Resume motion');
    expect(await page.evaluate(() => localStorage.getItem('moona.motionPaused'))).toBe('1');
    expect(await page.locator('video').evaluateAll(videos => videos.every(video => video.paused))).toBe(true);
    const before = await canvasSnapshots(page);
    await page.waitForTimeout(350);
    const after = await canvasSnapshots(page);
    expect(after[0].equals(before[0])).toBe(true);
    expect(after[1].equals(before[1])).toBe(true);

    await page.reload();
    await page.waitForFunction(() => Boolean(window.MoonaI18n));
    await expect(page.locator('html')).toHaveClass(/motion-paused/);
    await expect(control).toHaveAttribute('aria-label', 'Resume motion');
    await control.evaluate(button => button.click());
    await expect(page.locator('html')).not.toHaveClass(/motion-paused/);
    await expect(control).toHaveAttribute('aria-label', 'Pause motion');
    expect(await page.evaluate(() => localStorage.getItem('moona.motionPaused'))).toBe('0');
  });
});
