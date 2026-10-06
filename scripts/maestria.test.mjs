import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { camposMaestria, notaEnLetras, resultadoMaestria, construirDatosMaestria, validarMaestria } from "../lib/maestria-data.ts";
import { nombreArchivoActa, SIGLAS_MODALIDAD } from "../lib/ci.ts";

export const ejemplo = {
  postulante: "Ana Pérez de Prueba", ci: "CI-SOLO-ARCHIVO-987654", pagina: "36", genero: "femenino",
  fecha: "2026-10-06", hora: "14:30", tema: "INVESTIGACIÓN DE TURISMO Y DESARROLLO LOCAL",
  maestria: "MAESTRÍA EN DESARROLLO TURÍSTICO SUSTENTABLE", siglasGrado: "M. Sc.",
  nota: "92", tribunal1: "Dra. Primera de Prueba", tribunal2: "Dr. Segundo de Prueba",
  revisor: "Mg. Revisor de Prueba", presidente: "Mg. Presidente de Prueba",
};

test("escala completa y límites, incluidos 65 puntos reprobados", () => {
  for (const [nota, esperado] of [[0,"REPROBADO"],[64,"REPROBADO"],[65,"REPROBADO"],[66,"APROBADO"],[70,"APROBADO"],[71,"APROBADO - BUENO"],[80,"APROBADO - BUENO"],[81,"APROBADO - MUY BUENO"],[90,"APROBADO - MUY BUENO"],[91,"APROBADO - EXCELENTE"],[100,"APROBADO - EXCELENTE"]]) {
    assert.equal(resultadoMaestria(nota, "masculino"), esperado);
    assert.equal(resultadoMaestria(nota, "femenino"), esperado.replace("BADO", "BADA"));
  }
  for (let nota = 0; nota <= 100; nota++) assert.ok(notaEnLetras(nota));
  assert.equal(notaEnLetras(92), "NOVENTA Y DOS");
  assert.equal(notaEnLetras(100), "CIEN");
  for (const nota of [-1, 100.5, 101, NaN]) assert.equal(notaEnLetras(nota), "");
});

test("todos los campos obligatorios se validan también para solicitudes directas", () => {
  assert.deepEqual(validarMaestria(ejemplo), {});
  for (const campo of Object.keys(camposMaestria)) assert.ok(validarMaestria({ ...ejemplo, [campo]: "" })[campo], campo);
  for (const nota of ["-1", "101", "65.5", "abc", "Infinity"]) assert.ok(validarMaestria({ ...ejemplo, nota }).nota);
  for (const fecha of ["2026-02-30", "no-fecha", "2026-13-01"]) assert.ok(validarMaestria({ ...ejemplo, fecha }).fecha);
  assert.ok(validarMaestria({ ...ejemplo, hora: "24:30" }).hora);
  assert.ok(validarMaestria({ ...ejemplo, pagina: "0" }).pagina);
  assert.ok(validarMaestria({ ...ejemplo, siglasGrado: "( )" }).siglasGrado);
  assert.ok(validarMaestria({ ...ejemplo, tribunal2: ejemplo.tribunal1 }).tribunal1);
});

test("hora de medianoche/mediodía, género y CI fuera del documento", () => {
  for (const [hora, texto] of [["00:05","12:05 a. m."],["09:10","09:10 a. m."],["12:00","12:00 p. m."],["23:59","11:59 p. m."]]) assert.equal(construirDatosMaestria({ ...ejemplo, hora }).horaTexto, texto);
  assert.equal(construirDatosMaestria(ejemplo).tratamiento, "la Licenciada");
  assert.equal(construirDatosMaestria({ ...ejemplo, genero: "masculino" }).tratamiento, "el Licenciado");
  assert.ok(!("ci" in construirDatosMaestria(ejemplo)));
  assert.equal(nombreArchivoActa("12345678", SIGLAS_MODALIDAD.maestria, "pdf"), "12345678-M.pdf");
});

test("plantilla variable preserva espacios, firmas, acentos y XML escapado", () => {
  for (const genero of ["masculino", "femenino"]) {
    const zip = new PizZip(readFileSync(new URL("../templates/acta-defensa-maestria.docx", import.meta.url)));
    const doc = new Docxtemplater(zip, { delimiters: { start: "{{", end: "}}" }, linebreaks: true, paragraphLoop: true });
    doc.render(construirDatosMaestria({ ...ejemplo, genero, tema: "TURISMO & CULTURA <LOCAL>" }));
    const xml = doc.getZip().file("word/document.xml").asText();
    assert.ok(!xml.includes("{{"));
    assert.ok(!xml.includes(ejemplo.ci));
    assert.ok(!xml.includes("______"));
    assert.ok(xml.includes("TURISMO &amp; CULTURA &lt;LOCAL&gt;"));
    assert.ok(xml.includes(genero === "femenino" ? "la Licenciada" : "el Licenciado"));
    assert.ok(!xml.includes("la la postulante"));
    assert.ok(!xml.includes("el el postulante"));
    for (const campo of ["tribunal1", "tribunal2", "revisor", "presidente"]) assert.ok(xml.includes(ejemplo[campo]));
  }
});
