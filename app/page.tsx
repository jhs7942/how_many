'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { session } from '@/lib/session';

export default function HomePage() {
  const [splashVisible, setSplashVisible] = useState(false);
  const [splashHide, setSplashHide] = useState(false);
  const [homeVisible, setHomeVisible] = useState(false);

  useEffect(() => {
    const seen = session.get<boolean>('splashSeen');
    if (seen) {
      setHomeVisible(true);
      return;
    }
    setSplashVisible(true);
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
            minHeight: '100svh',
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

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* 혼자 결정 */}
              <Link
                href="/solo/setting"
                style={{
                  background: '#fff',
                  borderRadius: 18,
                  padding: '20px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  boxShadow: 'var(--shadow)',
                  border: '2px solid var(--color-border)',
                  textDecoration: 'none',
                }}
              >
                <span style={{ fontSize: 40 }}>🙋</span>
                <div>
                  <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--color-text)', marginBottom: 2 }}>
                    혼자 결정
                  </div>
                  <div style={{ fontSize: 13, color: '#888' }}>내가 대표로 빠르게 정할게</div>
                </div>
              </Link>

              {/* 같이 결정 */}
              <Link
                href="/group/setting"
                style={{
                  background: '#fff',
                  borderRadius: 18,
                  padding: '20px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  boxShadow: 'var(--shadow)',
                  border: '2px solid var(--color-border)',
                  textDecoration: 'none',
                }}
              >
                <span style={{ fontSize: 40 }}>👥</span>
                <div>
                  <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--color-text)', marginBottom: 2 }}>
                    같이 결정
                  </div>
                  <div style={{ fontSize: 13, color: '#888' }}>모두가 참여하는 공정한 결정</div>
                </div>
              </Link>

              {/* 참여하기 */}
              <Link
                href="/group/join"
                style={{
                  background: 'var(--color-accent)',
                  borderRadius: 18,
                  padding: '20px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  boxShadow: 'var(--shadow)',
                  border: '2px solid var(--color-border)',
                  textDecoration: 'none',
                }}
              >
                <span style={{ fontSize: 40 }}>🔑</span>
                <div>
                  <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--color-text)', marginBottom: 2 }}>
                    참여하기
                  </div>
                  <div style={{ fontSize: 13, color: '#888' }}>친구 방에 코드로 입장</div>
                </div>
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
