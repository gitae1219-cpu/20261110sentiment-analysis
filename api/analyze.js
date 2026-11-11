/**
 * api/analyze.js
 * 
 * Vercel Serverless Function: 감성 분석 API 엔드포인트
 * POST /api/analyze
 */

// 로컬 개발 환경 지원을 위한 dotenv 로드 (배포 환경에서는 Vercel 환경변수 우선 적용)
import 'dotenv/config';
import { sendSuccess, sendError } from './_lib/http.js';
import { validateInputText } from './_lib/validation.js';
import { analyzeSentiment } from './_lib/openai.js';
import { saveAnalysisLog } from './_lib/supabase.js';

/**
 * Vercel 서버리스 함수 진입점
 * @param {import('http').IncomingMessage} req - 요청 객체
 * @param {import('http').ServerResponse} res - 응답 객체
 */
export default async function handler(req, res) {
  // 1. HTTP 메서드 검증 (POST만 허용)
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return sendError(res, 405, 'METHOD_NOT_ALLOWED', 'POST 요청만 지원합니다.');
  }

  // 2. 요청 본문(JSON) 읽기 및 파싱
  let body = req.body;
  if (!body) {
    try {
      body = await parseJsonBody(req);
    } catch {
      return sendError(res, 400, 'VALIDATION_ERROR', '올바른 JSON 형식의 요청 본문이 필요합니다.');
    }
  } else if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      return sendError(res, 400, 'VALIDATION_ERROR', '요청 본문 JSON 파싱에 실패했습니다.');
    }
  }

  // 3. 입력 텍스트 유효성 검증
  const { text } = body || {};
  const validation = validateInputText(text);
  if (!validation.isValid) {
    return sendError(res, 400, validation.error.code, validation.error.message);
  }

  // 4. 감성 분석 수행 (OpenAI 연동)
  let analysisResult;
  try {
    analysisResult = await analyzeSentiment(validation.trimmedText);
  } catch (error) {
    if (error.code === 'CONFIGURATION_ERROR') {
      return sendError(res, 503, 'CONFIGURATION_ERROR', error.message);
    }
    if (error.code === 'AI_PROVIDER_ERROR') {
      return sendError(res, 502, 'AI_PROVIDER_ERROR', error.message);
    }
    return sendError(res, 500, 'INTERNAL_ERROR', '서버 내부 오류로 분석을 완료하지 못했습니다.');
  }

  // 5. Supabase에 결과 저장 (비동기 수행, 저장이 실패해도 분석 결과 응답은 유지)
  const modelName = process.env.OPENAI_MODEL || 'unknown';
  saveAnalysisLog({
    inputText: validation.trimmedText,
    sentiment: analysisResult.sentiment,
    confidence: analysisResult.confidence,
    reason: analysisResult.reason,
    model: modelName
  }).catch((err) => {
    console.error('[Supabase Background Error]', err.message);
  });

  // 6. 성공 응답 반환
  return sendSuccess(res, {
    sentiment: analysisResult.sentiment,
    confidence: analysisResult.confidence,
    reason: analysisResult.reason
  }, 200);
}

/**
 * 스트림 형태의 요청 본문을 읽어 JSON 객체로 변환하는 유틸리티
 * @param {import('http').IncomingMessage} req
 * @returns {Promise<any>}
 */
function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', chunk => {
      raw += chunk;
      // 악의적인 대용량 페이로드 방어 (최대 1MB)
      if (raw.length > 1e6) {
        req.destroy();
        reject(new Error('Payload Too Large'));
      }
    });
    req.on('end', () => {
      if (!raw.trim()) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', err => reject(err));
  });
}

