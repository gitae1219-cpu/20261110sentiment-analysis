/**
 * api/_lib/supabase.js
 * 
 * Supabase 데이터베이스와 연동하여 분석 이력을 저장하는 모듈입니다.
 * docs/04-backend-api-spec.md 및 06-testing-deployment.md의 명세를 준수합니다.
 */

import { createClient } from '@supabase/supabase-js';

let supabaseClient = null;

/**
 * Supabase 클라이언트를 초기화합니다.
 * @returns {import('@supabase/supabase-js').SupabaseClient | null}
 */
export function getSupabaseClient() {
  if (supabaseClient) {
    return supabaseClient;
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Supabase 환경변수가 설정되지 않은 경우 null 반환
  if (!supabaseUrl || !serviceRoleKey || 
      supabaseUrl.includes('your-project-id') || 
      serviceRoleKey.includes('your_supabase_service_role_key_here')) {
    return null;
  }

  supabaseClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });

  return supabaseClient;
}

/**
 * 감성 분석 결과를 Supabase 테이블(sentiment_analyses)에 안전하게 저장합니다.
 * 
 * 중요 규칙 (AGENTS.md & PRD.md):
 * - DB 저장이 실패하더라도 AI 분석 결과 자체가 유효하다면 API 전체를 실패시키지 않습니다.
 * - 서버 콘솔에는 민감 정보(키, 원문 등)를 제외하고 오류 코드 및 메시지만 안전하게 기록합니다.
 * 
 * @param {object} params
 * @param {string} params.inputText - 사용자가 입력한 문장
 * @param {string} params.sentiment - 감성 분석 라벨 (positive, negative, neutral)
 * @param {number} params.confidence - 신뢰도 (0~100)
 * @param {string} params.reason - 분석 이유
 * @param {string} params.model - 사용된 AI 모델명
 * @returns {Promise<{ success: boolean, id?: string, error?: string }>}
 */
export async function saveAnalysisLog({ inputText, sentiment, confidence, reason, model }) {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      console.warn('[Supabase Log] Supabase 환경변수가 설정되지 않아 저장을 건너뜁니다.');
      return { success: false, error: 'SUPABASE_NOT_CONFIGURED' };
    }

    const { data, error } = await supabase
      .from('sentiment_analyses')
      .insert([
        {
          input_text: inputText,
          sentiment: sentiment,
          confidence: confidence,
          reason: reason,
          model: model
        }
      ])
      .select('id, created_at')
      .single();

    if (error) {
      // 보안을 위해 원문이나 비밀키 없이 에러 코드만 콘솔에 기록
      console.error('[Supabase Save Error]', { code: error.code, message: error.message });
      return { success: false, error: error.message };
    }

    return { success: true, id: data?.id, createdAt: data?.created_at };
  } catch (err) {
    console.error('[Supabase Unexpected Error]', err.message);
    return { success: false, error: err.message };
  }
}

