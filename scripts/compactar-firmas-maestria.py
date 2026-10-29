"""Reemplaza el bloque de firmas de Maestría por una cuadrícula compacta 2 × 2."""

from pathlib import Path
from tempfile import NamedTemporaryFile
from zipfile import ZIP_DEFLATED, ZipFile
import os
import re


ROOT = Path(__file__).resolve().parents[1]
SOURCE_TEMPLATE = ROOT / "templates" / "acta-defensa-maestria.docx"
# Se conserva la plantilla original intacta. La aplicación usa esta versión
# preparada, que puede regenerarse sin depender de un archivo abierto en Word.
TEMPLATE = ROOT / "templates" / "acta-defensa-maestria-compacta.docx"


def run(text: str, label: str) -> str:
    # Mantiene el tamaño original de las firmas (12 pt). Solo se compacta
    # la distribución para evitar que el bloque salte a una segunda hoja.
    props = '<w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/>'
    if label:
        props += '<w:b/><w:bCs/>'
    props += '</w:rPr>'
    return f'<w:r>{props}<w:t>{text}</w:t></w:r>'


def cell(field: str, label: str) -> str:
    return f'''<w:tc>
  <w:tcPr><w:tcW w:w="4536" w:type="dxa"/><w:vAlign w:val="center"/></w:tcPr>
  <w:p>
    <w:pPr><w:jc w:val="center"/><w:spacing w:before="320" w:after="0"/></w:pPr>
    {run(field, "")}
    <w:r><w:br/></w:r>
    {run(label, "bold")}
  </w:p>
</w:tc>'''


def signature_table() -> str:
    return f'''<w:tbl>
  <w:tblPr>
    <w:tblW w:w="9072" w:type="dxa"/>
    <w:tblLayout w:type="fixed"/>
    <w:tblBorders>
      <w:top w:val="nil"/><w:left w:val="nil"/><w:bottom w:val="nil"/><w:right w:val="nil"/>
      <w:insideH w:val="nil"/><w:insideV w:val="nil"/>
    </w:tblBorders>
    <w:tblCellMar><w:top w:w="0" w:type="dxa"/><w:left w:w="0" w:type="dxa"/><w:bottom w:w="0" w:type="dxa"/><w:right w:w="0" w:type="dxa"/></w:tblCellMar>
  </w:tblPr>
  <w:tblGrid><w:gridCol w:w="4536"/><w:gridCol w:w="4536"/></w:tblGrid>
  <w:tr><w:trPr><w:trHeight w:val="700" w:hRule="atLeast"/></w:trPr>{cell("{{tribunal1}}", "TRIBUNAL DOCENTE")}{cell("{{tribunal2}}", "TRIBUNAL DOCENTE")}</w:tr>
  <w:tr><w:trPr><w:trHeight w:val="700" w:hRule="atLeast"/></w:trPr>{cell("{{revisor}}", "TRIBUNAL REVISOR")}{cell("{{presidente}}", "PRESIDENTE TRIBUNAL")}</w:tr>
</w:tbl>'''


def main() -> None:
    source_template = TEMPLATE if TEMPLATE.exists() else SOURCE_TEMPLATE
    with ZipFile(source_template, "r") as source:
        files = {info.filename: source.read(info.filename) for info in source.infolist()}

    xml = files["word/document.xml"].decode("utf-8")
    first_signature = xml.find("{{tribunal1")
    final_signature = xml.find("{{presidente}}")
    if first_signature == -1 or final_signature == -1:
        raise RuntimeError("No se encontró el bloque de firmas de Maestría.")

    table_start = xml.rfind("<w:tbl>", 0, first_signature)
    if table_start != -1:
        # Reemplaza también una cuadrícula creada anteriormente para que las
        # correcciones de tamaño se apliquen sin alterar el resto del acta.
        prefix = xml[:table_start]
        dangling = list(re.finditer(r"<w:p(?:\s[^>]*)?>\s*$", prefix, re.DOTALL))
        if dangling:
            prefix = prefix[:dangling[-1].start()]
        table_end = xml.find("</w:tbl>", final_signature)
        if table_end == -1:
            raise RuntimeError("No se pudo cerrar la cuadrícula de firmas existente.")
        xml = prefix + signature_table() + xml[table_end + len("</w:tbl>"):]
    else:
        paragraphs = list(re.finditer(r"<w:p(?:\s[^>]*)?>", xml[:first_signature]))
        end = xml.find("<w:sectPr", final_signature)
        if not paragraphs or end == -1:
            raise RuntimeError("No se pudo delimitar el bloque de firmas de Maestría.")
        xml = xml[:paragraphs[-1].start()] + signature_table() + xml[end:]
    files["word/document.xml"] = xml.encode("utf-8")

    with NamedTemporaryFile(delete=False, suffix=".docx", dir=TEMPLATE.parent) as temp_file:
        temporary = Path(temp_file.name)
    try:
        with ZipFile(temporary, "w", ZIP_DEFLATED) as output:
            for name, content in files.items():
                output.writestr(name, content)
        os.replace(temporary, TEMPLATE)
    finally:
        temporary.unlink(missing_ok=True)


if __name__ == "__main__":
    main()
