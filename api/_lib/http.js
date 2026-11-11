/**
 * api/_lib/http.js
 * 
 * HTTP 응답을 표준화된 JSON 형식으로 전송하는 유틸리티 헬퍼 함수 모음입니다.
 * PRD 및 API 명세서에 정의된 일관된 성공/실패 포맷을 유지합니다.
 */

/**
 * 성공 응답을 전송합니다.
 * @param {import('http').ServerResponse} res - Node.js HTTP 응답 객체
 * @param {object} data - 클라이언트에 반환할 데이터 객체
 * @param {number} statusCode - HTTP 상태 코드 (기본값: 200)
 */
export function sendSuccess(res, data, statusCode = 200) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify({
    success: true,
    data: data
  }));
}

/**
 * 에러 응답을 전송합니다.
 * 민감한 서버 정보(스택 트레이스, API 키 등)는 외부로 유출하지 않고 표준화된 에러 객체만 반환합니다.
 * @param {import('http').ServerResponse} res - Node.js HTTP 응답 객체
 * @param {number} statusCode - HTTP 상태 코드 (400, 405, 500, 502, 503 등)
 * @param {string} code - 에러 식별 코드 (예: VALIDATION_ERROR, CONFIGURATION_ERROR 등)
 * @param {string} message - 사용자 친화적인 안내 메시지
 */
export function sendError(res, statusCode, code, message) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify({
    success: false,
    error: {
      code: code,
      message: message
    }
  }));
}

