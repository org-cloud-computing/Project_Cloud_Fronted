import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import * as ms4 from "../api/ms4";
import { formatPEN } from "../components/PriceTag";
import type { Pedido } from "../types";

const ESTADO_BADGE: Record<string, string> = {
  pagado: "badge-teal",
  pendiente: "badge-accent",
  procesando: "badge-accent",
  enviado: "badge-teal",
  cancelado: "badge-danger",
};

export default function Orders() {
  const { cliente } = useAuth();
  const [orders, setOrders] = useState<Pedido[] | null>(null);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!cliente) return;
    let active = true;
    ms4.getPedidosByCliente(cliente.id)
      .then((data) => { if (active) setOrders(data); })
      .catch((err: Error) => { if (active) setError(err.message); });
    return () => { active = false; };
  }, [cliente]);

  if (!cliente) return null;

  return (
    <div className="container">
      <div className="page-heading">
        <h1>Mis pedidos</h1>
        <p>Historial de tus compras en Qhapaq.</p>
      </div>
      <div className="page-body">
        {error && <p role="alert" className="field-error">{error}</p>}
        {!orders && !error && <div className="skeleton" style={{ height: 160 }} />}
        {orders?.length === 0 && (
          <div className="state-msg">
            <h3>Todavía no tienes pedidos</h3>
            <Link to="/" className="btn btn-primary" style={{ marginTop: 16 }}>
              Ir de compras
            </Link>
          </div>
        )}
        {orders && orders.length > 0 && (
          <div className="orders-list">
            {orders.map((p) => (
              <Link to={`/cuenta/pedidos/${p.id}`} key={p.id} className="order-card">
                <div className="order-card-head">
                  <div>
                    <span>Pedido</span>
                    <strong>#{p.id}</strong>
                  </div>
                  <div>
                    <span>Fecha</span>
                    <strong>{new Date(p.fecha_pedido).toLocaleDateString("es-PE")}</strong>
                  </div>
                  <div>
                    <span>Total</span>
                    <strong>S/ {formatPEN(p.total)}</strong>
                  </div>
                  <div style={{ marginLeft: "auto", alignSelf: "center" }}>
                    <span className={`badge ${ESTADO_BADGE[p.estado] || "badge-teal"}`}>{p.estado}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
