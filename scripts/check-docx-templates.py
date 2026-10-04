"""Check DOCX compatibility declarations; --fix restores missing namespace bindings.

Run with Python 3: python scripts/check-docx-templates.py [--fix]
Only namespace declarations are added. Content, styles and placeholders are preserved.
"""

import argparse
from io import BytesIO
from pathlib import Path
import re
import xml.etree.ElementTree as ET
from zipfile import ZipFile

MC = "http://schemas.openxmlformats.org/markup-compatibility/2006"
ROOT = Path(__file__).resolve().parents[1]


def namespace_errors(xml):
    scopes = []
    pending = {}
    errors = set()
    for event, item in ET.iterparse(BytesIO(xml), events=("start-ns", "start", "end")):
        if event == "start-ns":
            pending[item[0]] = item[1]
        elif event == "start":
            scope = {"xml": "http://www.w3.org/XML/1998/namespace"}
            if scopes:
                scope.update(scopes[-1])
            scope.update(pending)
            pending.clear()
            scopes.append(scope)
            for name in ("Ignorable", "MustUnderstand", "ProcessContent", "PreserveElements", "PreserveAttributes"):
                for token in item.get(f"{{{MC}}}{name}", "").split():
                    prefix = token.split(":")[0]
                    if prefix not in scope:
                        errors.add(prefix)
            if item.tag == f"{{{MC}}}Choice":
                for prefix in item.get("Requires", "").split():
                    if prefix not in scope:
                        errors.add(prefix)
        else:
            scopes.pop()
    return errors


def check_template(path, fix=False):
    with ZipFile(path) as archive:
        if archive.testzip():
            raise ValueError(f"{path.name}: invalid ZIP checksum")
        members = [(info, archive.read(info)) for info in archive.infolist()]
        declarations = {}
        for info, content in members:
            if info.filename.endswith(".xml"):
                for _, (prefix, uri) in ET.iterparse(BytesIO(content), events=("start-ns",)):
                    declarations.setdefault(prefix, set()).add(uri)
        changed = []
        issues = 0
        for info, content in members:
            if info.filename.endswith(".xml"):
                missing = namespace_errors(content)
                if missing:
                    issues += len(missing)
                    print(f"{path.name}: {info.filename}: missing {', '.join(sorted(missing))}")
                    if fix:
                        additions = []
                        for prefix in sorted(missing):
                            uris = declarations.get(prefix, set())
                            if len(uris) != 1:
                                raise ValueError(f"Cannot determine namespace for {prefix}: {uris}")
                            additions.append(f' xmlns:{prefix}="{next(iter(uris))}"'.encode())
                        root = re.search(rb"<(?![!?])[^>]+>", content)
                        if root is None:
                            raise ValueError("Missing XML root")
                        position = root.end() - (2 if root.group().endswith(b"/>") else 1)
                        repaired = content[:position] + b"".join(additions) + content[position:]
                        assert not namespace_errors(repaired)
                        # Expanded names, values, text and formatting must remain identical.
                        assert ET.tostring(ET.fromstring(content)) == ET.tostring(ET.fromstring(repaired))
                        content = repaired
            changed.append((info, content))
        comment = archive.comment
    if fix and issues:
        temporary = path.with_suffix(".docx.tmp")
        try:
            with ZipFile(temporary, "w") as output:
                output.comment = comment
                for info, content in changed:
                    output.writestr(info, content)
            temporary.replace(path)
        finally:
            temporary.unlink(missing_ok=True)
        print(f"{path.name}: repaired {issues} declarations; content unchanged")
    return issues


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--fix", action="store_true")
    args = parser.parse_args()
    paths = sorted((ROOT / "templates").glob("*.docx"))
    issues = sum(check_template(path, args.fix) for path in paths)
    if args.fix:
        issues = sum(check_template(path) for path in paths)
    print(f"Checked {len(paths)} templates; remaining namespace errors: {issues}")
    raise SystemExit(1 if issues else 0)
