"use client";

import type { Presidente } from "@/lib/presidentes";

export default function SelectorPresidente({ presidentes, value, onChange }: {
  presidentes: Presidente[]; value: string; onChange: (nombre: string) => void;
}) {
  return (
    <select aria-label="Presidente del tribunal" value={value} onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border border-slate-300 px-4 py-2.5">
      <option value="">{presidentes.some((p) => p.activo) ? "Seleccione un presidente" : "No hay presidentes activos"}</option>
      {presidentes.filter((p) => p.activo).map((p) => <option key={p.id} value={p.nombre}>{p.nombre}</option>)}
    </select>
  );
}
