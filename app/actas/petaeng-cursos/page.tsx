import FormularioPetaeng from "@/components/FormularioPetaeng";
import { cargarPresidentes } from "@/lib/presidentes-server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function CursosPetaengPage() {
  const { data: docentes, error } = await supabase.from("docentes").select("id, nombre").eq("activo", true).order("nombre");
  const { presidentes, presidente } = await cargarPresidentes();
  if (error) return <div className="p-8 text-red-600">Error al cargar docentes: {error.message}</div>;
  return <FormularioPetaeng modalidad="cursos" docentes={docentes ?? []} presidente={presidente} presidentes={presidentes.filter(item => item.activo)} />;
}
