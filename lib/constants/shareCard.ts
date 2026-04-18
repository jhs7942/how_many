// 공유 카드 이미지 스타일 상수
// 화면 결과 카드(FlowResultPage)와는 독립 — 공유 카드 전용
export const SHARE_CARD = {
  width: 1080,
  height: 1080,
  bg: 'linear-gradient(135deg, #FF7A3D 0%, #FF9A6C 100%)',
  emoji: { size: 520 },
  label: { size: 128, weight: 800, color: '#FFFFFF' },
  tip: { size: 44, color: 'rgba(255,255,255,0.8)', maxLines: 2 },
  padding: 80,
} as const;

// 에러 메시지 매핑
export const SHARE_ERROR_MESSAGES: Record<string, string> = {
  render_failed: '이미지 생성에 실패했어요',
  permission_denied: '', // 사용자 의도적 취소 — 메시지 불필요
  save_failed: '저장에 실패했어요',
  share_unsupported: '이 기기에서는 공유할 수 없어요',
};
