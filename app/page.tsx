import Link from "next/link";
import ManualUsuario from "@/components/ManualUsuario";

export default function Home() {
  return (
    <div className="dashboard-page home-dashboard p-8">
      <div className="dashboard-header mb-8">
        <div>
          <p className="eyebrow">Panel principal</p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-900">
            Sistema de Generación de Actas
          </h1>
          <p className="mt-3 text-base text-slate-500">
            Selecciona un tipo de acta para comenzar a trabajar.
          </p>
        </div>
        <div className="page-heading-actions">
          <ManualUsuario pantalla="inicio" />
          <div className="status-pill"><span /> Sistema activo</div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        <Link
          href="/actas/proyecto-grado"
          className="acta-card acta-blue group rounded-2xl p-6 transition"
        >
          <span className="card-code">PG</span>
          <h2 className="text-lg font-semibold text-slate-800">
            Proyecto de Grado
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Generar actas de defensa pública de Proyecto de Grado.
          </p>
        </Link>

        <Link
          href="/actas/tesis"
          className="acta-card acta-mint group rounded-2xl p-6 transition"
        >
          <span className="card-code">TE</span>
          <h2 className="text-lg font-semibold text-slate-800">
            Tesis
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Generar actas de defensa de Tesis.
          </p>
        </Link>

        <Link
          href="/actas/examen-grado"
          className="acta-card acta-amber group rounded-2xl p-6 transition"
        >
          <span className="card-code">EG</span>
          <h2 className="text-lg font-semibold text-slate-800">
            Examen de Grado
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Generar actas de examen de grado.
          </p>
        </Link>

        <Link
          href="/actas/excelencia"
          className="acta-card acta-violet group rounded-2xl p-6 transition"
        >
          <span className="card-code">EX</span>
          <h2 className="text-lg font-semibold text-slate-800">
            Excelencia
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Generar actas de graduación por excelencia.
          </p>
        </Link>

        <Link
          href="/actas/trab-dirigido"
          className="acta-card acta-rose group rounded-2xl p-6 transition"
        >
          <span className="card-code">TD</span>
          <h2 className="text-lg font-semibold text-slate-800">
            Trabajo Dirigido
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Generar actas de defensa de Trabajo Dirigido.
          </p>
        </Link>

        <Link href="/actas/maestria" className="acta-card acta-mint group rounded-2xl p-6 transition">
          <span className="card-code">MA</span>
          <h2 className="text-lg font-semibold text-slate-800">Maestría</h2>
          <p className="mt-2 text-sm text-slate-500">Generar actas de defensa de tesis de postgrado de Maestría.</p>
        </Link>

        <div className="col-span-full my-1 flex items-center gap-4" aria-label="Módulos PETAENG">
          <span className="h-px flex-1 bg-slate-500/50" />
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-slate-300">PETAENG</span>
          <span className="h-px flex-1 bg-slate-500/50" />
        </div>

        <Link href="/actas/petaeng-memoria-laboral" className="acta-card acta-rose group rounded-2xl p-6 transition">
          <span className="card-code">ML</span>
          <h2 className="text-lg font-semibold text-slate-800">Defensa de Memoria Laboral</h2>
          <p className="mt-2 text-sm text-slate-500">Generar el acta de defensa pública de Memoria Laboral PETAENG.</p>
        </Link>

        <Link href="/actas/petaeng-cursos" className="acta-card acta-amber group rounded-2xl p-6 transition">
          <span className="card-code">CU</span>
          <h2 className="text-lg font-semibold text-slate-800">Conformidad de Cursos</h2>
          <p className="mt-2 text-sm text-slate-500">Generar el acta de conformidad de Cursos PETAENG.</p>
        </Link>

        <div className="col-span-full my-1 flex items-center gap-4" aria-label="Herramientas del sistema">
          <span className="h-px flex-1 bg-slate-500/50" />
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-slate-300">Herramientas</span>
          <span className="h-px flex-1 bg-slate-500/50" />
        </div>

        <Link href="/sorteo-docentes" className="acta-card acta-blue group rounded-2xl p-6 transition">
          <span className="card-code">SO</span>
          <h2 className="text-lg font-semibold text-slate-800">Sorteo de docentes</h2>
          <p className="mt-2 text-sm text-slate-500">Asignar números al azar por área y descargar el resultado en PDF.</p>
        </Link>

        <Link
          href="/admin"
          className="acta-card admin-card rounded-2xl p-6 text-white transition"
        >
          <span className="card-code">AD</span>
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
