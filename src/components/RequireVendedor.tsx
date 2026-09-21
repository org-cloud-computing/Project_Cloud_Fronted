import type { ReactElement } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface RequireVendedorProps {
  children: ReactElement;
}

// Protege rutas exclusivas del vendedor (dueño único de la tienda), como el
// panel /analitica de MS5. Explica el acceso a los clientes en la propia ruta
// y conserva el destino al enviar a alguien sin sesión al login.
export default function RequireVendedor({ children }: RequireVendedorProps) {
  const { isAuthenticated, isVendedor } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/ingresar" state={{ from: location }} replace />;
  }
  if (!isVendedor) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h1>Panel analítico</h1>
          <p className="subtitle">
            Este panel está disponible para la cuenta de vendedor. Tu sesión actual es de cliente.
          </p>
          <Link
            to="/ingresar"
            state={{ from: location }}
            className="btn btn-primary btn-block"
          >
            Ingresar como vendedor
          </Link>
          <p className="auth-switch"><Link to="/">Volver a la tienda</Link></p>
        </div>
      </div>
    );
  }
  return children;
}
