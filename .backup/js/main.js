(function () {
/* ===== 인원 기반 활동 데이터 ===== */
const ACTIVITY_DATA = {
  2: [
    { label: '카페', emoji: '☕' },
    { label: '산책', emoji: '🚶' },
    { label: '전시', emoji: '🎨' },
    { label: '영화', emoji: '🎬' },
  ],
  3: [
    { label: '카페', emoji: '☕' },
    { label: '술집', emoji: '🍺' },
    { label: '보드게임', emoji: '🎲' },
    { label: '노래방', emoji: '🎤' },
  ],
  4: [
    { label: '노래방', emoji: '🎤' },
    { label: '보드게임', emoji: '🎲' },
    { label: '방탈출', emoji: '🔐' },
    { label: '볼링', emoji: '🎳' },
  ],
  5: [
    { label: '고깃집', emoji: '🥩' },
    { label: '술집', emoji: '🍺' },
    { label: '볼링', emoji: '🎳' },
    { label: '방탈출', emoji: '🔐' },
  ],
  6: [
    { label: '고깃집', emoji: '🥩' },
    { label: '볼링', emoji: '🎳' },
    { label: '술집', emoji: '🍺' },
    { label: '노래방', emoji: '🎤' },
  ],
};

/* ===== 활동별 장소 유형 데이터 ===== */
const PLACE_DATA = {
  '카페': [
    { label: '아늑한 카페', emoji: '☕' },
    { label: '루프탑 카페', emoji: '🏙️' },
    { label: '베이커리 카페', emoji: '🥐' },
    { label: '북카페', emoji: '📚' },
  ],
  '산책': [
    { label: '한강공원', emoji: '🌊' },
    { label: '도심 공원', emoji: '🌳' },
    { label: '숲길', emoji: '🌲' },
    { label: '야경 명소', emoji: '✨' },
  ],
  '전시': [
    { label: '미술관', emoji: '🖼️' },
    { label: '갤러리', emoji: '🎨' },
    { label: '팝업 전시', emoji: '📸' },
    { label: '박물관', emoji: '🏛️' },
  ],
  '영화': [
    { label: '멀티플렉스', emoji: '🎬' },
    { label: '독립영화관', emoji: '🎥' },
    { label: '4DX/IMAX', emoji: '🌀' },
    { label: '드라이브인', emoji: '🚗' },
  ],
  '노래방': [
    { label: '코인 노래방', emoji: '🪙' },
    { label: '일반 노래방', emoji: '🎤' },
    { label: '프리미엄 룸', emoji: '👑' },
    { label: '주점 노래방', emoji: '🍺' },
  ],
  '술집': [
    { label: '포장마차', emoji: '🏮' },
    { label: '이자카야', emoji: '🍶' },
    { label: '와인바', emoji: '🍷' },
    { label: '수제맥주 바', emoji: '🍻' },
  ],
  '보드게임': [
    { label: '보드게임 카페', emoji: '🎲' },
    { label: '방탈출 카페', emoji: '🔐' },
    { label: '오락실', emoji: '🕹️' },
    { label: '다트바', emoji: '🎯' },
  ],
  '방탈출': [
    { label: '공포 테마', emoji: '👻' },
    { label: '추리 테마', emoji: '🔍' },
    { label: '액션 테마', emoji: '💥' },
    { label: '판타지 테마', emoji: '🧙' },
  ],
  '볼링': [
    { label: '볼링장', emoji: '🎳' },
    { label: '스크린 스포츠', emoji: '🏆' },
    { label: '스포츠 복합관', emoji: '⚽' },
    { label: '당구장', emoji: '🎱' },
  ],
  '고깃집': [
    { label: '삼겹살 집', emoji: '🥓' },
    { label: '소고기 전문점', emoji: '🥩' },
    { label: '양고기 구이', emoji: '🍖' },
    { label: '닭갈비 집', emoji: '🍗' },
  ],
};

/* ===== 돌림판 클래스 ===== */
class SpinWheel {
  constructor(canvas, segments) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.segments = segments;
    this.currentAngle = 0;
    this.isSpinning = false;
    this.resultIndex = -1;

    // 고해상도 대응
    const dpr = window.devicePixelRatio || 1;
    const size = 280;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = size + 'px';
    canvas.style.height = size + 'px';
    this.ctx.scale(dpr, dpr);
    this.size = size;

    this.colors = [
      '#FF7A3D', '#FFB347', '#FF9A6C', '#FFD6C2',
      '#FF6B35', '#FFAA80', '#FF8C5A', '#FFC49B',
    ];

    this.draw();
  }

  draw(highlightIndex = -1) {
    const ctx = this.ctx;
    const cx = this.size / 2;
    const cy = this.size / 2;
    const r = cx - 4;
    const count = this.segments.length;
    const arc = (Math.PI * 2) / count;

    ctx.clearRect(0, 0, this.size, this.size);

    // 배경 원
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r + 4, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.shadowColor = 'rgba(255,122,61,0.2)';
    ctx.shadowBlur = 16;
    ctx.fill();
    ctx.restore();

    this.segments.forEach((seg, i) => {
      const startAngle = this.currentAngle + arc * i - Math.PI / 2;
      const endAngle = startAngle + arc;

      // 세그먼트 채우기
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, startAngle, endAngle);
      ctx.closePath();

      const isHighlight = i === highlightIndex;
      ctx.fillStyle = isHighlight
        ? '#FF7A3D'
        : (i % 2 === 0 ? '#FFF7F2' : '#FFD6C2');
      ctx.fill();

      // 테두리
      ctx.strokeStyle = '#FF7A3D';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();

      // 텍스트
      const midAngle = startAngle + arc / 2;
      const textR = r * 0.62;
      const tx = cx + textR * Math.cos(midAngle);
      const ty = cy + textR * Math.sin(midAngle);

      ctx.save();
      ctx.translate(tx, ty);
      ctx.rotate(midAngle + Math.PI / 2);

      // 이모지
      ctx.font = `${Math.min(22, 280 / count * 0.55)}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(seg.emoji, 0, -12);

      // 레이블
      ctx.font = `bold ${Math.min(12, 280 / count * 0.28)}px Pretendard, sans-serif`;
      ctx.fillStyle = isHighlight ? '#fff' : '#2E2E2E';
      ctx.fillText(seg.label, 0, 8);
      ctx.restore();
    });

    // 중앙 원
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, 22, 0, Math.PI * 2);
    ctx.fillStyle = '#FF7A3D';
    ctx.shadowColor = 'rgba(255,122,61,0.4)';
    ctx.shadowBlur = 8;
    ctx.fill();
    ctx.restore();
  }

  spin(onDone) {
    if (this.isSpinning) return;
    this.isSpinning = true;

    // 결과 랜덤 결정
    this.resultIndex = Math.floor(Math.random() * this.segments.length);
    const count = this.segments.length;
    const arc = (Math.PI * 2) / count;

    // 포인터(위쪽)가 가리키는 각도 계산
    // 포인터는 -π/2 (위쪽), 결과 세그먼트의 중간각이 위쪽에 와야 함
    const targetMid = -arc * this.resultIndex - arc / 2;
    // 5~8바퀴 더 돌리기
    const extraRotation = (5 + Math.random() * 3) * Math.PI * 2;
    const targetAngle = targetMid - this.currentAngle + extraRotation;

    const duration = 3500;
    const startAngle = this.currentAngle;
    const startTime = performance.now();

    const easeOut = (t) => 1 - Math.pow(1 - t, 3.5);

    const animate = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOut(progress);

      this.currentAngle = startAngle + targetAngle * eased;
      this.draw(progress === 1 ? this.resultIndex : -1);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        this.isSpinning = false;
        this.draw(this.resultIndex);
        if (onDone) onDone(this.segments[this.resultIndex]);
      }
    };

    requestAnimationFrame(animate);
  }
}

/* ===== 세션 스토리지 헬퍼 ===== */
const session = {
  set(key, value) {
    sessionStorage.setItem(key, JSON.stringify(value));
  },
  get(key) {
    try {
      return JSON.parse(sessionStorage.getItem(key));
    } catch {
      return null;
    }
  },
};

/* ===== 토스트 알림 ===== */
function showToast(message, duration = 2000) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('show'), duration);
}

/* ===== 클립보드 복사 ===== */
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    showToast('복사되었어요! 📋');
  } catch {
    // 폴백
    const el = document.createElement('textarea');
    el.value = text;
    el.style.position = 'fixed';
    el.style.opacity = '0';
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    showToast('복사되었어요! 📋');
  }
}

/* ===== 더미 방 코드 생성 ===== */
function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

/* ===== 더미 참여자 데이터 ===== */
const DUMMY_PARTICIPANTS = [
  { name: '민준', voted: true, emoji: '🐯' },
  { name: '서연', voted: true, emoji: '🦊' },
  { name: '지호', voted: false, emoji: '🐧' },
  { name: '하은', voted: false, emoji: '🐰' },
  { name: '도윤', voted: true, emoji: '🦁' },
];

/* ===== 더미 투표 결과 데이터 ===== */
const DUMMY_VOTE_RESULTS = [
  { label: '보드게임', emoji: '🎲', votes: 3 },
  { label: '노래방', emoji: '🎤', votes: 3 },
  { label: '방탈출', emoji: '🔐', votes: 2 },
  { label: '볼링', emoji: '🎳', votes: 1 },
];

/* ===== 내보내기 ===== */
window.HowMany = {
  SpinWheel,
  ACTIVITY_DATA,
  PLACE_DATA,
  session,
  showToast,
  copyToClipboard,
  generateRoomCode,
  DUMMY_PARTICIPANTS,
  DUMMY_VOTE_RESULTS,
};
})();
