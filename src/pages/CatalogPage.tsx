import type { Dispatch, SetStateAction } from 'react';
import type { ActivityFrequency, ActivityMaster, AppMenu } from '@/types';
import Pagination from '@/components/common/Pagination';

type CatalogPageProps = {
  paginatedMasters: ActivityMaster[];
  selectedMasterId: string;
  setSelectedMasterId: (value: string) => void;
  setActiveMenu: Dispatch<SetStateAction<AppMenu>>;
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

const frequencyOptions: ActivityFrequency[] = ['수시', '월간', '분기', '반기', '연 1회'];

function getFrequencyTagStyle(frequency: ActivityFrequency) {
  switch (frequency) {
    case '월간':
      return 'border-emerald-300 bg-emerald-100 text-emerald-700';
    case '분기':
      return 'border-sky-300 bg-sky-100 text-sky-700';
    case '반기':
      return 'border-violet-300 bg-violet-100 text-violet-700';
    case '연 1회':
      return 'border-amber-300 bg-amber-100 text-amber-700';
    case '수시':
    default:
      return 'border-slate-300 bg-slate-100 text-slate-700';
  }
}

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
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[280px_minmax(0,1fr)]">
      <section className="rounded-md border border-slate-200 bg-white p-2.5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div className="text-[16px] font-semibold">활동 목록</div>
          <button
            type="button"
            onClick={onCreateNew}
            className="rounded-md bg-slate-900 px-2.5 py-1.5 text-[12px] font-semibold text-white"
          >
            신규 등록
          </button>
        </div>

        <div className="space-y-1.5">
          {paginatedMasters.map((master) => (
            <button
              key={master.id}
              type="button"
              onClick={() => setSelectedMasterId(master.id)}
              className={`w-full rounded-md border px-2 py-1.5 text-left transition ${
                selectedMasterId === master.id
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-slate-200 bg-white text-slate-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="min-w-0 truncate text-[13px] font-semibold">
                  {master.name || '이름 없음'}
                </div>
                <span
                  className={`shrink-0 rounded-sm border px-1.5 py-0.5 text-[10px] font-semibold leading-none ${
                    selectedMasterId === master.id
                      ? 'border-white/30 bg-white/15 text-white'
                      : getFrequencyTagStyle(master.frequency)
                  }`}
                >
                  {master.frequency}
                </span>
              </div>
            </button>
          ))}
        </div>

        {mastersLength > catalogPageSize && (
          <div className="mt-4">
            <Pagination
              page={catalogPage}
              totalPages={catalogTotalPages}
              onChange={setCatalogPage}
            />
          </div>
        )}
      </section>

      <section className="rounded-md border border-slate-200 bg-white p-2.5 shadow-sm">
        <div className="mb-3 border-b border-slate-100 pb-2.5">
          <div className="text-[16px] font-semibold">보안 활동 정의</div>
          <div className="mt-0.5 text-[12px] text-slate-500">
            활동 목록 관리에서 마스터 정보를 등록하고 수정합니다.
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-[12px] font-bold text-slate-800">
              보안 활동명 <span className="text-rose-500">*</span>
            </label>
            <input
              value={selectedMaster.name}
              onChange={(e) => updateMasterField('name', e.target.value)}
              className="w-full rounded-md border border-slate-200 px-2 py-1.5 text-[13px] outline-none"
            />
          </div>

          <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-2">
            <div>
              <label className="mb-1 block text-[12px] font-bold text-slate-800">
                수행 주기 <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedMaster.frequency}
                onChange={(e) =>
                  updateMasterField('frequency', e.target.value as ActivityFrequency)
                }
                className="w-full rounded-md border border-slate-200 px-2 py-1.5 text-[13px] outline-none"
              >
                {frequencyOptions.map((frequency) => (
                  <option key={frequency} value={frequency}>
                    {frequency}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-[12px] font-bold text-slate-800">
                협업 부서 (선택)
              </label>
              <input
                value={selectedMaster.partnerDepartment ?? ''}
                onChange={(e) => updateMasterField('partnerDepartment', e.target.value || null)}
                className="w-full rounded-md border border-slate-200 px-2 py-1.5 text-[13px] outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-[12px] font-bold text-slate-800">
              활동 목적 (Why)
            </label>
            <textarea
              value={selectedMaster.purpose}
              onChange={(e) => updateMasterField('purpose', e.target.value)}
              className="h-32 w-full rounded-md border border-slate-200 px-2 py-1.5 text-[13px] outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-[12px] font-bold text-slate-800">
              수행 내용 및 가이드 (How-to)
            </label>
            <textarea
              value={selectedMaster.guide}
              onChange={(e) => updateMasterField('guide', e.target.value)}
              className="h-36 w-full rounded-md border border-slate-200 px-2 py-1.5 text-[13px] outline-none"
            />
          </div>

          <div className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5">
            <div className="text-[12px] font-bold text-slate-800">
              주관 부서: <span className="text-slate-900">{selectedMaster.ownerDepartment}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3">
            <button
              type="button"
              onClick={onDelete}
              className="rounded-md border border-rose-200 bg-white px-2.5 py-1.5 text-[12px] font-semibold text-rose-500"
            >
              삭제
            </button>

            <button
              type="button"
              onClick={onSave}
              className="rounded-md bg-slate-900 px-2.5 py-1.5 text-[12px] font-semibold text-white"
            >
              저장
            </button>

            <button
              type="button"
              onClick={() => setActiveMenu('execution')}
              className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-[12px] font-semibold text-slate-700"
            >
              수행 및 증적 관리 보기
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
