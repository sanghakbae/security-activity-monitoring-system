create extension if not exists pgcrypto;

create table if not exists public.activity_master (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_department text not null default '정보보호유닛',
  partner_department text null,
  frequency text not null,
  purpose text not null default '',
  guide text not null default '',
  evidences text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.execution_record (
  id uuid primary key default gen_random_uuid(),
  activity_master_id uuid not null references public.activity_master(id) on delete cascade,
  owner_department text not null default '정보보호유닛',
  partner_department text null,
  frequency_label text not null,
  title text not null,
  description text not null default '',
  due_date date not null,
  status text not null default '예약',
  evidence_required boolean not null default true,
  execution_note text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.evidence_file (
  id uuid primary key default gen_random_uuid(),
  execution_record_id uuid not null references public.execution_record(id) on delete cascade,
  file_name text not null,
  file_path text not null,
  uploaded_by text null,
  uploaded_at timestamptz not null default now()
);

insert into public.activity_master (
  name,
  owner_department,
  partner_department,
  frequency,
  purpose,
  guide,
  evidences
)
values
(
  '개인정보 처리방침 개정',
  '정보보호유닛',
  '기획팀',
  '반기',
  '법령 개정, 규제 변화, 공공기관 가이드라인 반영·개인정보보호 수준 제고',
  '관련 법령과 기관 가이드를 검토하여 개인정보 처리방침을 업데이트하고 공개한다.',
  array['개정안', '검토이력']
),
(
  'DB 접근제어 로그 리뷰',
  '정보보호유닛',
  'DBA파트',
  '월간',
  '비인가 DB 접근 이력을 상시 점검하기 위함',
  '월별 DB 접근 이력을 점검하고 이상 행위를 식별하여 기록한다.',
  array['접근제어 로그', '조치내역']
),
(
  '계반구역 출입기록 검토',
  '정보보호유닛',
  '경영지원유닛',
  '월간',
  '제한 구역(서무실)은 보안 및 안전을 위해 특정 인원만 출입할 수 있도록 관리가 필요함',
  '출입 기록을 확인해 비인가 출입 여부를 검토하고 결과를 기록한다.',
  array['출입기록', '점검결과']
),
(
  '정전시스템 로그 검토',
  '정보보호유닛',
  '개발유닛',
  '월간',
  '이상 행위 탐지: 비정상적인 로그인, 권한 없는 시스템 접근, 의심스러운 API 호출 식별',
  '월별 시스템 로그를 검토하고 이상 징후를 식별하여 조치 결과를 기록한다.',
  array['시스템 로그', '분석 결과']
),
(
  '임직원 보안 서약서 징구',
  '정보보호유닛',
  '인사팀',
  '반기',
  '임직원 보안 인식과 법적 책임을 임직원으로 고지하기 위함',
  '반기별 서약서 수령 현황을 점검하고 미제출 인원을 관리한다.',
  array['서약서', '제출 현황']
);