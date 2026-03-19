'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PageLayout from '@/components/PageLayout';
import BackButton from '@/components/BackButton';
import { session } from '@/lib/session';
import { getRoomByCode } from '@/lib/api/rooms';

export default function GroupJoinPage() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleJoin() {
    const trimmed = code.trim().toUpperCase();
    if (trimmed.length !== 6) {
      setError('6자리 코드를 입력해주세요');
      return;
    }

    // 5회 실패 쿨다운 체크
    const failKey = 'joinFailCount';
    const cooldownKey = 'joinCooldownUntil';
    const cooldownUntil = session.get<number>(cooldownKey);
    if (cooldownUntil && Date.now() < cooldownUntil) {
      const remaining = Math.ceil((cooldownUntil - Date.now()) / 1000);
      setError(`잠시 후 다시 시도해주세요 (${remaining}초)`);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const room = await getRoomByCode(trimmed);

      if (!room) {
        const fails = (session.get<number>(failKey) ?? 0) + 1;
        session.set(failKey, fails);
        if (fails >= 5) {
          session.set(cooldownKey, Date.now() + 30000);
          session.set(failKey, 0);
          setError('5회 실패. 30초 후 다시 시도해주세요');
        } else {
          setError('방을 찾을 수 없습니다');
        }
        return;
      }

      // 만료 확인 (1시간)
      if (new Date(room.created_at).getTime() + 3600000 < Date.now()) {
        setError('만료된 방입니다');
        return;
      }

      if (room.status !== 'waiting') {
        setError('이미 시작된 방입니다');
        return;
      }

      session.set(failKey, 0);
      session.set('roomId', room.id);
      session.set('roomCode', room.code);
      session.set('isHost', false);
      router.push('/group/lobby');
    } catch {
      setError('오류가 발생했습니다. 다시 시도해주세요');
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageLayout>
      <div style={{ paddingTop: 20 }}>
        <BackButton href="/" />
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 28 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>🔑</div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: 'var(--color-text)', marginBottom: 8 }}>
            방 코드 입력
          </h1>
          <p style={{ fontSize: 15, color: '#888' }}>
            친구에게 받은 6자리 코드를 입력하세요
          </p>
        </div>

        <div>
          <input
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase().slice(0, 6));
              setError('');
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
            placeholder="XXXXXX"
            maxLength={6}
            style={{
              width: '100%',
              padding: '16px',
              borderRadius: 14,
              border: `1.5px solid ${error ? '#ff4444' : 'var(--color-border)'}`,
              fontSize: 24,
              fontWeight: 800,
              textAlign: 'center',
              letterSpacing: 6,
              color: 'var(--color-text)',
              background: '#fff',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          {error && (
            <p style={{ fontSize: 13, color: '#ff4444', marginTop: 8, textAlign: 'center' }}>{error}</p>
          )}
        </div>

        <button
          onClick={handleJoin}
          disabled={loading || code.trim().length !== 6}
          style={{
            width: '100%',
            padding: '16px',
            borderRadius: 14,
            border: 'none',
            background: code.trim().length === 6 && !loading ? 'var(--color-primary)' : '#ddd',
            color: code.trim().length === 6 && !loading ? '#fff' : '#aaa',
            fontWeight: 800,
            fontSize: 17,
            cursor: code.trim().length === 6 && !loading ? 'pointer' : 'not-allowed',
          }}
        >
          {loading ? '확인 중...' : '입장하기'}
        </button>
      </div>
    </PageLayout>
  );
}
