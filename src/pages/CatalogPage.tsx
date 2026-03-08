import type { ActivityMaster, AppMenu } from '@/types';
import Pagination from '@/components/common/Pagination';
import { formatDepartmentLabel } from '@/utils/activity';

type CatalogPageProps = {
  paginatedMasters: ActivityMaster[];
  selectedMasterId: string;
  setSelectedMasterId: (id: string) => void;
  setActiveMenu: (menu: AppMenu) => void;
  mastersLength: number;
  catalogPageSize: number;
  catalogTotalPages: number;
  catalogPage: number;
  setCatalogPage: (page: number) => void;
  selectedMaster: ActivityMaster;
  onCreateNew: () => void;
  onSave: () => void;
  onDelete: () => void;
  updateMasterField: <K extends keyof ActivityMaster>(
    field: K,
    value: ActivityMaster[K],
  ) => void;
};

export default function CatalogPage({
  paginatedMasters,
  selectedMasterId,
  setSelectedMasterId,
  setActiveMenu,
  mastersLength,
  catalogPageSize,
  catalogTotalPages,
  catalogPage,
  setCatalogPage,
  selectedMaster,
  onCreateNew,
  onSave,
  onDelete,
  updateMasterField,
}: CatalogPageProps) {
  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[420px_1fr]">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div className="text-[18px] font-semibold">등록된 보안 활동</div>
          <button
            type="button"
            onClick={onCreateNew}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white"
          >
            신규 등록
          </button>
        </div>

        <div className="space-y-3">
          {paginatedMasters.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelectedMasterId(item.id)}
              className={`w-full rounded-2xl border px-4 py-4 text-left transition ${
                selectedMasterId === item.id
                  ? 'border-slate-900 bg-slate-50'
                  : 'border-slate-200 bg-white hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="truncate text-[16px] font-semibold text-slate-900">
                  {item.name || '이름 없음'}
                </div>
                <span className="shrink-0 rounded-lg bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                  {item.frequency}
                </span>
              </div>
              <div className="mt-2 text-sm text-slate-500">
                {formatDepartmentLabel(item.ownerDepartment, item.partnerDepartment)}
              </div>
              <div className="mt-3 line-clamp-2 text-sm text-slate-400">
                {item.purpose || '설명 없음'}
              </div>
            </button>
          ))}
        </div>

        {mastersLength > catalogPageSize && (
          <Pagination page={catalogPage} totalPages={catalogTotalPages} onChange={setCatalogPage} />
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-5">
          <div>
            <div className="text-[20px] font-semibold">보안 활동 정의</div>
            <div className="mt-1 text-sm text-slate-500">
              활동 목록 관리에서 마스터 정보를 등록하고 수정합니다.
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              보안 활동명 <span className="text-rose-500">*</span>
            </label>
            <input
              value={selectedMaster.name}
              onChange={(e) => updateMasterField('name', e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-4 outline-none focus:border-slate-400"
              placeholder="예: DB 접근제어 로그 리뷰"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_280px]">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                수행 주기 <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedMaster.frequency}
                onChange={(e) =>
                  updateMasterField(
                    'frequency',
                    e.target.value as ActivityMaster['frequency'],
                  )
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-4 outline-none focus:border-slate-400"
              >
                <option value="수시">수시</option>
                <option value="월간">월간</option>
                <option value="분기">분기</option>
                <option value="반기">반기</option>
                <option value="연 1회">연 1회</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                협업 부서 (선택)
              </label>
              <input
                value={selectedMaster.partnerDepartment ?? ''}
                onChange={(e) =>
                  updateMasterField(
                    'partnerDepartment',
                    e.target.value.trim() === '' ? null : e.target.value,
                  )
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-4 outline-none focus:border-slate-400"
                placeholder="없으면 비워두세요"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              활동 목적 (Why)
            </label>
            <textarea
              value={selectedMaster.purpose}
              onChange={(e) => updateMasterField('purpose', e.target.value)}
              className="h-32 w-full rounded-xl border border-slate-200 bg-white px-4 py-4 outline-none focus:border-slate-400"
              placeholder="활동 목적을 입력하세요."
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              수행 내용 및 가이드 (How-to)
            </label>
            <textarea
              value={selectedMaster.guide}
              onChange={(e) => updateMasterField('guide', e.target.value)}
              className="h-40 w-full rounded-xl border border-slate-200 bg-white px-4 py-4 outline-none focus:border-slate-400"
              placeholder="수행 절차 및 가이드를 입력하세요."
            />
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-sm font-semibold text-slate-700">주관 부서</div>
            <div className="mt-2 text-sm text-slate-600">{selectedMaster.ownerDepartment}</div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onDelete}
              className="rounded-xl border border-rose-200 bg-rose-50 px-6 py-3 text-sm font-semibold text-rose-600"
            >
              삭제
            </button>

            <button
              type="button"
              onClick={onSave}
              className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white"
            >
              저장
            </button>

            <button
              type="button"
              onClick={() => setActiveMenu('execution')}
              className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700"
            >
              수행 및 증적 관리 보기
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}