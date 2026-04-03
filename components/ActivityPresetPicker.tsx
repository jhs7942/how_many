'use client';

import type { ActivityItem } from '@/lib/data';

interface ActivityPresetPickerProps {
  activities: ActivityItem[];
  selected: ActivityItem[];
  maxCount: number;
  onToggle: (activity: ActivityItem) => void;
  title?: string;
}

export default function ActivityPresetPicker({
  activities,
  selected,
  maxCount,
  onToggle,
  title,
}: ActivityPresetPickerProps) {
  const selectedLabels = new Set(selected.map((s) => s.label));
  const canAdd = selected.length < maxCount;

  return (
    <div>
      <p style={{ fontSize: 14, fontWeight: 700, color: '#888', marginBottom: 10 }}>
        {title ?? '추천 활동 빠른 선택'}
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {activities.map((a) => {
          const isSelected = selectedLabels.has(a.label);
          const disabled = !isSelected && !canAdd;
          return (
            <button
              key={a.label}
              onClick={() => !disabled && onToggle(a)}
              style={{
                padding: '8px 14px',
                borderRadius: 20,
                border: `2px solid ${isSelected ? 'var(--color-primary)' : 'var(--color-border)'}`,
                background: isSelected ? 'var(--color-accent)' : '#fff',
                color: 'var(--color-text)',
                fontWeight: isSelected ? 700 : 500,
                fontSize: 14,
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.4 : 1,
                transition: 'all 0.15s',
              }}
            >
              {a.emoji} {a.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
