import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import * as ms2 from "../api/ms2";
import { formatPEN } from "../components/PriceTag";
import type { PedidoConDetalle } from "../types";

export default function OrderConfirmation() {
  const { orderId } = useParams<{ orderId: string }>();
  const [data, setData] = useState<PedidoConDetalle | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) return;
    ms2
      .getPedidoById(orderId)
      .then(setData)
      .catch(() => setError("No se encontró este pedido."));
  }, [orderId]);

  if (error) {
    return (
      <div className="container">
        <div className="state-msg">
          <h3>{error}</h3>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container">
        <div className="skeleton" style={{ height: 200, margin: "40px 0" }} />
      </div>
    );
  }

  const { pedido, detalle } = data;

  return (
    <div className="container">
      <div className="auth-page" style={{ maxWidth: 560 }}>
        <div className="auth-card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>✅</div>
          <h1>¡Pedido confirmado!</h1>
          <p className="subtitle">
            Tu pedido #{pedido.id} fue registrado y el pago quedó {pedido.estado === "pagado" ? "aprobado" : pedido.estado}.
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
            <span>S/ {formatPEN(pedido.total)}</span>
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
