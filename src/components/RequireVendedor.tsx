import type { ReactElement } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface RequireVendedorProps {
  children: ReactElement;
}

// Protege rutas exclusivas del vendedor (dueño único de la tienda), como el
// panel /analitica de MS5. Un cliente autenticado que intente entrar es
// redirigido al inicio; alguien sin sesión, al login.
export default function RequireVendedor({ children }: RequireVendedorProps) {
  const { isAuthenticated, isVendedor } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/ingresar" state={{ from: location }} replace />;
  }
  if (!isVendedor) {
    return <Navigate to="/" replace />;
  }
  return children;
}