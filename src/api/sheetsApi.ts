import { Recipe, IngredientDBItem, PanDBItem } from '../types/erp';
import { INITIAL_RECIPES, INITIAL_INGREDIENTS, INITIAL_PANS } from './initialData';

const DEFAULT_GAS_URL = 'https://script.google.com/macros/s/AKfycbyBKzrtPG5dG31HC_pFEqBSnI0WLgTppv5vsjYWVJbG2hM_vbDVBHay3JkJoS0uhRhe/exec';

export function getGasUrl(): string {
  return import.meta.env.VITE_GAS_WEBAPP_URL || DEFAULT_GAS_URL;
}

const STORAGE_KEY_RECIPES = 'jameon_recipes';
const STORAGE_KEY_INGREDIENTS = 'jameon_ingredients';
const STORAGE_KEY_PANS = 'jameon_pans';
const STORAGE_KEY_LAST_SYNC = 'jameon_last_sync';

// Local storage helpers
export function loadCachedData(): {
  recipes: Recipe[];
  ingredients: IngredientDBItem[];
  pans: PanDBItem[];
  lastSync: string | null;
} {
  try {
    const rawRecipes = localStorage.getItem(STORAGE_KEY_RECIPES);
    const rawIngredients = localStorage.getItem(STORAGE_KEY_INGREDIENTS);
    const rawPans = localStorage.getItem(STORAGE_KEY_PANS);
    const lastSync = localStorage.getItem(STORAGE_KEY_LAST_SYNC);

    return {
      recipes: rawRecipes ? JSON.parse(rawRecipes) : INITIAL_RECIPES,
      ingredients: rawIngredients ? JSON.parse(rawIngredients) : INITIAL_INGREDIENTS,
      pans: rawPans ? JSON.parse(rawPans) : INITIAL_PANS,
      lastSync,
    };
  } catch (e) {
    console.error('Failed to load cached data from localStorage:', e);
    return {
      recipes: INITIAL_RECIPES,
      ingredients: INITIAL_INGREDIENTS,
      pans: INITIAL_PANS,
      lastSync: null,
    };
  }
}

export function cacheData(
  recipes?: Recipe[],
  ingredients?: IngredientDBItem[],
  pans?: PanDBItem[]
): void {
  try {
    if (recipes) localStorage.setItem(STORAGE_KEY_RECIPES, JSON.stringify(recipes));
    if (ingredients) localStorage.setItem(STORAGE_KEY_INGREDIENTS, JSON.stringify(ingredients));
    if (pans) localStorage.setItem(STORAGE_KEY_PANS, JSON.stringify(pans));
    localStorage.setItem(STORAGE_KEY_LAST_SYNC, new Date().toISOString());
  } catch (e) {
    console.error('Failed to save to localStorage:', e);
  }
}

/**
 * Fetch all data from GAS API
 */
export async function fetchAllFromGAS(): Promise<{
  recipes: Recipe[];
  ingredientsDB: IngredientDBItem[];
  pansDB: PanDBItem[];
}> {
  const url = `${getGasUrl()}?mode=api`;
  const response = await fetch(url, {
    method: 'GET',
  });

  if (!response.ok) {
    throw new Error(`GAS API HTTP error: ${response.status}`);
  }

  const data = await response.json();
  if (data.status !== 'success') {
    throw new Error(data.message || 'GAS API returned unsuccessful status');
  }

  return {
    recipes: data.recipes || [],
    ingredientsDB: data.ingredientsDB || [],
    pansDB: data.pansDB || [],
  };
}

/**
 * Send POST request to GAS API with no-cors mode to avoid CORS blocks
 */
async function sendPostToGAS(payload: any): Promise<boolean> {
  const url = getGasUrl();
  try {
    await fetch(url, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: JSON.stringify(payload),
    });
    return true;
  } catch (error) {
    console.error('Failed to send POST to GAS:', error);
    throw error;
  }
}

/**
 * Save Recipe to Google Sheets
 */
export async function saveRecipeToGAS(recipe: Recipe): Promise<boolean> {
  return sendPostToGAS({
    action: 'saveRecipe',
    recipe,
  });
}

/**
 * Delete Recipe from Google Sheets
 */
export async function deleteRecipeFromGAS(name: string): Promise<boolean> {
  return sendPostToGAS({
    action: 'deleteRecipe',
    name,
  });
}

/**
 * Save Ingredient to Google Sheets DB
 */
export async function saveIngredientToGAS(ingredient: IngredientDBItem): Promise<boolean> {
  return sendPostToGAS({
    action: 'saveIngredient',
    ingredient,
  });
}

/**
 * Delete Ingredient from Google Sheets DB
 */
export async function deleteIngredientFromGAS(name: string): Promise<boolean> {
  return sendPostToGAS({
    action: 'deleteIngredient',
    name,
  });
}

/**
 * Save Pan to Google Sheets DB
 */
export async function savePanToGAS(pan: PanDBItem): Promise<boolean> {
  return sendPostToGAS({
    action: 'savePan',
    pan,
  });
}

/**
 * Delete Pan from Google Sheets DB
 */
export async function deletePanFromGAS(name: string): Promise<boolean> {
  return sendPostToGAS({
    action: 'deletePan',
    name,
  });
}
