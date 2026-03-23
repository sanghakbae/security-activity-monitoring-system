import { Bell } from 'lucide-react';

type HeaderProps = {
  activeMenuLabel: string;
  delayedCount: number;
  userEmail: string;
  onOpenDelayed: () => void;
  onLogout: () => void;
};

export default function Header({
  activeMenuLabel,
  delayedCount,
  userEmail,
  onOpenDelayed,
  onLogout,
}: HeaderProps) {
  return (
    <header className="hidden bg-slate-100 lg:flex">
      <div className="flex w-full items-center justify-between px-6 py-4">
        <h1 className="text-[22px] font-semibold text-slate-900">{activeMenuLabel}</h1>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenDelayed}
            className="relative flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600"
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
    </header>
  );
}
