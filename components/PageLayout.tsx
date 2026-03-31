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
        paddingTop: 0,
        paddingRight: '20px',
        paddingBottom: 'calc(32px + env(safe-area-inset-bottom, 0px))',
        paddingLeft: '20px',
      }}
      className={className}
    >
      {children}
    </div>
  );
}
