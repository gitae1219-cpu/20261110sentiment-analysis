# 06. 테스트, 배포 및 운영 지침

## 1. 테스트 환경
- 로컬 Node.js LTS
- 테스트용 OpenAI API 키와 모델 ID
- 별도의 테스트 Supabase 프로젝트 권장
- Vercel Preview 배포 환경

실제 키는 테스트 코드나 문서에 쓰지 않는다. CI에서는 환경변수/Secret 기능을 사용한다.

## 2. 기능 테스트 체크리스트
### 입력과 API
- [ ] 정상 한국어 문장으로 요청하면 200과 정상 데이터가 반환된다.
- [ ] 정상 영어 문장도 분석된다.
- [ ] `text` 누락, 숫자/배열 등 잘못된 타입은 400이다.
- [ ] 빈 문자열과 공백 문자열은 400이다.
- [ ] 2000자 초과는 400이다.
- [ ] GET 등 POST 이외 메서드는 405다.
- [ ] 잘못된 JSON은 400이다.

### AI 결과
- [ ] 긍정 문장 테스트에서 `positive` 라벨이 자연스럽게 선택된다.
- [ ] 부정 문장 테스트에서 `negative` 라벨이 자연스럽게 선택된다.
- [ ] 중립 문장 테스트에서 `neutral` 라벨이 자연스럽게 선택된다.
- [ ] confidence가 정수 0~100인지 검사한다.
- [ ] reason이 비어 있지 않고 300자 이하인지 검사한다.
- [ ] 잘못된 모델 출력은 502로 처리한다.
- [ ] API 키 오류·할당량 초과·타임아웃이 사용자에게 안전한 메시지로 표시된다.

### UI
- [ ] 첫 진입 시 입력과 안내가 보인다.
- [ ] 제출 즉시 로딩 상태가 보인다.
- [ ] 로딩 중 버튼이 비활성화된다.
- [ ] 성공 시 감정·신뢰도·이유가 모두 표시된다.
- [ ] 실패 시 오류가 표시되고 입력값은 유지된다.
- [ ] 다시 입력하고 재분석할 수 있다.
- [ ] 키보드만으로 입력과 제출이 가능하다.
- [ ] 360px, 768px, 1440px 화면에서 가로 스크롤이나 요소 겹침이 없다.

### Supabase
- [ ] 정상 분석 결과가 DB에 저장된다.
- [ ] DB 저장 실패가 분석 결과 반환을 불필요하게 막지 않는다.
- [ ] 원문 텍스트 저장 정책이 사용자 안내와 일치한다.
- [ ] Service Role Key가 클라이언트에 포함되지 않는다.

## 3. Supabase 테이블 초안
`supabase/schema.sql`에 아래 구조를 생성한다.
```sql
create table if not exists public.sentiment_analyses (
  id uuid primary key default gen_random_uuid(),
  input_text text not null,
  sentiment text not null check (sentiment in ('positive', 'negative', 'neutral')),
  confidence integer not null check (confidence between 0 and 100),
  reason varchar(300) not null,
  model text not null,
  created_at timestamptz not null default now()
);

alter table public.sentiment_analyses enable row level security;
```
MVP에는 사용자 인증이 없으므로 브라우저에서 테이블에 직접 접근하지 않는다. 서버만 Service Role Key로 insert한다. 공개 SELECT/INSERT 정책을 만들지 않는다. 원문 저장은 민감정보가 포함될 수 있으므로 사용자에게 저장 사실을 안내하고, 보관 기간·삭제 정책을 운영 전에 결정한다. 운영 정책이 정해지지 않았다면 원문을 저장하지 않고 분석 결과 메타데이터만 저장하는 대안으로 범위를 조정한 뒤 PRD를 갱신한다.

## 4. 로컬 실행
1. 의존성 설치: `npm install`
2. `.env.local` 생성 후 `.env.example`의 키를 채운다.
3. Supabase SQL Editor에서 `supabase/schema.sql`을 실행한다.
4. `npm run dev` 스크립트가 실제로 구성되어 있는지 확인한다. Vercel 로컬 개발을 사용한다면 `vercel dev`를 실행한다.
5. 브라우저에서 로컬 주소를 열고 테스트한다.

`package.json`에 실제로 존재하지 않는 명령을 README에 안내하지 않는다. Vercel CLI가 필요하면 개발 의존성 또는 안내된 설치 방법을 명확히 한다.

## 5. Vercel 배포
1. Git 저장소를 Vercel에 연결한다.
2. Framework Preset은 프로젝트 구조에 맞는 Other/정적 사이트 구성을 선택한다.
3. Root Directory를 프로젝트 루트로 지정한다.
4. `OPENAI_API_KEY`, `OPENAI_MODEL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `MAX_INPUT_CHARS`를 Development/Preview/Production 환경에 맞게 등록한다.
5. 배포 후 `/`와 `/api/analyze`를 각각 확인한다.
6. Preview와 Production 환경변수가 분리되어 있는지 확인한다.
7. 배포 로그에 비밀정보나 사용자 원문이 남지 않는지 확인한다.

## 6. 운영 전 확인 사항
- OpenAI 사용량·비용 한도 및 알림 설정
- API 요청 제한 정책과 악용 방지
- Supabase 데이터 보관 기간 및 삭제 절차
- 개인정보 처리방침 및 사용자 안내 문구
- 장애 시 오류 메시지와 모니터링
- 모델 ID 변경 시 테스트 재실행

## 7. 배포 완료 기준
- Vercel Production URL에서 정적 페이지가 열린다.
- 유효한 문장을 분석해 세 가지 결과 필드를 표시한다.
- 필수 환경변수가 누락되면 안전한 설정 오류가 발생한다.
- DB 저장이 설계대로 수행된다.
- 모바일/데스크톱에서 핵심 기능이 작동한다.
- 위 테스트 체크리스트의 결과를 기록하고 미통과 항목을 숨기지 않는다.
