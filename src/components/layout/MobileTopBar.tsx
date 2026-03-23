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
    <div className="bg-slate-100 px-5 py-5 text-slate-900 lg:hidden">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-xl font-bold text-white">
            M
          </div>
          <div>
            <div className="text-[15px] font-semibold leading-none">보안 활동 모니터링 시스템</div>
            <div className="mt-1 text-sm text-slate-500">Security Activity Monitoring System</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenDelayed}
            className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-600"
          >
            <Bell className="h-5 w-5" />
            {delayedCount > 0 && (
              <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-rose-500" />
            )}
          </button>

          <button
            type="button"
            onClick={onLogout}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700"
            title={userEmail ? `${userEmail} 계정 로그아웃` : '로그아웃'}
          >
            로그아웃
          </button>
        </div>
      </div>
    </div>
  );
}
