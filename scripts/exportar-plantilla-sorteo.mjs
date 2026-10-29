import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import ts from "typescript";

const require = createRequire(import.meta.url);
const root = process.cwd();
const temp = path.join(root, "tmp", "sorteo-template-build");
fs.mkdirSync(temp, { recursive: true });

function transpilar(nombre) {
  const origen = fs.readFileSync(path.join(root, "lib", nombre), "utf8");
  const salida = ts.transpileModule(origen, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const destino = path.join(temp, nombre.replace(/\.ts$/, ".cjs"));
  fs.writeFileSync(destino, salida);
  return destino;
}

transpilar("sorteo-data.ts");
let documento = fs.readFileSync(path.join(root, "lib", "sorteo-documento.ts"), "utf8");
documento = documento.replace('from "@/lib/sorteo-data"', 'from "./sorteo-data.cjs"');
const compilado = ts.transpileModule(documento, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const modulo = path.join(temp, "sorteo-documento.cjs");
fs.writeFileSync(modulo, compilado);

const { crearDocxSorteo } = require(modulo);
const reporte = {
  intervaloInicio: 1,
  intervaloFin: 9,
  maximoAreas: 2,
  ordenarResultados: true,
  resultados: [
    { area: "Metodológica", docenteId: 1, docente: "M. Sc. Ana María Pérez", numero: 1, intervaloInicio: 1, intervaloFin: 9 },
    { area: "Metodológica", docenteId: 2, docente: "Lic. Carlos Eduardo Rojas", numero: 2, intervaloInicio: 1, intervaloFin: 9 },
    { area: "Turística", docenteId: 3, docente: "Mg. Tur. Laura Fernanda Díaz", numero: 1, intervaloInicio: 1, intervaloFin: 9 },
    { area: "Turística", docenteId: 4, docente: "Dr. Jorge Alberto Salazar", numero: 2, intervaloInicio: 1, intervaloFin: 9 },
  ],
};

const salida = path.join(root, "templates", "sorteo-docentes-actual.docx");
fs.writeFileSync(salida, crearDocxSorteo(reporte));
console.log(salida);
