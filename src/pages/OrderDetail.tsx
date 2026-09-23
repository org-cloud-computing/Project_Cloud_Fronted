import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import * as ms2 from "../api/ms2";
import * as ms4 from "../api/ms4";
import { formatPEN } from "../components/PriceTag";
import type { EstadoPedidoResponse, PedidoConDetalle } from "../types";

export default function OrderDetail() {
  const { orderId } = useParams<{ orderId: string }>();
  return orderId ? <OrderDetailContent key={orderId} orderId={orderId} /> : null;
}

function OrderDetailContent({ orderId }: { orderId: string }) {
  const [data, setData] = useState<PedidoConDetalle | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [estado, setEstado] = useState<EstadoPedidoResponse | null>(null);
  const [estadoError, setEstadoError] = useState(false);

  useEffect(() => {
    let active = true;
    ms2.getPedidoById(orderId)
      .then((detalle) => { if (active) setData(detalle); })
      .catch((err: Error) => { if (active) setError(err.message); });
    ms4.getEstadoPedido(orderId)
      .then((result) => { if (active) setEstado(result); })
      .catch(() => { if (active) setEstadoError(true); });
    return () => { active = false; };
  }, [orderId]);

  if (error) {
    return (
      <div className="container">
        <div className="state-msg">
          <h3 role="alert">{error}</h3>
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

  const { pedido, detalle, pago } = data;
  const total = estado?.total == null ? Number(pedido.total) : Number(estado.total);

  return (
    <div className="container">
      <p className="breadcrumb">
        <Link to="/cuenta/pedidos">Mis pedidos</Link> {" › "} Pedido #{pedido.id}
      </p>
      <div className="page-heading">
        <h1>Pedido #{pedido.id}</h1>
        <p>
          {new Date((estado?.fecha_pedido ?? pedido.fecha_pedido).replace(" ", "T")).toLocaleString("es-PE")}
        </p>
      </div>

      <div className="page-body" style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 32 }}>
        <div className="card" style={{ padding: 22 }}>
          <h3 style={{ marginBottom: 14 }}>Productos</h3>
          {detalle.map((d) => (
  <div key={d.id} className="order-detail-row">
    <span>
      {d.producto_nombre} × {d.cantidad}
    </span>
    <span>S/ {formatPEN(d.subtotal)}</span>
  </div>
))}
        </div>

        <div className="card" style={{ padding: 22, height: "fit-content" }}>
          <h3 style={{ marginBottom: 14 }}>Estado</h3>
          <span className="badge badge-teal" style={{ marginBottom: 16 }}>
            {estado?.estado ?? pedido.estado}
          </span>
          {estadoError && <p role="status">No se pudo actualizar el estado. Se muestran los datos del pedido disponibles.</p>}
          <div className="cart-summary-row">
            <span>Subtotal</span>
            <span>S/ {formatPEN(Number(pedido.subtotal))}</span>
          </div>
          <div className="cart-summary-row">
            <span>IGV</span>
            <span>S/ {formatPEN(Number(pedido.impuestos))}</span>
          </div>
          <div className="cart-summary-total">
            <span>Total</span>
            <span>S/ {formatPEN(Number.isFinite(total) ? total : Number(pedido.total))}</span>
          </div>
          {pago && (
            <>
              <div className="section-divider" />
              <p style={{ fontSize: 13, color: "var(--color-ink-soft)" }}>
                Pagado con <strong>{(pago.metodo_pago || "").replace("_", " ")}</strong>
              </p>
              <p style={{ fontSize: 13, color: "var(--color-ink-soft)" }}>
                Estado del pago: {pago.estado_pago}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
