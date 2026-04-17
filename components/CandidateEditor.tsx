'use client';

import { useState, useRef } from 'react';

export interface Candidate {
  label: string;
  emoji: string;
}

interface CandidateEditorProps {
  candidates: Candidate[];
  onChange: (candidates: Candidate[]) => void;
  maxCount?: number;
  emojiSet?: string[];
}

const DEFAULT_EMOJIS = ['🍕', '🎬', '🎮', '🏃', '🎵', '☕', '🍻', '🎲', '🎤', '🏊'];

export default function CandidateEditor({
  candidates,
  onChange,
  maxCount = 8,
  emojiSet,
}: CandidateEditorProps) {
  const [input, setInput] = useState('');
  const [duplicateWarning, setDuplicateWarning] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function addCandidate() {
    const label = input.trim();
    if (!label || candidates.length >= maxCount) return;
    if (candidates.some((c) => c.label === label)) {
      setDuplicateWarning(true);
      setTimeout(() => setDuplicateWarning(false), 2000);
      return;
    }
    setDuplicateWarning(false);
    const emojis = emojiSet ?? DEFAULT_EMOJIS;
    const emoji = emojis[candidates.length % emojis.length];
    onChange([...candidates, { label, emoji }]);
    setInput('');
    inputRef.current?.focus();
  }

  function removeCandidate(index: number) {
    onChange(candidates.filter((_, i) => i !== index));
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* 후보 목록 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {candidates.map((c, i) => (
          <div
            key={`${c.label}-${i}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              background: 'var(--color-accent)',
              borderRadius: 12,
              padding: '10px 14px',
            }}
          >
            <span style={{ fontSize: 20 }}>{c.emoji}</span>
            <span style={{ flex: 1, fontWeight: 600, color: 'var(--color-text)', fontSize: 15 }}>
              {c.label}
            </span>
            <button
              onClick={() => removeCandidate(i)}
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                border: 'none',
                background: 'rgba(0,0,0,0.08)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 16,
              }}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {/* 입력 */}
      {candidates.length < maxCount && (
        <div style={{ display: 'flex', gap: 8, overflow: 'hidden' }}>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value.slice(0, 12))}
            onKeyDown={(e) => e.key === 'Enter' && addCandidate()}
            onFocus={() => {
              let el: HTMLElement | null = inputRef.current;
              while (el) { el.scrollLeft = 0; el = el.parentElement; }
            }}
            placeholder="후보 추가..."
            style={{
              flex: 1,
              minWidth: 0,
              padding: '10px 14px',
              borderRadius: 12,
              border: '1.5px solid var(--color-border)',
              fontSize: 16,
              background: '#fff',
              color: 'var(--color-text)',
              outline: 'none',
            }}
          />
          <button
            onClick={addCandidate}
            disabled={!input.trim()}
            style={{
              padding: '10px 12px',
              borderRadius: 12,
              border: 'none',
              background: input.trim() ? 'var(--color-primary)' : '#eee',
              color: input.trim() ? '#fff' : '#aaa',
              fontWeight: 700,
              fontSize: 15,
              minWidth: 52,
              flexShrink: 0,
              whiteSpace: 'nowrap',
              cursor: input.trim() ? 'pointer' : 'not-allowed',
            }}
          >
            추가
          </button>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {duplicateWarning ? (
          <p style={{ fontSize: 12, color: 'var(--color-primary)', fontWeight: 600 }}>이미 추가된 항목이에요!</p>
        ) : (
          <span />
        )}
        <p style={{ fontSize: 13, color: '#888' }}>{candidates.length}/{maxCount}</p>
      </div>
    </div>
  );
}
