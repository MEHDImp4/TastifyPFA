"""
Generates a professional PDF from the TastifyPFA PRD markdown file.
Uses reportlab for direct PDF generation.
"""
import os
import re
import sys
from pathlib import Path
from datetime import datetime

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm, inch
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from markdown import markdown

PRD_FILE = PROJECT_ROOT / "docs" / "PRD_TastifyPFA_v2.md"
OUTPUT_PDF = PROJECT_ROOT / "docs" / "PRD_TastifyPFA_v2.pdf"

class PRDDocument:
    def __init__(self):
        self.styles = getSampleStyleSheet()
        self.elements = []
        self._setup_custom_styles()

    def _setup_custom_styles(self):
        for style_name in ['PRD_Title', 'PRD_H1', 'PRD_H2', 'PRD_H3', 'PRD_Body']:
            if style_name in self.styles:
                del self.styles[style_name]

        self.styles.add(ParagraphStyle(
            name='PRD_Title',
            parent=self.styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#237A9E'),
            spaceAfter=20,
            spaceBefore=30,
            keepWithNext=True,
        ))
        self.styles.add(ParagraphStyle(
            name='PRD_H1',
            parent=self.styles['Heading1'],
            fontSize=18,
            textColor=colors.HexColor('#237A9E'),
            spaceAfter=12,
            spaceBefore=20,
            keepWithNext=True,
        ))
        self.styles.add(ParagraphStyle(
            name='PRD_H2',
            parent=self.styles['Heading2'],
            fontSize=14,
            textColor=colors.HexColor('#2D6A4F'),
            spaceAfter=10,
            spaceBefore=15,
        ))
        self.styles.add(ParagraphStyle(
            name='PRD_H3',
            parent=self.styles['Heading3'],
            fontSize=12,
            textColor=colors.HexColor('#1A1A1A'),
            spaceAfter=8,
            spaceBefore=10,
            bold=True,
        ))
        self.styles.add(ParagraphStyle(
            name='PRD_Body',
            parent=self.styles['Normal'],
            fontSize=10,
            textColor=colors.HexColor('#1A1A1A'),
            spaceAfter=6,
            alignment=4,
        ))
        self.styles.add(ParagraphStyle(
            name='PRD_TableCell',
            parent=self.styles['Normal'],
            fontSize=9,
            textColor=colors.HexColor('#1A1A1A'),
        ))

    def _parse_content(self, content):
        lines = content.split('\n')
        i = 0
        while i < len(lines):
            line = lines[i].strip()

            if not line:
                i += 1
                continue

            if line.startswith('# '):
                self.elements.append(Spacer(1, 0.3*inch))
                self.elements.append(Paragraph(line[2:], self.styles['PRD_Title']))
                i += 1
                continue

            if line.startswith('## '):
                self.elements.append(Spacer(1, 0.2*inch))
                self.elements.append(Paragraph(line[3:], self.styles['PRD_H1']))
                i += 1
                continue

            if line.startswith('### '):
                self.elements.append(Spacer(1, 0.15*inch))
                self.elements.append(Paragraph(line[4:], self.styles['PRD_H2']))
                i += 1
                continue

            if line.startswith('#### '):
                self.elements.append(Spacer(1, 0.1*inch))
                self.elements.append(Paragraph(line[5:], self.styles['PRD_H3']))
                i += 1
                continue

            if line.startswith('---'):
                self.elements.append(Spacer(1, 0.2*inch))
                i += 1
                continue

            if line.startswith('|') and '---' not in line:
                table_data = []
                while i < len(lines) and lines[i].strip().startswith('|'):
                    row = [cell.strip() for cell in lines[i].strip().split('|')[1:-1]]
                    if any(cell.strip() for cell in row):
                        table_data.append(row)
                    i += 1
                if table_data:
                    self._create_table(table_data)
                continue

            if line.startswith('- ') or line.startswith('* '):
                bullet_text = f"• {line[2:]}"
                self.elements.append(Paragraph(bullet_text, self.styles['PRD_Body']))
                i += 1
                continue

            if line[0].isdigit() and '. ' in line:
                num = line.split('.')[0]
                text = line[line.index('. ')+2:]
                self.elements.append(Paragraph(f"{num}. {text}", self.styles['PRD_Body']))
                i += 1
                continue

            if line.startswith('|'):
                i += 1
                continue

            self.elements.append(Paragraph(line, self.styles['PRD_Body']))
            i += 1

    def _create_table(self, data):
        if not data:
            return
        col_widths = [2*inch] * len(data[0]) if data else []
        t = Table(data, colWidths=col_widths)
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#237A9E')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 9),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
            ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#F8F9FA')),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ]))
        self.elements.append(Spacer(1, 0.1*inch))
        self.elements.append(t)
        self.elements.append(Spacer(1, 0.1*inch))

    def generate(self):
        if not PRD_FILE.exists():
            print(f"Error: PRD file not found: {PRD_FILE}")
            sys.exit(1)

        with open(PRD_FILE, 'r', encoding='utf-8') as f:
            content = f.read()

        doc = SimpleDocTemplate(
            str(OUTPUT_PDF),
            pagesize=A4,
            rightMargin=0.75*inch,
            leftMargin=0.75*inch,
            topMargin=0.75*inch,
            bottomMargin=0.75*inch,
        )

        self._parse_content(content)

        doc.build(self.elements)
        print(f"PDF generated: {OUTPUT_PDF}")
        return OUTPUT_PDF


if __name__ == "__main__":
    generator = PRDDocument()
    output = generator.generate()
    print(f"PRD PDF generated successfully!")
    print(f"File: {output}")