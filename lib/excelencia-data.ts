type ExcelenciaRequest = {
  postulante?: string;
  genero?: string;
  tribunal1?: string;
  tribunal2?: string;
  tribunal3?: string;
  presidente?: string;
  hora?: string;
  fechaTexto?: string;
};

export function construirDatosExcelencia(datos: ExcelenciaRequest) {
  return {
    pagina: "33",
    libro: "9",
    postulante: datos.postulante?.trim() ?? "",
    articulo: datos.genero === "femenino" ? "la" : "el",
    tribunal1: datos.tribunal1?.trim() ?? "",
    tribunal2: datos.tribunal2?.trim() ?? "",
    tribunal3: datos.tribunal3?.trim() ?? "",
    presidente: datos.presidente?.trim() ?? "",
    hora: datos.hora?.trim() ?? "",
    fechaTexto: datos.fechaTexto?.trim() ?? "",
  };
}
