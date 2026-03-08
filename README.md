# Security Activity Monitoring System

보안 활동 모니터링 시스템의 React + Vite + TypeScript + Supabase 기반 프로젝트입니다.

## 주요 기능

- 로그인 페이지 / 로그아웃
- Google OAuth 구조 반영
- `muhayu.com` 도메인 제한 구조
- 모니터링 대시보드
- 활동 목록 관리
- 보안 활동 등록
- 수행 및 증적 관리
- 캘린더 자동 생성
- 페이지네이션
- Supabase DB / Storage 확장 준비

## 실행 방법

```bash
cp .env.example .env
npm install
npm run dev
```

기본값은 `VITE_AUTH_MODE=mock` 이므로, 바로 로그인 UI 테스트가 가능합니다.

## 실제 Google OAuth 전환

`.env` 에서 아래로 변경하세요.

```env
VITE_AUTH_MODE=supabase
```

그리고 다음 값을 넣습니다.

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY
VITE_ALLOWED_DOMAIN=muhayu.com
```

## Supabase Google OAuth 설정

1. Supabase Dashboard → Authentication → Providers → Google 활성화
2. Google Cloud Console → OAuth Client에 아래 Redirect URI 추가

```text
https://YOUR_PROJECT.supabase.co/auth/v1/callback
```

3. Supabase → Authentication → URL Configuration → Redirect URLs 에 아래 추가

```text
http://localhost:5173/auth/callback
```

## DB 스키마

`supabase/migrations` 폴더에 초기 스키마 SQL이 포함되어 있습니다.

## GitHub Actions

`.github/workflows/deploy.yml` 포함.
기본 배포 대상은 GitHub Pages 입니다.
