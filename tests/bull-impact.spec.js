const { test, expect } = require('@playwright/test');

test('Bull Padel sits beside McDonald’s and its impact leaves the film running', async ({ page }) => {
  await page.goto('/?lang=en#work');
  const cards = page.locator('#work .work-grid > [data-piece]');
  await expect(cards.locator('.brand')).toHaveText([
    "McDonald's", 'Bull Padel', 'Strava', 'Koda', 'Jewelry'
  ]);

  const bull = page.locator('[data-bull-impact]');
  const film = bull.locator('.frame video');
  const effect = page.locator('.bull-impact-overlay');
  await bull.scrollIntoViewIfNeeded();
  await expect.poll(() => effect.getAttribute('data-state'), { timeout: 10_000 }).toBe('playing');
  await expect(film).toHaveAttribute('src', 'v/bull-padel.mp4');
  const before = await film.evaluate(video => video.currentTime);
  await page.waitForTimeout(350);
  expect(await film.evaluate(video => video.currentTime)).toBeGreaterThan(before);
  await expect(effect).toHaveCSS('pointer-events', 'none');

  await bull.locator('[data-media-play]').click();
  await expect.poll(() => film.evaluate(video => video.paused)).toBe(true);
  await expect(effect).toHaveAttribute('data-state', 'paused');
  await expect(effect).toBeHidden();

  await bull.locator('[data-media-open]').click();
  await expect(page.locator('#lb')).toHaveClass(/open/);
  expect(await page.locator('#lb video').evaluate(video => video.currentTime)).toBeLessThan(0.75);
  await expect(effect).toHaveAttribute('data-state', 'idle');
});

test('reduced motion leaves the Bull Padel effect off', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/?lang=he#work');
  const bull = page.locator('[data-bull-impact]');
  await bull.scrollIntoViewIfNeeded();
  await expect(bull.locator('[data-impact-replay]')).toBeHidden();
  await expect(page.locator('.bull-impact-overlay')).toBeHidden();
  await expect(bull.locator('.frame video')).toHaveAttribute('src', 'v/bull-padel.mp4');
});

test('the glass lingers, replay works, and the Hebrew full film starts at zero', async ({ page }) => {
  await page.goto('/?lang=he#work');
  const bull = page.locator('[data-bull-impact]');
  const effect = page.locator('.bull-impact-overlay');
  await bull.scrollIntoViewIfNeeded();
  await bull.locator('[data-impact-replay]').click();
  await expect.poll(() => effect.getAttribute('data-state'), { timeout: 10_000 }).toBe('playing');
  await expect.poll(() => effect.evaluate(video => video.ended), { timeout: 7_000 }).toBe(true);
  await expect(effect).toBeVisible();
  await page.waitForTimeout(750);
  await expect(effect).toBeVisible();
  await expect.poll(() => effect.getAttribute('data-state'), { timeout: 5_000 }).toBe('idle');
  await expect(effect).toBeHidden();

  await bull.locator('[data-media-open]').click();
  await expect(page.locator('#lb')).toHaveClass(/open/);
  expect(await page.locator('#lb video').evaluate(video => video.currentTime)).toBeLessThan(0.75);
});
