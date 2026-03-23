# Security Activity Monitoring System

보안 활동 모니터링 시스템(Security Activity Monitoring System)은 조직의
정보보호 활동을 체계적으로 관리하고 수행 현황을 추적하며 증적을 관리하고
리포트를 생성하기 위한 웹 기반 관리 시스템입니다.

------------------------------------------------------------------------

# 주요 기능

## 1. 보안 활동 목록 관리

보안 활동의 기본 정보를 등록하고 관리합니다.

관리 항목

-   보안 활동명
-   협업 부서
-   수행 주기 (수시 / 월간 / 분기 / 반기 / 연 1회)
-   활동 목적
-   수행 가이드
-   증적 목록

------------------------------------------------------------------------

## 2. 수행 및 증적 관리

등록된 보안 활동을 실제로 수행하고 결과를 기록합니다.

관리 항목

-   활동명
-   수행 내역
-   수행 상태 (예정 / 완료 / 지연)
-   수행 기한
-   증적 파일 업로드

증적 파일 업로드 시 썸네일이 표시됩니다.

------------------------------------------------------------------------

## 3. 보안 활동 캘린더

연간 보안 활동을 캘린더 형태로 시각화합니다.

상태 표시

-   예정 : 연초록
-   완료 : 연파랑
-   지연 : 연빨강

기능

-   연간 보기
-   기간 보기 (예: 2025년 2분기 \~ 2026년 2분기)
-   월별 활동 확인
-   활동 클릭 시 수행 등록 페이지 이동

------------------------------------------------------------------------

## 4. 지연 활동 알림

기한이 지난 보안 활동이 존재할 경우 알림을 전송합니다.

지원 방식

-   Google Chat Webhook 알림
-   이메일 알림 (옵션)

------------------------------------------------------------------------

## 5. 리포트 생성

보안 활동 수행 결과를 PDF 리포트로 생성합니다.

지원 리포트

-   분기 리포트
-   반기 리포트
-   연간 리포트

리포트 포함 정보

-   보안 활동명
-   수행 상태
-   수행 내역
-   수행 기한
-   증적 이미지 썸네일

------------------------------------------------------------------------

# 시스템 아키텍처

``` mermaid
flowchart LR
User[사용자] --> WebApp[React Web Application]
WebApp --> SupabaseAuth[Supabase Auth]
WebApp --> SupabaseDB[Supabase Database]
WebApp --> SupabaseStorage[Supabase Storage]

SupabaseDB --> ActivityMaster[Activity Master]
SupabaseDB --> ExecutionRecord[Execution Record]

SupabaseStorage --> EvidenceFiles[Evidence Files]

SupabaseDB --> EdgeFunctions[Supabase Edge Functions]
EdgeFunctions --> GoogleChat[Google Chat Webhook]
```

------------------------------------------------------------------------

# 기술 스택

Frontend

-   React
-   TypeScript
-   Vite
-   TailwindCSS

Backend

-   Supabase
-   PostgreSQL
-   Supabase Edge Functions

Authentication

-   Google OAuth (Supabase)

Reporting

-   jsPDF
-   jspdf-autotable

Deployment

-   GitHub Pages
-   GitHub Actions

------------------------------------------------------------------------

# 프로젝트 구조

    src
     ├ app
     │  └ App.tsx
     ├ components
     │  ├ dashboard
     │  ├ layout
     │  └ common
     ├ pages
     │  ├ DashboardPage.tsx
     │  ├ CatalogPage.tsx
     │  ├ ExecutionPage.tsx
     │  ├ RegisterPage.tsx
     │  └ ReportPage.tsx
     ├ hooks
     │  └ useSecurityActivityData.ts
     ├ utils
     │  ├ activity.ts
     │  ├ date.ts
     │  └ report.ts
     ├ lib
     │  ├ supabase.ts
     │  └ env.ts
     └ types

------------------------------------------------------------------------

# 설치 방법

## 1. 저장소 클론

    git clone https://github.com/sanghakbae/security-activity-monitoring-system.git

## 2. 패키지 설치

    npm install

## 3. 환경 변수 설정

`.env` 파일 생성

    VITE_SUPABASE_URL=your_supabase_url
    VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

## 4. 실행

    npm run dev

------------------------------------------------------------------------

# 지연 알림 자동 실행 설정 (Supabase cron)

Google Chat 지연 알림은 `send-delayed-alert` Edge Function을
Supabase DB cron(`pg_cron`)으로 자동 호출합니다.

## 1. 마이그레이션 적용

아래 파일을 Supabase에 반영합니다.

- `supabase/migrations/005_supabase_cron_delayed_alert.sql`

이 마이그레이션은 5분 주기의 DB cron 작업(`send-delayed-alert-every-5m`)을 생성합니다.

## 2. Edge Function 배포

함수 설정 파일:

- `supabase/config.toml` (`verify_jwt=false`)

함수 배포:

    supabase functions deploy send-delayed-alert

## 3. 실제 발송 조건

cron은 5분마다 함수를 호출하지만, 함수 내부에서 아래를 모두 만족할 때만 발송합니다.

- Asia/Seoul 기준 평일
- 대한민국 공휴일 제외
- `security_setting.google_chat_alert_times`와 현재 시각(HH:MM) 일치

즉, 앱의 `보안 설정 > 구글챗 알람 시간`을 바꾸면 자동 발송 시간도 같이 바뀝니다.

## 4. 수동 테스트

수동 테스트는 GitHub Actions `Send Delayed Alert`의 `Run workflow`를 사용하거나,
함수 URL에 `?force_send=true`를 붙여 호출해 검증할 수 있습니다.

------------------------------------------------------------------------

# 배포

GitHub Pages 기반 자동 배포

    git push origin main

GitHub Actions가 자동으로 빌드 및 배포를 수행합니다.

------------------------------------------------------------------------

# 서비스 주소

https://sanghakbae.github.io/security-activity-monitoring-system/

------------------------------------------------------------------------
