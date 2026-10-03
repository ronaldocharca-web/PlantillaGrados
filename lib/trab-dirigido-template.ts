export function obtenerPlantillaTrabajoDirigido(datos: {
  tribunal1?: string;
  tribunal2?: string;
}) {
  return datos.tribunal2?.trim()
    ? "trab-dirigido-2-tribunales.docx"
    : "trab-dirigido-1-tribunal.docx";
}
