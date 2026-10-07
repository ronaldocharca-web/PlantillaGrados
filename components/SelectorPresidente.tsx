"use client";

import type { Presidente } from "@/lib/presidentes";
import SelectorPersona from "@/components/SelectorPersona";

export default function SelectorPresidente({ presidentes, value, onChange }: {
  presidentes: Presidente[]; value: string; onChange: (nombre: string) => void;
}) {
  return (
    <SelectorPersona personas={presidentes.filter(p => p.activo)} label="Presidente del tribunal"
      value={value} onChange={onChange}
      placeholder={presidentes.some(p => p.activo) ? "Seleccione un presidente" : "No hay presidentes activos"} />
  );
}
