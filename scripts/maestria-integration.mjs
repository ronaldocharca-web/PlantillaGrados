// Ejecutar con el servidor local y el conversor activos. No guarda datos en Supabase.
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import PizZip from "pizzip";

const base = process.env.ACTAS_TEST_URL || "http://localhost:3000";
const carpeta = new URL("../.artifacts/maestria-qa/", import.meta.url);
await mkdir(carpeta, { recursive: true });
const datos = {
  postulante: "Ana Pérez de Prueba", ci: "CI-SOLO-ARCHIVO-987654", pagina: "48", genero: "femenino",
  fecha: "2026-10-06", hora: "14:30", tema: "CONDICIONES DE PARTICIPACIÓN DE LA MUJER EN EMPRENDIMIENTOS DE AGENCIAS DE VIAJE Y TURISMO EN LA CIUDAD DE LA PAZ",
  maestria: "MAESTRÍA EN DESARROLLO TURÍSTICO SUSTENTABLE", siglasGrado: "M. Sc.", nota: "92",
  tribunal1: "Dra. Primera de Prueba", tribunal2: "Dr. Segundo de Prueba",
  revisor: "Mg. Revisor de Prueba", presidente: "Mg. Presidente de Prueba",
};
for (const genero of ["femenino", "masculino"]) {
  const caso = { ...datos, genero, nota: genero === "femenino" ? "92" : "65" };
  for (const extension of ["docx", "pdf"]) {
    const respuesta = await fetch(`${base}/api/actas/maestria/${extension}`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(caso),
    });
    const bytes = Buffer.from(await respuesta.arrayBuffer());
    assert.equal(respuesta.status, 200, bytes.toString().slice(0, 200));
    assert.ok(respuesta.headers.get("content-disposition").includes(`${datos.ci}-M.${extension}`));
    if (extension === "docx") {
      const xml = new PizZip(bytes).file("word/document.xml").asText();
      const encabezado = new PizZip(bytes).file("word/header1.xml").asText();
      assert.ok((encabezado.match(/<w:t[^>]*>48<\/w:t>/g) || []).length >= 1);
      assert.ok(!xml.includes('w:instr=" PAGE "'));
      assert.ok(!xml.includes(datos.ci));
      assert.ok(!xml.includes("{{"));
      assert.ok(!xml.includes("______"));
      assert.ok(xml.includes("02:30 p. m."));
      assert.ok(xml.includes(genero === "femenino" ? "APROBADA - EXCELENTE" : "REPROBADO"));
    } else assert.equal(bytes.subarray(0, 5).toString(), "%PDF-");
    await writeFile(new URL(`${genero}.${extension}`, carpeta), bytes);
    console.log(`OK ${genero} ${extension}: ${bytes.length} bytes, nombre CI-M`);
  }
}
for (const extension of ["docx", "pdf"]) {
  for (const caso of [{}, { ...datos, ci: "" }, { ...datos, nota: "101" }]) {
    const respuesta = await fetch(`${base}/api/actas/maestria/${extension}`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(caso),
    });
    assert.equal(respuesta.status, 400);
    assert.ok((await respuesta.json()).error);
  }
  console.log(`OK ${extension}: validaciones del servidor`);
}
