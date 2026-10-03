"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const opciones = [
  {
    nombre: "Inicio",
    ruta: "/",
  },
  {
    nombre: "Proyecto de Grado",
    ruta: "/actas/proyecto-grado",
  },
  {
    nombre: "Tesis",
    ruta: "/actas/tesis",
  },
  {
    nombre: "Examen de Grado",
    ruta: "/actas/examen-grado",
  },
  {
    nombre: "Excelencia",
    ruta: "/actas/excelencia",
  },
  {
    nombre: "Trabajo Dirigido",
    ruta: "/actas/trab-dirigido",
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 min-h-screen bg-slate-900 text-white p-5">
      <div className="mb-8">
        <h1 className="text-xl font-bold">
          Sistema de Actas
        </h1>

        <p className="text-sm text-slate-400 mt-1">
          Carrera de Turismo
        </p>
      </div>

      <nav className="space-y-2">
        {opciones.map((opcion) => {
          const activo = pathname === opcion.ruta;

          return (
            <Link
              key={opcion.nombre}
              href={opcion.ruta}
              className={`block rounded-lg px-4 py-3 transition ${
                activo
                  ? "bg-blue-600 text-white"
                  : "text-slate-300 hover:bg-slate-800"
              }`}
            >
              {opcion.nombre}
            </Link>
          );
        })}
      </nav>

      <div className="mt-10 border-t border-slate-700 pt-5">
        <Link
          href="/admin"
          className={`block rounded-lg px-4 py-3 ${
            pathname.startsWith("/admin")
              ? "bg-blue-600"
              : "text-slate-300 hover:bg-slate-800"
          }`}
        >
          Administración
        </Link>
      </div>
    </aside>
  );
}
