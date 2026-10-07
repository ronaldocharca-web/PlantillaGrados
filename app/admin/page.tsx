"use client";

import { useEffect, useState } from "react";
import ManualUsuario from "@/components/ManualUsuario";
import GestionPresidentes from "@/components/GestionPresidentes";

type Docente = {
  id: number;
  nombre: string;
  area: string | null;
  asignatura: string | null;
  activo: boolean;
  created_at: string;
};

export default function AdminPage() {
  const [docentes, setDocentes] = useState<Docente[]>([]);
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevaArea, setNuevaArea] = useState("");
  const [nuevaAsignatura, setNuevaAsignatura] = useState("");
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [editandoId, setEditandoId] =
  useState<number | null>(null);

const [nombreEditado, setNombreEditado] =
  useState("");
const [areaEditada, setAreaEditada] = useState("");
const [asignaturaEditada, setAsignaturaEditada] = useState("");

  function comenzarEdicion(docente: Docente) {
  setEditandoId(docente.id);
  setNombreEditado(docente.nombre);
  setAreaEditada(docente.area ?? "");
  setAsignaturaEditada(docente.asignatura ?? "");
}

function cancelarEdicion() {
  setEditandoId(null);
  setNombreEditado("");
  setAreaEditada("");
  setAsignaturaEditada("");
}

async function guardarEdicion(id: number) {
  if (!nombreEditado.trim()) {
    alert("El nombre no puede estar vacío.");
    return;
  }

  try {
    const respuesta = await fetch(
      `/api/admin/docentes/${id}`,
      {
        method: "PUT",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          nombre: nombreEditado,
          area: areaEditada,
          asignatura: asignaturaEditada,
        }),
      }
    );

    const datos = await respuesta.json();

    if (!respuesta.ok) {
      throw new Error(
        datos.error ||
          "No se pudo actualizar el docente"
      );
    }

    setEditandoId(null);
    setNombreEditado("");
    setAreaEditada("");
    setAsignaturaEditada("");

    await cargarDocentes();
  } catch (error) {
    console.error(error);

    if (error instanceof Error) {
      alert(error.message);
    }
  }
}

async function cambiarEstado(
  id: number,
  estadoActual: boolean
) {
  try {
    const respuesta = await fetch(
      `/api/admin/docentes/${id}`,
      {
        method: "PATCH",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          activo: !estadoActual,
        }),
      }
    );

    const datos = await respuesta.json();

    if (!respuesta.ok) {
      throw new Error(
        datos.error ||
          "No se pudo cambiar el estado"
      );
    }

    await cargarDocentes();
  } catch (error) {
    console.error(error);

    if (error instanceof Error) {
      alert(error.message);
    }
  }
}

  async function cargarDocentes() {
    try {
      const respuesta = await fetch(
        "/api/admin/docentes"
      );

      if (!respuesta.ok) {
        throw new Error(
          "No se pudieron cargar los docentes"
        );
      }

      const datos = await respuesta.json();

      setDocentes(datos);
    } catch (error) {
      console.error(error);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
  cargarDocentes();
}, []);

  async function agregarDocente() {
    if (!nuevoNombre.trim()) {
      alert("Ingrese el nombre del docente.");
      return;
    }

    try {
      setGuardando(true);

      const respuesta = await fetch(
        "/api/admin/docentes",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            nombre: nuevoNombre,
            area: nuevaArea,
            asignatura: nuevaAsignatura,
          }),
        }
      );

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          datos.error ||
            "No se pudo agregar el docente"
        );
      }

      setNuevoNombre("");
      setNuevaArea("");
      setNuevaAsignatura("");

      await cargarDocentes();
    } catch (error) {
      console.error(error);

      if (error instanceof Error) {
        alert(error.message);
      }
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
        <h1 className="text-3xl font-bold text-slate-800">
          Administración
        </h1>

        <p className="mt-2 text-slate-600">
          Gestión de docentes y configuración del sistema.
        </p>
        </div>
        <ManualUsuario pantalla="admin" />
      </div>

      <section className="rounded-xl bg-white p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-slate-800">
            Gestión de docentes
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Agregue los docentes que podrán seleccionarse
            en las actas.
          </p>
        </div>

        

        <div className="mb-8 grid gap-3 lg:grid-cols-[2fr_1fr_1fr_auto]">
          <input
            type="text"
            value={nuevoNombre}
            onChange={(e) =>
              setNuevoNombre(e.target.value)
            }
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                agregarDocente();
              }
            }}
            placeholder="Ej. M. Sc. Ana María Pérez"
            className="flex-1 rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
          />

          <input
            type="text"
            value={nuevaArea}
            onChange={(e) => setNuevaArea(e.target.value)}
            placeholder="Área"
            aria-label="Área del docente"
            className="rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
          />

          <input
            type="text"
            value={nuevaAsignatura}
            onChange={(e) => setNuevaAsignatura(e.target.value)}
            placeholder="Asignatura"
            aria-label="Asignatura del docente"
            className="rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
          />

          <button
            type="button"
            onClick={agregarDocente}
            disabled={guardando}
            className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {guardando
              ? "Guardando..."
              : "Agregar docente"}
          </button>
        </div>

        {cargando ? (
          <p className="text-slate-500">
            Cargando docentes...
          </p>
        ) : docentes.length === 0 ? (
          <p className="text-slate-500">
            No hay docentes registrados.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-slate-200">

            <table className="w-full min-w-[850px]">
              <thead className="bg-slate-100">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                    Docente
                  </th>

                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                    Área
                  </th>

                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                    Asignatura
                  </th>

                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                    Estado
                  </th>

                  <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">
  Acciones
</th>
                </tr>
              </thead>

              <tbody>
  {docentes.map((docente) => (
    <tr
      key={docente.id}
      className="border-t border-slate-200"
    >
      <td className="px-4 py-3">
        {editandoId === docente.id ? (
          <input
            type="text"
            value={nombreEditado}
            onChange={(e) =>
              setNombreEditado(e.target.value)
            }
            className="w-full rounded-lg border border-blue-400 px-3 py-2 outline-none"
          />
        ) : (
          <span className="text-slate-700">
            {docente.nombre}
          </span>
        )}
      </td>

      <td className="px-4 py-3">
        {editandoId === docente.id ? (
          <input
            type="text"
            value={areaEditada}
            onChange={(e) => setAreaEditada(e.target.value)}
            aria-label={`Área de ${docente.nombre}`}
            className="w-full rounded-lg border border-blue-400 px-3 py-2 outline-none"
          />
        ) : (
          <span className="text-slate-700">{docente.area || "—"}</span>
        )}
      </td>

      <td className="px-4 py-3">
        {editandoId === docente.id ? (
          <input
            type="text"
            value={asignaturaEditada}
            onChange={(e) => setAsignaturaEditada(e.target.value)}
            aria-label={`Asignatura de ${docente.nombre}`}
            className="w-full rounded-lg border border-blue-400 px-3 py-2 outline-none"
          />
        ) : (
          <span className="text-slate-700">{docente.asignatura || "—"}</span>
        )}
      </td>

      <td className="px-4 py-3">
        {docente.activo ? (
          <span className="rounded-full bg-green-100 px-3 py-1 text-sm text-green-700">
            Activo
          </span>
        ) : (
          <span className="rounded-full bg-slate-200 px-3 py-1 text-sm text-slate-600">
            Inactivo
          </span>
        )}
      </td>

      <td className="px-4 py-3">
        <div className="flex justify-end gap-2">

          {editandoId === docente.id ? (
            <>
              <button
                type="button"
                onClick={() =>
                  guardarEdicion(docente.id)
                }
                className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Guardar
              </button>

              <button
                type="button"
                onClick={cancelarEdicion}
                className="rounded-lg bg-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-300"
              >
                Cancelar
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() =>
                  comenzarEdicion(docente)
                }
                className="rounded-lg border border-blue-600 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50"
              >
                Editar
              </button>

              <button
                type="button"
                onClick={() =>
                  cambiarEstado(
                    docente.id,
                    docente.activo
                  )
                }
                className={`rounded-lg px-3 py-2 text-sm font-medium ${
                  docente.activo
                    ? "bg-red-50 text-red-600 hover:bg-red-100"
                    : "bg-green-50 text-green-700 hover:bg-green-100"
                }`}
              >
                {docente.activo
                  ? "Desactivar"
                  : "Activar"}
              </button>
            </>
          )}

        </div>
      </td>
    </tr>
  ))}
</tbody>
            </table>

          </div>
        )}
      </section>

      <GestionPresidentes />
    </div>
  );
}
