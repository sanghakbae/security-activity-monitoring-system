import {
  CheckCircle2,
  ClipboardList,
  ClipboardPlus,
  FileText,
  LayoutDashboard,
  Shield,
} from 'lucide-react';
import type { AppMenu } from '@/types';

type MobileBottomNavProps = {
  activeMenu: AppMenu;
  setActiveMenu: (menu: AppMenu) => void;
};

const items: Array<{
  key: AppMenu;
  label: string;
  icon: typeof LayoutDashboard;
}> = [
  { key: 'dashboard', label: '대시보드', icon: LayoutDashboard },
  { key: 'catalog', label: '목록관리', icon: ClipboardList },
  { key: 'register', label: '활동등록', icon: ClipboardPlus },
  { key: 'execution', label: '수행관리', icon: CheckCircle2 },
  { key: 'report', label: '리포트', icon: FileText },
  { key: 'security', label: '보안설정', icon: Shield },
];

export default function MobileBottomNav({ activeMenu, setActiveMenu }: MobileBottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 px-1.5 py-1.5 backdrop-blur-sm lg:hidden">
      <div className="grid grid-cols-6 gap-0.5">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeMenu === item.key;

          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setActiveMenu(item.key)}
              className="flex flex-col items-center justify-center gap-0.5 rounded-md px-1 py-1.5"
            >
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-md ${
                  isActive ? 'bg-blue-50 text-blue-600' : 'text-slate-400'
                }`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <span
                className={`text-[10px] font-medium ${isActive ? 'text-blue-600' : 'text-slate-400'}`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
