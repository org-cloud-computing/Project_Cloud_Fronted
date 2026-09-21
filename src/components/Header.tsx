import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { getPopulatedCategories } from "../lib/populatedCategories";
import type { Category } from "../types";
import BrandLogo from "./BrandLogo";

export function Header() {
  const [query, setQuery] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { cliente, isAuthenticated, isVendedor, logout } = useAuth();
  const { itemCount } = useCart();

  useEffect(() => {
    getPopulatedCategories()
      .then((cats) => setCategories(cats.slice(0, 8)))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    navigate(`/buscar?q=${encodeURIComponent(q)}`);
  }

  return (
    <header className="site-header">
      <div className="header-topbar">Encuentra eso que va contigo. Descubre Qhapaq ↗</div>

      <div className="header-main">
        <Link to="/" className="header-logo">
          <BrandLogo />
          <small>Marketplace multicategoría</small>
        </Link>

        <form className="header-search" onSubmit={handleSearch}>
          <input
            type="search"
            placeholder="Buscar productos, marcas y más…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Buscar productos"
          />
          <button type="submit" aria-label="Buscar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></svg>
          </button>
        </form>

        <div className="header-actions">
          <div className="header-action" ref={menuRef} style={{ position: "relative" }} onClick={() => setMenuOpen((v) => !v)}>
            <span>{isAuthenticated ? `Hola, ${cliente?.nombre?.split(" ")[0]}` : "Hola, identifícate"}</span>
            <strong>Cuenta y listas ▾</strong>
            {menuOpen && (
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 10px)",
                  right: 0,
                  background: "#fff",
                  color: "var(--color-ink)",
                  borderRadius: "var(--radius-md)",
                  boxShadow: "var(--shadow-lg)",
                  padding: "10px 0",
                  minWidth: 200,
                  zIndex: 50,
                }}
              >
                {isAuthenticated ? (
                  <>
                    <Link to="/cuenta/pedidos" style={{ display: "block", padding: "9px 18px", fontSize: 13.5, fontWeight: 600 }}>
                      Mis pedidos
                    </Link>
                    <button
                      onClick={logout}
                      style={{
                        display: "block",
                        width: "100%",
                        textAlign: "left",
                        padding: "9px 18px",
                        fontSize: 13.5,
                        fontWeight: 600,
                        border: "none",
                        background: "transparent",
                        color: "var(--color-danger)",
                      }}
                    >
                      Cerrar sesión
                    </button>
                  </>
                ) : (
                  <>
                    <Link to="/ingresar" style={{ display: "block", padding: "9px 18px", fontSize: 13.5, fontWeight: 600 }}>
                      Ingresar
                    </Link>
                    <Link to="/registrarse" style={{ display: "block", padding: "9px 18px", fontSize: 13.5, fontWeight: 600 }}>
                      Crear cuenta
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>

          {isVendedor && (
  <Link to="/analitica" className="header-action">
    <span>Ventas &amp; datos</span>
    <strong>Panel analítico</strong>
  </Link>
)}

          <Link to="/carrito" className="header-cart" aria-label="Carrito">
            <span className="header-cart-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M3 3h2l2.5 12h11L21 7H6" strokeLinecap="round" strokeLinejoin="round" /><circle cx="9" cy="20" r="1" /><circle cx="18" cy="20" r="1" /></svg>
              {itemCount > 0 && <span className="header-cart-count">{itemCount}</span>}
            </span>
            <strong>Carrito</strong>
          </Link>
        </div>
      </div>

      <nav className="categories-bar">
        <div className="categories-bar-inner">
          <Link to="/" className="categories-bar-item all">
            ☰ Todas las categorías
          </Link>
          {categories.map((cat) => (
            <Link key={cat.category_id} to={`/categoria/${cat.category_id}`} className="categories-bar-item">
              {cat.name}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
