'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import PageLayout from '@/components/PageLayout';
import Toast, { useToast } from '@/components/Toast';
import { session } from '@/lib/session';
import { DUMMY_VOTE_RESULTS } from '@/lib/data';
import { copyToClipboard } from '@/lib/utils';

interface VoteResult {
  label: string;
  emoji: string;
  votes: number;
}

export default function GroupResultPage() {
  const router = useRouter();
  const { toast, showToast } = useToast();
  const [results, setResults] = useState<VoteResult[]>([]);
  const [winner, setWinner] = useState<VoteResult | null>(null);
  const [isTie, setIsTie] = useState(false);
  const [animateBars, setAnimateBars] = useState(false);
  const barRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    // 더미 결과 사용 (실제에선 서버에서 집계)
    const sortedResults = [...DUMMY_VOTE_RESULTS].sort((a, b) => b.votes - a.votes);
    setResults(sortedResults);

    const maxVotes = sortedResults[0]?.votes ?? 0;
    const winners = sortedResults.filter(r => r.votes === maxVotes);
    setIsTie(winners.length > 1);

    // 동점 처리: 랜덤 선택
    const finalWinner = winners[Math.floor(Math.random() * winners.length)];
    setWinner(finalWinner);

    setTimeout(() => setAnimateBars(true), 200);
  }, []);

  const totalVotes = results.reduce((sum, r) => sum + r.votes, 0);

  const handleShare = async () => {
    if (!winner) return;
    await copyToClipboard(
      `[몇명이니] 투표 결과: "${winner.label}" ${winner.emoji}이(가) 선택됐어요!`
    );
    showToast('결과가 복사되었어요! 📤');
  };

  if (!winner) return null;

  return (
    <PageLayout>
      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '16px 0', gap: 12, minHeight: 56 }}>
        <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-text)' }}>🎉 투표 결과</span>
      </div>

      {/* 콘텐츠 */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* 위너 카드 */}
        <div
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
          <span style={{ fontSize: 56, marginBottom: 12, display: 'block' }}>{winner.emoji}</span>
          <div style={{ fontSize: 14, opacity: 0.85, marginBottom: 6 }}>최다 득표</div>
          <div style={{ fontSize: 28, fontWeight: 800 }}>{winner.label}</div>
          <div style={{ fontSize: 15, opacity: 0.9, marginTop: 8 }}>
            {winner.votes}표 / 전체 {totalVotes}표
          </div>
          {isTie && (
            <div style={{ fontSize: 13, opacity: 0.85, marginTop: 8 }}>
              🎲 동점! 행운의 추첨으로 결정됐어요
            </div>
          )}
        </div>

        {/* 득표 바 그래프 */}
        <div
          style={{
            background: 'var(--color-bg-card)',
            borderRadius: 16,
            padding: '20px',
            boxShadow: 'var(--shadow-DEFAULT)',
          }}
        >
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: 16 }}>
            📊 전체 득표 현황
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {results.map((result, i) => {
              const percent = totalVotes > 0 ? (result.votes / totalVotes) * 100 : 0;
              const isWinner = result.label === winner.label;
              return (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-text)' }}>
                      {isWinner && '🥇 '}{result.emoji} {result.label}
                    </span>
                    <span style={{ fontSize: 13, color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                      {result.votes}표
                    </span>
                  </div>
                  <div style={{ height: 12, background: 'var(--color-border)', borderRadius: 9999, overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        borderRadius: 9999,
                        background: isWinner
                          ? 'linear-gradient(90deg, var(--color-primary) 0%, #FFB347 100%)'
                          : 'var(--color-primary)',
                        width: animateBars ? `${percent}%` : '0%',
                        transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
                        transitionDelay: `${i * 0.1}s`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 버튼 영역 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 'auto', paddingTop: 8 }}>
          <button
            onClick={handleShare}
            style={{
              width: '100%',
              padding: '16px 24px',
              borderRadius: 9999,
              background: 'var(--color-primary)',
              color: '#fff',
              fontSize: 16,
              fontWeight: 700,
              boxShadow: '0 4px 16px rgba(255,122,61,0.35)',
            }}
          >
            결과 공유하기 📤
          </button>
          <button
            onClick={() => router.push('/')}
            style={{
              width: '100%',
              padding: '14px 24px',
              borderRadius: 9999,
              background: 'transparent',
              color: 'var(--color-text-secondary)',
              fontSize: 15,
              fontWeight: 600,
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
