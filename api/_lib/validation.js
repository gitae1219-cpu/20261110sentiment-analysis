/**
 * api/_lib/validation.js
 * 
 * 사용자 요청 입력값 및 OpenAI 응답값의 유효성을 검증하는 모듈입니다.
 * 보안 취약점을 예방하고 비정상적인 데이터가 처리되는 것을 방지합니다.
 */

/**
 * 환경변수 MAX_INPUT_CHARS 값을 정수로 안전하게 읽어옵니다.
 * 환경변수가 지정되지 않았거나 잘못된 경우 기본값 2000을 반환합니다.
 * @returns {number} 최대 허용 글자 수
 */
export function getMaxInputChars() {
  const envVal = process.env.MAX_INPUT_CHARS;
  if (!envVal) {
    return 2000;
  }
  const parsed = parseInt(envVal, 10);
  if (isNaN(parsed) || parsed <= 0) {
    return 2000;
  }
  return parsed;
}

/**
 * 클라이언트로부터 받은 텍스트 입력값을 검증합니다.
 * @param {any} text - 사용자가 입력한 텍스트
 * @returns {{ isValid: boolean, trimmedText: string, error?: { code: string, message: string } }}
 */
export function validateInputText(text) {
  // 1. 문자열 타입 검사
  if (typeof text !== 'string') {
    return {
      isValid: false,
      trimmedText: '',
      error: {
        code: 'VALIDATION_ERROR',
        message: '분석할 텍스트는 문자열 형태여야 합니다.'
      }
    };
  }

  // 2. 앞뒤 공백 제거 (trim)
  const trimmedText = text.trim();

  // 3. 빈 문자열 또는 공백만 있는 경우 거부
  if (trimmedText.length === 0) {
    return {
      isValid: false,
      trimmedText: '',
      error: {
        code: 'VALIDATION_ERROR',
        message: '분석할 문장을 입력해 주세요. (공백만으로는 분석할 수 없습니다.)'
      }
    };
  }

  // 4. 최대 글자 수 초과 검사
  const maxChars = getMaxInputChars();
  if (trimmedText.length > maxChars) {
    return {
      isValid: false,
      trimmedText: '',
      error: {
        code: 'VALIDATION_ERROR',
        message: `입력 텍스트는 최대 ${maxChars}자 이하로 입력해 주세요. (현재: ${trimmedText.length}자)`
      }
    };
  }

  return {
    isValid: true,
    trimmedText: trimmedText
  };
}

/**
 * AI 모델(OpenAI)이 반환한 감성 분석 결과 객체의 스키마와 값 범위를 엄격하게 검증합니다.
 * @param {any} result - AI 응답 객체
 * @returns {{ isValid: boolean, data?: { sentiment: string, confidence: number, reason: string }, error?: string }}
 */
export function validateAnalysisResult(result) {
  if (!result || typeof result !== 'object') {
    return { isValid: false, error: 'AI 응답이 올바른 객체 형태가 아닙니다.' };
  }

  const { sentiment, confidence, reason } = result;

  // 1. 감성 라벨 검증 (positive, negative, neutral 중 하나여야 함)
  const allowedSentiments = ['positive', 'negative', 'neutral'];
  if (!sentiment || !allowedSentiments.includes(sentiment)) {
    return { isValid: false, error: `유효하지 않은 감성 라벨입니다: ${sentiment}` };
  }

  // 2. 모델 추정 신뢰도 검증 (0 ~ 100 사이의 정수)
  if (typeof confidence !== 'number' || !Number.isInteger(confidence) || confidence < 0 || confidence > 100) {
    return { isValid: false, error: `신뢰도는 0~100 사이의 정수여야 합니다: ${confidence}` };
  }

  // 3. 분석 이유 검증 (문자열, 비어있지 않음, 최대 300자)
  if (typeof reason !== 'string' || reason.trim().length === 0) {
    return { isValid: false, error: '분석 이유가 비어 있습니다.' };
  }

  if (reason.length > 300) {
    return { isValid: false, error: `분석 이유가 300자를 초과했습니다: ${reason.length}자` };
  }

  return {
    isValid: true,
    data: {
      sentiment: sentiment,
      confidence: confidence,
      reason: reason.trim()
    }
  };
}

