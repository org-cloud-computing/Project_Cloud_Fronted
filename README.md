# React + TypeScript + Vite

## Checkout con MS4

Configura `VITE_MS4_URL` con la URL base del orquestador, incluyendo `/ms4`
(por ejemplo, `http://localhost:8083/ms4` en desarrollo). En Amplify define
la URL HTTPS pública como variable de compilación y vuelve a desplegar.
No agregues `/checkout` a esta variable.

El checkout envía `POST /ms4/checkout` con `cliente_id` numérico,
`direccion_envio` y `metodo_pago` (`tarjeta_credito`, `debito` o `paypal`).
MS4 obtiene el carrito de MS3, valida precios y stock en MS1, registra el
pedido y pago en MS2 y vacía el carrito. El frontend refresca el carrito
y muestra la confirmación con el total y los productos devueltos por MS4.
El resumen previo es estimado; el precio definitivo lo calcula el backend.

Mis pedidos consulta `GET /ms4/checkout/usuario/{cliente_id}/pedidos`.
El detalle de pedido y la confirmación al recargar siguen leyendo MS2, ya
que MS4 no expone el detalle de productos ni el pago en su consulta de estado.
Clientes y autenticación siguen usando MS2. La cuenta de vendedor no puede
comprar porque no representa un cliente numérico del backend.

El cliente espera hasta 120 segundos por MS4 y no reintenta compras
automáticamente. Ante errores de red o servidor, consulta Mis pedidos
antes de repetir el pago: el backend no expone una clave de idempotencia.
El endpoint público debe permitir CORS desde el origen del frontend.

Validación de la integración: `node tests/ms4.mjs`, `npm run build` y
`npm run lint`. Las pruebas de MS4 simulan HTTP y no crean pedidos reales.


## Acceso al panel analítico

El build de producción carga la cuenta de demostración de `.env.production`:
`maybelith.z@gmail.com`, contraseña `12345`. Ingresa desde `/ingresar` y abre
`/analitica`; no es necesario registrar esta cuenta como cliente.

Las variables `VITE_VENDEDOR_EMAIL`, `VITE_VENDEDOR_PASSWORD` y
`VITE_VENDEDOR_NOMBRE` del entorno de compilación (por ejemplo, Amplify)
tienen prioridad. Si se cambian, hay que volver a compilar y desplegar.
Para desarrollo local, copia los valores de `.env.example` a `.env`.
Estas credenciales de demostración se incorporan al JavaScript del frontend.

## Carrito MS3

En `.env`, agrega la siguiente variable sin reemplazar las de otros servicios
(también está documentada en `.env.example`):

```dotenv
VITE_MS3_API_URL=https://okj8uulv98.execute-api.us-east-1.amazonaws.com/api/carritos
```

MS3 usa esta URL completa en lugar de la antigua `VITE_MS3_URL`. Reinicia Vite
después de modificar `.env`; las variables Vite se incorporan durante el build.

```bash
npm ci
npm run dev
```

Abre `http://localhost:5173/carrito` (o el puerto que indique Vite). Ingresa un
ID, por ejemplo `CLI001`, y pulsa **Crear carrito** para enviar
`POST {VITE_MS3_API_URL}` con `{ "idCliente": "CLI001" }`. Pulsa
**Consultar carrito** para enviar `GET {VITE_MS3_API_URL}/cliente/CLI001`.
Crear de nuevo un carrito activo debe mostrar el mensaje 400 de MS3; consultar
un cliente sin carrito debe mostrar «No se encontró un carrito activo para este
cliente». Un resultado vacío muestra «El carrito está vacío» y su resumen.
Para comprobar la lista de productos, consulta un cliente que ya tenga items.

La consulta manual reutiliza `src/pages/Cart.tsx`, `src/api/ms3.ts`, los tipos
compartidos y `PriceTag`. Conserva el componente de carrito de sesión existente
y no cambia su contexto ni el checkout. La consulta manual no modifica el
carrito de sesión. `main.tsx` monta un único BrowserRouter y `App.tsx` conecta
`/carrito`, `/`, `/categoria/:categoryId`, `/analitica` y la página NotFound
para las URL desconocidas. Los estilos nuevos están
limitados a este módulo con CSS Modules.

Validación: `npm run build` y `npx tsc -p tsconfig.app.json --strict --noEmit`.

### API Gateway y CORS

El 12/09/2026, el GET real para `CLI001` devolvió 404 JSON, pero sin
`Access-Control-Allow-Origin`. El preflight OPTIONS para POST con origen
`http://localhost:5173` y cabecera `content-type` devolvió 403
`Invalid CORS request`. Esto impide completar las llamadas desde ese origen en
el navegador. CORS debe habilitarse en API Gateway/backend para el origen del
frontend, los métodos GET/POST y la cabecera Content-Type, incluyendo las
respuestas de error. También debe autorizarse el origen HTTPS del despliegue.
No se agregaron proxies ni cambios de API Gateway o Amplify.

El cliente se verificó con respuestas simuladas 200/201, 400, 404, 403, 500/502,
errores no JSON, red y timeout. No se creó un carrito real durante la validación;
la prueba completa desde navegador queda pendiente de habilitar CORS.

El flujo es React → API Gateway HTTPS → MS3 → MongoDB. El módulo no llama a MS1
ni incluye credenciales o conexiones de MongoDB.

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.
