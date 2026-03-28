import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

type PdfSectionBlock =
  | { type: "paragraph"; text: string }
  | { type: "bullets"; items: string[] }
  | { type: "facts"; items: Array<{ label: string; value: string }> }
  | { type: "highlight"; label: string; value: string };

type PdfSection = {
  title: string;
  description?: string;
  blocks: PdfSectionBlock[];
};

function wrapLines(text: string, maxWidth: number, measure: (value: string) => number) {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (measure(next) <= maxWidth) {
      current = next;
      continue;
    }
    if (current) lines.push(current);
    current = word;
  }

  if (current) lines.push(current);
  return lines;
}

export async function createMarketingProposalPdf(input: {
  title: string;
  subtitle: string;
  sections: PdfSection[];
}) {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const margin = 42;
  const contentWidth = pageWidth - margin * 2;
  const bodyFontSize = 11;
  const smallFontSize = 9;
  const lineHeight = 16;

  let page = doc.addPage([pageWidth, pageHeight]);
  const pages = [page];
  let cursorY = pageHeight - margin;

  function drawHeader(target: typeof page) {
    target.drawRectangle({
      x: margin,
      y: pageHeight - margin - 64,
      width: contentWidth,
      height: 64,
      color: rgb(0.96, 0.98, 1),
      borderColor: rgb(0.82, 0.88, 0.98),
      borderWidth: 1,
    });

    target.drawText(input.title, {
      x: margin + 16,
      y: pageHeight - margin - 24,
      size: 18,
      font: bold,
      color: rgb(0.06, 0.1, 0.18),
    });

    target.drawText(input.subtitle, {
      x: margin + 16,
      y: pageHeight - margin - 43,
      size: 10,
      font,
      color: rgb(0.32, 0.38, 0.46),
    });

    target.drawLine({
      start: { x: margin, y: pageHeight - margin - 72 },
      end: { x: pageWidth - margin, y: pageHeight - margin - 72 },
      thickness: 1,
      color: rgb(0.84, 0.88, 0.95),
    });
  }

  function ensureSpace(minHeight: number) {
    if (cursorY < margin + minHeight) {
      page = doc.addPage([pageWidth, pageHeight]);
      pages.push(page);
      drawHeader(page);
      cursorY = pageHeight - margin - 94;
    }
  }

  function drawWrappedText(
    text: string,
    x: number,
    width: number,
    opts?: { bold?: boolean; color?: [number, number, number] },
  ) {
    const activeFont = opts?.bold ? bold : font;
    const lines = wrapLines(text, width, (value) => activeFont.widthOfTextAtSize(value, bodyFontSize));

    for (const line of lines) {
      ensureSpace(24);
      page.drawText(line, {
        x,
        y: cursorY,
        size: bodyFontSize,
        font: activeFont,
        color: rgb(...(opts?.color ?? [0.18, 0.22, 0.28])),
      });
      cursorY -= lineHeight;
    }
  }

  drawHeader(page);
  cursorY = pageHeight - margin - 94;

  for (const section of input.sections) {
    ensureSpace(56);

    page.drawText(section.title, {
      x: margin,
      y: cursorY,
      size: 14,
      font: bold,
      color: rgb(0.1, 0.14, 0.2),
    });
    cursorY -= 9;

    page.drawLine({
      start: { x: margin, y: cursorY },
      end: { x: pageWidth - margin, y: cursorY },
      thickness: 1,
      color: rgb(0.86, 0.9, 0.95),
    });
    cursorY -= 16;

    if (section.description) {
      drawWrappedText(section.description, margin, contentWidth, { color: [0.35, 0.4, 0.48] });
      cursorY -= 4;
    }

    for (const block of section.blocks) {
      if (block.type === "paragraph") {
        drawWrappedText(block.text, margin, contentWidth);
        cursorY -= 6;
        continue;
      }

      if (block.type === "bullets") {
        for (const item of block.items) {
          ensureSpace(22);
          page.drawCircle({
            x: margin + 6,
            y: cursorY + 5,
            size: 2.2,
            color: rgb(0, 0.48, 1),
          });
          drawWrappedText(item, margin + 16, contentWidth - 16);
        }
        cursorY -= 6;
        continue;
      }

      if (block.type === "highlight") {
        ensureSpace(64);
        page.drawRectangle({
          x: margin,
          y: cursorY - 48,
          width: contentWidth,
          height: 48,
          color: rgb(0.96, 0.98, 1),
          borderColor: rgb(0.62, 0.79, 0.98),
          borderWidth: 1,
        });
        page.drawText(block.label.toUpperCase(), {
          x: margin + 14,
          y: cursorY - 16,
          size: smallFontSize,
          font: bold,
          color: rgb(0, 0.36, 0.76),
        });
        page.drawText(block.value, {
          x: margin + 14,
          y: cursorY - 33,
          size: 12,
          font: bold,
          color: rgb(0.12, 0.14, 0.18),
        });
        cursorY -= 58;
        continue;
      }

      if (block.type === "facts") {
        for (const item of block.items) {
          ensureSpace(22);
          page.drawText(item.label, {
            x: margin,
            y: cursorY,
            size: bodyFontSize,
            font: bold,
            color: rgb(0.18, 0.2, 0.24),
          });
          const labelWidth = bold.widthOfTextAtSize(item.label, bodyFontSize) + 8;
          drawWrappedText(item.value, margin + labelWidth, contentWidth - labelWidth);
        }
        cursorY -= 6;
      }
    }

    cursorY -= 8;
  }

  pages.forEach((target, index) => {
    target.drawLine({
      start: { x: margin, y: margin - 12 },
      end: { x: pageWidth - margin, y: margin - 12 },
      thickness: 1,
      color: rgb(0.88, 0.9, 0.94),
    });
    target.drawText(`Página ${index + 1}`, {
      x: pageWidth - margin - 52,
      y: margin - 26,
      size: 9,
      font,
      color: rgb(0.45, 0.48, 0.53),
    });
  });

  return doc.save();
}
