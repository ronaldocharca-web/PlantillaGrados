"use client";

import { useMemo, useRef, useState } from "react";
import ActivarGeneradorPdf from "@/components/ActivarGeneradorPdf";
import ManualUsuario from "@/components/ManualUsuario";
import { areasDeDocente, type DocenteSorteo, type ResultadoSorteo } from "@/lib/sorteo-data";

type Props = { docentes: DocenteSorteo[] };

function normalizarNombre(nombre: string) {
  return nombre.trim().replace(/\s+/g, " ").toLocaleLowerCase("es");
}

function indiceAleatorio(maximoExclusivo: number) {
  // Descarta valores fuera del rango uniforme para evitar sesgo al repartir números.
  const limite = Math.floor(0x100000000 / maximoExclusivo) * maximoExclusivo;
  const valor = new Uint32Array(1);
  do crypto.getRandomValues(valor); while (valor[0] >= limite);
  return valor[0] % maximoExclusivo;
}

function mezclar<T>(valores: T[]) {
  const copia = [...valores];
  for (let indice = copia.length - 1; indice > 0; indice -= 1) {
    const destino = indiceAleatorio(indice + 1);
    [copia[indice], copia[destino]] = [copia[destino], copia[indice]];
  }
  return copia;
}

function esperar(milisegundos: number) {
  return new Promise<void>((resolver) => setTimeout(resolver, milisegundos));
}

function descargarBlob(blob: Blob, nombre: string) {
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = nombre;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function SorteoDocentes({ docentes }: Props) {
  // Un mismo nombre puede llegar en varias filas, una por cada área asignada.
  const docentesUnicos = useMemo(() => {
    const unicos = new Map<string, DocenteSorteo>();
    for (const docente of docentes) {
      const clave = normalizarNombre(docente.nombre);
      const existente = unicos.get(clave);
      if (!existente) {
        unicos.set(clave, { ...docente, nombre: docente.nombre.trim().replace(/\s+/g, " ") });
        continue;
      }
      const areas = new Set([...areasDeDocente(existente.area), ...areasDeDocente(docente.area)]);
      existente.area = [...areas].join("; ");
    }
    return [...unicos.values()];
  }, [docentes]);

  const areas = useMemo(() => {
    const valores = new Set(docentesUnicos.flatMap((docente) => areasDeDocente(docente.area)));
    return [...valores].sort((a, b) => a.localeCompare(b, "es"));
  }, [docentesUnicos]);

  const [area, setArea] = useState("");
  const [intervaloInicio, setIntervaloInicio] = useState(1);
  const [intervaloFin, setIntervaloFin] = useState(9);
  const [maximoAreas, setMaximoAreas] = useState(2);
  const [exigirCantidadExacta, setExigirCantidadExacta] = useState(true);
  const [ordenarResultados, setOrdenarResultados] = useState(true);
  const [resultados, setResultados] = useState<ResultadoSorteo[]>([]);
  const [sorteando, setSorteando] = useState(false);
  const [numeroAnimado, setNumeroAnimado] = useState<number | null>(null);
  const [numerosDisponibles, setNumerosDisponibles] = useState<number[]>([]);
  const [docenteIluminadoId, setDocenteIluminadoId] = useState<number | null>(null);
  const [docenteGanadorId, setDocenteGanadorId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [generandoPdf, setGenerandoPdf] = useState(false);
  const ejecutando = useRef(false);

  const docentesDelArea = useMemo(
    () => docentesUnicos.filter((docente) => areasDeDocente(docente.area).includes(area)),
    [area, docentesUnicos],
  );

  const participaciones = useMemo(() => {
    // Cuenta áreas diferentes ya sorteadas, no la cantidad de números recibidos.
    const conteo = new Map<string, Set<string>>();
    for (const resultado of resultados) {
      const clave = normalizarNombre(resultado.docente);
      const areasDocente = conteo.get(clave) ?? new Set<string>();
      areasDocente.add(resultado.area);
      conteo.set(clave, areasDocente);
    }
    return conteo;
  }, [resultados]);

  const elegibles = useMemo(() => docentesDelArea.filter((docente) => {
    const otrasAreas = new Set(participaciones.get(normalizarNombre(docente.nombre)) ?? []);
    otrasAreas.delete(area);
    return otrasAreas.size < maximoAreas;
  }), [area, docentesDelArea, maximoAreas, participaciones]);

  const bloqueados = useMemo(() => {
    const idsElegibles = new Set(elegibles.map((docente) => docente.id));
    return docentesDelArea.filter((docente) => !idsElegibles.has(docente.id));
  }, [docentesDelArea, elegibles]);

  const idsBloqueados = useMemo(
    () => new Set(bloqueados.map((docente) => docente.id)),
    [bloqueados],
  );

  const resultadoArea = useMemo(() => {
    const resultadosDelArea = resultados.filter((resultado) => resultado.area === area);
    return ordenarResultados ? resultadosDelArea.sort((a, b) => a.numero - b.numero) : resultadosDelArea;
  }, [area, ordenarResultados, resultados]);

  const asignacionPorDocente = useMemo(
    () => new Map(resultadoArea.map((resultado) => [resultado.docenteId, resultado])),
    [resultadoArea],
  );

  function validarConfiguracion() {
    if (!area) return "Selecciona un área antes de realizar el sorteo.";
    if (!Number.isInteger(intervaloInicio) || !Number.isInteger(intervaloFin)) return "El intervalo debe contener números enteros.";
    if (intervaloInicio > intervaloFin) return "El número inicial no puede ser mayor que el número final.";
    if (intervaloFin - intervaloInicio + 1 > 500) return "El intervalo puede contener como máximo 500 números.";
    if (!Number.isInteger(maximoAreas) || maximoAreas < 1) return "El límite debe ser de una o más áreas por docente.";
    if (elegibles.length === 0) return "No hay docentes disponibles en esta área con el límite actual.";
    if (exigirCantidadExacta && intervaloFin - intervaloInicio + 1 !== elegibles.length) {
      return `El intervalo tiene ${intervaloFin - intervaloInicio + 1} números y hay ${elegibles.length} docentes. Iguala ambas cantidades o desactiva la cantidad exacta.`;
    }
    return "";
  }

  async function realizarSorteo() {
    if (ejecutando.current) return;
    const validacion = validarConfiguracion();
    setError(validacion);
    setMensaje("");
    if (validacion) return;

    ejecutando.current = true;
    setSorteando(true);
    const cantidad = intervaloFin - intervaloInicio + 1;
    const todosLosNumeros = Array.from({ length: cantidad }, (_, indice) => intervaloInicio + indice);
    const numeros = mezclar(todosLosNumeros);
    const cantidadAsignaciones = exigirCantidadExacta ? elegibles.length : Math.min(elegibles.length, cantidad);
    const docentesSorteados = mezclar(elegibles).slice(0, cantidadAsignaciones);
    const nuevos: ResultadoSorteo[] = [];
    let candidatos = mezclar(elegibles);
    const duracionPaso = cantidadAsignaciones <= 10 ? 70 : cantidadAsignaciones <= 25 ? 45 : 25;
    const vueltas = cantidadAsignaciones <= 10 ? 14 : cantidadAsignaciones <= 25 ? 8 : 4;

    setResultados((anteriores) => anteriores.filter((resultado) => resultado.area !== area));
    setNumerosDisponibles(todosLosNumeros);

    try {
      for (let indice = 0; indice < cantidadAsignaciones; indice += 1) {
        const numero = numeros[indice];
        const ganador = docentesSorteados[indice];
        setNumeroAnimado(numero);
        setDocenteGanadorId(null);

        for (let paso = 0; paso < vueltas; paso += 1) {
          const candidato = candidatos[paso % candidatos.length];
          setDocenteIluminadoId(candidato.id);
          await esperar(duracionPaso + Math.floor((paso / vueltas) * 45));
        }

        setDocenteIluminadoId(ganador.id);
        setDocenteGanadorId(ganador.id);
        await esperar(cantidadAsignaciones <= 10 ? 450 : cantidadAsignaciones <= 25 ? 220 : 140);

        const resultado: ResultadoSorteo = {
          area,
          docenteId: ganador.id,
          docente: ganador.nombre,
          numero,
          intervaloInicio,
          intervaloFin,
        };
        nuevos.push(resultado);
        setResultados((anteriores) => [...anteriores, resultado]);
        setNumerosDisponibles((disponibles) => disponibles.filter((valor) => valor !== numero));
        candidatos = candidatos.filter((docente) => docente.id !== ganador.id);
        setDocenteIluminadoId(null);
        setDocenteGanadorId(null);
        await esperar(cantidadAsignaciones <= 10 ? 250 : cantidadAsignaciones <= 25 ? 100 : 60);
      }

      setNumeroAnimado(null);
      setSorteando(false);
      const sinAsignar = elegibles.length - nuevos.length;
      const sinUsar = cantidad - nuevos.length;
      const detalleDocentes = sinAsignar > 0
        ? ` ${sinAsignar} ${sinAsignar === 1 ? "docente quedó" : "docentes quedaron"} sin número en esta ronda.`
        : "";
      const detalleNumeros = sinUsar > 0
        ? ` ${sinUsar} ${sinUsar === 1 ? "número quedó" : "números quedaron"} sin utilizar.`
        : "";
      setMensaje(`Sorteo completado: ${nuevos.length} docentes recibieron un número en ${area}.${detalleDocentes}${detalleNumeros}`);
    } finally {
      ejecutando.current = false;
      setSorteando(false);
      setDocenteIluminadoId(null);
      setDocenteGanadorId(null);
    }
  }

  function limpiarArea() {
    if (!area) return;
    setResultados((anteriores) => anteriores.filter((resultado) => resultado.area !== area));
    setNumeroAnimado(null);
    setNumerosDisponibles([]);
    setMensaje(`Se eliminó el resultado de ${area}.`);
    setError("");
  }

  function limpiarTodo() {
    setResultados([]);
    setNumeroAnimado(null);
    setNumerosDisponibles([]);
    setMensaje("Se limpiaron todos los resultados.");
    setError("");
  }

  async function descargarPdf() {
    if (resultados.length === 0) {
      setError("Realiza por lo menos un sorteo antes de descargar el PDF.");
      return;
    }
    setGenerandoPdf(true);
    setError("");
    try {
      const respuesta = await fetch("/api/sorteo-docentes/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intervaloInicio, intervaloFin, maximoAreas, ordenarResultados, resultados }),
      });
      if (!respuesta.ok) {
        const datos = await respuesta.json().catch(() => null);
        throw new Error(datos?.error || "No se pudo generar el PDF.");
      }
      const fecha = new Date().toISOString().slice(0, 10);
      descargarBlob(await respuesta.blob(), `sorteo-docentes-${fecha}.pdf`);
      setMensaje("El PDF se generó y descargó correctamente.");
    } catch (problema) {
      setError(problema instanceof Error ? problema.message : "No se pudo generar el PDF.");
    } finally {
      setGenerandoPdf(false);
    }
  }

  const resultadosPresentados = ordenarResultados
    ? [...resultados].sort((a, b) => a.area.localeCompare(b.area, "es") || a.numero - b.numero)
    : [...resultados];

  return (
    <main className="sorteo-page min-h-screen p-8">
      <header className="mx-auto flex max-w-7xl flex-wrap items-start justify-between gap-5">
        <div>
          <p className="eyebrow">Asignación aleatoria por área</p>
          <h1 className="mt-2 text-4xl font-black tracking-tight text-white md:text-5xl">Sorteo de docentes</h1>
          <p className="mt-3 max-w-2xl text-base text-slate-300">Selecciona un área, define el intervalo y asigna un número único a cada docente disponible.</p>
        </div>
        <div className="acta-header-tools">
          <ManualUsuario pantalla="sorteo-docentes" />
          <ActivarGeneradorPdf />
        </div>
      </header>

      <div className="mx-auto mt-8 grid max-w-7xl gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,.65fr)]">
        <section className="rounded-3xl bg-white p-6 shadow-2xl shadow-slate-950/20 md:p-8">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.2em] text-blue-600">Paso 1</p>
              <h2 className="mt-2 text-2xl font-black text-slate-900">Configura el sorteo</h2>
            </div>
            <span className="rounded-full bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700">{docentesUnicos.length} docentes activos</span>
          </div>

          <div className="mt-7 grid gap-5 md:grid-cols-2">
            <label className="md:col-span-2">
              <span className="mb-2 block font-semibold text-slate-700">Área académica *</span>
              <select disabled={sorteando} value={area} onChange={(evento) => { setArea(evento.target.value); setError(""); setMensaje(""); setNumeroAnimado(null); }} className="w-full rounded-xl border border-slate-300 px-4 py-3 disabled:opacity-60">
                <option value="">Seleccione un área</option>
                {areas.map((nombre) => <option key={nombre} value={nombre}>{nombre}</option>)}
              </select>
            </label>

            <label>
              <span className="mb-2 block font-semibold text-slate-700">Número inicial *</span>
              <input disabled={sorteando} type="number" step="1" value={intervaloInicio} onChange={(evento) => setIntervaloInicio(Number(evento.target.value))} className="w-full rounded-xl border border-slate-300 px-4 py-3 disabled:opacity-60" />
            </label>
            <label>
              <span className="mb-2 block font-semibold text-slate-700">Número final *</span>
              <input disabled={sorteando} type="number" step="1" value={intervaloFin} onChange={(evento) => setIntervaloFin(Number(evento.target.value))} className="w-full rounded-xl border border-slate-300 px-4 py-3 disabled:opacity-60" />
            </label>
            <label className="md:col-span-2">
              <span className="mb-2 block font-semibold text-slate-700">Máximo de áreas por docente *</span>
              <input disabled={sorteando} type="number" min="1" max={areas.length || 1} step="1" value={maximoAreas} onChange={(evento) => setMaximoAreas(Number(evento.target.value))} className="w-full rounded-xl border border-slate-300 px-4 py-3 disabled:opacity-60" />
              <span className="mt-2 block text-sm leading-6 text-slate-500">Un docente puede participar hasta este número de áreas diferentes. Si pertenece a varias áreas, seguirá apareciendo en cada una hasta alcanzar el límite.</span>
            </label>

            <label className="md:col-span-2 flex cursor-pointer items-start justify-between gap-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <span>
                <span className="block font-bold text-slate-800">Exigir la misma cantidad de docentes y números</span>
                <span className="mt-1 block text-sm leading-6 text-slate-500">
                  {exigirCantidadExacta
                    ? "Activado: la cantidad de números del intervalo debe ser exactamente igual a la cantidad de docentes disponibles."
                    : "Desactivado: pueden sobrar números o docentes; se asignará la menor cantidad posible sin repetir."}
                </span>
              </span>
              <span className="relative mt-1 inline-flex shrink-0">
                <input disabled={sorteando} type="checkbox" role="switch" checked={exigirCantidadExacta} onChange={(evento) => { setExigirCantidadExacta(evento.target.checked); setError(""); }} className="peer sr-only" />
                <span className="h-7 w-12 rounded-full bg-slate-300 transition peer-checked:bg-blue-600 peer-focus-visible:ring-4 peer-focus-visible:ring-blue-200" />
                <span className="absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
              </span>
            </label>

            <label className="md:col-span-2 flex cursor-pointer items-start justify-between gap-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <span>
                <span className="block font-bold text-slate-800">Ordenar resultados por número</span>
                <span className="mt-1 block text-sm leading-6 text-slate-500">
                  {ordenarResultados
                    ? "Activado: los resultados se muestran del número menor al mayor."
                    : "Desactivado: se conserva el orden exacto en que fueron saliendo durante el sorteo."}
                </span>
              </span>
              <span className="relative mt-1 inline-flex shrink-0">
                <input disabled={sorteando} type="checkbox" role="switch" checked={ordenarResultados} onChange={(evento) => setOrdenarResultados(evento.target.checked)} className="peer sr-only" />
                <span className="h-7 w-12 rounded-full bg-slate-300 transition peer-checked:bg-blue-600 peer-focus-visible:ring-4 peer-focus-visible:ring-blue-200" />
                <span className="absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
              </span>
            </label>
          </div>

          <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[.2em] text-violet-600">Paso 2</p>
                <h3 className="mt-1 text-xl font-black text-slate-900">Docentes participantes</h3>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-2 text-sm font-bold">
                {sorteando && (
                  <span className="sorteo-numero-resumen" role="status" aria-live="polite">
                    <span>Número en sorteo</span>
                    <strong>{numeroAnimado}</strong>
                  </span>
                )}
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-800">{elegibles.length} disponibles</span>
                {bloqueados.length > 0 && <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-800">{bloqueados.length} con límite</span>}
              </div>
            </div>

            {!area ? (
              <p className="mt-5 rounded-xl border border-dashed border-slate-300 bg-white p-5 text-center text-slate-500">Elige un área para mostrar sus docentes.</p>
            ) : docentesDelArea.length === 0 ? (
              <p className="mt-5 rounded-xl bg-amber-50 p-4 text-amber-800">Esta área no tiene docentes activos.</p>
            ) : (
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {docentesDelArea.map((docente) => {
                  const cantidadAreas = participaciones.get(normalizarNombre(docente.nombre))?.size ?? 0;
                  const bloqueado = idsBloqueados.has(docente.id);
                  const asignacion = asignacionPorDocente.get(docente.id);
                  return (
                    <div
                      key={docente.id}
                      aria-current={docenteIluminadoId === docente.id ? "true" : undefined}
                      className={`sorteo-docente flex items-center gap-3 rounded-xl border p-3 ${bloqueado ? "border-amber-200 bg-amber-50 opacity-70" : "border-slate-200 bg-white"} ${asignacion ? "sorteo-docente-asignado" : ""} ${docenteIluminadoId === docente.id ? "sorteo-docente-activo" : ""} ${docenteGanadorId === docente.id ? "sorteo-docente-ganador" : ""}`}
                    >
                      <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-black ${asignacion ? "bg-slate-300 text-slate-600" : bloqueado ? "bg-amber-200 text-amber-900" : "bg-blue-100 text-blue-700"}`}>{docente.nombre.charAt(0)}</span>
                      <div className="min-w-0">
                        <p className={`truncate font-semibold ${asignacion ? "text-slate-500" : "text-slate-800"}`}>{docente.nombre}</p>
                        <p className="text-xs text-slate-500">{asignacion ? `Ya recibió el número ${asignacion.numero}` : bloqueado ? "Límite alcanzado" : `${cantidadAreas} de ${maximoAreas} áreas utilizadas`}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {error && <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 font-medium text-red-700">{error}</p>}
          {mensaje && <p role="status" className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 font-medium text-emerald-800">{mensaje}</p>}

          <div className="mt-6 flex flex-wrap gap-3">
            <button type="button" onClick={realizarSorteo} disabled={sorteando} className="rounded-xl bg-blue-600 px-6 py-3 font-bold text-white hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60">
              {sorteando ? "Sorteando…" : resultadoArea.length > 0 ? "Volver a sortear esta área" : "Realizar sorteo"}
            </button>
            {resultadoArea.length > 0 && <button type="button" onClick={limpiarArea} disabled={sorteando} className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700 hover:bg-slate-100">Limpiar esta área</button>}
          </div>
        </section>

        <aside className="space-y-6">
          <section className="overflow-hidden rounded-3xl border border-white/10 bg-slate-900 p-6 text-white shadow-2xl">
            <p className="text-xs font-bold uppercase tracking-[.2em] text-cyan-300">Sorteo visual</p>
            <div className={`sorteo-orbe mx-auto mt-7 ${sorteando ? "sorteo-orbe-activo" : ""}`} aria-live="polite">
              <span>{numeroAnimado ?? "?"}</span>
            </div>
            {!sorteando && (
              <p className="mt-6 text-center text-sm leading-6 text-slate-300">
                {resultadoArea.length > 0 ? `Resultado listo para ${area}.` : "Cada número recorrerá los docentes hasta detenerse en uno."}
              </p>
            )}
            {(sorteando || numerosDisponibles.length > 0) && (
              <div className="mt-5 border-t border-white/10 pt-4">
                <p className="text-center text-xs font-bold uppercase tracking-widest text-slate-400">Números disponibles</p>
                <div className="mt-3 flex flex-wrap justify-center gap-2">
                  {numerosDisponibles.map((numero) => (
                    <span key={numero} className={`sorteo-numero-disponible ${numeroAnimado === numero ? "sorteo-numero-actual" : ""}`}>{numero}</span>
                  ))}
                  {numerosDisponibles.length === 0 && <span className="text-sm text-emerald-300">Todos fueron asignados</span>}
                </div>
              </div>
            )}
          </section>

          {resultadoArea.length > 0 && (
            <section className="rounded-3xl bg-white p-6 shadow-xl">
              <h3 className="text-xl font-black text-slate-900">Resultado de {area}</h3>
              <div className="mt-4 space-y-3">
                {resultadoArea.map((resultado) => (
                  <div key={`${resultado.area}-${resultado.docenteId}`} className="sorteo-resultado flex items-center gap-4 rounded-2xl border border-slate-200 p-3">
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-blue-600 text-xl font-black text-white">{resultado.numero}</span>
                    <p className="font-semibold leading-5 text-slate-800">{resultado.docente}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </aside>
      </div>

      <section className="mx-auto mt-6 max-w-7xl rounded-3xl bg-white p-6 shadow-2xl shadow-slate-950/20 md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.2em] text-blue-600">Paso 3</p>
            <h2 className="mt-2 text-2xl font-black text-slate-900">Resultados acumulados</h2>
            <p className="mt-2 text-sm text-slate-500">El PDF incluirá todos los sorteos que aparecen en esta tabla.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={descargarPdf} disabled={resultados.length === 0 || generandoPdf || sorteando} className="rounded-xl bg-emerald-600 px-5 py-3 font-bold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50">{generandoPdf ? "Generando PDF…" : "Descargar PDF"}</button>
            <button type="button" onClick={limpiarTodo} disabled={resultados.length === 0 || sorteando} className="rounded-xl border border-red-200 bg-red-50 px-5 py-3 font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50">Limpiar todo</button>
          </div>
        </div>

        {resultados.length === 0 ? (
          <p className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-500">Todavía no hay resultados. Realiza el primer sorteo para habilitar el PDF.</p>
        ) : (
          <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full min-w-[650px]">
              <thead className="bg-slate-100 text-left text-sm text-slate-600">
                <tr><th className="px-5 py-4">Área</th><th className="px-5 py-4">Docente</th><th className="px-5 py-4 text-center">Número</th></tr>
              </thead>
              <tbody>
                {resultadosPresentados.map((resultado) => (
                  <tr key={`${resultado.area}-${resultado.docenteId}`} className="border-t border-slate-200">
                    <td className="px-5 py-4 text-sm font-semibold text-slate-700">{resultado.area}</td>
                    <td className="px-5 py-4 text-slate-800">{resultado.docente}</td>
                    <td className="px-5 py-4 text-center"><span className="inline-grid h-9 min-w-9 place-items-center rounded-lg bg-blue-100 px-2 font-black text-blue-700">{resultado.numero}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
