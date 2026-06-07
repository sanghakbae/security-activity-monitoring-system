import { useEffect, useMemo, useState } from 'react';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import {
  deleteObject,
  getDownloadURL,
  ref as storageRef,
  uploadBytes,
} from 'firebase/storage';
import { auth, db, storage } from '@/lib/firebase';
import type {
  ActivityMaster,
  DashboardTask,
  ExecutionEvidenceFile,
  ExecutionRecord,
  SecuritySettings,
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

/** Firestore 'in' / 'array-contains-any' queries accept at most 30 values. */
function chunk<T>(items: T[], size = 30): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
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

const defaultSecuritySettings: SecuritySettings = {
  allowedEmailDomain: 'muhayu.com',
  sessionTimeoutMinutes: 60,
  googleChatAlertTimes: ['14:00', '19:00'],
};

function normalizeAllowedEmailDomainsText(value: unknown): string {
  if (typeof value !== 'string') {
    return defaultSecuritySettings.allowedEmailDomain;
  }

  const unique = Array.from(
    new Set(
      value
        .split(',')
        .map((item) => item.trim().toLowerCase())
        .filter((item) => item !== ''),
    ),
  );

  if (unique.length === 0) {
    return defaultSecuritySettings.allowedEmailDomain;
  }

  return unique.join(', ');
}

function mapSecuritySettings(row: any): SecuritySettings {
  return {
    allowedEmailDomain: normalizeAllowedEmailDomainsText(row.allowed_email_domain),
    sessionTimeoutMinutes:
      typeof row.session_timeout_minutes === 'number' && row.session_timeout_minutes > 0
        ? row.session_timeout_minutes
        : defaultSecuritySettings.sessionTimeoutMinutes,
    googleChatAlertTimes: Array.isArray(row.google_chat_alert_times)
      ? row.google_chat_alert_times.filter(
          (item: unknown): item is string =>
            typeof item === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(item),
        )
      : defaultSecuritySettings.googleChatAlertTimes,
  };
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
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>(defaultSecuritySettings);
  const [now, setNow] = useState(new Date());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const syncDelayedStatuses = async () => {
    if (!db) return;

    const today = new Date();
    const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const currentMonthStartText = `${currentMonthStart.getFullYear()}-${String(
      currentMonthStart.getMonth() + 1,
    ).padStart(2, '0')}-01`;

    try {
      // due_date is stored as an ISO 'YYYY-MM-DD' string, so lexicographic
      // ordering matches chronological ordering.
      const snapshot = await getDocs(
        query(collection(db, 'execution_record'), where('due_date', '<', currentMonthStartText)),
      );

      const overdue = snapshot.docs.filter((d) => d.data().status !== '완료');
      if (overdue.length === 0) return;

      const batch = writeBatch(db);
      overdue.forEach((d) => batch.update(d.ref, { status: '지연' }));
      await batch.commit();
    } catch (error) {
      console.error('execution_record delayed sync error:', error);
    }
  };

  const loadMasters = async () => {
    if (!db) return;

    try {
      const snapshot = await getDocs(
        query(collection(db, 'activity_master'), orderBy('created_at', 'asc')),
      );

      const mapped = snapshot.docs.map((d) => mapMaster({ id: d.id, ...d.data() }));
      setMasters(mapped);

      if (mapped.length > 0) {
        setSelectedMasterId((prev) => {
          const exists = mapped.some((item) => item.id === prev);
          return exists ? prev : mapped[0].id;
        });
      } else {
        setSelectedMasterId('');
      }
    } catch (error) {
      console.error('activity_master load error:', error);
    }
  };

  const loadRecords = async () => {
    if (!db) return;

    await syncDelayedStatuses();

    try {
      const snapshot = await getDocs(
        query(collection(db, 'execution_record'), orderBy('due_date', 'asc')),
      );

      const mapped = snapshot.docs.map((d) => mapRecord({ id: d.id, ...d.data() }));
      setRecords(mapped);

      if (mapped.length > 0) {
        setSelectedExecutionRecordId((prev) => {
          const exists = mapped.some((item) => item.id === prev);
          return exists ? prev : mapped[0].id;
        });
      } else {
        setSelectedExecutionRecordId('');
      }
    } catch (error) {
      console.error('execution_record load error:', error);
    }
  };

  const loadEvidenceFiles = async () => {
    if (!db || !storage) return;

    try {
      const snapshot = await getDocs(
        query(collection(db, 'evidence_file'), orderBy('uploaded_at', 'desc')),
      );

      const mappedRows = await Promise.all(
        snapshot.docs.map(async (d) => {
          const row = d.data();
          let thumbnailUrl = '';

          if (row.file_path && storage) {
            try {
              thumbnailUrl = await getDownloadURL(storageRef(storage, row.file_path));
            } catch (error) {
              console.error('evidence download url error:', error);
            }
          }

          return {
            id: d.id,
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
    } catch (error) {
      console.error('evidence_file load error:', error);
    }
  };

  const loadSecuritySettings = async () => {
    if (!db) return;

    try {
      const snapshot = await getDocs(
        query(collection(db, 'security_setting'), orderBy('created_at', 'asc'), limit(1)),
      );

      const first = snapshot.docs[0];
      if (!first) {
        const created = await addDoc(collection(db, 'security_setting'), {
          allowed_email_domain: defaultSecuritySettings.allowedEmailDomain,
          session_timeout_minutes: defaultSecuritySettings.sessionTimeoutMinutes,
          google_chat_alert_times: defaultSecuritySettings.googleChatAlertTimes,
          created_at: serverTimestamp(),
          updated_at: serverTimestamp(),
        });
        void created;
        setSecuritySettings(mapSecuritySettings({
          allowed_email_domain: defaultSecuritySettings.allowedEmailDomain,
          session_timeout_minutes: defaultSecuritySettings.sessionTimeoutMinutes,
          google_chat_alert_times: defaultSecuritySettings.googleChatAlertTimes,
        }));
        return;
      }

      setSecuritySettings(mapSecuritySettings(first.data()));
    } catch (error) {
      console.error('security_setting load error:', error);
    }
  };

  const reloadAll = async () => {
    if (!db) {
      setLoading(false);
      return;
    }

    setLoading(true);
    await Promise.all([loadMasters(), loadRecords(), loadEvidenceFiles(), loadSecuritySettings()]);
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

  const catalogPageSize = 20;
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
    if (!db) return;
    const fdb = db;

    const currentYear = new Date().getFullYear();
    const startYear = currentYear - 1;
    const endYear = currentYear + 1;

    const scheduleDates = getScheduleDatesByFrequency(master.frequency, startYear, endYear);
    const scheduleDateSet = new Set(scheduleDates);

    const existingSnapshot = await getDocs(
      query(collection(db, 'execution_record'), where('activity_master_id', '==', master.id)),
    );

    const existing = existingSnapshot.docs.map((d) => ({ id: d.id, ...d.data() } as any));
    const existingIds = existing.map((row) => row.id as string);

    const evidenceRecordIdSet = new Set<string>();

    if (existingIds.length > 0) {
      const evidenceSnapshots = await Promise.all(
        chunk(existingIds).map((ids) =>
          getDocs(
            query(collection(fdb, 'evidence_file'), where('execution_record_id', 'in', ids)),
          ),
        ),
      );

      evidenceSnapshots.forEach((snap) =>
        snap.docs.forEach((d) => evidenceRecordIdSet.add(d.data().execution_record_id as string)),
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

    const batch = writeBatch(fdb);

    updatableIds.forEach((id) => {
      batch.update(doc(fdb, 'execution_record', id), {
        owner_department: master.ownerDepartment,
        partner_department: master.partnerDepartment,
        frequency_label: master.frequency,
        title: master.name,
        description: master.purpose,
      });
    });

    removableIds.forEach((id) => {
      batch.delete(doc(fdb, 'execution_record', id));
    });

    Array.from(scheduleDateSet).forEach((dueDate) => {
      batch.set(doc(collection(fdb, 'execution_record')), {
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
        created_at: serverTimestamp(),
      });
    });

    try {
      await batch.commit();
    } catch (error) {
      console.error('execution_record sync error:', error);
      throw error instanceof Error ? error : new Error('execution_record sync 실패');
    }
  };

  const saveSelectedMaster = async () => {
    if (!db || !selectedMaster) return;

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

    try {
      if (isTemp) {
        const created = await addDoc(collection(db, 'activity_master'), {
          ...payload,
          created_at: serverTimestamp(),
        });

        const mapped = mapMaster({ id: created.id, ...payload });
        setMasters((prev) => prev.map((item) => (item.id === selectedMaster.id ? mapped : item)));
        setSelectedMasterId(mapped.id);

        await syncExecutionRecords(mapped);
        await loadMasters();
        await loadRecords();
        return;
      }

      await updateDoc(doc(db, 'activity_master', selectedMaster.id), payload);

      const mapped = mapMaster({ id: selectedMaster.id, ...payload });

      await syncExecutionRecords(mapped);
      await loadMasters();
      await loadRecords();
    } catch (error) {
      console.error('activity_master save error:', error);
      throw error instanceof Error ? error : new Error('activity_master 저장 실패');
    }
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

    if (!db) {
      throw new Error('Firestore가 초기화되지 않았습니다.');
    }
    const fdb = db;
    const fstorage = storage;

    const relatedRecordIds = records
      .filter((item) => item.activityMasterId === deletingId)
      .map((item) => item.id);

    try {
      if (relatedRecordIds.length > 0) {
        const evidenceRows = relatedRecordIds.flatMap(
          (recordId) => evidenceFilesByRecord[recordId] ?? [],
        );

        if (evidenceRows.length > 0 && fstorage) {
          await Promise.all(
            evidenceRows
              .map((item) => item.filePath)
              .filter((path): path is string => Boolean(path))
              .map(async (path) => {
                try {
                  await deleteObject(storageRef(fstorage, path));
                } catch (error) {
                  console.error('storage remove error:', error);
                }
              }),
          );
        }

        // Delete evidence_file docs for the related execution records.
        const evidenceSnapshots = await Promise.all(
          chunk(relatedRecordIds).map((ids) =>
            getDocs(
              query(collection(fdb, 'evidence_file'), where('execution_record_id', 'in', ids)),
            ),
          ),
        );

        const deleteBatch = writeBatch(fdb);
        evidenceSnapshots.forEach((snap) => snap.docs.forEach((d) => deleteBatch.delete(d.ref)));
        relatedRecordIds.forEach((id) => deleteBatch.delete(doc(fdb, 'execution_record', id)));
        await deleteBatch.commit();
      }

      await deleteDoc(doc(fdb, 'activity_master', deletingId));

      await loadMasters();
      await loadRecords();
      await loadEvidenceFiles();
    } catch (error) {
      console.error('activity_master delete error:', error);
      throw error instanceof Error ? error : new Error('activity_master 삭제 실패');
    }
  };

  const setSelectedExecutionNote = (value: string) => {
    setRecords((prev) =>
      prev.map((item) =>
        item.id === selectedExecutionRecordId ? { ...item, executionNote: value } : item,
      ),
    );
  };

  const updateExecutionNote = async (executionRecordId: string, executionNote: string) => {
    if (!db) {
      throw new Error('Firestore가 초기화되지 않았습니다.');
    }

    try {
      await updateDoc(doc(db, 'execution_record', executionRecordId), {
        execution_note: executionNote,
      });
    } catch (error) {
      console.error('execution_record note update error:', error);
      throw error instanceof Error ? error : new Error('실행 기록 메모 저장 실패');
    }

    await loadRecords();
  };

  const uploadEvidenceFile = async (executionRecordId: string, file: File, userEmail: string) => {
    if (!db || !storage) {
      throw new Error('Firebase가 초기화되지 않았습니다.');
    }

    const currentUser = auth?.currentUser ?? null;
    if (!currentUser) {
      throw new Error('로그인 세션이 만료되었습니다. 다시 로그인해 주세요.');
    }

    const sessionEmail = currentUser.email ?? userEmail ?? '';

    const sanitizedFileName = file.name.replace(/[^\w.\-가-힣]/g, '_');
    const filePath = `evidence/${executionRecordId}/${Date.now()}-${sanitizedFileName}`;

    const fileRef = storageRef(storage, filePath);

    try {
      await uploadBytes(fileRef, file);
    } catch (error) {
      console.error('storage upload error:', error);
      throw new Error(
        `Storage 업로드 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
      );
    }

    try {
      await addDoc(collection(db, 'evidence_file'), {
        execution_record_id: executionRecordId,
        file_name: file.name,
        file_path: filePath,
        uploaded_by: sessionEmail,
        uploaded_at: serverTimestamp(),
      });
    } catch (error) {
      console.error('evidence_file insert error:', error);
      try {
        await deleteObject(fileRef);
      } catch (rollbackError) {
        console.error('storage rollback remove error:', rollbackError);
      }
      throw new Error(
        `evidence_file 저장 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
      );
    }

    // Refresh evidence files for the affected record immediately, then a full
    // refresh for cross-record consistency.
    try {
      const recordSnapshot = await getDocs(
        query(
          collection(db, 'evidence_file'),
          where('execution_record_id', '==', executionRecordId),
          orderBy('uploaded_at', 'desc'),
        ),
      );

      const mappedRows = await Promise.all(
        recordSnapshot.docs.map(async (d) => {
          const row = d.data();
          let thumbnailUrl = '';

          if (row.file_path && storage) {
            try {
              thumbnailUrl = await getDownloadURL(storageRef(storage, row.file_path));
            } catch (error) {
              console.error('evidence download url error:', error);
            }
          }

          return {
            id: d.id,
            executionRecordId: row.execution_record_id,
            fileName: row.file_name,
            filePath: row.file_path,
            uploadedBy: row.uploaded_by ?? null,
            uploadedAt: row.uploaded_at,
            thumbnailUrl,
          } satisfies ExecutionEvidenceFile;
        }),
      );

      setEvidenceFilesByRecord((prev) => ({
        ...prev,
        [executionRecordId]: mappedRows,
      }));
    } catch (error) {
      console.error('evidence_file immediate load error:', error);
    }

    await loadEvidenceFiles();
  };

  const markExecutionRecordComplete = async (executionRecordId: string) => {
    if (!db) {
      throw new Error('Firestore가 초기화되지 않았습니다.');
    }

    try {
      await updateDoc(doc(db, 'execution_record', executionRecordId), { status: '완료' });
    } catch (error) {
      console.error('execution_record complete error:', error);
      throw error instanceof Error ? error : new Error('실행 기록 완료 처리 실패');
    }

    await loadRecords();
  };

  const deleteEvidenceFile = async (evidenceFileId: string) => {
    if (!db || !storage) {
      throw new Error('Firebase가 초기화되지 않았습니다.');
    }

    let row: any = null;

    try {
      const snapshot = await getDoc(doc(db, 'evidence_file', evidenceFileId));
      if (!snapshot.exists()) {
        throw new Error('증빙 파일을 찾을 수 없습니다.');
      }
      row = { id: snapshot.id, ...snapshot.data() };
    } catch (error) {
      console.error('evidence_file load for delete error:', error);
      throw error instanceof Error ? error : new Error('증빙 파일 조회 실패');
    }

    if (row?.file_path && storage) {
      try {
        await deleteObject(storageRef(storage, row.file_path));
      } catch (error) {
        console.error('storage remove error:', error);
      }
    }

    try {
      await deleteDoc(doc(db, 'evidence_file', evidenceFileId));
    } catch (error) {
      console.error('evidence_file delete error:', error);
      throw error instanceof Error ? error : new Error('증빙 파일 삭제 실패');
    }

    setEvidenceFilesByRecord((prev) => {
      const next = { ...prev };
      const recordId = row.execution_record_id;
      const current = next[recordId] ?? [];
      next[recordId] = current.filter((item) => item.id !== evidenceFileId);
      return next;
    });
  };

  const saveSecuritySettings = async (next: SecuritySettings) => {
    if (!db) {
      throw new Error('Firestore가 초기화되지 않았습니다.');
    }

    const payload = {
      allowed_email_domain: normalizeAllowedEmailDomainsText(next.allowedEmailDomain),
      session_timeout_minutes: Math.max(5, Math.min(10080, Math.floor(next.sessionTimeoutMinutes))),
      google_chat_alert_times: next.googleChatAlertTimes,
    };

    try {
      const snapshot = await getDocs(
        query(collection(db, 'security_setting'), orderBy('created_at', 'asc'), limit(1)),
      );

      const current = snapshot.docs[0];

      if (!current) {
        await addDoc(collection(db, 'security_setting'), {
          ...payload,
          created_at: serverTimestamp(),
          updated_at: serverTimestamp(),
        });
      } else {
        await updateDoc(current.ref, {
          ...payload,
          updated_at: serverTimestamp(),
        });
      }
    } catch (error) {
      console.error('security_setting save error:', error);
      throw error instanceof Error ? error : new Error('보안 설정 저장 실패');
    }

    setSecuritySettings({
      allowedEmailDomain: payload.allowed_email_domain,
      sessionTimeoutMinutes: payload.session_timeout_minutes,
      googleChatAlertTimes: payload.google_chat_alert_times,
    });
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
    deleteEvidenceFile,
    markExecutionRecordComplete,
    reloadAll,
    loading,
    securitySettings,
    setSecuritySettings,
    saveSecuritySettings,
  };
}
