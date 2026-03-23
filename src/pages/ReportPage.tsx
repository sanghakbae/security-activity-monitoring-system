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

export default function ReportPage({
  records,
  evidenceFilesByRecord,
}: ReportPageProps) {
  const currentYear = new Date().getFullYear();

  const [reportType, setReportType] = useState<ReportType>('quarter');
  const [year, setYear] = useState(currentYear);
  const [quarter, setQuarter] = useState(1);
  const [half, setHalf] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);

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
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-5 border-b border-slate-100 pb-4">
          <div className="text-[18px] font-semibold">리포트 생성</div>
          <div className="mt-1 text-sm text-slate-500">
            유형과 기준 연도를 선택한 뒤 PDF 리포트를 생성합니다.
          </div>
        </div>

        <div className="w-full space-y-4">
          <div
            className={`grid w-full gap-4 ${
              reportType === 'quarter' || reportType === 'half'
                ? 'grid-cols-1 lg:grid-cols-4'
                : 'grid-cols-1 lg:grid-cols-3'
            }`}
          >
            <div className="w-full">
              <label className="mb-2 block text-center text-[13px] font-semibold text-slate-700">
                리포트 유형
              </label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value as ReportType)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-center text-[14px] font-medium outline-none focus:border-slate-400"
              >
                <option value="adHoc">수시</option>
                <option value="quarter">분기</option>
                <option value="half">반기</option>
                <option value="year">연간</option>
              </select>
            </div>

            {reportType === 'quarter' && (
              <div className="w-full">
                <label className="mb-2 block text-center text-[13px] font-semibold text-slate-700">
                  분기 선택
                </label>
                <select
                  value={quarter}
                  onChange={(e) => setQuarter(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-center text-[14px] font-medium outline-none focus:border-slate-400"
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
                <label className="mb-2 block text-center text-[13px] font-semibold text-slate-700">
                  반기 선택
                </label>
                <select
                  value={half}
                  onChange={(e) => setHalf(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-center text-[14px] font-medium outline-none focus:border-slate-400"
                >
                  <option value={1}>상반기</option>
                  <option value={2}>하반기</option>
                </select>
              </div>
            )}

            <div className="w-full">
              <label className="mb-2 block text-center text-[13px] font-semibold text-slate-700">
                기준 연도
              </label>
              <select
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-center text-[14px] font-medium outline-none focus:border-slate-400"
              >
                {yearOptions.map((optionYear) => (
                  <option key={optionYear} value={optionYear}>
                    {optionYear}년
                  </option>
                ))}
              </select>
            </div>

            <div className="w-full">
              <label className="mb-2 block text-center text-[13px] font-semibold text-slate-700">
                PDF 생성
              </label>
              <button
                type="button"
                onClick={handleGeneratePdf}
                disabled={filteredRecords.length === 0 || isGenerating}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                <FileText className="h-4 w-4" />
                {isGenerating ? '생성 중...' : 'PDF 생성'}
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3.5">
            <div className="text-right text-[13px] font-semibold text-slate-700">
              대상 활동 수: <span className="text-slate-900">{filteredRecords.length}건</span>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 text-[16px] font-semibold">리포트 대상 미리보기</div>

        {filteredRecords.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-9 text-center text-[13px] text-slate-400">
            선택한 조건에 해당하는 활동이 없습니다.
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <table className="w-full border-collapse text-[13px]">
              <thead className="bg-slate-100">
                <tr>
                  <th className="border-b border-slate-200 px-3 py-2.5 text-center text-[13px] font-bold text-slate-800">
                    활동명
                  </th>
                  <th className="border-b border-slate-200 px-3 py-2.5 text-center text-[13px] font-bold text-slate-800">
                    주기
                  </th>
                  <th className="border-b border-slate-200 px-3 py-2.5 text-center text-[13px] font-bold text-slate-800">
                    활동월
                  </th>
                  <th className="border-b border-slate-200 px-3 py-2.5 text-center text-[13px] font-bold text-slate-800">
                    상태
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((record) => {
                  const dueDate = new Date(record.dueDate);
                  const activityMonth = `${dueDate.getFullYear()}년 ${dueDate.getMonth() + 1}월`;

                  return (
                    <tr key={record.id} className="bg-white">
                      <td className="border-b border-slate-100 px-3 py-2.5 text-center text-[13px] text-slate-800">
                        {record.title}
                      </td>
                      <td className="border-b border-slate-100 px-3 py-2.5 text-center text-[13px] text-slate-600">
                        {record.frequencyLabel}
                      </td>
                      <td className="border-b border-slate-100 px-3 py-2.5 text-center text-[13px] text-slate-600">
                        {activityMonth}
                      </td>
                      <td className="border-b border-slate-100 px-3 py-2.5 text-center text-[13px] font-medium text-slate-700">
                        {record.status}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
