import FlowRandomPage from '@/components/flow/FlowRandomPage';

export default function FoodRandomPage() {
  return (
    <FlowRandomPage
      backHref="/food/location"
      sessionKeys={{
        candidates: 'foodCandidates',
        location: 'foodLocation',
        activity: 'foodActivity',
        resultId: 'foodResultId',
      }}
      resultHref="/food/result"
    />
  );
}
