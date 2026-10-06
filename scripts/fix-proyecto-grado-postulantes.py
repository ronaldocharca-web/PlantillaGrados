from __future__ import annotations

import os
import tempfile
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / "templates" / "proyecto-grado.docx"
W_NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
NS = {"w": W_NS}
ET.register_namespace("w", W_NS)


def text_nodes(paragraph):
    return paragraph.findall(".//w:t", NS)


def update_template(xml: bytes) -> bytes:
    root = ET.fromstring(xml)
    paragraphs = root.findall(".//w:p", NS)

    # El rótulo cambia a POSTULANTE/POSTULANTES según se complete uno o dos.
    for paragraph in paragraphs:
        nodes = text_nodes(paragraph)
        if any((node.text or "") == "POSTULANTE" for node in nodes):
            for node in nodes:
                if node.text == "POSTULANTE":
                    node.text = "{{etiquetaPostulante}}"
                    break
            break

    # El nombre del encabezado también debe admitir uno o dos nombres.
    for paragraph in paragraphs:
        nodes = text_nodes(paragraph)
        if len(nodes) == 1 and nodes[0].text == "{{postulante}}":
            nodes[0].text = "{{nombresPostulantes}}"
            break

    for paragraph in paragraphs:
        nodes = text_nodes(paragraph)
        values = [node.text or "" for node in nodes]
        joined = "".join(values)

        # Párrafo principal: reemplaza artículo + UNIV. + nombre + verbo
        # por valores preparados para uno o dos postulantes.
        if "{{articulo}}" in joined and "procedi" in joined:
            for node in nodes:
                if node.text == "{{articulo}}":
                    node.text = "{{postulantesTexto}}"
                elif node.text in {"UNIV. ", "{{postulante}}"}:
                    node.text = ""
                elif "procedi" in (node.text or ""):
                    node.text = "{{verboDefensa}}"

        # Párrafo de preguntas: genera "misma... la postulante" o
        # "mismas... los/las postulantes" con concordancia correcta.
        if "respondidas" in joined and (
            "{{articulo}}" in joined or "{{respuestaPostulantes}}" in joined
        ):
            for node in nodes:
                if node.text == "{{articulo}}":
                    node.text = "{{respuestaPostulantes}}"
                elif node.text == "{{respuestaPostulantes}}":
                    continue
                elif "mism" in (node.text or ""):
                    node.text = node.text.split("mism", 1)[0]
                elif (node.text or "").startswith("as que fueron respondidas"):
                    node.text = ""
                elif node.text in {"postulante", "postulante."}:
                    node.text = ""

    return ET.tostring(root, encoding="utf-8", xml_declaration=True)


def main() -> None:
    with zipfile.ZipFile(TARGET, "r") as source:
        entries = {name: source.read(name) for name in source.namelist()}

    entries["word/document.xml"] = update_template(entries["word/document.xml"])

    fd, temporary = tempfile.mkstemp(suffix=".docx", dir=TARGET.parent)
    os.close(fd)
    try:
        with zipfile.ZipFile(temporary, "w", zipfile.ZIP_DEFLATED) as destination:
            for name, content in entries.items():
                destination.writestr(name, content)
        os.replace(temporary, TARGET)
    finally:
        if os.path.exists(temporary):
            os.unlink(temporary)


if __name__ == "__main__":
    main()
