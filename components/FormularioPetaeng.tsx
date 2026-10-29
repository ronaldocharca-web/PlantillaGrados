"use client";

import { useEffect, useRef, useState } from "react";
import ActivarGeneradorPdf from "@/components/ActivarGeneradorPdf";
import ManualUsuario from "@/components/ManualUsuario";
import SelectorPersona from "@/components/SelectorPersona";
import SelectorPresidente from "@/components/SelectorPresidente";
import { nombreArchivoActa } from "@/lib/ci";
import { configuracionPetaeng, type FormularioPetaeng, type ModalidadPetaeng } from "@/lib/petaeng-data";
import type { Presidente } from "@/lib/presidentes";

type Props = {
  modalidad: ModalidadPetaeng;
  docentes: { id: number; nombre: string }[];
  presidentes: Presidente[];
  presidente: string;
};

function formularioInicial(modalidad: ModalidadPetaeng): FormularioPetaeng {
  return {
    postulante: "", ci: "", folio: modalidad === "memoria-laboral" ? "74" : "84", libro: "9",
    gestion: String(new Date().getUTCFullYear()), fecha: "", hora: "", nota: "", tema: "", tutor: "",
    tribunal1: "", tribunal2: "", tribunal3: "", presidente: "",
  };
}

const campo = "w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 outline-none focus:border-blue-500";

export default function FormularioPetaeng({ modalidad, docentes, presidentes, presidente: presidenteInicial }: Props) {
  const configuracion = configuracionPetaeng[modalidad];
  const pantalla = modalidad === "memoria-laboral" ? "petaeng-memoria-laboral" : "petaeng-cursos";
  const [formulario, setFormulario] = useState<FormularioPetaeng>(() => formularioInicial(modalidad));
  const [presidente, setPresidente] = useState(presidenteInicial);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [ocupado, setOcupado] = useState<"pdf" | "docx" | null>(null);
  const [pdf, setPdf] = useState<{ url: string; nombre: string } | null>(null);
  const iframe = useRef<HTMLIFrameElement>(null);

  useEffect(() => () => { if (pdf) URL.revokeObjectURL(pdf.url); }, [pdf]);

  function cambiar(campoNombre: keyof FormularioPetaeng, valor: string) {
    setFormulario(actual => ({ ...actual, [campoNombre]: valor }));
    setErrores(actual => {
      if (!actual[campoNombre]) return actual;
      const copia = { ...actual };
      delete copia[campoNombre];
      return copia;
    });
  }

  function validar() {
    const nuevos: Record<string, string> = {};
    const obligatorios: Array<[keyof FormularioPetaeng, string]> = [
      ["postulante", "Ingrese el nombre del postulante."], ["ci", "Ingrese el carnet de identidad."],
      ["folio", "Ingrese el folio."], ["libro", "Ingrese el número de libro."], ["gestion", "Ingrese la gestión."],
      ["fecha", "Seleccione la fecha."], ["hora", "Seleccione la hora."],
      ["tribunal1", "Seleccione el primer tribunal."], ["tribunal2", "Seleccione el segundo tribunal."],
    ];
    if (modalidad === "memoria-laboral") obligatorios.push(["tema", "Ingrese el tema."], ["tutor", "Seleccione el docente tutor."]);
    else obligatorios.push(["tribunal3", "Seleccione el tercer tribunal."]);
    for (const [nombre, mensaje] of obligatorios) if (!formulario[nombre].trim()) nuevos[nombre] = mensaje;
    if (!presidente.trim()) nuevos.presidente = "Seleccione el presidente del tribunal.";
    if (!/^\d+$/.test(formulario.folio) || Number(formulario.folio) < 1) nuevos.folio = "El folio debe ser mayor que cero.";
    if (!/^\d+$/.test(formulario.libro) || Number(formulario.libro) < 1) nuevos.libro = "El libro debe ser mayor que cero.";
    if (!/^\d{4}$/.test(formulario.gestion)) nuevos.gestion = "La gestión debe tener cuatro dígitos.";
    if (formulario.nota && (!/^\d{1,3}$/.test(formulario.nota) || Number(formulario.nota) > 100)) nuevos.nota = "La nota debe ser un entero entre 0 y 100.";
    const personas = modalidad === "memoria-laboral"
      ? [formulario.tribunal1, formulario.tribunal2, formulario.tutor, presidente]
      : [formulario.tribunal1, formulario.tribunal2, formulario.tribunal3, presidente];
    const elegidas = personas.filter(Boolean).map(nombre => nombre.trim().toLocaleLowerCase("es-BO"));
    if (new Set(elegidas).size !== elegidas.length) nuevos.tribunal1 = "Los tribunales, el tutor y el presidente deben ser personas diferentes.";
    setErrores(nuevos);
    return Object.keys(nuevos).length === 0;
  }

  async function generar(tipo: "pdf" | "docx") {
    if (!validar()) return;
    setOcupado(tipo);
    try {
      const respuesta = await fetch(`/api/actas/${pantalla}/${tipo}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formulario, presidente }),
      });
      if (!respuesta.ok) {
        const detalle = await respuesta.json().catch(() => ({}));
        throw new Error(detalle.error || `No se pudo generar el ${tipo === "pdf" ? "PDF" : "Word"}.`);
      }
      const archivo = await respuesta.blob();
      const nombre = nombreArchivoActa(formulario.ci, configuracion.sigla, tipo);
      const url = URL.createObjectURL(archivo);
      if (tipo === "pdf") {
        setPdf(anterior => {
          if (anterior) URL.revokeObjectURL(anterior.url);
          return { url, nombre };
        });
      } else {
        const enlace = document.createElement("a");
        enlace.href = url; enlace.download = nombre; document.body.appendChild(enlace); enlace.click(); enlace.remove();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : "No se pudo generar el documento.");
    } finally {
      setOcupado(null);
    }
  }

  function descargarPdf() {
    if (!pdf) return;
    const enlace = document.createElement("a");
    enlace.href = pdf.url; enlace.download = pdf.nombre; document.body.appendChild(enlace); enlace.click(); enlace.remove();
  }

  return <div className="p-6">
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div><p className="eyebrow">Plan PETAENG</p><h1 className="mt-2 text-2xl font-bold text-slate-800">{configuracion.titulo}</h1>
        <p className="mt-1 text-slate-500">{configuracion.descripcion}</p></div>
      <div className="acta-header-tools"><ManualUsuario pantalla={pantalla} /><ActivarGeneradorPdf /></div>
    </div>

    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
      <section className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="mb-6 text-lg font-semibold text-slate-800">Datos del acta</h2>
        {Object.keys(errores).length > 0 && <div className="mb-5 rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-800">
          <p className="font-semibold">Revise los datos indicados:</p><ul className="mt-2 list-disc pl-5">{Object.values(errores).map(error => <li key={error}>{error}</li>)}</ul>
        </div>}
        <div className="space-y-5">
          <div><label className="mb-2 block text-sm font-medium text-slate-700">Nombre del postulante</label>
            <input value={formulario.postulante} onChange={e => cambiar("postulante", e.target.value)} className={campo} placeholder="Nombre completo" /></div>
          <div><label className="mb-2 block text-sm font-medium text-slate-700">Carnet de identidad (CI) *</label>
            <input value={formulario.ci} onChange={e => cambiar("ci", e.target.value)} className={campo} placeholder="Ej. 12345678" />
            <p className="mt-1 text-xs text-slate-500">Solo se usa para nombrar la descarga; no aparece dentro del acta.</p></div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div><label className="mb-2 block text-sm font-medium text-slate-700">Folio</label><input type="number" min="1" value={formulario.folio} onChange={e => cambiar("folio", e.target.value)} className={campo} /></div>
            <div><label className="mb-2 block text-sm font-medium text-slate-700">Libro N.º</label><input type="number" min="1" value={formulario.libro} onChange={e => cambiar("libro", e.target.value)} className={campo} /></div>
            <div><label className="mb-2 block text-sm font-medium text-slate-700">Gestión</label><input inputMode="numeric" value={formulario.gestion} onChange={e => cambiar("gestion", e.target.value)} className={campo} /></div>
          </div>
          {modalidad === "memoria-laboral" && <div><label className="mb-2 block text-sm font-medium text-slate-700">Tema de la Memoria Laboral</label>
            <textarea rows={4} value={formulario.tema} onChange={e => cambiar("tema", e.target.value)} className={`${campo} resize-none`} placeholder="Título completo de la memoria" /></div>}
          <div><label className="mb-2 block text-sm font-medium text-slate-700">Primer tribunal {modalidad === "cursos" ? "revisor" : "de grado"}</label>
            <SelectorPersona personas={docentes} label="Primer tribunal" value={formulario.tribunal1} onChange={valor => cambiar("tribunal1", valor)} /></div>
          <div><label className="mb-2 block text-sm font-medium text-slate-700">Segundo tribunal {modalidad === "cursos" ? "revisor" : "de grado"}</label>
            <SelectorPersona personas={docentes} label="Segundo tribunal" value={formulario.tribunal2} onChange={valor => cambiar("tribunal2", valor)} /></div>
          {modalidad === "cursos" && <div><label className="mb-2 block text-sm font-medium text-slate-700">Tercer tribunal revisor</label>
            <SelectorPersona personas={docentes} label="Tercer tribunal" value={formulario.tribunal3} onChange={valor => cambiar("tribunal3", valor)} /></div>}
          {modalidad === "memoria-laboral" && <div><label className="mb-2 block text-sm font-medium text-slate-700">Docente tutor</label>
            <SelectorPersona personas={docentes} label="Docente tutor" value={formulario.tutor} onChange={valor => cambiar("tutor", valor)} /></div>}
          <div><label className="mb-2 block text-sm font-medium text-slate-700">Presidente del tribunal</label>
            <SelectorPresidente presidentes={presidentes} value={presidente} onChange={setPresidente} /></div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div><label className="mb-2 block text-sm font-medium text-slate-700">Fecha</label><input type="date" value={formulario.fecha} onChange={e => cambiar("fecha", e.target.value)} className={campo} /></div>
            <div><label className="mb-2 block text-sm font-medium text-slate-700">Hora</label><input type="time" value={formulario.hora} onChange={e => cambiar("hora", e.target.value)} className={campo} /></div>
          </div>
          <div><label className="mb-2 block text-sm font-medium text-slate-700">Nota (opcional)</label>
            <input type="number" min="0" max="100" value={formulario.nota} onChange={e => cambiar("nota", e.target.value)} className={campo} placeholder="Ej. 86" />
            <p className="mt-1 text-xs text-slate-500">Si queda vacía, el documento mostrará __.</p></div>
          <button type="button" disabled={ocupado !== null} onClick={() => void generar("pdf")} className="w-full rounded-lg bg-slate-800 px-5 py-3 font-medium text-white disabled:opacity-50">{ocupado === "pdf" ? "Generando PDF…" : "Generar vista previa PDF"}</button>
          <button type="button" disabled={ocupado !== null} onClick={() => void generar("docx")} className="w-full rounded-lg border border-slate-700 px-5 py-3 font-medium text-slate-900 disabled:opacity-50">{ocupado === "docx" ? "Generando Word…" : "Descargar Word"}</button>
        </div>
      </section>

      <section className="min-w-0 rounded-xl bg-slate-200 p-6 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><h2 className="font-semibold text-slate-800">Vista previa</h2>
          {pdf && <div className="flex gap-2"><button type="button" onClick={descargarPdf} className="rounded-lg border border-slate-500 bg-white px-4 py-2 text-sm font-medium text-slate-800">Descargar PDF</button>
            <button type="button" onClick={() => iframe.current?.contentWindow?.print()} className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-white">Imprimir</button></div>}
        </div>
        {pdf ? <iframe ref={iframe} src={pdf.url} title={`Vista previa de ${configuracion.titulo}`} className="h-[850px] w-full rounded-lg bg-white" />
          : <div className="flex h-[850px] items-center justify-center rounded-lg bg-white p-8 text-center text-slate-500">{ocupado === "pdf" ? "Generando PDF…" : "Complete el formulario y pulse «Generar vista previa PDF»."}</div>}
      </section>
    </div>
  </div>;
}
