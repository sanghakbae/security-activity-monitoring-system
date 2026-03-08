import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  ClipboardPlus,
  FileText,
  LayoutDashboard,
} from 'lucide-react';
import type { AppMenu } from '@/types';

type SidebarProps = {
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (value: boolean | ((prev: boolean) => boolean)) => void;
  activeMenu: AppMenu;
  setActiveMenu: (menu: AppMenu) => void;
};

const sidebarItems: Array<{
  key: AppMenu;
  label: string;
  icon: typeof LayoutDashboard;
}> = [
  { key: 'dashboard', label: '모니터링 대시보드', icon: LayoutDashboard },
  { key: 'catalog', label: '활동 목록 관리', icon: ClipboardList },
  { key: 'register', label: '보안 활동 등록', icon: ClipboardPlus },
  { key: 'execution', label: '수행 및 증적 관리', icon: CheckCircle2 },
  { key: 'report', label: '리포트 생성', icon: FileText },
];

export default function Sidebar({
  sidebarCollapsed,
  setSidebarCollapsed,
  activeMenu,
  setActiveMenu,
}: SidebarProps) {
  return (
    <aside
      className={`hidden min-h-screen border-r border-slate-200 bg-white transition-all duration-300 lg:flex lg:flex-col ${
        sidebarCollapsed ? 'w-[72px]' : 'w-[270px]'
      }`}
    >
      <div className="border-b border-slate-200 px-4 py-4">
        <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'}`}>
          {!sidebarCollapsed && (
            <>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-lg font-bold text-white">
                M
              </div>

              <div className="min-w-0 flex-1">
                <div className="truncate text-[18px] font-semibold text-slate-900">
                  보안 활동 모니터링
                </div>
                <div className="text-xs text-slate-500">SecuGuard</div>
              </div>
            </>
          )}

          <button
            type="button"
            onClick={() => setSidebarCollapsed((prev) => !prev)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      <nav className="mt-4 flex-1 px-3">
        <div className="space-y-1">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeMenu === item.key;

            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setActiveMenu(item.key)}
                className={`flex w-full items-center rounded-xl transition ${
                  isActive
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-700 hover:bg-slate-100'
                } ${sidebarCollapsed ? 'justify-center px-2 py-3' : 'gap-3 px-4 py-3 text-left'}`}
                title={item.label}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {!sidebarCollapsed && <span className="text-[15px] font-medium">{item.label}</span>}
              </button>
            );
          })}
        </div>
      </nav>

      <div className="border-t border-slate-200 px-5 py-4">
        {!sidebarCollapsed && (
          <div className="text-xs text-slate-400">
            Security Activity Monitoring System
          </div>
        )}
      </div>
    </aside>
  );
}