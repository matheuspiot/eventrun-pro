import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

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
    if (current) {
      lines.push(current);
    }
    current = word;
  }

  if (current) {
    lines.push(current);
  }

  return lines;
}

export async function createMarketingProposalPdf(input: {
  title: string;
  subtitle: string;
  bodyLines: string[];
}) {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const margin = 42;
  const maxWidth = pageWidth - margin * 2;
  const lineHeight = 16;
  const fontSize = 11;

  let page = doc.addPage([pageWidth, pageHeight]);
  let cursorY = pageHeight - margin;
  const pages = [page];

  function drawHeader(target: typeof page) {
    target.drawText(input.title, {
      x: margin,
      y: pageHeight - margin,
      size: 18,
      font: bold,
      color: rgb(0.12, 0.14, 0.18),
    });
    target.drawText(input.subtitle, {
      x: margin,
      y: pageHeight - margin - 20,
      size: 10,
      font,
      color: rgb(0.37, 0.41, 0.47),
    });
    target.drawLine({
      start: { x: margin, y: pageHeight - margin - 28 },
      end: { x: pageWidth - margin, y: pageHeight - margin - 28 },
      thickness: 1,
      color: rgb(0.87, 0.88, 0.9),
    });
  }

  drawHeader(page);
  cursorY = pageHeight - margin - 48;

  for (const paragraph of input.bodyLines) {
    const lines =
      paragraph.trim().length === 0
        ? [""]
        : wrapLines(paragraph, maxWidth, (value) => font.widthOfTextAtSize(value, fontSize));

    for (const line of lines) {
      if (cursorY < margin + 18) {
        page = doc.addPage([pageWidth, pageHeight]);
        pages.push(page);
        drawHeader(page);
        cursorY = pageHeight - margin - 48;
      }

      page.drawText(line, {
        x: margin,
        y: cursorY,
        size: fontSize,
        font,
        color: rgb(0.2, 0.23, 0.27),
      });
      cursorY -= lineHeight;
    }
    cursorY -= 4;
  }

  pages.forEach((target, index) => {
    target.drawLine({
      start: { x: margin, y: margin - 12 },
      end: { x: pageWidth - margin, y: margin - 12 },
      thickness: 1,
      color: rgb(0.9, 0.9, 0.92),
    });
    target.drawText(`Pagina ${index + 1}`, {
      x: pageWidth - margin - 48,
      y: margin - 26,
      size: 9,
      font,
      color: rgb(0.45, 0.48, 0.53),
    });
  });

  return doc.save();
}
