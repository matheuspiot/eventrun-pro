import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

function wrapLine(text: string, maxWidth: number, measure: (value: string) => number) {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (measure(candidate) <= maxWidth) {
      current = candidate;
    } else {
      if (current) {
        lines.push(current);
      }
      current = word;
    }
  }

  if (current) {
    lines.push(current);
  }

  return lines;
}

export async function createRegulationPdfBuffer(
  title: string,
  subtitle: string,
  body: string,
  logoDataUrl?: string,
) {
  const pdfDoc = await PDFDocument.create();
  const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const margin = 48;
  const maxTextWidth = pageWidth - margin * 2;
  const bodySize = 11;
  const lineHeight = 16;

  const lines: string[] = [];
  for (const paragraph of body.split("\n")) {
    if (!paragraph.trim()) {
      lines.push("");
      continue;
    }
    lines.push(
      ...wrapLine(paragraph, maxTextWidth, (value) => regular.widthOfTextAtSize(value, bodySize)),
    );
  }

  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let cursorY = pageHeight - margin;
  let pageNumber = 1;
  const pages = [page];

  async function drawLogo(targetPage: typeof page) {
    if (!logoDataUrl) {
      return 0;
    }

    const match = logoDataUrl.match(/^data:image\/(png|jpeg|jpg);base64,(.+)$/);
    if (!match) {
      return 0;
    }

    const mime = match[1];
    const bytes = Uint8Array.from(Buffer.from(match[2], "base64"));
    const image =
      mime === "png"
        ? await pdfDoc.embedPng(bytes)
        : await pdfDoc.embedJpg(bytes);

    const maxWidth = 140;
    const maxHeight = 56;
    const ratio = Math.min(maxWidth / image.width, maxHeight / image.height, 1);
    const width = image.width * ratio;
    const height = image.height * ratio;

    targetPage.drawImage(image, {
      x: pageWidth - margin - width,
      y: pageHeight - margin - height + 8,
      width,
      height,
    });

    return height;
  }

  const drawHeader = async (targetPage: typeof page) => {
    const logoHeight = await drawLogo(targetPage);
    targetPage.drawText(title, {
      x: margin,
      y: pageHeight - margin,
      size: 16,
      font: bold,
      color: rgb(0.09, 0.12, 0.17),
    });
    targetPage.drawText(subtitle, {
      x: margin,
      y: pageHeight - margin - 20,
      size: 10,
      font: regular,
      color: rgb(0.35, 0.39, 0.45),
    });
    targetPage.drawLine({
      start: { x: margin, y: pageHeight - margin - 28 },
      end: { x: pageWidth - margin, y: pageHeight - margin - 28 },
      thickness: 1,
      color: rgb(0.85, 0.87, 0.9),
    });
    return logoHeight;
  };

  const drawFooter = (targetPage: typeof page, number: number) => {
    targetPage.drawLine({
      start: { x: margin, y: margin - 12 },
      end: { x: pageWidth - margin, y: margin - 12 },
      thickness: 1,
      color: rgb(0.9, 0.9, 0.92),
    });
    targetPage.drawText(`Pagina ${number}`, {
      x: pageWidth - margin - 48,
      y: margin - 26,
      size: 9,
      font: regular,
      color: rgb(0.45, 0.48, 0.53),
    });
  };

  const firstHeaderLogoHeight = await drawHeader(page);
  cursorY = pageHeight - margin - Math.max(48, firstHeaderLogoHeight + 20);

  for (const line of lines) {
    if (cursorY < margin + 16) {
      drawFooter(page, pageNumber);
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      pages.push(page);
      pageNumber += 1;
      const nextHeaderLogoHeight = await drawHeader(page);
      cursorY = pageHeight - margin - Math.max(48, nextHeaderLogoHeight + 20);
    }

    page.drawText(line, {
      x: margin,
      y: cursorY,
      size: bodySize,
      font: regular,
      color: rgb(0.16, 0.19, 0.24),
    });
    cursorY -= lineHeight;
  }

  pages.forEach((pageItem, index) => {
    drawFooter(pageItem, index + 1);
  });

  return pdfDoc.save();
}
