import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { dirname, extname, join, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const { chromium } = await import(process.env.TC12_PLAYWRIGHT_MODULE
  ? pathToFileURL(process.env.TC12_PLAYWRIGHT_MODULE).href : 'playwright');
const dist = resolve(dirname(fileURLToPath(import.meta.url)), '../dist/clinica_admin_portal/browser');
const [backend, correo, contrasena, pacienteDni, especialidad, fecha] = process.argv.slice(2);
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml' };
const api = /https:\/\/clinica-[\w.-]+\.azurewebsites\.net\/api/g;
const server = createServer(async (request, response) => {
  try {
    const path = new URL(request.url, 'http://localhost').pathname;
    if (path.startsWith('/api/')) {
      const chunks = [];
      for await (const chunk of request) chunks.push(chunk);
      const headers = {};
      for (const name of ['authorization', 'content-type']) {
        if (request.headers[name]) headers[name] = request.headers[name];
      }
      const upstream = await fetch(new URL(request.url, backend), {
        method: request.method, headers, body: chunks.length ? Buffer.concat(chunks) : undefined,
      });
      response.writeHead(upstream.status, { 'Content-Type': upstream.headers.get('content-type') || 'application/json' });
      response.end(Buffer.from(await upstream.arrayBuffer()));
      return;
    }
    const file = resolve(dist, `.${path}`);
    if (file !== dist && !file.startsWith(dist + sep)) return response.writeHead(404).end();
    const target = extname(file) ? file : join(dist, 'index.html');
    const data = await readFile(target);
    response.writeHead(200, { 'Content-Type': mime[extname(target)] || 'application/octet-stream' });
    response.end(extname(target) === '.js' ? data.toString('utf8').replace(api, '/api') : data);
  } catch {
    response.writeHead(404).end();
  }
});

let browser;
try {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch({ channel: process.env.TC12_BROWSER_CHANNEL ?? 'msedge' });
  const page = await browser.newPage();
  page.setDefaultTimeout(8_000);
  await page.route('**/*', route => route.request().url().startsWith(origin + '/') ? route.continue() : route.abort());
  await page.goto(origin + '/login');
  await page.locator('[formcontrolname=email]').fill(correo);
  await page.locator('[formcontrolname=password]').fill(contrasena);
  const login = page.waitForResponse(res => res.url().endsWith('/api/auth/login'));
  await page.locator('button[type=submit]').click();
  assert.equal((await login).status(), 200);
  await page.waitForFunction(() => Boolean(localStorage.getItem('auth_token')));
  await page.goto(origin + '/citas/agendar');

  await page.locator('.custom-select-trigger').click();
  await page.locator('.custom-select-option').filter({ hasText: pacienteDni }).click();
  await page.locator('select[formcontrolname=especialidadId]').selectOption({ label: especialidad });
  await page.locator('input[type=date]').fill(fecha);
  const slots = page.locator('.doctor-card').first().locator('.time-slot');
  await slots.first().waitFor();
  assert.deepEqual(await slots.allTextContents().then(hours => hours.map(h => h.trim())),
    ['08:00', '09:00', '10:00', '11:00', '12:00']);
  console.log('TC-F-003, TC-F-004 y TC-F-005: grilla de 08:00 a 12:00, con cierre exclusivo a las 13:00.');

  await slots.last().click();
  const solicitud = page.waitForResponse(res => res.url().endsWith('/api/citas') && res.request().method() === 'POST');
  await page.locator('button[type=submit]').click();
  const response = await solicitud;
  assert.equal(response.status(), 201, await response.text());
  assert.equal((await response.json()).estadoCita, 'Confirmada');
  await page.waitForURL(origin + '/citas');
  await page.getByText('Confirmada', { exact: true }).first().waitFor();
  console.log('TC-F-001 y TC-F-004: reserva de las 12:00 persistida y estado Confirmada visible.');
} finally {
  await browser?.close();
  server.close();
}
