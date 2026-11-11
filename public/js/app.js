/**
 * public/js/app.js
 * 
 * Moodline 감성 분석 웹 서비스 프론트엔드 애플리케이션 로직입니다.
 * 
 * 주요 기능:
 * 1. XSS 방지를 위한 textContent 기반 안전한 렌더링
 * 2. 중복 요청 방지 및 로딩 상태 제어
 * 3. [배경 시각 효과]
 *    - 긍정(Positive) 분석 시: 사이트 뒤 배경 전체에서 웅장하고 거대한 불꽃놀이 폭죽(Grand Fireworks) 연출
 *    - 부정(Negative) 분석 시: 사이트 뒤 배경 전체에서 쓸쓸하고 차분하게 쏟아지는 빗줄기(Rain) 연출
 */

// 1. DOM 요소 참조
const form = document.getElementById('sentiment-form');
const textarea = document.getElementById('sentence-input');
const charCountSpan = document.getElementById('char-count');
const charMaxSpan = document.getElementById('char-max');
const submitBtn = document.getElementById('submit-btn');
const buttonText = submitBtn.querySelector('.button-text');
const spinner = submitBtn.querySelector('.spinner');

// 에러 표시 영역
const errorBox = document.getElementById('error-box');
const errorMessage = document.getElementById('error-message');

// 결과 표시 영역
const resultBox = document.getElementById('result-box');
const resultTitle = document.getElementById('result-title');
const sentimentIcon = document.getElementById('sentiment-icon');
const confidenceValue = document.getElementById('confidence-value');
const confidenceBar = document.getElementById('confidence-bar');
const confidenceBarFill = document.getElementById('confidence-bar-fill');
const resultReason = document.getElementById('result-reason');
const resultTime = document.getElementById('result-time');

// 배경 이펙트 캔버스
const fxCanvas = document.getElementById('fx-canvas');
const ctx = fxCanvas ? fxCanvas.getContext('2d') : null;

// 2. 최대 글자 수 상수
const MAX_CHARS = 2000;
charMaxSpan.textContent = String(MAX_CHARS);

// 3. 감정 라벨 및 아이콘 매핑 테이블
const SENTIMENT_META = {
  positive: {
    label: '긍정 (Positive)',
    icon: '😊',
    themeClass: 'is-positive'
  },
  negative: {
    label: '부정 (Negative)',
    icon: '😔',
    themeClass: 'is-negative'
  },
  neutral: {
    label: '중립 (Neutral)',
    icon: '😐',
    themeClass: 'is-neutral'
  }
};

/* ==============================================================================
   4. 배경 애니메이션 엔진 (대형 폭죽 & 빗줄기 효과)
   ============================================================================== */
let activeEffect = null; // 'fireworks' | 'rain' | null
let animationFrameId = null;

// 폭죽용 파티클 및 로켓 배열
let fireworks = [];
let fireworkParticles = [];

// 비(Rain)용 빗방울 배열
let rainDrops = [];

// 화려한 불꽃놀이 색상 목록
const FIREWORK_PALETTES = [
  ['#FF5A1F', '#FFA07A', '#FFD700'], // 오렌지 골드
  ['#10B981', '#34D399', '#A7F3D0'], // 에메랄드 그린
  ['#EC4899', '#F472B6', '#FBCFE8'], // 화사한 핑크
  ['#8B5CF6', '#A78BFA', '#DDD6FE'], // 신비로운 바이올렛
  ['#38BDF8', '#67E8F9', '#FFFFFF']  // 청량한 아쿠아 & 화이트
];

/**
 * 캔버스 크기를 브라우저 창 크기에 정확하게 맞춥니다.
 */
function resizeFxCanvas() {
  if (!fxCanvas) return;
  fxCanvas.width = window.innerWidth;
  fxCanvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeFxCanvas);
resizeFxCanvas();

/**
 * 진행 중인 모든 배경 효과를 초기화하고 멈춥니다.
 */
function stopBackgroundEffects() {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
  activeEffect = null;
  fireworks = [];
  fireworkParticles = [];
  rainDrops = [];
  if (ctx) {
    ctx.clearRect(0, 0, fxCanvas.width, fxCanvas.height);
  }
}

/**
 * [긍정 효과] 사이트 배경에서 웅장하게 터지는 대형 불꽃놀이(Grand Fireworks)
 */
function launchBigFireworks() {
  stopBackgroundEffects();
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  activeEffect = 'fireworks';
  resizeFxCanvas();

  // 1개의 불꽃이 폭발할 때 생성되는 스파크 입자 생성 함수
  function createExplosion(x, y) {
    const palette = FIREWORK_PALETTES[Math.floor(Math.random() * FIREWORK_PALETTES.length)];
    const sparkCount = 80 + Math.floor(Math.random() * 40); // 80~120개의 파티클

    for (let i = 0; i < sparkCount; i++) {
      const angle = (Math.PI * 2 * i) / sparkCount + (Math.random() - 0.5) * 0.2;
      const speed = Math.random() * 9 + 2; // 사방으로 퍼지는 속도

      fireworkParticles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 3 + 2,
        color: palette[Math.floor(Math.random() * palette.length)],
        alpha: 1,
        decay: Math.random() * 0.015 + 0.008,
        gravity: 0.12,
        trail: [] // 잔상 효과
      });
    }
  }

  // 로켓 발사체 발사 함수
  function launchRocket() {
    const startX = window.innerWidth * 0.15 + Math.random() * (window.innerWidth * 0.7);
    const targetY = window.innerHeight * 0.15 + Math.random() * (window.innerHeight * 0.4);
    const speed = Math.random() * 4 + 14;

    fireworks.push({
      x: startX,
      y: window.innerHeight,
      targetY: targetY,
      vx: (Math.random() - 0.5) * 3,
      vy: -speed,
      color: '#FFFFFF'
    });
  }

  // 초기 4발 연속 발사
  launchRocket();
  setTimeout(launchRocket, 250);
  setTimeout(launchRocket, 600);
  setTimeout(launchRocket, 1000);
  setTimeout(launchRocket, 1400);

  // 불꽃놀이 렌더링 루프
  function animateFireworks() {
    if (activeEffect !== 'fireworks') return;

    // 약간의 잔상이 남도록 투명한 검은색으로 덮기
    ctx.fillStyle = 'rgba(5, 5, 5, 0.18)';
    ctx.fillRect(0, 0, fxCanvas.width, fxCanvas.height);

    // 1. 발사 중인 로켓 업데이트 및 렌더링
    for (let i = fireworks.length - 1; i >= 0; i--) {
      const f = fireworks[i];
      f.x += f.vx;
      f.y += f.vy;

      ctx.beginPath();
      ctx.arc(f.x, f.y, 3, 0, Math.PI * 2);
      ctx.fillStyle = f.color;
      ctx.fill();

      // 목표 높이에 도달하면 팡! 터짐
      if (f.y <= f.targetY) {
        createExplosion(f.x, f.y);
        fireworks.splice(i, 1);
      }
    }

    // 2. 폭발한 파티클 스파크 업데이트 및 렌더링
    for (let i = fireworkParticles.length - 1; i >= 0; i--) {
      const p = fireworkParticles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.vx *= 0.98;
      p.vy *= 0.98;
      p.alpha -= p.decay;

      if (p.alpha <= 0) {
        fireworkParticles.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;
      ctx.shadowBlur = 10;
      ctx.shadowColor = p.color;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    if (fireworks.length > 0 || fireworkParticles.length > 0) {
      animationFrameId = requestAnimationFrame(animateFireworks);
    } else {
      // 폭죽이 모두 끝나면 캔버스 정리
      ctx.clearRect(0, 0, fxCanvas.width, fxCanvas.height);
      activeEffect = null;
    }
  }

  animateFireworks();
}

/**
 * [부정 효과] 사이트 배경에서 쓸쓸하게 내리는 빗줄기(Rain)
 */
function startRain() {
  stopBackgroundEffects();
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  activeEffect = 'rain';
  resizeFxCanvas();

  const dropCount = 140; // 화면에 내리는 빗줄기 수
  rainDrops = [];

  for (let i = 0; i < dropCount; i++) {
    rainDrops.push({
      x: Math.random() * (window.innerWidth + 200) - 100,
      y: Math.random() * window.innerHeight,
      length: Math.random() * 20 + 15, // 빗방울 길이
      speed: Math.random() * 12 + 18,  // 낙하 속도
      opacity: Math.random() * 0.4 + 0.15,
      wind: -2 // 왼쪽으로 살짝 부는 바람 각도
    });
  }

  // 빗줄기 렌더링 루프
  function animateRain() {
    if (activeEffect !== 'rain') return;

    ctx.clearRect(0, 0, fxCanvas.width, fxCanvas.height);

    for (let i = 0; i < rainDrops.length; i++) {
      const d = rainDrops[i];

      ctx.beginPath();
      ctx.moveTo(d.x, d.y);
      ctx.lineTo(d.x + d.wind * (d.length / 10), d.y + d.length);
      ctx.strokeStyle = `rgba(160, 185, 220, ${d.opacity})`;
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // 이동
      d.x += d.wind;
      d.y += d.speed;

      // 바닥을 벗어나면 다시 하늘 위로 리셋
      if (d.y > fxCanvas.height) {
        d.y = -d.length;
        d.x = Math.random() * (window.innerWidth + 200) - 100;
      }
    }

    animationFrameId = requestAnimationFrame(animateRain);
  }

  animateRain();
}

/* ==============================================================================
   5. UI 상태 및 렌더링 제어
   ============================================================================== */

/**
 * 에러 메시지를 화면에 표시합니다.
 * @param {string} msg - 안내할 에러 문구
 */
function showError(msg) {
  errorMessage.textContent = msg;
  errorBox.classList.remove('hidden');
}

/**
 * 에러 표시를 숨깁니다.
 */
function clearError() {
  errorMessage.textContent = '';
  errorBox.classList.add('hidden');
}

/**
 * 제출 버튼의 로딩 상태를 토글합니다.
 * @param {boolean} isLoading
 */
function setLoading(isLoading) {
  if (isLoading) {
    submitBtn.disabled = true;
    buttonText.textContent = '분석 진행 중...';
    spinner.classList.remove('hidden');
  } else {
    submitBtn.disabled = false;
    buttonText.textContent = '감성 분석하기';
    spinner.classList.add('hidden');
  }
}

/**
 * 분석 결과를 화면에 렌더링합니다.
 * @param {object} data - { sentiment: string, confidence: number, reason: string }
 */
function renderResult(data) {
  const { sentiment, confidence, reason } = data;
  const meta = SENTIMENT_META[sentiment] || SENTIMENT_META.neutral;

  // 기존 테마 클래스 제거 후 새 테마 클래스 추가
  resultBox.classList.remove('is-positive', 'is-negative', 'is-neutral');
  resultBox.classList.add(meta.themeClass);

  // 1. 감정 라벨 및 아이콘 (textContent로 안전하게 삽입)
  resultTitle.textContent = meta.label;
  sentimentIcon.textContent = meta.icon;

  // 2. 모델 추정 신뢰도 (0~100)
  const safeConfidence = Math.max(0, Math.min(100, Math.round(confidence)));
  confidenceValue.textContent = `${safeConfidence}%`;
  confidenceBar.setAttribute('aria-valuenow', String(safeConfidence));
  confidenceBarFill.style.width = `${safeConfidence}%`;

  // 3. 분석 이유
  resultReason.textContent = reason;

  // 4. 분석 일시 표시
  const now = new Date();
  const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
  resultTime.textContent = `분석 완료: ${timeString}`;

  // 결과 박스 표시
  resultBox.classList.remove('hidden');

  // ✨ [배경 연출 핵심 로직]
  if (sentiment === 'positive') {
    // 긍정: 사이트 뒤 배경에서 대형 불꽃놀이 폭죽 발사!
    launchBigFireworks();
  } else if (sentiment === 'negative') {
    // 부정: 사이트 뒤 배경에서 쓸쓸하게 빗줄기가 주룩주룩 내림!
    startRain();
  } else {
    // 중립: 차분하게 배경 효과 정리
    stopBackgroundEffects();
  }

  // 모바일 사용자를 위해 결과 카드로 스크롤 이동
  resultBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// 6. 실시간 글자 수 카운팅 이벤트 리스너
textarea.addEventListener('input', () => {
  const currentLength = textarea.value.length;
  charCountSpan.textContent = String(currentLength);

  if (currentLength > MAX_CHARS) {
    charCountSpan.style.color = '#EF4444';
  } else {
    charCountSpan.style.color = '';
  }
  
  // 입력을 시작하면 기존 에러 안내를 정리
  if (errorBox.classList.contains('hidden') === false) {
    clearError();
  }
});

// 7. 폼 제출 이벤트 리스너
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearError();

  const rawText = textarea.value;
  const trimmedText = rawText.trim();

  // 클라이언트 1차 검증
  if (trimmedText.length === 0) {
    showError('분석할 문장을 입력해 주세요. (공백 문자만으로는 분석할 수 없습니다.)');
    textarea.focus();
    return;
  }

  if (trimmedText.length > MAX_CHARS) {
    showError(`문장은 최대 ${MAX_CHARS}자 이하로 입력해 주세요. (현재: ${trimmedText.length}자)`);
    textarea.focus();
    return;
  }

  // 이전 배경 효과 정지
  stopBackgroundEffects();

  // 로딩 상태 활성화 및 중복 제출 방지
  setLoading(true);

  try {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text: trimmedText })
    });

    const result = await response.json().catch(() => null);

    if (!response.ok || !result || !result.success) {
      // 서버에서 반환한 친절한 에러 메시지 추출
      const serverMsg = result?.error?.message;
      const errorCode = result?.error?.code;

      let displayMsg = '감성 분석 요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.';
      if (serverMsg) {
        displayMsg = serverMsg;
      } else if (errorCode === 'CONFIGURATION_ERROR') {
        displayMsg = '서버 환경변수(API 키 또는 모델명)가 설정되지 않았습니다. .env 파일을 확인해 주세요.';
      } else if (errorCode === 'AI_PROVIDER_ERROR') {
        displayMsg = 'AI 모델과의 통신 중 문제가 발생했습니다. API 키와 네트워크를 확인해 주세요.';
      }

      showError(displayMsg);
      return;
    }

    // 성공적으로 결과를 수신한 경우 렌더링
    renderResult(result.data);

  } catch (networkError) {
    console.error('[Network Error]', networkError);
    showError('서버와의 네트워크 연결에 실패했습니다. 로컬 서버 실행 상태를 확인해 주세요.');
  } finally {
    // 요청 완료 후 로딩 상태 해제 (입력값은 그대로 유지)
    setLoading(false);
  }
});
