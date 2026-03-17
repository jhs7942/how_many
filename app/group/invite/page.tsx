'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import BackButton from '@/components/BackButton';
import PageLayout from '@/components/PageLayout';
import Toast, { useToast } from '@/components/Toast';
import { session } from '@/lib/session';
import { copyToClipboard } from '@/lib/utils';

export default function GroupInvitePage() {
  const router = useRouter();
  const { toast, showToast } = useToast();
  const [roomCode, setRoomCode] = useState('');
  const [candidates, setCandidates] = useState<{ label: string; emoji: string }[]>([]);

  useEffect(() => {
    const code = session.get<string>('roomCode');
    const cands = session.get<{ label: string; emoji: string }[]>('candidates');
    if (!code) {
      router.replace('/group/create');
      return;
    }
    setRoomCode(code);
    setCandidates(cands ?? []);
  }, [router]);

  const handleCopyCode = async () => {
    await copyToClipboard(roomCode);
    showToast('방 코드가 복사되었어요! 📋');
  };

  const handleCopyLink = async () => {
    const link = `${window.location.origin}/group/nickname?code=${roomCode}`;
    await copyToClipboard(link);
    showToast('초대 링크가 복사되었어요! 🔗');
  };

  const handleCopyAll = async () => {
    const candidateText = candidates.map(c => `${c.emoji} ${c.label}`).join(', ');
    const link = `${window.location.origin}/group/nickname?code=${roomCode}`;
    const text = `[몇명이니] 투표에 참여해주세요!\n방 코드: ${roomCode}\n후보: ${candidateText}\n링크: ${link}`;
    await copyToClipboard(text);
    showToast('초대 메시지가 복사되었어요! 📤');
  };

  if (!roomCode) return null;

  return (
    <PageLayout>
      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '16px 0', gap: 12, minHeight: 56 }}>
        <BackButton href="/group/create" />
        <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-text)' }}>친구 초대</span>
      </div>

      {/* 스텝 표시 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 24 }}>
        {[1, 2, 3, 4].map(step => (
          <div
            key={step}
            style={{
              width: step === 2 ? 20 : 8,
              height: 8,
              borderRadius: step === 2 ? 4 : '50%',
              background: step <= 2 ? 'var(--color-primary)' : 'var(--color-border)',
            }}
          />
        ))}
      </div>

      {/* 콘텐츠 */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--color-text)', marginBottom: 6 }}>
            친구들을 초대해요!
          </h2>
          <p style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>
            방 코드 또는 링크를 공유해주세요
          </p>
        </div>

        {/* 방 코드 */}
        <div
          style={{
            background: 'var(--color-bg-card)',
            border: '2px dashed var(--color-primary)',
            borderRadius: 16,
            padding: 20,
            textAlign: 'center',
            cursor: 'pointer',
          }}
          onClick={handleCopyCode}
        >
          <div style={{ fontSize: 36, fontWeight: 800, color: 'var(--color-primary)', letterSpacing: 8 }}>
            {roomCode}
          </div>
          <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 6 }}>
            탭하여 방 코드 복사
          </div>
        </div>

        {/* 후보 미리보기 */}
        {candidates.length > 0 && (
          <div
            style={{
              background: 'var(--color-bg-card)',
              borderRadius: 16,
              padding: 16,
              boxShadow: 'var(--shadow-DEFAULT)',
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: 10 }}>
              🗳️ 투표 후보
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {candidates.map((c, i) => (
                <div
                  key={i}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 12px',
                    borderRadius: 9999,
                    fontSize: 13,
                    fontWeight: 600,
                    background: 'var(--color-accent)',
                    color: 'var(--color-primary-dark)',
                    border: '1.5px solid var(--color-primary)',
                  }}
                >
                  {c.emoji} {c.label}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 공유 버튼들 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            onClick={handleCopyLink}
            style={{
              width: '100%',
              padding: '14px 24px',
              borderRadius: 9999,
              background: 'var(--color-bg-card)',
              color: 'var(--color-primary)',
              fontSize: 15,
              fontWeight: 700,
              border: '2px solid var(--color-primary)',
            }}
          >
            🔗 초대 링크 복사
          </button>
          <button
            onClick={handleCopyAll}
            style={{
              width: '100%',
              padding: '14px 24px',
              borderRadius: 9999,
              background: 'var(--color-bg-card)',
              color: 'var(--color-text)',
              fontSize: 15,
              fontWeight: 700,
              border: '1.5px solid var(--color-border)',
            }}
          >
            📤 초대 메시지 복사
          </button>
        </div>
      </div>

      {/* 다음 버튼 */}
      <div style={{ paddingTop: 24 }}>
        <button
          onClick={() => router.push('/group/nickname')}
          style={{
            width: '100%',
            padding: '18px 28px',
            borderRadius: 9999,
            background: 'var(--color-primary)',
            color: '#fff',
            fontSize: 18,
            fontWeight: 700,
            boxShadow: '0 4px 16px rgba(255,122,61,0.35)',
          }}
        >
          나도 투표하러 가기 →
        </button>
      </div>

      <Toast message={toast.message} visible={toast.visible} />
    </PageLayout>
  );
}
