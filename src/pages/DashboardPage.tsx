import { ChangeEvent, useMemo, useRef, useState } from 'react';
import { CheckCircle2, Paperclip, Save } from 'lucide-react';
import Header from '@/components/layout/Header';
import MobileBottomNav from '@/components/layout/MobileBottomNav';
import MobileTopBar from '@/components/layout/MobileTopBar';
import Sidebar from '@/components/layout/Sidebar';
import DashboardView from '@/components/dashboard/DashboardView';
import CatalogPage from '@/pages/CatalogPage';
import ExecutionPage from '@/pages/ExecutionPage';
import ReportPage from '@/pages/ReportPage';
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
    dashboardStats,
    filteredRecords,
    paginatedExecutionRecords,
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
    markExecutionRecordComplete,
    loading,
  } = useSecurityActivityData();

  const activeMenuLabel =
    activeMenu === 'dashboard'
      ? '모니터링 대시보드'
      : activeMenu === 'catalog'
        ? '활동 목록 관리'
        : activeMenu === 'register'
          ? '보안 활동 등록'
          : activeMenu === 'execution'
            ? '수행 및 증적 관리'
            : '리포트 생성';

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
  const isPlaceholderRegister = registerExecutionRecord.id === 'placeholder-register-record';

  const selectedExecutionTargetPeriod = useMemo(() => {
    return formatExecutionTargetPeriod(registerExecutionRecord.dueDate);
  }, [registerExecutionRecord]);

  const executionRecordsForView = useMemo(() => {
    if (executionFilterMode === 'all') {
      return paginatedExecutionRecords;
    }

    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    const baseRecords = filteredRecords.filter((item) => {
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
    return baseRecords.slice(startIndex, startIndex + executionPageSize);
  }, [
    executionFilterMode,
    filteredRecords,
    paginatedExecutionRecords,
    executionPage,
    executionPageSize,
    now,
  ]);

  const executionFilteredLengthForView = useMemo(() => {
    if (executionFilterMode === 'all') {
      return filteredRecords.length;
    }

    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    return filteredRecords.filter((item) => {
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
  }, [executionFilterMode, filteredRecords, now]);

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
      window.alert(
        error instanceof Error
          ? `증적 파일 업로드 오류: ${error.message}`
          : '증적 파일 업로드 중 오류가 발생했습니다.',
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

          <div className="p-4 lg:p-6">
            <div className="mb-4 border-b border-slate-200 px-1 pb-4 pt-1 lg:hidden">
              <h1 className="text-[18px] font-semibold">{activeMenuLabel}</h1>
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
              <div className="space-y-5">
                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-5 border-b border-slate-100 pb-4">
                    <div className="text-[18px] font-semibold">보안 활동 등록</div>
                    <div className="mt-1 text-sm text-slate-500">
                      수행 내역과 증적을 등록합니다.
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                    <div className="rounded-2xl border border-slate-200 px-5 py-4">
                      <div className="text-[12px] font-medium text-slate-400">보안 활동명</div>
                      <div className="mt-3 text-[14px] font-semibold text-slate-900">
                        {registerExecutionRecord.title || '-'}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 px-5 py-4">
                      <div className="text-[12px] font-medium text-slate-400">대상 기간</div>
                      <div className="mt-3 text-[14px] font-semibold text-slate-900">
                        {selectedExecutionTargetPeriod || '-'}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 px-5 py-4">
                      <div className="text-[12px] font-medium text-slate-400">주기</div>
                      <div className="mt-3 text-[14px] font-semibold text-slate-900">
                        {registerExecutionRecord.frequencyLabel || '-'}
                      </div>
                    </div>
                  </div>

                  {isPlaceholderRegister && (
                    <div className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-500">
                      먼저 <span className="font-semibold text-slate-700">수행 및 증적 관리</span> 또는
                      <span className="font-semibold text-slate-700"> 보안 활동 캘린더</span>에서
                      등록할 활동을 선택해 주세요.
                    </div>
                  )}

                  <div className="mt-6">
                    <div className="mb-3 text-[15px] font-semibold text-slate-800">수행 내역</div>
                    <textarea
                      value={registerExecutionRecord.executionNote ?? ''}
                      onChange={(e) => setSelectedExecutionNote(e.target.value)}
                      disabled={isPlaceholderRegister}
                      className="h-52 w-full rounded-2xl border border-slate-200 px-5 py-4 text-[14px] outline-none placeholder:text-slate-300 disabled:bg-slate-50 disabled:text-slate-400"
                      placeholder="해당 월(또는 분기/반기/연도)의 수행 내역을 입력하세요."
                    />
                  </div>
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-5 flex flex-col gap-3 border-b border-slate-100 pb-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <div className="text-[18px] font-semibold">증적 자료</div>
                      <div className="mt-1 text-sm text-slate-500">
                        파일을 업로드하면 목록이 표시됩니다.
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isPlaceholderRegister}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                    >
                      <Paperclip className="h-4 w-4" />
                      증적 업로드
                    </button>
                  </div>

                  {!selectedExecutionRecord || selectedExecutionEvidenceFiles.length === 0 ? (
                    <div className="flex h-28 items-center justify-center rounded-2xl border border-dashed border-slate-200 text-[14px] text-slate-400">
                      업로드된 증적이 없습니다.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {selectedExecutionEvidenceFiles.map((file) => (
                        <div
                          key={file.id}
                          className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
                        >
                          <div className="min-w-0 flex-1 truncate text-[13px] text-slate-700">
                            {file.fileName}
                          </div>
                          <div className="ml-4 text-[12px] text-slate-400">
                            {file.uploadedAt ? String(file.uploadedAt).slice(0, 10) : ''}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-6 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={handleSaveExecutionNote}
                      disabled={isPlaceholderRegister}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                    >
                      <Save className="h-4 w-4" />
                      저장
                    </button>

                    <button
                      type="button"
                      onClick={handleComplete}
                      disabled={isPlaceholderRegister}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      완료 처리
                    </button>
                  </div>
                </section>
              </div>
            )}

            {activeMenu === 'report' && (
              <ReportPage
                records={records}
                evidenceFilesByRecord={evidenceFilesByRecord}
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