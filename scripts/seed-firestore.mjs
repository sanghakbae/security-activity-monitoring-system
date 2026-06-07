/**
 * Seed initial data into Firestore (mirrors supabase/migrations/001_initial_schema.sql).
 *
 * Usage:
 *   1. npm install                       # installs firebase-admin (devDependency)
 *   2. Download a service account key from
 *      Firebase Console → Project settings → Service accounts → Generate new private key
 *   3. export GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/to/serviceAccount.json
 *      (or)  export FIREBASE_SERVICE_ACCOUNT=/absolute/path/to/serviceAccount.json
 *   4. npm run seed
 *
 * The script is idempotent for security_setting (only creates if missing) but
 * always inserts the 5 default activity_master rows — run it once on a fresh project.
 */
import { readFileSync } from 'node:fs';
import { initializeApp, cert, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const keyPath = process.env.FIREBASE_SERVICE_ACCOUNT;

initializeApp(
  keyPath
    ? { credential: cert(JSON.parse(readFileSync(keyPath, 'utf8'))) }
    : { credential: applicationDefault() },
);

const db = getFirestore();

const activityMasters = [
  {
    name: '개인정보 처리방침 개정',
    owner_department: '정보보호유닛',
    partner_department: '기획팀',
    frequency: '반기',
    purpose: '법령 개정, 규제 변화, 공공기관 가이드라인 반영·개인정보보호 수준 제고',
    guide: '관련 법령과 기관 가이드를 검토하여 개인정보 처리방침을 업데이트하고 공개한다.',
    evidences: ['개정안', '검토이력'],
  },
  {
    name: 'DB 접근제어 로그 리뷰',
    owner_department: '정보보호유닛',
    partner_department: 'DBA파트',
    frequency: '월간',
    purpose: '비인가 DB 접근 이력을 상시 점검하기 위함',
    guide: '월별 DB 접근 이력을 점검하고 이상 행위를 식별하여 기록한다.',
    evidences: ['접근제어 로그', '조치내역'],
  },
  {
    name: '계반구역 출입기록 검토',
    owner_department: '정보보호유닛',
    partner_department: '경영지원유닛',
    frequency: '월간',
    purpose: '제한 구역(서무실)은 보안 및 안전을 위해 특정 인원만 출입할 수 있도록 관리가 필요함',
    guide: '출입 기록을 확인해 비인가 출입 여부를 검토하고 결과를 기록한다.',
    evidences: ['출입기록', '점검결과'],
  },
  {
    name: '정전시스템 로그 검토',
    owner_department: '정보보호유닛',
    partner_department: '개발유닛',
    frequency: '월간',
    purpose: '이상 행위 탐지: 비정상적인 로그인, 권한 없는 시스템 접근, 의심스러운 API 호출 식별',
    guide: '월별 시스템 로그를 검토하고 이상 징후를 식별하여 조치 결과를 기록한다.',
    evidences: ['시스템 로그', '분석 결과'],
  },
  {
    name: '임직원 보안 서약서 징구',
    owner_department: '정보보호유닛',
    partner_department: '인사팀',
    frequency: '반기',
    purpose: '임직원 보안 인식과 법적 책임을 임직원으로 고지하기 위함',
    guide: '반기별 서약서 수령 현황을 점검하고 미제출 인원을 관리한다.',
    evidences: ['서약서', '제출 현황'],
  },
];

const defaultSecuritySetting = {
  allowed_email_domain: 'muhayu.com',
  session_timeout_minutes: 60,
  google_chat_alert_times: ['14:00', '19:00'],
};

async function main() {
  // activity_master — preserve insertion order via incremental created_at.
  const baseTime = Date.now();
  let i = 0;
  for (const master of activityMasters) {
    await db.collection('activity_master').add({
      ...master,
      created_at: new Date(baseTime + i * 1000),
    });
    i += 1;
    console.log(`  + activity_master: ${master.name}`);
  }

  // security_setting — only if none exists.
  const existing = await db.collection('security_setting').limit(1).get();
  if (existing.empty) {
    await db.collection('security_setting').add({
      ...defaultSecuritySetting,
      created_at: FieldValue.serverTimestamp(),
      updated_at: FieldValue.serverTimestamp(),
    });
    console.log('  + security_setting (default)');
  } else {
    console.log('  = security_setting already exists, skipped');
  }

  console.log('\n✅ Seed complete.');
}

main().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
