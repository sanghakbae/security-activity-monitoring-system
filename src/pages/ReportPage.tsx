import { useMemo, useState } from 'react';
import { FileText } from 'lucide-react';
import type { ExecutionEvidenceFile, ExecutionRecord } from '@/types';

type ReportType = 'adHoc' | 'quarter' | 'half' | 'year';

type ReportPageProps = {
  records: ExecutionRecord[];
  evidenceFilesByRecord: Record<string, ExecutionEvidenceFile[]>;
};

function getQuarterByMonth(month: number) {
  if (month >= 1 && month <= 3) return 1;
  if (month >= 4 && month <= 6) return 2;
  if (month >= 7 && month <= 9) return 3;
  return 4;
}

function getHalfByMonth(month: number) {
  return month <= 6 ? 1 : 2;
}

function formatDueMonth(dueDate: string) {
  const date = new Date(dueDate);
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월`;
}

function getEvidenceText(files: ExecutionEvidenceFile[]) {
  if (files.length === 0) {
    return '증적 없음';
  }

  return files.map((file) => file.fileName).join(', ');
}

function isImageFile(fileName: string) {
  return /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(fileName);
}

function renderEvidenceCell(files: ExecutionEvidenceFile[]) {
  if (files.length === 0) {
    return <span>-</span>;
  }

  const documentFiles = files.filter((file) => !isImageFile(file.fileName));
  const imageFiles = files.filter((file) => isImageFile(file.fileName) && !!file.thumbnailUrl);

  return (
    <div className="flex flex-col items-start gap-1">
      {documentFiles.map((file) => (
        <div
          key={file.id}
          className="w-full whitespace-pre-wrap break-words rounded-sm border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[12px] leading-4"
          title={file.fileName}
        >
          {file.fileName}
        </div>
      ))}
      {imageFiles.length > 0 && (
        <div className="flex w-full flex-col gap-1">
          {imageFiles.map((file) => (
            <img
              key={file.id}
              src={file.thumbnailUrl}
              alt={file.fileName}
              className="w-full rounded-sm border border-slate-200 object-contain"
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function ReportPage({
  records,
  evidenceFilesByRecord,
}: ReportPageProps) {
  const getStatusLabel = (status: ExecutionRecord['status']) =>
    status === '예약' ? '예정' : status;

  const currentYear = new Date().getFullYear();

  const [reportType, setReportType] = useState<ReportType>('quarter');
  const [year, setYear] = useState(currentYear);
  const [quarter, setQuarter] = useState(1);
  const [half, setHalf] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const yearOptions = useMemo(() => {
    return Array.from({ length: 7 }, (_, index) => currentYear - 3 + index);
  }, [currentYear]);

  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      const dueDate = new Date(record.dueDate);
      const recordYear = dueDate.getFullYear();
      const recordMonth = dueDate.getMonth() + 1;

      if (recordYear !== year) {
        return false;
      }

      if (reportType === 'adHoc') {
        return record.frequencyLabel === '수시';
      }

      if (reportType === 'quarter') {
        return getQuarterByMonth(recordMonth) === quarter;
      }

      if (reportType === 'half') {
        return getHalfByMonth(recordMonth) === half;
      }

      return true;
    });
  }, [records, reportType, year, quarter, half]);

  const summary = useMemo(() => {
    const totalCount = filteredRecords.length;
    const completedCount = filteredRecords.filter((record) => record.status === '완료').length;
    const delayedOrIncompleteCount = filteredRecords.filter(
      (record) => record.status !== '완료',
    ).length;
    const completionRate =
      totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

    return {
      totalCount,
      completedCount,
      delayedOrIncompleteCount,
      completionRate,
    };
  }, [filteredRecords]);

  const getStatusTextClassName = (status: ExecutionRecord['status']) => {
    if (status === '완료') return 'text-emerald-700';
    if (status === '지연') return 'text-rose-600';
    if (status === '진행중') return 'text-blue-700';
    return 'text-slate-700';
  };

  const handleGeneratePdf = async () => {
    try {
      setIsGenerating(true);
      const { generateSecurityReportPdf } = await import('@/utils/report');

      await generateSecurityReportPdf({
        reportType,
        year,
        quarter: reportType === 'quarter' ? quarter : undefined,
        half: reportType === 'half' ? half : undefined,
        records: filteredRecords,
        evidenceFilesByRecord,
      });
    } catch (error) {
      console.error('generateSecurityReportPdf error:', error);

      if (error instanceof Error) {
        window.alert(`PDF 생성 오류: ${error.message}`);
      } else {
        window.alert('PDF 생성 중 오류가 발생했습니다.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      <section className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
        <div className="mb-3 border-b border-slate-100 pb-2">
          <div className="text-[16px] font-semibold">리포트 생성</div>
          <div className="mt-0.5 text-xs text-slate-500">
            미리보기 내용을 확인한 뒤 PDF를 생성하세요.
          </div>
        </div>

        <div
          className={`grid w-full gap-2 ${
            reportType === 'quarter' || reportType === 'half'
              ? 'grid-cols-1 lg:grid-cols-5'
              : 'grid-cols-1 lg:grid-cols-4'
          }`}
        >
          <div className="w-full">
            <label className="mb-1 block text-center text-[12px] font-semibold text-slate-700">
              리포트 유형
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as ReportType)}
              className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-center text-[13px] font-medium outline-none focus:border-slate-400"
            >
              <option value="adHoc">수시</option>
              <option value="quarter">분기</option>
              <option value="half">반기</option>
              <option value="year">연간</option>
            </select>
          </div>

          {reportType === 'quarter' && (
            <div className="w-full">
              <label className="mb-1 block text-center text-[12px] font-semibold text-slate-700">
                분기 선택
              </label>
              <select
                value={quarter}
                onChange={(e) => setQuarter(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-center text-[13px] font-medium outline-none focus:border-slate-400"
              >
                <option value={1}>1분기</option>
                <option value={2}>2분기</option>
                <option value={3}>3분기</option>
                <option value={4}>4분기</option>
              </select>
            </div>
          )}

          {reportType === 'half' && (
            <div className="w-full">
              <label className="mb-1 block text-center text-[12px] font-semibold text-slate-700">
                반기 선택
              </label>
              <select
                value={half}
                onChange={(e) => setHalf(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-center text-[13px] font-medium outline-none focus:border-slate-400"
              >
                <option value={1}>상반기</option>
                <option value={2}>하반기</option>
              </select>
            </div>
          )}

          <div className="w-full">
            <label className="mb-1 block text-center text-[12px] font-semibold text-slate-700">
              기준 연도
            </label>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-center text-[13px] font-medium outline-none focus:border-slate-400"
            >
              {yearOptions.map((optionYear) => (
                <option key={optionYear} value={optionYear}>
                  {optionYear}년
                </option>
              ))}
            </select>
          </div>

          <div className="w-full">
            <label className="mb-1 block text-center text-[12px] font-semibold text-slate-700">
              리포트 미리보기
            </label>
            <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[13px] font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              미리보기 열기
            </button>
          </div>

          <div className="w-full">
            <label className="mb-1 block text-center text-[12px] font-semibold text-slate-700">
              PDF 생성
            </label>
            <button
              type="button"
              onClick={handleGeneratePdf}
              disabled={filteredRecords.length === 0 || isGenerating}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-slate-900 px-2 py-1.5 text-[13px] font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              <FileText className="h-4 w-4" />
              {isGenerating ? '생성 중...' : 'PDF 생성'}
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
        <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2">
          <div className="text-[16px] font-semibold">리포트 대상 미리보기</div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[12px] font-semibold text-slate-700">
            대상 활동 수: <span className="text-slate-900">{filteredRecords.length}건</span>
          </div>
        </div>

        <div className="mb-1.5 text-[14px] font-semibold text-slate-900">리포트 요약</div>
        <div className="mb-2.5 grid grid-cols-2 gap-1.5 lg:grid-cols-4">
          <div className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5 text-center">
            <div className="text-[12px] text-slate-500">전체 건수</div>
            <div className="mt-0.5 text-[18px] font-bold text-slate-900">{summary.totalCount}건</div>
          </div>
          <div className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5 text-center">
            <div className="text-[12px] text-slate-500">수행 완료</div>
            <div className="mt-0.5 text-[18px] font-bold text-emerald-700">
              {summary.completedCount}건
            </div>
          </div>
          <div className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5 text-center">
            <div className="text-[12px] text-slate-500">지연/미이행</div>
            <div className="mt-0.5 text-[18px] font-bold text-rose-600">
              {summary.delayedOrIncompleteCount}건
            </div>
          </div>
          <div className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5 text-center">
            <div className="text-[12px] text-slate-500">전체 수행률</div>
            <div className="mt-0.5 text-[18px] font-bold text-blue-700">{summary.completionRate}%</div>
          </div>
        </div>

        <div className="mb-1.5 text-[14px] font-semibold text-slate-900">보안 활동 상세 내역</div>
        {filteredRecords.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-200 px-3 py-7 text-center text-[13px] text-slate-400">
            선택한 조건에 해당하는 활동이 없습니다.
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-slate-200">
            <table className="w-full table-fixed border-collapse text-[13px]">
              <colgroup>
                <col className="w-[13%]" />
                <col className="w-[10%]" />
                <col className="w-[8%]" />
                <col className="w-[41%]" />
                <col className="w-[28%]" />
              </colgroup>
              <thead className="bg-slate-900">
                <tr>
                  <th className="border-b border-slate-800 px-2 py-1.5 text-center text-[14px] font-bold text-white">
                    활동명
                  </th>
                  <th className="border-b border-slate-800 px-2 py-1.5 text-center text-[14px] font-bold text-white">
                    기한
                  </th>
                  <th className="border-b border-slate-800 px-2 py-1.5 text-center text-[14px] font-bold text-white">
                    상태
                  </th>
                  <th className="border-b border-slate-800 px-2 py-1.5 text-center text-[14px] font-bold text-white">
                    수행 내용
                  </th>
                  <th className="border-b border-slate-800 px-2 py-1.5 text-center text-[14px] font-bold text-white">
                    증적 파일
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((record) => (
                  <tr key={record.id} className="bg-white hover:bg-slate-50">
                    <td className="border-b border-slate-100 px-2 py-1.5 text-center align-middle text-[13px] text-slate-800">
                      <span className="block truncate whitespace-nowrap">{record.title}</span>
                    </td>
                    <td className="border-b border-slate-100 px-2 py-1.5 text-center align-middle text-[13px] text-slate-600">
                      {formatDueMonth(record.dueDate)}
                    </td>
                    <td
                      className={`border-b border-slate-100 px-2 py-1.5 text-center align-middle text-[13px] font-semibold ${getStatusTextClassName(
                        record.status,
                      )}`}
                    >
                      {getStatusLabel(record.status)}
                    </td>
                    <td className="border-b border-slate-100 px-2 py-1.5 text-left align-middle text-[13px] text-slate-700">
                      <div className="whitespace-pre-wrap break-words">
                        {record.executionNote && record.executionNote.length > 0
                          ? record.executionNote
                          : '-'}
                      </div>
                    </td>
                    <td className="border-b border-slate-100 px-2 py-1.5 text-left align-middle text-[13px] text-slate-700">
                      {renderEvidenceCell(evidenceFilesByRecord[record.id] ?? [])}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {previewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-5xl rounded-lg border border-slate-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
              <div className="text-[15px] font-semibold">리포트 미리보기</div>
              <button
                type="button"
                onClick={() => setPreviewOpen(false)}
                className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700"
              >
                닫기
              </button>
            </div>

            <div className="p-3">
              <div className="mb-1.5 text-[14px] font-semibold text-slate-900">리포트 요약</div>
              <div className="mb-2.5 grid grid-cols-2 gap-1.5 lg:grid-cols-4">
                <div className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5 text-center">
                  <div className="text-[12px] text-slate-500">전체 건수</div>
                  <div className="mt-0.5 text-[18px] font-bold text-slate-900">
                    {summary.totalCount}건
                  </div>
                </div>
                <div className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5 text-center">
                  <div className="text-[12px] text-slate-500">수행 완료</div>
                  <div className="mt-0.5 text-[18px] font-bold text-emerald-700">
                    {summary.completedCount}건
                  </div>
                </div>
                <div className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5 text-center">
                  <div className="text-[12px] text-slate-500">지연/미이행</div>
                  <div className="mt-0.5 text-[18px] font-bold text-rose-600">
                    {summary.delayedOrIncompleteCount}건
                  </div>
                </div>
                <div className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5 text-center">
                  <div className="text-[12px] text-slate-500">전체 수행률</div>
                  <div className="mt-0.5 text-[18px] font-bold text-blue-700">
                    {summary.completionRate}%
                  </div>
                </div>
              </div>

              <div className="mb-1.5 text-[14px] font-semibold text-slate-900">
                보안 활동 상세 내역
              </div>
              {filteredRecords.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-200 px-3 py-7 text-center text-[13px] text-slate-400">
                  선택한 조건에 해당하는 활동이 없습니다.
                </div>
              ) : (
                <div className="max-h-[65vh] overflow-auto rounded-lg border border-slate-200">
                  <table className="w-full table-fixed border-collapse text-[13px]">
                    <colgroup>
                      <col className="w-[13%]" />
                      <col className="w-[10%]" />
                      <col className="w-[8%]" />
                      <col className="w-[41%]" />
                      <col className="w-[28%]" />
                    </colgroup>
                    <thead className="bg-slate-900">
                      <tr>
                        <th className="border-b border-slate-800 px-2 py-1.5 text-center text-[14px] font-bold text-white">
                          활동명
                        </th>
                        <th className="border-b border-slate-800 px-2 py-1.5 text-center text-[14px] font-bold text-white">
                          기한
                        </th>
                        <th className="border-b border-slate-800 px-2 py-1.5 text-center text-[14px] font-bold text-white">
                          상태
                        </th>
                        <th className="border-b border-slate-800 px-2 py-1.5 text-center text-[14px] font-bold text-white">
                          수행 내용
                        </th>
                        <th className="border-b border-slate-800 px-2 py-1.5 text-center text-[14px] font-bold text-white">
                          증적 파일
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRecords.map((record) => (
                        <tr key={`preview-${record.id}`} className="bg-white hover:bg-slate-50">
                          <td className="border-b border-slate-100 px-2 py-1.5 text-center align-middle text-[13px] text-slate-800">
                            <span className="block truncate whitespace-nowrap">{record.title}</span>
                          </td>
                          <td className="border-b border-slate-100 px-2 py-1.5 text-center align-middle text-[13px] text-slate-600">
                            {formatDueMonth(record.dueDate)}
                          </td>
                          <td
                            className={`border-b border-slate-100 px-2 py-1.5 text-center align-middle text-[13px] font-semibold ${getStatusTextClassName(
                              record.status,
                            )}`}
                          >
                            {getStatusLabel(record.status)}
                          </td>
                          <td className="border-b border-slate-100 px-2 py-1.5 text-left align-middle text-[13px] text-slate-700">
                            <div className="whitespace-pre-wrap break-words">
                              {record.executionNote && record.executionNote.length > 0
                                ? record.executionNote
                                : '-'}
                            </div>
                          </td>
                          <td className="border-b border-slate-100 px-2 py-1.5 text-left align-middle text-[13px] text-slate-700">
                            {renderEvidenceCell(evidenceFilesByRecord[record.id] ?? [])}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
