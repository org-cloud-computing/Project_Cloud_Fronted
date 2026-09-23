import assert from 'node:assert/strict';
import { createServer } from 'vite';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

// Carga TypeScript con Vite y sustituye HTTP: no genera compras reales.
async function withClient(url, verify) {
  const server = await createServer({
    configFile: false,
    server: { middlewareMode: true, watch: null, ws: false },
    define: { 'import.meta.env.VITE_MS4_URL': JSON.stringify(url) },
  });
  try {
    const api = await server.ssrLoadModule('/src/api/ms4.ts');
    const { ms4Client } = await server.ssrLoadModule('/src/api/client.ts');
    await verify(api, ms4Client, server);
  } finally {
    await server.close();
  }
}

await withClient('https://compras.example/ms4/', async (api, client, server) => {
  const calls = [];
  const result = {
    mensaje: 'Checkout completado exitosamente', pedido_id: 12, pago_id: 34,
    total: 118, estado_pedido: 'pendiente',
    items: [{ producto_id: 5, cantidad: 2, precio_unitario: 50, producto_nombre: 'Producto' }],
  };
  client.defaults.adapter = async (config) => {
    calls.push(config);
    return { data: result, status: 200, statusText: 'OK', headers: {}, config };
  };
  const payload = { cliente_id: 7, direccion_envio: ' Lima ', metodo_pago: 'debito' };
  assert.deepEqual(await api.procesarCheckout(payload), result);
  const { default: Confirmation } = await server.ssrLoadModule('/src/pages/OrderConfirmation.tsx');
  const confirmation = renderToStaticMarkup(createElement(MemoryRouter, {
    initialEntries: [{ pathname: '/pedido-confirmado/12', state: { checkout: result } }],
  }, createElement(Routes, null, createElement(Route, {
    path: '/pedido-confirmado/:orderId', element: createElement(Confirmation),
  }))));
  assert.match(confirmation, /¡Pedido confirmado!/);
  assert.match(confirmation, /Estado del pedido: pendiente/);
  assert.match(confirmation, /Estado del pago: aprobado/);
  assert.match(confirmation, /Producto × 2/);
  assert.match(confirmation, /118/);

  assert.equal(calls.length, 1);
  assert.equal(calls[0].baseURL, 'https://compras.example/ms4');
  assert.equal(calls[0].url, '/checkout');
  assert.equal(calls[0].method, 'post');
  assert.equal(calls[0].timeout, 120000);
  assert.deepEqual(JSON.parse(calls[0].data), { ...payload, direccion_envio: 'Lima' });

  for (const id of ['vendedor', '', 0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1]) {
    await assert.rejects(api.procesarCheckout({ ...payload, cliente_id: id }), /cuenta de cliente/);
  }
  assert.equal(calls.length, 1, 'IDs inválidos no envían solicitudes');
  assert.equal(api.clienteIdNumerico('7'), 7);

  let attempts = 0;
  for (const [status, data, expected] of [
    [400, { detail: 'Stock insuficiente para producto 5' }, /Stock insuficiente/],
    [404, { detail: 'Cliente no encontrado' }, /Cliente no encontrado/],
    [422, { detail: [{ msg: 'Invalid input' }] }, /Verifica los datos/],
    [503, { detail: 'Internal backend URL' }, /Revisa Mis pedidos/],
    [502, '<html>Bad gateway</html>', /Revisa Mis pedidos/],
    [0, null, /Revisa Mis pedidos/],
  ]) {
    client.defaults.adapter = async () => {
      attempts++;
      throw { isAxiosError: true, response: status ? { status, data } : undefined };
    };
    await assert.rejects(api.procesarCheckout(payload), expected);
  }
  assert.equal(attempts, 6, 'No reintenta pagos fallidos automáticamente');

  client.defaults.adapter = async (config) => {
    assert.equal(config.method, 'get');
    assert.equal(config.url, '/checkout/usuario/7/pedidos');
    return { data: [
      { id: 1, fecha_pedido: '2026-09-01' }, { id: 2, fecha_pedido: '2026-09-23' },
    ], status: 200, statusText: 'OK', headers: {}, config };
  };
  assert.deepEqual((await api.getPedidosByCliente('7')).map((p) => p.id), [2, 1]);
});

await withClient('', async (api, client) => {
  client.defaults.adapter = async () => { assert.fail('No debe enviar HTTP sin URL'); };
  await assert.rejects(api.procesarCheckout({
    cliente_id: 7, direccion_envio: 'Lima', metodo_pago: 'paypal',
  }), /Configura VITE_MS4_URL/);
});
console.log('MS4: contrato, validación, errores, historial y configuración verificados.');
