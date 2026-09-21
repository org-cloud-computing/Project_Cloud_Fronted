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
// Cada endpoint responde con una lista de filas (objetos clave-valor en texto).

async function run<T>(path: string): Promise<T[]> {
  const { data } = await ms5Client.get<T[]>(`/${path}`);
  return data;
}

export const getProductosMenosStock = (): Promise<ProductoMenosStockRow[]> => run("productos-menos-stock");
export const getProductosPorCategoria = (): Promise<ProductoPorCategoriaRow[]> =>
  run("productos-por-categoria");
export const getProductosMejoresResenas = (): Promise<ProductoResenaRow[]> => run("productos-mejores-resenas");
export const getProductosPeoresResenas = (): Promise<ProductoResenaRow[]> => run("productos-peores-resenas");
export const getPedidosPorFecha = (): Promise<PedidoPorFechaRow[]> => run("pedidos-por-fecha");
export const getClientesFrecuentes = (): Promise<ClienteFrecuenteRow[]> => run("clientes-frecuentes");
export const getProductoMasPedido = (): Promise<ProductoPedidoRow[]> => run("producto-mas-pedido");
export const getProductoMenosPedido = (): Promise<ProductoPedidoRow[]> => run("producto-menos-pedido");
export const getCarritosAbiertos = (): Promise<CarritoAbiertoRow[]> => run("carritos-abiertos");
