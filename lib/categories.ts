/**
 * 품목별 예상 관세율과 목록통관 여부.
 * 목록통관이 안 되는 품목(식품·영양제·기능성 화장품)은 미국발이어도 면세 한도가 150달러다.
 * 실제 세율은 HS 코드와 원산지로 정해지므로 여기 값은 직구에서 흔히 쓰는 대표값이다.
 */
export interface Category {
  id: string;
  label: string;
  dutyRate: number;
  listClearance: boolean;
  vatExempt?: boolean;
}

const GENERAL: Category = { id: 'general', label: '일반 물품', dutyRate: 0.08, listClearance: true };

export const CATEGORIES: Category[] = [
  GENERAL,
  { id: 'clothing', label: '의류·신발', dutyRate: 0.13, listClearance: true },
  { id: 'bag', label: '가방·지갑·시계', dutyRate: 0.08, listClearance: true },
  { id: 'it', label: 'IT기기 (노트북·휴대폰·태블릿·카메라)', dutyRate: 0, listClearance: true },
  { id: 'electronics', label: '기타 전자기기·가전', dutyRate: 0.08, listClearance: true },
  { id: 'cosmetics', label: '화장품 (기능성 제외)', dutyRate: 0.065, listClearance: true },
  { id: 'functional-cosmetics', label: '기능성 화장품 (미백·주름·자외선 차단)', dutyRate: 0.065, listClearance: false },
  { id: 'supplement', label: '건강기능식품·영양제', dutyRate: 0.08, listClearance: false },
  { id: 'food', label: '식품', dutyRate: 0.08, listClearance: false },
  { id: 'books', label: '책', dutyRate: 0, listClearance: true, vatExempt: true },
];

export const DEFAULT_CATEGORY_ID = GENERAL.id;

export function getCategory(id: string): Category {
  return CATEGORIES.find((c) => c.id === id) ?? GENERAL;
}

const DEPARTMENT_RULES: Array<[RegExp, string]> = [
  [/clothing|shoes|fashion|ファッション|シューズ/i, 'clothing'],
  [/luggage|handbag|watch|バッグ|腕時計/i, 'bag'],
  [/computers?|パソコン/i, 'it'],
  [/electronics|cell phones|camera|家電|カメラ/i, 'electronics'],
  [/beauty|ビューティー|コスメ/i, 'cosmetics'],
  [/health|vitamin|supplement|ドラッグストア|ヘルス/i, 'supplement'],
  [/grocery|gourmet|food|食品|飲料/i, 'food'],
  [/^books?$|^本$|洋書/i, 'books'],
];

/** 아마존 상품 분류 이름으로 품목을 추정한다. 못 찾으면 null. */
export function guessCategoryId(department: string | null): string | null {
  if (!department) return null;
  const name = department.trim();
  for (const [pattern, id] of DEPARTMENT_RULES) {
    if (pattern.test(name)) return id;
  }
  return null;
}
