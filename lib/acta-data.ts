import { construirDatosCi } from "@/lib/ci";

type ActaRequestData = {
  postulante?: string;
  postulante2?: string;
  ci?: string;
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

function articuloUniversitario(genero: string | undefined) {
  return genero === "femenino" ? "la" : "el";
}

export function construirDatosActa(datos: ActaRequestData, siglaModalidad: string) {
  const postulante = datos.postulante?.trim() ?? "";
  const postulante2 = datos.postulante2?.trim() ?? "";
  const datosCi = construirDatosCi(datos.ci, siglaModalidad);

  const nombrePostulante1 = postulante.toLocaleUpperCase("es-BO");
  const nombrePostulante2 = postulante2.toLocaleUpperCase("es-BO");
  const articuloPostulante1 = postulante
    ? articuloUniversitario(datos.genero)
    : "";
  const articuloPostulante2 = postulante2
    ? articuloUniversitario(datos.genero2)
    : "";
  const universitario1 = postulante ? `\u00a0UNIV. ${nombrePostulante1}` : "";
  const universitario2 = postulante2 ? `\u00a0UNIV. ${nombrePostulante2}` : "";
  const conectorPostulantes = postulante2 ? " y " : "";
  const primerPostulante = postulante
    ? `${articuloPostulante1}${universitario1}`
    : "";
  const postulantesTexto = postulante2
    ? `${primerPostulante}${conectorPostulantes}${articuloPostulante2}${universitario2}`
    : primerPostulante;

  const etiquetaPostulante = postulante2 ? "POSTULANTES" : "POSTULANTE";
  const grupoPostulantes = postulante2
    ? datos.genero === "femenino" && datos.genero2 === "femenino"
      ? "las postulantes"
      : "los postulantes"
    : datos.genero === "femenino"
      ? "la postulante"
      : "el postulante";
  const respuestaPostulantes = postulante2
    ? `mismas que fueron respondidas por ${grupoPostulantes}`
    : `misma que fue respondida por ${grupoPostulantes}`;
  const notaTexto =
    datos.nota === undefined || String(datos.nota).trim() === ""
      ? "__"
      : String(datos.nota).trim();

  return {
    ...datos,
    ...datosCi,
    postulante,
    postulante2,
    postulantesTexto,
    articuloPostulante1,
    universitario1,
    conectorPostulantes,
    articuloPostulante2,
    universitario2,
    etiquetaPostulante,
    etiquetaPostulante2: postulante2 ? etiquetaPostulante : "",
    grupoPostulantes,
    respuestaPostulantes,
    notaTexto,
    verboDefensa: postulante2 ? "procedieron" : "procedió",
    articulo: datos.genero === "femenino" ? "la" : "el",
  };
}
