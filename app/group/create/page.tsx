'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import BackButton from '@/components/BackButton';
import PageLayout from '@/components/PageLayout';
import CandidateEditor, { type Candidate } from '@/components/CandidateEditor';
import ActivityPresetPicker from '@/components/ActivityPresetPicker';
import { session } from '@/lib/session';
import { createRoom } from '@/lib/api/rooms';
import { ACTIVITY_DATA, ALL_ACTIVITIES, type ActivityItem } from '@/lib/data';

const PEOPLE_OPTIONS = [
  { count: 2, emoji: '👫' },
  { count: 3, emoji: '👥' },
  { count: 4, emoji: '👨‍👩‍👧‍👦' },
  { count: 5, emoji: '🫂' },
  { count: 6, emoji: '🎉' },
];

const TIME_LIMIT_OPTIONS = [
  { seconds: 60, label: '1분' },
  { seconds: 180, label: '3분' },
  { seconds: 300, label: '5분' },
  { seconds: 600, label: '10분' },
];

const DEFAULT_CANDIDATES: Candidate[] = [
  { label: '보드게임', emoji: '🎲' },
  { label: '노래방', emoji: '🎤' },
  { label: '방탈출', emoji: '🔐' },
  { label: '볼링', emoji: '🎳' },
];

export default function GroupCreatePage() {
  const router = useRouter();
  const [mode, setMode] = useState<'vote' | 'random'>('vote');
  const [preset, setPreset] = useState<'default' | 'custom'>('custom');
  const [selectedPeople, setSelectedPeople] = useState<number | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>(DEFAULT_CANDIDATES);
  const [location, setLocation] = useState('');
  const [timeLimit, setTimeLimit] = useState(300);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const m = session.get<'vote' | 'random'>('roomMode');
    if (m) setMode(m);
  }, []);

  // 기본값 모드: 인원 선택 시 후보 자동 설정
  useEffect(() => {
    if (preset === 'default' && selectedPeople) {
      const activities = ACTIVITY_DATA[selectedPeople] ?? DEFAULT_CANDIDATES;
      setCandidates(activities);
    }
  }, [preset, selectedPeople]);

  const MAX_COUNT = 8;

  // 인원기반: 해당 인원 활동 / 직접입력: 전체 활동
  const presetActivities =
    preset === 'default' && selectedPeople
      ? ACTIVITY_DATA[selectedPeople] ?? ALL_ACTIVITIES
      : ALL_ACTIVITIES;

  function toggleActivity(activity: ActivityItem) {
    const exists = candidates.some((c) => c.label === activity.label);
    if (exists) {
      setCandidates(candidates.filter((c) => c.label !== activity.label));
    } else if (candidates.length < MAX_COUNT) {
      setCandidates([...candidates, activity]);
    }
  }

  async function handleCreate() {
    if (preset === 'default' && !selectedPeople) {
      setError('인원을 선택해주세요');
      return;
    }
    if (candidates.length < 2) {
      setError('후보를 2개 이상 추가해주세요');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const { room } = await createRoom({
        mode,
        preset,
        peopleCount: selectedPeople ?? undefined,
        location: location.trim() || undefined,
        candidates,
        timeLimit: mode === 'vote' ? timeLimit : undefined,
      });
      session.set('roomId', room.id);
      session.set('roomCode', room.code);
      router.push('/group/lobby');
    } catch {
      setError('방 생성에 실패했습니다. 다시 시도해주세요');
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageLayout>
      <div style={{ display: 'flex', alignItems: 'center', padding: '16px 0', gap: 12 }}>
        <BackButton href="/group/setting" />
        <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-text)' }}>
          방 만들기 ({mode === 'vote' ? '투표' : '랜덤'})
        </span>
      </div>

      <div
        onScroll={(e) => { if (e.currentTarget.scrollLeft !== 0) e.currentTarget.scrollLeft = 0; }}
        style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: 24, overflowY: 'auto', overflowX: 'hidden', maxWidth: 'calc(100vw - 40px)' }}
      >
        {/* 후보 설정 방식 */}
        <div>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#888', marginBottom: 10 }}>후보 설정 방식</p>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['default', 'custom'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPreset(p)}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: 12,
                  border: `2px solid ${preset === p ? 'var(--color-primary)' : 'var(--color-border)'}`,
                  background: preset === p ? 'var(--color-accent)' : '#fff',
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: 'pointer',
                  color: 'var(--color-text)',
                }}
              >
                {p === 'default' ? '👥 인원 기반' : '✏️ 직접 입력'}
              </button>
            ))}
          </div>
        </div>

        {/* 인원 선택 (기본값 모드) */}
        {preset === 'default' && (
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#888', marginBottom: 10 }}>참여 인원</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
              {PEOPLE_OPTIONS.map(({ count, emoji }) => (
                <button
                  key={count}
                  onClick={() => setSelectedPeople(count)}
                  style={{
                    padding: '10px 6px',
                    borderRadius: 10,
                    background: selectedPeople === count ? 'var(--color-accent)' : '#fff',
                    border: `2px solid ${selectedPeople === count ? 'var(--color-primary)' : 'var(--color-border)'}`,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 4,
                    cursor: 'pointer',
                  }}
                >
                  <span style={{ fontSize: 18 }}>{emoji}</span>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>{count}명</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 추천 활동 빠른 선택 */}
        <ActivityPresetPicker
          activities={presetActivities}
          selected={candidates}
          maxCount={MAX_COUNT}
          onToggle={toggleActivity}
        />

        {/* 후보 편집 */}
        <div>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#888', marginBottom: 10 }}>
            후보 목록
          </p>
          <CandidateEditor candidates={candidates} onChange={setCandidates} maxCount={MAX_COUNT} />
        </div>

        {/* 투표 제한 시간 (vote 모드만) */}
        {mode === 'vote' && (
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#888', marginBottom: 10 }}>
              투표 제한 시간
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              {TIME_LIMIT_OPTIONS.map(({ seconds, label }) => (
                <button
                  key={seconds}
                  onClick={() => setTimeLimit(seconds)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: 10,
                    background: timeLimit === seconds ? 'var(--color-accent)' : '#fff',
                    border: `2px solid ${timeLimit === seconds ? 'var(--color-primary)' : 'var(--color-border)'}`,
                    fontWeight: 700,
                    fontSize: 14,
                    cursor: 'pointer',
                    color: 'var(--color-text)',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 위치 (선택) */}
        <div>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#888', marginBottom: 10 }}>위치 (선택)</p>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="예: 강남역, 홍대..."
            style={{
              width: '100%',
              padding: '12px 14px',
              borderRadius: 12,
              border: '1.5px solid var(--color-border)',
              fontSize: 14,
              color: 'var(--color-text)',
              background: '#fff',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>
      </div>

      {error && (
        <p style={{ fontSize: 13, color: '#ff4444', textAlign: 'center', marginTop: 8 }}>{error}</p>
      )}

      <button
        onClick={handleCreate}
        disabled={loading}
        style={{
          width: '100%',
          padding: '16px',
          borderRadius: 14,
          border: 'none',
          background: loading ? '#ddd' : 'var(--color-primary)',
          color: loading ? '#aaa' : '#fff',
          fontWeight: 800,
          fontSize: 17,
          cursor: loading ? 'not-allowed' : 'pointer',
          marginTop: 16,
          boxShadow: loading ? 'none' : 'var(--shadow-lg)',
        }}
      >
        {loading ? '방 생성 중...' : '방 만들기 🎉'}
      </button>
    </PageLayout>
  );
}
