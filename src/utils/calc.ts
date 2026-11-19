import { Recipe, RecipeIngredient, CalculatedIngredient, RecipeMetrics, PanDBItem } from '../types/erp';

/**
 * Checks whether an ingredient row is actually a section/sub-heading
 * (e.g., "[소제목: 소보로]", "[소제목: 크럼블]", or 0 weight heading)
 */
export function isSubheading(ing: RecipeIngredient): boolean {
  if (ing.isSubheading) return true;
  const trimmed = ing.name.trim();
  if (trimmed.startsWith('[소제목') || trimmed.startsWith('【') || trimmed.startsWith('<소제목>')) {
    return true;
  }
  // If amount is 0 and name is not "합계"
  if (ing.amount === 0 && ing.packagePrice === 0 && trimmed !== '합계') {
    return true;
  }
  return false;
}

/**
 * Clean subheading display text: "[소제목: 소보로]" -> "소보로"
 */
export function formatSubheading(name: string): string {
  return name.replace(/^\[소제목:\s*|^\[소제목\s*|^【|^<소제목>\s*|\]$|】$|>$/g, '').trim();
}

/**
 * Calculate recipe metrics with scaling
 */
export function calculateRecipeMetrics(recipe: Recipe, currentYield?: number, scaleOverride?: number): RecipeMetrics {
  const baseYield = Math.max(1, recipe.baseYield || 1);
  const targetYield = currentYield !== undefined ? Math.max(0.1, currentYield) : baseYield;
  const scale = scaleOverride !== undefined ? scaleOverride : targetYield / baseYield;

  let totalFlourWeight = 0;

  // First pass: identify flour total with scale
  recipe.ingredients.forEach((ing) => {
    if (ing.name.trim() === '합계') return;
    if (isSubheading(ing)) return;
    const scaledWeight = ing.amount * scale;
    if (ing.isFlour) {
      totalFlourWeight += scaledWeight;
    }
  });

  let totalWeight = 0;
  let totalMaterialCost = 0;

  // Second pass: compute detailed row metrics
  const calculatedIngredients: CalculatedIngredient[] = recipe.ingredients
    .filter((ing) => ing.name.trim() !== '합계') // filter out existing static '합계' row if imported
    .map((ing) => {
      const isSub = isSubheading(ing);
      const calculatedWeight = isSub ? 0 : Math.round(ing.amount * scale * 10) / 10;
      
      let cost = 0;
      if (!isSub && ing.packagePrice > 0 && ing.packageWeight > 0) {
        const unitCost = ing.packagePrice / ing.packageWeight;
        cost = Math.round(calculatedWeight * unitCost);
      }

      let bakersPct = 0;
      if (!isSub) {
        if (totalFlourWeight > 0) {
          bakersPct = Math.round((calculatedWeight / totalFlourWeight) * 1000) / 10;
        } else {
          // If no flour defined, show % relative to base total
          bakersPct = 0;
        }
      }

      if (!isSub) {
        totalWeight += calculatedWeight;
        totalMaterialCost += cost;
      }

      return {
        ...ing,
        calculatedWeight,
        cost,
        bakersPct,
        isSubheading: isSub,
      };
    });

  const packagingCostTotal = Math.round(recipe.packagingCost * targetYield);
  const totalCost = totalMaterialCost + packagingCostTotal;
  const costPerPiece = targetYield > 0 ? Math.round(totalCost / targetYield) : 0;
  const sellingPrice = recipe.price || 0;
  const revenueTotal = sellingPrice * targetYield;
  const marginPerPiece = sellingPrice - costPerPiece;
  const marginRate = sellingPrice > 0 ? Math.round(((sellingPrice - costPerPiece) / sellingPrice) * 1000) / 10 : 0;

  return {
    totalWeight: Math.round(totalWeight * 10) / 10,
    totalFlourWeight: Math.round(totalFlourWeight * 10) / 10,
    totalMaterialCost,
    packagingCostTotal,
    totalCost,
    costPerPiece,
    sellingPrice,
    revenueTotal,
    marginPerPiece,
    marginRate,
    ingredients: calculatedIngredients,
  };
}

/**
 * Calculate pan volume in ml (cm^3)
 */
export function calculatePanVolume(shape: string, dim1: number, dim2: number, dim3: number): number {
  const d1 = Number(dim1) || 0;
  const d2 = Number(dim2) || 0;
  const d3 = Number(dim3) || 0;

  if (shape === '원형') {
    // dim1 = diameter, dim3 = height
    const radius = d1 / 2;
    return Math.round(Math.PI * radius * radius * d3);
  } else if (shape === '사각') {
    // dim1 = width, dim2 = depth, dim3 = height
    return Math.round(d1 * d2 * d3);
  }
  return 0;
}

/**
 * Calculate target dough weight (g)
 * Formula: Volume (ml) * (FillRatio (%) / 100) * SpecificGravity (g/ml)
 */
export function calculateTargetDoughWeight(volume: number, fillRatio: number, specificGravity: number): number {
  if (volume <= 0 || fillRatio <= 0 || specificGravity <= 0) return 0;
  return Math.round(volume * (fillRatio / 100) * specificGravity);
}

/**
 * Format currency with commas (KRW)
 */
export function formatCurrency(amount: number): string {
  return Math.round(amount).toLocaleString('ko-KR') + '원';
}

/**
 * Format number with comma
 */
export function formatNumber(num: number, decimals: number = 0): string {
  if (decimals === 0) {
    return Math.round(num).toLocaleString('ko-KR');
  }
  return Number(num.toFixed(decimals)).toLocaleString('ko-KR');
}

/**
 * Format date to YYYY.MM.DD
 */
export function getFormattedToday(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}.${m}.${d}`;
}

export const SPECIFIC_GRAVITY_PRESETS = [
  { label: '제누와즈', value: 0.48, desc: '가벼운 스펀지 케이크' },
  { label: '발효빵', value: 0.60, desc: '식빵, 베이글, 단팥빵' },
  { label: '파운드', value: 0.80, desc: '버터케이크, 파운드케이크' },
  { label: '휘낭시에', value: 0.90, desc: '밀도 있는 구움과자' },
  { label: '치즈/무스', value: 1.00, desc: '무스, 바스크치즈케이크' },
];

/**
 * Synchronize all ingredients in a recipe with the latest prices from Ingredient DB
 * and stamp updatedAt with today's date (YYYY.MM.DD)
 */
export function syncRecipeWithLatestIngredientPrices(
  recipe: Recipe,
  ingredientDB: import('../types/erp').IngredientDBItem[]
): { updatedRecipe: Recipe; changedCount: number } {
  let changedCount = 0;
  const newIngredients = recipe.ingredients.map((ing) => {
    if (isSubheading(ing)) return { ...ing };
    const cleanName = ing.name.trim().toLowerCase();
    
    // Exact or substring match from DB
    const match =
      ingredientDB.find((item) => item.name.trim().toLowerCase() === cleanName) ||
      ingredientDB.find((item) => {
        const dbName = item.name.trim().toLowerCase();
        return dbName.includes(cleanName) || cleanName.includes(dbName);
      });

    if (match && match.price > 0 && match.weight > 0) {
      if (ing.packagePrice !== match.price || ing.packageWeight !== match.weight) {
        changedCount++;
        return {
          ...ing,
          packagePrice: match.price,
          packageWeight: match.weight,
        };
      }
    }
    return { ...ing };
  });

  const updatedRecipe: Recipe = {
    ...recipe,
    ingredients: newIngredients,
    updatedAt: getFormattedToday(),
  };

  return { updatedRecipe, changedCount };
}
