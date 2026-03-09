import { PDFDocument, rgb, type PDFFont, type PDFPage } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import type { ExecutionEvidenceFile, ExecutionRecord } from '@/types';

type ReportType = 'adHoc' | 'quarter' | 'half' | 'year';

type GenerateSecurityReportPdfParams = {
  reportType: ReportType;
  year: number;
  quarter?: number;
  half?: number;
  records: ExecutionRecord[];
  evidenceFilesByRecord: Record<string, ExecutionEvidenceFile[]>;
};

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN_X = 36;
const TOP_Y = PAGE_HEIGHT - 42;
const BOTTOM_Y = 42;
const FONT_REGULAR_URL = `${import.meta.env.BASE_URL}fonts/KoPubDotumMedium.ttf`;
const FONT_BOLD_URL = `${import.meta.env.BASE_URL}fonts/KoPubDotumBold.ttf`;

function getReportPeriodLabel(
  reportType: ReportType,
  year: number,
  quarter?: number,
  half?: number,
) {
  if (reportType === 'adHoc') {
    return `${year}년 수시`;
  }

  if (reportType === 'quarter') {
    return `${year}년 ${quarter}분기`;
  }

  if (reportType === 'half') {
    return `${year}년 ${half === 1 ? '상반기' : '하반기'}`;
  }

  return `${year}년 연간`;
}

function getStatusLabel(status: ExecutionRecord['status']) {
  switch (status) {
    case '완료':
      return '완료';
    case '지연':
      return '지연';
    case '진행중':
      return '진행중';
    case '예약':
    default:
      return '예정';
  }
}

function getStatusColor(status: ExecutionRecord['status']) {
  switch (status) {
    case '완료':
      return rgb(0.05, 0.55, 0.25);
    case '지연':
      return rgb(0.82, 0.18, 0.18);
    case '진행중':
      return rgb(0.12, 0.38, 0.82);
    case '예약':
    default:
      return rgb(0.20, 0.48, 0.18);
  }
}

function formatDueMonth(dueDate: string) {
  const date = new Date(dueDate);
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월`;
}

async function loadFontBytes(url: string) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`폰트 파일을 불러오지 못했습니다: ${url}`);
  }

  return await response.arrayBuffer();
}

function wrapText(text: string, font: PDFFont, fontSize: number, maxWidth: number) {
  const source = text && text.trim() !== '' ? text : '-';
  const paragraphs = source.split('\n');
  const lines: string[] = [];

  for (const paragraph of paragraphs) {
    if (paragraph === '') {
      lines.push('');
      continue;
    }

    let current = '';

    for (const char of paragraph) {
      const candidate = current + char;
      const width = font.widthOfTextAtSize(candidate, fontSize);

      if (width > maxWidth && current !== '') {
        lines.push(current);
        current = char;
      } else {
        current = candidate;
      }
    }

    if (current !== '') {
      lines.push(current);
    }
  }

  return lines.length > 0 ? lines : ['-'];
}

function ensurePage(
  pdfDoc: PDFDocument,
  page: PDFPage,
  currentY: number,
  requiredHeight: number,
  regularFont: PDFFont,
) {
  if (currentY - requiredHeight >= BOTTOM_Y) {
    return { page, currentY };
  }

  const newPage = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);

  newPage.drawText('보안 활동 리포트', {
    x: MARGIN_X,
    y: TOP_Y,
    size: 10,
    font: regularFont,
    color: rgb(0.45, 0.48, 0.54),
  });

  return {
    page: newPage,
    currentY: TOP_Y - 20,
  };
}

function getEvidenceText(files: ExecutionEvidenceFile[]) {
  if (files.length === 0) {
    return '증적 없음';
  }

  return files.map((file, index) => `${index + 1}. ${file.fileName}`).join('\n');
}

function drawTableRowBorders(
  page: PDFPage,
  x: number,
  yTop: number,
  rowHeight: number,
  colWidths: number[],
) {
  const totalWidth = colWidths.reduce((sum, width) => sum + width, 0);

  page.drawRectangle({
    x,
    y: yTop - rowHeight,
    width: totalWidth,
    height: rowHeight,
    borderColor: rgb(0.82, 0.84, 0.88),
    borderWidth: 0.8,
  });

  let currentX = x;
  for (let i = 0; i < colWidths.length - 1; i += 1) {
    currentX += colWidths[i];
    page.drawLine({
      start: { x: currentX, y: yTop },
      end: { x: currentX, y: yTop - rowHeight },
      thickness: 0.8,
      color: rgb(0.82, 0.84, 0.88),
    });
  }
}

function drawCenteredHeaderText(
  page: PDFPage,
  text: string,
  cellX: number,
  cellY: number,
  cellWidth: number,
  font: PDFFont,
  fontSize: number,
) {
  const textWidth = font.widthOfTextAtSize(text, fontSize);
  const x = cellX + (cellWidth - textWidth) / 2;

  page.drawText(text, {
    x,
    y: cellY,
    size: fontSize,
    font,
    color: rgb(0.22, 0.25, 0.30),
  });
}

export async function generateSecurityReportPdf({
  reportType,
  year,
  quarter,
  half,
  records,
  evidenceFilesByRecord,
}: GenerateSecurityReportPdfParams) {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);

  const regularFontBytes = await loadFontBytes(FONT_REGULAR_URL);
  const boldFontBytes = await loadFontBytes(FONT_BOLD_URL);

  const regularFont = await pdfDoc.embedFont(regularFontBytes, { subset: true });
  const boldFont = await pdfDoc.embedFont(boldFontBytes, { subset: true });

  let page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let currentY = TOP_Y;

  const title = `보안 활동 ${getReportPeriodLabel(reportType, year, quarter, half)} 리포트`;
  const generatedAt = `생성일시: ${new Date().toLocaleString('ko-KR')}`;

  const titleSize = 24;
  const titleWidth = boldFont.widthOfTextAtSize(title, titleSize);
  const titleX = (PAGE_WIDTH - titleWidth) / 2;

  page.drawText(title, {
    x: titleX,
    y: currentY,
    size: titleSize,
    font: boldFont,
    color: rgb(0.05, 0.09, 0.16),
  });

  currentY -= 34;

  const generatedAtSize = 11;
  const generatedAtWidth = regularFont.widthOfTextAtSize(generatedAt, generatedAtSize);

  page.drawText(generatedAt, {
    x: PAGE_WIDTH - MARGIN_X - generatedAtWidth,
    y: currentY,
    size: generatedAtSize,
    font: regularFont,
    color: rgb(0.32, 0.36, 0.42),
  });

  currentY -= 28;

  const headers = ['활동명', '기한', '상태', '수행 내용', '증적 파일'];
  const colWidths = [120, 72, 52, 145, 134];
  const tableWidth = colWidths.reduce((sum, width) => sum + width, 0);
  const tableX = (PAGE_WIDTH - tableWidth) / 2;
  const headerHeight = 26;
  const bodyFontSize = 10;
  const headerFontSize = 10;
  const lineHeight = bodyFontSize + 4;

  for (const record of records) {
    const values = [
      record.title,
      formatDueMonth(record.dueDate),
      getStatusLabel(record.status),
      record.executionNote?.trim() || '-',
      getEvidenceText(evidenceFilesByRecord[record.id] ?? []),
    ];

    const lineCounts = values.map((value, index) =>
      wrapText(value, regularFont, bodyFontSize, colWidths[index] - 10).length,
    );

    const contentLineCount = Math.max(...lineCounts);
    const bodyHeight = Math.max(30, contentLineCount * lineHeight + 10);
    const requiredHeight = headerHeight + bodyHeight + 20;

    const ensured = ensurePage(pdfDoc, page, currentY, requiredHeight, regularFont);
    page = ensured.page;
    currentY = ensured.currentY;

    page.drawRectangle({
      x: tableX,
      y: currentY - headerHeight,
      width: tableWidth,
      height: headerHeight,
      color: rgb(0.93, 0.94, 0.95),
      borderColor: rgb(0.82, 0.84, 0.88),
      borderWidth: 0.8,
    });

    let headerX = tableX;
    headers.forEach((header, index) => {
      drawCenteredHeaderText(
        page,
        header,
        headerX,
        currentY - 16,
        colWidths[index],
        boldFont,
        headerFontSize,
      );

      if (index < headers.length - 1) {
        page.drawLine({
          start: { x: headerX + colWidths[index], y: currentY },
          end: { x: headerX + colWidths[index], y: currentY - headerHeight },
          thickness: 0.8,
          color: rgb(0.82, 0.84, 0.88),
        });
      }

      headerX += colWidths[index];
    });

    const bodyTopY = currentY - headerHeight;
    drawTableRowBorders(page, tableX, bodyTopY, bodyHeight, colWidths);

    let cellX = tableX;
    values.forEach((value, index) => {
      const lines = wrapText(value, regularFont, bodyFontSize, colWidths[index] - 10);
      let textY = bodyTopY - 15;

      for (const line of lines) {
        page.drawText(line, {
          x: cellX + 5,
          y: textY,
          size: bodyFontSize,
          font: regularFont,
          color:
            index === 2
              ? getStatusColor(record.status)
              : rgb(0.15, 0.18, 0.22),
        });
        textY -= lineHeight;
      }

      cellX += colWidths[index];
    });

    currentY -= headerHeight + bodyHeight + 20;
  }

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes.buffer], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);

  const fileName = `security-report-${reportType}-${year}${quarter ? `-q${quarter}` : ''}${
    half ? `-h${half}` : ''
  }.pdf`;

  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();

  URL.revokeObjectURL(url);
}