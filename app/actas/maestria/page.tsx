import { supabase } from "@/lib/supabase";
import { cargarPresidentes } from "@/lib/presidentes-server";
import FormularioMaestria from "./FormularioMaestria";

export const dynamic = "force-dynamic";

export default async function MaestriaPage() {
  const [{ data: docentes, error }, { presidentes, presidente }] = await Promise.all([
    supabase.from("docentes").select("id, nombre").eq("activo", true).order("nombre"),
    cargarPresidentes(),
  ]);
  if (error) return <div className="p-8"><p className="text-red-600">No se pudieron cargar los docentes. Recargue la página e intente nuevamente.</p></div>;
  return <FormularioMaestria docentes={docentes ?? []} presidentes={presidentes.filter(p => p.activo)} presidente={presidente} />;
}
