import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { IniciarSesionPayload } from "../types";

interface LocationState {
  from?: { pathname?: string };
}

export default function Login() {
  const { login, loading } = useAuth();
  const [form, setForm] = useState<IniciarSesionPayload>({ email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as LocationState | null)?.from?.pathname || "/";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await login(form);
      navigate(from, { replace: true });
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Ingresa a tu cuenta</h1>
        <p className="subtitle">
          {from === "/analitica"
            ? "Ingresa con la cuenta de vendedor para abrir el panel analítico."
            : "Identifícate para ver tus pedidos y completar la compra."}
        </p>
        <div className="auth-banner">
          El módulo de clientes (MS2) aún no está implementado por el equipo. Esta sección funciona con
          una simulación local en tu navegador — puedes registrarte con cualquier correo.
        </div>

        {error && <div className="form-error-banner">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="email">Correo electrónico</label>
            <input
              id="email"
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
          </div>
          <div className="field">
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              required
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            />
          </div>
          <button className="btn btn-primary btn-block" type="submit" disabled={loading}>
            {loading ? "Ingresando…" : "Ingresar"}
          </button>
        </form>
        <p className="auth-switch">
          ¿No tienes cuenta? <Link to="/registrarse">Regístrate</Link>
        </p>
      </div>
    </div>
  );
}
