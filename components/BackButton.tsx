'use client';

import { useRouter } from 'next/navigation';

interface BackButtonProps {
  href?: string;
}

export default function BackButton({ href }: BackButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    if (href) {
      router.push(href);
    } else {
      router.back();
    }
  };

  return (
    <button
      data-testid="btn-back"
      onClick={handleClick}
      style={{
        width: 40,
        height: 40,
        borderRadius: 10,
        background: 'var(--color-bg-card)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: 'var(--shadow-DEFAULT)',
        flexShrink: 0,
        transition: 'transform 0.25s cubic-bezier(0.4,0,0.2,1)',
      }}
    >
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="var(--color-text)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12.5 15L7.5 10L12.5 5" />
      </svg>
    </button>
  );
}
