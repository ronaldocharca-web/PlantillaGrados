import { supabase } from "@/lib/supabase";
import FormularioExamenGrado from "./FormularioExamenGrado";

export const dynamic = "force-dynamic";

export default async function ExamenGradoPage() {
  const { data: docentes, error } = await supabase
    .from("docentes")
    .select("id, nombre")
    .eq("activo", true)
    .order("nombre");

  const { data: presidente } = await supabase
    .from("configuracion")
    .select("valor")
    .eq("clave", "presidente_tribunal")
    .single();

  if (error) {
    return <div className="p-8 text-red-600">Error al cargar docentes: {error.message}</div>;
  }

  return (
    <FormularioExamenGrado
      docentes={docentes ?? []}
      presidente={presidente?.valor ?? ""}
    />
  );
}
