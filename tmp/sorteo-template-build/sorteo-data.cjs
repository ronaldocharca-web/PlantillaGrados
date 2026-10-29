"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AREA_SIN_ASIGNACION = void 0;
exports.areasDeDocente = areasDeDocente;
exports.validarReporteSorteo = validarReporteSorteo;
exports.AREA_SIN_ASIGNACION = "Sin asignación en el Plan 2026";
/** Las áreas de un docente se guardan separadas por punto y coma. */
function areasDeDocente(area) {
    return (area ?? "")
        .split(";")
        .map((valor) => valor.trim())
        .filter((valor) => valor && valor !== exports.AREA_SIN_ASIGNACION);
}
/** Revalida el resultado recibido antes de construir el PDF. */
function validarReporteSorteo(valor) {
    if (!valor || typeof valor !== "object")
        throw new Error("No se recibieron los resultados del sorteo.");
    const entrada = valor;
    const intervaloInicio = Number(entrada.intervaloInicio);
    const intervaloFin = Number(entrada.intervaloFin);
    const maximoAreas = Number(entrada.maximoAreas);
    const ordenarResultados = entrada.ordenarResultados !== false;
    if (!Number.isInteger(intervaloInicio) || !Number.isInteger(intervaloFin) || intervaloInicio > intervaloFin) {
        throw new Error("El intervalo numérico del reporte no es válido.");
    }
    if (!Number.isInteger(maximoAreas) || maximoAreas < 1)
        throw new Error("El límite de áreas no es válido.");
    if (!Array.isArray(entrada.resultados) || entrada.resultados.length === 0 || entrada.resultados.length > 500) {
        throw new Error("El reporte debe contener entre 1 y 500 resultados.");
    }
    const resultados = entrada.resultados.map((item) => {
        if (!item || typeof item !== "object")
            throw new Error("Existe un resultado incompleto.");
        const resultado = item;
        const area = typeof resultado.area === "string" ? resultado.area.trim() : "";
        const docente = typeof resultado.docente === "string" ? resultado.docente.trim() : "";
        const docenteId = Number(resultado.docenteId);
        const numero = Number(resultado.numero);
        const inicioResultado = Number(resultado.intervaloInicio ?? intervaloInicio);
        const finResultado = Number(resultado.intervaloFin ?? intervaloFin);
        if (!area || !docente || !Number.isInteger(docenteId) || !Number.isInteger(numero)
            || !Number.isInteger(inicioResultado) || !Number.isInteger(finResultado)
            || inicioResultado > finResultado || numero < inicioResultado || numero > finResultado) {
            throw new Error("Existe un resultado con datos inválidos.");
        }
        return { area, docente, docenteId, numero, intervaloInicio: inicioResultado, intervaloFin: finResultado };
    });
    const numerosPorArea = new Set();
    const docentesPorArea = new Set();
    for (const resultado of resultados) {
        const clave = `${resultado.area}\u0000${resultado.numero}`;
        if (numerosPorArea.has(clave))
            throw new Error(`El número ${resultado.numero} está repetido en ${resultado.area}.`);
        numerosPorArea.add(clave);
        const claveDocente = `${resultado.area}\u0000${resultado.docente.toLocaleLowerCase("es")}`;
        if (docentesPorArea.has(claveDocente))
            throw new Error(`${resultado.docente} está repetido en ${resultado.area}.`);
        docentesPorArea.add(claveDocente);
    }
    return { intervaloInicio, intervaloFin, maximoAreas, ordenarResultados, resultados };
}
