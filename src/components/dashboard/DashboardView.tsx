import { useMemo, useState } from 'react';
import { CalendarDays, Settings2 } from 'lucide-react';
import type { DashboardTask } from '@/types';
import { months } from '@/utils/date';
import ActivityCard from '@/components/dashboard/ActivityCard';

type DashboardViewProps = {
  dashboardStats: {
    currentMonthCount: number;
    doneCount: number;
    delayedCount: number;
    rate: number;
  };
  currentDateTime: string;
  currentMonth: number;
  currentYear: number;
  dashboardTasks: DashboardTask[];
  openMasterFromCalendar: (executionRecordId: string) => void;
  onClickCurrentMonthStat: () => void;
  onClickDoneStat: () => void;
  onClickDelayedStat: () => void;
  dashboardPeriodStart: string;
  dashboardPeriodEnd: string;
  dashboardSettingsOpen: boolean;
  draftDashboardPeriodStart: string;
  draftDashboardPeriodEnd: string;
  setDraftDashboardPeriodStart: (value: string) => void;
  setDraftDashboardPeriodEnd: (value: string) => void;
  onOpenDashboardSettings: () => void;
  onCloseDashboardSettings: () => void;
  onApplyDashboardSettings: () => void;
};

type CalendarMode = 'year' | 'range';

type QuarterBlock = {
  year: number;
  quarter: number;
};

function getTaskYear(task: DashboardTask) {
  return new Date(task.dueDate).getFullYear();
}

function getTaskMonth(task: DashboardTask) {
  return new Date(task.dueDate).getMonth() + 1;
}

function getQuarterOrder(year: number, quarter: number) {
  return year * 4 + quarter;
}

function buildQuarterBlocks(
  startYear: number,
  startQuarter: number,
  endYear: number,
  endQuarter: number,
) {
  const startOrder = getQuarterOrder(startYear, startQuarter);
  const endOrder = getQuarterOrder(endYear, endQuarter);

  if (startOrder > endOrder) {
    return [];
  }

  const blocks: QuarterBlock[] = [];

  for (let order = startOrder; order <= endOrder; order += 1) {
    const year = Math.floor((order - 1) / 4);
    const quarter = ((order - 1) % 4) + 1;

    blocks.push({ year, quarter });
  }

  return blocks;
}

function getMonthsInQuarter(quarter: number) {
  if (quarter === 1) return [1, 2, 3];
  if (quarter === 2) return [4, 5, 6];
  if (quarter === 3) return [7, 8, 9];
  return [10, 11, 12];
}

function formatPeriodLabel(start: string, end: string) {
  const [startYear, startMonth] = start.split('-');
  const [endYear, endMonth] = end.split('-');
  return `${startYear}.${startMonth} ~ ${endYear}.${endMonth}`;
}

type StatCardProps = {
  label: string;
  value: string;
  accentClassName?: string;
  clickable?: boolean;
  onClick?: () => void;
};

function StatCard({
  label,
  value,
  accentClassName = 'text-slate-900',
  clickable = false,
  onClick,
}: StatCardProps) {
  const baseClassName =
    'rounded-md border border-slate-200 bg-white px-2 py-2 shadow-[0_4px_10px_rgba(15,23,42,0.10)]';
  const interactiveClassName = clickable
    ? 'cursor-pointer transition hover:-translate-y-0.5 hover:shadow-md'
    : '';

  if (clickable) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${baseClassName} ${interactiveClassName} w-full text-center`}
      >
        <div className="text-xs font-medium text-slate-500">{label}</div>
        <div className={`mt-1 text-[28px] font-bold leading-none ${accentClassName}`}>
          {value}
        </div>
      </button>
    );
  }

  return (
    <div className={`${baseClassName} text-center`}>
      <div className="text-xs font-medium text-slate-500">{label}</div>
      <div className={`mt-1 text-[28px] font-bold leading-none ${accentClassName}`}>
        {value}
      </div>
    </div>
  );
}

export default function DashboardView({
  dashboardStats,
  currentDateTime,
  currentMonth,
  currentYear,
  dashboardTasks,
  openMasterFromCalendar,
  onClickCurrentMonthStat,
  onClickDoneStat,
  onClickDelayedStat,
  dashboardPeriodStart,
  dashboardPeriodEnd,
  dashboardSettingsOpen,
  draftDashboardPeriodStart,
  draftDashboardPeriodEnd,
  setDraftDashboardPeriodStart,
  setDraftDashboardPeriodEnd,
  onOpenDashboardSettings,
  onCloseDashboardSettings,
  onApplyDashboardSettings,
}: DashboardViewProps) {
  const [calendarMode, setCalendarMode] = useState<CalendarMode>('year');
  const [rangeStartYear, setRangeStartYear] = useState(currentYear - 1);
  const [rangeStartQuarter, setRangeStartQuarter] = useState(2);
  const [rangeEndYear, setRangeEndYear] = useState(currentYear);
  const [rangeEndQuarter, setRangeEndQuarter] = useState(2);

  const yearOptions = useMemo(() => {
    return Array.from({ length: 7 }, (_, index) => currentYear - 3 + index);
  }, [currentYear]);

  const quarterBlocks = useMemo(
    () =>
      buildQuarterBlocks(
        rangeStartYear,
        rangeStartQuarter,
        rangeEndYear,
        rangeEndQuarter,
      ),
    [rangeStartYear, rangeStartQuarter, rangeEndYear, rangeEndQuarter],
  );

  const annualTasks = useMemo(() => {
    return dashboardTasks.filter((task) => getTaskYear(task) === currentYear);
  }, [dashboardTasks, currentYear]);

  return (
    <div className="space-y-2.5">
      <div className="grid grid-cols-2 gap-1.5 lg:grid-cols-4">
        <StatCard label="전체 수행률" value={`${dashboardStats.rate}%`} />
        <StatCard
          label="이번 달 대상"
          value={`${dashboardStats.currentMonthCount}건`}
          clickable
          onClick={onClickCurrentMonthStat}
        />
        <StatCard
          label="수행 완료"
          value={`${dashboardStats.doneCount}건`}
          accentClassName="text-sky-600"
          clickable
          onClick={onClickDoneStat}
        />
        <StatCard
          label="지연/미이행"
          value={`${dashboardStats.delayedCount}건`}
          accentClassName="text-rose-500"
          clickable
          onClick={onClickDelayedStat}
        />
      </div>

      <div className="flex flex-col items-end gap-1">
        <div className="text-xs text-slate-500">
          설정 기간: {formatPeriodLabel(dashboardPeriodStart, dashboardPeriodEnd)}
        </div>
        <button
          type="button"
          onClick={onOpenDashboardSettings}
          className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-[0_2px_8px_rgba(15,23,42,0.10)]"
        >
          <Settings2 className="h-4 w-4" />
          대시보드 기간 설정
        </button>
      </div>

      {dashboardSettingsOpen && (
        <section className="rounded-md border border-slate-200 bg-white p-2.5 shadow-[0_6px_14px_rgba(15,23,42,0.12)]">
          <div className="mb-2.5 text-[14px] font-semibold">대시보드 설정</div>
          <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                시작 월
              </label>
              <input
                type="month"
                value={draftDashboardPeriodStart}
                onChange={(e) => setDraftDashboardPeriodStart(e.target.value)}
                className="w-full rounded-md border border-slate-200 px-2.5 py-1.5 text-xs outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                종료 월
              </label>
              <input
                type="month"
                value={draftDashboardPeriodEnd}
                onChange={(e) => setDraftDashboardPeriodEnd(e.target.value)}
                className="w-full rounded-md border border-slate-200 px-2.5 py-1.5 text-xs outline-none"
              />
            </div>
          </div>

          <div className="mt-3 flex justify-end gap-1.5">
            <button
              type="button"
              onClick={onCloseDashboardSettings}
              className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700"
            >
              취소
            </button>
            <button
              type="button"
              onClick={onApplyDashboardSettings}
              className="rounded-md bg-slate-900 px-2.5 py-1.5 text-xs font-semibold text-white"
            >
              적용
            </button>
          </div>
        </section>
      )}

      <section className="rounded-md border border-slate-200 bg-white shadow-[0_8px_18px_rgba(15,23,42,0.12)]">
        <div className="flex flex-col gap-2 border-b border-slate-100 px-2 py-2">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-slate-900" />
              <h2 className="text-[16px] font-semibold">보안 활동 캘린더</h2>
            </div>

            <div className="text-xs font-medium text-slate-500">
              {currentDateTime}
            </div>
          </div>

          <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCalendarMode('year')}
                className={`rounded-md px-2.5 py-1 text-[11px] font-semibold ${
                  calendarMode === 'year'
                    ? 'bg-slate-900 text-white'
                    : 'border border-slate-200 bg-white text-slate-700'
                }`}
              >
                연간 보기
              </button>

              <button
                type="button"
                onClick={() => setCalendarMode('range')}
                className={`rounded-md px-2.5 py-1 text-[11px] font-semibold ${
                  calendarMode === 'range'
                    ? 'bg-slate-900 text-white'
                    : 'border border-slate-200 bg-white text-slate-700'
                }`}
              >
                기간 보기
              </button>
            </div>

            {calendarMode === 'range' && (
              <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
                <div className="flex items-center gap-1.5">
                  <select
                    value={rangeStartYear}
                    onChange={(e) => setRangeStartYear(Number(e.target.value))}
                    className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px]"
                  >
                    {yearOptions.map((year) => (
                      <option key={`start-year-${year}`} value={year}>
                        {year}년
                      </option>
                    ))}
                  </select>

                  <select
                    value={rangeStartQuarter}
                    onChange={(e) => setRangeStartQuarter(Number(e.target.value))}
                    className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px]"
                  >
                    <option value={1}>1분기</option>
                    <option value={2}>2분기</option>
                    <option value={3}>3분기</option>
                    <option value={4}>4분기</option>
                  </select>
                </div>

                <div className="text-xs text-slate-400">~</div>

                <div className="flex items-center gap-1.5">
                  <select
                    value={rangeEndYear}
                    onChange={(e) => setRangeEndYear(Number(e.target.value))}
                    className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px]"
                  >
                    {yearOptions.map((year) => (
                      <option key={`end-year-${year}`} value={year}>
                        {year}년
                      </option>
                    ))}
                  </select>

                  <select
                    value={rangeEndQuarter}
                    onChange={(e) => setRangeEndQuarter(Number(e.target.value))}
                    className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px]"
                  >
                    <option value={1}>1분기</option>
                    <option value={2}>2분기</option>
                    <option value={3}>3분기</option>
                    <option value={4}>4분기</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        {calendarMode === 'year' && (
          <div className="grid grid-cols-3 gap-1.5 p-1.5 xl:grid-cols-6">
            {months.map((label, monthIndex) => {
              const monthTasks = annualTasks.filter(
                (task) => getTaskMonth(task) === monthIndex + 1,
              );

              return (
                <div
                  key={`${currentYear}-${label}`}
                  className={`self-start overflow-hidden rounded-md border bg-slate-50/70 ${
                    currentMonth === monthIndex + 1
                      ? 'border-cyan-300 shadow-[0_0_0_1px_rgba(103,232,249,0.75),0_0_20px_rgba(34,211,238,0.45)]'
                      : 'border-slate-200'
                  }`}
                >
                  <div
                    className={`border-b border-slate-200 px-2 py-1.5 text-center text-lg font-semibold ${
                      currentMonth === monthIndex + 1
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-900'
                    }`}
                  >
                    {label}
                  </div>

                  <div className="flex min-h-[100px] flex-col justify-start p-0.5">
                    {monthTasks.length === 0 ? (
                      <div className="flex h-[88px] items-start justify-center pt-2 text-xs text-slate-400">
                        일정 없음
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-0.5">
                        {monthTasks.map((task) => (
                          <ActivityCard
                            key={task.id}
                            task={task}
                            onClick={() => openMasterFromCalendar(task.id)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {calendarMode === 'range' && (
          <div className="p-2 lg:p-2.5">
            {quarterBlocks.length === 0 ? (
              <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-600">
                시작 분기가 종료 분기보다 늦습니다. 기간을 다시 선택해 주세요.
              </div>
            ) : (
              <div className="space-y-2.5">
                {quarterBlocks.map((block) => {
                  const quarterMonths = getMonthsInQuarter(block.quarter);

                  return (
                    <div
                      key={`${block.year}-Q${block.quarter}`}
                      className="rounded-md border border-slate-200 bg-slate-50/70 shadow-[0_5px_12px_rgba(15,23,42,0.10)]"
                    >
                      <div className="border-b border-slate-200 bg-slate-100 px-2 py-1.5 text-center text-xs font-semibold text-slate-900">
                        {block.year}년 {block.quarter}분기
                      </div>

                      <div className="grid grid-cols-3 gap-1.5 p-1.5">
                        {quarterMonths.map((month) => {
                          const monthTasks = dashboardTasks.filter(
                            (task) =>
                              getTaskYear(task) === block.year &&
                              getTaskMonth(task) === month,
                          );

                          return (
                            <div
                              key={`${block.year}-${month}`}
                              className="self-start overflow-hidden rounded-md border border-slate-200 bg-white"
                            >
                              <div className="border-b border-slate-200 bg-slate-50 px-2 py-1.5 text-center text-sm font-semibold text-slate-800">
                                {month}월
                              </div>

                              <div className="flex min-h-[100px] flex-col justify-start p-0.5">
                                {monthTasks.length === 0 ? (
                                  <div className="flex h-[88px] items-start justify-center pt-2 text-xs text-slate-400">
                                    일정 없음
                                  </div>
                                ) : (
                                  <div className="grid grid-cols-2 gap-0.5">
                                    {monthTasks.map((task) => (
                                      <ActivityCard
                                        key={task.id}
                                        task={task}
                                        onClick={() => openMasterFromCalendar(task.id)}
                                      />
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
