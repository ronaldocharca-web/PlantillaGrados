/** Acepta la dirección base del servicio o su endpoint /convert. */
export function obtenerUrlsConversor() {
  const configurada = process.env.CONVERTER_SERVICE_URL?.trim();
  let url: URL;
  try {
    url = new URL(configurada || "http://127.0.0.1:8000/convert");
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error();
  } catch {
    throw new Error("La dirección del conversor PDF no es válida. Revise CONVERTER_SERVICE_URL.");
  }
  const base = url.pathname.replace(/\/+$/, "").replace(/\/(convert|health)$/, "");
  const conversion = new URL(url);
  conversion.pathname = `${base}/convert`;
  conversion.hash = "";
  const salud = new URL(conversion);
  salud.pathname = `${base}/health`;
  return { conversion, salud };
}
