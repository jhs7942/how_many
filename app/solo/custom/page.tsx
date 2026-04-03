import FlowCustomPage from '@/components/flow/FlowCustomPage';
import { ALL_ACTIVITIES } from '@/lib/data';

const DEFAULT_CANDIDATES = [
  { label: '카페', emoji: '☕' },
  { label: '영화', emoji: '🎬' },
];

export default function SoloCustomPage() {
  return (
    <FlowCustomPage
      presets={ALL_ACTIVITIES}
      defaultCandidates={DEFAULT_CANDIDATES}
      backHref="/solo/setting"
      nextHref="/solo/location"
      sessionKey="soloCandidates"
    />
  );
}
