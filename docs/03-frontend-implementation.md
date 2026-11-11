# 03. 프론트엔드 구현 지침

## 1. 범위
순수 HTML, CSS, JavaScript로 한 페이지를 구현한다. React, Vue, Next.js 등 별도 프레임워크는 추가하지 않는다.

## 2. HTML 구성
`index.html`에 다음 의미 구조를 둔다.
- `header`: 로고와 실제 동작하는 내비게이션
- `main`: 히어로, 입력 폼, 결과 영역
- `form`: textarea와 제출 버튼
- `section` 또는 `article`: 결과 영역
- `footer`: AI 결과 안내 및 데이터 처리 안내

textarea에는 `id`, `name`, `maxlength`, `required`, `aria-describedby`를 지정한다. 최대 길이는 서버와 동일하게 2000자다. 단, 클라이언트 제한은 사용자 편의를 위한 것이며 서버 검증을 대체하지 않는다.

## 3. JavaScript 동작
### 제출 절차
1. 폼 submit 이벤트를 가로챈다.
2. 입력값을 trim한다.
3. 비어 있으면 API 요청 없이 사용자에게 안내한다.
4. 요청 중 중복 제출을 막는다.
5. `fetch('/api/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) })`를 호출한다.
6. 응답 JSON을 읽고 HTTP 상태와 `success` 값을 확인한다.
7. 성공이면 결과를 렌더링하고, 실패면 오류 메시지를 표시한다.
8. `finally`에서 버튼과 로딩 상태를 복구한다.

## 4. 화면 데이터 계약
성공 데이터:
```json
{
  "success": true,
  "data": {
    "sentiment": "positive",
    "confidence": 82,
    "reason": "긍정적인 평가와 만족을 나타내는 표현이 포함되어 있습니다."
  }
}
```
실패 데이터:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "분석할 문장을 1~2000자 사이로 입력해 주세요."
  }
}
```
프론트엔드는 서버의 `message`를 그대로 무조건 신뢰해 표시하지 않는다. 알려진 오류 코드는 화면용 문구로 매핑하고, 알 수 없는 오류는 일반 안내 문구로 처리한다.

## 5. 렌더링 및 보안
- 사용자 입력과 AI 결과는 `textContent`로 렌더링한다.
- `innerHTML`에 입력값 또는 모델 결과를 넣지 않는다.
- 외부 스크립트/CDN은 꼭 필요한 경우가 아니면 사용하지 않는다.
- API 키, Supabase 키, 모델 설정은 프론트엔드 파일에 포함하지 않는다.
- 결과 영역은 성공 응답을 검증한 뒤에만 업데이트한다.

## 6. 스타일 구현
- 색상, 간격, 최대 너비, 글자 크기를 CSS 변수로 관리한다.
- 제목 크기는 `clamp()`를 활용한다.
- textarea는 충분한 높이와 명확한 focus 스타일을 가진다.
- 결과 카드는 얇은 테두리와 절제된 배경 대비를 사용한다.
- 버튼은 hover/focus/disabled 상태를 각각 정의한다.
- `prefers-reduced-motion: reduce`일 때 애니메이션을 줄인다.

## 7. 완료 기준
- 키보드 Enter(폼 submit)와 버튼 클릭 모두 요청 가능하다.
- 로딩 중 중복 요청이 발생하지 않는다.
- 오류가 발생해도 입력 텍스트가 유지된다.
- 서버가 반환한 값 외의 임의 감정·점수를 화면에 생성하지 않는다.
- 모바일 360px 폭에서 입력, 버튼, 결과가 화면 안에 들어온다.
