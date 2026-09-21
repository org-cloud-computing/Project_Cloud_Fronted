import BrandLogo from "./BrandLogo";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container site-footer-inner">
        <div>
          <div className="site-footer-brand"><BrandLogo /></div>
          <p className="site-footer-tag">Un mundo de posibilidades. Encuentra eso que buscas y descubre lo que va contigo.</p>
        </div>
        <div className="site-footer-col">
          <p className="site-footer-heading">Catálogo</p>
          <span>Explora distintas categorías y encuentra tus próximos favoritos.</span>
        </div>
        <div className="site-footer-col">
          <p className="site-footer-heading">Compras</p>
          <span>Reúne tus favoritos en el carrito y continúa cuando estés listo.</span>
        </div>
        <div className="site-footer-col">
          <p className="site-footer-heading">Analítica</p>
          <span>Una mirada a los datos para conocer mejor cada venta.</span>
        </div>
      </div>
      <div className="container">
        <p className="site-footer-fine">© {new Date().getFullYear()} Qhapaq. Proyecto sin fines comerciales.</p>
      </div>
    </footer>
  );
}
