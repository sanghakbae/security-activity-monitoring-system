import { CheckCircle2, Paperclip, Save, Trash2 } from 'lucide-react';
import type { ExecutionEvidenceFile, ExecutionRecord } from '@/types';

type RegisterPageProps = {
  selectedExecutionRecord: ExecutionRecord;
  selectedExecutionEvidenceFiles: ExecutionEvidenceFile[];
  selectedExecutionTargetPeriod: string;
  onChangeExecutionNote: (value: string) => void;
  onSaveExecutionNote: () => void;
  onOpenFileDialog: () => void;
  onDeleteEvidenceFile: (evidenceFileId: string) => void;
  onComplete: () => void;
};

export default function RegisterPage({
  selectedExecutionRecord,
  selectedExecutionEvidenceFiles,
  selectedExecutionTargetPeriod,
  onChangeExecutionNote,
  onSaveExecutionNote,
  onOpenFileDialog,
  onDeleteEvidenceFile,
  onComplete,
}: RegisterPageProps) {
  const isPlaceholder = selectedExecutionRecord.id === 'placeholder-register-record';

  return (
    <div className="space-y-5">
      <section className="rounded-md border border-slate-200 bg-white p-2.5 shadow-sm">
        <div className="mb-3">
          <div className="text-[16px] font-semibold">보안 활동 등록</div>
          <div className="mt-0.5 text-xs text-slate-500">
            수행 내역과 증적을 등록합니다.
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="rounded-md border border-slate-200 px-2 py-1.5">
            <div className="text-[12px] font-medium text-slate-400">보안 활동명</div>
            <div className="mt-1 text-[13px] font-semibold text-slate-900">
              {selectedExecutionRecord.title || '-'}
            </div>
          </div>

          <div className="rounded-md border border-slate-200 px-2 py-1.5">
            <div className="text-[12px] font-medium text-slate-400">대상 기간</div>
            <div className="mt-1 text-[13px] font-semibold text-slate-900">
              {selectedExecutionTargetPeriod || '-'}
            </div>
          </div>

          <div className="rounded-md border border-slate-200 px-2 py-1.5">
            <div className="text-[12px] font-medium text-slate-400">주기</div>
            <div className="mt-1 text-[13px] font-semibold text-slate-900">
              {selectedExecutionRecord.frequencyLabel || '-'}
            </div>
          </div>
        </div>

        {isPlaceholder && (
          <div className="mt-4 rounded-md border border-dashed border-slate-200 bg-slate-50 px-2 py-1.5 text-xs text-slate-500">
            먼저 <span className="font-semibold text-slate-700">수행 및 증적 관리</span> 또는
            <span className="font-semibold text-slate-700"> 보안 활동 캘린더</span>에서
            등록할 활동을 선택해 주세요.
          </div>
        )}

        <div className="mt-4">
          <div className="mb-1 text-[13px] font-semibold text-slate-800">수행 내역</div>
          <textarea
            value={selectedExecutionRecord.executionNote ?? ''}
            onChange={(e) => onChangeExecutionNote(e.target.value)}
            disabled={isPlaceholder}
            className="h-44 w-full rounded-md border border-slate-200 px-2 py-1.5 text-[13px] outline-none placeholder:text-slate-300 disabled:bg-slate-50 disabled:text-slate-400"
            placeholder="해당 월(또는 분기/반기/연도)의 수행 내역을 입력하세요."
          />
        </div>
      </section>

      <section className="rounded-md border border-slate-200 bg-white p-2.5 shadow-sm">
        <div className="mb-3 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-[16px] font-semibold">증적 자료</div>
            <div className="mt-0.5 text-xs text-slate-500">
              파일을 업로드하면 목록이 표시됩니다.
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenFileDialog}
            disabled={isPlaceholder}
            className="inline-flex items-center justify-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs font-semibold text-slate-700 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
          >
            <Paperclip className="h-4 w-4" />
            증적 업로드
          </button>
        </div>

        {selectedExecutionEvidenceFiles.length === 0 ? (
          <div className="flex h-20 items-center justify-center rounded-md border border-dashed border-slate-200 text-[12px] text-slate-400">
            업로드된 증적이 없습니다.
          </div>
        ) : (
          <div className="space-y-1.5">
            {selectedExecutionEvidenceFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between gap-2 rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5"
              >
                <div className="min-w-0 flex-1 truncate text-[12px] text-slate-700">
                  {file.fileName}
                </div>
                <div className="shrink-0 text-[11px] text-slate-400">
                  {file.uploadedAt ? String(file.uploadedAt).slice(0, 10) : ''}
                </div>
                <button
                  type="button"
                  onClick={() => onDeleteEvidenceFile(file.id)}
                  className="inline-flex shrink-0 items-center justify-center gap-1 rounded-md border border-rose-200 bg-white px-2 py-1 text-[11px] font-semibold text-rose-600"
                >
                  <Trash2 className="h-3 w-3" />
                  삭제
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onSaveExecutionNote}
            disabled={isPlaceholder}
            className="inline-flex items-center justify-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
          >
            <Save className="h-4 w-4" />
            저장
          </button>

          <button
            type="button"
            onClick={onComplete}
            disabled={isPlaceholder}
            className="inline-flex items-center justify-center gap-1.5 rounded-md bg-slate-900 px-2.5 py-1.5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            <CheckCircle2 className="h-4 w-4" />
            완료 처리
          </button>
        </div>
      </section>
    </div>
  );
}
