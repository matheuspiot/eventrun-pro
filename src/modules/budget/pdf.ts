import { PDFDocument, StandardFonts, rgb, PDFFont, PDFImage } from "pdf-lib";

type SummaryRow = {
  label: string;
  value: string;
  emphasis?: boolean;
};

type SummarySection = {
  title: string;
  rows: SummaryRow[];
};

type CostTableRow = {
  nome: string;
  quantidade: string;
  valorUnitario: string;
  subtotal: string;
};

type BudgetPdfInput = {
  title: string;
  subtitle: string;
  logoDataUrl?: string;
  sections: SummarySection[];
  costRows: CostTableRow[];
};

function clampText(text: string, maxWidth: number, font: PDFFont, size: number) {
  if (font.widthOfTextAtSize(text, size) <= maxWidth) {
    return text;
  }

  let result = text;
  while (result.length > 1 && font.widthOfTextAtSize(`${result}...`, size) > maxWidth) {
    result = result.slice(0, -1);
  }

  return `${result}...`;
}

export async function createBudgetPdfBuffer(input: BudgetPdfInput) {
  const pdfDoc = await PDFDocument.create();
  const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  let logoImage: PDFImage | null = null;
  let logoWidth = 0;
  let logoHeight = 0;

  if (input.logoDataUrl) {
    const match = input.logoDataUrl.match(/^data:image\/(png|jpeg|jpg);base64,(.+)$/);
    if (match) {
      const mime = match[1];
      const imageBytes = Uint8Array.from(Buffer.from(match[2], "base64"));
      logoImage = mime === "png" ? await pdfDoc.embedPng(imageBytes) : await pdfDoc.embedJpg(imageBytes);
      const maxWidth = 100;
      const maxHeight = 26;
      const ratio = Math.min(maxWidth / logoImage.width, maxHeight / logoImage.height, 1);
      logoWidth = logoImage.width * ratio;
      logoHeight = logoImage.height * ratio;
    }
  }

  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const margin = 40;
  const contentWidth = pageWidth - margin * 2;

  const pages = [pdfDoc.addPage([pageWidth, pageHeight])];
  let page = pages[0];
  let cursorY = pageHeight - margin - 50;

  const drawHeader = (targetPage: typeof page) => {
    targetPage.drawRectangle({
      x: margin,
      y: pageHeight - margin - 38,
      width: contentWidth,
      height: 38,
      color: rgb(0.96, 0.98, 1),
      borderColor: rgb(0.84, 0.88, 0.95),
      borderWidth: 1,
    });

    if (logoImage) {
      targetPage.drawImage(logoImage, {
        x: pageWidth - margin - logoWidth,
        y: pageHeight - margin - logoHeight + 10,
        width: logoWidth,
        height: logoHeight,
      });
    }

    targetPage.drawText(input.title, {
      x: margin + 12,
      y: pageHeight - margin - 13,
      size: 16,
      font: bold,
      color: rgb(0.09, 0.12, 0.17),
    });

    targetPage.drawText(input.subtitle, {
      x: margin,
      y: pageHeight - margin - 54,
      size: 10,
      font: regular,
      color: rgb(0.35, 0.39, 0.45),
    });

    targetPage.drawLine({
      start: { x: margin, y: pageHeight - margin - 62 },
      end: { x: pageWidth - margin, y: pageHeight - margin - 62 },
      thickness: 1,
      color: rgb(0.85, 0.87, 0.9),
    });
  };

  const drawFooter = (targetPage: typeof page, number: number) => {
    targetPage.drawLine({
      start: { x: margin, y: margin - 10 },
      end: { x: pageWidth - margin, y: margin - 10 },
      thickness: 1,
      color: rgb(0.9, 0.9, 0.92),
    });

    targetPage.drawText(`Página ${number}`, {
      x: pageWidth - margin - 48,
      y: margin - 24,
      size: 9,
      font: regular,
      color: rgb(0.45, 0.48, 0.53),
    });
  };

  const openNewPage = () => {
    page = pdfDoc.addPage([pageWidth, pageHeight]);
    pages.push(page);
    drawHeader(page);
    cursorY = pageHeight - margin - 84;
  };

  const ensureSpace = (heightNeeded: number) => {
    if (cursorY - heightNeeded < margin + 24) {
      openNewPage();
    }
  };

  drawHeader(page);
  cursorY = pageHeight - margin - 84;

  const sectionTitleSize = 12;
  const rowLabelSize = 10;
  const rowValueSize = 10.5;

  for (const section of input.sections) {
    ensureSpace(26 + section.rows.length * 18);

    page.drawText(section.title, {
      x: margin,
      y: cursorY,
      size: sectionTitleSize,
      font: bold,
      color: rgb(0.12, 0.16, 0.24),
    });
    cursorY -= 16;

    page.drawLine({
      start: { x: margin, y: cursorY },
      end: { x: pageWidth - margin, y: cursorY },
      thickness: 0.8,
      color: rgb(0.88, 0.89, 0.92),
    });
    cursorY -= 12;

    for (const row of section.rows) {
      ensureSpace(18);

      page.drawText(row.label, {
        x: margin,
        y: cursorY,
        size: rowLabelSize,
        font: regular,
        color: rgb(0.3, 0.33, 0.38),
      });

      page.drawText(row.value, {
        x: margin + 210,
        y: cursorY,
        size: rowValueSize,
        font: row.emphasis ? bold : regular,
        color: row.emphasis ? rgb(0.1, 0.14, 0.22) : rgb(0.18, 0.21, 0.28),
      });

      cursorY -= 16;
    }

    cursorY -= 8;
  }

  ensureSpace(28);
  page.drawText("Itens de custo", {
    x: margin,
    y: cursorY,
    size: 12,
    font: bold,
    color: rgb(0.12, 0.16, 0.24),
  });
  cursorY -= 16;

  const tableCols = {
    item: { x: margin, width: 246 },
    qtd: { x: margin + 246, width: 70 },
    unit: { x: margin + 316, width: 100 },
    subtotal: { x: margin + 416, width: 99 },
  };
  const tableHeaderHeight = 22;
  const tableRowHeight = 20;

  const drawTableHeader = () => {
    ensureSpace(tableHeaderHeight + tableRowHeight);

    page.drawRectangle({
      x: margin,
      y: cursorY - tableHeaderHeight,
      width: contentWidth,
      height: tableHeaderHeight,
      color: rgb(0.93, 0.94, 0.96),
      borderColor: rgb(0.82, 0.84, 0.88),
      borderWidth: 1,
    });

    page.drawText("Item", {
      x: tableCols.item.x + 6,
      y: cursorY - 15,
      size: 10,
      font: bold,
      color: rgb(0.22, 0.25, 0.32),
    });
    page.drawText("Qtd", {
      x: tableCols.qtd.x + 6,
      y: cursorY - 15,
      size: 10,
      font: bold,
      color: rgb(0.22, 0.25, 0.32),
    });
    page.drawText("Valor unitário", {
      x: tableCols.unit.x + 6,
      y: cursorY - 15,
      size: 10,
      font: bold,
      color: rgb(0.22, 0.25, 0.32),
    });
    page.drawText("Subtotal", {
      x: tableCols.subtotal.x + 6,
      y: cursorY - 15,
      size: 10,
      font: bold,
      color: rgb(0.22, 0.25, 0.32),
    });

    cursorY -= tableHeaderHeight;
  };

  const drawCellText = (
    text: string,
    x: number,
    y: number,
    width: number,
    align: "left" | "right" = "left",
  ) => {
    const fontSize = 9.6;
    const clamped = clampText(text, width - 10, regular, fontSize);
    const textWidth = regular.widthOfTextAtSize(clamped, fontSize);
    const textX = align === "right" ? x + width - textWidth - 6 : x + 6;

    page.drawText(clamped, {
      x: textX,
      y,
      size: fontSize,
      font: regular,
      color: rgb(0.2, 0.23, 0.29),
    });
  };

  const drawRowGrid = () => {
    page.drawLine({
      start: { x: tableCols.qtd.x, y: cursorY },
      end: { x: tableCols.qtd.x, y: cursorY - tableRowHeight },
      thickness: 0.8,
      color: rgb(0.86, 0.87, 0.9),
    });
    page.drawLine({
      start: { x: tableCols.unit.x, y: cursorY },
      end: { x: tableCols.unit.x, y: cursorY - tableRowHeight },
      thickness: 0.8,
      color: rgb(0.86, 0.87, 0.9),
    });
    page.drawLine({
      start: { x: tableCols.subtotal.x, y: cursorY },
      end: { x: tableCols.subtotal.x, y: cursorY - tableRowHeight },
      thickness: 0.8,
      color: rgb(0.86, 0.87, 0.9),
    });
  };

  drawTableHeader();

  if (input.costRows.length === 0) {
    ensureSpace(tableRowHeight);
    page.drawRectangle({
      x: margin,
      y: cursorY - tableRowHeight,
      width: contentWidth,
      height: tableRowHeight,
      borderColor: rgb(0.86, 0.87, 0.9),
      borderWidth: 1,
    });
    page.drawText("Nenhum item de custo cadastrado.", {
      x: margin + 6,
      y: cursorY - 14,
      size: 9.6,
      font: regular,
      color: rgb(0.45, 0.48, 0.53),
    });
    cursorY -= tableRowHeight;
  } else {
    for (const row of input.costRows) {
      if (cursorY - tableRowHeight < margin + 24) {
        openNewPage();
        drawTableHeader();
      }

      page.drawRectangle({
        x: margin,
        y: cursorY - tableRowHeight,
        width: contentWidth,
        height: tableRowHeight,
        borderColor: rgb(0.86, 0.87, 0.9),
        borderWidth: 1,
      });
      drawRowGrid();

      const textY = cursorY - 13.5;
      drawCellText(row.nome, tableCols.item.x, textY, tableCols.item.width, "left");
      drawCellText(row.quantidade, tableCols.qtd.x, textY, tableCols.qtd.width, "right");
      drawCellText(row.valorUnitario, tableCols.unit.x, textY, tableCols.unit.width, "right");
      drawCellText(row.subtotal, tableCols.subtotal.x, textY, tableCols.subtotal.width, "right");

      cursorY -= tableRowHeight;
    }
  }

  pages.forEach((pageItem, index) => {
    drawFooter(pageItem, index + 1);
  });

  return pdfDoc.save();
}
