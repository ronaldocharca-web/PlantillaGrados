"use client";

import { useEffect, useRef, useState } from "react";

export default function ActivarGeneradorPdf() {
  const [estado, setEstado] = useState<
    "inactivo" | "activando" | "listo" | "posiblementeDormido" | "error"
  >("inactivo");
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);
  const peticion = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      if (temporizador.current) clearTimeout(temporizador.current);
      peticion.current?.abort();
    };
  }, []);

  function marcarPosiblementeDormido() {
    if (temporizador.current) clearTimeout(temporizador.current);
    temporizador.current = setTimeout(() => {
      setEstado("posiblementeDormido");
    }, 10 * 60 * 1000);
  }

  async function activar() {
    if (peticion.current) return;
    if (temporizador.current) clearTimeout(temporizador.current);
    const controlador = new AbortController();
    peticion.current = controlador;
    setEstado("activando");

    try {
      const respuesta = await fetch("/api/converter/health", {
        cache: "no-store", signal: controlador.signal,
      });
      const datos = await respuesta.json();
      if (!respuesta.ok || datos.ok !== true) throw new Error("El conversor todavía no está disponible.");
      if (controlador.signal.aborted) return;
      setEstado("listo");
      marcarPosiblementeDormido();
    } catch {
      if (!controlador.signal.aborted) setEstado("error");
    } finally {
      if (peticion.current === controlador) peticion.current = null;
    }
  }

  const texto = {
    inactivo: "Activar generador PDF",
    activando: "Activando generador…",
    listo: "Generador listo ✓",
    posiblementeDormido: "Reactivar generador PDF",
    error: "Reintentar activación",
  }[estado];

  const mensaje = {
    inactivo: "Activa el generador para comprobar su disponibilidad.",
    activando: "Comprobando el conversor. Puede tardar unos instantes.",
    listo: "Ya puedes generar la vista previa.",
    posiblementeDormido: "Vuelve a comprobar la disponibilidad del generador.",
    error: "No se pudo confirmar la conexión. Intenta nuevamente.",
  }[estado];

  return (
    <div className="w-full max-w-xl">
        <button
          type="button"
          onClick={activar}
          disabled={estado === "activando"}
          aria-busy={estado === "activando"}
          className={`min-h-11 w-60 max-w-full rounded-lg px-4 py-2 text-sm font-medium text-white disabled:cursor-wait disabled:opacity-60 ${
            estado === "posiblementeDormido" || estado === "error"
              ? "bg-amber-600 hover:bg-amber-700"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {texto}
        </button>
        <p role="status" aria-live="polite" aria-atomic="true"
          className={`mt-2 min-h-12 text-sm leading-6 ${
            estado === "listo" ? "text-emerald-400" :
            estado === "error" || estado === "posiblementeDormido" ? "text-amber-300" : "text-slate-300"
          }`}>
          {mensaje}
        </p>
    </div>
  );
}
