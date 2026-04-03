'use client';

import PageLayout from '@/components/PageLayout';
import BackButton from '@/components/BackButton';

interface FlowOption {
  mode: string;
  emoji: string;
  title: string;
  desc: string;
}

interface FlowSettingPageProps {
  title: string;
  description: string;
  options: FlowOption[];
  onSelect: (mode: string) => void;
  backHref?: string;
}

// 모드 선택 화면 (추천 vs 직접입력 등)
// solo/setting, food/setting 양쪽에서 사용
export default function FlowSettingPage({
  title,
  description,
  options,
  onSelect,
  backHref = '/',
}: FlowSettingPageProps) {
  return (
    <PageLayout>
      <div style={{ paddingTop: 20 }}>
        <BackButton href={backHref} />
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 24 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 56, marginBottom: 12 }}>🎲</div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: 'var(--color-text)', marginBottom: 8 }}>
            {title}
          </h1>
          <p style={{ fontSize: 15, color: '#888', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
            {description}
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {options.map((opt) => (
            <button
              key={opt.mode}
              data-testid={`btn-mode-${opt.mode}`}
              onClick={() => onSelect(opt.mode)}
              style={{
                background: '#fff',
                border: '2px solid var(--color-border)',
                borderRadius: 18,
                padding: '22px 20px',
                textAlign: 'left',
                cursor: 'pointer',
                boxShadow: 'var(--shadow)',
                transition: 'border-color 0.15s',
              }}
            >
              <div style={{ fontSize: 28, marginBottom: 8 }}>{opt.emoji}</div>
              <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--color-text)', marginBottom: 4 }}>
                {opt.title}
              </div>
              <div style={{ fontSize: 13, color: '#888' }}>
                {opt.desc}
              </div>
            </button>
          ))}
        </div>
      </div>
    </PageLayout>
  );
}
