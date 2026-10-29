from pathlib import Path
from tempfile import NamedTemporaryFile
from zipfile import ZIP_DEFLATED, ZipFile
import os
import re

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "templates" / "sorteo-docentes-plantilla.docx"

with ZipFile(SOURCE, "r") as source:
    files = {info.filename: source.read(info.filename) for info in source.infolist()}
xml = files["word/document.xml"].decode("utf-8")
xml = xml.replace("28 de octubre de 2026 a las 4:04 p. m.", "{{fecha}}")
xml = xml.replace("Intervalos por área: Metodológica: 1 - 9; Turística: 1 - 9", "Intervalos por área: {{intervalos}}")
xml = xml.replace("2 áreas por docente", "{{limite}}")
xml = xml.replace("ordenada por número", "{{presentacion}}")
rows = list(re.finditer(r"<w:tr\b[^>]*>[\s\S]*?</w:tr>", xml))
if len(rows) < 2:
    raise RuntimeError("La plantilla no contiene una tabla de resultados.")
row = rows[1].group(0)
row = row.replace("<w:t>Metodológica</w:t>", "<w:t>{{#resultados}}{{area}}</w:t>", 1)
row = row.replace("<w:t>M. Sc. Ana María Pérez</w:t>", "<w:t>{{docente}}</w:t>", 1)
row = row.replace("<w:t>1</w:t>", "<w:t>{{numero}}{{/resultados}}</w:t>", 1)
xml = xml[:rows[0].start()] + rows[0].group(0) + row + xml[rows[-1].end():]
files["word/document.xml"] = xml.encode("utf-8")
with NamedTemporaryFile(delete=False, suffix=".docx", dir=SOURCE.parent) as temp:
    temporary = Path(temp.name)
try:
    with ZipFile(temporary, "w", ZIP_DEFLATED) as output:
        for name, content in files.items():
            output.writestr(name, content)
    os.replace(temporary, SOURCE)
finally:
    temporary.unlink(missing_ok=True)
