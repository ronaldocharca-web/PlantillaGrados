type TrabajoDirigidoRequest = {
  postulante?: string;
  genero?: string;
  tribunal1?: string;
  tribunal2?: string;
  tutor?: string;
  presidente?: string;
  hora?: string;
  fechaTexto?: string;
  tema?: string;
  nota?: string | number;
};

export function construirDatosTrabajoDirigido(datos: TrabajoDirigidoRequest) {
  const notaTexto =
    datos.nota === undefined || String(datos.nota).trim() === ""
      ? "__"
      : String(datos.nota).trim();

  return {
    pagina: "24",
    libro: "9",
    postulante: datos.postulante?.trim() ?? "",
    articulo: datos.genero === "femenino" ? "la" : "el",
    tribunal1: datos.tribunal1?.trim() ?? "",
    tribunal2: datos.tribunal2?.trim() ?? "",
    tutor: datos.tutor?.trim() ?? "",
    presidente: datos.presidente?.trim() ?? "",
    hora: datos.hora?.trim() ?? "",
    fechaTexto: datos.fechaTexto?.trim() ?? "",
    tema: datos.tema?.trim() ?? "",
    nota: datos.nota ?? "",
    notaTexto,
    verboDefensa: "procedió",
  };
}
