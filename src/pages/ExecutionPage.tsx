import { CheckCircle2, Search } from 'lucide-react'
import type { ExecutionRecord } from '@/types'
import Pagination from '@/components/common/Pagination'

type ExecutionPageProps = {
  keyword: string
  setKeyword: (value: string) => void
  paginatedExecutionRecords: ExecutionRecord[]
  filteredRecordsLength: number
  executionPageSize: number
  executionPage: number
  executionTotalPages: number
  setExecutionPage: (page: number) => void
  onSelect: (executionRecordId: string) => void
}

function getStatusStyle(status: string) {
  switch (status) {
    case '지연':
      return 'bg-rose-100 text-rose-700 border border-rose-200'
    case '완료':
      return 'bg-emerald-100 text-emerald-700 border border-emerald-200'
    case '진행중':
      return 'bg-blue-100 text-blue-700 border border-blue-200'
    default:
      return 'bg-green-100 text-green-700 border border-green-200'
  }
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
    <div className="space-y-6">

      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm lg:gap-4 lg:px-5">
        <div className="flex flex-1 items-center gap-3 text-slate-400">
          <Search className="h-5 w-5" />
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="w-full bg-transparent py-2 outline-none"
            placeholder="보안 활동명, 주기, 상태 검색..."
          />
        </div>
      </div>

      <div className="space-y-4">
        {paginatedExecutionRecords.map((item) => {
          const isDelayed = item.status === '지연'

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              className={`w-full rounded-2xl border px-5 py-5 text-left shadow-sm transition hover:shadow-md lg:px-6 ${
                isDelayed ? 'border-rose-200 bg-rose-50' : 'border-slate-200 bg-white'
              }`}
            >

              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between lg:gap-6">

                <div className="flex-1">

                  <div className="mb-3 flex items-center gap-2">

                    {/* 주기 */}
                    <span className="rounded-lg bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-800">
                      {item.frequencyLabel}
                    </span>

                    {/* 상태 */}
                    <span
                      className={`rounded-lg px-3 py-1 text-xs font-semibold ${getStatusStyle(
                        item.status,
                      )}`}
                    >
                      {item.status}
                    </span>

                  </div>

                  <div className="text-[18px] font-semibold">
                    {item.title}
                  </div>

                </div>

                {/* 기한 */}
                <div className="text-left lg:text-right">
                  <div className="text-xs text-slate-400">기한</div>
                  <div className="mt-1 text-[16px] font-semibold">
                    {item.dueDate.slice(0, 7)}
                  </div>
                </div>

                {/* 완료 */}
                {item.status === '완료' && (
                  <div className="flex w-[160px] items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-700">
                    <CheckCircle2 className="h-7 w-7" />
                    <span className="font-semibold">완료</span>
                  </div>
                )}

                {item.status !== '완료' && <div className="w-[160px]" />}

              </div>

            </button>
          )
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
  )
}