import type { ActivityStatus } from '@/types';

export function getTaskCardClass(status: ActivityStatus) {
  switch (status) {
    case '완료':
      return 'border-sky-300 bg-sky-50 hover:border-sky-400';
    case '지연':
      return 'border-rose-300 bg-rose-50 hover:border-rose-400';
    case '예약':
    case '진행중':
    default:
      return 'border-emerald-300 bg-emerald-50 hover:border-emerald-400';
  }
}

export function getStatusBadgeClass(status: ActivityStatus) {
  switch (status) {
    case '완료':
      return 'border border-sky-200 bg-sky-100 text-sky-700';
    case '지연':
      return 'border border-rose-200 bg-rose-100 text-rose-700';
    case '예약':
    case '진행중':
    default:
      return 'border border-emerald-200 bg-emerald-100 text-emerald-700';
  }
}

export function getStatusLabel(status: ActivityStatus) {
  switch (status) {
    case '완료':
      return '완료';
    case '지연':
      return '지연';
    case '진행중':
      return '진행중';
    case '예약':
    default:
      return '예정';
  }
}

export function formatDepartmentLabel(
  ownerDepartment: string,
  partnerDepartment: string | null,
) {
  if (partnerDepartment && partnerDepartment.trim() !== '') {
    return `${ownerDepartment} · ${partnerDepartment}`;
  }

  return ownerDepartment;
}