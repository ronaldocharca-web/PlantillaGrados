"use client";

import { useEffect, useRef, useState } from "react";
import ActivarGeneradorPdf from "@/components/ActivarGeneradorPdf";

type Docente = { id: number; nombre: string };

type Props = {
  docentes: Docente[];
  presidente: string;
};

type Formulario = {
  postulante: string;
  genero: string;
  tribunal1: string;
  tribunal2: string;
  tribunal3: string;
  fecha: string;
  hora: string;
};

const inicial: Formulario = {
  postulante: "",
  genero: "masculino",
  tribunal1: "",
  tribunal2: "",
  tribunal3: "",
  fecha: "",
  hora: "",
};

function formatearFecha(fecha: string) {
  if (!fecha) return "";
  const partes = fecha.includes("/")
    ? fecha.split("/").map(Number)
    : fecha.split("-").map(Number).reverse();
  const [dia, mes, anio] = partes;
  return new Date(anio, mes - 1, dia).toLocaleDateString("es-BO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function FormularioExcelencia({ docentes, presidente }: Props) {
  const [formulario, setFormulario] = useState<Formulario>(inicial);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [generando, setGenerando] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  function cambiar(campo: keyof Formulario, valor: string) {
    setFormulario((actual) => ({ ...actual, [campo]: valor }));
  }

  function validar() {
    const nuevos: Record<string, string> = {};
    if (!formulario.postulante.trim()) {
      nuevos.postulante = "Ingrese el nombre del postulante.";
    }
    if (!formulario.fecha) nuevos.fecha = "Seleccione la fecha.";
    if (!formulario.hora) nuevos.hora = "Seleccione la hora.";
    if (!formulario.tribunal1) {
      nuevos.tribunal1 = "Seleccione el primer tribunal evaluador.";
    }
    const tribunales = [
      formulario.tribunal1,
      formulario.tribunal2,
      formulario.tribunal3,
    ].filter(Boolean);
    if (new Set(tribunales).size !== tribunales.length) {
      nuevos.tribunal2 = "Los integrantes del tribunal deben ser diferentes.";
    }
    setErrores(nuevos);
    return Object.keys(nuevos).length === 0;
  }

  function datos() {
    return {
      ...formulario,
      presidente,
      fechaTexto: formatearFecha(formulario.fecha),
    };
  }

  async function obtenerArchivo(ruta: string) {
    const respuesta = await fetch(ruta, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos()),
    });
    if (!respuesta.ok) {
      const detalle = await respuesta.json().catch(() => ({}));
      throw new Error(detalle.error || "No se pudo generar el documento.");
    }
    return respuesta.blob();
  }

  async function generarPdf() {
    if (!validar()) return;
    try {
      setGenerando(true);
      const blob = await obtenerArchivo("/api/actas/excelencia/pdf");
      const nuevaUrl = URL.createObjectURL(blob);
      setPdfUrl((anterior) => {
        if (anterior) URL.revokeObjectURL(anterior);
        return nuevaUrl;
      });
    } catch (error) {
      alert(error instanceof Error ? error.message : "No se pudo generar el PDF.");
    } finally {
      setGenerando(false);
    }
  }

  async function descargarWord() {
    if (!validar()) return;
    try {
      const blob = await obtenerArchivo("/api/actas/excelencia/docx");
      const url = URL.createObjectURL(blob);
      const enlace = document.createElement("a");
      enlace.href = url;
      enlace.download = "acta-excelencia-generada.docx";
      enlace.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      alert(error instanceof Error ? error.message : "No se pudo generar el Word.");
    }
  }

  async function descargarPdf() {
    if (!validar()) return;
    try {
      const blob = await obtenerArchivo("/api/actas/excelencia/pdf");
      const url = URL.createObjectURL(blob);
      const enlace = document.createElement("a");
      enlace.href = url;
      enlace.download = "acta-excelencia-generada.pdf";
      enlace.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      alert(error instanceof Error ? error.message : "No se pudo generar el PDF.");
    }
  }

  useEffect(() => () => {
    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
  }, [pdfUrl]);

  const selectorTribunal = (
    label: string,
    campo: "tribunal1" | "tribunal2" | "tribunal3",
    obligatorio = false
  ) => (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">
        {label} {obligatorio ? "(obligatorio)" : "(opcional)"}
      </label>
      <select
        value={formulario[campo]}
        onChange={(e) => cambiar(campo, e.target.value)}
        className="w-full rounded-lg border border-slate-300 px-4 py-2.5 outline-none focus:border-blue-500"
      >
        <option value="">Seleccione un docente</option>
        {docentes.map((docente) => (
          <option key={docente.id} value={docente.nombre}>
            {docente.nombre}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Acta de Examen de Excelencia
          </h1>
          <p className="mt-1 text-slate-500">
            Complete la información para generar el acta.
          </p>
        </div>
        <ActivarGeneradorPdf />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <section className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-6 text-lg font-semibold text-slate-800">
            Datos del acta
          </h2>

          {Object.keys(errores).length > 0 && (
            <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <p className="font-semibold">Completa los siguientes campos:</p>
              <ul className="mt-2 list-disc pl-5">
                {Object.values(errores).map((error) => <li key={error}>{error}</li>)}
              </ul>
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Nombre del postulante
              </label>
              <input
                value={formulario.postulante}
                onChange={(e) => cambiar("postulante", e.target.value)}
                placeholder="Nombre completo"
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Género del postulante
              </label>
              <select
                value={formulario.genero}
                onChange={(e) => cambiar("genero", e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5"
              >
                <option value="masculino">Masculino</option>
                <option value="femenino">Femenino</option>
              </select>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Fecha</label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="dd/mm/aaaa"
                  value={formulario.fecha}
                  onChange={(e) => cambiar("fecha", e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-4 py-2.5 outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Hora</label>
                <input
                  type="time"
                  value={formulario.hora}
                  onChange={(e) => cambiar("hora", e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-4 py-2.5 outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {selectorTribunal("Tribunal evaluador 1", "tribunal1", true)}
            {selectorTribunal("Tribunal evaluador 2", "tribunal2")}
            {selectorTribunal("Tribunal evaluador 3", "tribunal3")}

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Presidente del tribunal
              </label>
              <input
                value={presidente}
                disabled
                className="w-full rounded-lg border border-slate-200 bg-slate-100 px-4 py-2.5"
              />
            </div>

            <button
              type="button"
              onClick={generarPdf}
              disabled={generando}
              className="w-full rounded-lg bg-slate-800 px-5 py-3 font-medium text-white hover:bg-slate-900 disabled:opacity-50"
            >
              {generando ? "Generando PDF..." : "Generar vista previa PDF"}
            </button>
            <button
              type="button"
              onClick={descargarWord}
              className="w-full rounded-lg border border-slate-800 px-5 py-3 font-medium text-slate-900 hover:bg-slate-100"
            >
              Descargar Word
            </button>
          </div>
        </section>

        <section className="rounded-xl bg-slate-200 p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-slate-800">Vista previa PDF</h2>
            {pdfUrl && (
              <div className="flex gap-2">
                <button type="button" onClick={descargarPdf} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white">
                  Descargar PDF
                </button>
                <button type="button" onClick={() => iframeRef.current?.contentWindow?.print()} className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-white">
                  Imprimir
                </button>
              </div>
            )}
          </div>
          {pdfUrl ? (
            <iframe ref={iframeRef} src={pdfUrl} title="Vista previa del examen de excelencia" className="h-[850px] w-full rounded-lg bg-white" />
          ) : (
            <div className="flex h-[850px] items-center justify-center rounded-lg bg-white">
              <div className="text-center">
                <p className="font-medium text-slate-600">Vista previa del documento</p>
                <p className="mt-2 text-sm text-slate-400">Complete el formulario y genere el PDF.</p>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
