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
    "trab-dirigido-1-tribunal.docx",
    "trab-dirigido-2-tribunales.docx",
]


def fix_docx(path: Path) -> None:
    temporary_path: Path | None = None
    with zipfile.ZipFile(path, "r") as source:
        xml = source.read("word/document.xml").decode("utf-8")
        # Dos variables consecutivas producían «la la postulante» o «el el postulante».
        updated, count = re.subn(r"\{\{articulo\}\}(\s+)\{\{articulo\}\}", r"{{articulo}}\1", xml)
        if count > 1:
            raise RuntimeError(f"Se encontraron varias repeticiones inesperadas en {path.name}")
        ElementTree.fromstring(updated.encode("utf-8"))
        entries = [
            (
                item,
                updated.encode("utf-8")
                if item.filename == "word/document.xml"
                else source.read(item.filename),
            )
            for item in source.infolist()
        ]

    with tempfile.NamedTemporaryFile(
        prefix=f"{path.stem}-", suffix=".docx", delete=False, dir=path.parent
    ) as temporary:
        temporary_path = Path(temporary.name)

    with zipfile.ZipFile(temporary_path, "w") as target:
        for item, content in entries:
            target.writestr(item, content)

    try:
        os.replace(temporary_path, path)
    finally:
        if temporary_path is not None:
            temporary_path.unlink(missing_ok=True)

    print(f"Actualizado: {path} (repeticiones corregidas: {count})")


for filename in FILES:
    fix_docx(TEMPLATES / filename)
