import type { ActivityMaster, AppMenu } from '@/types';
import Pagination from '@/components/common/Pagination';

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
}: CatalogPageProps) {
  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[440px_1fr]">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div className="text-[18px] font-semibold">등록된 보안 활동</div>
          <button
            type="button"
            onClick={onCreateNew}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white whitespace-nowrap"
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
                  ? 'border-slate-900 bg-slate-100'
                  : 'border-slate-200 bg-white hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="text-[16px] font-semibold">{item.name}</div>
                <span className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                  {item.frequency}
                </span>
              </div>
              <div className="mt-2 text-sm text-slate-500">{item.department}</div>
              <div className="mt-3 line-clamp-2 text-sm text-slate-400">{item.purpose}</div>
            </button>
          ))}
        </div>

        {mastersLength > catalogPageSize && (
          <Pagination page={catalogPage} totalPages={catalogTotalPages} onChange={setCatalogPage} />
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-col gap-4 border-b border-slate-100 pb-5 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="text-[20px] font-semibold">활동 상세 정보</div>
            <div className="mt-1 text-sm text-slate-500">활동 정의를 등록하고 수정합니다.</div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-xs text-slate-400">활동명</div>
            <div className="mt-2 text-[18px] font-semibold">{selectedMaster.name}</div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-xs text-slate-400">협업 부서</div>
            <div className="mt-2 text-[18px] font-semibold">{selectedMaster.department}</div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 md:col-span-2">
            <div className="text-xs text-slate-400">수행 주기</div>
            <div className="mt-2 text-[18px] font-semibold">{selectedMaster.frequency}</div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 md:col-span-2">
            <div className="text-xs text-slate-400">활동 목적</div>
            <div className="mt-2 leading-7 text-slate-700">{selectedMaster.purpose}</div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 md:col-span-2">
            <div className="text-xs text-slate-400">수행 가이드</div>
            <div className="mt-2 leading-7 text-slate-700">{selectedMaster.guide}</div>
          </div>

          <div className="flex justify-end gap-3 md:col-span-2">
            <button
              type="button"
              onClick={onSave}
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white"
            >
              저장
            </button>

            <button
              type="button"
              onClick={() => setActiveMenu('register')}
              className="rounded-xl border border-slate-200 bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700"
            >
              실행 등록 화면으로 이동
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}