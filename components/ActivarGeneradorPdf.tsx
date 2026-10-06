"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

export default function ActivarGeneradorPdf() {
  const [estado, setEstado] = useState<
    "inactivo" | "activando" | "listo" | "posiblementeDormido" | "error"
  >("inactivo");
  const [detalleError, setDetalleError] = useState("");
  const [ventanaAbierta, setVentanaAbierta] = useState(false);
  const [intento, setIntento] = useState(0);
  const ventanaId = useId();
  const tituloId = useId();
  const boton = useRef<HTMLButtonElement>(null);
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
    setVentanaAbierta(true);
    if (peticion.current) return;
    setIntento(anterior => anterior + 1);
    if (temporizador.current) clearTimeout(temporizador.current);
    const controlador = new AbortController();
    peticion.current = controlador;
    setEstado("activando");
    setDetalleError("");

    try {
      const respuesta = await fetch("/api/converter/health", {
        cache: "no-store", signal: controlador.signal,
      });
      const datos = await respuesta.json().catch(() => null);
      if (!respuesta.ok || datos?.ok !== true) {
        throw new Error(datos?.error || "No se pudo comprobar el conversor PDF. Recargue la página e intente nuevamente.");
      }
      if (controlador.signal.aborted) return;
      setEstado("listo");
      marcarPosiblementeDormido();
    } catch (error) {
      if (!controlador.signal.aborted) {
        setDetalleError(error instanceof Error ? error.message : "No se pudo conectar con el conversor PDF.");
        setEstado("error");
      }
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
    error: detalleError || "No se pudo confirmar la conexión. Intenta nuevamente.",
  }[estado];

  return (
    <div className="w-full max-w-xl">
        <button
          ref={boton}
          type="button"
          onClick={activar}
          disabled={estado === "activando"}
          aria-busy={estado === "activando"}
          aria-controls={ventanaAbierta ? ventanaId : undefined}
          aria-expanded={ventanaAbierta}
          aria-haspopup="dialog"
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
        {ventanaAbierta && createPortal(
          <div id={ventanaId} role="dialog" aria-modal="false" aria-labelledby={tituloId}
            className="fixed bottom-4 right-4 z-50 flex max-h-[80dvh] w-[520px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-xl border border-slate-300 bg-white text-slate-800 shadow-2xl"
            onKeyDown={evento => {
              if (evento.key === "Escape") { setVentanaAbierta(false); boton.current?.focus(); }
            }}>
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3">
              <h2 id={tituloId} className="text-sm font-semibold">Estado del generador PDF</h2>
              <button type="button" aria-label="Cerrar ventana del generador PDF"
                onClick={() => { setVentanaAbierta(false); boton.current?.focus(); }}
                className="rounded-lg px-3 py-2 text-sm hover:bg-slate-200 focus-visible:outline-2 focus-visible:outline-violet-500">Cerrar</button>
            </div>
            <div className="overflow-y-auto">
              <iframe key={intento} src="/api/converter/estado" title="Página de carga del conversor PDF"
                referrerPolicy="no-referrer" className="block h-60 w-full border-0 bg-slate-950" />
              <div className="space-y-3 border-t border-slate-200 p-4 text-sm">
                <p role="status" aria-live="polite" className={estado === "listo" ? "text-emerald-700" : estado === "error" ? "text-amber-800" : "text-slate-700"}>{mensaje}</p>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <a href="/api/converter/estado" target="_blank" rel="noreferrer" className="text-violet-800 underline underline-offset-2">Abrir página del conversor</a>
                  {estado !== "activando" && <button type="button" onClick={activar}
                    className="rounded-lg bg-violet-700 px-3 py-2 font-medium text-white hover:bg-violet-800">
                    {estado === "error" ? "Reintentar activación" : "Comprobar de nuevo"}
                  </button>}
                </div>
              </div>
            </div>
          </div>, document.body,
        )}
    </div>
  );
}
