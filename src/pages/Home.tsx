import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getCategories, getProducts } from "../api/ms1";
import { getPopulatedCategories } from "../lib/populatedCategories";
import HeroArtwork from "../components/HeroArtwork";
import CategoryRow from "../components/CategoryRow";
import ProductCard from "../components/ProductCard";
import type { Category, Product } from "../types";

export default function Home() {
  const [featured, setFeatured] = useState<Product[] | null>(null);
  const [featuredError, setFeaturedError] = useState(false);

  const [popCategories, setPopCategories] = useState<Category[] | null>(null);
  const [popError, setPopError] = useState(false);

  const [allCategories, setAllCategories] = useState<Category[] | null>(null);
  const [showAllCategories, setShowAllCategories] = useState(false);

  useEffect(() => {
    getProducts({ page: 1, limit: 12 })
      .then((res) => setFeatured(res.data))
      .catch(() => setFeaturedError(true));

    getPopulatedCategories()
      .then((cats) => setPopCategories(cats.slice(0, 6)))
      .catch(() => setPopError(true));
  }, []);

  function loadAllCategories() {
    setShowAllCategories(true);
    if (!allCategories) {
      getCategories()
        .then(setAllCategories)
        .catch(() => setAllCategories([]));
    }
  }

  return (
    <>
      <section className="hero">
        <div className="container hero-inner">
          <div className="hero-copy">
            <p className="hero-eyebrow"><span /> Un mundo por descubrir</p>
            <h1>Eso que buscas.<br /><span>Eso que va contigo.</span></h1>
            <p className="hero-description">
              Encuentra tus próximos favoritos en tecnología, hogar y mucho más.
              Explora, elige y hazlos parte de tu día.
            </p>
            <div className="hero-cta">
              <a href="#destacados" className="btn btn-primary">Explorar productos <span aria-hidden="true">↗</span></a>
              <Link to="/analitica" className="hero-secondary">Panel analítico <span aria-hidden="true">→</span></Link>
            </div>
            <p className="hero-footnote">Mucho por encontrar. Un lugar para empezar.</p>
          </div>
          <HeroArtwork />
        </div>
      </section>

      <div className="container discovery-strip">
        <div><span className="discovery-icon" aria-hidden="true">✳</span><p><strong>Para cada versión de ti</strong><span>Explora distintas categorías</span></p></div>
        <div><span className="discovery-icon" aria-hidden="true">↗</span><p><strong>Descubre tu próximo favorito</strong><span>Detalles que hacen la diferencia</span></p></div>
        <div><span className="discovery-icon" aria-hidden="true">♡</span><p><strong>Todo empieza con un vistazo</strong><span>Inspírate y elige a tu ritmo</span></p></div>
      </div>

      <div className="container" id="destacados">
        {/* ---------- Productos destacados (catálogo general del MS1) ---------- */}
        <section className="category-row">
          <div className="category-row-head">
            <div><p className="section-eyebrow">EXPLORA QHAPAQ</p><h2>Tus próximos favoritos</h2></div><span className="section-caption">Encuentra algo que vaya contigo</span>
          </div>

          {featuredError && (
            <div className="state-msg">
              <h3>No pudimos cargar el catálogo</h3>
              <p>No pudimos conectar con el catálogo. Intenta nuevamente en unos momentos.</p>
            </div>
          )}

          {!featuredError && !featured && (
            <div className="product-grid">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="skeleton" style={{ height: 260 }} />
              ))}
            </div>
          )}

          {featured?.length === 0 && (
            <div className="state-msg">
              <h3>Todavía no hay productos cargados</h3>
              <p>Vuelve pronto para descubrir nuevos favoritos.</p>
            </div>
          )}

          {featured && featured.length > 0 && (
            <div className="product-grid">
              {featured.map((p) => (
                <ProductCard key={p.product_id} product={p} />
              ))}
            </div>
          )}
        </section>

        {/* ---------- Categorías con inventario real ---------- */}
        {!popError &&
          popCategories?.map((cat) => <CategoryRow key={cat.category_id} category={cat} />)}

        {popError && (
          <div className="state-msg">
            <p>Las categorías no están disponibles en este momento. Intenta nuevamente más tarde.</p>
          </div>
        )}

        {/* ---------- Explorar el resto del catálogo de categorías ---------- */}
        <section className="explore-categories">
          {!showAllCategories ? (
            <button className="btn-ghost" onClick={loadAllCategories}>
              Explorar todas las categorías del catálogo →
            </button>
          ) : (
            <>
              <h2 style={{ fontSize: 18, marginBottom: 14 }}>Todas las categorías</h2>
              <p style={{ color: "var(--color-ink-faint)", fontSize: 13, marginBottom: 16 }}>
                Explora nuestras {allCategories?.length ?? "…"} categorías. Algunas todavía no tienen productos disponibles.
              </p>
              {!allCategories ? (
                <div className="skeleton" style={{ height: 120 }} />
              ) : (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                    gap: 8,
                  }}
                >
                  {allCategories.map((cat) => (
                    <Link
                      key={cat.category_id}
                      to={`/categoria/${cat.category_id}`}
                      style={{ fontSize: 13.5, color: "var(--color-primary)", padding: "4px 0" }}
                    >
                      {cat.name}
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </>
  );
}