import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("docentes")
      .select("*")
      .order("nombre");

    if (error) {
      throw error;
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error obteniendo docentes:", error);

    return NextResponse.json(
      {
        error: "No se pudieron obtener los docentes",
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(
  request: NextRequest
) {
  try {
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
      .insert({
        nombre: nombre.trim(),
        area: typeof area === "string" && area.trim() ? area.trim() : null,
        asignatura: typeof asignatura === "string" && asignatura.trim() ? asignatura.trim() : null,
        activo: true,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(data, {
      status: 201,
    });
  } catch (error) {
    console.error("Error agregando docente:", error);

    return NextResponse.json(
      {
        error: "No se pudo agregar el docente",
      },
      {
        status: 500,
      }
    );
  }
}
