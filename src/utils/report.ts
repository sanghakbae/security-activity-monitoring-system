import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { ExecutionEvidenceFile, ExecutionRecord } from '@/types';

type GenerateReportParams = {
  reportType: 'quarter' | 'half' | 'year';
  year: number;
  quarter: number;
  half: number;
  records: ExecutionRecord[];
  evidenceFilesByRecord: Record<string, ExecutionEvidenceFile[]>;
};

function getReportTitle(
  reportType: 'quarter' | 'half' | 'year',
  year: number,
  quarter: number,
  half: number,
) {
  if (reportType === 'quarter') {
    return `${year}년 ${quarter}분기 보안 활동 리포트`;
  }

  if (reportType === 'half') {
    return `${year}년 ${half === 1 ? '상반기' : '하반기'} 보안 활동 리포트`;
  }

  return `${year}년 연간 보안 활동 리포트`;
}

function isImageFile(fileName: string) {
  const lower = fileName.toLowerCase();
  return (
    lower.endsWith('.png') ||
    lower.endsWith('.jpg') ||
    lower.endsWith('.jpeg') ||
    lower.endsWith('.gif') ||
    lower.endsWith('.webp') ||
    lower.endsWith('.bmp')
  );
}

export async function generateSecurityReportPdf({
  reportType,
  year,
  quarter,
  half,
  records,
  evidenceFilesByRecord,
}: GenerateReportParams) {
  const title = getReportTitle(reportType, year, quarter, half);

  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-99999px';
  container.style.top = '0';
  container.style.width = '1000px';
  container.style.background = '#ffffff';
  container.style.padding = '32px';
  container.style.color = '#111827';
  container.style.fontFamily =
    `'Apple SD Gothic Neo', 'Malgun Gothic', 'Noto Sans KR', Arial, sans-serif`;
  container.style.boxSizing = 'border-box';

  const header = document.createElement('div');
  header.style.marginBottom = '24px';

  const titleEl = document.createElement('h1');
  titleEl.textContent = title;
  titleEl.style.fontSize = '28px';
  titleEl.style.fontWeight = '700';
  titleEl.style.margin = '0 0 12px 0';

  const dateEl = document.createElement('div');
  dateEl.textContent = `생성일시: ${new Date().toLocaleString()}`;
  dateEl.style.fontSize = '14px';
  dateEl.style.color = '#475569';

  header.appendChild(titleEl);
  header.appendChild(dateEl);
  container.appendChild(header);

  if (records.length === 0) {
    const empty = document.createElement('div');
    empty.textContent = '해당 조건의 보안 활동 데이터가 없습니다.';
    empty.style.fontSize = '16px';
    empty.style.padding = '20px 0';
    container.appendChild(empty);
  }

  for (const record of records) {
    const card = document.createElement('div');
    card.style.border = '1px solid #cbd5e1';
    card.style.borderRadius = '16px';
    card.style.padding = '20px';
    card.style.marginBottom = '24px';
    card.style.pageBreakInside = 'avoid';

    const name = document.createElement('div');
    name.textContent = record.title;
    name.style.fontSize = '24px';
    name.style.fontWeight = '700';
    name.style.marginBottom = '12px';

    const meta = document.createElement('div');
    meta.style.fontSize = '15px';
    meta.style.lineHeight = '1.9';
    meta.innerHTML = `
      <div>부서: ${record.department}</div>
      <div>주기: ${record.frequencyLabel}</div>
      <div>기한: ${record.dueDate.slice(0, 10)}</div>
      <div>상태: ${record.status}</div>
    `;

    const noteTitle = document.createElement('div');
    noteTitle.textContent = '수행 내역';
    noteTitle.style.fontSize = '16px';
    noteTitle.style.fontWeight = '700';
    noteTitle.style.marginTop = '16px';
    noteTitle.style.marginBottom = '8px';

    const noteBox = document.createElement('div');
    noteBox.textContent = record.executionNote || '-';
    noteBox.style.border = '1px solid #e2e8f0';
    noteBox.style.borderRadius = '12px';
    noteBox.style.background = '#f8fafc';
    noteBox.style.padding = '12px';
    noteBox.style.fontSize = '14px';
    noteBox.style.lineHeight = '1.8';
    noteBox.style.whiteSpace = 'pre-wrap';

    card.appendChild(name);
    card.appendChild(meta);
    card.appendChild(noteTitle);
    card.appendChild(noteBox);

    const evidences = evidenceFilesByRecord[record.id] ?? [];

    if (evidences.length > 0) {
      const evidenceTitle = document.createElement('div');
      evidenceTitle.textContent = '증적자료';
      evidenceTitle.style.fontSize = '16px';
      evidenceTitle.style.fontWeight = '700';
      evidenceTitle.style.marginTop = '18px';
      evidenceTitle.style.marginBottom = '10px';
      card.appendChild(evidenceTitle);

      const grid = document.createElement('div');
      grid.style.display = 'grid';
      grid.style.gridTemplateColumns = 'repeat(2, minmax(0, 1fr))';
      grid.style.gap = '16px';

      for (const evidence of evidences) {
        const item = document.createElement('div');
        item.style.border = '1px solid #e2e8f0';
        item.style.borderRadius = '12px';
        item.style.overflow = 'hidden';
        item.style.background = '#ffffff';

        const previewWrap = document.createElement('div');
        previewWrap.style.height = '180px';
        previewWrap.style.display = 'flex';
        previewWrap.style.alignItems = 'center';
        previewWrap.style.justifyContent = 'center';
        previewWrap.style.background = '#f8fafc';

        if (evidence.thumbnailUrl && isImageFile(evidence.fileName)) {
          const img = document.createElement('img');
          img.src = evidence.thumbnailUrl;
          img.alt = evidence.fileName;
          img.crossOrigin = 'anonymous';
          img.style.width = '100%';
          img.style.height = '100%';
          img.style.objectFit = 'cover';
          previewWrap.appendChild(img);
        } else {
          const fallback = document.createElement('div');
          fallback.textContent = '미리보기 없음';
          fallback.style.fontSize = '13px';
          fallback.style.color = '#64748b';
          previewWrap.appendChild(fallback);
        }

        const textWrap = document.createElement('div');
        textWrap.style.padding = '10px 12px';

        const fileName = document.createElement('div');
        fileName.textContent = evidence.fileName;
        fileName.style.fontSize = '13px';
        fileName.style.fontWeight = '600';
        fileName.style.wordBreak = 'break-all';

        const uploadedAt = document.createElement('div');
        uploadedAt.textContent = `업로드: ${new Date(evidence.uploadedAt).toLocaleString()}`;
        uploadedAt.style.fontSize = '11px';
        uploadedAt.style.color = '#64748b';
        uploadedAt.style.marginTop = '6px';

        textWrap.appendChild(fileName);
        textWrap.appendChild(uploadedAt);

        item.appendChild(previewWrap);
        item.appendChild(textWrap);
        grid.appendChild(item);
      }

      card.appendChild(grid);
    }

    container.appendChild(card);
  }

  document.body.appendChild(container);

  const canvas = await html2canvas(container, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
  });

  document.body.removeChild(container);

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF('p', 'mm', 'a4');

  const pdfWidth = 210;
  const pdfHeight = 297;
  const margin = 10;
  const usableWidth = pdfWidth - margin * 2;

  const imgWidth = usableWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  let remainingHeight = imgHeight;
  let position = 0;

  pdf.addImage(imgData, 'PNG', margin, position + margin, imgWidth, imgHeight);
  remainingHeight -= pdfHeight;

  while (remainingHeight > 0) {
    position = remainingHeight - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', margin, position + margin, imgWidth, imgHeight);
    remainingHeight -= pdfHeight;
  }

  pdf.save(`security-report-${reportType}-${year}.pdf`);
}