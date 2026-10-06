export const camposMaestria = {
  postulante: "Nombre del postulante",
  ci: "Carnet de identidad (CI)",
  pagina: "Número superior inicial",
  genero: "Género del postulante",
  fecha: "Fecha de la defensa",
  hora: "Hora de la defensa",
  tema: "Título de la tesis",
  maestria: "Nombre de la maestría",
  siglasGrado: "Siglas del grado académico",
  nota: "Nota numeral",
  tribunal1: "Tribunal docente 1",
  tribunal2: "Tribunal docente 2",
  revisor: "Tribunal revisor",
  presidente: "Presidente del tribunal",
} as const;

export type FormularioMaestria = Record<keyof typeof camposMaestria, string>;

export function notaEnLetras(nota: number): string {
  if (!Number.isInteger(nota) || nota < 0 || nota > 100) return "";
  const unidades = ["CERO", "UNO", "DOS", "TRES", "CUATRO", "CINCO", "SEIS", "SIETE", "OCHO", "NUEVE", "DIEZ", "ONCE", "DOCE", "TRECE", "CATORCE", "QUINCE", "DIECISÉIS", "DIECISIETE", "DIECIOCHO", "DIECINUEVE", "VEINTE", "VEINTIUNO", "VEINTIDÓS", "VEINTITRÉS", "VEINTICUATRO", "VEINTICINCO", "VEINTISÉIS", "VEINTISIETE", "VEINTIOCHO", "VEINTINUEVE"];
  if (nota < 30) return unidades[nota];
  if (nota === 100) return "CIEN";
  const decenas = ["", "", "", "TREINTA", "CUARENTA", "CINCUENTA", "SESENTA", "SETENTA", "OCHENTA", "NOVENTA"];
  return decenas[Math.floor(nota / 10)] + (nota % 10 ? ` Y ${unidades[nota % 10]}` : "");
}

export function resultadoMaestria(nota: number, genero: string) {
  if (!Number.isInteger(nota) || nota < 0 || nota > 100) return "";
  const terminacion = genero === "femenino" ? "A" : "O";
  if (nota <= 65) return `REPROBAD${terminacion}`;
  const aprobado = `APROBAD${terminacion}`;
  if (nota <= 70) return aprobado;
  return `${aprobado} - ${nota <= 80 ? "BUENO" : nota <= 90 ? "MUY BUENO" : "EXCELENTE"}`;
}

export function validarMaestria(entrada: unknown): Record<string, string> {
  const datos = entrada && typeof entrada === "object" ? entrada as Record<string, unknown> : {};
  const errores: Record<string, string> = {};
  for (const [campo, etiqueta] of Object.entries(camposMaestria)) {
    if (typeof datos[campo] !== "string" || !(datos[campo] as string).trim()) {
      errores[campo] = `Complete el campo «${etiqueta}».`;
    }
  }
  if (!errores.nota && (!/^\d{1,3}$/.test(String(datos.nota).trim()) || Number(datos.nota) > 100)) {
    errores.nota = "La nota debe ser un número entero entre 0 y 100.";
  }
  if (!errores.pagina && (!/^\d+$/.test(String(datos.pagina).trim()) || Number(datos.pagina) < 1 || Number(datos.pagina) > 99998)) {
    errores.pagina = "El número superior debe ser un entero entre 1 y 99998.";
  }
  if (!errores.genero && !["masculino", "femenino"].includes(String(datos.genero))) errores.genero = "Seleccione un género válido.";
  if (!errores.siglasGrado && !String(datos.siglasGrado).replace(/[()\s]/g, "")) errores.siglasGrado = "Ingrese las siglas del grado académico.";
  if (!errores.hora && !/^([01]\d|2[0-3]):[0-5]\d$/.test(String(datos.hora))) errores.hora = "Ingrese una hora válida.";
  if (!errores.fecha) {
    const fecha = String(datos.fecha);
    const date = new Date(`${fecha}T12:00:00Z`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha) || !Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== fecha) errores.fecha = "Seleccione una fecha válida.";
  }
  const seleccionados = [datos.tribunal1, datos.tribunal2, datos.revisor, datos.presidente]
    .filter((v): v is string => typeof v === "string" && Boolean(v.trim()))
    .map(v => v.trim().replace(/\s+/g, " ").toLocaleLowerCase("es-BO"));
  if (new Set(seleccionados).size !== seleccionados.length) errores.tribunal1 = "Los dos tribunales, el revisor y el presidente deben ser personas diferentes.";
  if (typeof datos.ci === "string" && datos.ci.trim() && !/[\p{L}\p{N}]/u.test(datos.ci)) errores.ci = "Ingrese un CI válido para nombrar la descarga.";
  return errores;
}

/** Solo contiene los datos del documento: el CI no se inserta en la plantilla. */
export function construirDatosMaestria(formulario: FormularioMaestria) {
  const femenino = formulario.genero === "femenino";
  const [hora, minuto] = formulario.hora.split(":").map(Number);
  const nota = Number(formulario.nota);
  return {
    postulante: formulario.postulante.trim(),
    tratamiento: femenino ? "la Licenciada" : "el Licenciado",
    delPostulante: femenino ? "de la postulante" : "del postulante",
    elPostulante: femenino ? "la postulante" : "el postulante",
    horaTexto: `${String(hora % 12 || 12).padStart(2, "0")}:${String(minuto).padStart(2, "0")} ${hora < 12 ? "a. m." : "p. m."}`,
    fechaTexto: new Date(`${formulario.fecha}T12:00:00Z`).toLocaleDateString("es-BO", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }),
    pagina: formulario.pagina.trim(),
    tema: formulario.tema.trim(),
    maestria: formulario.maestria.trim(),
    siglasGrado: formulario.siglasGrado.trim().replace(/^\(+|\)+$/g, ""),
    notaTexto: String(nota),
    notaLiteral: notaEnLetras(nota),
    resultado: resultadoMaestria(nota, formulario.genero),
    tribunal1: formulario.tribunal1.trim(),
    tribunal2: formulario.tribunal2.trim(),
    revisor: formulario.revisor.trim(),
    presidente: formulario.presidente.trim(),
  };
}
