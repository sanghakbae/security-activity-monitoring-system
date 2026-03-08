create extension if not exists "pgcrypto";

create table if not exists public.activity_master (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  department text not null,
  frequency text not null,
  purpose text not null,
  guide text not null,
  evidences jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.execution_record (
  id uuid primary key default gen_random_uuid(),
  activity_master_id uuid references public.activity_master(id) on delete cascade,
  department text not null,
  frequency_label text not null,
  title text not null,
  description text not null,
  due_date date not null,
  status text not null,
  evidence_required boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.evidence_file (
  id uuid primary key default gen_random_uuid(),
  execution_record_id uuid not null references public.execution_record(id) on delete cascade,
  file_name text not null,
  file_path text not null,
  uploaded_by text,
  uploaded_at timestamptz not null default now()
);

create index if not exists idx_execution_record_due_date on public.execution_record(due_date);
create index if not exists idx_execution_record_status on public.execution_record(status);
create index if not exists idx_evidence_file_execution_record_id on public.evidence_file(execution_record_id);

insert into public.activity_master (name, department, frequency, purpose, guide, evidences)
values
  (
    '웹 취약점 정기 점검',
    'IT개발팀',
    '반기',
    '대외 서비스 웹 애플리케이션의 신규 취약점을 조기에 탐지하고 조치하기 위함',
    '점검 범위를 확인한 뒤 자동 진단과 수동 검증을 수행하고 결과를 등록합니다.',
    '["점검결과 보고서.pdf", "조치결과 캡처.zip"]'::jsonb
  ),
  (
    '임직원 보안 서약서 징구',
    '인사팀',
    '연 1회',
    '임직원 보안 인식과 법적 책임을 명시적으로 고지하기 위함',
    '최신 서약서 양식을 배포하고 서명 완료 여부를 확인합니다.',
    '["서약서 취합본.pdf"]'::jsonb
  ),
  (
    'DB 접근제어 로그 리뷰',
    'DBA파트',
    '월간',
    '비인가 DB 접근 이력을 상시 점검하기 위함',
    '월말 기준 DB 감사 로그를 수집해 이상 접근을 분석합니다.',
    '["로그 리뷰 시트.xlsx"]'::jsonb
  );

insert into public.execution_record (
  activity_master_id,
  department,
  frequency_label,
  title,
  description,
  due_date,
  status,
  evidence_required
)
select
  id,
  department,
  frequency,
  name,
  purpose,
  current_date + interval '7 day',
  '예약',
  true
from public.activity_master;