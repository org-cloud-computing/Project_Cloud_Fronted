// ============================================================================
// Tipos compartidos del dominio (MS1, MS2, MS3, MS5)
// ============================================================================

/** MS1 — Categoría de catálogo */
export interface Category {
  category_id: number;
  name: string;
  [key: string]: unknown;
}

/** MS1 — Producto de catálogo */
export interface Product {
  product_id: number;
  name: string;
  price: number;
  image_url?: string | null;
  product_url?: string | null;
  stars?: number;
  reviews?: number;
  category?: Category | null;
  [key: string]: unknown;
}

/** Envoltura de paginación usada por varios endpoints del MS1 */
export interface PaginatedResult<T> {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  data: T[];
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

/** MS1 — Respuesta de disponibilidad de stock */
export interface StockInfo {
  product_id: number;
  client_id: number;
  client_country: string;
  available_stock: number;
}

/** MS1 — Almacén */
export interface Warehouse {
  warehouse_id: number;
  name: string;
  [key: string]: unknown;
}

// ----------------------------------------------------------------------------
// MS2 — Clientes / Pedidos / Pago (Node.js + Express + MySQL, prefijo /ms2)
// ----------------------------------------------------------------------------

export interface Cliente {
  id: number | string;
  nombre: string;
  email: string;
  direccion?: string;
  telefono?: string;
  pais?: string;
  creado_en?: string;
}
/**
 * MS2 no tiene un campo de rol en Cliente: solo existe un vendedor (el dueño
 * de la tienda) y se identifica por email/clave fijos del front (ver
 * src/api/ms2.ts). Cualquier otra cuenta autenticada es "cliente".
 */
export type Rol = "vendedor" | "cliente";
/**
 * MS2 no tiene modelo de autenticación (el modelo Cliente no tiene columna
 * `password` y no existe endpoint de login). La contraseña solo se guarda
 * localmente en el navegador para permitir un login básico; ver src/api/ms2.ts.
 */
export interface RegistrarClientePayload {
  nombre: string;
  email: string;
  password: string;
  direccion?: string;
  telefono?: string;
}

export interface IniciarSesionPayload {
  email: string;
  password: string;
}

export type EstadoPedido = "procesando" | "pendiente" | "pagado" | "cancelado";
export type MetodoPago = "tarjeta_credito" | "debito" | "paypal";

export interface Pedido {
  id: number;
  cliente_id: number | string;
  fecha_pedido: string;
  estado: EstadoPedido;
  subtotal: number;
  impuestos: number;
  total: number;
  direccion_envio: string;
  metodo_pago: MetodoPago;
}

export interface DetallePedido {
  id: number;
  pedido_id: number;
  producto_id: number | string;
  producto_nombre: string;
  precio_unitario: number;
  cantidad: number;
  subtotal: number;
}

export interface Pago {
  id: number;
  pedido_id: number;
  metodo_pago: MetodoPago;
  monto: number;
  estado_pago: "aprobado" | "rechazado" | "en_proceso";
  fecha_pago: string;
}

export interface PedidoConDetalle {
  pedido: Pedido;
  detalle: DetallePedido[];
  pago: Pago | null;
}

export interface ItemParaPedido {
  idProducto: number | string;
  nombre: string;
  precioUnitario: number;
  cantidad: number;
}

export interface CrearPedidoPayload {
  clienteId: number | string;
  items: ItemParaPedido[];
  metodoPago: MetodoPago;
  direccionEnvio: string;
}

// ----------------------------------------------------------------------------
// MS3 — Carrito de compras
// ----------------------------------------------------------------------------

export interface CartItem {
  idProducto?: number | string;
  id_producto?: number | string;
  nombre: string;
  precioUnitario: number;
  precio_unitario?: number;
  urlImagen?: string;
  url_imagen?: string;
  urlProducto?: string;
  url_producto?: string;
  cantidad: number;
  fechaAgregado?: string;
}

export interface ResumenCarrito {
  totalArticulos: number;
  subtotal: number;
  moneda: string;
}

export interface Carrito {
  id: string;
  idCliente: string;
  idAlmacen?: string | null;
  moneda?: string;
  estado: "ACTIVO" | "ABANDONADO" | "COMPLETADO";
  items: CartItem[];
  resumen: ResumenCarrito;
  fechaCreacion?: string;
  fechaActualizacion?: string;
  [key: string]: unknown;
}

export interface NuevoCarritoPayload {
  idCliente: string;
  idAlmacen?: string | null;
  moneda?: string;
}

// ----------------------------------------------------------------------------
// MS5 — Analítica (Athena)
// ----------------------------------------------------------------------------

export interface ProductoMenosStockRow {
  nombre: string;
  stock_disponible: number;
  [key: string]: unknown;
}

export interface ProductoPorCategoriaRow {
  categoria: string;
  producto?: string;
  [key: string]: unknown;
}

export interface ProductoResenaRow {
  producto: string;
  stars: number;
  reviews: number;
  [key: string]: unknown;
}

export interface PedidoPorFechaRow {
  fecha_pedido: string;
  estado: string;
  total_pedidos: number;
  [key: string]: unknown;
}

export interface ClienteFrecuenteRow {
  email: string;
  total_pedidos: number;
  [key: string]: unknown;
}

export interface ProductoPedidoRow {
  producto_id: number | string;
  nombre_producto: string;
  total_pedido: number;
  [key: string]: unknown;
}

export interface CarritoAbiertoRow {
  total_carritos_abiertos: number;
  [key: string]: unknown;
}

/** Fila genérica usada por DataTable/BarList cuando la forma no se tipa en detalle */
export type AnalyticsRow = Record<string, unknown>;

