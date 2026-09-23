import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import * as ms2 from "../api/ms2";
import { formatPEN } from "../components/PriceTag";
import type { CheckoutResponse, PedidoConDetalle } from "../types";

export default function OrderConfirmation() {
  const { orderId } = useParams<{ orderId: string }>();
  const location = useLocation();
  const checkout = (location.state as { checkout?: CheckoutResponse } | null)?.checkout;
  const confirmed = checkout && String(checkout.pedido_id) === orderId ? checkout : null;
  const [data, setData] = useState<PedidoConDetalle | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId || confirmed) return;
    ms2
      .getPedidoById(orderId)
      .then(setData)
      .catch(() => setError("No se encontró este pedido."));
  }, [orderId, confirmed]);

  if (error) {
    return (
      <div className="container">
        <div className="state-msg">
          <h3>{error}</h3>
        </div>
      </div>
    );
  }

  if (!data && !confirmed) {
    return (
      <div className="container">
        <div className="skeleton" style={{ height: 200, margin: "40px 0" }} />
      </div>
    );
  }

  const pedidoId = confirmed?.pedido_id ?? data!.pedido.id;
  const total = confirmed?.total ?? data!.pedido.total;
  const estado = confirmed?.estado_pedido ?? data!.pedido.estado;
  const estadoPago = confirmed ? "aprobado" : data?.pago?.estado_pago;
  const detalle = confirmed
    ? confirmed.items.map((item) => ({
        id: item.producto_id,
        producto_nombre: item.producto_nombre,
        cantidad: item.cantidad,
        subtotal: item.precio_unitario * item.cantidad,
      }))
    : data!.detalle;

  return (
    <div className="container">
      <div className="auth-page" style={{ maxWidth: 560 }}>
        <div className="auth-card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>✅</div>
          <h1>¡Pedido confirmado!</h1>
          <p className="subtitle">
            Tu pedido #{pedidoId} fue registrado. Estado del pedido: {estado}.
            {estadoPago && <> Estado del pago: {estadoPago}.</>}
          </p>

          <div className="section-divider" />
          {detalle.map((d) => (
            <div key={d.id} className="order-detail-row">
              <span>
                {d.producto_nombre} × {d.cantidad}
              </span>
              <span>S/ {formatPEN(d.subtotal)}</span>
            </div>
          ))}
          <div className="order-detail-row" style={{ fontWeight: 700, borderBottom: "none" }}>
            <span>Total pagado</span>
            <span>S/ {formatPEN(total)}</span>
          </div>

          <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 24 }}>
            <Link to="/cuenta/pedidos" className="btn btn-outline">
              Ver mis pedidos
            </Link>
            <Link to="/" className="btn btn-primary">
              Seguir comprando
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
