'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { session } from '@/lib/session';

export default function HomePage() {
  const [splashVisible, setSplashVisible] = useState(true);
  const [splashHide, setSplashHide] = useState(false);
  const [homeVisible, setHomeVisible] = useState(false);

  useEffect(() => {
    const seen = session.get<boolean>('splashSeen');
    if (seen) {
      setSplashVisible(false);
      setHomeVisible(true);
      return;
    }
    const timer = setTimeout(() => {
      setSplashHide(true);
      setTimeout(() => {
        setSplashVisible(false);
        setHomeVisible(true);
        session.set('splashSeen', true);
      }, 600);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {/* 스플래시 화면 */}
      {splashVisible && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'var(--color-primary)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
            maxWidth: 430,
            margin: '0 auto',
            opacity: splashHide ? 0 : 1,
            transform: splashHide ? 'scale(1.05)' : 'scale(1)',
            transition: 'opacity 0.6s ease, transform 0.6s ease',
            pointerEvents: splashHide ? 'none' : 'auto',
          }}
        >
          <div style={{ fontSize: 64, marginBottom: 16, animation: 'bounce 1.2s ease infinite' }}>🎲</div>
          <div style={{ fontSize: 30, fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>몇명이니</div>
          <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.78)', marginTop: 8, fontWeight: 500 }}>
            모임 결정, 10초면 충분해
          </div>
        </div>
      )}

      {/* 홈 화면 */}
      {homeVisible && (
        <div
          style={{
            minHeight: '100dvh',
            display: 'flex',
            flexDirection: 'column',
            padding: '0 20px 40px',
            animation: 'fadeIn 0.5s ease forwards',
          }}
        >
          {/* 헤더 */}
          <div style={{ padding: '28px 0 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 28 }}>🎲</span>
              <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--color-primary)' }}>몇명이니</span>
            </div>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '4px 10px',
                borderRadius: 9999,
                fontSize: 12,
                fontWeight: 700,
                background: 'var(--color-accent)',
                color: 'var(--color-primary-dark)',
              }}
            >
              Beta
            </span>
          </div>

          {/* 히어로 */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '24px 0' }}>
            <h1 style={{ fontSize: 28, fontWeight: 800, lineHeight: 1.3, color: 'var(--color-text)', marginBottom: 10 }}>
              오늘 뭐 할지<br />
              <span style={{ color: 'var(--color-primary)' }}>10초</span>에 결정해요
            </h1>
            <p style={{ fontSize: 15, color: 'var(--color-text-secondary)', lineHeight: 1.6, marginBottom: 36 }}>
              단톡방 30분 토론은 이제 그만!<br />
              혼자도, 같이도 빠르게 결정해요.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Link
                href="/solo/people"
                style={{
                  background: 'var(--color-bg-card)',
                  borderRadius: 16,
                  padding: '24px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 12,
                  boxShadow: 'var(--shadow-DEFAULT)',
                  border: '2px solid transparent',
                  cursor: 'pointer',
                  textDecoration: 'none',
                  transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget;
                  el.style.borderColor = 'var(--color-primary)';
                  el.style.background = 'var(--color-accent)';
                  el.style.transform = 'translateY(-3px)';
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget;
                  el.style.borderColor = 'transparent';
                  el.style.background = 'var(--color-bg-card)';
                  el.style.transform = 'translateY(0)';
                }}
              >
                <span style={{ fontSize: 40 }}>🙋</span>
                <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-text)' }}>혼자 결정</span>
                <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', textAlign: 'center', lineHeight: 1.4 }}>
                  내가 대표로<br />빠르게 정할게
                </span>
              </Link>

              <Link
                href="/group/create"
                style={{
                  background: 'var(--color-bg-card)',
                  borderRadius: 16,
                  padding: '24px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 12,
                  boxShadow: 'var(--shadow-DEFAULT)',
                  border: '2px solid transparent',
                  cursor: 'pointer',
                  textDecoration: 'none',
                  transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget;
                  el.style.borderColor = 'var(--color-primary)';
                  el.style.background = 'var(--color-accent)';
                  el.style.transform = 'translateY(-3px)';
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget;
                  el.style.borderColor = 'transparent';
                  el.style.background = 'var(--color-bg-card)';
                  el.style.transform = 'translateY(0)';
                }}
              >
                <span style={{ fontSize: 40 }}>👥</span>
                <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-text)' }}>같이 결정</span>
                <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', textAlign: 'center', lineHeight: 1.4 }}>
                  모두가 참여하는<br />공정한 투표
                </span>
              </Link>
            </div>
          </div>

          {/* 푸터 */}
          <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--color-text-secondary)', paddingTop: 16 }}>
            모임 결정 피로, 이제 몇명이니가 해결할게요 🧡
          </div>
        </div>
      )}
    </>
  );
}
