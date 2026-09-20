import { createContext, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import * as ms2 from "../api/ms2";
import type { Cliente, IniciarSesionPayload, RegistrarClientePayload, Rol } from "../types";

interface AuthContextValue {
  cliente: Cliente | null;
  isAuthenticated: boolean;
  rol: Rol | null;
  isVendedor: boolean;
  loading: boolean;
  error: string | null;
  register: (payload: RegistrarClientePayload) => Promise<Cliente>;
  login: (payload: IniciarSesionPayload) => Promise<Cliente>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [cliente, setCliente] = useState<Cliente | null>(() => ms2.obtenerSesion());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rol = useMemo<Rol | null>(() => {
    if (!cliente) return null;
    return ms2.esEmailVendedor(cliente.email) ? "vendedor" : "cliente";
  }, [cliente]);

  async function register(payload: RegistrarClientePayload): Promise<Cliente> {
    setLoading(true);
    setError(null);
    try {
      const nuevoCliente = await ms2.registrarCliente(payload);
      ms2.guardarSesion(nuevoCliente);
      setCliente(nuevoCliente);
      return nuevoCliente;
    } catch (err) {
      setError((err as Error).message);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  async function login({ email, password }: IniciarSesionPayload): Promise<Cliente> {
    setLoading(true);
    setError(null);
    try {
      const c = await ms2.iniciarSesion({ email, password });
      ms2.guardarSesion(c);
      setCliente(c);
      return c;
    } catch (err) {
      setError((err as Error).message);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    ms2.cerrarSesion();
    setCliente(null);
  }

  return (
    <AuthContext.Provider
      value={{
        cliente,
        isAuthenticated: !!cliente,
        rol,
        isVendedor: rol === "vendedor",
        loading,
        error,
        register,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}