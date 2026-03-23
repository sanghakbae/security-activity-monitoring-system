import { CheckCircle2, Search } from 'lucide-react';
import type { ExecutionRecord } from '@/types';
import Pagination from '@/components/common/Pagination';

type ExecutionPageProps = {
  keyword: string;
  setKeyword: (value: string) => void;
  paginatedExecutionRecords: ExecutionRecord[];
  filteredRecordsLength: number;
  executionPageSize: number;
  executionPage: number;
  executionTotalPages: number;
  setExecutionPage: (page: number) => void;
  onSelect: (executionRecordId: string) => void;
};

function getStatusStyle(status: ExecutionRecord['status']) {
  switch (status) {
    case '지연':
      return 'border border-rose-200 bg-rose-100 text-rose-700';
    case '완료':
      return 'border border-emerald-200 bg-emerald-100 text-emerald-700';
    case '진행중':
      return 'border border-blue-200 bg-blue-100 text-blue-700';
    case '예약':
    default:
      return 'border border-emerald-200 bg-emerald-100 text-emerald-700';
  }
}

function getStatusLabel(status: ExecutionRecord['status']) {
  return status === '예약' ? '예정' : status;
}

export default function ExecutionPage({
  keyword,
  setKeyword,
  paginatedExecutionRecords,
  filteredRecordsLength,
  executionPageSize,
  executionPage,
  executionTotalPages,
  setExecutionPage,
  onSelect,
}: ExecutionPageProps) {
  return (
    <div className="space-y-3" style={{ fontFamily: 'KoPubDotumMedium' }}>
      <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-2.5 shadow-sm">
        <div className="flex flex-1 items-center gap-3 text-slate-400">
          <Search className="h-4 w-4" />
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="w-full bg-transparent py-0.5 text-sm outline-none"
            placeholder="보안 활동명 검색..."
          />
        </div>
      </div>

      <div className="space-y-2.5">
        {paginatedExecutionRecords.map((item) => {
          const isDelayed = item.status === '지연';

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              className={`w-full rounded-lg border px-3 py-3 text-left shadow-sm transition hover:shadow-md ${
                isDelayed ? 'border-rose-200 bg-rose-50' : 'border-slate-200 bg-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <div className="mb-1.5 flex items-center gap-2">
                    <span className="shrink-0 rounded-sm bg-slate-200 px-2 py-0.5 text-[11px] font-semibold leading-none text-slate-800">
                      {item.frequencyLabel}
                    </span>

                    <span
                      className={`shrink-0 rounded-sm px-2 py-0.5 text-[11px] font-semibold leading-none ${getStatusStyle(
                        item.status,
                      )}`}
                    >
                      {getStatusLabel(item.status)}
                    </span>
                  </div>

                  <div className="break-keep text-[15px] font-semibold leading-5 text-slate-900">
                    {item.title}
                  </div>
                </div>

                <div className="ml-auto shrink-0 text-right">
                  <div className="text-[11px] leading-none text-slate-400">기한</div>
                  <div className="mt-1 text-[14px] font-semibold leading-none text-slate-900">
                    {item.dueDate.slice(0, 7)}
                  </div>
                </div>

                {item.status === '완료' && (
                  <div className="flex shrink-0 items-center justify-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-2 text-emerald-700">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="text-sm font-semibold">완료</span>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {filteredRecordsLength > executionPageSize && (
        <Pagination
          page={executionPage}
          totalPages={executionTotalPages}
          onChange={setExecutionPage}
        />
      )}
    </div>
  );
}
