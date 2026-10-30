import re
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.section import WD_ORIENT

def export_markdown_to_landscape_docx(md_filepath: str, docx_filepath: str):
    doc = Document()

    # Configuration en mode Paysage (Landscape) avec marges fines pour des tableaux larges non tronqués
    section = doc.sections[0]
    section.orientation = WD_ORIENT.LANDSCAPE
    section.page_width = Inches(11.69)   # A4 Paysage Largeur
    section.page_height = Inches(8.27)   # A4 Paysage Hauteur
    section.left_margin = Inches(0.5)
    section.right_margin = Inches(0.5)
    section.top_margin = Inches(0.5)
    section.bottom_margin = Inches(0.5)

    with open(md_filepath, "r", encoding="utf-8") as f:
        lines = f.readlines()

    table_buffer = []
    in_code_block = False
    code_buffer = []

    def flush_table(buf):
        if not buf:
            return
        rows = [[cell.strip() for cell in r.strip("|").split("|")] for r in buf if not re.match(r"^\|[\s\-:|]+\|$", r.strip())]
        if not rows:
            return
        cols_count = max(len(r) for r in rows)
        table = doc.add_table(rows=len(rows), cols=cols_count)
        table.style = "Table Grid"
        table.autofit = True
        for r_idx, row_data in enumerate(rows):
            for c_idx, val in enumerate(row_data):
                if c_idx < cols_count:
                    cell = table.cell(r_idx, c_idx)
                    clean_val = val.replace("<br>", "\n").replace("**", "")
                    cell.text = clean_val
                    for paragraph in cell.paragraphs:
                        for run in paragraph.runs:
                            run.font.size = Pt(8.5)
                            if r_idx == 0:
                                run.font.bold = True
        doc.add_paragraph()

    for line in lines:
        stripped = line.rstrip("\n")
        if stripped.startswith("```"):
            if in_code_block:
                p = doc.add_paragraph("\n".join(code_buffer))
                p.style = "No Spacing"
                for run in p.runs:
                    run.font.name = "Consolas"
                    run.font.size = Pt(8)
                    run.font.color.rgb = RGBColor(30, 41, 59)
                code_buffer = []
                in_code_block = False
            else:
                flush_table(table_buffer)
                table_buffer = []
                in_code_block = True
            continue

        if in_code_block:
            code_buffer.append(stripped)
            continue

        if stripped.startswith("|") and stripped.endswith("|"):
            table_buffer.append(stripped)
            continue
        else:
            if table_buffer:
                flush_table(table_buffer)
                table_buffer = []

        if stripped.startswith("# "):
            doc.add_heading(stripped[2:], level=1)
        elif stripped.startswith("## "):
            doc.add_heading(stripped[3:], level=2)
        elif stripped.startswith("### "):
            doc.add_heading(stripped[4:], level=3)
        elif stripped.startswith("* ") or stripped.startswith("- "):
            doc.add_paragraph(stripped[2:].replace("**", ""), style="List Bullet")
        elif stripped:
            doc.add_paragraph(stripped.replace("**", ""))

    if table_buffer:
        flush_table(table_buffer)

    doc.save(docx_filepath)
    print(f"Document Word généré avec succès : {docx_filepath}")

if __name__ == "__main__":
    export_markdown_to_landscape_docx("MASTER_SPEC.md", "MASTER_SPEC_TELEMETRY_DZ.docx")
