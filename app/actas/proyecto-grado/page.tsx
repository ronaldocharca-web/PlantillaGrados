import { supabase } from "@/lib/supabase";
import { cargarPresidentes } from "@/lib/presidentes-server";
import FormularioProyectoGrado from "./FormularioProyectoGrado";

export const dynamic = "force-dynamic";

export default async function ProyectoGradoPage() {
  const { data: docentes, error } = await supabase
    .from("docentes")
    .select("id, nombre")
    .eq("activo", true)
    .order("nombre");

  const { presidentes, presidente } = await cargarPresidentes();

  if (error) {
    return (
      <div className="p-8">
        <p className="text-red-600">
          Error al cargar docentes: {error.message}
        </p>
      </div>
    );
  }

  return (
    <FormularioProyectoGrado
      docentes={docentes ?? []}
      presidente={presidente}
      presidentes={presidentes.filter((p) => p.activo)}
    />
  );
}
