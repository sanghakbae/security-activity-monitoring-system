import type { DashboardTask } from '@/types';
import { formatDepartmentLabel } from '@/utils/activity';

type ActivityCardProps = {
  task: DashboardTask;
  onClick: () => void;
};

function getStatusStyle(status: DashboardTask['status']) {
  switch (status) {
    case '완료':
      return {
        card: 'border-sky-200 bg-sky-50',
        badge: 'border border-sky-200 bg-sky-100 text-sky-700',
      };
    case '지연':
      return {
        card: 'border-rose-200 bg-rose-50',
        badge: 'border border-rose-200 bg-rose-100 text-rose-700',
      };
    case '진행중':
      return {
        card: 'border-amber-200 bg-amber-50',
        badge: 'border border-amber-200 bg-amber-100 text-amber-700',
      };
    case '예약':
    default:
      return {
        card: 'border-emerald-200 bg-emerald-50',
        badge: 'border border-emerald-200 bg-emerald-100 text-emerald-700',
      };
  }
}

export default function ActivityCard({ task, onClick }: ActivityCardProps) {
  const statusStyle = getStatusStyle(task.status);
  const departmentLabel = formatDepartmentLabel(
    task.ownerDepartment,
    task.partnerDepartment,
  );

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-xl border px-2 py-2 text-left transition hover:shadow-sm ${statusStyle.card}`}
      style={{ fontFamily: 'KoPubDotumMedium' }}
    >
      <div className="mb-1.5 flex items-start justify-between gap-2">
        <span
          className={`inline-flex items-center justify-center rounded-full px-1.5 py-0.5 text-[11px] font-semibold leading-none ${statusStyle.badge}`}
        >
          {task.status}
        </span>
      </div>

      <div className="break-keep text-[13px] font-semibold leading-[18px] text-slate-900">
        {task.title}
      </div>

      <div className="mt-1 text-[11px] leading-4 text-slate-500">
        {departmentLabel}
      </div>
    </button>
  );
}