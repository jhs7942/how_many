'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PageLayout from '@/components/PageLayout';
import BackButton from '@/components/BackButton';
import CandidateEditor, { type Candidate } from '@/components/CandidateEditor';
import ActivityPresetPicker from '@/components/ActivityPresetPicker';
import { session } from '@/lib/session';
import type { ActivityItem } from '@/lib/data';

const MAX_COUNT = 8;

interface FlowCustomPageProps {
  presets: ActivityItem[];
  presetTitle?: string;
  defaultCandidates?: Candidate[];
  backHref: string;
  nextHref: string;
  sessionKey: string; // 예: 'soloCandidates' | 'foodCandidates'
  emojiSet?: string[];
}

// 후보 편집 + 프리셋 선택 화면
// solo/custom, food/custom 양쪽에서 사용
export default function FlowCustomPage({
  presets,
  presetTitle,
  defaultCandidates,
  backHref,
  nextHref,
  sessionKey,
  emojiSet,
}: FlowCustomPageProps) {
  const router = useRouter();
  const [candidates, setCandidates] = useState<Candidate[]>(
    defaultCandidates ?? [
      { label: '카페', emoji: '☕' },
      { label: '영화', emoji: '🎬' },
    ]
  );

  function toggleActivity(activity: ActivityItem) {
    const exists = candidates.some((c) => c.label === activity.label);
    if (exists) {
      setCandidates(candidates.filter((c) => c.label !== activity.label));
    } else if (candidates.length < MAX_COUNT) {
      setCandidates([...candidates, activity]);
    }
  }

  function proceed() {
    if (candidates.length < 2) return;
    session.set(sessionKey, candidates);
    router.push(nextHref);
  }

  return (
    <PageLayout>
      <div style={{ paddingTop: 20 }}>
        <BackButton href={backHref} />
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: 'var(--color-text)', marginBottom: 8 }}>
            후보를 선택하세요
          </h1>
          <p style={{ fontSize: 15, color: '#888' }}>2개 이상 선택해야 돌릴 수 있어요</p>
        </div>

        <ActivityPresetPicker
          activities={presets}
          selected={candidates}
          maxCount={MAX_COUNT}
          onToggle={toggleActivity}
          title={presetTitle}
        />

        <CandidateEditor candidates={candidates} onChange={setCandidates} maxCount={MAX_COUNT} emojiSet={emojiSet} />
      </div>

      <button
        onClick={proceed}
        disabled={candidates.length < 2}
        style={{
          width: '100%',
          padding: '16px',
          borderRadius: 16,
          border: 'none',
          background: candidates.length >= 2 ? 'var(--color-primary)' : '#ddd',
          color: candidates.length >= 2 ? '#fff' : '#aaa',
          fontWeight: 800,
          fontSize: 17,
          cursor: candidates.length >= 2 ? 'pointer' : 'not-allowed',
          marginTop: 8,
        }}
      >
        다음
      </button>
    </PageLayout>
  );
}
