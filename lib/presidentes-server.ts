import "server-only";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { ErrorPresidentes, leerPresidentes, type Presidente } from "@/lib/presidentes";

const CLAVE = "presidentes_tribunal";

export async function cargarPresidentes() {
  const { data, error } = await supabaseAdmin.from("configuracion")
    .select("id, clave, valor").in("clave", [CLAVE, "presidente_tribunal"]);
  if (error) throw error;
  const fila = data?.find((p) => p.clave === CLAVE);
  const anterior = data?.find((p) => p.clave === "presidente_tribunal")?.valor ?? "";
  const presidentes = leerPresidentes(fila?.valor ?? null, anterior);
  return { fila, presidentes, presidente: presidentes.find((p) => p.activo && p.nombre === anterior)?.nombre ?? "" };
}

export async function persistirPresidentes(estado: Awaited<ReturnType<typeof cargarPresidentes>>, presidentes: Presidente[]) {
  const valor = JSON.stringify(presidentes);
  if (estado.fila) {
    // Detecta cambios simultáneos antes de sustituir la lista completa.
    let consulta = supabaseAdmin.from("configuracion").update({ valor }).eq("id", estado.fila.id);
    consulta = estado.fila.valor === null ? consulta.is("valor", null) : consulta.eq("valor", estado.fila.valor);
    const { data, error } = await consulta.select("id");
    if (error) throw error;
    if (!data?.length) throw new ErrorPresidentes("La lista cambió. Recargue e intente nuevamente.", 409);
  } else {
    const { error } = await supabaseAdmin.from("configuracion").insert({ clave: CLAVE, valor });
    if (error) throw error;
  }
}
