import { construirDatosCi, ErrorValidacionActa, SIGLAS_MODALIDAD } from "@/lib/ci";
import { notaEnLetras } from "@/lib/maestria-data";

export type ModalidadPetaeng = "memoria-laboral" | "cursos";

export type FormularioPetaeng = {
  postulante: string;
  ci: string;
  folio: string;
  libro: string;
  gestion: string;
  fecha: string;
  hora: string;
  nota: string;
  tema: string;
  tutor: string;
  tribunal1: string;
  tribunal2: string;
  tribunal3: string;
  presidente: string;
};

export const configuracionPetaeng = {
  "memoria-laboral": {
    titulo: "Defensa Pública - Memoria Laboral PETAENG",
    descripcion: "Genere el acta de defensa pública de Memoria Laboral.",
    plantilla: "acta-defensa-memoria-laboral-petaeng.docx",
    sigla: SIGLAS_MODALIDAD.memoriaLaboralPetaeng,
  },
  cursos: {
    titulo: "Acta de Conformidad - Cursos PETAENG",
    descripcion: "Genere el acta de conformidad de Cursos de Actualización.",
    plantilla: "acta-conformidad-cursos-petaeng.docx",
    sigla: SIGLAS_MODALIDAD.cursosPetaeng,
  },
} as const;

function fechaLiteral(fecha: string) {
  const valor = new Date(`${fecha}T12:00:00Z`);
  const diaSemana = valor.toLocaleDateString("es-BO", { weekday: "long", timeZone: "UTC" });
  const dia = valor.toLocaleDateString("es-BO", { day: "numeric", timeZone: "UTC" });
  const mes = valor.toLocaleDateString("es-BO", { month: "long", timeZone: "UTC" });
  const gestion = valor.toLocaleDateString("es-BO", { year: "numeric", timeZone: "UTC" });
  return `${diaSemana} ${dia} de ${mes} ${gestion}`;
}

function literalNota(nota: number) {
  const literal = notaEnLetras(nota).toLocaleLowerCase("es-BO");
  return literal ? literal.charAt(0).toLocaleUpperCase("es-BO") + literal.slice(1) : "";
}

function resultadoNota(nota: number) {
  if (nota <= 65) return "Reprobado";
  if (nota <= 70) return "Aprobado";
  if (nota <= 80) return "Bueno, Aprobado";
  if (nota <= 90) return "Muy bueno, Aprobación con felicitaciones";
  return "Excelente, Aprobación con mención honorífica";
}

export function validarPetaeng(entrada: unknown, modalidad: ModalidadPetaeng) {
  const datos = entrada && typeof entrada === "object" ? entrada as Record<string, unknown> : {};
  const errores: Record<string, string> = {};
  const obligatorios: Array<[keyof FormularioPetaeng, string]> = [
    ["postulante", "Nombre del postulante"], ["ci", "Carnet de identidad (CI)"],
    ["folio", "Folio"], ["libro", "Libro N.º"], ["gestion", "Gestión"],
    ["fecha", "Fecha"], ["hora", "Hora"], ["tribunal1", "Tribunal 1"],
    ["tribunal2", "Tribunal 2"], ["presidente", "Presidente del tribunal"],
  ];
  if (modalidad === "memoria-laboral") {
    obligatorios.push(["tema", "Tema de la Memoria Laboral"], ["tutor", "Docente tutor"]);
  } else {
    obligatorios.push(["tribunal3", "Tribunal 3"]);
  }

  for (const [campo, etiqueta] of obligatorios) {
    if (typeof datos[campo] !== "string" || !String(datos[campo]).trim()) {
      errores[campo] = `Complete el campo «${etiqueta}».`;
    }
  }
  for (const campo of ["folio", "libro"] as const) {
    if (!errores[campo] && (!/^\d+$/.test(String(datos[campo]).trim()) || Number(datos[campo]) < 1)) {
      errores[campo] = `${campo === "folio" ? "El folio" : "El libro"} debe ser un número entero mayor que cero.`;
    }
  }
  if (!errores.gestion && !/^\d{4}$/.test(String(datos.gestion).trim())) {
    errores.gestion = "La gestión debe tener cuatro dígitos.";
  }
  if (!errores.fecha) {
    const fecha = String(datos.fecha);
    const valor = new Date(`${fecha}T12:00:00Z`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha) || !Number.isFinite(valor.getTime()) || valor.toISOString().slice(0, 10) !== fecha) {
      errores.fecha = "Seleccione una fecha válida.";
    }
  }
  if (!errores.hora && !/^([01]\d|2[0-3]):[0-5]\d$/.test(String(datos.hora))) {
    errores.hora = "Seleccione una hora válida.";
  }
  const nota = String(datos.nota ?? "").trim();
  if (nota && (!/^\d{1,3}$/.test(nota) || Number(nota) > 100)) {
    errores.nota = "La nota debe ser un número entero entre 0 y 100.";
  }

  const participantes = modalidad === "memoria-laboral"
    ? [datos.tribunal1, datos.tribunal2, datos.tutor, datos.presidente]
    : [datos.tribunal1, datos.tribunal2, datos.tribunal3, datos.presidente];
  const normalizados = participantes
    .filter((valor): valor is string => typeof valor === "string" && Boolean(valor.trim()))
    .map(valor => valor.trim().replace(/\s+/g, " ").toLocaleLowerCase("es-BO"));
  if (new Set(normalizados).size !== normalizados.length) {
    errores.tribunal1 = "Los tribunales, el tutor y el presidente deben ser personas diferentes.";
  }
  return errores;
}

export function construirDatosPetaeng(entrada: unknown, modalidad: ModalidadPetaeng) {
  const errores = validarPetaeng(entrada, modalidad);
  if (Object.keys(errores).length) throw new ErrorValidacionActa(Object.values(errores).join("\n"));
  const formulario = entrada as FormularioPetaeng;
  const folio = Number(formulario.folio);
  const notaIngresada = formulario.nota.trim();
  const nota = Number(notaIngresada);
  const sigla = configuracionPetaeng[modalidad].sigla;

  return {
    ...construirDatosCi(formulario.ci, sigla),
    folio: formulario.folio.trim(),
    folioSiguiente: String(folio + 1),
    libro: formulario.libro.trim(),
    gestion: formulario.gestion.trim(),
    postulante: formulario.postulante.trim(),
    tema: formulario.tema.trim(),
    tutor: formulario.tutor.trim(),
    tribunal1: formulario.tribunal1.trim(),
    tribunal2: formulario.tribunal2.trim(),
    tribunal3: formulario.tribunal3.trim(),
    presidente: formulario.presidente.trim(),
    hora: formulario.hora,
    fechaLiteral: fechaLiteral(formulario.fecha),
    nota: notaIngresada || "__",
    notaLiteral: notaIngresada ? literalNota(nota) : "__",
    resultado: notaIngresada ? resultadoNota(nota) : "__",
  };
}
