'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import PageLayout from '@/components/PageLayout';
import { session } from '@/lib/session';
import { DUMMY_PARTICIPANTS } from '@/lib/data';

export default function GroupWaitPage() {
  const router = useRouter();
  const [timeLeft, setTimeLeft] = useState(300); // 5분
  const [participants, setParticipants] = useState(DUMMY_PARTICIPANTS.slice(0, 3));
  const [totalPeople, setTotalPeople] = useState(5);

  useEffect(() => {
    const people = session.get<number>('roomPeople') ?? 5;
    setTotalPeople(people);

    // 타이머
    const timerInterval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerInterval);
          router.push('/group/result');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // 30초마다 참여자 추가 (더미)
    let addCount = 0;
    const participantInterval = setInterval(() => {
      if (addCount >= DUMMY_PARTICIPANTS.length - 3) {
        clearInterval(participantInterval);
        return;
      }
      addCount++;
      setParticipants(prev => {
        if (prev.length < DUMMY_PARTICIPANTS.length) {
          const next = DUMMY_PARTICIPANTS[prev.length];
          return [...prev, { ...next, voted: true }];
        }
        return prev;
      });
    }, 5000);

    return () => {
      clearInterval(timerInterval);
      clearInterval(participantInterval);
    };
  }, [router]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const votedCount = participants.filter(p => p.voted).length;
  const progressPercent = totalPeople > 0 ? (votedCount / totalPeople) * 100 : 0;

  const handleForceClose = () => {
    router.push('/group/result');
  };

  return (
    <PageLayout>
      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '16px 0', gap: 12, minHeight: 56 }}>
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-text)' }}>투표 진행 중</span>
        </div>
      </div>

      {/* 콘텐츠 */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* 타이머 */}
        <div
          style={{
            background: 'var(--color-bg-card)',
            borderRadius: 16,
            padding: '24px 20px',
            textAlign: 'center',
            boxShadow: 'var(--shadow-DEFAULT)',
          }}
        >
          <div
            style={{
              fontSize: 48,
              fontWeight: 800,
              color: timeLeft < 60 ? '#E55A1A' : 'var(--color-primary)',
              fontVariantNumeric: 'tabular-nums',
              letterSpacing: -1,
            }}
          >
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </div>
          <div style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginTop: 4 }}>
            마감까지 남은 시간
          </div>
        </div>

        {/* 진행률 */}
        <div
          style={{
            background: 'var(--color-bg-card)',
            borderRadius: 16,
            padding: '16px 20px',
            boxShadow: 'var(--shadow-DEFAULT)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)' }}>투표 현황</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-primary)' }}>
              {votedCount}/{totalPeople}명 완료
            </span>
          </div>
          <div style={{ height: 8, background: 'var(--color-border)', borderRadius: 9999, overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                background: 'var(--color-primary)',
                borderRadius: 9999,
                width: `${progressPercent}%`,
                transition: 'width 0.5s ease',
              }}
            />
          </div>
        </div>

        {/* 참여자 목록 */}
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: 12 }}>
            👥 참여자
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {participants.map((p, i) => (
              <div
                key={i}
                style={{
                  background: 'var(--color-bg-card)',
                  borderRadius: 10,
                  padding: '14px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  boxShadow: 'var(--shadow-DEFAULT)',
                  animation: 'fadeIn 0.4s ease forwards',
                }}
              >
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: '50%',
                    background: 'var(--color-accent)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 18,
                    flexShrink: 0,
                  }}
                >
                  {p.emoji}
                </div>
                <span style={{ fontSize: 15, fontWeight: 600, flex: 1, color: 'var(--color-text)' }}>
                  {p.name}
                </span>
                <span
                  style={{
                    fontSize: 13,
                    padding: '4px 10px',
                    borderRadius: 9999,
                    fontWeight: 600,
                    background: p.voted ? 'rgba(76,175,80,0.12)' : 'var(--color-accent)',
                    color: p.voted ? 'var(--color-success)' : 'var(--color-primary-dark)',
                  }}
                >
                  {p.voted ? '투표 완료' : '대기 중'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 강제 마감 버튼 */}
      <div style={{ paddingTop: 24 }}>
        <button
          onClick={handleForceClose}
          style={{
            width: '100%',
            padding: '16px 24px',
            borderRadius: 9999,
            background: 'var(--color-bg-card)',
            color: 'var(--color-primary)',
            fontSize: 16,
            fontWeight: 700,
            border: '2px solid var(--color-primary)',
          }}
        >
          지금 결과 보기 (강제 마감)
        </button>
      </div>
    </PageLayout>
  );
}
