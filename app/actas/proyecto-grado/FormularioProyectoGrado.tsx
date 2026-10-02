"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";
import ActivarGeneradorPdf from "@/components/ActivarGeneradorPdf";

type Docente = {
  id: number;
  nombre: string;
};

type Props = {
  docentes: Docente[];
  presidente: string;
};

export default function FormularioProyectoGrado({
  docentes,
  presidente,
}: Props) {
  const [formulario, setFormulario] = useState({
    postulante: "",
    genero: "masculino",
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

async function descargarPdf() {
  if (!validarFormulario()) {
    return;
  }

  try {
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
          fechaTexto: formatearFecha(formulario.fecha),
        }),
      }
    );

    if (!respuesta.ok) {
      const tipoContenido =
        respuesta.headers.get("content-type") || "";

      let mensaje = "No se pudo generar el PDF";

      if (tipoContenido.includes("application/json")) {
        const error = await respuesta.json();

        mensaje =
          error.error || mensaje;
      } else {
        mensaje =
          `Error del servidor (${respuesta.status})`;
      }

      throw new Error(mensaje);
    }

    const archivo = await respuesta.blob();

    const url =
      URL.createObjectURL(archivo);

    const enlace =
      document.createElement("a");

    enlace.href = url;

    enlace.download =
      "acta-proyecto-grado.pdf";

    document.body.appendChild(enlace);

    enlace.click();

    enlace.remove();

    URL.revokeObjectURL(url);
  } catch (error) {
    console.error(error);

    if (error instanceof Error) {
      alert(error.message);
    } else {
      alert(
        "Ocurrió un error al descargar el PDF."
      );
    }
  }
}

function imprimirPdf() {
  if (!pdfUrl) return;

  iframeRef.current?.contentWindow?.print();
}

function validarFormulario() {
  const nuevosErrores: Record<string, string> = {};

  if (!formulario.postulante.trim()) {
    nuevosErrores.postulante =
      "El nombre del postulante es obligatorio.";
  }

  if (!formulario.tribunal1) {
    nuevosErrores.tribunal1 =
      "Seleccione el primer miembro del tribunal.";
  }

  if (!formulario.tribunal2) {
    nuevosErrores.tribunal2 =
      "Seleccione el segundo miembro del tribunal.";
  }

  if (!formulario.tutor) {
    nuevosErrores.tutor =
      "Seleccione el docente tutor.";
  }

  if (
    formulario.tribunal1 &&
    formulario.tribunal1 === formulario.tribunal2
  ) {
    nuevosErrores.tribunal2 =
      "Los dos miembros del tribunal deben ser diferentes.";
  }

  if (
    formulario.tutor &&
    (
      formulario.tutor === formulario.tribunal1 ||
      formulario.tutor === formulario.tribunal2
    )
  ) {
    nuevosErrores.tutor =
      "El docente tutor no puede ser también miembro del tribunal.";
  }

  if (!formulario.fecha) {
    nuevosErrores.fecha =
      "Seleccione la fecha de la defensa.";
  }

  if (!formulario.hora) {
    nuevosErrores.hora =
      "Seleccione la hora.";
  }

  if (!formulario.tema.trim()) {
    nuevosErrores.tema =
      "El nombre del proyecto es obligatorio.";
  }

  if (formulario.nota === "") {
    nuevosErrores.nota =
      "Ingrese la nota.";
  } else {
    const nota = Number(formulario.nota);

    if (
      Number.isNaN(nota) ||
      nota < 0 ||
      nota > 100
    ) {
      nuevosErrores.nota =
        "La nota debe estar entre 0 y 100.";
    }
  }

  setErrores(nuevosErrores);

  return Object.keys(nuevosErrores).length === 0;
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

    enlace.download =
      "acta-proyecto-grado.docx";

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
        <ActivarGeneradorPdf />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">

        {/* FORMULARIO */}

        <section className="rounded-xl bg-white p-6 shadow-sm">

          <h2 className="mb-6 text-lg font-semibold text-slate-800">
            Datos del acta
          </h2>

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
                Género
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

              <input
                type="text"
                value={presidente}
                disabled
                className="w-full rounded-lg border border-slate-200 bg-slate-100 px-4 py-2.5 text-slate-600"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Fecha
                </label>

                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="dd/mm/aaaa"
                  value={formulario.fecha}
                  onChange={(e) =>
                    cambiarCampo("fecha", e.target.value)
                  }
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
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
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
