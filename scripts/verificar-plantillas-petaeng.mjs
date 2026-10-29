import fs from "node:fs";
import path from "node:path";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";

const root = process.cwd();
const out = path.join(root, "tmp", "nuevas-plantillas", "rellenas");
fs.mkdirSync(out, { recursive: true });

function fill(template, output, data) {
  const document = new Docxtemplater(
    new PizZip(fs.readFileSync(path.join(root, "templates", template))),
    { paragraphLoop: true, linebreaks: true, delimiters: { start: "{{", end: "}}" }, nullGetter: () => "" },
  );
  document.render(data);
  fs.writeFileSync(path.join(out, output), document.getZip().generate({ type: "nodebuffer", compression: "DEFLATE" }));
}

fill("acta-defensa-memoria-laboral-petaeng.docx", "defensa-prueba.docx", {
  folio: "74", folioSiguiente: "75", libro: "9", gestion: "2026",
  tema: "Implementación del manual de procedimientos para la elaboración de rutas turísticas en la Dirección de Turismo del Gobierno Autónomo Departamental de La Paz",
  postulante: "Olivia Maribel León Mendoza", tutor: "MSc. Wendy Jenny Echalar Dávila",
  tribunal1: "Ph.D. Juana Margot Cavero Vda. De Rojas", tribunal2: "MSc. Efrain Oscar Alarcón Bautista",
  presidente: "Mg. Tur. Dante Enrique Caero Miranda", hora: "11:00",
  fechaLiteral: "viernes 23 de octubre 2026", nota: "86", notaLiteral: "Ochenta y seis",
  resultado: "Muy bueno, Aprobación con felicitaciones",
});

fill("acta-conformidad-cursos-petaeng.docx", "cursos-prueba.docx", {
  folio: "84", libro: "9", gestion: "2026", hora: "15:00",
  fechaLiteral: "viernes 23 de octubre 2026", postulante: "VALLE PUSARICO VIVIAN VERONICA",
  nota: "77", notaLiteral: "Setenta y siete", resultado: "Bueno, Aprobado",
  tribunal1: "Mg. Tur. Karin Wendy Ruescas Ramírez", tribunal2: "MSc. Mónica Chacón Delgado",
  tribunal3: "Mg.Tur. Erick Rómulo Rodríguez Lujan", presidente: "Mg. Tur. Dante Enrique Caero Miranda",
});
