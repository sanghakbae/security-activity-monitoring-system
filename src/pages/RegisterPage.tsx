import { CheckCircle2, UploadCloud } from 'lucide-react';
import type { ExecutionEvidenceFile, ExecutionRecord } from '@/types';

type RegisterPageProps = {
  selectedExecutionRecord: ExecutionRecord;
  selectedExecutionEvidenceFiles: ExecutionEvidenceFile[];
  onChangeExecutionNote: (value: string) => void;
  onSaveExecutionNote: () => void;
  onOpenFileDialog: () => void;
  onComplete: () => void;
};

export default function RegisterPage({
  selectedExecutionRecord,
  selectedExecutionEvidenceFiles,
  onChangeExecutionNote,
  onSaveExecutionNote,
  onOpenFileDialog,
  onComplete,
}: RegisterPageProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="w-full px-5 py-8 lg:px-8">
        <div className="space-y-8 py-4">
          <div>
            <label className="mb-2 block text-sm font-semibold">보안 활동명</label>
            <input
              value={selectedExecutionRecord.title}
              disabled
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-slate-700 outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">수행 내역</label>
            <textarea
              value={selectedExecutionRecord.executionNote}
              onChange={(e) => onChangeExecutionNote(e.target.value)}
              className="h-40 w-full rounded-xl border border-slate-200 bg-white px-4 py-4 outline-none focus:border-slate-400"
              placeholder="실제 수행한 작업 내역을 입력하세요."
            />
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <div className="mb-4 text-sm font-semibold">증적자료 업로드</div>

            <button
              type="button"
              onClick={onOpenFileDialog}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 font-semibold text-slate-700"
            >
              <UploadCloud className="h-5 w-5" />
              파일 업로드
            </button>

            <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
              {selectedExecutionEvidenceFiles.length === 0 ? (
                <div className="col-span-full text-sm text-slate-400">업로드된 증적자료가 없습니다.</div>
              ) : (
                selectedExecutionEvidenceFiles.map((file) => (
                  <div
                    key={file.id}
                    className="overflow-hidden rounded-xl border border-slate-200 bg-white"
                  >
                    <div className="flex h-36 items-center justify-center bg-slate-100">
                      {file.thumbnailUrl ? (
                        <img
                          src={file.thumbnailUrl}
                          alt={file.fileName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="px-3 text-center text-xs text-slate-400">미리보기 없음</div>
                      )}
                    </div>
                    <div className="space-y-1 px-3 py-3">
                      <div className="truncate text-sm font-medium text-slate-700">{file.fileName}</div>
                      <div className="text-[11px] text-slate-400">
                        업로드: {new Date(file.uploadedAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="flex flex-wrap justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onSaveExecutionNote}
              className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700"
            >
              수행 내역 저장
            </button>

            <button
              type="button"
              onClick={onComplete}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white"
            >
              <CheckCircle2 className="h-4 w-4" />
              완료 처리
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}