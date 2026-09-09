"""Собирает TDR_vXX_ca.md в .docx: заголовки, таблицы, картинки с подписями, ссылки.

Запуск:
    python build_docx.py draft/TDR_v06_ca.md output/TDR_v06.docx
"""
import re
import sys
from pathlib import Path

from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Pt, RGBColor

ROOT = Path(__file__).resolve().parent
ASSETS = ROOT / "assets"
FIGURE_WIDTH = Cm(14)

TITLE = "Aromes, destil·lació i ultrasons"
SUBTITLE = ("Comparació entre hidrodestil·lació convencional i assistida "
            "per ultrasons en pètals de rosa")
AUTHOR = "Georgijs Topolevs"
SCHOOL = "Col·legi Immaculada Concepció — Lloret de Mar"
COURSE = "Treball de Recerca · 2n de Batxillerat · Curs 2026-27"
TUTOR = "Tutora: Raquel Arévalo González"

FIGURE_RE = re.compile(r"^\[FIGURA:\s*([^|]+)\|([^|]*)\|([^\]]*)\]$")
VIDEO_RE = re.compile(r"^\[VIDEO:\s*([^|]+)\|([^|]+)\|([^|]*)\|([^\]]*)\]$")
BOLD_ITALIC_RE = re.compile(r"(\*\*[^*]+\*\*|\*[^*]+\*)")


def add_runs(paragraph, text: str) -> None:
    """Разбирает **жирный** и *курсив* внутри абзаца."""
    for piece in BOLD_ITALIC_RE.split(text):
        if not piece:
            continue
        if piece.startswith("**") and piece.endswith("**"):
            paragraph.add_run(piece[2:-2]).bold = True
        elif piece.startswith("*") and piece.endswith("*"):
            paragraph.add_run(piece[1:-1]).italic = True
        else:
            paragraph.add_run(piece)


def add_hyperlink(paragraph, url: str, text: str) -> None:
    """python-docx не умеет ссылки из коробки — добавляем через XML."""
    part = paragraph.part
    r_id = part.relate_to(
        url,
        "http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink",
        is_external=True,
    )
    link = paragraph._p.makeelement(qn("w:hyperlink"), {qn("r:id"): r_id})
    run = paragraph._p.makeelement(qn("w:r"), {})
    props = paragraph._p.makeelement(qn("w:rPr"), {})
    color = paragraph._p.makeelement(qn("w:color"), {qn("w:val"): "0563C1"})
    underline = paragraph._p.makeelement(qn("w:u"), {qn("w:val"): "single"})
    props.append(color)
    props.append(underline)
    run.append(props)
    text_el = paragraph._p.makeelement(qn("w:t"), {})
    text_el.text = text
    run.append(text_el)
    link.append(run)
    paragraph._p.append(link)


def add_toc(document) -> None:
    """Настоящее поле оглавления: Word и Google Документы заполняют его сами."""
    # Заголовок оглавления намеренно не Heading: иначе оглавление попадает само в себя
    title = document.add_paragraph()
    title_run = title.add_run("Índex")
    title_run.bold = True
    title_run.font.size = Pt(16)
    paragraph = document.add_paragraph()
    run = paragraph.add_run()
    begin = OxmlElement("w:fldChar")
    begin.set(qn("w:fldCharType"), "begin")
    instruction = OxmlElement("w:instrText")
    instruction.set(qn("xml:space"), "preserve")
    instruction.text = r'TOC \o "1-3" \h \z \u'
    separate = OxmlElement("w:fldChar")
    separate.set(qn("w:fldCharType"), "separate")
    placeholder = OxmlElement("w:t")
    placeholder.text = "Índex (actualitza el camp per veure les pàgines)"
    end = OxmlElement("w:fldChar")
    end.set(qn("w:fldCharType"), "end")
    for element in (begin, instruction, separate, placeholder, end):
        run._r.append(element)


def add_caption(document, caption: str, source: str) -> None:
    paragraph = document.add_paragraph()
    paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = paragraph.add_run(caption)
    run.italic = True
    run.font.size = Pt(9)
    if source:
        run = paragraph.add_run(f"  Font: {source}")
        run.italic = True
        run.font.size = Pt(8)
        run.font.color.rgb = RGBColor(0x60, 0x60, 0x60)


def add_image(document, filename: str) -> bool:
    path = ASSETS / filename.strip()
    if not path.exists():
        print(f"  ! нет файла {path.name}")
        return False
    document.add_picture(str(path), width=FIGURE_WIDTH)
    document.paragraphs[-1].alignment = WD_ALIGN_PARAGRAPH.CENTER
    return True


def add_table(document, rows: list[str]) -> None:
    parsed = [[cell.strip() for cell in row.strip().strip("|").split("|")] for row in rows]
    header, body = parsed[0], parsed[2:]          # строка 1 — заголовок, строка 2 — разделитель
    table = document.add_table(rows=1, cols=len(header))
    table.style = "Light Grid Accent 1"
    for index, cell_text in enumerate(header):
        cell = table.rows[0].cells[index]
        cell.text = ""
        add_runs(cell.paragraphs[0], cell_text)
        for run in cell.paragraphs[0].runs:
            run.bold = True
    for row in body:
        cells = table.add_row().cells
        for index, cell_text in enumerate(row[:len(header)]):
            cells[index].text = ""
            add_runs(cells[index].paragraphs[0], cell_text)


def build(source: Path, target: Path) -> None:
    document = Document()
    style = document.styles["Normal"]
    style.font.name = "Times New Roman"
    style.font.size = Pt(12)

    for text, size, bold in ((TITLE, 26, True), (SUBTITLE, 14, False)):
        paragraph = document.add_paragraph()
        paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
        run = paragraph.add_run(text)
        run.font.size = Pt(size)
        run.bold = bold
    document.add_paragraph()
    for line in (AUTHOR, COURSE, SCHOOL, TUTOR):
        paragraph = document.add_paragraph()
        paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
        paragraph.add_run(line).font.size = Pt(12)
    document.add_page_break()

    add_toc(document)
    document.add_page_break()

    lines = source.read_text(encoding="utf-8").splitlines()
    index, figures = 0, 0
    while index < len(lines):
        line = lines[index].rstrip()

        if not line.strip() or line.startswith("<!--"):
            index += 1
            continue

        if line.startswith("|") and index + 1 < len(lines) and set(lines[index + 1].replace("|", "").strip()) <= set("-: "):
            block = []
            while index < len(lines) and lines[index].startswith("|"):
                block.append(lines[index])
                index += 1
            add_table(document, block)
            document.add_paragraph()
            continue

        figure = FIGURE_RE.match(line)
        if figure:
            if add_image(document, figure.group(1)):
                figures += 1
                add_caption(document, f"Figura {figures}. {figure.group(2).strip()}", figure.group(3).strip())
            index += 1
            continue

        video = VIDEO_RE.match(line)
        if video:
            if add_image(document, video.group(1)):
                figures += 1
                add_caption(document, f"Figura {figures}. {video.group(3).strip()}", video.group(4).strip())
            paragraph = document.add_paragraph()
            paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
            add_hyperlink(paragraph, video.group(2).strip(), "Veure el vídeo")
            index += 1
            continue

        if line.startswith("#### "):
            document.add_heading(line[5:].strip(), level=3)
        elif line.startswith("### "):
            document.add_heading(line[4:].strip(), level=2)
        elif line.startswith("## "):
            document.add_heading(line[3:].strip(), level=1)
        elif line.startswith("> "):
            paragraph = document.add_paragraph()
            paragraph.paragraph_format.left_indent = Cm(1)
            run_text = line[2:].strip()
            add_runs(paragraph, run_text)
            for run in paragraph.runs:
                run.italic = True
        elif line.startswith("- "):
            add_runs(document.add_paragraph(style="List Bullet"), line[2:].strip())
        elif re.match(r"^\d+\.\s", line):
            add_runs(document.add_paragraph(style="List Number"), re.sub(r"^\d+\.\s", "", line))
        else:
            add_runs(document.add_paragraph(), line.strip())
        index += 1

    target.parent.mkdir(parents=True, exist_ok=True)
    document.save(str(target))
    print(f"Готово: {target}  ({figures} иллюстраций)")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit("Использование: build_docx.py <draft.md> <output.docx>")
    build(Path(sys.argv[1]), Path(sys.argv[2]))
