"""Crea dos plantillas PETAENG conservando el OOXML de los Word originales."""

from pathlib import Path
from tempfile import NamedTemporaryFile
from zipfile import ZIP_DEFLATED, ZipFile
from lxml import etree
import hashlib
import os


ROOT = Path(__file__).resolve().parents[1]
NS = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}
XML_SPACE = "{http://www.w3.org/XML/1998/namespace}space"
W = f"{{{NS['w']}}}"


def replace_runs(paragraph, start: int, end: int, marker: str) -> None:
    runs = paragraph.xpath("./w:r", namespaces=NS)
    if start < 0 or end >= len(runs):
        raise RuntimeError(f"Rango de runs inválido: {start}-{end} de {len(runs)}")
    first_text = runs[start].find(".//w:t", namespaces=NS)
    if first_text is None:
        raise RuntimeError("El primer run del campo no contiene texto.")
    for run in runs[start : end + 1]:
        for node in run.findall(".//w:t", namespaces=NS):
            node.text = ""
    first_text.text = marker
    first_text.set(XML_SPACE, "preserve")


def element(name: str, **attributes: str) -> etree._Element:
    node = etree.Element(f"{W}{name}")
    for key, value in attributes.items():
        node.set(f"{W}{key}", value)
    return node


def signature_paragraph(text: str, *, bold: bool = False, highlighted: bool = False) -> etree._Element:
    paragraph = element("p")
    properties = element("pPr")
    properties.append(element("jc", val="center"))
    properties.append(element("spacing", before="0", after="0", line="240", lineRule="auto"))
    properties.append(element("keepNext"))
    paragraph.append(properties)

    run = element("r")
    run_properties = element("rPr")
    fonts = element("rFonts", ascii="Times New Roman", hAnsi="Times New Roman", cs="Times New Roman")
    run_properties.append(fonts)
    run_properties.append(element("sz", val="24"))
    run_properties.append(element("szCs", val="24"))
    if bold:
        run_properties.append(element("b"))
        run_properties.append(element("bCs"))
    if highlighted:
        run_properties.append(element("highlight", val="yellow"))
    run.append(run_properties)
    text_node = element("t")
    text_node.text = text
    text_node.set(XML_SPACE, "preserve")
    run.append(text_node)
    paragraph.append(run)
    return paragraph


def signature_cell(name: str, role: str, width: int) -> etree._Element:
    cell = element("tc")
    cell_properties = element("tcPr")
    cell_properties.append(element("tcW", w=str(width), type="dxa"))
    cell_properties.append(element("vAlign", val="center"))
    margins = element("tcMar")
    margins.append(element("left", w="40", type="dxa"))
    margins.append(element("right", w="40", type="dxa"))
    cell_properties.append(margins)
    cell.append(cell_properties)
    cell.append(signature_paragraph(name, highlighted=True))
    cell.append(signature_paragraph(role, bold=True))
    return cell


def blank_signature_cell(width: int) -> etree._Element:
    cell = element("tc")
    cell_properties = element("tcPr")
    cell_properties.append(element("tcW", w=str(width), type="dxa"))
    cell.append(cell_properties)
    cell.append(signature_paragraph(""))
    return cell


def signature_table(
    left_name: str,
    left_role: str,
    right_name: str,
    right_role: str,
    total_width: int,
) -> etree._Element:
    # Reparto simétrico: cada firma aprovecha casi la mitad de la hoja.
    # El separador mínimo mantiene los nombres aislados sin desperdiciar ancho.
    side_width = int(total_width * 0.49)
    gap_width = total_width - (side_width * 2)

    table = element("tbl")
    table_properties = element("tblPr")
    table_properties.append(element("tblW", w=str(total_width), type="dxa"))
    table_properties.append(element("tblLayout", type="fixed"))
    table_properties.append(element("jc", val="center"))
    borders = element("tblBorders")
    for side in ("top", "left", "bottom", "right", "insideH", "insideV"):
        borders.append(element(side, val="nil"))
    table_properties.append(borders)
    table.append(table_properties)

    grid = element("tblGrid")
    for width in (side_width, gap_width, side_width):
        grid.append(element("gridCol", w=str(width)))
    table.append(grid)

    row = element("tr")
    row_properties = element("trPr")
    row_properties.append(element("cantSplit"))
    row.append(row_properties)
    row.append(signature_cell(left_name, left_role, side_width))
    row.append(blank_signature_cell(gap_width))
    row.append(signature_cell(right_name, right_role, side_width))
    table.append(row)
    return table


def replace_signature_block(
    paragraphs: list[etree._Element],
    name_index: int,
    role_index: int,
    left_name: str,
    left_role: str,
    right_name: str,
    right_role: str,
    total_width: int,
) -> None:
    name_paragraph = paragraphs[name_index]
    role_paragraph = paragraphs[role_index]
    parent = name_paragraph.getparent()
    parent.insert(parent.index(name_paragraph), signature_table(
        left_name, left_role, right_name, right_role, total_width
    ))
    parent.remove(name_paragraph)
    parent.remove(role_paragraph)


def build(source: Path, output: Path, sha256: str, replacements: list[tuple[int, int, int, str]]) -> None:
    if hashlib.sha256(source.read_bytes()).hexdigest() != sha256:
        raise RuntimeError(f"La referencia cambió y debe revisarse otra vez: {source.name}")
    with ZipFile(source, "r") as package:
        entries = {info.filename: package.read(info.filename) for info in package.infolist()}
    document = etree.fromstring(entries["word/document.xml"])
    paragraphs = document.xpath("./w:body/w:p", namespaces=NS)
    for paragraph_index, run_start, run_end, marker in replacements:
        replace_runs(paragraphs[paragraph_index], run_start, run_end, marker)
    if output.name == "acta-defensa-memoria-laboral-petaeng.docx":
        paragraph = paragraphs[27]
        properties = paragraph.find("w:pPr", namespaces=NS)
        if properties is None:
            properties = etree.Element(f"{{{NS['w']}}}pPr")
            paragraph.insert(0, properties)
        if properties.find("w:pageBreakBefore", namespaces=NS) is None:
            properties.append(etree.Element(f"{{{NS['w']}}}pageBreakBefore"))
        replace_signature_block(
            paragraphs, 51, 52,
            "{{tutor}}", "DOCENTE TUTOR (A)",
            "{{presidente}}", "PRESIDENTE de TRIBUNAL",
            9418,
        )
        replace_signature_block(
            paragraphs, 43, 44,
            "{{tribunal1}}", "TRIBUNAL de GRADO",
            "{{tribunal2}}", "TRIBUNAL de GRADO",
            9418,
        )
    elif output.name == "acta-conformidad-cursos-petaeng.docx":
        replace_signature_block(
            paragraphs, 21, 22,
            "{{tribunal3}}", "TRIBUNAL REVISOR",
            "{{presidente}}", "PRESIDENTE de TRIBUNAL",
            9130,
        )
        replace_signature_block(
            paragraphs, 15, 16,
            "{{tribunal1}}", "TRIBUNAL REVISOR",
            "{{tribunal2}}", "TRIBUNAL REVISOR",
            9130,
        )
    entries["word/document.xml"] = etree.tostring(
        document, xml_declaration=True, encoding="UTF-8", standalone=True
    )
    output.parent.mkdir(parents=True, exist_ok=True)
    with NamedTemporaryFile(delete=False, suffix=".docx", dir=output.parent) as temp:
        temporary = Path(temp.name)
    try:
        with ZipFile(temporary, "w", ZIP_DEFLATED) as package:
            for name, content in entries.items():
                package.writestr(name, content)
        os.replace(temporary, output)
    finally:
        temporary.unlink(missing_ok=True)


def main() -> None:
    desktop = Path(r"C:\Users\ronal\OneDrive\Desktop")
    build(
        desktop / "08. ACTA DE DEFENSA - Univ. Maribel Leon.docx",
        ROOT / "templates" / "acta-defensa-memoria-laboral-petaeng.docx",
        "21c256084bcd5f38b2a41a3c04a7c2897e35ce34d4b669ef14e9147943ac959b",
        [
            (0, 1, 2, "{{folio}}"), (1, 3, 3, "{{libro}}"),
            (8, 2, 3, "{{gestion}}"), (10, 5, 6, "«{{tema}}»"),
            (12, 4, 4, "{{postulante}}"), (13, 4, 8, "{{tutor}}"),
            (14, 4, 5, "{{tribunal1}}"), (15, 3, 6, "{{tribunal2}}"),
            (17, 4, 6, "{{presidente}}"),
            (19, 1, 16, "horas {{hora}} del día {{fechaLiteral}}"),
            (19, 25, 26, "Univ. {{postulante}}"), (19, 38, 39, "«{{tema}}»"),
            (27, 3, 4, "{{folioSiguiente}}"), (28, 3, 3, "{{libro}}"),
            (36, 5, 14, "{{nota}}/100 ({{notaLiteral}}) {{resultado}}."),
            (43, 1, 2, "{{tribunal1}}"), (43, 6, 9, "{{tribunal2}}"),
            (51, 4, 7, "{{tutor}}"), (51, 19, 21, "{{presidente}}"),
        ],
    )
    build(
        desktop / "84. ACTA DE LECTURA - CURSOS - PETAENG  2026 - Univ. Valle Pusarico Vivian.docx",
        ROOT / "templates" / "acta-conformidad-cursos-petaeng.docx",
        "c7da710be6491df516a52e3b46c5d54bd8991a0d2e154e8f5e3ecbad740b9d7f",
        [
            (0, 3, 3, "{{folio}}"), (1, 3, 3, "{{libro}}"), (3, 17, 17, "{{gestion}}"),
            (7, 1, 15, "horas {{hora}} del día {{fechaLiteral}}"),
            (7, 26, 28, "Univ. {{postulante}}"), (7, 37, 38, "{{gestion}}"),
            (9, 6, 16, "{{nota}}/100 ({{notaLiteral}}) {{resultado}}."),
            (15, 0, 5, "{{tribunal1}}"), (15, 9, 11, "{{tribunal2}}"),
            (21, 0, 1, "{{tribunal3}}"), (21, 3, 5, "{{presidente}}"),
        ],
    )


if __name__ == "__main__":
    main()
