'use client';

import BackButton from '@/components/BackButton';

export default function PrivacyPage() {
  return (
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
      <div style={{ padding: '28px 0 8px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <BackButton href="/" />
        <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-text)' }}>개인정보처리방침</span>
      </div>

      {/* 본문 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingTop: 12 }}>
        {/* 시행일 */}
        <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
          시행일: 2026년 3월 26일
        </p>

        {/* 1. 개요 */}
        <Section title="1. 개요">
          <p>
            &ldquo;몇명이니&rdquo;(이하 &ldquo;앱&rdquo;)는 모임 의사결정을 돕는 서비스입니다.
            본 방침은 앱이 수집하는 정보, 사용 목적, 보호 방법을 안내합니다.
          </p>
        </Section>

        {/* 2. 수집하는 정보 */}
        <Section title="2. 수집하는 정보">
          <ul style={{ paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <li><strong>클라이언트 ID</strong> — 기기별 자동 생성되는 고유 식별자(UUID)로, 개인을 특정할 수 없습니다.</li>
            <li><strong>닉네임</strong> — 방 참여 시 사용자가 직접 입력하는 표시 이름입니다.</li>
            <li><strong>방 코드</strong> — 6자리 랜덤 코드로, 그룹 방을 식별합니다.</li>
            <li><strong>투표 데이터</strong> — 어떤 후보에 투표했는지에 대한 정보입니다.</li>
            <li><strong>결과 데이터</strong> — 투표 또는 랜덤 결과 정보입니다.</li>
            <li><strong>모임 장소</strong> — 사용자가 직접 입력하는 장소 텍스트이며, GPS 위치 정보는 수집하지 않습니다.</li>
          </ul>
        </Section>

        {/* 3. 수집 목적 */}
        <Section title="3. 수집 목적">
          <p>
            수집된 정보는 오직 모임 의사결정 서비스 제공(방 생성, 투표, 결과 도출)을 위해 사용됩니다.
            광고, 마케팅, 분석 등 다른 목적으로는 사용하지 않습니다.
          </p>
        </Section>

        {/* 4. 데이터 저장 및 보호 */}
        <Section title="4. 데이터 저장 및 보호">
          <p>
            데이터는 Supabase 클라우드 데이터베이스에 암호화되어 저장됩니다.
            서비스 이용 기간 동안 보유하며, 방 종료 후 일정 기간이 지나면 자동으로 삭제됩니다.
          </p>
        </Section>

        {/* 5. 제3자 제공 */}
        <Section title="5. 제3자 제공">
          <p>
            수집된 정보는 제3자에게 제공, 공유, 판매하지 않습니다.
            다만, 법령에 의해 요구되는 경우에는 관련 법률에 따라 제공될 수 있습니다.
          </p>
        </Section>

        {/* 6. 아동 개인정보 */}
        <Section title="6. 아동 개인정보">
          <p>
            앱은 만 14세 미만 아동의 개인정보를 의도적으로 수집하지 않습니다.
            만 14세 미만임이 확인되면 해당 정보를 즉시 삭제합니다.
          </p>
        </Section>

        {/* 7. 이용자의 권리 */}
        <Section title="7. 이용자의 권리">
          <p>
            이용자는 언제든지 자신의 데이터 삭제를 요청할 수 있습니다.
            아래 연락처로 요청하시면 지체 없이 처리하겠습니다.
          </p>
        </Section>

        {/* 8. 방침 변경 */}
        <Section title="8. 방침 변경">
          <p>
            본 방침이 변경되는 경우 앱 내 공지를 통해 안내합니다.
            변경된 방침은 공지한 날로부터 효력이 발생합니다.
          </p>
        </Section>

        {/* 9. 문의 */}
        <Section title="9. 문의">
          <p>
            개인정보 관련 문의사항이 있으시면 아래로 연락해 주세요.
          </p>
          <p style={{ marginTop: 8 }}>
            <strong>이메일:</strong> howmany.app.help@gmail.com
          </p>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 16,
        padding: '16px 20px',
        border: '1px solid var(--color-border)',
      }}
    >
      <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-primary)', marginBottom: 10 }}>
        {title}
      </h2>
      <div style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--color-text)' }}>
        {children}
      </div>
    </div>
  );
}
