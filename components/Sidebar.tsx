"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

type IconName = "home" | "document" | "thesis" | "exam" | "sparkles" | "work" | "raffle" | "settings";

function SidebarIcon({ name }: { name: IconName }) {
  const paths: Record<IconName, React.ReactNode> = {
    home: <path d="m3 10 5-5 5 5v6H9v-4H7v4H3z" />,
    document: <><rect x="4" y="3" width="8" height="10" rx="1" /><path d="M6 6h4M6 9h4" /></>,
    thesis: <><path d="M2 5.5 8 3l6 2.5L8 8z" /><path d="M4 7v3c2 1.5 6 1.5 8 0V7M8 8v4" /></>,
    exam: <><rect x="3" y="3" width="10" height="10" rx="2" /><path d="M6 6h4v4H6zM8 4v2M8 10v2" /></>,
    sparkles: <><path d="m8 2 .7 3.3L12 6l-3.3.7L8 10l-.7-3.3L4 6l3.3-.7z" /><path d="m12 10 .4 1.6L14 12l-1.6.4L12 14l-.4-1.6L10 12l1.6-.4z" /></>,
    work: <><path d="M2.5 7.5 5 5l3 3 3-3 2.5 2.5" /><path d="M3 8v4h10V8M6 10h4" /></>,
    raffle: <><rect x="2.5" y="2.5" width="11" height="11" rx="2" /><circle cx="5.5" cy="5.5" r=".7" fill="currentColor" stroke="none" /><circle cx="10.5" cy="5.5" r=".7" fill="currentColor" stroke="none" /><circle cx="8" cy="8" r=".7" fill="currentColor" stroke="none" /><circle cx="5.5" cy="10.5" r=".7" fill="currentColor" stroke="none" /><circle cx="10.5" cy="10.5" r=".7" fill="currentColor" stroke="none" /></>,
    settings: <><circle cx="8" cy="8" r="2.2" /><path d="M8 2v2M8 12v2M2 8h2M12 8h2M3.8 3.8l1.4 1.4M10.8 10.8l1.4 1.4M12.2 3.8l-1.4 1.4M5.2 10.8l-1.4 1.4" /></>,
  };

  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className="sidebar-svg" fill="none" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round">
      {paths[name]}
    </svg>
  );
}

const opciones: Array<{ nombre: string; ruta: string; icono: IconName }> = [
  {
    nombre: "Inicio",
    ruta: "/",
    icono: "home",
  },
  {
    nombre: "Acta de Proyecto de Grado",
    ruta: "/actas/proyecto-grado",
    icono: "document",
  },
  {
    nombre: "Acta de Tesis",
    ruta: "/actas/tesis",
    icono: "thesis",
  },
  {
    nombre: "Acta de Examen de Grado",
    ruta: "/actas/examen-grado",
    icono: "exam",
  },
  {
    nombre: "Acta de Excelencia",
    ruta: "/actas/excelencia",
    icono: "sparkles",
  },
  {
    nombre: "Acta de Trabajo Dirigido",
    ruta: "/actas/trab-dirigido",
    icono: "work",
  },
  { nombre: "Acta de Maestría", ruta: "/actas/maestria", icono: "thesis" },
  { nombre: "Sorteo de docentes", ruta: "/sorteo-docentes", icono: "raffle" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [contraida, setContraida] = useState(false);

  return (
    <aside className={`app-sidebar w-64 min-h-screen text-white p-5 ${contraida ? "sidebar-collapsed" : ""}`}>
      <button
        type="button"
        className="sidebar-toggle"
        onClick={() => setContraida((valor) => !valor)}
        aria-label={contraida ? "Mostrar menú lateral" : "Ocultar menú lateral"}
        aria-expanded={!contraida}
        title={contraida ? "Mostrar menú" : "Ocultar menú"}
      >
        <svg viewBox="0 0 20 20" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="m12.5 4.5-5 5 5 5" />
        </svg>
      </button>

      <div className="sidebar-brand-block mb-9 px-2">
        <div className="flex items-center gap-3">
          <div className="brand-mark">A</div>
          <div className="sidebar-brand-copy">
            <h1 className="text-xl font-bold tracking-tight">
              Sistema de Actas
            </h1>
            <p className="text-xs text-slate-400">Gestión académica</p>
          </div>
        </div>

        <p className="sidebar-career mt-3 text-sm text-slate-400">Carrera de Turismo</p>
      </div>

      <nav className="sidebar-navigation space-y-1.5" aria-label="Navegación principal">
        {opciones.map((opcion) => {
          const activo = pathname === opcion.ruta;

          return (
            <Link
              key={opcion.nombre}
              href={opcion.ruta}
              aria-label={opcion.nombre}
              title={contraida ? opcion.nombre : undefined}
              className={`sidebar-link block rounded-xl px-4 py-3 transition ${
                activo
                  ? "bg-blue-600 text-white"
                  : "text-slate-300 hover:bg-slate-800"
              }`}
            >
              <span className="sidebar-item-content">
                <span className="sidebar-icon"><SidebarIcon name={opcion.icono} /></span>
                <span className="sidebar-label">{opcion.nombre}</span>
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-admin-section mt-10 border-t border-slate-700 pt-5">
        <Link
          href="/admin"
          aria-label="Administración"
          title={contraida ? "Administración" : undefined}
          className={`sidebar-link block rounded-xl px-4 py-3 ${
            pathname.startsWith("/admin")
              ? "bg-blue-600"
              : "text-slate-300 hover:bg-slate-800"
          }`}
        >
          <span className="sidebar-item-content">
            <span className="sidebar-icon"><SidebarIcon name="settings" /></span>
            <span className="sidebar-label">Administración</span>
          </span>
        </Link>
      </div>
    </aside>
  );
}
