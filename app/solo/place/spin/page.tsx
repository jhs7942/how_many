import FlowDetailRandomPage from '@/components/flow/FlowDetailRandomPage';
import { PLACE_DATA } from '@/lib/data';

export default function SoloPlaceSpinPage() {
  return (
    <FlowDetailRandomPage
      backHref="/solo/result"
      dataMap={PLACE_DATA}
      sessionKeys={{
        parentActivity: 'activity',
        activity: 'place',
        resultId: 'placeResultId',
      }}
      resultHref="/solo/place/result"
      fallbackSegments={[
        { label: '근처 맛집', emoji: '🍽️' },
        { label: '핫플레이스', emoji: '🔥' },
        { label: '조용한 곳', emoji: '🌿' },
        { label: '새로운 곳', emoji: '✨' },
      ]}
      headerTitle="장소 결정"
      subTitle="어떤 장소로 갈까요?"
      subDesc="버튼을 눌러 장소를 결정해보세요!"
      fallbackHref="/solo/people"
    />
  );
}
