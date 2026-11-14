// Optional browser walkthrough, not a project test dependency or framework.
// Start `npm run web -- --port 8081`, then set PLAYWRIGHT_MODULE to an already
// available Playwright module and run `node docs/verification/walkthrough.cjs`.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.VERIFY_URL || 'http://localhost:8081';
const output = path.join(__dirname, 'screenshots');

(async () => {
  fs.mkdirSync(output, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true,
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const results = { browser: browser.version(), routes: [], layouts: [], errors };
  async function open(route, expected) {
    await page.goto(base + route);
    await page.getByText(expected, { exact: true }).first().waitFor();
    await page.evaluate(() => document.fonts.ready);
  }
  async function capture(name, text, block = 'start') {
    if (text) await page.getByText(text, { exact: true }).first().evaluate((el, position) => el.scrollIntoView({ block: position }), block);
    await page.screenshot({ path: path.join(output, name + '.png') });
  }
  async function back() {
    await page.getByRole('button', { name: 'Return to lesson previews', exact: true }).click();
    await page.waitForURL(base + '/');
    await page.getByText('Choose a notebook preview', { exact: true }).waitFor();
  }
  async function buttons(count) {
    const disabled = page.getByRole('button', { disabled: true });
    assert.equal(await disabled.count(), count);
    assert.ok(await disabled.evaluateAll((els) => els.every((el) => el.disabled && el.getAttribute('aria-disabled') === 'true')));
    // DOM click attempts must not advance counters, change content, or navigate.
    const before = await page.locator('body').innerText();
    await disabled.evaluateAll((els) => els.forEach((el) => el.click()));
    assert.equal(await page.locator('body').innerText(), before);
  }
  async function layout(label, finalText) {
    const metrics = await page.evaluate(() => {
      const scrollers = [...document.querySelectorAll('*')].filter((el) => el.scrollHeight > el.clientHeight + 10 && ['auto', 'scroll'].includes(getComputedStyle(el).overflowY));
      const overflow = [...document.querySelectorAll('[dir="auto"],button,a')].filter((el) => {
        const r = el.getBoundingClientRect();
        return r.width && (r.left < -1 || r.right > innerWidth + 1 || el.scrollWidth > el.clientWidth + 1);
      }).map((el) => el.textContent.slice(0, 90));
      return { scrollers: scrollers.length, scrollHeight: scrollers[0]?.scrollHeight, overflow };
    });
    assert.equal(metrics.scrollers, 1);
    assert.deepEqual(metrics.overflow, []);
    const url = page.url();
    await page.getByText(finalText, { exact: true }).evaluate((el) => el.scrollIntoView({ block: 'start' }));
    assert.equal(page.url(), url);
    assert.ok(await page.getByText(finalText, { exact: true }).isVisible());
    results.layouts.push({ label, ...metrics });
  }
  try {
    await open('/', 'Choose a notebook preview');
    assert.deepEqual(await page.getByRole('link').evaluateAll((els) => els.map((el) => [el.getAttribute('aria-label'), el.getAttribute('href')])), [
      ['Alphabet preview', '/lessons/notebook-preview/alphabet'],
      ['Grammar notebook preview', '/lessons/notebook-preview/grammar'],
    ]);
    await capture('01-list-top');
    await capture('02-list-grammar', 'Grammar notebook preview');
    for (const id of ['alphabet', 'grammar']) {
      const title = id === 'alphabet' ? 'Alphabet' : 'Grammar notebook';
      const last = id === 'alphabet'
        ? 'Later lessons can expand this pattern with more letters, real pronunciation audio, and short listening checks while keeping the same notebook flow.'
        : 'More content can be added here later: quick checks, mini-dialogues, summaries, or review prompts. This preview only proves the long-form lesson shell.';
      let original;
      for (const route of [`/lessons/${id}`, `/lessons/notebook-preview/${id}`]) {
        await open(route, title);
        const text = await page.locator('body').innerText();
        if (original) assert.equal(text, original); else original = text;
        await buttons(8);
        if (id === 'grammar') {
          const microphone = page.getByRole('img', { name: 'Microphone preview icon; recording is not implemented.', exact: true });
          assert.equal(await microphone.count(), 1);
          assert.equal(await microphone.getAttribute('tabindex'), null);
        }
        const box = await page.getByRole('button', { name: 'Return to lesson previews', exact: true }).boundingBox();
        assert.equal(box.width, 48); assert.equal(box.height, 48);
        if (route === `/lessons/${id}`) {
          await capture(id === 'alphabet' ? '03-alphabet-top' : '05-grammar-top');
          if (id === 'alphabet') await capture('04-alphabet-activity', 'Letter sounds');
          else {
            await capture('06-grammar-classification', 'Practice classifying transitivity');
            await capture('07-grammar-conversation', 'Practice a short conversation');
            await capture('08-grammar-continuation', 'Further along in the transitivity section...');
          }
        }
        await layout(route, last);
        await back(); // Direct-entry circular return, including after long scroll.
        results.routes.push(route);
      }
      // The real catalog list links exercise stacked entry/circular return and browser back.
      await page.getByRole('link', { name: id === 'alphabet' ? 'Alphabet preview' : 'Grammar notebook preview', exact: true }).click();
      await page.waitForURL(base + `/lessons/notebook-preview/${id}`);
      await back();
      await page.getByRole('link', { name: id === 'alphabet' ? 'Alphabet preview' : 'Grammar notebook preview', exact: true }).click();
      await page.waitForURL(base + `/lessons/notebook-preview/${id}`);
      await page.goBack();
      await page.waitForURL(base + '/');
      for (const width of [320, 360]) {
        await page.setViewportSize({ width, height: 844 });
        await open(`/lessons/notebook-preview/${id}`, title);
        await buttons(8);
        await layout(`${id} compact ${width}`, last);
        if (width === 320) await capture(`compact-${id}`, id === 'alphabet' ? 'Letter sounds' : 'Practice classifying transitivity');
      }
      await page.setViewportSize({ width: 390, height: 844 });
      await open(`/lessons/notebook-preview/${id}`, title);
      // Stress approximation only: scale rendered text font sizes AND line heights to
      // 150%. This is not OS font scaling and does not emulate AppText's native caps.
      await page.evaluate(() => {
        for (const el of document.querySelectorAll('[dir="auto"]')) {
          const style = getComputedStyle(el);
          el.style.fontSize = `${parseFloat(style.fontSize) * 1.5}px`;
          el.style.lineHeight = `${parseFloat(style.lineHeight) * 1.5}px`;
        }
      });
      await buttons(8);
      await layout(`${id} 150% browser text approximation`, last);
      await capture(`large-text-${id}`, id === 'alphabet' ? 'Letter sounds' : 'Practice a short conversation');
      if (id === 'grammar') await capture('large-text-grammar-actions', 'Submit', 'center');
    }
    for (const route of ['/lessons/unknown/alphabet', '/lessons/notebook-preview/unknown', '/lessons/__proto__/constructor', '/lessons/notebook-preview/%2F', '/lessons/notebook-preview/%20']) {
      await open(route, 'Lesson not found');
      await back();
      results.routes.push(route);
    }
    await open('/lessons/notebook-preview', 'Unmatched Route');
    results.routes.push('/lessons/notebook-preview (unmatched)');
    await capture('invalid-missing-segment');
    await open('/lessons/synthetic-tone-lab/pitch-paths', 'Synthetic tone composition fixture');
    await buttons(9);
    const fixtureText = (await page.locator('body').innerText()).toLowerCase();
    const before = fixtureText.indexOf('for this synthetic fixture only');
    const graphic = fixtureText.indexOf('synthetic pitch paths');
    const after = fixtureText.indexOf('the notebook continues after the graphic');
    assert.ok(before >= 0 && before < graphic && graphic < after);
    await capture('synthetic-graphic', 'Synthetic pitch paths · static graphic');
    await layout('synthetic composition', 'Falling');
    await capture('synthetic-choices', 'Example path labels');
    await back();
    results.routes.push('/lessons/synthetic-tone-lab/pitch-paths');
    assert.deepEqual(errors, []);
    fs.writeFileSync(path.join(__dirname, 'browser-results.json'), JSON.stringify(results, null, 2) + '\n');
    console.log(JSON.stringify(results, null, 2));
  } finally { await browser.close(); }
})().catch((error) => { console.error(error); process.exitCode = 1; });
