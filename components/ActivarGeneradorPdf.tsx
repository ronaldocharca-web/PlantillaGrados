"use client";

import { useEffect, useRef, useState } from "react";

export default function ActivarGeneradorPdf() {
  const [estado, setEstado] = useState<
    "inactivo" | "activando" | "listo" | "posiblementeDormido" | "error"
  >("inactivo");
  const [mostrarMonitor, setMostrarMonitor] = useState(false);
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);
  const urlHealth = "https://plantillagrados-converterr.onrender.com/health";

  useEffect(() => {
    return () => {
      if (temporizador.current) clearTimeout(temporizador.current);
    };
  }, []);

  function marcarPosiblementeDormido() {
    if (temporizador.current) clearTimeout(temporizador.current);
    temporizador.current = setTimeout(() => {
      setEstado("posiblementeDormido");
    }, 10 * 60 * 1000);
  }

  async function activar() {
    setMostrarMonitor(true);
    setEstado("activando");

    try {
      const respuesta = await fetch("/api/converter/health", { cache: "no-store" });
      if (!respuesta.ok) throw new Error("El conversor todavía no está disponible.");
      setEstado("listo");
      marcarPosiblementeDormido();
    } catch {
      setEstado("error");
    }
  }

  const texto = {
    inactivo: "Activar generador PDF",
    activando: "Despertando generador…",
    listo: "Generador listo ✓",
    posiblementeDormido: "Reactivar generador PDF",
    error: "Reintentar activación",
  }[estado];

  return (
    <div className="w-full max-w-xl">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={activar}
          disabled={estado === "activando"}
          className={`rounded-lg px-4 py-2 text-sm font-medium text-white disabled:cursor-wait disabled:opacity-60 ${
            estado === "posiblementeDormido" || estado === "error"
              ? "bg-amber-600 hover:bg-amber-700"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {texto}
        </button>
        {estado === "activando" && (
          <span className="text-sm text-slate-500">Puede tardar mientras Render inicia LibreOffice.</span>
        )}
        {estado === "listo" && <span className="text-sm text-green-700">Ya puedes generar la vista previa.</span>}
        {estado === "posiblementeDormido" && (
          <span className="text-sm text-amber-700">Pasaron 10 minutos; Render puede haberlo apagado.</span>
        )}
        {estado === "error" && <span className="text-sm text-red-600">El conversor aún está iniciando.</span>}
      </div>

      {mostrarMonitor && (
        <div className="mt-3 overflow-hidden rounded-lg border border-slate-300 bg-slate-50 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2">
            <span className="text-xs font-medium text-slate-600">Estado del conversor Render</span>
            <button
              type="button"
              onClick={() => setMostrarMonitor(false)}
              className="rounded px-2 py-1 text-xs text-slate-600 hover:bg-slate-200"
            >
              Cerrar
            </button>
          </div>
          <iframe
            src={urlHealth}
            title="Estado del conversor PDF"
            className="h-32 w-full bg-white"
          />
        </div>
      )}
    </div>
  );
}
