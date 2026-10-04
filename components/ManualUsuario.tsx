"use client";

import { useId, useRef, useState } from "react";
import Image from "next/image";
import { manuales, type PantallaManual } from "@/lib/manuales";

export default function ManualUsuario({ pantalla }: { pantalla: PantallaManual }) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const contenido = useRef<HTMLDivElement>(null);
  const [paso, setPaso] = useState(0);
  const tituloId = useId();
  const manual = manuales[pantalla];
  const actual = manual.pasos[paso];

  function seleccionarPaso(indice: number) {
    setPaso(indice);
    contenido.current?.scrollTo({ top: 0 });
  }

  return (
    <>
      <button
        type="button"
        className="manual-trigger"
        aria-haspopup="dialog"
        onClick={() => { seleccionarPaso(0); dialogo.current?.showModal(); }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
          <path d="M12 6.5c-3-2-6.5-2-9-1v14c2.5-1 6-1 9 1 3-2 6.5-2 9-1v-14c-2.5-1-6-1-9 1Zm0 0v14" />
        </svg>
        Manual
      </button>
      <dialog
        ref={dialogo}
        className="manual-dialog"
        aria-labelledby={tituloId}
        onClick={(event) => { if (event.target === event.currentTarget) dialogo.current?.close(); }}
      >
        <div className="manual-shell">
          <header className="manual-header">
            <div>
              <p className="manual-eyebrow">Manual de uso</p>
              <h2 id={tituloId}>{manual.titulo}</h2>
              <p className="manual-summary">{manual.resumen}</p>
            </div>
            <button type="button" className="manual-close" autoFocus onClick={() => dialogo.current?.close()} aria-label="Cerrar manual">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>
            </button>
          </header>
          <div className="manual-layout">
            <nav className="manual-nav" aria-label="Pasos del manual">
              <p>Tu guía paso a paso</p>
              {manual.pasos.map((item, indice) => (
                <button key={item.titulo} type="button" aria-current={paso === indice ? "step" : undefined} onClick={() => seleccionarPaso(indice)}>
                  <span>{String(indice + 1).padStart(2, "0")}</span>
                  {item.titulo}
                </button>
              ))}
              <small>Puedes cerrar el manual sin perder los datos del formulario.</small>
            </nav>
            <div className="manual-content" ref={contenido}>
              <p className="manual-step-label">Paso {paso + 1} de {manual.pasos.length}</p>
              <h3>{actual.titulo}</h3>
              <p className="manual-description">{actual.descripcion}</p>
              {actual.imagen && (
                <figure className="manual-figure">
                  <a href={actual.imagen} target="_blank" rel="noreferrer" aria-label={`Ampliar captura: ${actual.titulo}`}>
                    <Image src={actual.imagen} alt={actual.pieImagen ?? actual.titulo} width={1440} height={1000} unoptimized />
                  </a>
                  <figcaption>{actual.pieImagen} Pulsa la imagen para ampliarla.</figcaption>
                </figure>
              )}
              <dl className="manual-details">
                {actual.detalles.map((detalle) => (
                  <div key={detalle.titulo}>
                    <dt>{detalle.titulo}</dt>
                    <dd>{detalle.texto}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
          <footer className="manual-footer">
            <span>{paso + 1} / {manual.pasos.length}</span>
            <div>
              <button type="button" className="manual-secondary" disabled={paso === 0} onClick={() => seleccionarPaso(paso - 1)}>Anterior</button>
              {paso < manual.pasos.length - 1 ? (
                <button type="button" className="manual-primary" onClick={() => seleccionarPaso(paso + 1)}>Siguiente <span aria-hidden="true">→</span></button>
              ) : (
                <button type="button" className="manual-primary" onClick={() => dialogo.current?.close()}>Entendido</button>
              )}
            </div>
          </footer>
        </div>
      </dialog>
    </>
  );
}
