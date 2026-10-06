import { supabase } from "@/lib/supabase";
import { cargarPresidentes } from "@/lib/presidentes-server";
import FormularioExcelencia from "./FormularioExcelencia";

export const dynamic = "force-dynamic";

export default async function ExcelenciaPage() {
  const { data: docentes, error } = await supabase
    .from("docentes")
    .select("id, nombre")
    .eq("activo", true)
    .order("nombre");

  const { presidentes, presidente } = await cargarPresidentes();

  if (error) {
    return (
      <div className="p-8 text-red-600">
        Error al cargar docentes: {error.message}
      </div>
    );
  }

  return (
    <FormularioExcelencia
      docentes={docentes ?? []}
      presidente={presidente}
      presidentes={presidentes.filter((p) => p.activo)}
    />
  );
}
