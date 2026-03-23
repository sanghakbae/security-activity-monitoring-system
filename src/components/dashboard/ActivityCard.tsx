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
  const statusLabel = task.status === '예약' ? '예정' : task.status;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full flex-col items-start justify-start rounded-md border px-1.5 py-1.5 text-left shadow-[0_2px_8px_rgba(15,23,42,0.08)] transition hover:-translate-y-[1px] hover:shadow-[0_6px_12px_rgba(15,23,42,0.14)] ${statusStyle.card}`}
      style={{ fontFamily: 'KoPubDotumMedium' }}
    >
      <div className="mb-1 flex w-full items-start justify-start gap-1.5">
        <span
          className={`inline-flex items-center justify-center rounded-md px-1 py-0.5 text-[10px] font-semibold leading-none ${statusStyle.badge}`}
        >
          {statusLabel}
        </span>
      </div>

      <div className="break-keep text-[12px] font-semibold leading-[16px] text-slate-900">
        {task.title}
      </div>

      <div className="mt-0.5 text-[10px] leading-3.5 text-slate-500">
        {departmentLabel}
      </div>
    </button>
  );
}
