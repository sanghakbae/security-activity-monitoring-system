import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type {
  ActivityMaster,
  DashboardTask,
  ExecutionEvidenceFile,
  ExecutionRecord,
} from '@/types';

function buildDashboardTasksFromRecords(records: ExecutionRecord[]): DashboardTask[] {
  return records
    .map((item) => {
      const dueDate = new Date(item.dueDate);

      return {
        id: item.id,
        month: dueDate.getMonth() + 1,
        title: item.title,
        dueDate: item.dueDate,
        status: item.status,
        ownerDepartment: item.ownerDepartment,
        partnerDepartment: item.partnerDepartment,
      };
    })
    .sort((a, b) => {
      const dateCompare = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      if (dateCompare !== 0) return dateCompare;
      return a.title.localeCompare(b.title);
    });
}

function mapMaster(row: any): ActivityMaster {
  return {
    id: row.id,
    name: row.name,
    ownerDepartment: row.owner_department ?? row.department ?? '정보보호유닛',
    partnerDepartment: row.partner_department ?? null,
    frequency: row.frequency,
    purpose: row.purpose ?? '',
    guide: row.guide ?? '',
    evidences: Array.isArray(row.evidences) ? row.evidences : [],
  };
}

function getComputedStatus(row: any): ExecutionRecord['status'] {
  const today = new Date();
  const dueDate = new Date(row.due_date);

  const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const dueMonthStart = new Date(dueDate.getFullYear(), dueDate.getMonth(), 1);

  if (row.status === '완료') {
    return '완료';
  }

  if (dueMonthStart < currentMonthStart) {
    return '지연';
  }

  return row.status ?? '예약';
}

function mapRecord(row: any): ExecutionRecord {
  return {
    id: row.id,
    activityMasterId: row.activity_master_id ?? undefined,
    ownerDepartment: row.owner_department ?? row.department ?? '정보보호유닛',
    partnerDepartment: row.partner_department ?? null,
    frequencyLabel: row.frequency_label ?? '-',
    title: row.title,
    description: row.description ?? '',
    dueDate: row.due_date,
    status: getComputedStatus(row),
    evidenceRequired: row.evidence_required,
    executionNote: row.execution_note ?? '',
  };
}

function getScheduleDatesForYear(
  frequency: ActivityMaster['frequency'],
  year: number,
): string[] {
  switch (frequency) {
    case '월간':
      return Array.from({ length: 12 }, (_, i) => {
        const month = String(i + 1).padStart(2, '0');
        return `${year}-${month}-28`;
      });
    case '분기':
      return [`${year}-03-31`, `${year}-06-30`, `${year}-09-30`, `${year}-12-31`];
    case '반기':
      return [`${year}-06-30`, `${year}-12-31`];
    case '연 1회':
      return [`${year}-12-31`];
    case '수시':
    default:
      return [];
  }
}

function getScheduleDatesByFrequency(
  frequency: ActivityMaster['frequency'],
  startYear: number,
  endYear: number,
): string[] {
  const scheduleDates: string[] = [];

  for (let year = startYear; year <= endYear; year += 1) {
    scheduleDates.push(...getScheduleDatesForYear(frequency, year));
  }

  return scheduleDates;
}

export function useSecurityActivityData() {
  const [masters, setMasters] = useState<ActivityMaster[]>([]);
  const [records, setRecords] = useState<ExecutionRecord[]>([]);
  const [evidenceFilesByRecord, setEvidenceFilesByRecord] = useState<
    Record<string, ExecutionEvidenceFile[]>
  >({});
  const [selectedMasterId, setSelectedMasterId] = useState('');
  const [selectedExecutionRecordId, setSelectedExecutionRecordId] = useState('');
  const [keyword, setKeyword] = useState('');
  const [executionPage, setExecutionPage] = useState(1);
  const [catalogPage, setCatalogPage] = useState(1);
  const [now, setNow] = useState(new Date());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const syncDelayedStatuses = async () => {
    if (!supabase) return;

    const { error } = await supabase.rpc('mark_delayed_execution_records');

    if (error) {
      console.error('execution_record delayed sync error:', error);
    }
  };

  const loadMasters = async () => {
    if (!supabase) return;

    const { data, error } = await supabase
      .from('activity_master')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('activity_master load error:', error);
      return;
    }

    const mapped = (data ?? []).map(mapMaster);
    setMasters(mapped);

    if (mapped.length > 0) {
      setSelectedMasterId((prev) => {
        const exists = mapped.some((item) => item.id === prev);
        return exists ? prev : mapped[0].id;
      });
    } else {
      setSelectedMasterId('');
    }
  };

  const loadRecords = async () => {
    if (!supabase) return;

    await syncDelayedStatuses();

    const { data, error } = await supabase
      .from('execution_record')
      .select('*')
      .order('due_date', { ascending: true });

    if (error) {
      console.error('execution_record load error:', error);
      return;
    }

    const mapped = (data ?? []).map(mapRecord);
    setRecords(mapped);

    if (mapped.length > 0) {
      setSelectedExecutionRecordId((prev) => {
        const exists = mapped.some((item) => item.id === prev);
        return exists ? prev : mapped[0].id;
      });
    } else {
      setSelectedExecutionRecordId('');
    }
  };

  const loadEvidenceFiles = async () => {
    if (!supabase) return;

    const { data, error } = await supabase
      .from('evidence_file')
      .select('*')
      .order('uploaded_at', { ascending: false });

    if (error) {
      console.error('evidence_file load error:', error);
      return;
    }

    const rows = data ?? [];

    const mappedRows = await Promise.all(
      rows.map(async (row) => {
        let thumbnailUrl = '';

        if (row.file_path && supabase) {
          const { data: signed } = await supabase.storage
            .from('evidence-files')
            .createSignedUrl(row.file_path, 60 * 60);

          thumbnailUrl = signed?.signedUrl ?? '';
        }

        return {
          id: row.id,
          executionRecordId: row.execution_record_id,
          fileName: row.file_name,
          filePath: row.file_path,
          uploadedBy: row.uploaded_by ?? null,
          uploadedAt: row.uploaded_at,
          thumbnailUrl,
        } satisfies ExecutionEvidenceFile;
      }),
    );

    const grouped = mappedRows.reduce<Record<string, ExecutionEvidenceFile[]>>((acc, item) => {
      if (!acc[item.executionRecordId]) {
        acc[item.executionRecordId] = [];
      }
      acc[item.executionRecordId].push(item);
      return acc;
    }, {});

    setEvidenceFilesByRecord(grouped);
  };

  const reloadAll = async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    setLoading(true);
    await Promise.all([loadMasters(), loadRecords(), loadEvidenceFiles()]);
    setLoading(false);
  };

  useEffect(() => {
    void reloadAll();
  }, []);

  const selectedMaster = useMemo(
    () => masters.find((item) => item.id === selectedMasterId) ?? masters[0],
    [masters, selectedMasterId],
  );

  const selectedExecutionRecord = useMemo(
    () => records.find((item) => item.id === selectedExecutionRecordId) ?? records[0],
    [records, selectedExecutionRecordId],
  );

  const selectedExecutionEvidenceFiles = useMemo(
    () => (selectedExecutionRecord ? evidenceFilesByRecord[selectedExecutionRecord.id] ?? [] : []),
    [evidenceFilesByRecord, selectedExecutionRecord],
  );

  const dashboardStats = useMemo(() => {
    const total = records.length;
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const currentMonthCount = records.filter((item) => {
      const dueDate = new Date(item.dueDate);
      return dueDate.getFullYear() === currentYear && dueDate.getMonth() + 1 === currentMonth;
    }).length;

    const doneCount = records.filter((item) => item.status === '완료').length;
    const delayedCount = records.filter((item) => item.status === '지연').length;
    const rate = total === 0 ? 0 : Math.round((doneCount / total) * 100);

    return { currentMonthCount, doneCount, delayedCount, rate };
  }, [records, now]);

  const delayedRecords = useMemo(() => records.filter((item) => item.status === '지연'), [records]);

  const filteredRecords = useMemo(() => {
    const query = keyword.trim().toLowerCase();
    if (!query) return records;

    return records.filter((item) =>
      [
        item.title,
        item.ownerDepartment,
        item.partnerDepartment ?? '',
        item.status,
        item.frequencyLabel,
      ].some((value) => value.toLowerCase().includes(query)),
    );
  }, [records, keyword]);

  const executionPageSize = 10;
  const executionTotalPages = Math.max(1, Math.ceil(filteredRecords.length / executionPageSize));

  const paginatedExecutionRecords = useMemo(() => {
    const safePage = Math.min(executionPage, executionTotalPages);
    const startIndex = (safePage - 1) * executionPageSize;
    return filteredRecords.slice(startIndex, startIndex + executionPageSize);
  }, [executionPage, executionTotalPages, filteredRecords]);

  const catalogPageSize = 10;
  const catalogTotalPages = Math.max(1, Math.ceil(masters.length / catalogPageSize));

  const paginatedMasters = useMemo(() => {
    const safePage = Math.min(catalogPage, catalogTotalPages);
    const startIndex = (safePage - 1) * catalogPageSize;
    return masters.slice(startIndex, startIndex + catalogPageSize);
  }, [catalogPage, catalogTotalPages, masters]);

  useEffect(() => {
    setExecutionPage(1);
  }, [keyword]);

  useEffect(() => {
    if (executionPage > executionTotalPages) setExecutionPage(executionTotalPages);
  }, [executionPage, executionTotalPages]);

  useEffect(() => {
    if (catalogPage > catalogTotalPages) setCatalogPage(catalogTotalPages);
  }, [catalogPage, catalogTotalPages]);

  const dashboardTasks = useMemo(() => buildDashboardTasksFromRecords(records), [records]);

  const updateMasterField = <K extends keyof ActivityMaster>(field: K, value: ActivityMaster[K]) => {
    setMasters((prev) =>
      prev.map((item) => (item.id === selectedMasterId ? { ...item, [field]: value } : item)),
    );
  };

  const syncExecutionRecords = async (master: ActivityMaster) => {
    if (!supabase) return;

    const currentYear = new Date().getFullYear();
    const startYear = currentYear - 1;
    const endYear = currentYear + 1;

    const scheduleDates = getScheduleDatesByFrequency(master.frequency, startYear, endYear);
    const scheduleDateSet = new Set(scheduleDates);

    const { data: existingRows, error: existingLoadError } = await supabase
      .from('execution_record')
      .select('id, due_date, status, execution_note')
      .eq('activity_master_id', master.id);

    if (existingLoadError) {
      console.error('execution_record load error:', existingLoadError);
      throw new Error(existingLoadError.message);
    }

    const existing = existingRows ?? [];
    const existingIds = existing.map((row) => row.id);

    let evidenceRecordIdSet = new Set<string>();

    if (existingIds.length > 0) {
      const { data: evidenceRows, error: evidenceLoadError } = await supabase
        .from('evidence_file')
        .select('execution_record_id')
        .in('execution_record_id', existingIds);

      if (evidenceLoadError) {
        console.error('evidence_file load error:', evidenceLoadError);
        throw new Error(evidenceLoadError.message);
      }

      evidenceRecordIdSet = new Set(
        (evidenceRows ?? []).map((row) => row.execution_record_id as string),
      );
    }

    const updatableIds: string[] = [];
    const removableIds: string[] = [];

    existing.forEach((row) => {
      const dueDate = String(row.due_date).slice(0, 10);

      if (scheduleDateSet.has(dueDate)) {
        updatableIds.push(row.id);
        scheduleDateSet.delete(dueDate);
        return;
      }

      const executionNote = String(row.execution_note ?? '').trim();
      const hasEvidence = evidenceRecordIdSet.has(row.id);

      if (row.status === '예약' && executionNote === '' && !hasEvidence) {
        removableIds.push(row.id);
      }
    });

    if (updatableIds.length > 0) {
      const { error: updateError } = await supabase
        .from('execution_record')
        .update({
          owner_department: master.ownerDepartment,
          partner_department: master.partnerDepartment,
          frequency_label: master.frequency,
          title: master.name,
          description: master.purpose,
        })
        .eq('activity_master_id', master.id)
        .in('id', updatableIds);

      if (updateError) {
        console.error('execution_record update error:', updateError);
        throw new Error(updateError.message);
      }
    }

    if (removableIds.length > 0) {
      const { error: deleteError } = await supabase
        .from('execution_record')
        .delete()
        .eq('activity_master_id', master.id)
        .in('id', removableIds);

      if (deleteError) {
        console.error('execution_record cleanup delete error:', deleteError);
        throw new Error(deleteError.message);
      }
    }

    const payload = Array.from(scheduleDateSet).map((dueDate) => ({
      activity_master_id: master.id,
      owner_department: master.ownerDepartment,
      partner_department: master.partnerDepartment,
      frequency_label: master.frequency,
      title: master.name,
      description: master.purpose,
      due_date: dueDate,
      status: '예약',
      evidence_required: true,
      execution_note: '',
    }));

    const { error: insertError } = await supabase.from('execution_record').insert(payload);

    if (insertError) {
      console.error('execution_record insert error:', insertError);
      throw new Error(insertError.message);
    }
  };

  const saveSelectedMaster = async () => {
    if (!supabase || !selectedMaster) return;

    const normalizedPartnerDepartment =
      selectedMaster.partnerDepartment && selectedMaster.partnerDepartment.trim() !== ''
        ? selectedMaster.partnerDepartment
        : null;

    const payload = {
      name: selectedMaster.name,
      owner_department: selectedMaster.ownerDepartment,
      partner_department: normalizedPartnerDepartment,
      frequency: selectedMaster.frequency,
      purpose: selectedMaster.purpose,
      guide: selectedMaster.guide,
      evidences: selectedMaster.evidences.filter((item) => item.trim() !== ''),
    };

    const isTemp = selectedMaster.id.startsWith('temp-');

    if (isTemp) {
      const { data, error } = await supabase
        .from('activity_master')
        .insert(payload)
        .select('*')
        .single();

      if (error) {
        console.error('activity_master insert error:', error);
        throw new Error(error.message);
      }

      const mapped = mapMaster(data);
      setMasters((prev) => prev.map((item) => (item.id === selectedMaster.id ? mapped : item)));
      setSelectedMasterId(mapped.id);

      await syncExecutionRecords(mapped);
      await loadMasters();
      await loadRecords();
      return;
    }

    const { data, error } = await supabase
      .from('activity_master')
      .update(payload)
      .eq('id', selectedMaster.id)
      .select('*')
      .single();

    if (error) {
      console.error('activity_master update error:', error);
      throw new Error(error.message);
    }

    const mapped = mapMaster(data);

    await syncExecutionRecords(mapped);
    await loadMasters();
    await loadRecords();
  };

  const deleteSelectedMaster = async () => {
    if (!selectedMaster) {
      throw new Error('삭제할 보안 활동이 없습니다.');
    }

    const deletingId = selectedMaster.id;

    if (deletingId.startsWith('temp-')) {
      setMasters((prev) => prev.filter((item) => item.id !== deletingId));

      const remainingMasters = masters.filter((item) => item.id !== deletingId);
      setSelectedMasterId(remainingMasters[0]?.id ?? '');

      return;
    }

    if (!supabase) {
      throw new Error('Supabase 클라이언트가 초기화되지 않았습니다.');
    }

    const relatedRecordIds = records
      .filter((item) => item.activityMasterId === deletingId)
      .map((item) => item.id);

    if (relatedRecordIds.length > 0) {
      const evidenceRows = relatedRecordIds.flatMap(
        (recordId) => evidenceFilesByRecord[recordId] ?? [],
      );

      if (evidenceRows.length > 0) {
        const filePaths = evidenceRows
          .map((item) => item.filePath)
          .filter((path): path is string => Boolean(path));

        if (filePaths.length > 0) {
          const { error: storageRemoveError } = await supabase.storage
            .from('evidence-files')
            .remove(filePaths);

          if (storageRemoveError) {
            console.error('storage remove error:', storageRemoveError);
          }
        }

        const { error: evidenceDeleteError } = await supabase
          .from('evidence_file')
          .delete()
          .in('execution_record_id', relatedRecordIds);

        if (evidenceDeleteError) {
          console.error('evidence_file delete error:', evidenceDeleteError);
          throw new Error(evidenceDeleteError.message);
        }
      }

      const { error: recordDeleteError } = await supabase
        .from('execution_record')
        .delete()
        .eq('activity_master_id', deletingId);

      if (recordDeleteError) {
        console.error('execution_record delete error:', recordDeleteError);
        throw new Error(recordDeleteError.message);
      }
    }

    const { error: masterDeleteError } = await supabase
      .from('activity_master')
      .delete()
      .eq('id', deletingId);

    if (masterDeleteError) {
      console.error('activity_master delete error:', masterDeleteError);
      throw new Error(masterDeleteError.message);
    }

    await loadMasters();
    await loadRecords();
    await loadEvidenceFiles();
  };

  const setSelectedExecutionNote = (value: string) => {
    setRecords((prev) =>
      prev.map((item) =>
        item.id === selectedExecutionRecordId ? { ...item, executionNote: value } : item,
      ),
    );
  };

  const updateExecutionNote = async (executionRecordId: string, executionNote: string) => {
    if (!supabase) {
      throw new Error('Supabase 클라이언트가 초기화되지 않았습니다.');
    }

    const { error } = await supabase
      .from('execution_record')
      .update({ execution_note: executionNote })
      .eq('id', executionRecordId);

    if (error) {
      console.error('execution_record note update error:', error);
      throw new Error(error.message);
    }

    await loadRecords();
  };

  const uploadEvidenceFile = async (executionRecordId: string, file: File, userEmail: string) => {
    if (!supabase) {
      throw new Error('Supabase 클라이언트가 초기화되지 않았습니다.');
    }

    const sanitizedFileName = file.name.replace(/[^\w.\-가-힣]/g, '_');
    const filePath = `evidence/${executionRecordId}/${Date.now()}-${sanitizedFileName}`;

    const { error: uploadError } = await supabase.storage
      .from('evidence-files')
      .upload(filePath, file, { upsert: false });

    if (uploadError) {
      console.error('storage upload error:', uploadError);
      throw new Error(`Storage 업로드 실패: ${uploadError.message}`);
    }

    const { error: insertError } = await supabase.from('evidence_file').insert({
      execution_record_id: executionRecordId,
      file_name: file.name,
      file_path: filePath,
      uploaded_by: userEmail,
    });

    if (insertError) {
      console.error('evidence_file insert error:', insertError);
      throw new Error(`evidence_file 저장 실패: ${insertError.message}`);
    }

    await loadEvidenceFiles();
  };

  const markExecutionRecordComplete = async (executionRecordId: string) => {
    if (!supabase) {
      throw new Error('Supabase 클라이언트가 초기화되지 않았습니다.');
    }

    const { error } = await supabase
      .from('execution_record')
      .update({ status: '완료' })
      .eq('id', executionRecordId);

    if (error) {
      console.error('execution_record complete error:', error);
      throw new Error(error.message);
    }

    await loadRecords();
  };

  return {
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
    reloadAll,
    loading,
  };
}
