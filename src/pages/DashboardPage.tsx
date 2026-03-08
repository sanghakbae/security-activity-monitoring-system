import { ChangeEvent, useMemo, useRef, useState } from 'react';
import Header from '@/components/layout/Header';
import MobileBottomNav from '@/components/layout/MobileBottomNav';
import MobileTopBar from '@/components/layout/MobileTopBar';
import Sidebar from '@/components/layout/Sidebar';
import DashboardView from '@/components/dashboard/DashboardView';
import CatalogPage from '@/pages/CatalogPage';
import RegisterPage from '@/pages/RegisterPage';
import ExecutionPage from '@/pages/ExecutionPage';
import ReportPage from '@/pages/ReportPage';
import { useSecurityActivityData } from '@/hooks/useSecurityActivityData';
import type { AppMenu, ActivityMaster } from '@/types';
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
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const {
    now,
    masters,
    setMasters,
    records,
    delayedRecords,
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
    executionTotalPages,
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

  const selectedExecutionTargetPeriod = useMemo(() => {
    if (!selectedExecutionRecord) return '';
    return formatExecutionTargetPeriod(selectedExecutionRecord.dueDate);
  }, [selectedExecutionRecord]);

  const openExecutionRegistrationFromCalendar = (executionRecordId: string) => {
    setSelectedExecutionRecordId(executionRecordId);
    setActiveMenu('register');
  };

  const openDelayedActivities = () => {
    if (dashboardStats.delayedCount === 0) return;
    setKeyword('지연');
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

    if (!file || !selectedExecutionRecordId) {
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
    if (!selectedExecutionRecord) return;

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
    if (!selectedExecutionRecord) return;

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

  const handleDelayedEmailAlert = () => {
    if (delayedRecords.length === 0) {
      window.alert('지연된 보안 활동이 없습니다.');
      return;
    }

    const subject = `[보안활동 지연 알림] ${delayedRecords.length}건 조치 필요`;
    const body = [
      '지연된 보안 활동 목록입니다.',
      '',
      ...delayedRecords.map(
        (item, index) =>
          `${index + 1}. ${item.title} / ${item.ownerDepartment}${
            item.partnerDepartment ? ` · ${item.partnerDepartment}` : ''
          } / 기한 ${item.dueDate.slice(0, 7)}`,
      ),
      '',
      '조속히 수행 내역 작성 및 증적 업로드를 진행해 주세요.',
    ].join('\n');

    window.location.href = `mailto:${userEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
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
          setActiveMenu={setActiveMenu}
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
                onDelayedEmailAlert={handleDelayedEmailAlert}
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

            {activeMenu === 'register' && selectedExecutionRecord && (
              <RegisterPage
                selectedExecutionRecord={selectedExecutionRecord}
                selectedExecutionEvidenceFiles={selectedExecutionEvidenceFiles}
                selectedExecutionTargetPeriod={selectedExecutionTargetPeriod}
                onChangeExecutionNote={setSelectedExecutionNote}
                onSaveExecutionNote={handleSaveExecutionNote}
                onOpenFileDialog={() => fileInputRef.current?.click()}
                onComplete={handleComplete}
              />
            )}

            {activeMenu === 'execution' && (
              <ExecutionPage
                keyword={keyword}
                setKeyword={setKeyword}
                paginatedExecutionRecords={paginatedExecutionRecords}
                filteredRecordsLength={filteredRecords.length}
                executionPageSize={executionPageSize}
                executionPage={executionPage}
                executionTotalPages={executionTotalPages}
                setExecutionPage={setExecutionPage}
                onSelect={(executionRecordId) => {
                  setSelectedExecutionRecordId(executionRecordId);
                  setActiveMenu('register');
                }}
              />
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