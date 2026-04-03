import activitiesJson from '@/assets/data/activities.json';
import placesJson from '@/assets/data/places.json';
import foodsJson from '@/assets/data/foods.json';
import menusJson from '@/assets/data/menus.json';

export interface ActivityItem {
  label: string;
  emoji: string;
}

// 인원 기반 활동 데이터
export const ACTIVITY_DATA: Record<number, ActivityItem[]> = Object.fromEntries(
  Object.entries(activitiesJson).map(([key, value]) => [Number(key), value])
);

// 활동별 장소 유형 데이터
export const PLACE_DATA: Record<string, ActivityItem[]> = placesJson;

// 전체 중복 제거된 활동 목록 (인원 무관)
export const ALL_ACTIVITIES: ActivityItem[] = Array.from(
  new Map(
    Object.values(activitiesJson).flat().map((a) => [a.label, a])
  ).values()
);

// 음식 카테고리 목록 (인원수 무관, 단일 배열)
export const ALL_FOODS: ActivityItem[] = foodsJson;

// 음식 카테고리별 세부 메뉴
export const MENU_DATA: Record<string, ActivityItem[]> = menusJson;
