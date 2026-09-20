import axios, { type AxiosInstance } from "axios";

// Cada microservicio tiene su propia URL base, configurable por variables de
// entorno (ver .env.example). En producción deberían apuntar al AWS API
// Gateway (HTTPS) que expone cada uno públicamente.
const MS1_URL = import.meta.env.VITE_MS1_URL;
const MS3_URL = import.meta.env.VITE_MS3_API_URL
const MS5_URL = import.meta.env.VITE_MS5_URL;

function makeClient(baseURL: string): AxiosInstance {
  const instance = axios.create({ baseURL, timeout: 15000 });
  return instance;
}

export const ms1Client = makeClient(MS1_URL);
export const ms3Client = makeClient(MS3_URL ?? "");
ms3Client.interceptors.request.use((config) => {
  if (!MS3_URL) {
    throw new Error("Configura VITE_MS3_API_URL en .env y reinicia el frontend.");
  }
  return config;
});
export const ms5Client = makeClient(MS5_URL);

// MS2 — Clientes / Pedidos / Pago (Node.js + Express + MySQL).
// VITE_MS2_URL debe incluir el prefijo /ms2 con el que el backend monta sus
// rutas (ver src/app.js de MS2), igual que MS1 con /ms1, p.ej.
// http://localhost:3000/ms2 en local o la URL del API Gateway en producción.
export const ms2Client = makeClient(import.meta.env.VITE_MS2_URL || "http://localhost:3000/ms2");