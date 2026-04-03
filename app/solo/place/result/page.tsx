import FlowDetailResultPage from '@/components/flow/FlowDetailResultPage';

export default function SoloPlaceResultPage() {
  return (
    <FlowDetailResultPage
      backHref="/solo/place/spin"
      sessionKeys={{
        activity: 'place',
        resultId: 'placeResultId',
        parentActivity: 'activity',
      }}
      retryHref="/solo/place/spin"
      fallbackHref="/solo/people"
    />
  );
}
