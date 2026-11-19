export interface RecipeIngredient {
  name: string;
  amount: number;
  packagePrice: number;
  packageWeight: number;
  isFlour: boolean;
  isSubheading?: boolean;
  note?: string;
}

export interface Recipe {
  name: string;
  category: string;
  baseYield: number;
  price: number;
  packagingCost: number;
  panName: string;
  specificGravity: number;
  fillRatio: number;
  image: string; // Finished product photo (제품 사진)
  processImages?: string[]; // Process photos (공정 사진 갤러리)
  stepImages?: { [stepIndex: number]: string }; // Step-specific process photos (단계별 공정 사진)
  notice: string;
  temperature: string;
  time: string;
  ingredients: RecipeIngredient[];
  steps: string[];
  updatedAt?: string;
}

export interface IngredientDBItem {
  category: string;
  name: string;
  manufacturer?: string;
  weight: number;
  unit: string;
  price: number;
  shop?: string;
  link?: string;
  updatedAt?: string;
  note?: string;
}

export interface PanDBItem {
  category: string;
  name: string;
  shape: '원형' | '사각' | '직접입력' | string;
  dim1: number;
  dim2: number;
  dim3: number;
  volume: number;
  fillRatio: number;
  note?: string;
  updatedAt?: string;
}

export interface UiToggles {
  showCostMargin: boolean;
  showPanConverter: boolean;
  showSteps: boolean;
  isPanConverterExpanded: boolean;
}

export type ViewMode = 'card' | 'list';

export interface CalculatedIngredient extends RecipeIngredient {
  calculatedWeight: number;
  cost: number;
  bakersPct: number;
  isSubheading: boolean;
}

export interface RecipeMetrics {
  totalWeight: number;
  totalFlourWeight: number;
  totalMaterialCost: number;
  packagingCostTotal: number;
  totalCost: number;
  costPerPiece: number;
  sellingPrice: number;
  revenueTotal: number;
  marginPerPiece: number;
  marginRate: number;
  ingredients: CalculatedIngredient[];
}

export type TabType = 'recipes' | 'ingredients' | 'pans';
