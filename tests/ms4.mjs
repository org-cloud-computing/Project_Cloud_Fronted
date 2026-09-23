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

  const pedido = {
    cliente_id: 7, subtotal: 100, impuestos: 18, total: 118,
    direccion_envio: ' Lima ', metodo_pago: 'debito',
  };
  const pago = { pedido_id: 12, monto: 118, metodo_pago: 'debito' };
  const reserva = { producto_id: 5, cliente_id: 7, cantidad: 2 };
  const endpoints = [
    ['getHealth', [], 'get', '/health', undefined,
      { status: 'ok', service: 'ms4-orquestador', timestamp: '2026-09-23T10:00:00' }],
    ['getEstadoPedido', ['12'], 'get', '/checkout/12/estado', undefined,
      { pedido_id: 12, estado: 'pagado', fecha_pedido: '2026-09-23', total: '118.00' }],
    ['reservarStock', [reserva], 'patch', '/stock/reservar', reserva,
      { exito: true, product_id: 5, available_stock: 8 }],
    ['crearPedido', [pedido], 'post', '/pedidos', { ...pedido, direccion_envio: 'Lima' },
      { ...pedido, id: 12, estado: 'pendiente', fecha_pedido: '2026-09-23' }],
    ['registrarPago', [pago], 'post', '/pagos', { ...pago, estado_pago: 'aprobado' },
      { ...pago, id: 34, estado_pago: 'aprobado', fecha_pago: '2026-09-23' }],
    ['registrarPago', [{ ...pago, estado_pago: 'en_proceso' }], 'post', '/pagos',
      { ...pago, estado_pago: 'en_proceso' }, { ...pago, id: 35, estado_pago: 'en_proceso' }],
  ];
  for (const [name, args, method, url, body, response] of endpoints) {
    let requests = 0;
    client.defaults.adapter = async (config) => {
      requests++;
      assert.equal(config.baseURL, 'https://compras.example/ms4');
      assert.equal(config.method, method);
      assert.equal(config.url, url);
      assert.deepEqual(config.data ? JSON.parse(config.data) : undefined, body);
      return { data: response, status: method === 'post' ? 201 : 200, statusText: 'OK', headers: {}, config };
    };
    assert.deepEqual(await api[name](...args), response);
    assert.equal(requests, 1);

    for (const [status, data, expected] of [
      [409, { detail: 'Stock insuficiente' }, /Stock insuficiente/],
      [404, { detail: 'Pedido no encontrado' }, /Pedido no encontrado/],
      [422, { detail: [{ msg: 'Invalid input' }] }, /Verifica los datos/],
      [503, { detail: 'Internal backend URL' }, /El servicio no pudo completar/],
      [0, null, /No se pudo confirmar/],
    ]) {
      let attempts = 0;
      client.defaults.adapter = async () => {
        attempts++;
        throw { isAxiosError: true, response: status ? { status, data } : undefined };
      };
      await assert.rejects(api[name](...args), expected);
      assert.equal(attempts, 1, `${name} no reintenta automáticamente`);
    }
  }

  client.defaults.adapter = async () => { assert.fail('Datos inválidos no deben enviar HTTP'); };
  for (const id of ['', 0, -1, 1.5, 'abc', Number.MAX_SAFE_INTEGER + 1]) {
    await assert.rejects(api.getEstadoPedido(id), /entero positivo/);
    await assert.rejects(api.registrarPago({ ...pago, pedido_id: id }), /entero positivo/);
    await assert.rejects(api.reservarStock({ ...reserva, producto_id: id }), /entero positivo/);
    await assert.rejects(api.reservarStock({ ...reserva, cantidad: id }), /entero positivo/);
    await assert.rejects(api.crearPedido({ ...pedido, cliente_id: id }), /cuenta de cliente/);
  }
  for (const value of [-1, NaN, Infinity]) {
    await assert.rejects(api.registrarPago({ ...pago, monto: value }), /importes/);
    for (const field of ['subtotal', 'impuestos', 'total']) {
      await assert.rejects(api.crearPedido({ ...pedido, [field]: value }), /importes/);
    }
  }
});

await withClient('', async (api, client) => {
  client.defaults.adapter = async () => { assert.fail('No debe enviar HTTP sin URL'); };
  await assert.rejects(api.procesarCheckout({
    cliente_id: 7, direccion_envio: 'Lima', metodo_pago: 'paypal',
  }), /Configura VITE_MS4_URL/);
  await assert.rejects(api.getHealth(), /Configura VITE_MS4_URL/);
  await assert.rejects(api.getEstadoPedido(12), /Configura VITE_MS4_URL/);
  await assert.rejects(api.getPedidosByCliente(7), /Configura VITE_MS4_URL/);
  await assert.rejects(api.reservarStock({ producto_id: 5, cliente_id: 7, cantidad: 2 }), /Configura VITE_MS4_URL/);
  await assert.rejects(api.crearPedido({
    cliente_id: 7, subtotal: 100, impuestos: 18, total: 118,
    direccion_envio: 'Lima', metodo_pago: 'debito',
  }), /Configura VITE_MS4_URL/);
  await assert.rejects(api.registrarPago({ pedido_id: 12, monto: 118, metodo_pago: 'debito' }), /Configura VITE_MS4_URL/);
});
console.log('MS4: siete endpoints, contratos, validación, errores y configuración verificados.');
