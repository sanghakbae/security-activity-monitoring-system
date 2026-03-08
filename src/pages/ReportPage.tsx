import { useMemo, useState } from 'react';
import type { ExecutionEvidenceFile, ExecutionRecord } from '@/types';
import { generateSecurityReportPdf } from '@/utils/report';

type ReportPageProps = {
  records: ExecutionRecord[];
  evidenceFilesByRecord: Record<string, ExecutionEvidenceFile[]>;
};

type ReportType = 'quarter' | 'half' | 'year';

export default function ReportPage({ records, evidenceFilesByRecord }: ReportPageProps) {
  const currentYear = new Date().getFullYear();
  const [reportType, setReportType] = useState<ReportType>('quarter');
  const [year, setYear] = useState(currentYear);
  const [quarter, setQuarter] = useState(1);
  const [half, setHalf] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);

  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      const dueDate = new Date(record.dueDate);
      const recordYear = dueDate.getFullYear();
      const month = dueDate.getMonth() + 1;

      if (recordYear !== year) return false;

      if (reportType === 'quarter') {
        const quarterRange = {
          1: [1, 2, 3],
          2: [4, 5, 6],
          3: [7, 8, 9],
          4: [10, 11, 12],
        }[quarter];
        return quarterRange.includes(month);
      }

      if (reportType === 'half') {
        return half === 1 ? month >= 1 && month <= 6 : month >= 7 && month <= 12;
      }

      return true;
    });
  }, [records, reportType, year, quarter, half]);

  const handleGenerate = async () => {
    try {
      setIsGenerating(true);
      await generateSecurityReportPdf({
        reportType,
        year,
        quarter,
        half,
        records: filteredRecords,
        evidenceFilesByRecord,
      });
    } catch (error) {
      console.error('generateSecurityReportPdf error:', error);
      window.alert(
        error instanceof Error ? `PDF 생성 오류: ${error.message}` : 'PDF 생성 중 오류가 발생했습니다.',
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <h2 className="text-[20px] font-semibold">리포트 생성</h2>
        <p className="mt-1 text-sm text-slate-500">분기/반기/연 리포트를 PDF로 생성합니다.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div>
          <label className="mb-2 block text-sm font-semibold">리포트 유형</label>
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value as ReportType)}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none"
          >
            <option value="quarter">분기</option>
            <option value="half">반기</option>
            <option value="year">연간</option>
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold">기준 연도</label>
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none"
          />
        </div>

        {reportType === 'quarter' && (
          <div>
            <label className="mb-2 block text-sm font-semibold">분기</label>
            <select
              value={quarter}
              onChange={(e) => setQuarter(Number(e.target.value))}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none"
            >
              <option value={1}>1분기</option>
              <option value={2}>2분기</option>
              <option value={3}>3분기</option>
              <option value={4}>4분기</option>
            </select>
          </div>
        )}

        {reportType === 'half' && (
          <div>
            <label className="mb-2 block text-sm font-semibold">반기</label>
            <select
              value={half}
              onChange={(e) => setHalf(Number(e.target.value))}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none"
            >
              <option value={1}>상반기</option>
              <option value={2}>하반기</option>
            </select>
          </div>
        )}

        <div className="flex items-end">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {isGenerating ? 'PDF 생성 중...' : 'PDF 생성'}
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
        <div className="text-sm font-semibold text-slate-700">대상 활동 수</div>
        <div className="mt-2 text-3xl font-bold text-slate-900">{filteredRecords.length}건</div>
      </div>
    </div>
  );
}