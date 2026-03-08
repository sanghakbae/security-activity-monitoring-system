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
    <div className="border-b border-slate-200 bg-[#08122d] px-5 py-5 text-white lg:hidden">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-xl font-bold text-white">
            M
          </div>
          <div>
            <div className="text-[16px] font-semibold leading-none">보안 활동 모니터링 시스템</div>
            <div className="mt-1 text-xs text-white/70">Security Activity Monitoring System</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenDelayed}
            className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white"
          >
            <Bell className="h-5 w-5" />
            {delayedCount > 0 && (
              <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-rose-500" />
            )}
          </button>

          <button
            type="button"
            onClick={onLogout}
            className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white"
            title={userEmail ? `${userEmail} 계정 로그아웃` : '로그아웃'}
          >
            로그아웃
          </button>
        </div>
      </div>
    </div>
  );
}