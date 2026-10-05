export const SIGLAS_MODALIDAD = {
  proyectoGrado: "P.G.",
  tesis: "T.",
  examenGrado: "E.G.",
  excelencia: "E.",
  trabajoDirigido: "T.D.",
} as const;

export class ErrorValidacionActa extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ErrorValidacionActa";
  }
}

export function construirDatosCi(ci: string | undefined, sigla: string) {
  const valor = ci?.trim() ?? "";

  if (!valor) {
    throw new ErrorValidacionActa(
      "El carnet de identidad (CI) es obligatorio para generar el PDF o descargar el Word."
    );
  }

  return {
    ci: valor,
  };
}

export function nombreArchivoActa(
  ci: string,
  sigla: string,
  extension: "docx" | "pdf"
) {
  const ciSeguro = ci
    .trim()
    .replace(/[^\p{L}\p{N}-]+/gu, "-")
    .replace(/^-+|-+$/g, "");
  const siglaSegura = sigla.replace(/[^\p{L}\p{N}]+/gu, "");

  return `${ciSeguro}-${siglaSegura}.${extension}`;
}

export function estadoErrorActa(error: unknown) {
  return error instanceof ErrorValidacionActa ? 400 : 500;
}
