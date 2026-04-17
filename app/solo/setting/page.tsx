'use client';

import { useRouter } from 'next/navigation';
import { session } from '@/lib/session';
import FlowSettingPage from '@/components/flow/FlowSettingPage';

export default function SoloSettingPage() {
  const router = useRouter();

  return (
    <FlowSettingPage
      title="어떻게 정할까요?"
      description={'인원 수에 맞는 활동을 추천받거나\n직접 후보를 입력할 수 있어요.'}
      options={[
        { mode: 'default', emoji: '👥', title: '인원 수로 추천받기', desc: '몇 명인지 알려주면\n인원에 딱 맞는 활동을 추천해드려요' },
        { mode: 'custom', emoji: '✏️', title: '직접 입력하기', desc: '원하는 후보를 직접 입력하고\n랜덤으로 하나를 뽑아요' },
      ]}
      onSelect={(mode) => {
        session.set('soloMode', mode);
        router.push(mode === 'default' ? '/solo/people' : '/solo/custom');
      }}
    />
  );
}
