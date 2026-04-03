import FlowResultPage from '@/components/flow/FlowResultPage';
import foodTipsJson from '@/assets/data/food-tips.json';

export default function FoodResultPage() {
  return (
    <FlowResultPage
      backHref="/food/setting"
      sessionKeys={{
        activity: 'foodActivity',
        location: 'foodLocation',
        resultId: 'foodResultId',
      }}
      resultTitle="오늘의 맛집"
      retryHref="/food/setting"
      detailHref="/food/detail/random"
      detailLabel="세부 메뉴 뽑기"
      tipData={foodTipsJson}
      fallbackHref="/food/setting"
    />
  );
}
