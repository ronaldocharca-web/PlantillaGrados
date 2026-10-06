export type Presidente = { id: string; nombre: string; activo: boolean };

export class ErrorPresidentes extends Error {
  status: number;
  constructor(message: string, status = 400) { super(message); this.status = status; }
}

export function normalizarNombre(nombre: string) {
  return nombre.trim().replace(/\s+/g, " ");
}

// Adapta los nombres guardados por la versión anterior sin perder registros.
export function leerPresidentes(valor: string | null, anterior = ""): Presidente[] {
  const datos: unknown = valor ? JSON.parse(valor) : [];
  if (!Array.isArray(datos)) throw new Error("La lista de presidentes no es válida.");
  const lista: Presidente[] = datos.map((item, index) => {
    if (typeof item === "string" && item.trim()) {
      return { id: `anterior-${index}`, nombre: normalizarNombre(item), activo: true };
    }
    if (item && typeof item.id === "string" && typeof item.nombre === "string" &&
        item.nombre.trim() && typeof item.activo === "boolean") {
      return { id: item.id, nombre: normalizarNombre(item.nombre), activo: item.activo };
    }
    throw new Error("Hay un registro de presidente inválido.");
  });
  // Solo incorpora el presidente global al leer el formato antiguo.
  if ((!valor || datos.every((item) => typeof item === "string")) && anterior.trim() &&
      !lista.some((p) => p.nombre.toLocaleLowerCase("es") === normalizarNombre(anterior).toLocaleLowerCase("es"))) {
    lista.push({ id: "anterior-principal", nombre: normalizarNombre(anterior), activo: true });
  }
  return lista;
}

export function modificarPresidentes(lista: Presidente[], accion: "agregar" | "editar", cuerpo: Record<string, unknown>, nuevoId: string) {
  const nombre = typeof cuerpo.nombre === "string" ? normalizarNombre(cuerpo.nombre) : "";
  if ((accion === "agregar" || "nombre" in cuerpo) && (!nombre || nombre.length > 200)) {
    throw new ErrorPresidentes("Ingrese un nombre de entre 1 y 200 caracteres.");
  }
  if (nombre && lista.some((p) => (accion === "agregar" || p.id !== cuerpo.id) && p.nombre.toLocaleLowerCase("es") === nombre.toLocaleLowerCase("es"))) {
    throw new ErrorPresidentes("Ese presidente ya está registrado.", 409);
  }
  if (accion === "agregar") return [...lista, { id: nuevoId, nombre, activo: true }];
  if (typeof cuerpo.id !== "string" || !lista.some((p) => p.id === cuerpo.id)) {
    throw new ErrorPresidentes("No se encontró el presidente.", 404);
  }
  if ((!("nombre" in cuerpo) && !("activo" in cuerpo)) ||
      ("activo" in cuerpo && typeof cuerpo.activo !== "boolean")) {
    throw new ErrorPresidentes("Indique un nombre o un estado válido.");
  }
  return lista.map((p) => p.id === cuerpo.id ? {
    ...p,
    nombre: "nombre" in cuerpo ? nombre : p.nombre,
    activo: typeof cuerpo.activo === "boolean" ? cuerpo.activo : p.activo,
  } : p);
}
