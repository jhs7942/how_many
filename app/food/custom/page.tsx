import FlowCustomPage from '@/components/flow/FlowCustomPage';
import { ALL_FOODS } from '@/lib/data';

export default function FoodCustomPage() {
  return (
    <FlowCustomPage
      presets={ALL_FOODS}
      presetTitle="음식 카테고리 빠른 선택"
      defaultCandidates={[]}
      backHref="/food/setting"
      nextHref="/food/location"
      sessionKey="foodCandidates"
      emojiSet={['🍕', '🍜', '🍣', '🍔', '🍗', '🥗', '🍰', '🌮', '🍱', '☕']}
    />
  );
}
