"use client";

import { useEffect, useRef, useState } from "react";
import ActivarGeneradorPdf from "@/components/ActivarGeneradorPdf";
import ManualUsuario from "@/components/ManualUsuario";
import SelectorPresidente from "@/components/SelectorPresidente";
import SelectorPersona from "@/components/SelectorPersona";
import type { Presidente } from "@/lib/presidentes";
import { nombreArchivoActa, SIGLAS_MODALIDAD } from "@/lib/ci";

type Docente = { id: number; nombre: string; area: string | null };

type Props = { docentes: Docente[]; presidentes: Presidente[]; presidente: string };

type Formulario = {
  postulante: string;
  ci: string;
  pagina: string;
  libro: string;
  materia: string;
  area: string;
  aula: string;
  convocatoria: string;
  gestion: string;
  fecha: string;
  hora: string;
  duracion: string;
  nota: string;
  aprobado: string;
  reprobado: string;
  tribunal1: string;
  tribunal2: string;
};

const inicial: Formulario = {
  postulante: "",
  ci: "",
  pagina: "08",
  libro: "9",
  materia: "",
  area: "",
  aula: "",
  convocatoria: "",
  gestion: String(new Date().getFullYear()),
  fecha: "",
  hora: "",
  duracion: "30",
  nota: "",
  aprobado: "X",
  reprobado: "",
  tribunal1: "",
  tribunal2: "",
};

export default function FormularioExamenGrado({ docentes, presidentes, presidente: presidenteInicial }: Props) {
  const [presidente, setPresidente] = useState(presidenteInicial);
  const [formulario, setFormulario] = useState<Formulario>(inicial);
  const [filtroArea, setFiltroArea] = useState("");
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [generando, setGenerando] = useState(false);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const iframeRef = useRef<HTMLIFrameElement>(null);

  function cambiar(campo: keyof Formulario, valor: string) {
    setFormulario((actual) => ({ ...actual, [campo]: valor }));
  }

  const areasDisponibles = [...new Set(
    docentes.flatMap((docente) =>
      (docente.area ?? "")
        .split(";")
        .map((area) => area.trim())
        .filter((area) => area && area !== "Sin asignación en el Plan 2026"),
    ),
  )].sort((a, b) => a.localeCompare(b, "es"));

  const perteneceAlArea = (docente: Docente, area: string) =>
    !area || (docente.area ?? "").split(";").map((valor) => valor.trim()).includes(area);

  const docentesFiltrados = docentes.filter((docente) => perteneceAlArea(docente, filtroArea));

  function cambiarFiltroArea(area: string) {
    setFiltroArea(area);
    const permitidos = new Set(
      docentes.filter((docente) => perteneceAlArea(docente, area)).map((docente) => docente.nombre),
    );
    setFormulario((actual) => ({
      ...actual,
      tribunal1: actual.tribunal1 && !permitidos.has(actual.tribunal1) ? "" : actual.tribunal1,
      tribunal2: actual.tribunal2 && !permitidos.has(actual.tribunal2) ? "" : actual.tribunal2,
    }));
  }

  function fechaTexto(fecha: string) {
    if (!fecha) return "";
    const partes = fecha.includes("/")
      ? fecha.split("/").map(Number)
      : fecha.split("-").map(Number).reverse();
    const [dia, mes, anio] = partes;
    return new Date(anio, mes - 1, dia).toLocaleDateString("es-BO", {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
    });
  }

  function validar() {
    const nuevos: Record<string, string> = {};
    const requeridos: Array<[keyof Formulario, string]> = [
      ["postulante", "El nombre del postulante es obligatorio."],
      ["ci", "El carnet de identidad (CI) es obligatorio para generar el PDF o descargar el Word."],
      ["pagina", "El número superior es obligatorio."],
      ["libro", "El número de libro es obligatorio."],
      ["materia", "La materia es obligatoria."],
      ["area", "El área es obligatoria."],
      ["aula", "El aula es obligatoria."],
      ["convocatoria", "El número de convocatoria es obligatorio."],
      ["gestion", "La gestión es obligatoria."],
      ["fecha", "Seleccione la fecha del examen."],
      ["hora", "Seleccione la hora del examen."],
      ["duracion", "La duración es obligatoria."],
      ["nota", "La nota es obligatoria."],
      ["aprobado", "Indique el texto de aprobado."],
      ["tribunal1", "Seleccione el primer tribunal evaluador."],
      ["tribunal2", "Seleccione el segundo tribunal evaluador."],
    ];

    for (const [campo, mensaje] of requeridos) {
      if (!formulario[campo].trim()) nuevos[campo] = mensaje;
    }

    if (!presidente.trim()) {
      nuevos.presidente = "Seleccione el presidente del tribunal.";
    }

    if (formulario.tribunal1 && formulario.tribunal1 === formulario.tribunal2) nuevos.tribunal2 = "Los tribunales deben ser diferentes.";
    if (formulario.nota.trim() && (Number(formulario.nota) < 0 || Number(formulario.nota) > 100 || Number.isNaN(Number(formulario.nota)))) {
      nuevos.nota = "La nota debe estar entre 0 y 100.";
    }
    setErrores(nuevos);
    return Object.keys(nuevos).length === 0;
  }

  const datos = () => ({ ...formulario, presidente, fechaTexto: fechaTexto(formulario.fecha) });

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
      const blob = await obtenerArchivo("/api/actas/examen-grado/pdf");
      const url = URL.createObjectURL(blob);
      setPdfUrl((anterior) => { if (anterior) URL.revokeObjectURL(anterior); return url; });
    } catch (error) {
      alert(error instanceof Error ? error.message : "No se pudo generar el PDF.");
    } finally { setGenerando(false); }
  }

  async function descargarWord() {
    if (!validar()) return;
    try {
      const blob = await obtenerArchivo("/api/actas/examen-grado/docx");
      const url = URL.createObjectURL(blob);
      const enlace = document.createElement("a");
      enlace.href = url;
      enlace.download = nombreArchivoActa(formulario.ci, SIGLAS_MODALIDAD.examenGrado, "docx");
      enlace.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      alert(error instanceof Error ? error.message : "No se pudo generar el Word.");
    }
  }

  function descargarPdf() {
    if (!pdfUrl || !validar()) return;
    const enlace = document.createElement("a");
    enlace.href = pdfUrl;
    enlace.download = nombreArchivoActa(formulario.ci, SIGLAS_MODALIDAD.examenGrado, "pdf");
    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();
  }

  useEffect(() => () => { if (pdfUrl) URL.revokeObjectURL(pdfUrl); }, [pdfUrl]);

  const campo = (label: string, key: keyof Formulario, placeholder = "") => (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">{label}</label>
      <input value={formulario[key]} onChange={(e) => cambiar(key, e.target.value)} placeholder={placeholder} className="w-full rounded-lg border border-slate-300 px-4 py-2.5 outline-none focus:border-blue-500" />
    </div>
  );

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-slate-800">Acta de Examen de Grado</h1><p className="mt-1 text-slate-500">Complete la información para generar el acta.</p></div>
        <div className="acta-header-tools">
          <ManualUsuario pantalla="examen-grado" />
          <ActivarGeneradorPdf />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <section className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-6 text-lg font-semibold text-slate-800">Datos del examen</h2>
          {Object.keys(errores).length > 0 && <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"><p className="font-semibold">Completa los siguientes campos:</p><ul className="mt-2 list-disc pl-5">{Object.values(errores).map((e) => <li key={e}>{e}</li>)}</ul></div>}
          <div className="space-y-5">
            {campo("Nombre del postulante", "postulante", "Nombre completo")}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Carnet de identidad (CI) *</label>
              <input required value={formulario.ci} onChange={(e) => cambiar("ci", e.target.value)} placeholder="Ej. 12345678" className="w-full rounded-lg border border-slate-300 px-4 py-2.5 outline-none focus:border-blue-500" />
              <p className="mt-1 text-xs text-slate-500">Solo se usará para nombrar la descarga, por ejemplo 12345678-EG.</p>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">{campo("Número superior", "pagina", "Ej. 08")}{campo("Libro N.º", "libro", "Ej. 9")}</div>
            {campo("Materia", "materia", "Ej. TUR – 327 PLANIFICACIÓN TURÍSTICA")}
            {campo("Área", "area", "Ej. TURÍSTICA Y ADMINISTRATIVA")}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">{campo("Aula", "aula", "Ej. 11-05")}{campo("N.º de convocatoria", "convocatoria", "Ej. 02")}</div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">{campo("Gestión", "gestion", "Ej. 2026")}{campo("Duración en minutos", "duracion", "Ej. 30")}</div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Fecha</label>
                <input type="date" value={formulario.fecha} onChange={(e) => cambiar("fecha", e.target.value)} className="w-full rounded-lg border border-slate-300 px-4 py-2.5 outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Hora</label>
                <input type="time" value={formulario.hora} onChange={(e) => cambiar("hora", e.target.value)} className="w-full rounded-lg border border-slate-300 px-4 py-2.5 outline-none focus:border-blue-500" />
              </div>
            </div>
            {campo("Nota", "nota", "Ej. 90")}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">{campo("Texto de aprobado", "aprobado", "Ej. X")}{campo("Texto de reprobado", "reprobado", "Dejar vacío si no corresponde")}</div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <label htmlFor="filtro-area-tribunales" className="mb-2 block text-sm font-medium text-slate-700">Filtrar tribunales por área</label>
              <select id="filtro-area-tribunales" value={filtroArea} onChange={(e) => cambiarFiltroArea(e.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 outline-none focus:border-blue-500">
                <option value="">Ninguno — mostrar todos los docentes</option>
                {areasDisponibles.map((area) => <option key={area} value={area}>{area}</option>)}
              </select>
              <p className="mt-2 text-xs text-slate-500">
                {filtroArea
                  ? `${docentesFiltrados.length} docente${docentesFiltrados.length === 1 ? "" : "s"} disponible${docentesFiltrados.length === 1 ? "" : "s"} en ${filtroArea}.`
                  : `Se muestran todos los docentes activos (${docentes.length}).`}
              </p>
            </div>
            <div><label className="mb-2 block text-sm font-medium text-slate-700">Tribunal evaluador 1</label><SelectorPersona personas={docentesFiltrados} label="Tribunal evaluador 1" value={formulario.tribunal1} onChange={valor => cambiar("tribunal1", valor)} /></div>
            <div><label className="mb-2 block text-sm font-medium text-slate-700">Tribunal evaluador 2</label><SelectorPersona personas={docentesFiltrados} label="Tribunal evaluador 2" value={formulario.tribunal2} onChange={valor => cambiar("tribunal2", valor)} /></div>
            <div><label className="mb-2 block text-sm font-medium text-slate-700">Presidente del tribunal</label><SelectorPresidente presidentes={presidentes} value={presidente} onChange={setPresidente} /></div>
            <button type="button" onClick={generarPdf} disabled={generando} className="w-full rounded-lg bg-slate-800 px-5 py-3 font-medium text-white hover:bg-slate-900 disabled:opacity-50">{generando ? "Generando PDF..." : "Generar vista previa PDF"}</button>
            <button type="button" onClick={descargarWord} className="w-full rounded-lg border border-slate-800 px-5 py-3 font-medium text-slate-900 hover:bg-slate-100">Descargar Word</button>
          </div>
        </section>
        <section className="rounded-xl bg-slate-200 p-6 shadow-sm"><div className="mb-4 flex items-center justify-between"><h2 className="font-semibold text-slate-800">Vista previa PDF</h2>{pdfUrl && <div className="flex gap-2"><button type="button" onClick={descargarPdf} className="rounded-lg border border-slate-500 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-100">Descargar PDF</button><button type="button" onClick={() => iframeRef.current?.contentWindow?.print()} className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-white">Imprimir</button></div>}</div>{pdfUrl ? <iframe ref={iframeRef} src={pdfUrl} title="Vista previa del examen de grado" className="h-[850px] w-full rounded-lg bg-white" /> : <div className="flex h-[850px] items-center justify-center rounded-lg bg-white"><div className="text-center"><p className="font-medium text-slate-600">Vista previa del documento</p><p className="mt-2 text-sm text-slate-400">Complete el formulario y genere el PDF.</p></div></div>}</section>
      </div>
    </div>
  );
}
