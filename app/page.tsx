import Link from "next/link";

export default function Home() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">
          Sistema de Generación de Actas
        </h1>

        <p className="mt-2 text-slate-600">
          Seleccione el tipo de acta que desea generar.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        <Link
          href="/actas/proyecto-grado"
          className="rounded-xl bg-white p-6 shadow-sm transition hover:shadow-md"
        >
          <h2 className="text-lg font-semibold text-slate-800">
            Proyecto de Grado
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Generar actas de defensa pública de Proyecto de Grado.
          </p>
        </Link>

        <Link
          href="/actas/tesis"
          className="rounded-xl bg-white p-6 shadow-sm transition hover:shadow-md"
        >
          <h2 className="text-lg font-semibold text-slate-800">
            Tesis
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Generar actas de defensa de Tesis.
          </p>
        </Link>

        <Link
          href="/actas/examen-grado"
          className="rounded-xl bg-white p-6 shadow-sm transition hover:shadow-md"
        >
          <h2 className="text-lg font-semibold text-slate-800">
            Examen de Grado
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Generar actas de examen de grado.
          </p>
        </Link>

        <Link
          href="/actas/excelencia"
          className="rounded-xl bg-white p-6 shadow-sm transition hover:shadow-md"
        >
          <h2 className="text-lg font-semibold text-slate-800">
            Excelencia
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Generar actas de graduación por excelencia.
          </p>
        </Link>

        <Link
          href="/actas/trab-dirigido"
          className="rounded-xl bg-white p-6 shadow-sm transition hover:shadow-md"
        >
          <h2 className="text-lg font-semibold text-slate-800">
            Trabajo Dirigido
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Generar actas de defensa de Trabajo Dirigido.
          </p>
        </Link>

        <Link
          href="/admin"
          className="rounded-xl bg-slate-900 p-6 text-white shadow-sm transition hover:bg-slate-800"
        >
          <h2 className="text-lg font-semibold">
            Administración
          </h2>

          <p className="mt-2 text-sm text-slate-300">
            Gestionar docentes y configuración.
          </p>
        </Link>
      </div>
    </div>
  );
}
