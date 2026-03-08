import type { ActivityMaster, ActivityStatus, DashboardTask } from '@/types';

export function calendarCardClass(status: ActivityStatus) {
  if (status === '완료') {
    return 'border-sky-200 bg-sky-50 text-sky-800';
  }

  if (status === '지연') {
    return 'border-rose-200 bg-rose-50 text-rose-800';
  }

  if (status === '예약' || status === '진행중') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-800';
  }

  return 'border-slate-200 bg-white text-slate-800';
}

export function buildDashboardTasks(masters: ActivityMaster[]): DashboardTask[] {
  const result: DashboardTask[] = [];

  masters.forEach((item) => {
    if (item.frequency === '수시') return;

    const pushTask = (month: number, suffix = '') => {
      result.push({
        id: `${item.id}-${month}${suffix}`,
        month,
        title: item.name,
        dueDate: `${String(month).padStart(2, '0')}월`,
        status: '예약',
        department: item.department,
      });
    };

    if (item.frequency === '월간') {
      Array.from({ length: 12 }, (_, idx) => idx + 1).forEach((month) => pushTask(month));
      return;
    }

    if (item.frequency === '분기') {
      [3, 6, 9, 12].forEach((month, index) => pushTask(month, `-q${index}`));
      return;
    }

    if (item.frequency === '반기') {
      [6, 12].forEach((month, index) => pushTask(month, `-h${index}`));
      return;
    }

    pushTask(12, '-y');
  });

  return result.sort((a, b) => a.month - b.month || a.title.localeCompare(b.title));
}