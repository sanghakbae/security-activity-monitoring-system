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
const MARGIN_X = 20;
const TOP_Y = PAGE_HEIGHT - 42;
const BOTTOM_Y = 42;

const FONT_REGULAR_URL = `${import.meta.env.BASE_URL}fonts/KoPubDotumMedium.ttf`;
const FONT_BOLD_URL = `${import.meta.env.BASE_URL}fonts/KoPubDotumBold.ttf`;

const COLORS = {
  text: rgb(0.12, 0.16, 0.22),
  subText: rgb(0.42, 0.47, 0.56),
  border: rgb(0.82, 0.84, 0.88),
  headerBg: rgb(0.94, 0.95, 0.97),
  cardBg: rgb(0.97, 0.98, 0.99),
  title: rgb(0.05, 0.09, 0.16),
  complete: rgb(0.05, 0.55, 0.25),
  delayed: rgb(0.82, 0.18, 0.18),
  scheduled: rgb(0.22, 0.48, 0.16),
  inProgress: rgb(0.12, 0.38, 0.82),
};

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
      return COLORS.complete;
    case '지연':
      return COLORS.delayed;
    case '진행중':
      return COLORS.inProgress;
    case '예약':
    default:
      return COLORS.scheduled;
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

function getEvidenceText(files: ExecutionEvidenceFile[]) {
  if (files.length === 0) {
    return '증적 없음';
  }

  return files.map((file) => file.fileName).join(', ');
}

function drawText(
  page: PDFPage,
  text: string,
  x: number,
  y: number,
  font: PDFFont,
  size: number,
  color = COLORS.text,
) {
  page.drawText(text, { x, y, font, size, color });
}

function drawCenteredText(
  page: PDFPage,
  text: string,
  x: number,
  y: number,
  width: number,
  font: PDFFont,
  size: number,
  color = COLORS.text,
) {
  const textWidth = font.widthOfTextAtSize(text, size);
  const textX = x + Math.max(0, (width - textWidth) / 2);

  page.drawText(text, {
    x: textX,
    y,
    font,
    size,
    color,
  });
}

function drawRightText(
  page: PDFPage,
  text: string,
  x: number,
  y: number,
  font: PDFFont,
  size: number,
  color = COLORS.text,
) {
  const textWidth = font.widthOfTextAtSize(text, size);

  page.drawText(text, {
    x: x - textWidth,
    y,
    font,
    size,
    color,
  });
}

function drawSummaryCard(
  page: PDFPage,
  x: number,
  yTop: number,
  width: number,
  height: number,
  label: string,
  value: string,
  regularFont: PDFFont,
  boldFont: PDFFont,
  valueColor = COLORS.title,
) {
  page.drawRectangle({
    x,
    y: yTop - height,
    width,
    height,
    color: COLORS.cardBg,
    borderColor: COLORS.border,
    borderWidth: 0.8,
  });

  drawCenteredText(page, label, x, yTop - 18, width, boldFont, 10, COLORS.subText);
  drawCenteredText(page, value, x, yTop - 40, width, boldFont, 18, valueColor);
}

function drawTableHeader(
  page: PDFPage,
  startX: number,
  yTop: number,
  colWidths: number[],
  headers: string[],
  boldFont: PDFFont,
) {
  const totalWidth = colWidths.reduce((sum, width) => sum + width, 0);
  const headerHeight = 24;

  page.drawRectangle({
    x: startX,
    y: yTop - headerHeight,
    width: totalWidth,
    height: headerHeight,
    color: COLORS.headerBg,
    borderColor: COLORS.border,
    borderWidth: 0.8,
  });

  let currentX = startX;

  headers.forEach((header, index) => {
    drawCenteredText(
      page,
      header,
      currentX,
      yTop - 18,
      colWidths[index],
      boldFont,
      10,
      COLORS.text,
    );

    if (index < headers.length - 1) {
      page.drawLine({
        start: { x: currentX + colWidths[index], y: yTop },
        end: { x: currentX + colWidths[index], y: yTop - headerHeight },
        thickness: 0.8,
        color: COLORS.border,
      });
    }

    currentX += colWidths[index];
  });
}

function drawRowBorders(
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
    borderColor: COLORS.border,
    borderWidth: 0.8,
  });

  let currentX = x;
  for (let i = 0; i < colWidths.length - 1; i += 1) {
    currentX += colWidths[i];
    page.drawLine({
      start: { x: currentX, y: yTop },
      end: { x: currentX, y: yTop - rowHeight },
      thickness: 0.8,
      color: COLORS.border,
    });
  }
}

function addNewPage(
  pdfDoc: PDFDocument,
  regularFont: PDFFont,
  periodLabel: string,
) {
  const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);

  drawText(
    page,
    `보안 활동 ${periodLabel} 리포트`,
    MARGIN_X,
    TOP_Y,
    regularFont,
    10,
    COLORS.subText,
  );

  return page;
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

  const periodLabel = getReportPeriodLabel(reportType, year, quarter, half);

  let page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let currentY = TOP_Y;

  const title = `보안 활동 ${periodLabel} 리포트`;
  const generatedAt = `생성일시: ${new Date().toLocaleString('ko-KR')}`;

  const totalCount = records.length;
  const completedCount = records.filter((record) => record.status === '완료').length;
  const delayedOrIncompleteCount = records.filter((record) => record.status !== '완료').length;
  const completionRate =
    totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

  const titleSize = 22;
  const titleWidth = boldFont.widthOfTextAtSize(title, titleSize);
  const titleX = (PAGE_WIDTH - titleWidth) / 2;

  drawText(page, title, titleX, currentY, boldFont, titleSize, COLORS.title);
  currentY -= 28;

  drawRightText(page, generatedAt, PAGE_WIDTH - MARGIN_X, currentY, regularFont, 10, COLORS.subText);
  currentY -= 26;

  drawText(page, '리포트 요약', MARGIN_X, currentY, boldFont, 13, COLORS.title);
  currentY -= 10;

  const gap = 6;
  const cardHeight = 44;
  const cardWidth = (PAGE_WIDTH - MARGIN_X * 2 - gap * 3) / 4;

  drawSummaryCard(
    page,
    MARGIN_X,
    currentY,
    cardWidth,
    cardHeight,
    '전체 건수',
    `${totalCount}건`,
    regularFont,
    boldFont,
    COLORS.title,
  );
  drawSummaryCard(
    page,
    MARGIN_X + (cardWidth + gap) * 1,
    currentY,
    cardWidth,
    cardHeight,
    '수행 완료',
    `${completedCount}건`,
    regularFont,
    boldFont,
    COLORS.complete,
  );
  drawSummaryCard(
    page,
    MARGIN_X + (cardWidth + gap) * 2,
    currentY,
    cardWidth,
    cardHeight,
    '지연/미이행',
    `${delayedOrIncompleteCount}건`,
    regularFont,
    boldFont,
    COLORS.delayed,
  );
  drawSummaryCard(
    page,
    MARGIN_X + (cardWidth + gap) * 3,
    currentY,
    cardWidth,
    cardHeight,
    '전체 수행률',
    `${completionRate}%`,
    regularFont,
    boldFont,
    rgb(0.15, 0.35, 0.75),
  );

  currentY -= cardHeight + 26;

  drawText(page, '보안 활동 상세 내역', MARGIN_X, currentY, boldFont, 13, COLORS.title);
  currentY -= 12;

  const headers = ['활동명', '기한', '상태', '수행 내용', '증적 파일'];
  const colWidths = [128, 72, 56, 150, 149];
  const totalWidth = colWidths.reduce((sum, width) => sum + width, 0);
  const tableX = MARGIN_X;
  const headerHeight = 22;
  const bodyFontSize = 8;
  const lineHeight = 11;

  const ensureSpaceForRow = (requiredHeight: number) => {
    if (currentY - headerHeight - requiredHeight >= BOTTOM_Y) {
      return;
    }

    page = addNewPage(pdfDoc, regularFont, periodLabel);
    currentY = TOP_Y - 20;

    drawTableHeader(page, tableX, currentY, colWidths, headers, boldFont);
    currentY -= headerHeight;
  };

  drawTableHeader(page, tableX, currentY, colWidths, headers, boldFont);
  currentY -= headerHeight;

  if (records.length === 0) {
    const emptyHeight = 34;
    drawRowBorders(page, tableX, currentY, emptyHeight, colWidths);
    drawCenteredText(
      page,
      '선택한 조건에 해당하는 보안 활동이 없습니다.',
      tableX,
      currentY - 21,
      totalWidth,
      regularFont,
      10,
      COLORS.subText,
    );
    currentY -= emptyHeight;
  } else {
    for (const record of records) {
      const rowValues = [
        record.title || '-',
        formatDueMonth(record.dueDate),
        getStatusLabel(record.status),
        record.executionNote?.trim() || '-',
        getEvidenceText(evidenceFilesByRecord[record.id] ?? []),
      ];

      const wrappedLines = rowValues.map((value, index) =>
        wrapText(value, regularFont, bodyFontSize, colWidths[index] - 12),
      );

      const maxLineCount = Math.max(...wrappedLines.map((lines) => lines.length));
      const rowHeight = Math.max(20, maxLineCount * lineHeight + 4);

      ensureSpaceForRow(rowHeight);

      drawRowBorders(page, tableX, currentY, rowHeight, colWidths);

      let currentX = tableX;

      wrappedLines.forEach((lines, index) => {
        const textBlockHeight = lines.length * lineHeight;
        let textY = currentY - ((rowHeight - textBlockHeight) / 2) - 11;

        if (index <= 2) {
          const color = index === 2 ? getStatusColor(record.status) : COLORS.text;

          lines.forEach((line) => {
            drawCenteredText(
              page,
              line,
              currentX,
              textY,
              colWidths[index],
              index === 2 ? boldFont : regularFont,
              bodyFontSize,
              color,
            );
            textY -= lineHeight;
          });
        } else {
          lines.forEach((line) => {
            drawText(
              page,
              line,
              currentX + 6,
              textY,
              regularFont,
              bodyFontSize,
              COLORS.text,
            );
            textY -= lineHeight;
          });
        }

        currentX += colWidths[index];
      });

      currentY -= rowHeight;
    }
  }

  const pages = pdfDoc.getPages();
  const totalPages = pages.length;

  pages.forEach((page, index) => {
    const pageNumber = `${index + 1} / ${totalPages}`;

    const textWidth = regularFont.widthOfTextAtSize(pageNumber, 9);

    page.drawText(pageNumber, {
      x: (PAGE_WIDTH - textWidth) / 2,
      y: 20,
      size: 9,
      font: regularFont,
      color: COLORS.subText,
    });
  });

  const pdfBytes = await pdfDoc.save();

  const pdfBuffer = pdfBytes.buffer.slice(
    pdfBytes.byteOffset,
    pdfBytes.byteOffset + pdfBytes.byteLength,
  ) as ArrayBuffer;

  const blob = new Blob([pdfBuffer], { type: 'application/pdf' });
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