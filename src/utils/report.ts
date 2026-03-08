import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { ExecutionEvidenceFile, ExecutionRecord } from '@/types';

type ReportType = 'quarter' | 'half' | 'year';

type GenerateSecurityReportPdfParams = {
  reportType: ReportType;
  year: number;
  quarter?: number;
  half?: number;
  records: ExecutionRecord[];
  evidenceFilesByRecord: Record<string, ExecutionEvidenceFile[]>;
};

function formatDepartmentLabel(
  ownerDepartment: string,
  partnerDepartment: string | null,
) {
  if (partnerDepartment && partnerDepartment.trim() !== '') {
    return `${ownerDepartment} · ${partnerDepartment}`;
  }

  return ownerDepartment;
}

function getReportPeriodLabel(
  reportType: ReportType,
  year: number,
  quarter?: number,
  half?: number,
) {
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

async function loadImageDataUrl(url: string) {
  const response = await fetch(url);
  const blob = await response.blob();

  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(blob);
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
  const doc = new jsPDF({
    orientation: 'p',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = 14;
  let cursorY = 18;

  const title = `보안 활동 ${getReportPeriodLabel(reportType, year, quarter, half)} 리포트`;
  const generatedAt = new Date().toLocaleString('ko-KR');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(title, marginX, cursorY);

  cursorY += 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`생성 일시: ${generatedAt}`, marginX, cursorY);

  cursorY += 8;

  autoTable(doc, {
    startY: cursorY,
    head: [['활동명', '부서', '기한', '상태', '증적 수']],
    body: records.map((record) => [
      record.title,
      formatDepartmentLabel(record.ownerDepartment, record.partnerDepartment),
      record.dueDate,
      getStatusLabel(record.status),
      String((evidenceFilesByRecord[record.id] ?? []).length),
    ]),
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 9,
      cellPadding: 2.5,
      lineColor: [220, 226, 232],
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    margin: { left: marginX, right: marginX },
  });

  cursorY = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 40;
  cursorY += 8;

  for (const record of records) {
    const evidenceFiles = evidenceFilesByRecord[record.id] ?? [];

    if (cursorY > 240) {
      doc.addPage();
      cursorY = 18;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text(record.title, marginX, cursorY);
    cursorY += 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(
      `부서: ${formatDepartmentLabel(record.ownerDepartment, record.partnerDepartment)}`,
      marginX,
      cursorY,
    );
    cursorY += 5;
    doc.text(`기한: ${record.dueDate}`, marginX, cursorY);
    cursorY += 5;
    doc.text(`상태: ${getStatusLabel(record.status)}`, marginX, cursorY);
    cursorY += 5;
    doc.text(`수행 내역: ${record.executionNote?.trim() || '-'}`, marginX, cursorY);
    cursorY += 8;

    if (evidenceFiles.length === 0) {
      doc.setTextColor(120, 120, 120);
      doc.text('증적 없음', marginX, cursorY);
      doc.setTextColor(0, 0, 0);
      cursorY += 10;
      continue;
    }

    const thumbWidth = 54;
    const thumbHeight = 38;
    const gap = 6;
    const itemsPerRow = 3;

    for (let i = 0; i < evidenceFiles.length; i += 1) {
      const file = evidenceFiles[i];
      const columnIndex = i % itemsPerRow;
      const rowIndex = Math.floor(i / itemsPerRow);

      const x = marginX + columnIndex * (thumbWidth + gap);
      const y = cursorY + rowIndex * (thumbHeight + 14);

      if (y + thumbHeight + 14 > 285) {
        doc.addPage();
        cursorY = 18;

        const newRowIndex = 0;
        const newY = cursorY + newRowIndex * (thumbHeight + 14);

        if (file.thumbnailUrl) {
          try {
            const imageDataUrl = await loadImageDataUrl(file.thumbnailUrl);
            doc.addImage(imageDataUrl, 'JPEG', x, newY, thumbWidth, thumbHeight);
          } catch {
            doc.rect(x, newY, thumbWidth, thumbHeight);
            doc.setFontSize(8);
            doc.text('미리보기 없음', x + 14, newY + 20);
          }
        } else {
          doc.rect(x, newY, thumbWidth, thumbHeight);
          doc.setFontSize(8);
          doc.text('미리보기 없음', x + 14, newY + 20);
        }

        doc.setFontSize(8);
        doc.text(file.fileName, x, newY + thumbHeight + 4, { maxWidth: thumbWidth });
        continue;
      }

      if (file.thumbnailUrl) {
        try {
          const imageDataUrl = await loadImageDataUrl(file.thumbnailUrl);
          doc.addImage(imageDataUrl, 'JPEG', x, y, thumbWidth, thumbHeight);
        } catch {
          doc.rect(x, y, thumbWidth, thumbHeight);
          doc.setFontSize(8);
          doc.text('미리보기 없음', x + 14, y + 20);
        }
      } else {
        doc.rect(x, y, thumbWidth, thumbHeight);
        doc.setFontSize(8);
        doc.text('미리보기 없음', x + 14, y + 20);
      }

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(file.fileName, x, y + thumbHeight + 4, { maxWidth: thumbWidth });
    }

    cursorY += Math.ceil(evidenceFiles.length / itemsPerRow) * (thumbHeight + 14) + 4;
  }

  const fileName = `security-report-${reportType}-${year}${quarter ? `-q${quarter}` : ''}${
    half ? `-h${half}` : ''
  }.pdf`;

  doc.save(fileName);
}