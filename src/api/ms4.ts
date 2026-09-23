import { isAxiosError } from "axios";
import { ms4Client } from "./client";
import type {
  CheckoutRequest, CheckoutResponse, Pedido, Pago, HealthResponse,
  EstadoPedidoResponse, ReservarStockRequest, ReservarStockResponse,
  CrearPedidoRequest, CrearPagoRequest,
} from "../types";

export function clienteIdNumerico(id: string | number): number {
  const value = Number(id);
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new Error("Para comprar necesitas una cuenta de cliente válida. La cuenta de vendedor no puede realizar compras.");
  }
  return value;
}

export function mensajeErrorMS4(error: unknown, operacion = "checkout"): string {
  if (!isAxiosError(error)) {
    return error instanceof Error ? error.message : "No se pudo completar la solicitud.";
  }
  if (!error.response) {
    if (operacion !== "checkout") return `No se pudo confirmar el resultado al ${operacion}. Comprueba el resultado antes de volver a intentarlo.`;
    return "No se pudo confirmar el resultado de la solicitud. Revisa Mis pedidos antes de intentar pagar nuevamente.";
  }
  const { status, data } = error.response;
  if (status >= 500) {
    if (operacion !== "checkout") return `El servicio no pudo completar la solicitud al ${operacion}. Comprueba el resultado antes de volver a intentarlo.`;
    return "El servicio de compras no pudo completar la solicitud. Revisa Mis pedidos antes de intentar pagar nuevamente.";
  }
  if (typeof data?.detail === "string") return data.detail;
  if (status === 422) return operacion === "checkout"
    ? "Verifica los datos del cliente, la dirección y el método de pago."
    : `Verifica los datos para ${operacion}.`;
  return "No se pudo completar la solicitud de compra.";
}

export async function procesarCheckout(payload: CheckoutRequest): Promise<CheckoutResponse> {
  try {
    const { data } = await ms4Client.post<CheckoutResponse>("/checkout", {
      cliente_id: clienteIdNumerico(payload.cliente_id),
      direccion_envio: payload.direccion_envio.trim(),
      metodo_pago: payload.metodo_pago,
    });
    return data;
  } catch (error) {
    throw new Error(mensajeErrorMS4(error));
  }
}

export async function getPedidosByCliente(clienteId: string | number): Promise<Pedido[]> {
  try {
    const id = clienteIdNumerico(clienteId);
    const { data } = await ms4Client.get<Pedido[]>(`/checkout/usuario/${id}/pedidos`);
    return [...data].sort((a, b) => new Date(b.fecha_pedido).getTime() - new Date(a.fecha_pedido).getTime());
  } catch (error) {
    throw new Error(mensajeErrorMS4(error, "consultar tus pedidos"));
  }
}

function idPositivo(id: string | number, nombre: string): number {
  const value = Number(id);
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new Error(`${nombre} debe ser un entero positivo.`);
  }
  return value;
}

function montoValido(value: number): number {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error("Los importes deben ser números finitos mayores o iguales a cero.");
  }
  return value;
}

export async function getHealth(): Promise<HealthResponse> {
  try {
    const { data } = await ms4Client.get<HealthResponse>("/health");
    return data;
  } catch (error) {
    throw new Error(mensajeErrorMS4(error, "consultar el servicio"));
  }
}

export async function getEstadoPedido(pedidoId: string | number): Promise<EstadoPedidoResponse> {
  try {
    const id = idPositivo(pedidoId, "El ID del pedido");
    const { data } = await ms4Client.get<EstadoPedidoResponse>(`/checkout/${id}/estado`);
    return data;
  } catch (error) {
    throw new Error(mensajeErrorMS4(error, "consultar el estado del pedido"));
  }
}

// Proxies independientes: no incluirlos en procesarCheckout, que ya ejecuta
// estas operaciones en el backend con sus propias compensaciones.
export async function reservarStock(payload: ReservarStockRequest): Promise<ReservarStockResponse> {
  try {
    const { data } = await ms4Client.patch<ReservarStockResponse>("/stock/reservar", {
      producto_id: idPositivo(payload.producto_id, "El ID del producto"),
      cliente_id: clienteIdNumerico(payload.cliente_id),
      cantidad: idPositivo(payload.cantidad, "La cantidad"),
    });
    return data;
  } catch (error) {
    throw new Error(mensajeErrorMS4(error, "reservar stock"));
  }
}

export async function crearPedido(payload: CrearPedidoRequest): Promise<Pedido> {
  try {
    const { data } = await ms4Client.post<Pedido>("/pedidos", {
      cliente_id: clienteIdNumerico(payload.cliente_id),
      subtotal: montoValido(payload.subtotal),
      impuestos: montoValido(payload.impuestos),
      total: montoValido(payload.total),
      direccion_envio: payload.direccion_envio.trim(),
      metodo_pago: payload.metodo_pago,
    });
    return data;
  } catch (error) {
    throw new Error(mensajeErrorMS4(error, "crear el pedido"));
  }
}

export async function registrarPago(payload: CrearPagoRequest): Promise<Pago> {
  try {
    const { data } = await ms4Client.post<Pago>("/pagos", {
      pedido_id: idPositivo(payload.pedido_id, "El ID del pedido"),
      monto: montoValido(payload.monto),
      metodo_pago: payload.metodo_pago,
      estado_pago: payload.estado_pago ?? "aprobado",
    });
    return data;
  } catch (error) {
    throw new Error(mensajeErrorMS4(error, "registrar el pago"));
  }
}
