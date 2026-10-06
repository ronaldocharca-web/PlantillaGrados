"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";
import ActivarGeneradorPdf from "@/components/ActivarGeneradorPdf";
import ManualUsuario from "@/components/ManualUsuario";
import SelectorPresidente from "@/components/SelectorPresidente";
import type { Presidente } from "@/lib/presidentes";
import { nombreArchivoActa, SIGLAS_MODALIDAD } from "@/lib/ci";

type Docente = {
  id: number;
  nombre: string;
};

type Props = {
  docentes: Docente[];
  presidentes: Presidente[]; presidente: string;
};

export default function FormularioProyectoGrado({
  docentes, presidentes, presidente: presidenteInicial,
}: Props) {
  const [presidente, setPresidente] = useState(presidenteInicial);
  const [formulario, setFormulario] = useState({
    postulante: "",
    postulante2: "",
    ci: "",
    pagina: "19",
    libro: "9",
    genero: "masculino",
    genero2: "masculino",
    tribunal1: "",
    tribunal2: "",
    tutor: "",
    fecha: "",
    hora: "",
    tema: "",
    nota: "",
  });

  const [pdfUrl, setPdfUrl] =
  useState<string | null>(null);

const [generandoPdf, setGenerandoPdf] =
  useState(false);

  const [errores, setErrores] = useState<
  Record<string, string>
>({});

const iframeRef =
  useRef<HTMLIFrameElement>(null);

  function cambiarCampo(
    campo: string,
    valor: string
  ) {
    setFormulario((anterior) => ({
      ...anterior,
      [campo]: valor,
    }));
  }

  function formatearFecha(fecha: string) {
  if (!fecha) return "";

  const partes = fecha.includes("/")
    ? fecha.split("/").map(Number)
    : fecha.split("-").map(Number).reverse();
  const [dia, mes, anio] = partes;

  const fechaLocal = new Date(anio, mes - 1, dia);

  return fechaLocal.toLocaleDateString("es-BO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

async function generarPdf() {
  if (!validarFormulario()) {
    return;
  }

  try {
    setGenerandoPdf(true);

    const respuesta = await fetch(
      "/api/actas/proyecto-grado/pdf",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          ...formulario,

          presidente,

          fechaTexto: formatearFecha(
            formulario.fecha
          ),
        }),
      }
    );

    if (!respuesta.ok) {
      const error = await respuesta.json();

      throw new Error(
        error.error ||
          "No se pudo generar el PDF"
      );
    }

    const archivo = await respuesta.blob();

    const nuevaUrl =
      URL.createObjectURL(archivo);

    setPdfUrl((urlAnterior) => {
      if (urlAnterior) {
        URL.revokeObjectURL(urlAnterior);
      }

      return nuevaUrl;
    });
  } catch (error) {
    console.error(error);

    if (error instanceof Error) {
      alert(error.message);
    }
  } finally {
    setGenerandoPdf(false);
  }
}

useEffect(() => {
  return () => {
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
    }
  };
}, [pdfUrl]);

function descargarPdf() {
  if (!pdfUrl || !validarFormulario()) return;

  const enlace = document.createElement("a");
  enlace.href = pdfUrl;
  enlace.download = nombreArchivoActa(
    formulario.ci,
    SIGLAS_MODALIDAD.proyectoGrado,
    "pdf"
  );
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
}

function imprimirPdf() {
  if (!pdfUrl) return;

  iframeRef.current?.contentWindow?.print();
}

function validarFormulario() {
  const nuevos: Record<string, string> = {};
  const requeridos: Array<[keyof typeof formulario, string]> = [
    ["postulante", "El nombre del primer postulante es obligatorio."],
    ["ci", "El carnet de identidad (CI) es obligatorio para generar el PDF o descargar el Word."],
    ["pagina", "El número superior es obligatorio."],
    ["libro", "El número de libro es obligatorio."],
    ["tribunal1", "Seleccione el primer miembro del tribunal."],
    ["tribunal2", "Seleccione el segundo miembro del tribunal."],
    ["tutor", "Seleccione el docente tutor."],
    ["fecha", "Seleccione la fecha de la defensa."],
    ["hora", "Seleccione la hora de la defensa."],
    ["tema", "El tema del Proyecto de Grado es obligatorio."],
    ["nota", "La nota es obligatoria."],
  ];

  for (const [campo, mensaje] of requeridos) {
    if (!formulario[campo].trim()) nuevos[campo] = mensaje;
  }

  if (!presidente.trim()) {
    nuevos.presidente = "Seleccione el presidente del tribunal.";
  }

  if (
    formulario.tribunal1.trim() &&
    formulario.tribunal1 === formulario.tribunal2
  ) {
    nuevos.tribunal2 = "Los miembros del tribunal deben ser diferentes.";
  }

  if (formulario.nota.trim()) {
    const nota = Number(formulario.nota);
    if (Number.isNaN(nota) || nota < 0 || nota > 100) {
      nuevos.nota = "La nota debe estar entre 0 y 100.";
    }
  }

  setErrores(nuevos);
  return Object.keys(nuevos).length === 0;
}

async function generarActa() {
  if (!validarFormulario()) {
    return;
  }

  try {
    // aquí continúa tu código actual
    const respuesta = await fetch(
      "/api/actas/proyecto-grado/docx",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          ...formulario,

          presidente,

          fechaTexto: formatearFecha(
            formulario.fecha
          ),
        }),
      }
    );

    if (!respuesta.ok) {
  const error = await respuesta.json();

  throw new Error(
    error.error || "No se pudo generar el documento"
  );
}

    const archivo = await respuesta.blob();

    const url = window.URL.createObjectURL(
      archivo
    );

    const enlace = document.createElement("a");

    enlace.href = url;

    enlace.download = nombreArchivoActa(
      formulario.ci,
      SIGLAS_MODALIDAD.proyectoGrado,
      "docx"
    );

    document.body.appendChild(enlace);

    enlace.click();

    enlace.remove();

    window.URL.revokeObjectURL(url);
  } catch (error) {
  console.error(error);

  if (error instanceof Error) {
    alert(error.message);
  } else {
    alert("Ocurrió un error al generar el acta.");
  }
}
}

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
        <h1 className="text-2xl font-bold text-slate-800">
          Acta de Proyecto de Grado
        </h1>

        <p className="mt-1 text-slate-500">
          Complete la información para generar el acta.
        </p>
        </div>
        <div className="acta-header-tools">
          <ManualUsuario pantalla="proyecto-grado" />
          <ActivarGeneradorPdf />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">

        {/* FORMULARIO */}

        <section className="rounded-xl bg-white p-6 shadow-sm">

          <h2 className="mb-6 text-lg font-semibold text-slate-800">
            Datos del acta
          </h2>

          {Object.keys(errores).length > 0 && (
            <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <p className="font-semibold">
                Revisa los siguientes datos antes de generar el PDF o descargar el Word:
              </p>
              <ul className="mt-2 list-disc pl-5">
                {Object.values(errores).map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="space-y-5">

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Nombre del postulante
              </label>

              <input
                type="text"
                value={formulario.postulante}
                onChange={(e) =>
                  cambiarCampo("postulante", e.target.value)
                }
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 outline-none focus:border-blue-500"
                placeholder="Nombre completo"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Carnet de identidad (CI) *
              </label>

              <input
                type="text"
                value={formulario.ci}
                onChange={(e) => cambiarCampo("ci", e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 outline-none focus:border-blue-500"
                placeholder="Ej. 12345678"
                required
              />
              <p className="mt-1 text-xs text-slate-500">
                Solo se usará para nombrar la descarga, por ejemplo 12345678-PG.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Número superior</label>
                <input type="number" min="1" value={formulario.pagina} onChange={(e) => cambiarCampo("pagina", e.target.value)} className="w-full rounded-lg border border-slate-300 px-4 py-2.5 outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Libro N.º</label>
                <input type="number" min="1" value={formulario.libro} onChange={(e) => cambiarCampo("libro", e.target.value)} className="w-full rounded-lg border border-slate-300 px-4 py-2.5 outline-none focus:border-blue-500" />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Género persona 1
              </label>

              <select
                value={formulario.genero}
                onChange={(e) =>
                  cambiarCampo("genero", e.target.value)
                }
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5"
              >
                <option value="masculino">
                  Masculino
                </option>

                <option value="femenino">
                  Femenino
                </option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Nombre del segundo postulante (opcional)
              </label>

              <input
                type="text"
                value={formulario.postulante2}
                onChange={(e) =>
                  cambiarCampo("postulante2", e.target.value)
                }
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 outline-none focus:border-blue-500"
                placeholder="Nombre completo"
              />
            </div>

            {formulario.postulante2.trim() && (
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Género persona 2
                </label>

                <select
                  value={formulario.genero2}
                  onChange={(e) =>
                    cambiarCampo("genero2", e.target.value)
                  }
                  className="w-full rounded-lg border border-slate-300 px-4 py-2.5"
                >
                  <option value="masculino">Masculino</option>
                  <option value="femenino">Femenino</option>
                </select>
              </div>
            )}

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Primer miembro del tribunal
              </label>

              <select
                value={formulario.tribunal1}
                onChange={(e) =>
                  cambiarCampo("tribunal1", e.target.value)
                }
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5"
              >
                <option value="">
                  Seleccione un docente
                </option>

                {docentes.map((docente) => (
                  <option
                    key={docente.id}
                    value={docente.nombre}
                  >
                    {docente.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Segundo miembro del tribunal
              </label>

              <select
                value={formulario.tribunal2}
                onChange={(e) =>
                  cambiarCampo("tribunal2", e.target.value)
                }
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5"
              >
                <option value="">
                  Seleccione un docente
                </option>

                {docentes.map((docente) => (
                  <option
                    key={docente.id}
                    value={docente.nombre}
                  >
                    {docente.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Docente tutor
              </label>

              <select
                value={formulario.tutor}
                onChange={(e) =>
                  cambiarCampo("tutor", e.target.value)
                }
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5"
              >
                <option value="">
                  Seleccione un docente
                </option>

                {docentes.map((docente) => (
                  <option
                    key={docente.id}
                    value={docente.nombre}
                  >
                    {docente.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Presidente del tribunal
              </label>

              <SelectorPresidente presidentes={presidentes} value={presidente} onChange={setPresidente} />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Fecha
                </label>

                <input
                  type="date"
                  value={formulario.fecha}
                  onChange={(e) => cambiarCampo("fecha", e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-4 py-2.5"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Hora
                </label>

                <input
                  type="time"
                  value={formulario.hora}
                  onChange={(e) =>
                    cambiarCampo("hora", e.target.value)
                  }
                  className="w-full rounded-lg border border-slate-300 px-4 py-2.5"
                />
              </div>

            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Tema del Proyecto de Grado
              </label>

              <textarea
                rows={4}
                value={formulario.tema}
                onChange={(e) =>
                  cambiarCampo("tema", e.target.value)
                }
                className="w-full resize-none rounded-lg border border-slate-300 px-4 py-2.5"
                placeholder="Ingrese el título completo del Proyecto de Grado"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Nota
              </label>

              <input
                type="number"
                min="0"
                max="100"
                value={formulario.nota}
                onChange={(e) =>
                  cambiarCampo("nota", e.target.value)
                }
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5"
                placeholder="Ej. 85"
              />
            </div>

            <button
  type="button"
  onClick={generarPdf}
  disabled={generandoPdf}
  className="w-full rounded-lg bg-slate-800 px-5 py-3 font-medium text-white hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
>
  {generandoPdf
    ? "Generando PDF..."
    : "Generar vista previa PDF"}
</button>

            <button
              type="button"
              onClick={generarActa}
              className="w-full rounded-lg border border-slate-800 px-5 py-3 font-medium text-slate-900 hover:bg-slate-100"
            >
              Descargar Word
            </button>

          </div>
        </section>

        {/* VISTA PREVIA */}

        <section className="rounded-xl bg-slate-200 p-6 shadow-sm">
  <div className="mb-4 flex items-center justify-between">

    <h2 className="font-semibold text-slate-800">
      Vista previa
    </h2>

    {pdfUrl && (
      <div className="flex gap-2">

        <button
          type="button"
          onClick={descargarPdf}
          className="rounded-lg border border-slate-500 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-100"
        >
          Descargar PDF
        </button>

        <button
          type="button"
          onClick={imprimirPdf}
          className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          Imprimir
        </button>

      </div>
    )}

  </div>

  {pdfUrl ? (
    <iframe
      ref={iframeRef}
      src={pdfUrl}
      title="Vista previa del acta"
      className="h-[850px] w-full rounded-lg bg-white"
    />
  ) : (
    <div className="flex h-[850px] items-center justify-center rounded-lg bg-white">

      <div className="text-center">
        <p className="font-medium text-slate-600">
          Vista previa del documento
        </p>

        <p className="mt-2 text-sm text-slate-400">
          Complete el formulario y presione
          &quot;Generar vista previa PDF&quot;.
        </p>
      </div>

    </div>
  )}
</section>

      </div>
    </div>
  );
}
