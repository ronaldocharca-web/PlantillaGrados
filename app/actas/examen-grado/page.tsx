import { supabase } from "@/lib/supabase";
import { cargarPresidentes } from "@/lib/presidentes-server";
import FormularioExamenGrado from "./FormularioExamenGrado";

export const dynamic = "force-dynamic";

export default async function ExamenGradoPage() {
  const { data: docentes, error } = await supabase
    .from("docentes")
    .select("id, nombre, area")
    .eq("activo", true)
    .order("nombre");

  const { presidentes, presidente } = await cargarPresidentes();

  if (error) {
    return <div className="p-8 text-red-600">Error al cargar docentes: {error.message}</div>;
  }

  return (
    <FormularioExamenGrado
      docentes={docentes ?? []}
      presidente={presidente}
      presidentes={presidentes.filter((p) => p.activo)}
    />
  );
}
