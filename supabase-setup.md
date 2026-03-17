# Supabase 연동 설정

## Step 1: Supabase 프로젝트 생성
1. https://supabase.com 접속 → 로그인
2. "New project" 클릭
3. 이름: `k-arena`, 지역: `Northeast Asia (Seoul)`, DB 비밀번호 설정
4. 생성 후 Settings → API 에서 키 복사

## Step 2: Vercel ENV 추가
npx vercel env add NEXT_PUBLIC_SUPABASE_URL production
npx vercel env add NEXT_PUBLIC_SUPABASE_KEY production  
npx vercel env add CRON_SECRET production  # 아무 문자열 (예: k-arena-2025)

## Step 3: SQL Editor에서 스키마 실행
Supabase → SQL Editor → supabase-schema.sql 내용 붙여넣고 실행
