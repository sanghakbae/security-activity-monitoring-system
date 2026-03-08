import { Paperclip, Save } from 'lucide-react';
import type { ExecutionEvidenceFile, ExecutionRecord } from '@/types';
import { formatDepartmentLabel } from '@/utils/activity';

type RegisterPageProps = {
  selectedExecutionRecord: ExecutionRecord;
  selectedExecutionEvidenceFiles: ExecutionEvidenceFile[];
  selectedExecutionTargetPeriod: string;
  onChangeExecutionNote: (value: string) => void;
  onSaveExecutionNote: () => void;
  onOpenFileDialog: () => void;
  onComplete: () => void;
};

export default function RegisterPage({
  selectedExecutionRecord,
  selectedExecutionEvidenceFiles,
  selectedExecutionTargetPeriod,
  onChangeExecutionNote,
  onSaveExecutionNote,
  onOpenFileDialog,
  onComplete,
}: RegisterPageProps) {
  const departmentLabel = formatDepartmentLabel(
    selectedExecutionRecord.ownerDepartment,
    selectedExecutionRecord.partnerDepartment,
  );

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 border-b border-slate-100 pb-5">
          <div className="text-[20px] font-semibold">보안 활동 등록</div>
          <div className="mt-1 text-sm text-slate-500">
            선택한 수행 대상의 내역과 증적을 등록합니다.
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-xs text-slate-400">보안 활동명</div>
            <div className="mt-2 text-[18px] font-semibold text-slate-900">
              {selectedExecutionRecord.title}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-xs text-slate-400">대상 기간</div>
            <div className="mt-2 text-[18px] font-semibold text-slate-900">
              {selectedExecutionTargetPeriod}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-xs text-slate-400">부서</div>
            <div className="mt-2 text-[18px] font-semibold text-slate-900">
              {departmentLabel}
            </div>
          </div>
        </div>

        <div className="mt-6">
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            수행 내역
          </label>
          <textarea
            value={selectedExecutionRecord.executionNote}
            onChange={(e) => onChangeExecutionNote(e.target.value)}
            className="h-40 w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 outline-none focus:border-slate-400"
            placeholder="해당 월(또는 분기/반기/연도)의 수행 내역을 입력하세요."
          />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="text-[18px] font-semibold">증적 자료</div>
            <div className="mt-1 text-sm text-slate-500">
              파일을 업로드하면 썸네일이 표시됩니다.
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenFileDialog}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700"
          >
            <Paperclip className="h-4 w-4" />
            증적 업로드
          </button>
        </div>

        {selectedExecutionEvidenceFiles.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-10 text-center text-sm text-slate-400">
            업로드된 증적이 없습니다.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {selectedExecutionEvidenceFiles.map((file) => (
              <div
                key={file.id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
              >
                <div className="flex h-44 items-center justify-center bg-slate-50">
                  {file.thumbnailUrl ? (
                    <img
                      src={file.thumbnailUrl}
                      alt={file.fileName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="text-sm text-slate-400">미리보기 없음</div>
                  )}
                </div>

                <div className="p-4">
                  <div className="truncate text-sm font-semibold text-slate-800">
                    {file.fileName}
                  </div>
                  <div className="mt-1 text-xs text-slate-400">
                    업로드: {new Date(file.uploadedAt).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onSaveExecutionNote}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700"
          >
            <Save className="h-4 w-4" />
            저장
          </button>

          <button
            type="button"
            onClick={onComplete}
            className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white"
          >
            완료 처리
          </button>
        </div>
      </section>
    </div>
  );
}