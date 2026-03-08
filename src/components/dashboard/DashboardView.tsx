import { AlertCircle, CalendarDays, Mail } from 'lucide-react';
import type { DashboardTask } from '@/types';
import { calendarCardClass } from '@/utils/activity';
import { months } from '@/utils/date';

type DashboardViewProps = {
  dashboardStats: { currentMonthCount: number; doneCount: number; delayedCount: number; rate: number };
  currentDateTime: string;
  currentMonth: number;
  dashboardTasks: DashboardTask[];
  openMasterFromCalendar: (title: string) => void;
  onDelayedEmailAlert: () => void;
};

export default function DashboardView({
  dashboardStats,
  currentDateTime,
  currentMonth,
  dashboardTasks,
  openMasterFromCalendar,
  onDelayedEmailAlert,
}: DashboardViewProps) {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-rose-200 bg-rose-50 px-6 py-5 text-rose-600">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <AlertCircle className="mt-0.5 h-6 w-6 shrink-0" />
            <div className="font-semibold">지연된 보안 활동이 {dashboardStats.delayedCount}건 있습니다.</div>
          </div>

          <button
            type="button"
            onClick={onDelayedEmailAlert}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-600"
          >
            <Mail className="h-4 w-4" />
            지연 알림 메일
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-6 shadow-sm">
          <div className="text-sm text-slate-500">전체 이행률</div>
          <div className="mt-3 text-[46px] font-bold text-slate-900">{dashboardStats.rate}%</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-6 shadow-sm">
          <div className="text-sm text-slate-500">이번 달 대상</div>
          <div className="mt-3 text-[46px] font-bold">{dashboardStats.currentMonthCount}건</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-6 shadow-sm">
          <div className="text-sm text-slate-500">승인 완료</div>
          <div className="mt-3 text-[46px] font-bold text-emerald-600">{dashboardStats.doneCount}건</div>
        </div>
        <div className="rounded-2xl border border-rose-200 bg-white px-5 py-6 shadow-sm">
          <div className="text-sm text-slate-500">지연/미이행</div>
          <div className="mt-3 text-[46px] font-bold text-rose-500">{dashboardStats.delayedCount}건</div>
        </div>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <div className="flex items-center gap-3">
            <CalendarDays className="h-5 w-5 text-slate-900" />
            <h2 className="text-[18px] font-semibold">연간 보안 활동 캘린더</h2>
          </div>
          <div className="text-sm font-medium text-slate-500">{currentDateTime}</div>
        </div>

        <div className="grid grid-cols-2 gap-3 p-4 lg:grid-cols-6 lg:p-5">
          {months.map((label, monthIndex) => {
            const monthTasks = dashboardTasks.filter((task) => task.month === monthIndex + 1);

            return (
              <div key={label} className="rounded-2xl border border-slate-200 bg-slate-50/70">
                <div
                  className={`rounded-t-2xl border-b border-slate-200 px-4 py-3 text-center font-semibold ${
                    currentMonth === monthIndex + 1 ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-900'
                  }`}
                >
                  {label}
                  {currentMonth === monthIndex + 1 ? ' (현재월)' : ''}
                </div>

                <div className="min-h-[160px] space-y-2 p-3">
                  {monthTasks.length === 0 ? (
                    <div className="flex h-[120px] items-center justify-center text-sm text-slate-400">일정 없음</div>
                  ) : (
                    monthTasks.map((task) => (
                      <button
                        key={task.id}
                        type="button"
                        onClick={() => openMasterFromCalendar(task.title)}
                        className={`w-full rounded-xl border px-3 py-3 text-left text-sm transition hover:shadow-sm ${calendarCardClass(task.status)}`}
                      >
                        <div className="font-semibold">{task.title}</div>
                        <div className="mt-1 text-xs opacity-80">{task.department}</div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}