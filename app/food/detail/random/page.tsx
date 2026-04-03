import FlowDetailRandomPage from '@/components/flow/FlowDetailRandomPage';
import { MENU_DATA } from '@/lib/data';

export default function FoodDetailRandomPage() {
  return (
    <FlowDetailRandomPage
      backHref="/food/result"
      dataMap={MENU_DATA}
      sessionKeys={{
        parentActivity: 'foodActivity',
        activity: 'foodDetailActivity',
        resultId: 'foodDetailResultId',
      }}
      resultHref="/food/detail/result"
      headerTitle="세부 메뉴 결정"
      subTitle="어떤 메뉴로 정할까요?"
      subDesc="랜덤으로 세부 메뉴를 결정해요!"
      fallbackHref="/food/setting"
    />
  );
}
