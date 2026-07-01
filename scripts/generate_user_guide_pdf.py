from __future__ import annotations

import html
import re
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    HRFlowable,
    ListFlowable,
    ListItem,
    PageBreak,
    Paragraph,
    Preformatted,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "docs" / "USER_GUIDE.md"
OUTPUT = ROOT / "output" / "pdf" / "Huong_dan_su_dung_Auto_Accept_GGMeet.pdf"


def register_fonts() -> tuple[str, str, str]:
    candidates = {
        "regular": [
            Path(r"C:\Windows\Fonts\arial.ttf"),
            Path(r"C:\Windows\Fonts\segoeui.ttf"),
        ],
        "bold": [
            Path(r"C:\Windows\Fonts\arialbd.ttf"),
            Path(r"C:\Windows\Fonts\segoeuib.ttf"),
        ],
        "italic": [
            Path(r"C:\Windows\Fonts\ariali.ttf"),
            Path(r"C:\Windows\Fonts\segoeuii.ttf"),
        ],
    }
    chosen = {}
    for key, paths in candidates.items():
        for path in paths:
            if path.exists():
                chosen[key] = path
                break
        if key not in chosen:
            raise FileNotFoundError(f"Missing Vietnamese-capable font for {key}")

    pdfmetrics.registerFont(TTFont("GuideSans", str(chosen["regular"])))
    pdfmetrics.registerFont(TTFont("GuideSans-Bold", str(chosen["bold"])))
    pdfmetrics.registerFont(TTFont("GuideSans-Italic", str(chosen["italic"])))
    return "GuideSans", "GuideSans-Bold", "GuideSans-Italic"


def inline_markup(text: str) -> str:
    text = html.escape(text)
    text = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", text)
    text = re.sub(
        r"`([^`]+)`",
        lambda match: f"<font name='GuideMono' color='#0f766e'>{match.group(1)}</font>",
        text,
    )
    return text


def make_styles() -> dict[str, ParagraphStyle]:
    base = getSampleStyleSheet()
    return {
        "title": ParagraphStyle(
            "Title",
            parent=base["Title"],
            fontName="GuideSans-Bold",
            fontSize=24,
            leading=30,
            alignment=TA_CENTER,
            textColor=colors.HexColor("#0f172a"),
            spaceAfter=14,
        ),
        "subtitle": ParagraphStyle(
            "Subtitle",
            parent=base["Normal"],
            fontName="GuideSans",
            fontSize=10.5,
            leading=15,
            alignment=TA_CENTER,
            textColor=colors.HexColor("#475569"),
            spaceAfter=8,
        ),
        "h2": ParagraphStyle(
            "Heading2",
            parent=base["Heading2"],
            fontName="GuideSans-Bold",
            fontSize=15,
            leading=20,
            textColor=colors.HexColor("#0f766e"),
            spaceBefore=12,
            spaceAfter=7,
            keepWithNext=True,
        ),
        "h3": ParagraphStyle(
            "Heading3",
            parent=base["Heading3"],
            fontName="GuideSans-Bold",
            fontSize=12,
            leading=16,
            textColor=colors.HexColor("#334155"),
            spaceBefore=9,
            spaceAfter=5,
            keepWithNext=True,
        ),
        "body": ParagraphStyle(
            "Body",
            parent=base["BodyText"],
            fontName="GuideSans",
            fontSize=10,
            leading=15,
            alignment=TA_LEFT,
            textColor=colors.HexColor("#1f2937"),
            spaceAfter=6,
        ),
        "bullet": ParagraphStyle(
            "Bullet",
            parent=base["BodyText"],
            fontName="GuideSans",
            fontSize=9.7,
            leading=14,
            leftIndent=0,
            firstLineIndent=0,
            textColor=colors.HexColor("#1f2937"),
            spaceAfter=3,
        ),
        "quote": ParagraphStyle(
            "Quote",
            parent=base["BodyText"],
            fontName="GuideSans-Italic",
            fontSize=9.5,
            leading=14,
            leftIndent=10,
            rightIndent=10,
            textColor=colors.HexColor("#475569"),
            backColor=colors.HexColor("#f8fafc"),
            borderColor=colors.HexColor("#99f6e4"),
            borderWidth=0.6,
            borderPadding=6,
            spaceAfter=8,
        ),
        "code": ParagraphStyle(
            "Code",
            parent=base["Code"],
            fontName="GuideMono",
            fontSize=8.5,
            leading=12,
            textColor=colors.HexColor("#0f172a"),
            backColor=colors.HexColor("#f1f5f9"),
            borderColor=colors.HexColor("#cbd5e1"),
            borderWidth=0.5,
            borderPadding=7,
            spaceBefore=3,
            spaceAfter=8,
        ),
    }


def flush_list(story, pending_items, styles, ordered=False):
    if not pending_items:
        return
    flowable = ListFlowable(
        [
            ListItem(
                Paragraph(inline_markup(item), styles["bullet"]),
                leftIndent=12,
            )
            for item in pending_items
        ],
        bulletType="1" if ordered else "bullet",
        start="1" if ordered else None,
        leftIndent=18,
        bulletFontName="GuideSans",
        bulletFontSize=8,
    )
    story.append(flowable)
    story.append(Spacer(1, 4))
    pending_items.clear()


def build_story(markdown: str, styles: dict[str, ParagraphStyle]):
    story = []
    pending_bullets: list[str] = []
    pending_numbers: list[str] = []
    in_code = False
    code_lines: list[str] = []

    lines = markdown.splitlines()
    first_title = True

    for raw in lines:
        line = raw.rstrip()

        if line.startswith("```"):
            if in_code:
                story.append(Preformatted("\n".join(code_lines), styles["code"]))
                code_lines = []
                in_code = False
            else:
                flush_list(story, pending_bullets, styles)
                flush_list(story, pending_numbers, styles, ordered=True)
                in_code = True
            continue

        if in_code:
            code_lines.append(line)
            continue

        if not line.strip():
            flush_list(story, pending_bullets, styles)
            flush_list(story, pending_numbers, styles, ordered=True)
            story.append(Spacer(1, 3))
            continue

        bullet_match = re.match(r"^\s*-\s+(.+)$", line)
        number_match = re.match(r"^\s*\d+\.\s+(.+)$", line)

        if bullet_match:
            flush_list(story, pending_numbers, styles, ordered=True)
            pending_bullets.append(bullet_match.group(1))
            continue

        if number_match:
            flush_list(story, pending_bullets, styles)
            pending_numbers.append(number_match.group(1))
            continue

        flush_list(story, pending_bullets, styles)
        flush_list(story, pending_numbers, styles, ordered=True)

        if line.startswith("# "):
            if first_title:
                story.append(Paragraph(inline_markup(line[2:]), styles["title"]))
                story.append(HRFlowable(width="46%", color=colors.HexColor("#14b8a6"), thickness=1.2, spaceAfter=12))
                first_title = False
            else:
                story.append(PageBreak())
                story.append(Paragraph(inline_markup(line[2:]), styles["title"]))
            continue

        if line.startswith("## "):
            story.append(Paragraph(inline_markup(line[3:]), styles["h2"]))
            continue

        if line.startswith("### "):
            story.append(Paragraph(inline_markup(line[4:]), styles["h3"]))
            continue

        if line.startswith("> "):
            story.append(Paragraph(inline_markup(line[2:]), styles["quote"]))
            continue

        story.append(Paragraph(inline_markup(line), styles["body"]))

    flush_list(story, pending_bullets, styles)
    flush_list(story, pending_numbers, styles, ordered=True)
    return story


def draw_footer(canvas, doc):
    canvas.saveState()
    canvas.setFont("GuideSans", 8)
    canvas.setFillColor(colors.HexColor("#64748b"))
    width, _height = A4
    footer = f"Auto Accept GGMeet - Huong dan su dung - Trang {doc.page}"
    canvas.drawCentredString(width / 2, 0.9 * cm, footer)
    canvas.restoreState()


def main():
    register_fonts()
    pdfmetrics.registerFont(TTFont("GuideMono", r"C:\Windows\Fonts\consola.ttf"))
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)

    markdown = SOURCE.read_text(encoding="utf-8")
    styles = make_styles()
    story = build_story(markdown, styles)

    doc = SimpleDocTemplate(
        str(OUTPUT),
        pagesize=A4,
        rightMargin=1.55 * cm,
        leftMargin=1.55 * cm,
        topMargin=1.55 * cm,
        bottomMargin=1.45 * cm,
        title="Huong dan su dung Auto Accept GGMeet",
        author="Mike-AutoMeet",
        subject="Huong dan cai dat va su dung extension Google Meet",
    )
    doc.build(story, onFirstPage=draw_footer, onLaterPages=draw_footer)
    print(OUTPUT)


if __name__ == "__main__":
    main()
