import type { DashboardTask } from '@/types';
import {
  formatDepartmentLabel,
  getStatusBadgeClass,
  getStatusLabel,
  getTaskCardClass,
} from '@/utils/activity';

type ActivityCardProps = {
  task: DashboardTask;
  onClick: (title: string) => void;
};

export default function ActivityCard({ task, onClick }: ActivityCardProps) {
  const departmentLabel = formatDepartmentLabel(
    task.ownerDepartment,
    task.partnerDepartment,
  );

  return (
    <button
      type="button"
      onClick={() => onClick(task.title)}
      className={`w-full rounded-xl border px-3 py-3 text-left transition hover:shadow-sm ${getTaskCardClass(task.status)}`}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <span
          className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${getStatusBadgeClass(task.status)}`}
        >
          {getStatusLabel(task.status)}
        </span>
      </div>

      <div className="text-sm font-semibold leading-5 text-slate-800">
        {task.title}
      </div>

      <div className="mt-1 text-xs font-medium text-slate-500">
        {departmentLabel}
      </div>
    </button>
  );
}