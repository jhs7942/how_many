import { ReactNode } from 'react';

interface PageLayoutProps {
  children: ReactNode;
  className?: string;
}

export default function PageLayout({ children, className = '' }: PageLayoutProps) {
  return (
    <div
      style={{
        minHeight: '100svh',
        display: 'flex',
        flexDirection: 'column',
        padding: '0 20px calc(32px + env(safe-area-inset-bottom, 0px))',
      }}
      className={className}
    >
      {children}
    </div>
  );
}
