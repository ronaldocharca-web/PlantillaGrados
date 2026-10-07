import SorteoDocentes from "./SorteoDocentes";
import { supabase } from "@/lib/supabase";
import type { DocenteSorteo } from "@/lib/sorteo-data";

export const dynamic = "force-dynamic";

export default async function SorteoDocentesPage() {
  const { data, error } = await supabase
    .from("docentes")
    .select("id,nombre,area")
    .eq("activo", true)
    .order("nombre");

  if (error) {
    return (
      <main className="p-8">
        <section className="mx-auto max-w-3xl rounded-3xl border border-red-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-bold uppercase tracking-widest text-red-600">No se pudo abrir el módulo</p>
          <h1 className="mt-3 text-3xl font-black text-slate-900">Sorteo de docentes</h1>
          <p className="mt-4 text-slate-600">No fue posible cargar los docentes desde la base de datos. Recarga la página o revisa la conexión con Supabase.</p>
          <p className="mt-3 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error.message}</p>
        </section>
      </main>
    );
  }

  return <SorteoDocentes docentes={(data ?? []) as DocenteSorteo[]} />;
}
