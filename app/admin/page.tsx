"use client";

import { useEffect, useState } from "react";
import ManualUsuario from "@/components/ManualUsuario";

type Docente = {
  id: number;
  nombre: string;
  activo: boolean;
  created_at: string;
};

export default function AdminPage() {
  const [docentes, setDocentes] = useState<Docente[]>([]);
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [editandoId, setEditandoId] =
  useState<number | null>(null);

const [nombreEditado, setNombreEditado] =
  useState("");

  const [presidente, setPresidente] =
  useState("");

const [guardandoPresidente, setGuardandoPresidente] =
  useState(false);

const [mensajePresidente, setMensajePresidente] =
  useState("");

  function comenzarEdicion(docente: Docente) {
  setEditandoId(docente.id);
  setNombreEditado(docente.nombre);
}

function cancelarEdicion() {
  setEditandoId(null);
  setNombreEditado("");
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
  cargarConfiguracion();
}, []);

    async function guardarPresidente() {
  if (!presidente.trim()) {
    alert(
      "Ingrese el nombre del presidente del tribunal."
    );
    return;
  }

  try {
    setGuardandoPresidente(true);
    setMensajePresidente("");

    const respuesta = await fetch(
      "/api/admin/configuracion",
      {
        method: "PUT",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          presidente,
        }),
      }
    );

    const datos = await respuesta.json();

    if (!respuesta.ok) {
      throw new Error(
        datos.error ||
          "No se pudo guardar el presidente"
      );
    }

    setPresidente(datos.presidente);

    setMensajePresidente(
      "Presidente actualizado correctamente."
    );
  } catch (error) {
    console.error(error);

    if (error instanceof Error) {
      alert(error.message);
    }
  } finally {
    setGuardandoPresidente(false);
  }
}

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

  async function cargarConfiguracion() {
  try {
    const respuesta = await fetch(
      "/api/admin/configuracion"
    );

    const datos = await respuesta.json();

    if (!respuesta.ok) {
      throw new Error(
        datos.error ||
          "No se pudo cargar la configuración"
      );
    }

    setPresidente(
      datos.presidente ?? ""
    );
  } catch (error) {
    console.error(error);
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

        

        <div className="mb-8 flex gap-3">
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
          <div className="overflow-hidden rounded-lg border border-slate-200">

            <table className="w-full">
              <thead className="bg-slate-100">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                    Docente
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

      <section className="mt-8 rounded-xl bg-white p-6 shadow-sm">
  <div className="mb-6">
    <h2 className="text-xl font-semibold text-slate-800">
      Configuración del tribunal
    </h2>

    <p className="mt-1 text-sm text-slate-500">
      Configure el presidente que aparecerá
      automáticamente en las actas.
    </p>
  </div>

  <div className="max-w-2xl">
    <label className="mb-2 block text-sm font-medium text-slate-700">
      Presidente del Tribunal
    </label>

    <div className="flex gap-3">
      <input
        type="text"
        value={presidente}
        onChange={(e) => {
          setPresidente(e.target.value);
          setMensajePresidente("");
        }}
        className="flex-1 rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
        placeholder="Nombre completo del presidente"
      />

      <button
        type="button"
        onClick={guardarPresidente}
        disabled={guardandoPresidente}
        className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {guardandoPresidente
          ? "Guardando..."
          : "Guardar"}
      </button>
    </div>

    {mensajePresidente && (
      <p className="mt-3 text-sm font-medium text-green-600">
        {mensajePresidente}
      </p>
    )}
  </div>
</section>
    </div>
  );
}
