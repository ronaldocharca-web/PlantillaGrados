type ActaRequestData = {
  postulante?: string;
  postulante2?: string;
  genero?: string;
  genero2?: string;
  tribunal1?: string;
  tribunal2?: string;
  tutor?: string;
  presidente?: string;
  hora?: string;
  fechaTexto?: string;
  tema?: string;
  nota?: string | number;
};

function tituloUniversitario(genero: string | undefined) {
  return genero === "femenino" ? "la Univ." : "el Univ.";
}

export function construirDatosActa(datos: ActaRequestData) {
  const postulante = datos.postulante?.trim() ?? "";
  const postulante2 = datos.postulante2?.trim() ?? "";

  const primerPostulante = postulante
    ? `${tituloUniversitario(datos.genero)} ${postulante}`
    : "";

  const postulantesTexto = postulante2
    ? `${primerPostulante} y ${tituloUniversitario(datos.genero2)} ${postulante2}`
    : primerPostulante;

  const etiquetaPostulante = postulante2 ? "POSTULANTES" : "POSTULANTE";

  return {
    ...datos,
    postulante,
    postulante2,
    postulantesTexto,
    etiquetaPostulante,
    etiquetaPostulante2: postulante2 ? etiquetaPostulante : "",
    verboDefensa: postulante2 ? "procedieron" : "procedió",
    articulo: datos.genero === "femenino" ? "la" : "el",
  };
}
