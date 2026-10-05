from __future__ import annotations

import os
import tempfile
import zipfile
from pathlib import Path
from xml.etree import ElementTree


ROOT = Path(__file__).resolve().parents[1]
TEMPLATES = ROOT / "templates"


EDITIONS = {
    "proyecto-grado.docx": [("<w:t>19</w:t>", "<w:t>{{pagina}}</w:t>")],
    "tesis_word_actualizada.docx": [("<w:t>06</w:t>", "<w:t>{{pagina}}</w:t>")],
    "excelencia-1-tribunal.docx": [
        ("<w:t>3</w:t>", "<w:t>{{pagina}}</w:t>"),
        ("<w:t>3</w:t>", "<w:t></w:t>"),
    ],
    "excelencia-2-tribunales.docx": [
        ("<w:t>3</w:t>", "<w:t>{{pagina}}</w:t>"),
        ("<w:t>3</w:t>", "<w:t></w:t>"),
    ],
    "excelencia.docx": [
        ("<w:t>3</w:t>", "<w:t>{{pagina}}</w:t>"),
        ("<w:t>3</w:t>", "<w:t></w:t>"),
    ],
    "trab-dirigido-1-tribunal.docx": [],
    "trab-dirigido-2-tribunales.docx": [],
    "examen-grado.docx": [],
}


def update_header(path: Path, edits: list[tuple[str, str]]) -> None:
    temporary_path: Path | None = None
    with zipfile.ZipFile(path, "r") as source:
        header_name = "word/header1.xml"
        xml = source.read(header_name).decode("utf-8")
        for old, new in edits:
            if old in xml:
                xml = xml.replace(old, new, 1)
        ElementTree.fromstring(xml.encode("utf-8"))

        with tempfile.NamedTemporaryFile(
            prefix=f"{path.stem}-", suffix=".docx", delete=False, dir=path.parent
        ) as temporary:
            temporary_path = Path(temporary.name)

        with zipfile.ZipFile(temporary_path, "w") as target:
            for item in source.infolist():
                content = (
                    xml.encode("utf-8")
                    if item.filename == header_name
                    else source.read(item.filename)
                )
                target.writestr(item, content)

    try:
        if temporary_path is None:
            raise RuntimeError("No se pudo preparar el archivo temporal.")
        os.replace(temporary_path, path)
    finally:
        if temporary_path is not None:
            temporary_path.unlink(missing_ok=True)


def main() -> None:
    for filename, edits in EDITIONS.items():
        path = TEMPLATES / filename
        update_header(path, edits + [("<w:t>9</w:t>", "<w:t>{{libro}}</w:t>")])
        print(f"Actualizado: {path}")


if __name__ == "__main__":
    main()
