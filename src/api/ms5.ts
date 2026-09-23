import { ms5Client } from "./client";
import type {
  CarritoAbiertoRow,
  ClienteFrecuenteRow,
  PedidoPorFechaRow,
  ProductoMenosStockRow,
  ProductoPedidoRow,
  ProductoPorCategoriaRow,
  ProductoResenaRow,
} from "../types";

// MS5 — Analítico (consultas directas sobre AWS Athena / Data Lake)
// Repositorio: https://github.com/maydelithzuniga/MS5

const MS5_USER = import.meta.env.VITE_MS5_USER || "admin3";
const MS5_PASSWORD = import.meta.env.VITE_MS5_PASSWORD || "admin3123";

async function run<T>(path: string): Promise<T[]> {
  const { data } = await ms5Client.get<T[]>(`/${path}`, {
    auth: { username: MS5_USER, password: MS5_PASSWORD },
  });
  return data;
}

// ----------------------------------------------------------------------------
// El backend responde con nombres de columna en inglés y números como string.
// Estos tipos "Raw" reflejan EXACTAMENTE lo que llega por HTTP. Las funciones
// exportadas normalizan cada fila al shape en español que ya consume
// Dashboard.tsx, para no tener que tocar el resto del frontend.
// ----------------------------------------------------------------------------

interface RawProductoMenosStock {
  product_id: string | number;
  name: string;
  available_stock: string | number;
}

interface RawProductoPorCategoria {
  category: string;
  product: string;
}

interface RawProductoPedido {
  producto_id: string | number;
  producto_nombre: string;
  total_pedido: string | number;
}

export const getProductosMenosStock = async (): Promise<ProductoMenosStockRow[]> => {
  const rows = await run<RawProductoMenosStock>("productos-menos-stock");
  return rows.map((r) => ({
    nombre: r.name,
    stock_disponible: Number(r.available_stock),
  }));
};

export const getProductosPorCategoria = async (): Promise<ProductoPorCategoriaRow[]> => {
  const rows = await run<RawProductoPorCategoria>("productos-por-categoria");
  return rows.map((r) => ({
    categoria: r.category,
    producto: r.product,
  }));
};

export const getProductosMejoresResenas = (): Promise<ProductoResenaRow[]> => run("productos-mejores-resenas");
export const getProductosPeoresResenas = (): Promise<ProductoResenaRow[]> => run("productos-peores-resenas");
export const getPedidosPorFecha = (): Promise<PedidoPorFechaRow[]> => run("pedidos-por-fecha");
export const getClientesFrecuentes = (): Promise<ClienteFrecuenteRow[]> => run("clientes-frecuentes");

const mapProductoPedido = (r: RawProductoPedido): ProductoPedidoRow => ({
  producto_id: r.producto_id,
  nombre_producto: r.producto_nombre,
  total_pedido: Number(r.total_pedido),
});

export const getProductoMasPedido = async (): Promise<ProductoPedidoRow[]> => {
  const rows = await run<RawProductoPedido>("producto-mas-pedido");
  return rows.map(mapProductoPedido);
};

export const getProductoMenosPedido = async (): Promise<ProductoPedidoRow[]> => {
  const rows = await run<RawProductoPedido>("producto-menos-pedido");
  return rows.map(mapProductoPedido);
};

export const getCarritosAbiertos = (): Promise<CarritoAbiertoRow[]> => run("carritos-abiertos");
