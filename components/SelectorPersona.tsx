"use client";

import { useId, useRef, useState } from "react";

type Props = {
  personas: { nombre: string }[];
  label: string;
  value: string;
  onChange: (nombre: string) => void;
  placeholder?: string;
  id?: string;
  required?: boolean;
  invalid?: boolean;
};

function normalizar(texto: string) {
  return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es").trim();
}

/** Cada selector mantiene su búsqueda sin modificar el nombre elegido para el acta. */
export default function SelectorPersona({ personas, label, value, onChange, placeholder = "Seleccione un docente", id, required, invalid }: Props) {
  const [busqueda, setBusqueda] = useState("");
  const [abierto, setAbierto] = useState(false);
  const [activo, setActivo] = useState(-1);
  const listaRef = useRef<HTMLDivElement>(null);
  const identificador = useId();
  const selectorId = id ?? `${identificador}-seleccion`;
  const estadoId = `${identificador}-resultados`;
  const listaId = `${identificador}-opciones`;
  const palabras = normalizar(busqueda).split(/\s+/).filter(Boolean);
  const nombres = [...new Set(personas.map(persona => persona.nombre))];
  const coincidencias = nombres.filter(nombre => palabras.every(palabra => normalizar(nombre).includes(palabra)));
  const conservarSeleccion = value !== "" && !coincidencias.includes(value);

  function elegir(nombre: string) {
    onChange(nombre);
    setBusqueda("");
    setAbierto(false);
    setActivo(-1);
  }

  function moverOpcion(direccion: number) {
    setAbierto(true);
    if (!coincidencias.length) return;
    const siguiente = activo < 0
      ? (direccion > 0 ? 0 : coincidencias.length - 1)
      : (activo + direccion + coincidencias.length) % coincidencias.length;
    setActivo(siguiente);
    listaRef.current?.children[siguiente]?.scrollIntoView({ block: "nearest" });
  }

  return <div className="space-y-2">
    <div className="relative">
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"
        className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400">
        <circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 4.5 4.5" />
      </svg>
      <input type="search" role="combobox" value={busqueda}
        onChange={evento => { setBusqueda(evento.target.value); setAbierto(true); setActivo(-1); }}
        onFocus={() => { if (busqueda.trim()) setAbierto(true); }}
        onBlur={() => { setAbierto(false); setActivo(-1); }}
        aria-label={`Buscar: ${label}`} aria-controls={listaId} aria-expanded={abierto} aria-autocomplete="list"
        aria-activedescendant={abierto && coincidencias[activo] ? `${listaId}-${activo}` : undefined}
        aria-describedby={palabras.length ? estadoId : undefined}
        placeholder="Buscar por nombre o apellido…" autoComplete="off"
        onKeyDown={evento => {
          if (evento.key === "ArrowDown" || evento.key === "ArrowUp") {
            evento.preventDefault();
            moverOpcion(evento.key === "ArrowDown" ? 1 : -1);
          } else if (evento.key === "Enter") {
            evento.preventDefault();
            if (abierto && coincidencias[activo]) elegir(coincidencias[activo]);
          } else if (evento.key === "Escape") {
            evento.preventDefault();
            setAbierto(false);
            setActivo(-1);
          }
        }}
        className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-4 text-slate-800 outline-none focus:border-violet-500" />
      {abierto && <div className="absolute inset-x-0 top-full z-30 mt-1 overflow-hidden rounded-xl border border-slate-300 bg-white shadow-xl">
        <div id={listaId} ref={listaRef} role="listbox" aria-label={`Resultados: ${label}`} className="max-h-64 overflow-y-auto">
          {coincidencias.map((nombre, indice) => <button key={nombre} id={`${listaId}-${indice}`}
            type="button" role="option" aria-selected={value === nombre} tabIndex={-1}
            onMouseDown={evento => evento.preventDefault()} onClick={() => elegir(nombre)}
            className={`block w-full border-b border-slate-100 px-4 py-3 text-left text-sm text-slate-800 last:border-b-0 hover:bg-violet-100 ${activo === indice ? "bg-violet-100" : "bg-white"}`}>
            {nombre}
          </button>)}
        </div>
        {!coincidencias.length && <p className="px-4 py-3 text-sm text-slate-500">No se encontraron coincidencias.</p>}
      </div>}
    </div>
    <select id={selectorId} aria-label={label} required={required} aria-invalid={invalid}
      value={value} onChange={evento => onChange(evento.target.value)}
      className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 outline-none focus:border-violet-500">
      <option value="">{placeholder}</option>
      {conservarSeleccion && <optgroup label="Selección actual"><option value={value}>{value}</option></optgroup>}
      {coincidencias.map(nombre => <option key={nombre} value={nombre}>{nombre}</option>)}
    </select>
    {palabras.length > 0 && <p id={estadoId} role="status" aria-live="polite" className="text-xs text-slate-500">
      {coincidencias.length ? `${coincidencias.length} coincidencia${coincidencias.length === 1 ? "" : "s"}. Seleccione un resultado o use las flechas y Enter.` : "No se encontraron coincidencias. Pruebe otro nombre o apellido."}
      {conservarSeleccion ? " Se conserva la selección actual." : ""}
    </p>}
  </div>;
}
