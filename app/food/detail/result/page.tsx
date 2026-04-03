import FlowDetailResultPage from '@/components/flow/FlowDetailResultPage';

export default function FoodDetailResultPage() {
  return (
    <FlowDetailResultPage
      backHref="/food/result"
      sessionKeys={{
        activity: 'foodDetailActivity',
        resultId: 'foodDetailResultId',
        parentActivity: 'foodActivity',
      }}
      retryHref="/food/detail/random"
      fallbackHref="/food/setting"
    />
  );
}
