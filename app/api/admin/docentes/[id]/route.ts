import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

type Contexto = {
  params: Promise<{
    id: string;
  }>;
};

export async function PUT(
  request: NextRequest,
  contexto: Contexto
) {
  try {
    const { id } = await contexto.params;
    const { nombre, area, asignatura } = await request.json();

    if (!nombre || !nombre.trim()) {
      return NextResponse.json(
        {
          error: "El nombre es obligatorio",
        },
        {
          status: 400,
        }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("docentes")
      .update({
        nombre: nombre.trim(),
        area: typeof area === "string" && area.trim() ? area.trim() : null,
        asignatura: typeof asignatura === "string" && asignatura.trim() ? asignatura.trim() : null,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error(
      "Error actualizando docente:",
      error
    );

    return NextResponse.json(
      {
        error: "No se pudo actualizar el docente",
      },
      {
        status: 500,
      }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  contexto: Contexto
) {
  try {
    const { id } = await contexto.params;
    const { activo } = await request.json();

    if (typeof activo !== "boolean") {
      return NextResponse.json(
        {
          error: "El estado enviado no es válido",
        },
        {
          status: 400,
        }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("docentes")
      .update({
        activo,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error(
      "Error cambiando estado del docente:",
      error
    );

    return NextResponse.json(
      {
        error:
          "No se pudo cambiar el estado del docente",
      },
      {
        status: 500,
      }
    );
  }
}
