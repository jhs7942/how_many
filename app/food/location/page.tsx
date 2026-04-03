import FlowLocationPage from '@/components/flow/FlowLocationPage';

export default function FoodLocationPage() {
  return (
    <FlowLocationPage
      backHref="/food/setting"
      nextHref="/food/random"
      sessionKey="foodLocation"
    />
  );
}
