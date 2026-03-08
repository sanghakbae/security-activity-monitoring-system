import type { LucideIcon } from 'lucide-react';

export type AppMenu = 'dashboard' | 'catalog' | 'register' | 'execution' | 'report';
export type ActivityFrequency = '수시' | '월간' | '분기' | '반기' | '연 1회';
export type ActivityStatus = '예약' | '진행중' | '완료' | '지연';

export type ActivityMaster = {
  id: string;
  name: string;
  ownerDepartment: string;
  partnerDepartment: string | null;
  frequency: ActivityFrequency;
  purpose: string;
  guide: string;
  evidences: string[];
};

export type ExecutionRecord = {
  id: string;
  activityMasterId?: string;
  ownerDepartment: string;
  partnerDepartment: string | null;
  frequencyLabel: string;
  title: string;
  description: string;
  dueDate: string;
  status: ActivityStatus;
  evidenceRequired: boolean;
  executionNote: string;
};

export type ExecutionEvidenceFile = {
  id: string;
  executionRecordId: string;
  fileName: string;
  filePath: string;
  uploadedBy: string | null;
  uploadedAt: string;
  thumbnailUrl: string;
};

export type DashboardTask = {
  id: string;
  month: number;
  title: string;
  dueDate: string;
  status: ActivityStatus;
  ownerDepartment: string;
  partnerDepartment: string | null;
};

export type MenuItem = {
  key: AppMenu;
  label: string;
  icon: LucideIcon;
};

export type AuthState = {
  authenticated: boolean;
  email: string | null;
};