// Prueba en Chromium con HTTP simulado. CHROME_BIN permite elegir el ejecutable.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from 'vite';

const browserTest = `
import { createElement as h } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import OrderDetail from '/src/pages/OrderDetail.tsx';
import { ms2Client, ms4Client } from '/src/api/client.ts';
const container = document.getElementById('app');
const check = (condition, message) => { if (!condition) throw new Error(message); };
const waitFor = async (predicate) => {
  for (let i = 0; i < 100; i++) {
    if (predicate()) return;
    await new Promise(resolve => setTimeout(resolve, 10));
  }
  throw new Error('Tiempo agotado: ' + container.textContent);
};
const response = (config, data) => ({ data, config, status: 200, statusText: 'OK', headers: {} });
let root;
try {
  for (const mode of ['ok', 'failed', 'pending', 'missing']) {
    const calls = [];
    ms2Client.defaults.adapter = async config => {
      calls.push(config.method + ' ' + config.url);
      if (mode === 'missing') throw { isAxiosError: true, response: { status: 404, data: { error: 'Pedido no encontrado.' } } };
      if (config.url === '/pedidos/12') return response(config, {
        id: 12, cliente_id: 7, estado: 'pendiente', fecha_pedido: '2026-09-23',
        subtotal: 100, impuestos: 18, total: 118, metodo_pago: 'debito', direccion_envio: 'Lima',
      });
      if (config.url === '/detalle-pedido/pedido/12') return response(config, [
        { id: 1, producto_nombre: 'Producto de prueba', cantidad: 2, subtotal: 100 },
      ]);
      if (config.url === '/pagos/pedido/12') return response(config, { metodo_pago: 'debito', estado_pago: 'aprobado' });
      throw new Error('Ruta inesperada: ' + config.url);
    };
    ms4Client.defaults.adapter = async config => {
      calls.push(config.method + ' ' + config.url);
      check(config.url === '/checkout/12/estado', 'Ruta de estado incorrecta');
      if (mode === 'failed') throw { isAxiosError: true, response: { status: 503, data: {} } };
      if (mode === 'pending') return new Promise(() => {});
      return response(config, { pedido_id: 12, estado: 'pagado', total: '118.00', fecha_pedido: '2026-09-23' });
    };
    root = createRoot(container);
    root.render(h(MemoryRouter, { initialEntries: ['/cuenta/pedidos/12'] },
      h(Routes, null, h(Route, { path: '/cuenta/pedidos/:orderId', element: h(OrderDetail) }))));
    if (mode === 'missing') {
      await waitFor(() => container.querySelector('[role="alert"]'));
      check(container.textContent.includes('Pedido no encontrado'), 'No muestra el error de MS2');
    } else {
      await waitFor(() => container.textContent.includes('Producto de prueba'));
      if (mode === 'ok') await waitFor(() => container.querySelector('.badge')?.textContent === 'pagado');
      if (mode === 'failed') await waitFor(() => container.querySelector('[role="status"]'));
      if (mode !== 'ok') check(container.querySelector('.badge').textContent === 'pendiente', 'Debe conservar el estado de MS2');
      check(container.textContent.includes('118.00'), 'Total incorrecto');
      check(container.textContent.includes('aprobado'), 'Falta el pago');
      check(!container.querySelector('[role="alert"]'), 'El fallo de MS4 oculta el pedido');
    }
    check(calls.every(call => call.startsWith('get ')), 'La vista no debe modificar pedidos');
    root.unmount();
    root = null;
  }
  document.getElementById('result').textContent = 'PASS: estado, productos, pago, MS4 caído o pendiente y pedido inexistente';
} catch (error) {
  document.getElementById('result').textContent = 'FAIL: ' + error.message;
} finally { root?.unmount(); }
`;
const profile = await mkdtemp(join(tmpdir(), 'ms4-browser-'));
const server = await createServer({
  appType: 'custom',
  server: { host: '127.0.0.1', port: 0 },
  define: { 'import.meta.env.VITE_MS4_URL': JSON.stringify('https://compras.example/ms4') },
});
server.middlewares.use('/__regression', async (_req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.end(await server.transformIndexHtml('/__regression',
    '<div id="app"></div><pre id="result">RUNNING</pre><script type="module">' + browserTest + '</script>'));
});
try {
  await server.listen();
  const address = server.httpServer.address();
  const child = spawn(process.env.CHROME_BIN || 'chromium', [
    '--headless', '--disable-gpu', '--no-sandbox', '--disable-dev-shm-usage',
    '--user-data-dir=' + profile, '--dump-dom', '--virtual-time-budget=15000',
    'http://127.0.0.1:' + address.port + '/__regression',
  ], { stdio: ['ignore', 'pipe', 'pipe'] });
  let output = '', errors = '';
  child.stdout.on('data', chunk => { output += chunk; });
  child.stderr.on('data', chunk => { errors += chunk; });
  const timer = setTimeout(() => child.kill(), 45000);
  try {
    const code = await new Promise((resolve, reject) => {
      child.on('error', reject);
      child.on('close', resolve);
    });
    assert.equal(code, 0, errors);
    const result = output.match(/<pre id="result">([^<]*)<\/pre>/)?.[1];
    assert.match(result || output.slice(-2000), /^PASS:/);
    console.log(result);
  } finally { clearTimeout(timer); }
} finally {
  await server.close();
  await rm(profile, { recursive: true, force: true });
}
