import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { formatPEN } from "../components/PriceTag";
import { clienteIdNumerico, procesarCheckout } from "../api/ms4";
import type { MetodoPago } from "../types";

const IGV = 0.18;
const METODOS: { value: MetodoPago; label: string }[] = [
  { value: "tarjeta_credito", label: "Tarjeta de crédito" },
  { value: "debito", label: "Tarjeta de débito" },
  { value: "paypal", label: "PayPal" },
];

export default function Checkout() {
  const { items, subtotal, reload, loading, error: cartError } = useCart();
  const { cliente, isVendedor } = useAuth();
  const [metodoPago, setMetodoPago] = useState<MetodoPago>("tarjeta_credito");
  const [direccionEnvio, setDireccionEnvio] = useState(cliente?.direccion ?? "");
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const submitting = useRef(false);

  const impuestos = subtotal * IGV;
  const total = subtotal + impuestos;

  if (isVendedor) return <div className="container"><p>Para comprar, ingresa con una cuenta de cliente.</p><Link to="/ingresar">Ingresar</Link></div>;
  if (loading) return <div className="container"><p role="status">Cargando carrito…</p></div>;
  if (cartError) return <div className="container"><p role="alert">{cartError}</p></div>;

  if (items.length === 0) {
    return (
      <div className="container">
        <div className="state-msg">
          <h3>No tienes productos en el carrito</h3>
          <p>Agrega productos antes de continuar con el pago.</p>
        </div>
      </div>
    );
  }

  async function handlePlaceOrder() {
    if (!cliente || submitting.current) return;
    if (!direccionEnvio.trim()) {
      setError("Ingresa una dirección de envío.");
      return;
    }
    submitting.current = true;
    setPlacing(true);
    setError(null);
    try {
      const resultado = await procesarCheckout({
        cliente_id: clienteIdNumerico(cliente.id),
        direccion_envio: direccionEnvio.trim(),
        metodo_pago: metodoPago,
      });
      // MS4 ya vació el carrito: solo sincronizamos el estado del navegador.
      reload();
      navigate(`/pedido-confirmado/${resultado.pedido_id}`, {
        replace: true,
        state: { checkout: resultado },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo registrar el pedido. Intenta nuevamente.");
    } finally {
      submitting.current = false;
      setPlacing(false);
    }
  }

  if (!cliente) return null;

  return (
    <div className="container">
      <div className="page-heading">
        <h1>Finalizar compra</h1>
        <p>Revisa tu dirección y confirma tu compra.</p>
      </div>

      <div className="cart-layout page-body">
        <div>
          <div className="card" style={{ padding: 22, marginBottom: 20 }}>
            <h3 style={{ marginBottom: 12 }}>Entregar a</h3>
            <p style={{ fontWeight: 600 }}>{cliente.nombre}</p>
            <p style={{ color: "var(--color-ink-soft)", fontSize: 14, marginBottom: 10 }}>{cliente.email}</p>
            <div className="field">
              <label htmlFor="direccionEnvio">Dirección de envío</label>
              <input
                id="direccionEnvio"
                required
                value={direccionEnvio}
                onChange={(e) => setDireccionEnvio(e.target.value)}
                placeholder="Av. Ejemplo 123, Lima"
              />
            </div>
          </div>

          <div className="card" style={{ padding: 22, marginBottom: 20 }}>
            <h3 style={{ marginBottom: 14 }}>Método de pago</h3>
            {METODOS.map((m) => (
              <label
                key={m.value}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", fontSize: 14 }}
              >
                <input
                  type="radio"
                  name="metodoPago"
                  value={m.value}
                  checked={metodoPago === m.value}
                  onChange={() => setMetodoPago(m.value)}
                />
                {m.label}
              </label>
            ))}
          </div>

          <div className="card" style={{ padding: 22 }}>
            <h3 style={{ marginBottom: 12 }}>Productos ({items.length})</h3>
            {items.map((it) => (
              <div key={it.idProducto ?? it.id_producto} className="order-detail-row">
                <span>
                  {it.nombre} × {it.cantidad}
                </span>
                <span>S/ {formatPEN(it.precioUnitario * it.cantidad)}</span>
              </div>
            ))}
          </div>
        </div>

        <aside className="cart-summary">
          <h3 style={{ marginBottom: 12 }}>Resumen estimado</h3>
          <p>El total final se calcula con los precios vigentes al confirmar.</p>
          <div className="cart-summary-row">
            <span>Subtotal</span>
            <span>S/ {formatPEN(subtotal)}</span>
          </div>
          <div className="cart-summary-row">
            <span>IGV (18%)</span>
            <span>S/ {formatPEN(impuestos)}</span>
          </div>
          <div className="cart-summary-total">
            <span>Total</span>
            <span style={{ fontSize: 20, fontFamily: "var(--font-display)" }}>S/ {formatPEN(total)}</span>
          </div>
          {error && <p role="alert" className="field-error" style={{ marginTop: 10 }}>{error} <Link to="/cuenta/pedidos">Ver mis pedidos</Link></p>}
          <button className="btn btn-primary btn-block" style={{ marginTop: 18 }} onClick={handlePlaceOrder} disabled={placing || !direccionEnvio.trim()}>
            {placing ? "Procesando pago…" : "Confirmar y pagar"}
          </button>
        </aside>
      </div>
    </div>
  );
}