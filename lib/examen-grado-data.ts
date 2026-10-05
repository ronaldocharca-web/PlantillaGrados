import { construirDatosCi, SIGLAS_MODALIDAD } from "@/lib/ci";

type ExamenRequest = {
  postulante?: string; materia?: string; area?: string; aula?: string;
  ci?: string;
  pagina?: string; libro?: string;
  convocatoria?: string; gestion?: string; hora?: string; fechaTexto?: string;
  duracion?: string; nota?: string | number; aprobado?: string; reprobado?: string;
  tribunal1?: string; tribunal2?: string; presidente?: string;
};

export function construirDatosExamen(datos: ExamenRequest) {
  const datosCi = construirDatosCi(datos.ci, SIGLAS_MODALIDAD.examenGrado);
  const notaTexto =
    datos.nota === undefined || String(datos.nota).trim() === ""
      ? "\u00a0__"
      : `\u00a0${String(datos.nota).trim()}`;

  return {
    ...datos,
    ...datosCi,
    pagina: datos.pagina?.trim() || "08",
    libro: datos.libro?.trim() || "9",
    postulante: datos.postulante?.trim() ?? "",
    materia: datos.materia?.trim() ?? "",
    Area: datos.area?.trim() ?? "",
    aula: datos.aula?.trim() ?? "",
    convocatoria: datos.convocatoria?.trim() ?? "",
    gestion: datos.gestion?.trim() ?? "",
    duracion: datos.duracion?.trim() ?? "",
    nota: datos.nota ?? "",
    notaTexto,
    aprobado: datos.aprobado ?? "",
    reprobado: datos.reprobado ?? "",
    tribunal1: datos.tribunal1?.trim() ?? "",
    tribunal2: datos.tribunal2?.trim() ?? "",
    presidente: datos.presidente?.trim() ?? "",
  };
}
