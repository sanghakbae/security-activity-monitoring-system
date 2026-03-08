import {
  CheckCircle2,
  ClipboardList,
  ClipboardPlus,
  FileText,
  LayoutDashboard,
} from 'lucide-react';
import type { AppMenu } from '@/types';

type MobileBottomNavProps = {
  activeMenu: AppMenu;
  setActiveMenu: (menu: AppMenu) => void;
};

export default function MobileBottomNav({ activeMenu, setActiveMenu }: MobileBottomNavProps) {
  const items: Array<{ key: AppMenu; label: string; icon: any }> = [
    { key: 'dashboard', label: '대시보드', icon: LayoutDashboard },
    { key: 'catalog', label: '목록관리', icon: ClipboardList },
    { key: 'register', label: '활동등록', icon: ClipboardPlus },
    { key: 'execution', label: '수행관리', icon: CheckCircle2 },
    { key: 'report', label: '리포트', icon: FileText },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white px-2 py-2 lg:hidden">
      <div className="grid grid-cols-5 gap-1">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeMenu === item.key;

          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setActiveMenu(item.key)}
              className="flex flex-col items-center justify-center gap-1 rounded-2xl px-1 py-2"
            >
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-full ${
                  isActive ? 'bg-blue-50 text-blue-600' : 'text-slate-400'
                }`}
              >
                <Icon className="h-6 w-6" />
              </div>
              <span className={`text-[11px] font-medium ${isActive ? 'text-blue-600' : 'text-slate-400'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}