from __future__ import annotations

import os
import re
import tempfile
import zipfile
from pathlib import Path
from xml.etree import ElementTree


ROOT = Path(__file__).resolve().parents[1]
TEMPLATES = ROOT / "templates"
FILES = [
    "excelencia-1-tribunal.docx",
    "excelencia-2-tribunales.docx",
    "excelencia.docx",
]


def fix_docx(path: Path) -> None:
    temporary_path: Path | None = None
    with zipfile.ZipFile(path, "r") as source:
        xml = source.read("word/document.xml").decode("utf-8")
        pattern = re.compile(
            r"(<w:t>POSTULANTE</w:t>)(</w:r></w:sdtContent></w:sdt>)"
            r"(<w:r\b[^>]*>.*?<w:t>:</w:t>.*?</w:r>)",
            re.DOTALL,
        )
        updated, count = pattern.subn(r"<w:t>POSTULANTE:</w:t>\2", xml, count=1)
        if count != 1:
            raise RuntimeError(f"No se encontró el separador de POSTULANTE en {path.name}")
        ElementTree.fromstring(updated.encode("utf-8"))

        with tempfile.NamedTemporaryFile(
            prefix=f"{path.stem}-", suffix=".docx", delete=False, dir=path.parent
        ) as temporary:
            temporary_path = Path(temporary.name)

        with zipfile.ZipFile(temporary_path, "w") as target:
            for item in source.infolist():
                content = (
                    updated.encode("utf-8")
                    if item.filename == "word/document.xml"
                    else source.read(item.filename)
                )
                target.writestr(item, content)

    try:
        os.replace(temporary_path, path)
    finally:
        if temporary_path is not None:
            temporary_path.unlink(missing_ok=True)


for filename in FILES:
    target = TEMPLATES / filename
    fix_docx(target)
    print(f"Actualizado: {target}")
