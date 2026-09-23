import { isAxiosError } from "axios";
import { ms4Client } from "./client";
import type { CheckoutRequest, CheckoutResponse, Pedido } from "../types";

export function clienteIdNumerico(id: string | number): number {
  const value = Number(id);
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new Error("Para comprar necesitas una cuenta de cliente válida. La cuenta de vendedor no puede realizar compras.");
  }
  return value;
}

export function mensajeErrorMS4(error: unknown): string {
  if (!isAxiosError(error)) {
    return error instanceof Error ? error.message : "No se pudo completar la solicitud.";
  }
  if (!error.response) {
    return "No se pudo confirmar el resultado de la solicitud. Revisa Mis pedidos antes de intentar pagar nuevamente.";
  }
  const { status, data } = error.response;
  if (status >= 500) {
    return "El servicio de compras no pudo completar la solicitud. Revisa Mis pedidos antes de intentar pagar nuevamente.";
  }
  if (typeof data?.detail === "string") return data.detail;
  if (status === 422) return "Verifica los datos del cliente, la dirección y el método de pago.";
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
    throw new Error(mensajeErrorMS4(error));
  }
}
