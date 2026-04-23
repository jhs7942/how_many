'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import PageLayout from '@/components/PageLayout';
import Toast, { useToast } from '@/components/Toast';
import ConfettiBurst from '@/components/ConfettiBurst';
import { session } from '@/lib/session';
import { copyToClipboard, getAppBaseUrl, openMap } from '@/lib/utils';
import { sendKakaoMessage } from '@/lib/kakao';
import { getResultByRoomId } from '@/lib/api/results';
import { getRoomCandidates } from '@/lib/api/rooms';
import type { Result, RoomCandidate } from '@/lib/types';

export default function GroupResultPage() {
  const router = useRouter();
  const { toast, showToast } = useToast();
  const [result, setResult] = useState<Result | null>(null);
  const [candidates, setCandidates] = useState<RoomCandidate[]>([]);
  const [animateBars, setAnimateBars] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];

    async function init() {
      const roomId = session.get<string>('roomId');
      if (!roomId) { router.replace('/'); return; }

      const [res, cands] = await Promise.all([
        getResultByRoomId(roomId),
        getRoomCandidates(roomId),
      ]);

      if (cancelled) return;

      if (!res) {
        // 아직 결과가 없으면 잠시 후 재시도
        const t = setTimeout(init, 1500);
        timers.push(t);
        return;
      }
      setResult(res);
      setCandidates(cands);
      const t = setTimeout(() => { if (!cancelled) setAnimateBars(true); }, 200);
      timers.push(t);
    }
    init();
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [router]);

  async function handleShare() {
    if (!result) return;
    await copyToClipboard(`${getAppBaseUrl()}/result/${result.id}`);
  }

  async function handleKakaoShare() {
    if (!result) return;
    const linkUrl = `${getAppBaseUrl()}/result/${result.id}`;
    await sendKakaoMessage({
      title: `우리의 선택: ${result.winner_emoji} ${result.winner_label}`,
      description: '몇명이니로 결정했어요! 같이 해볼까요?',
      linkUrl,
      buttonText: '결과 보기',
    });
  }

  function handleMapSearch(service: 'kakao' | 'naver') {
    if (!result) return;
    const ok = openMap(service, result.winner_label);
    if (!ok) showToast('팝업 차단을 해제해주세요');
  }

  if (!result) {
    return (
      <PageLayout>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <div style={{ fontSize: 32 }}>⏳</div>
          <p style={{ fontSize: 14, color: '#888' }}>결과 집계 중...</p>
        </div>
      </PageLayout>
    );
  }

  // 투표 방식일 때 득표 현황 계산
  const voteSummary = result.vote_summary ?? {};
  const totalVotes = Object.values(voteSummary).reduce((s, v) => s + v, 0);
  const rankedCandidates = [...candidates].sort((a, b) =>
    (voteSummary[b.id] ?? 0) - (voteSummary[a.id] ?? 0)
  );

  // 카테고리별 분류 ("카테고리:항목명" 패턴 파싱)
  function parseCategory(label: string): { category: string | null; name: string } {
    const idx = label.indexOf(':');
    if (idx === -1) return { category: null, name: label };
    return { category: label.slice(0, idx).trim(), name: label.slice(idx + 1).trim() };
  }
  const hasCategories = rankedCandidates.some((c) => c.label.includes(':'));
  const categoryGroups: Record<string, typeof rankedCandidates> = {};
  if (hasCategories) {
    for (const c of rankedCandidates) {
      const { category } = parseCategory(c.label);
      const key = category ?? '기타';
      if (!categoryGroups[key]) categoryGroups[key] = [];
      categoryGroups[key].push(c);
    }
  }

  return (
    <PageLayout>
      <ConfettiBurst />
      <div style={{ paddingTop: 16 }}>
        <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-text)' }}>
          🎉 {result.method === 'vote' ? '투표 결과' : '랜덤 결과'}
        </span>
      </div>

      <div
        onScroll={(e) => { if (e.currentTarget.scrollLeft !== 0) e.currentTarget.scrollLeft = 0; }}
        style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16, overflowY: 'auto', overflowX: 'hidden', maxWidth: 'calc(100vw - 40px)' }}
      >
        {/* 위너 카드 */}
        <div
          data-testid="result-card"
          style={{
            background: 'linear-gradient(135deg, var(--color-primary) 0%, #FF9A6C 100%)',
            borderRadius: 16,
            padding: '32px 24px',
            textAlign: 'center',
            color: '#fff',
            boxShadow: '0 8px 32px rgba(255,122,61,0.35)',
            animation: 'scaleIn 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards',
          }}
        >
          <span style={{ fontSize: 56, marginBottom: 12, display: 'block' }}>
            {result.winner_emoji}
          </span>
          <div style={{ fontSize: 14, opacity: 0.85, marginBottom: 6 }}>
            {result.method === 'vote' ? '최다 득표' : result.method === 'spin' ? '돌림판 결과' : '야바위 결과'}
          </div>
          <div data-testid="winner-label" style={{ fontSize: 28, fontWeight: 800 }}>{result.winner_label}</div>
          {result.method === 'vote' && (
            <div style={{ fontSize: 15, opacity: 0.9, marginTop: 8 }}>
              {voteSummary[candidates.find(c => c.label === result.winner_label)?.id ?? ''] ?? 0}표 / 전체 {totalVotes}표
            </div>
          )}
          {result.is_tie && (
            <div data-testid="tie-message" style={{ fontSize: 13, opacity: 0.85, marginTop: 8 }}>
              🎲 동점! 행운의 추첨으로 결정됐어요
            </div>
          )}
        </div>

        {/* 투표 방식일 때 바 그래프 (카테고리 분류 또는 전체 목록) */}
        {result.method === 'vote' && rankedCandidates.length > 0 && (
          <div style={{ background: '#fff', borderRadius: 16, padding: '20px', boxShadow: 'var(--shadow)' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#888', marginBottom: 16 }}>📊 전체 득표 현황</div>
            {hasCategories ? (
              // 카테고리별 그룹핑 표시
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {Object.entries(categoryGroups).map(([category, items]) => (
                  <div key={category}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-primary)', marginBottom: 10, textTransform: 'uppercase' }}>
                      {category}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {items.map((c, i) => {
                        const votes = voteSummary[c.id] ?? 0;
                        const percent = totalVotes > 0 ? (votes / totalVotes) * 100 : 0;
                        const isWinner = c.label === result.winner_label;
                        const { name } = parseCategory(c.label);
                        return (
                          <div key={c.id}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)' }}>
                                {isWinner && '🥇 '}{c.emoji} {name}
                              </span>
                              <span style={{ fontSize: 13, color: '#888' }}>{votes}표</span>
                            </div>
                            <div style={{ height: 10, background: '#eee', borderRadius: 5, overflow: 'hidden' }}>
                              <div
                                style={{
                                  height: '100%',
                                  background: isWinner ? 'var(--color-primary)' : 'var(--color-accent)',
                                  borderRadius: 5,
                                  width: animateBars ? `${percent}%` : '0%',
                                  transition: `width 0.8s ease ${i * 0.1}s`,
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // 기존 단순 목록
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {rankedCandidates.map((c, i) => {
                  const votes = voteSummary[c.id] ?? 0;
                  const percent = totalVotes > 0 ? (votes / totalVotes) * 100 : 0;
                  const isWinner = c.label === result.winner_label;
                  return (
                    <div key={c.id}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)' }}>
                          {isWinner && '🥇 '}{c.emoji} {c.label}
                        </span>
                        <span style={{ fontSize: 13, color: '#888' }}>{votes}표</span>
                      </div>
                      <div style={{ height: 10, background: '#eee', borderRadius: 5, overflow: 'hidden' }}>
                        <div
                          style={{
                            height: '100%',
                            background: isWinner ? 'var(--color-primary)' : 'var(--color-accent)',
                            borderRadius: 5,
                            width: animateBars ? `${percent}%` : '0%',
                            transition: `width 0.8s ease ${i * 0.1}s`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 지도 버튼 */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            data-testid="btn-map-kakao"
            onClick={() => handleMapSearch('kakao')}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: 12,
              border: '1.5px solid var(--color-border)',
              background: '#fff',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              color: 'var(--color-text)',
            }}
          >
            카카오지도 🗺️
          </button>
          <button
            data-testid="btn-map-naver"
            onClick={() => handleMapSearch('naver')}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: 12,
              border: '1.5px solid var(--color-border)',
              background: '#fff',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              color: 'var(--color-text)',
            }}
          >
            네이버지도 🗺️
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingBottom: 8 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              data-testid="btn-share"
              onClick={handleShare}
              style={{
                flex: 1,
                padding: '15px',
                borderRadius: 14,
                border: 'none',
                background: 'var(--color-primary)',
                color: '#fff',
                fontWeight: 800,
                fontSize: 15,
                cursor: 'pointer',
                boxShadow: 'var(--shadow-lg)',
              }}
            >
              링크 복사 📤
            </button>
            <button
              data-testid="btn-kakao-share"
              onClick={handleKakaoShare}
              style={{
                flex: 1,
                padding: '15px',
                borderRadius: 14,
                border: 'none',
                background: '#FEE500',
                color: '#191919',
                fontWeight: 800,
                fontSize: 15,
                cursor: 'pointer',
                boxShadow: 'var(--shadow-lg)',
              }}
            >
              카카오 공유 💬
            </button>
          </div>
          <button
            data-testid="btn-home"
            onClick={() => router.push('/')}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: 14,
              border: 'none',
              background: 'transparent',
              color: '#888',
              fontWeight: 600,
              fontSize: 15,
              cursor: 'pointer',
            }}
          >
            처음으로 돌아가기 🏠
          </button>
        </div>
      </div>

      <Toast message={toast.message} visible={toast.visible} />
    </PageLayout>
  );
}
