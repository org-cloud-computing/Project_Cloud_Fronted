import { Routes, Route } from 'react-router-dom';
import { Header } from './components/Header';
import Footer from './components/Footer';
import RequireAuth from './components/RequireAuth';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Home from "./pages/Home";
import Category from "./pages/Category";
import ProductDetail from "./pages/ProductDetail";
import Search from "./pages/Search";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Orders from "./pages/Orders";
import OrderDetail from "./pages/OrderDetail";
import OrderConfirmation from "./pages/OrderConfirmation";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import RequireVendedor from './components/RequireVendedor';

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Header />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/categoria/:categoryId" element={<Category />} />
            <Route path="/producto/:productId" element={<ProductDetail />} />
            <Route path="/buscar" element={<Search />} />
            <Route path="/carrito" element={<Cart />} />
            <Route
              path="/checkout"
              element={
                <RequireAuth>
                  <Checkout />
                </RequireAuth>
              }
            />
            <Route path="/ingresar" element={<Login />} />
            <Route path="/registrarse" element={<Register />} />
            <Route
              path="/cuenta/pedidos"
              element={
                <RequireAuth>
                  <Orders />
                </RequireAuth>
              }
            />
            <Route
              path="/cuenta/pedidos/:orderId"
              element={
                <RequireAuth>
                  <OrderDetail />
                </RequireAuth>
              }
            />
            <Route
              path="/pedido-confirmado/:orderId"
              element={
                <RequireAuth>
                  <OrderConfirmation />
                </RequireAuth>
              }
            />
            <Route
  path="/analitica"
  element={
    <RequireVendedor>
      <Dashboard />
    </RequireVendedor>
  }
/>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
