"use client";

import { useEffect, useRef, useState, type InputHTMLAttributes } from "react";
import ActivarGeneradorPdf from "@/components/ActivarGeneradorPdf";
import ManualUsuario from "@/components/ManualUsuario";
import SelectorPresidente from "@/components/SelectorPresidente";
import SelectorPersona from "@/components/SelectorPersona";
import type { Presidente } from "@/lib/presidentes";
import { nombreArchivoActa, SIGLAS_MODALIDAD } from "@/lib/ci";
import { camposMaestria, notaEnLetras, resultadoMaestria, validarMaestria, type FormularioMaestria as Datos } from "@/lib/maestria-data";

const control = "w-full rounded-lg border border-slate-300 px-4 py-2.5 outline-none focus:border-violet-500";

export default function FormularioMaestria({ docentes, presidentes, presidente }: {
  docentes: { id: number; nombre: string }[];
  presidentes: Presidente[];
  presidente: string;
}) {
  const [datos, setDatos] = useState<Datos>({
    postulante: "", ci: "", pagina: "36", genero: "masculino", fecha: "", hora: "",
    tema: "", maestria: "MAESTRÍA EN DESARROLLO TURÍSTICO SUSTENTABLE", siglasGrado: "M. Sc.",
    nota: "", tribunal1: "", tribunal2: "", revisor: "", presidente,
  });
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [ocupado, setOcupado] = useState<"pdf" | "docx" | null>(null);
  const [pdf, setPdf] = useState<{ url: string; nombre: string } | null>(null);
  const iframe = useRef<HTMLIFrameElement>(null);
  const aviso = useRef<HTMLDivElement>(null);

  useEffect(() => () => { if (pdf) URL.revokeObjectURL(pdf.url); }, [pdf]);

  function cambiar(campo: keyof Datos, valor: string) {
    setDatos(anterior => ({ ...anterior, [campo]: valor }));
    setPdf(null);
    setErrores({});
  }

  function mostrarErrores(nuevos: Record<string, string>) {
    setErrores(nuevos);
    requestAnimationFrame(() => { aviso.current?.focus(); aviso.current?.scrollIntoView({ behavior: "smooth", block: "center" }); });
  }

  function descargar(url: string, nombre: string) {
    const enlace = document.createElement("a");
    enlace.href = url;
    enlace.download = nombre;
    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();
  }

  async function generar(tipo: "pdf" | "docx") {
    const validacion = validarMaestria(datos);
    if (Object.keys(validacion).length) { mostrarErrores(validacion); return; }
    setErrores({});
    setOcupado(tipo);
    try {
      const respuesta = await fetch(`/api/actas/maestria/${tipo}`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(datos),
      });
      if (!respuesta.ok) {
        const detalle = await respuesta.json().catch(() => null);
        throw new Error(detalle?.error || "No se pudo generar el documento. Intente nuevamente.");
      }
      const url = URL.createObjectURL(await respuesta.blob());
      const nombre = nombreArchivoActa(datos.ci, SIGLAS_MODALIDAD.maestria, tipo);
      if (tipo === "pdf") setPdf({ url, nombre });
      else { descargar(url, nombre); setTimeout(() => URL.revokeObjectURL(url), 15000); }
    } catch (error) {
      mostrarErrores({ descarga: error instanceof Error ? error.message : "No se pudo generar el documento." });
    } finally { setOcupado(null); }
  }

  function campo(nombre: keyof Datos, opciones: InputHTMLAttributes<HTMLInputElement> = {}) {
    return <div>
      <label htmlFor={`maestria-${nombre}`} className="mb-2 block font-medium text-slate-700">{camposMaestria[nombre]} *</label>
      <input {...opciones} id={`maestria-${nombre}`} required value={datos[nombre]} aria-invalid={Boolean(errores[nombre])}
        onChange={evento => cambiar(nombre, evento.target.value)} className={control} />
    </div>;
  }

  const tieneNota = datos.nota.trim() !== "" && !validarMaestria(datos).nota;

  return <div className="dashboard-page p-8">
    <div className="dashboard-header mb-8">
      <div><h1 className="text-4xl font-bold tracking-tight text-slate-900">Acta de Maestría</h1>
        <p className="mt-3 text-slate-500">Defensa de tesis de postgrado. Complete los datos para generar el acta.</p></div>
      <div className="page-heading-actions"><ManualUsuario pantalla="maestria" /><ActivarGeneradorPdf /></div>
    </div>

    <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-2">
      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="mb-6 text-2xl font-bold text-slate-800">Datos del acta</h2>
        <p className="mb-6 text-sm text-slate-500">Los campos con * son obligatorios. El literal y la valoración se calculan desde la nota.</p>
        {Object.keys(errores).length > 0 && <div ref={aviso} tabIndex={-1} role="alert" className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          <p className="font-semibold">Revise los datos antes de generar el documento:</p>
          <ul className="mt-2 list-disc pl-5">{Object.entries(errores).map(([clave, texto]) => <li key={clave}>{texto}</li>)}</ul>
        </div>}
        <form noValidate onSubmit={evento => { evento.preventDefault(); void generar("pdf"); }}>
          <fieldset disabled={ocupado !== null} className="space-y-6 disabled:opacity-70">
            {campo("postulante", { placeholder: "Nombre completo" })}
            <div>{campo("ci", { placeholder: "Ej. 12345678" })}<p className="mt-2 text-sm text-slate-500">Solo se usa para nombrar la descarga: 12345678-M. No aparece dentro del Word ni del PDF.</p></div>
            <div className="grid gap-5 sm:grid-cols-2">
              {campo("pagina", { type: "number", min: 1, max: 99998, step: 1 })}
              <div><label htmlFor="maestria-genero" className="mb-2 block font-medium text-slate-700">Género del postulante *</label>
                <select id="maestria-genero" value={datos.genero} onChange={e => cambiar("genero", e.target.value)} className={control} required>
                  <option value="masculino">Masculino — Licenciado</option><option value="femenino">Femenino — Licenciada</option>
                </select></div>
            </div>
            <p className="text-sm text-slate-500">La numeración continúa en las páginas siguientes. Después de «versión» se conservan tres espacios, sin guiones bajos.</p>
            <div className="grid gap-5 sm:grid-cols-2">{campo("fecha", { type: "date" })}{campo("hora", { type: "time" })}</div>
            <p className="text-sm text-slate-500">La hora se escribe en el acta con a. m. o p. m. según corresponda (por ejemplo, 14:30 → 02:30 p. m.).</p>
            <div><label htmlFor="maestria-tema" className="mb-2 block font-medium text-slate-700">Título de la tesis *</label>
              <textarea id="maestria-tema" required rows={4} value={datos.tema} aria-invalid={Boolean(errores.tema)} onChange={e => cambiar("tema", e.target.value)} className={control} placeholder="Título completo de la investigación" /></div>
            {campo("maestria")}
            {campo("siglasGrado", { placeholder: "Ej. M. Sc." })}
            {(["tribunal1", "tribunal2", "revisor"] as const).map(nombre => <div key={nombre}>
              <label htmlFor={`maestria-${nombre}`} className="mb-2 block font-medium text-slate-700">{camposMaestria[nombre]} *</label>
              <SelectorPersona id={`maestria-${nombre}`} personas={docentes} label={camposMaestria[nombre]} required
                value={datos[nombre]} onChange={valor => cambiar(nombre, valor)} invalid={Boolean(errores[nombre])} />
            </div>)}
            <div><p className="mb-2 font-medium text-slate-700">Presidente del tribunal *</p>
              <SelectorPresidente presidentes={presidentes} value={datos.presidente} onChange={valor => cambiar("presidente", valor)} />
              <p className="mt-2 text-sm text-slate-500">Puede agregar docentes y presidentes desde Administración.</p></div>
            {campo("nota", { type: "number", min: 0, max: 100, step: 1, placeholder: "0 a 100" })}
            <div><label htmlFor="maestria-literal" className="mb-2 block font-medium text-slate-700">Nota literal (automática)</label>
              <input id="maestria-literal" readOnly value={tieneNota ? notaEnLetras(Number(datos.nota)) : ""} className={control} />
            </div>
            <div><label htmlFor="maestria-resultado" className="mb-2 block font-medium text-slate-700">Ha sido (automático)</label>
              <input id="maestria-resultado" readOnly value={tieneNota ? resultadoMaestria(Number(datos.nota), datos.genero) : ""} className={control} />
            </div>
            <p className="text-sm leading-relaxed text-slate-500">0–65: reprobado · 66–70: aprobado · 71–80: bueno · 81–90: muy bueno · 91–100: excelente.</p>
            <button type="submit" className="w-full rounded-xl bg-blue-600 px-5 py-3 font-medium text-white">{ocupado === "pdf" ? "Generando PDF…" : "Generar vista previa PDF"}</button>
            <button type="button" onClick={() => void generar("docx")} className="w-full rounded-xl border border-slate-700 px-5 py-3 font-medium text-slate-800">{ocupado === "docx" ? "Generando Word…" : "Descargar Word"}</button>
          </fieldset>
        </form>
      </section>
      <section className="min-w-0 rounded-2xl bg-slate-200 p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-semibold text-slate-800">Vista previa PDF</h2>
          {pdf && <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => descargar(pdf.url, pdf.nombre)} className="rounded-xl border border-slate-500 bg-white px-4 py-2 text-slate-800">Descargar PDF</button>
            <button type="button" onClick={() => iframe.current?.contentWindow?.print()} className="rounded-xl bg-slate-700 px-4 py-2 text-white">Imprimir</button>
          </div>}
        </div>
        {pdf ? <iframe ref={iframe} src={pdf.url} title="Vista previa del acta de Maestría" className="h-[850px] w-full rounded-xl border-0 bg-white" />
          : <div className="flex min-h-[600px] items-center justify-center rounded-xl bg-white p-8 text-center text-slate-500" aria-live="polite">{ocupado === "pdf" ? "Generando PDF…" : "Complete los datos y pulse «Generar vista previa PDF». Si cambia un dato, genere la vista previa nuevamente."}</div>}
      </section>
    </div>
  </div>;
}
