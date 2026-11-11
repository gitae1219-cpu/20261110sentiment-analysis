# 01. 프로젝트 구조 및 생성 지침

## 1. 목표
HTML/CSS/JavaScript 프론트엔드와 Node.js 서버리스 API를 하나의 Vercel 프로젝트로 관리한다. 프레임워크를 임의로 추가하지 않는다.

## 2. 권장 디렉터리 구조
```text
project-root/
├── AGENTS.md
├── PRD.md
├── README.md
├── package.json
├── vercel.json
├── .gitignore
├── .env.example
├── index.html
├── public/
│   ├── css/
│   │   └── styles.css
│   ├── js/
│   │   └── app.js
│   └── assets/
│       └── (필요한 로컬 이미지·아이콘만)
├── api/
│   ├── analyze.js
│   └── _lib/
│       ├── openai.js
│       ├── supabase.js
│       ├── validation.js
│       └── http.js
├── supabase/
│   └── schema.sql
└── docs/
    ├── 01-project-structure-and-setup.md
    ├── 02-ui-design-guide.md
    ├── 03-frontend-implementation.md
    ├── 04-backend-api-spec.md
    ├── 05-ai-and-prompt-spec.md
    └── 06-testing-deployment.md
```

## 3. 생성 순서
1. Node.js LTS 버전을 사용한다. 정확한 버전은 개발 환경과 Vercel 지원 버전을 확인해 `package.json`의 `engines`에 고정한다.
2. `npm init -y`로 프로젝트를 만든다.
3. ESM을 사용할 경우 `package.json`에 `"type": "module"`을 선언한다. CommonJS와 ESM을 섞지 않는다.
4. `public/css`, `public/js`, `public/assets`, `api/_lib`, `supabase`, `docs` 디렉터리를 만든다.
5. 필요한 패키지만 설치한다. 예: `openai`, `@supabase/supabase-js`. 이미 설치된 패키지가 있으면 중복 설치하지 않는다.
6. `index.html`을 정적 진입점으로 사용한다.
7. Vercel에서 `/api/*`를 서버리스 함수로 실행하도록 구성한다. 정적 파일은 프로젝트 루트 설정에 맞춰 제공한다.

## 4. 환경변수
`.env.example`에 아래 키 이름만 기록한다.
```dotenv
OPENAI_API_KEY=
OPENAI_MODEL=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
MAX_INPUT_CHARS=2000
```
- 실제 값은 로컬 `.env.local` 또는 Vercel Project Settings의 Environment Variables에 입력한다.
- `SUPABASE_SERVICE_ROLE_KEY`는 RLS를 우회할 수 있으므로 서버에서만 사용한다.
- `OPENAI_MODEL`은 사용자가 접근 권한을 가진 모델 ID를 명시한다. 모델명을 추측해 기본값으로 넣지 않는다.
- 환경변수가 빠졌다면 서버가 시작/요청 시 명확한 설정 오류를 반환하게 한다.

## 5. Git 규칙
`.gitignore`에 `node_modules/`, `.env`, `.env.*`, `!.env.example`, `.vercel/`, 로그 및 임시 파일을 포함한다. 비밀키가 커밋되었다면 파일에서 지우는 것만으로 끝내지 말고 해당 키를 즉시 폐기·재발급한다.

## 6. 완료 기준
- 위 구조가 생성되어 있다.
- `npm install`이 정상 종료된다.
- `.env.example`만 저장소에 존재하고 실제 키는 없다.
- 정적 페이지와 `/api/analyze` 함수가 Vercel 구조에 맞게 분리되어 있다.
