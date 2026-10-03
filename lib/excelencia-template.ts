export function obtenerPlantillaExcelencia(datos: {
  tribunal1?: string;
  tribunal2?: string;
  tribunal3?: string;
}) {
  const cantidad = [datos.tribunal1, datos.tribunal2, datos.tribunal3].filter(
    (tribunal) => tribunal?.trim()
  ).length;

  if (cantidad <= 1) return "excelencia-1-tribunal.docx";
  if (cantidad === 2) return "excelencia-2-tribunales.docx";
  return "excelencia.docx";
}
