// ============================================================================
// MS2 — Clientes / Pedidos / Pago (Node.js + Express + MySQL/Sequelize)
// ----------------------------------------------------------------------------
// Cliente real de MS2. Repositorio: https://github.com/org-cloud-computing/Cloud_backend_ms2
//
// MS2 no expone un endpoint que cree pedido + detalle + pago en una sola
// llamada (según su README esos endpoints los usa normalmente el
// orquestador), así que este módulo hace la orquestación desde el front:
//   1. POST /pedidos           -> crea el pedido (cabecera)
//   2. POST /detalle-pedido    -> uno por cada ítem del carrito
//   3. POST /pagos             -> registra el pago del pedido
//
// MS2 tampoco tiene autenticación: el modelo Cliente no guarda `password` y
// no existe endpoint de login. `iniciarSesion` valida la contraseña contra un
// registro guardado únicamente en este navegador (ver LOCAL_CREDENTIALS_KEY);
// los datos del cliente en sí (nombre, email, dirección, teléfono) sí viven
// en MS2. Esto significa que el login solo funciona desde el mismo navegador
// donde se hizo el registro — es una limitación real del backend, no del
// front.
// ============================================================================

import { isAxiosError } from "axios";
import { ms2Client } from "./client";
import type {
  Cliente,
  CrearPedidoPayload,
  DetallePedido,
  IniciarSesionPayload,
  Pago,
  Pedido,
  PedidoConDetalle,
  RegistrarClientePayload,
} from "../types";

const SESSION_KEY = "ms2_session_v1";
const LOCAL_CREDENTIALS_KEY = "ms2_local_credentials_v1";
const IMPUESTO_TASA = 0.18; // IGV Perú
const VENDEDOR_EMAIL = (import.meta.env.VITE_VENDEDOR_EMAIL || "").trim().toLowerCase();
const VENDEDOR_PASSWORD = import.meta.env.VITE_VENDEDOR_PASSWORD || "";
const VENDEDOR_NOMBRE = import.meta.env.VITE_VENDEDOR_NOMBRE || "Vendedor";
const VENDEDOR_ID = "vendedor";

// El único correo que puede ser vendedor; cualquier otro que inicie sesión es
// un cliente normal. Si VITE_VENDEDOR_EMAIL no está configurado, nadie puede
// entrar como vendedor (evita dejar el panel abierto por accidente).
export function esEmailVendedor(email: string): boolean {
  return !!VENDEDOR_EMAIL && email.trim().toLowerCase() === VENDEDOR_EMAIL;
}

export class ApiError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

function statusOf(err: unknown, fallback = 400): number {
  if (isAxiosError(err) && err.response) return err.response.status;
  return fallback;
}

function messageOf(err: unknown, fallback: string): string {
  if (isAxiosError(err)) {
    if (!err.response) return "No se pudo conectar con el servicio de clientes/pedidos (MS2).";
    const data = err.response.data;
    if (data && typeof data === "object" && "error" in data && typeof data.error === "string" && data.error.trim()) {
      return data.error;
    }
  }
  return fallback;
}

function round2(n: number): number {
  return Number(n.toFixed(2));
}

// ---------------------------------------------------------------------------
// Credenciales locales (MS2 no soporta autenticación, ver cabecera del archivo)
// ---------------------------------------------------------------------------

function credentialKey(email: string): string {
  return email.trim().toLowerCase();
}

function leerCredenciales(): Record<string, string> {
  const raw = localStorage.getItem(LOCAL_CREDENTIALS_KEY);
  return raw ? (JSON.parse(raw) as Record<string, string>) : {};
}

function guardarCredencialLocal(email: string, password: string): void {
  const store = leerCredenciales();
  store[credentialKey(email)] = password;
  localStorage.setItem(LOCAL_CREDENTIALS_KEY, JSON.stringify(store));
}

// ---------------------------------------------------------------------------
// Clientes
// ---------------------------------------------------------------------------

export async function registrarCliente({
  nombre,
  email,
  password,
  direccion = "",
  telefono = "",
}: RegistrarClientePayload): Promise<Cliente> {
  if (esEmailVendedor(email)) {
    throw new ApiError("Ese correo no está disponible para registro.", 409);
  }
  try {
    const { data } = await ms2Client.post<Cliente>("/clientes", { nombre, email, direccion, telefono });
    guardarCredencialLocal(email, password);
    return data;
  } catch (err) {
    throw new ApiError(messageOf(err, "No se pudo crear la cuenta."), statusOf(err));
  }
}

export async function iniciarSesion({ email, password }: IniciarSesionPayload): Promise<Cliente> {
  if (esEmailVendedor(email)) {
    if (password !== VENDEDOR_PASSWORD) {
      throw new ApiError("Correo o contraseña incorrectos.", 401);
    }
    return { id: VENDEDOR_ID, nombre: VENDEDOR_NOMBRE, email: VENDEDOR_EMAIL };
  }

  let clientes: Cliente[];
  try {
    const { data } = await ms2Client.get<Cliente[]>("/clientes");
    clientes = data;
  } catch (err) {
    throw new ApiError(messageOf(err, "No se pudo conectar con el servicio de clientes."), statusOf(err));
  }

  const cliente = clientes.find((c) => c.email.toLowerCase() === email.toLowerCase());
  const passwordGuardada = leerCredenciales()[credentialKey(email)];
  if (!cliente || passwordGuardada === undefined || passwordGuardada !== password) {
    throw new ApiError("Correo o contraseña incorrectos.", 401);
  }
  return cliente;
}

export async function getClienteById(id: string | number): Promise<Cliente> {
  try {
    const { data } = await ms2Client.get<Cliente>(`/clientes/${encodeURIComponent(String(id))}`);
    return data;
  } catch (err) {
    throw new ApiError(messageOf(err, "Cliente no encontrado."), statusOf(err, 404));
  }
}

// Sesión guardada en localStorage (MS2 no emite tokens; el front conserva al
// cliente devuelto por /clientes tal cual)
export function guardarSesion(cliente: Cliente): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(cliente));
}
export function obtenerSesion(): Cliente | null {
  const raw = localStorage.getItem(SESSION_KEY);
  return raw ? (JSON.parse(raw) as Cliente) : null;
}
export function cerrarSesion(): void {
  localStorage.removeItem(SESSION_KEY);
}

// ---------------------------------------------------------------------------
// Pedidos + Detalle + Pago
// ---------------------------------------------------------------------------

// Crea un pedido a partir de los items de un carrito de MS3, orquestando las
// tres llamadas que expone MS2 (pedido, detalle-pedido x N, pago).
export async function crearPedidoDesdeCarrito({
  clienteId,
  items,
  metodoPago,
  direccionEnvio,
}: CrearPedidoPayload): Promise<PedidoConDetalle> {
  const subtotal = round2(items.reduce((sum, it) => sum + it.precioUnitario * it.cantidad, 0));
  const impuestos = round2(subtotal * IMPUESTO_TASA);
  const total = round2(subtotal + impuestos);

  let pedido: Pedido;
  try {
    const { data } = await ms2Client.post<Pedido>("/pedidos", {
      cliente_id: clienteId,
      estado: "pagado",
      subtotal,
      impuestos,
      total,
      direccion_envio: direccionEnvio,
      metodo_pago: metodoPago,
    });
    pedido = data;
  } catch (err) {
    throw new ApiError(messageOf(err, "No se pudo registrar el pedido."), statusOf(err));
  }

  let detalle: DetallePedido[];
  try {
    detalle = await Promise.all(
      items.map(async (it) => {
        const { data } = await ms2Client.post<DetallePedido>("/detalle-pedido", {
          pedido_id: pedido.id,
          producto_id: it.idProducto,
          producto_nombre: it.nombre,
          precio_unitario: it.precioUnitario,
          cantidad: it.cantidad,
          subtotal: round2(it.precioUnitario * it.cantidad),
        });
        return data;
      })
    );
  } catch (err) {
    throw new ApiError(messageOf(err, "El pedido se creó, pero no se pudo registrar el detalle de productos."), statusOf(err));
  }

  let pago: Pago;
  try {
    const { data } = await ms2Client.post<Pago>("/pagos", {
      pedido_id: pedido.id,
      metodo_pago: metodoPago,
      monto: total,
      estado_pago: "aprobado",
    });
    pago = data;
  } catch (err) {
    throw new ApiError(messageOf(err, "El pedido se registró, pero no se pudo procesar el pago."), statusOf(err));
  }

  return { pedido, detalle, pago };
}

export async function getPedidosByCliente(clienteId: string | number): Promise<Pedido[]> {
  try {
    const { data } = await ms2Client.get<Pedido[]>(`/pedidos/cliente/${encodeURIComponent(String(clienteId))}`);
    return [...data].sort((a, b) => new Date(b.fecha_pedido).getTime() - new Date(a.fecha_pedido).getTime());
  } catch (err) {
    throw new ApiError(messageOf(err, "No se pudieron cargar tus pedidos."), statusOf(err));
  }
}

export async function getPedidoById(pedidoId: string | number): Promise<PedidoConDetalle> {
  const id = encodeURIComponent(String(pedidoId));

  let pedido: Pedido;
  try {
    const { data } = await ms2Client.get<Pedido>(`/pedidos/${id}`);
    pedido = data;
  } catch (err) {
    throw new ApiError(messageOf(err, "Pedido no encontrado."), statusOf(err, 404));
  }

  const [detalle, pago] = await Promise.all([
    ms2Client
      .get<DetallePedido[]>(`/detalle-pedido/pedido/${id}`)
      .then((r) => r.data)
      .catch(() => [] as DetallePedido[]),
    ms2Client
      .get<Pago>(`/pagos/pedido/${id}`)
      .then((r) => r.data)
      .catch(() => null as Pago | null),
  ]);

  return { pedido, detalle, pago };
}