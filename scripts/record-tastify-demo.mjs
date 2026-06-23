import fs from 'node:fs';
import path from 'node:path';
import { execFileSync, execSync } from 'node:child_process';
import { chromium } from 'playwright';

const repoRoot = process.cwd();
const outDir = path.join(repoRoot, 'docs', 'demo-videos');
const rawDir = path.join(outDir, 'raw');
const shotsDir = path.join(outDir, 'shots');
const ttsDir = path.join(outDir, 'tts');
const finalVideo = path.join(outDir, 'tastify-demo-presentation.mp4');
const subtitlesPath = path.join(outDir, 'tastify-demo-presentation.srt');
const ttsAudioPath = path.join(outDir, 'tts-audio.wav');

fs.mkdirSync(outDir, { recursive: true });
fs.rmSync(rawDir, { recursive: true, force: true });
fs.rmSync(shotsDir, { recursive: true, force: true });
fs.mkdirSync(rawDir, { recursive: true });
fs.mkdirSync(shotsDir, { recursive: true });
// Keep TTS audio cache to save API quota and speed up runs
if (!fs.existsSync(ttsDir)) {
  fs.mkdirSync(ttsDir, { recursive: true });
}

const clientUrl = process.env.CLIENT_URL ?? 'http://localhost:3003';
const staffUrl = process.env.STAFF_URL ?? 'http://localhost:3000';
const viewport = { width: 1920, height: 1080 };
const slow = Number(process.env.DEMO_STEP_MS ?? 1800);

const captions = [
  [0, 10, 'Tastify centralise le parcours restaurant\u00a0: client, salle, cuisine, paiement et avis.'],
  [10, 25, 'Le portail client pr\u00e9sente la carte, les cat\u00e9gories et les plats appr\u00e9ci\u00e9s.'],
  [25, 45, 'Le g\u00e9rant suit les revenus, les commandes, le stock et les retours clients.'],
  [45, 65, 'Le serveur s\u00e9lectionne une table, ajoute des plats et envoie la commande en cuisine.'],
  [65, 80, 'La cuisine re\u00e7oit la commande dans le KDS et met \u00e0 jour son avancement.'],
  [80, 100, 'Le paiement simul\u00e9 par QR ou lien s\u00e9curis\u00e9 cl\u00f4ture la commande.'],
  [100, 115, 'Le client se connecte et laisse un avis analys\u00e9 par le syst\u00e8me.'],
  [115, 130, 'La commande est pay\u00e9e, la table est lib\u00e9r\u00e9e et les donn\u00e9es remontent au dashboard.'],
];

function timestamp(seconds) {
  const ms = Math.round((seconds % 1) * 1000);
  const total = Math.floor(seconds);
  const s = total % 60;
  const m = Math.floor(total / 60) % 60;
  const h = Math.floor(total / 3600);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
}

fs.writeFileSync(
  subtitlesPath,
  captions.map((caption, index) => {
    const [start, end, text] = caption;
    return `${index + 1}\n${timestamp(start)} --> ${timestamp(end)}\n${text}\n`;
  }).join('\n'),
  'utf8',
);

// --- Step 1: Generate TTS audio ---
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('GEMINI_API_KEY is required for TTS');
  process.exit(1);
}
console.log('Generating TTS audio...');
const captionsJson = JSON.stringify(captions);
execFileSync('python', [
  'scripts/generate-tts.py',
  '--api-key', apiKey,
  '--captions-json', captionsJson,
  '--output', ttsAudioPath,
  '--output-dir', ttsDir,
], { stdio: 'inherit', cwd: repoRoot });
console.log('TTS audio generated.\n');

// --- Step 2: Record video ---
async function wait(page, ms = slow) {
  await page.waitForTimeout(ms);
}

async function goto(page, url, ms = slow) {
  await page.goto(url, { waitUntil: 'load', timeout: 15000 }).catch(() => {});
  await wait(page, ms);
}

async function clickText(page, names, options = {}) {
  for (const name of names) {
    const locators = [
      page.getByRole('button', { name: new RegExp(name, 'i') }),
      page.getByRole('link', { name: new RegExp(name, 'i') }),
      page.getByText(new RegExp(name, 'i')).first(),
    ];
    for (const locator of locators) {
      try {
        await locator.click({ timeout: options.timeout ?? 2500 });
        await wait(page, options.wait ?? 1200);
        return true;
      } catch {}
    }
  }
  return false;
}

async function fillFirst(page, labels, value) {
  for (const label of labels) {
    const locators = [
      page.getByLabel(new RegExp(label, 'i')),
      page.getByPlaceholder(new RegExp(label, 'i')),
      page.locator(`input[name*="${label.toLowerCase()}"]`).first(),
    ];
    for (const locator of locators) {
      try {
        await locator.fill(value, { timeout: 2500 });
        return true;
      } catch {}
    }
  }
  return false;
}

async function login(page, baseUrl, username, password) {
  // Clear all cookies in the browser context to log out of any backend session
  await page.context().clearCookies().catch(() => {});

  // Navigate to login page
  await page.goto(`${baseUrl}/login`, { waitUntil: 'load', timeout: 15000 }).catch(() => {});
  
  // Clear local storage and session storage for the target domain
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  }).catch(() => {});

  const usernameInput = page.getByTestId('login-username');
  const passwordInput = page.getByTestId('login-password');
  const submitButton = page.getByTestId('login-submit');

  try {
    await usernameInput.waitFor({ state: 'visible', timeout: 3000 });
    await usernameInput.fill(username);
    await passwordInput.fill(password);
    await submitButton.click();
  } catch (err) {
    console.warn(`TestID login failed, falling back: ${err.message}`);
    await fillFirst(page, ['username', 'utilisateur', 'nom'], username);
    await fillFirst(page, ['password', 'mot de passe'], password);
    await clickText(page, ['se connecter', 'connexion', 'login'], { wait: 1000 });
  }

  // Wait for page to load post-login
  await page.waitForLoadState('load', { timeout: 5000 }).catch(() => {});
  await wait(page, 1000);
}

async function softScroll(page, amount = 700) {
  await page.mouse.wheel(0, amount);
  await wait(page, 1000);
}

async function record() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: 1,
    recordVideo: { dir: rawDir, size: viewport },
  });
  const page = await context.newPage();
  const startTime = Date.now();

  async function syncTo(targetSecond) {
    const elapsedMs = Date.now() - startTime;
    const targetMs = targetSecond * 1000;
    const waitMs = targetMs - elapsedMs;
    if (waitMs > 0) {
      console.log(`[Sync] Waiting ${waitMs}ms to reach second ${targetSecond}...`);
      await page.waitForTimeout(waitMs);
    } else {
      console.warn(`[Sync] Behind schedule by ${-waitMs}ms at second ${targetSecond}`);
    }
  }

  console.log('Recording: client portal');
  await goto(page, clientUrl, 2000);
  await softScroll(page, 650);

  // Segment 1 (Portail client menu) starts at 8s
  await syncTo(8);
  await goto(page, `${clientUrl}/menu`, 2000);
  await softScroll(page, 900);
  await page.getByRole('button', { name: /Ajouter/i }).first().click({ force: true, timeout: 3000 }).catch(() => {});
  await softScroll(page, -500);

  // Segment 2 (Gérant dashboard) starts at 18s
  await syncTo(18);
  console.log('Recording: manager dashboard');
  await login(page, staffUrl, 'gerant_test', 'password123');
  await goto(page, `${staffUrl}/`, 2000);
  await softScroll(page, 550);
  await goto(page, `${staffUrl}/avis`, 1800);
  await softScroll(page, 700);
  await goto(page, `${staffUrl}/stock`, 1800);
  await softScroll(page, 650);

  // Segment 3 (Serveur ordering) starts at 33s
  await syncTo(33);
  console.log('Recording: server ordering');
  await login(page, staffUrl, 'serveur_test', 'password123');
  await goto(page, `${staffUrl}/salle`, 2000);
  await page.getByTestId('table-1').first().click({ force: true, timeout: 3000 }).catch(() => {});
  await wait(page, 1500);
  if (!page.url().includes('/ordering/')) {
    await goto(page, `${staffUrl}/ordering/1`, 1500);
  }
  await page.getByTestId('menu-catalog').getByRole('button', { name: /Couscous/i }).first().click({ force: true, timeout: 3000 }).catch(() => {});
  await wait(page, 1000);
  await page.getByRole('button', { name: '+' }).first().click({ force: true, timeout: 3000 }).catch(() => {});
  await wait(page, 1000);
  await page.getByTestId('order-submit').first().click({ force: true, timeout: 3000 }).catch(() => {});

  // Segment 4 (Cuisine KDS) starts at 48s
  await syncTo(48);
  console.log('Recording: kitchen KDS');
  await login(page, staffUrl, 'cuisinier_test', 'password123');
  await goto(page, `${staffUrl}/kds`, 2000);
  await page.getByText(/Couscous/i).first().click({ force: true, timeout: 3000 }).catch(() => {});
  await wait(page, 1500);
  await page.getByText(/Couscous/i).first().click({ force: true, timeout: 3000 }).catch(() => {});
  await wait(page, 1500);
  await softScroll(page, 450);

  // Segment 5 (Paiement) starts at 60s
  await syncTo(60);
  console.log('Recording: payment');
  await login(page, staffUrl, 'serveur_test', 'password123');
  await goto(page, `${staffUrl}/ordering/1`, 1000);
  await page.getByRole('button', { name: /Encaisser/i }).first().click({ force: true, timeout: 3000 }).catch(() => {});
  await wait(page, 800);
  await page.getByRole('button', { name: /Lien de paiement QR/i }).first().click({ force: true, timeout: 3000 }).catch(() => {});
  await wait(page, 800);
  const paymentLink = await page.locator('a[href*="/pay/"]').first().getAttribute('href').catch(() => null);
  if (paymentLink) {
    await goto(page, paymentLink.startsWith('http') ? paymentLink : `${clientUrl}${paymentLink}`, 1000);
    await page.getByRole('button', { name: /Confirmer le paiement/i }).first().click({ force: true, timeout: 3000 }).catch(() => {});
  } else {
    await goto(page, `${clientUrl}/checkout`, 2200);
  }

  // Segment 6 (Client review) starts at 100s
  await syncTo(100);
  console.log('Recording: client review');
  await login(page, clientUrl, 'client_test', 'password123');
  await goto(page, `${clientUrl}/account`, 2500);
  await softScroll(page, 900);
  await page.getByRole('button', { name: /Donner votre avis/i }).first().click({ force: true, timeout: 3000 }).catch(() => {});
  await wait(page, 1200);
  const textareas = page.locator('textarea');
  if (await textareas.count().catch(() => 0)) {
    await textareas.first().fill('Service rapide, plats d\u00e9licieux et exp\u00e9rience tr\u00e8s fluide.');
    await wait(page, 1000);
    await page.getByRole('button', { name: /Transmettre mon avis/i }).first().click({ force: true, timeout: 3000 }).catch(() => {});
  }

  // Segment 7 (Back to dashboard) starts at 115s
  await syncTo(115);
  console.log('Recording: back to dashboard');
  await login(page, staffUrl, 'gerant_test', 'password123');
  await goto(page, `${staffUrl}/avis`, 2400);
  await softScroll(page, 650);
  await goto(page, `${staffUrl}/`, 3000);

  // Wait until full duration of 130s
  await syncTo(130);

  await context.close();
  await browser.close();

  const videos = fs.readdirSync(rawDir)
    .filter((name) => name.endsWith('.webm'))
    .map((name) => path.join(rawDir, name))
    .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
  if (!videos[0]) throw new Error('Aucune vid\u00e9o Playwright g\u00e9n\u00e9r\u00e9e.');
  return videos[0];
}

const rawVideo = await record();

// --- Step 3: Combine video + TTS audio + subtitles ---
console.log('Encoding final video with audio...');
const subtitleFilter = `subtitles='${subtitlesPath.replaceAll('\\', '/').replaceAll(':', '\\:')}':force_style='FontName=Segoe UI,FontSize=22,PrimaryColour=&H00FFFFFF,OutlineColour=&HAA000000,BorderStyle=3,Outline=1,Shadow=0,MarginV=42'`;
execFileSync('ffmpeg', [
  '-y',
  '-i', rawVideo,
  '-i', ttsAudioPath,
  '-vf', `${subtitleFilter},fps=30,format=yuv420p`,
  '-fps_mode', 'cfr',
  '-t', '130',
  '-c:v', 'libx264',
  '-preset', 'fast',
  '-crf', '23',
  '-c:a', 'aac',
  '-b:a', '128k',
  '-movflags', '+faststart',
  finalVideo,
], { stdio: 'inherit' });

console.log(`\nFinal video: ${finalVideo}`);
