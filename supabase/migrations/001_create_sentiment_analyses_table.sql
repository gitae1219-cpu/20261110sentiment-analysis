-- ==============================================================================
-- 001_create_sentiment_analyses_table.sql
-- 설명: 감성 분석 결과를 저장하기 위한 Supabase 테이블 생성 및 보안 정책(RLS) 설정
-- 작성일: 2026-11-10
-- ==============================================================================

-- 1. 감성 분석 결과 저장 테이블 생성
--    - id: 고유 식별자 (UUID 자동 생성)
--    - input_text: 사용자가 입력한 분석 대상 문장
--    - sentiment: 감성 분석 결과 ('positive', 'negative', 'neutral' 중 하나로 제한)
--    - confidence: 모델 추정 신뢰도 (0 ~ 100 사이의 정수)
--    - reason: 분석 이유 (최대 300자)
--    - model: 분석에 사용된 AI 모델명 (예: gpt-4o-mini)
--    - created_at: 데이터 생성 일시 (기본값: 현재 시각)
create table if not exists public.sentiment_analyses (
  id uuid primary key default gen_random_uuid(),
  input_text text not null,
  sentiment text not null check (sentiment in ('positive', 'negative', 'neutral')),
  confidence integer not null check (confidence between 0 and 100),
  reason varchar(300) not null,
  model text not null,
  created_at timestamptz not null default now()
);

-- 2. 테이블 코멘트 및 컬럼 코멘트 등록 (유지보수 및 교육용)
comment on table public.sentiment_analyses is '사용자 문장 감성 분석 결과 기록 테이블';
comment on column public.sentiment_analyses.id is '기록 고유 식별자 (UUID)';
comment on column public.sentiment_analyses.input_text is '사용자가 입력한 원본 텍스트';
comment on column public.sentiment_analyses.sentiment is '감성 분류 결과 (positive/negative/neutral)';
comment on column public.sentiment_analyses.confidence is 'AI 모델 추정 신뢰도 (0~100)';
comment on column public.sentiment_analyses.reason is '분석 근거 및 이유 설명';
comment on column public.sentiment_analyses.model is '사용된 OpenAI 모델명';
comment on column public.sentiment_analyses.created_at is '분석 요청 일시';

-- 3. Row Level Security (RLS) 행 단위 보안 활성화
--    - 브라우저나 외부의 무분별한 직접 접근을 차단합니다.
--    - 서버의 Supabase Service Role Key를 통해서만 안전하게 데이터가 삽입(INSERT)되도록 합니다.
alter table public.sentiment_analyses enable row level security;

