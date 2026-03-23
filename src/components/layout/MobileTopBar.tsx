import { Bell } from 'lucide-react';

type MobileTopBarProps = {
  delayedCount: number;
  userEmail: string;
  onOpenDelayed: () => void;
  onLogout: () => void;
};

export default function MobileTopBar({
  delayedCount,
  userEmail,
  onOpenDelayed,
  onLogout,
}: MobileTopBarProps) {
  return (
    <div className="bg-slate-100 px-3 py-3 text-slate-900 lg:hidden">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-lg font-bold text-white">
            M
          </div>
          <div className="min-w-0">
            <div className="truncate text-[13px] font-semibold leading-none">
              보안 활동 모니터링 시스템
            </div>
            <div className="mt-0.5 truncate text-[11px] text-slate-500">
              Security Activity Monitoring System
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={onOpenDelayed}
            className="relative flex h-9 w-9 items-center justify-center rounded-md bg-white text-slate-600"
          >
            <Bell className="h-4 w-4" />
            {delayedCount > 0 && (
              <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-rose-500" />
            )}
          </button>

          <button
            type="button"
            onClick={onLogout}
            className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-[12px] font-medium text-slate-700"
            title={userEmail ? `${userEmail} 계정 로그아웃` : '로그아웃'}
          >
            로그아웃
          </button>
        </div>
      </div>
    </div>
  );
}
