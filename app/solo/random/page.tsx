import FlowRandomPage from '@/components/flow/FlowRandomPage';

export default function SoloRandomPage() {
  return (
    <FlowRandomPage
      backHref="/solo/setting"
      sessionKeys={{
        candidates: 'soloCandidates',
        location: 'soloLocation',
        activity: 'activity',
        resultId: 'soloResultId',
      }}
      resultHref="/solo/result"
    />
  );
}
