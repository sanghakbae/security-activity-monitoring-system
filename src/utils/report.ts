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

function normalizePdfText(value: string) {
  return value.replace(/\r\n/g, '\n').normalize('NFC');
}

function fitTextToWidth(
  text: string,
  font: PDFFont,
  fontSize: number,
  maxWidth: number,
) {
  const source = normalizePdfText(text && text.trim() !== '' ? text : '-');

  if (font.widthOfTextAtSize(source, fontSize) <= maxWidth) {
    return source;
  }

  const ellipsis = '...';
  let clipped = source;

  while (clipped.length > 0) {
    const candidate = `${clipped}${ellipsis}`;
    if (font.widthOfTextAtSize(candidate, fontSize) <= maxWidth) {
      return candidate;
    }
    clipped = clipped.slice(0, -1);
  }

  return ellipsis;
}

function fitSingleLineFontSize(
  text: string,
  font: PDFFont,
  preferredSize: number,
  minSize: number,
  maxWidth: number,
) {
  const source = normalizePdfText(text && text.trim() !== '' ? text : '-');
  let size = preferredSize;

  while (size > minSize && font.widthOfTextAtSize(source, size) > maxWidth) {
    size -= 0.5;
  }

  return size;
}

function wrapTextLines(
  text: string,
  font: PDFFont,
  fontSize: number,
  maxWidth: number,
) {
  const source = normalizePdfText(text && text.trim() !== '' ? text : '-');
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
      if (font.widthOfTextAtSize(candidate, fontSize) > maxWidth && current !== '') {
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

function isEmbeddableImageFile(fileName: string) {
  return /\.(png|jpe?g)$/i.test(fileName);
}

function getDocumentEvidenceLines(files: ExecutionEvidenceFile[]) {
  const docs = Array.from(
    new Set(
      files
        .filter((file) => !isEmbeddableImageFile(file.fileName))
        .map((file) => normalizePdfText(file.fileName)),
    ),
  );

  return docs.length > 0 ? docs : ['증적 없음'];
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

  const centerY = yTop - height / 2;
  drawCenteredText(page, label, x, centerY + 8, width, boldFont, 10, COLORS.subText);
  drawCenteredText(page, value, x, centerY - 10, width, boldFont, 16, valueColor);
}

function drawTableHeader(
  page: PDFPage,
  startX: number,
  yTop: number,
  colWidths: number[],
  headers: string[],
  boldFont: PDFFont,
  headerHeight: number,
  fontSize: number,
) {
  const totalWidth = colWidths.reduce((sum, width) => sum + width, 0);

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
      yTop - headerHeight / 2 - 4,
      colWidths[index],
      boldFont,
      fontSize,
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
  currentY -= 14;
  drawText(page, `출력 기간: ${periodLabel}`, MARGIN_X, currentY, regularFont, 10, COLORS.subText);
  currentY -= 20;

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

  currentY -= cardHeight + 34;

  drawText(page, '보안 활동 상세 내역', MARGIN_X, currentY, boldFont, 13, COLORS.title);
  currentY -= 12;

  const headers = ['활동명', '기한', '상태', '수행 내용', '증적 파일'];
  const tableWidth = PAGE_WIDTH - MARGIN_X * 2;
  const colWidths = [
    tableWidth * 0.13,
    tableWidth * 0.1,
    tableWidth * 0.08,
    tableWidth * 0.41,
    tableWidth * 0.28,
  ];
  const totalWidth = colWidths.reduce((sum, width) => sum + width, 0);
  const tableX = MARGIN_X;
  const headerHeight = 20;
  const headerFontSize = 9;
  const bodyFontSize = 7;
  const baseRowHeight = 20;
  const noteLineHeight = 8.8;
  const imageCache = new Map<string, Uint8Array>();

  const getCachedImageBytes = async (url: string) => {
    const cached = imageCache.get(url);
    if (cached) {
      return cached;
    }

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`이미지 로드 실패: ${response.status}`);
    }

    const bytes = new Uint8Array(await response.arrayBuffer());
    imageCache.set(url, bytes);
    return bytes;
  };

  const ensureSpaceForRow = (requiredHeight: number) => {
    if (currentY - headerHeight - requiredHeight >= BOTTOM_Y) {
      return;
    }

    page = addNewPage(pdfDoc, regularFont, periodLabel);
    currentY = TOP_Y - 20;

    drawTableHeader(
      page,
      tableX,
      currentY,
      colWidths,
      headers,
      boldFont,
      headerHeight,
      headerFontSize,
    );
    currentY -= headerHeight;
  };

  drawTableHeader(
    page,
    tableX,
    currentY,
    colWidths,
    headers,
    boldFont,
    headerHeight,
    headerFontSize,
  );
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
      const files = evidenceFilesByRecord[record.id] ?? [];
      const imageFiles = files.filter(
        (file) => isEmbeddableImageFile(file.fileName) && !!file.thumbnailUrl,
      );
      const documentEvidenceNames = getDocumentEvidenceLines(files);

      const rowValues = [
        normalizePdfText(record.title || '-'),
        formatDueMonth(record.dueDate),
        getStatusLabel(record.status),
        normalizePdfText(
          record.executionNote && record.executionNote.length > 0 ? record.executionNote : '-',
        ),
      ];

      const noteLines = wrapTextLines(
        rowValues[3],
        regularFont,
        bodyFontSize,
        colWidths[3] - 10,
      );
      const evidenceLines = documentEvidenceNames.flatMap((fileName, index) => {
        const wrapped = wrapTextLines(
          fileName,
          regularFont,
          bodyFontSize,
          colWidths[4] - 10,
        );

        if (index < documentEvidenceNames.length - 1) {
          return [...wrapped, ''];
        }

        return wrapped;
      });
      const noteHeight = noteLines.length * noteLineHeight + 6;
      const evidenceTextHeight = evidenceLines.length * noteLineHeight + 6;
      const imageSize = colWidths[4] - 8;
      const imageGap = 4;
      const evidenceImageHeight =
        imageFiles.length > 0
          ? imageFiles.length * imageSize + (imageFiles.length - 1) * imageGap + 6
          : 0;
      const evidenceContentHeight =
        evidenceTextHeight +
        (imageFiles.length > 0 ? 4 : 0) +
        (evidenceImageHeight > 0 ? evidenceImageHeight - 6 : 0);
      const rowHeight = Math.max(baseRowHeight, noteHeight, evidenceContentHeight);

      ensureSpaceForRow(rowHeight);

      drawRowBorders(page, tableX, currentY, rowHeight, colWidths);

      let currentX = tableX;
      const textY = currentY - rowHeight / 2 - bodyFontSize / 2 + 2;

      rowValues.forEach((value, index) => {
        if (index === 3) {
          currentX += colWidths[index];
          return;
        }

        const isTitle = index === 0;
        const isStatus = index === 2;
        const color = isStatus ? getStatusColor(record.status) : COLORS.text;
        const fontSize = isTitle
          ? fitSingleLineFontSize(value, regularFont, bodyFontSize, 5.5, colWidths[index] - 8)
          : bodyFontSize;
        const line = isTitle
          ? value
          : fitTextToWidth(value, regularFont, bodyFontSize, colWidths[index] - 10);

        drawCenteredText(
          page,
          line,
          currentX,
          currentY - rowHeight / 2 - fontSize / 2 + 2,
          colWidths[index],
          isStatus ? boldFont : regularFont,
          fontSize,
          color,
        );

        currentX += colWidths[index];
      });

      const noteX = tableX + colWidths[0] + colWidths[1] + colWidths[2];
      const noteTextBlockHeight = noteLines.length * noteLineHeight;
      let noteY = currentY - ((rowHeight - noteTextBlockHeight) / 2) - bodyFontSize + 2;

      noteLines.forEach((line) => {
        drawText(
          page,
          line,
          noteX + 4,
          noteY,
          regularFont,
          bodyFontSize,
          COLORS.text,
        );
        noteY -= noteLineHeight;
      });

      const evidenceX = tableX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3];
      let evidenceY = currentY - 4 - bodyFontSize;

      evidenceLines.forEach((line) => {
        drawText(
          page,
          line,
          evidenceX + 4,
          evidenceY,
          regularFont,
          bodyFontSize,
          COLORS.text,
        );
        evidenceY -= noteLineHeight;
      });

      if (imageFiles.length > 0) {
        evidenceY -= 2;

        for (const imageFile of imageFiles) {
          try {
            const imageBytes = await getCachedImageBytes(imageFile.thumbnailUrl!);
            const embeddedImage = /\.png$/i.test(imageFile.fileName)
              ? await pdfDoc.embedPng(imageBytes)
              : await pdfDoc.embedJpg(imageBytes);

            page.drawImage(embeddedImage, {
              x: evidenceX + 4,
              y: evidenceY - imageSize + bodyFontSize,
              width: imageSize,
              height: imageSize,
            });
          } catch (error) {
            console.error('report evidence image embed error:', error);
          }

          evidenceY -= imageSize + imageGap;
        }
      }

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
