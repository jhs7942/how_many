'use client';

import { useRouter } from 'next/navigation';
import { ALL_FOODS } from '@/lib/data';
import { session } from '@/lib/session';
import FlowSettingPage from '@/components/flow/FlowSettingPage';

export default function FoodSettingPage() {
  const router = useRouter();

  return (
    <FlowSettingPage
      title="맛집 결정"
      description="어떻게 메뉴를 정할까요?"
      options={[
        { mode: 'default', emoji: '🍽️', title: '추천 메뉴로 뽑기', desc: '인기 음식 카테고리 중 랜덤으로' },
        { mode: 'custom', emoji: '✏️', title: '직접 입력하기', desc: '먹고 싶은 메뉴를 직접 입력' },
      ]}
      onSelect={(mode) => {
        session.set('foodMode', mode);
        if (mode === 'default') {
          session.set('foodCandidates', ALL_FOODS);
          router.push('/food/location');
        } else {
          router.push('/food/custom');
        }
      }}
    />
  );
}
