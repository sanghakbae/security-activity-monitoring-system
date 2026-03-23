import { ChangeEvent, useMemo, useRef, useState } from 'react';
import Header from '@/components/layout/Header';
import MobileBottomNav from '@/components/layout/MobileBottomNav';
import MobileTopBar from '@/components/layout/MobileTopBar';
import Sidebar from '@/components/layout/Sidebar';
import DashboardView from '@/components/dashboard/DashboardView';
import CatalogPage from '@/pages/CatalogPage';
import ExecutionPage from '@/pages/ExecutionPage';
import RegisterPage from '@/pages/RegisterPage';
import ReportPage from '@/pages/ReportPage';
import SecuritySettingsPage from '@/pages/SecuritySettingsPage';
import { useSecurityActivityData } from '@/hooks/useSecurityActivityData';
import type { AppMenu, ActivityMaster, ExecutionRecord } from '@/types';
import { formatNow } from '@/utils/date';

type DashboardPageProps = {
  userEmail: string;
  onLogout: () => void;
};

function formatExecutionTargetPeriod(dueDate: string) {
  const date = new Date(dueDate);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  return `${year}년 ${month}월 활동`;
}

function toMonthKey(dateString: string) {
  const date = new Date(dateString);
  return date.getFullYear() * 100 + (date.getMonth() + 1);
}

function formatMonthInputValue(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  return `${year}-${month}`;
}

export default function DashboardPage({ userEmail, onLogout }: DashboardPageProps) {
  const [activeMenu, setActiveMenu] = useState<AppMenu>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [executionFilterMode, setExecutionFilterMode] = useState<
    'all' | 'currentMonth' | 'done' | 'delayed'
  >('all');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const {
    now,
    masters,
    setMasters,
    records,
    evidenceFilesByRecord,
    selectedMaster,
    selectedMasterId,
    setSelectedMasterId,
    selectedExecutionRecord,
    selectedExecutionRecordId,
    setSelectedExecutionRecordId,
    selectedExecutionEvidenceFiles,
    keyword,
    setKeyword,
    executionPage,
    setExecutionPage,
    catalogPage,
    setCatalogPage,
    filteredRecords,
    executionPageSize,
    catalogPageSize,
    catalogTotalPages,
    paginatedMasters,
    dashboardTasks,
    updateMasterField,
    saveSelectedMaster,
    deleteSelectedMaster,
    setSelectedExecutionNote,
    updateExecutionNote,
    uploadEvidenceFile,
    deleteEvidenceFile,
    markExecutionRecordComplete,
    loading,
    securitySettings,
    setSecuritySettings,
    saveSecuritySettings,
  } = useSecurityActivityData();

  const defaultStartMonth = useMemo(() => `${now.getFullYear()}-01`, [now]);
  const defaultEndMonth = useMemo(() => formatMonthInputValue(now), [now]);

  const [dashboardPeriodStart, setDashboardPeriodStart] = useState(defaultStartMonth);
  const [dashboardPeriodEnd, setDashboardPeriodEnd] = useState(defaultEndMonth);
  const [dashboardSettingsOpen, setDashboardSettingsOpen] = useState(false);
  const [draftDashboardPeriodStart, setDraftDashboardPeriodStart] = useState(defaultStartMonth);
  const [draftDashboardPeriodEnd, setDraftDashboardPeriodEnd] = useState(defaultEndMonth);

  const activeMenuLabel =
    activeMenu === 'dashboard'
      ? '모니터링 대시보드'
      : activeMenu === 'catalog'
        ? '활동 목록 관리'
        : activeMenu === 'register'
          ? '보안 활동 등록'
          : activeMenu === 'execution'
            ? '수행 및 증적 관리'
            : activeMenu === 'report'
              ? '리포트 생성'
              : '보안 설정';

  const fallbackExecutionRecord = useMemo<ExecutionRecord>(
    () => ({
      id: 'placeholder-register-record',
      activityMasterId: undefined,
      ownerDepartment: '정보보호유닛',
      partnerDepartment: null,
      frequencyLabel: '수시',
      title: '등록할 보안 활동을 선택해 주세요.',
      description: '',
      dueDate: new Date().toISOString().slice(0, 10),
      status: '예약',
      evidenceRequired: false,
      executionNote: '',
    }),
    [],
  );

  const registerExecutionRecord = selectedExecutionRecord ?? fallbackExecutionRecord;

  const selectedExecutionTargetPeriod = useMemo(() => {
    return formatExecutionTargetPeriod(registerExecutionRecord.dueDate);
  }, [registerExecutionRecord]);

  const dashboardPeriodStartKey = useMemo(() => {
    const [year, month] = dashboardPeriodStart.split('-').map(Number);
    return year * 100 + month;
  }, [dashboardPeriodStart]);

  const dashboardPeriodEndKey = useMemo(() => {
    const [year, month] = dashboardPeriodEnd.split('-').map(Number);
    return year * 100 + month;
  }, [dashboardPeriodEnd]);

  const normalizedDashboardPeriod = useMemo(() => {
    return {
      startKey: Math.min(dashboardPeriodStartKey, dashboardPeriodEndKey),
      endKey: Math.max(dashboardPeriodStartKey, dashboardPeriodEndKey),
    };
  }, [dashboardPeriodStartKey, dashboardPeriodEndKey]);

  const dashboardStats = useMemo(() => {
    const currentMonthKey = now.getFullYear() * 100 + (now.getMonth() + 1);

    const recordsInPeriod = records.filter((record) => {
      const recordMonthKey = toMonthKey(record.dueDate);
      return (
        recordMonthKey >= normalizedDashboardPeriod.startKey &&
        recordMonthKey <= normalizedDashboardPeriod.endKey
      );
    });

    const currentMonthRecords = recordsInPeriod.filter(
      (record) => toMonthKey(record.dueDate) === currentMonthKey,
    );

    const doneCount = recordsInPeriod.filter((record) => record.status === '완료').length;
    const delayedCount = recordsInPeriod.filter((record) => record.status === '지연').length;

    const rate =
      recordsInPeriod.length === 0
        ? 0
        : Math.round((doneCount / recordsInPeriod.length) * 100);

    return {
      currentMonthCount: currentMonthRecords.length,
      doneCount,
      delayedCount,
      rate,
    };
  }, [records, now, normalizedDashboardPeriod]);

  const filteredRecordsInDashboardPeriod = useMemo(() => {
    return filteredRecords.filter((record) => {
      const recordMonthKey = toMonthKey(record.dueDate);
      return (
        recordMonthKey >= normalizedDashboardPeriod.startKey &&
        recordMonthKey <= normalizedDashboardPeriod.endKey
      );
    });
  }, [filteredRecords, normalizedDashboardPeriod]);

  const allExecutionRecordsInDashboardPeriod = useMemo(() => {
    return records.filter((record) => {
      const recordMonthKey = toMonthKey(record.dueDate);
      return (
        recordMonthKey >= normalizedDashboardPeriod.startKey &&
        recordMonthKey <= normalizedDashboardPeriod.endKey
      );
    });
  }, [records, normalizedDashboardPeriod]);

  const executionRecordsForView = useMemo(() => {
    const baseSource =
      keyword.trim() === '' ? allExecutionRecordsInDashboardPeriod : filteredRecordsInDashboardPeriod;

    if (executionFilterMode === 'all') {
      const startIndex = (executionPage - 1) * executionPageSize;
      return baseSource.slice(startIndex, startIndex + executionPageSize);
    }

    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    const filteredByMode = baseSource.filter((item) => {
      if (executionFilterMode === 'done') {
        return item.status === '완료';
      }

      if (executionFilterMode === 'delayed') {
        return item.status === '지연';
      }

      if (executionFilterMode === 'currentMonth') {
        const dueDate = new Date(item.dueDate);
        return dueDate.getFullYear() === currentYear && dueDate.getMonth() + 1 === currentMonth;
      }

      return true;
    });

    const startIndex = (executionPage - 1) * executionPageSize;
    return filteredByMode.slice(startIndex, startIndex + executionPageSize);
  }, [
    keyword,
    allExecutionRecordsInDashboardPeriod,
    filteredRecordsInDashboardPeriod,
    executionFilterMode,
    executionPage,
    executionPageSize,
    now,
  ]);

  const executionFilteredLengthForView = useMemo(() => {
    const baseSource =
      keyword.trim() === '' ? allExecutionRecordsInDashboardPeriod : filteredRecordsInDashboardPeriod;

    if (executionFilterMode === 'all') {
      return baseSource.length;
    }

    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    return baseSource.filter((item) => {
      if (executionFilterMode === 'done') {
        return item.status === '완료';
      }

      if (executionFilterMode === 'delayed') {
        return item.status === '지연';
      }

      if (executionFilterMode === 'currentMonth') {
        const dueDate = new Date(item.dueDate);
        return dueDate.getFullYear() === currentYear && dueDate.getMonth() + 1 === currentMonth;
      }

      return true;
    }).length;
  }, [
    keyword,
    allExecutionRecordsInDashboardPeriod,
    filteredRecordsInDashboardPeriod,
    executionFilterMode,
    now,
  ]);

  const executionTotalPagesForView = useMemo(() => {
    return Math.max(1, Math.ceil(executionFilteredLengthForView / executionPageSize));
  }, [executionFilteredLengthForView, executionPageSize]);

  const openExecutionRegistrationFromCalendar = (executionRecordId: string) => {
    setSelectedExecutionRecordId(executionRecordId);
    setActiveMenu('register');
  };

  const openCurrentMonthActivities = () => {
    setExecutionFilterMode('currentMonth');
    setKeyword('');
    setExecutionPage(1);
    setActiveMenu('execution');
  };

  const openDoneActivities = () => {
    setExecutionFilterMode('done');
    setKeyword('');
    setExecutionPage(1);
    setActiveMenu('execution');
  };

  const openDelayedActivities = () => {
    if (dashboardStats.delayedCount === 0) return;
    setExecutionFilterMode('delayed');
    setKeyword('');
    setExecutionPage(1);
    setActiveMenu('execution');
  };

  const openDashboardSettings = () => {
    setDraftDashboardPeriodStart(dashboardPeriodStart);
    setDraftDashboardPeriodEnd(dashboardPeriodEnd);
    setDashboardSettingsOpen(true);
  };

  const applyDashboardSettings = () => {
    setDashboardPeriodStart(draftDashboardPeriodStart);
    setDashboardPeriodEnd(draftDashboardPeriodEnd);
    setExecutionPage(1);
    setDashboardSettingsOpen(false);
  };

  const handleCreateNewMaster = () => {
    const tempId = `temp-${Date.now()}`;

    const blankMaster: ActivityMaster = {
      id: tempId,
      name: '',
      ownerDepartment: '정보보호유닛',
      partnerDepartment: null,
      frequency: '수시',
      purpose: '',
      guide: '',
      evidences: [''],
    };

    setMasters((prev) => [blankMaster, ...prev]);
    setSelectedMasterId(tempId);
    setActiveMenu('catalog');
  };

  const handleSaveMaster = async () => {
    try {
      await saveSelectedMaster();
      window.alert('저장되었습니다.');
      setActiveMenu('catalog');
    } catch (error) {
      console.error('saveSelectedMaster error:', error);

      if (error instanceof Error) {
        window.alert(`저장 오류: ${error.message}`);
        return;
      }

      window.alert('저장 중 오류가 발생했습니다.');
    }
  };

  const handleDeleteMaster = async () => {
    if (!selectedMaster) return;

    const confirmed = window.confirm(
      `"${selectedMaster.name || '선택한 보안 활동'}"을(를) 삭제하시겠습니까?\n연결된 수행 대상과 증적도 함께 삭제됩니다.`,
    );

    if (!confirmed) return;

    try {
      await deleteSelectedMaster();
      window.alert('삭제되었습니다.');
      setActiveMenu('catalog');
    } catch (error) {
      console.error('deleteSelectedMaster error:', error);

      if (error instanceof Error) {
        window.alert(`삭제 오류: ${error.message}`);
        return;
      }

      window.alert('삭제 중 오류가 발생했습니다.');
    }
  };

  const handleFileSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file || !selectedExecutionRecordId || !selectedExecutionRecord) {
      event.target.value = '';
      return;
    }

    try {
      await uploadEvidenceFile(selectedExecutionRecordId, file, userEmail);
      window.alert('증적 파일이 업로드되었습니다.');
    } catch (error) {
      console.error('uploadEvidenceFile error:', error);
      const errorMessage =
        error instanceof Error ? error.message : '증적 파일 업로드 중 오류가 발생했습니다.';

      if (
        errorMessage.includes('로그인 세션이 만료') ||
        errorMessage.includes('권한이 없습니다')
      ) {
        window.alert('세션이 만료되어 자동 로그아웃됩니다. 다시 로그인해 주세요.');
        await onLogout();
        return;
      }

      window.alert(
        `증적 파일 업로드 오류: ${errorMessage}`,
      );
    } finally {
      event.target.value = '';
    }
  };

  const handleSaveExecutionNote = async () => {
    if (!selectedExecutionRecord) {
      window.alert('먼저 수행 및 증적 관리 또는 보안 활동 캘린더에서 등록할 활동을 선택해 주세요.');
      return;
    }

    try {
      await updateExecutionNote(selectedExecutionRecord.id, selectedExecutionRecord.executionNote);
      window.alert('수행 내역이 저장되었습니다.');
    } catch (error) {
      console.error('updateExecutionNote error:', error);
      window.alert(
        error instanceof Error
          ? `수행 내역 저장 오류: ${error.message}`
          : '수행 내역 저장 중 오류가 발생했습니다.',
      );
    }
  };

  const handleComplete = async () => {
    if (!selectedExecutionRecord) {
      window.alert('먼저 수행 및 증적 관리 또는 보안 활동 캘린더에서 완료 처리할 활동을 선택해 주세요.');
      return;
    }

    try {
      await markExecutionRecordComplete(selectedExecutionRecord.id);
      window.alert('완료 처리되었습니다.');
    } catch (error) {
      console.error('markExecutionRecordComplete error:', error);
      window.alert(
        error instanceof Error ? `완료 처리 오류: ${error.message}` : '완료 처리 중 오류가 발생했습니다.',
      );
    }
  };

  const handleDeleteEvidenceFile = async (evidenceFileId: string) => {
    const confirmed = window.confirm('선택한 증적 파일을 삭제하시겠습니까?');
    if (!confirmed) return;

    try {
      await deleteEvidenceFile(evidenceFileId);
      window.alert('증적 파일이 삭제되었습니다.');
    } catch (error) {
      console.error('deleteEvidenceFile error:', error);
      window.alert(
        error instanceof Error
          ? `증적 파일 삭제 오류: ${error.message}`
          : '증적 파일 삭제 중 오류가 발생했습니다.',
      );
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 text-slate-500">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <MobileTopBar
        delayedCount={dashboardStats.delayedCount}
        userEmail={userEmail}
        onOpenDelayed={openDelayedActivities}
        onLogout={onLogout}
      />

      <div className="flex min-h-screen pb-24 lg:pb-0">
        <Sidebar
          sidebarCollapsed={sidebarCollapsed}
          setSidebarCollapsed={setSidebarCollapsed}
          activeMenu={activeMenu}
          setActiveMenu={(menu) => {
            if (menu !== 'execution') {
              setExecutionFilterMode('all');
            }
            setActiveMenu(menu);
          }}
        />

        <main className="flex-1">
          <Header
            activeMenuLabel={activeMenuLabel}
            delayedCount={dashboardStats.delayedCount}
            userEmail={userEmail}
            onOpenDelayed={openDelayedActivities}
            onLogout={onLogout}
          />

          <div className="p-3 lg:p-6">
            <div className="mb-2 px-0.5 pb-2 pt-0.5 lg:hidden">
              <h1 className="text-[17px] font-semibold">{activeMenuLabel}</h1>
            </div>

            {activeMenu === 'dashboard' && (
              <DashboardView
                dashboardStats={dashboardStats}
                currentDateTime={formatNow(now)}
                currentMonth={now.getMonth() + 1}
                currentYear={now.getFullYear()}
                dashboardTasks={dashboardTasks}
                openMasterFromCalendar={openExecutionRegistrationFromCalendar}
                onClickCurrentMonthStat={openCurrentMonthActivities}
                onClickDoneStat={openDoneActivities}
                onClickDelayedStat={openDelayedActivities}
                dashboardPeriodStart={dashboardPeriodStart}
                dashboardPeriodEnd={dashboardPeriodEnd}
                dashboardSettingsOpen={dashboardSettingsOpen}
                draftDashboardPeriodStart={draftDashboardPeriodStart}
                draftDashboardPeriodEnd={draftDashboardPeriodEnd}
                setDraftDashboardPeriodStart={setDraftDashboardPeriodStart}
                setDraftDashboardPeriodEnd={setDraftDashboardPeriodEnd}
                onOpenDashboardSettings={openDashboardSettings}
                onCloseDashboardSettings={() => setDashboardSettingsOpen(false)}
                onApplyDashboardSettings={applyDashboardSettings}
              />
            )}

            {activeMenu === 'catalog' && selectedMaster && (
              <CatalogPage
                paginatedMasters={paginatedMasters}
                selectedMasterId={selectedMasterId}
                setSelectedMasterId={setSelectedMasterId}
                setActiveMenu={setActiveMenu}
                mastersLength={masters.length}
                catalogPageSize={catalogPageSize}
                catalogTotalPages={catalogTotalPages}
                catalogPage={catalogPage}
                setCatalogPage={setCatalogPage}
                selectedMaster={selectedMaster}
                onCreateNew={handleCreateNewMaster}
                onSave={handleSaveMaster}
                onDelete={handleDeleteMaster}
                updateMasterField={updateMasterField}
              />
            )}

            {activeMenu === 'execution' && (
              <ExecutionPage
                keyword={keyword}
                setKeyword={(value) => {
                  setExecutionFilterMode('all');
                  setKeyword(value);
                  setExecutionPage(1);
                }}
                paginatedExecutionRecords={executionRecordsForView}
                filteredRecordsLength={executionFilteredLengthForView}
                executionPageSize={executionPageSize}
                executionPage={executionPage}
                executionTotalPages={executionTotalPagesForView}
                setExecutionPage={setExecutionPage}
                onSelect={(executionRecordId) => {
                  setSelectedExecutionRecordId(executionRecordId);
                  setActiveMenu('register');
                }}
              />
            )}

            {activeMenu === 'register' && (
              <RegisterPage
                selectedExecutionRecord={registerExecutionRecord}
                selectedExecutionEvidenceFiles={selectedExecutionEvidenceFiles}
                selectedExecutionTargetPeriod={selectedExecutionTargetPeriod}
                onChangeExecutionNote={setSelectedExecutionNote}
                onSaveExecutionNote={handleSaveExecutionNote}
                onOpenFileDialog={() => fileInputRef.current?.click()}
                onDeleteEvidenceFile={handleDeleteEvidenceFile}
                onComplete={handleComplete}
              />
            )}

            {activeMenu === 'report' && (
              <ReportPage
                records={records}
                evidenceFilesByRecord={evidenceFilesByRecord}
              />
            )}

            {activeMenu === 'security' && (
              <SecuritySettingsPage
                settings={securitySettings}
                onChange={setSecuritySettings}
                onSave={saveSecuritySettings}
              />
            )}
          </div>
        </main>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileSelected}
      />

      <MobileBottomNav activeMenu={activeMenu} setActiveMenu={setActiveMenu} />
    </div>
  );
}
