"use client";

import { useEffect, useState } from "react";
import type { Presidente } from "@/lib/presidentes";

export default function GestionPresidentes() {
  const [presidentes, setPresidentes] = useState<Presidente[]>([]);
  const [nombre, setNombre] = useState("");
  const [editando, setEditando] = useState<string | null>(null);
  const [nombreEditado, setNombreEditado] = useState("");
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    let vigente = true;
    async function cargar() {
      try {
        const respuesta = await fetch("/api/admin/configuracion", { cache: "no-store" });
        const datos = await respuesta.json();
        if (!respuesta.ok) throw new Error(datos.error);
        if (vigente) setPresidentes(datos.presidentes);
      } catch {
        if (vigente) setError("No se pudieron cargar los presidentes. Recargue la página para intentar nuevamente.");
      } finally {
        if (vigente) setCargando(false);
      }
    }
    void cargar();
    return () => { vigente = false; };
  }, []);

  async function guardar(method: "POST" | "PATCH", datos: { nombre?: string; id?: string; activo?: boolean }) {
    if (guardando || cargando) return;
    setGuardando(true);
    setError("");
    setMensaje("");
    try {
      const respuesta = await fetch("/api/admin/configuracion", {
        method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(datos),
      });
      const resultado = await respuesta.json();
      if (!respuesta.ok) throw new Error(resultado.error);
      setPresidentes(resultado.presidentes);
      if (method === "POST") setNombre("");
      setEditando(null);
      setMensaje(method === "POST" ? "Presidente agregado correctamente." : "Cambios guardados correctamente.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar el cambio.");
    } finally { setGuardando(false); }
  }

  return (
    <section className="mt-8 rounded-xl bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-slate-800">Gestión de presidentes del tribunal</h2>
        <p className="mt-1 text-sm text-slate-500">Agregue los presidentes que podrán seleccionarse en las actas.</p>
      </div>
      <form className="mb-8 flex flex-wrap gap-3" onSubmit={(e) => { e.preventDefault(); void guardar("POST", { nombre }); }}>
        <input aria-label="Nombre del nuevo presidente" required maxLength={200} value={nombre}
          onChange={(e) => setNombre(e.target.value)} disabled={guardando || cargando}
          placeholder="Ej. Mg. Tur. Juan Pérez"
          className="min-w-0 flex-1 rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500" />
        <button disabled={guardando || cargando} type="submit"
          className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700 disabled:opacity-50">
          {guardando && !editando ? "Guardando..." : "Agregar presidente"}
        </button>
      </form>
      {error && <p role="alert" className="mb-4 text-sm text-red-600">{error}</p>}
      {mensaje && <p role="status" className="mb-4 text-sm text-green-700">{mensaje}</p>}
      {cargando ? <p className="text-slate-500">Cargando presidentes...</p> : presidentes.length === 0 ?
        <p className="text-slate-500">No hay presidentes registrados.</p> : (
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full">
            <thead className="bg-slate-100"><tr>
              <th scope="col" className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Presidente del Tribunal</th>
              <th scope="col" className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Estado</th>
              <th scope="col" className="px-4 py-3 text-right text-sm font-semibold text-slate-700">Acciones</th>
            </tr></thead>
            <tbody>{presidentes.map((p) => (
              <tr key={p.id} className="border-t border-slate-200">
                <td className="px-4 py-3">{editando === p.id ? (
                  <input aria-label="Editar nombre del presidente" autoFocus maxLength={200} value={nombreEditado}
                    disabled={guardando} onChange={(e) => setNombreEditado(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void guardar("PATCH", { id: p.id, nombre: nombreEditado }); } }}
                    className="w-full rounded-lg border border-blue-400 px-3 py-2 outline-none" />
                ) : <span className="text-slate-700">{p.nombre}</span>}</td>
                <td className="px-4 py-3"><span className={`rounded-full px-3 py-1 text-sm ${p.activo ? "bg-green-100 text-green-700" : "bg-slate-200 text-slate-600"}`}>
                  {p.activo ? "Activo" : "Inactivo"}
                </span></td>
                <td className="px-4 py-3"><div className="flex justify-end gap-2">
                  {editando === p.id ? <>
                    <button type="button" disabled={guardando} onClick={() => guardar("PATCH", { id: p.id, nombre: nombreEditado })}
                      className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">Guardar</button>
                    <button type="button" disabled={guardando} onClick={() => setEditando(null)}
                      className="rounded-lg bg-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-300">Cancelar</button>
                  </> : <>
                    <button type="button" disabled={guardando} onClick={() => { setEditando(p.id); setNombreEditado(p.nombre); setMensaje(""); }}
                      className="rounded-lg border border-blue-600 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 disabled:opacity-50">Editar</button>
                    <button type="button" disabled={guardando} onClick={() => guardar("PATCH", { id: p.id, activo: !p.activo })}
                      className={`rounded-lg px-3 py-2 text-sm font-medium disabled:opacity-50 ${p.activo ? "bg-red-50 text-red-600 hover:bg-red-100" : "bg-green-50 text-green-700 hover:bg-green-100"}`}>
                      {p.activo ? "Desactivar" : "Activar"}
                    </button>
                  </>}
                </div></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </section>
  );
}
