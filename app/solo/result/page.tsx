import FlowResultPage from '@/components/flow/FlowResultPage';
import tipsJson from '@/assets/data/tips.json';

export default function SoloResultPage() {
  return (
    <FlowResultPage
      backHref="/solo/random"
      sessionKeys={{
        activity: 'activity',
        location: 'soloLocation',
        resultId: 'soloResultId',
      }}
      resultTitle="오늘의 활동"
      retryHref="/solo/random"
      tipData={tipsJson}
      fallbackHref="/solo/setting"
    />
  );
}
