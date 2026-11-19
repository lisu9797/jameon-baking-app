import React, { useState, useEffect } from 'react';
import { Recipe, IngredientDBItem, PanDBItem, TabType } from './types/erp';
import {
  loadCachedData,
  cacheData,
  fetchAllFromGAS,
  saveRecipeToGAS,
  deleteRecipeFromGAS,
  saveIngredientToGAS,
  deleteIngredientFromGAS,
  savePanToGAS,
  deletePanFromGAS,
} from './api/sheetsApi';
import { Header } from './components/Header';
import { RecipeList } from './components/RecipeList';
import { RecipeDetail } from './components/RecipeDetail';
import { IngredientDBView } from './components/IngredientDBView';
import { PanDBView } from './components/PanDBView';
import { RecipeModal } from './components/RecipeModal';
import { QuickImportModal } from './components/QuickImportModal';
import { ChefHat, Database, Box, ArrowLeft } from 'lucide-react';

export function App() {
  // Load initial cached data from localStorage or initialData.ts
  const initialData = loadCachedData();

  const [recipes, setRecipes] = useState<Recipe[]>(initialData.recipes);
  const [ingredientsDB, setIngredientsDB] = useState<IngredientDBItem[]>(initialData.ingredients);
  const [pansDB, setPansDB] = useState<PanDBItem[]>(initialData.pans);

  // Sync state
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(initialData.lastSync);

  // Navigation and active recipe
  const [currentTab, setCurrentTab] = useState<TabType>('recipes');
  const [selectedRecipeName, setSelectedRecipeName] = useState<string | null>(
    initialData.recipes[0]?.name || null
  );
  const [mobileRecipeView, setMobileRecipeView] = useState<'list' | 'detail'>('list');

  // Modals
  const [isRecipeModalOpen, setIsRecipeModalOpen] = useState<boolean>(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [isQuickImportOpen, setIsQuickImportOpen] = useState<boolean>(false);

  // Synchronize with Google Sheets
  const handleSyncWithGAS = async () => {
    try {
      setSyncStatus('syncing');
      const gasData = await fetchAllFromGAS();

      if (gasData.recipes && gasData.recipes.length > 0) {
        setRecipes(gasData.recipes);
      }
      if (gasData.ingredientsDB && gasData.ingredientsDB.length > 0) {
        setIngredientsDB(gasData.ingredientsDB);
      }
      if (gasData.pansDB && gasData.pansDB.length > 0) {
        setPansDB(gasData.pansDB);
      }

      cacheData(gasData.recipes, gasData.ingredientsDB, gasData.pansDB);
      const now = new Date().toISOString();
      setLastSyncTime(now);
      setSyncStatus('synced');
    } catch (err) {
      console.error('GAS synchronization error:', err);
      setSyncStatus('error');
    }
  };

  // Initial load: render cache first, then fetch live GAS in background
  useEffect(() => {
    handleSyncWithGAS();
  }, []);

  // Selected recipe object
  const activeRecipe = recipes.find((r) => r.name === selectedRecipeName) || recipes[0] || null;

  // Recipe CRUD
  const handleSaveRecipe = async (savedRecipe: Recipe) => {
    const existingIndex = recipes.findIndex((r) => r.name === savedRecipe.name);
    let updated: Recipe[];
    if (existingIndex >= 0) {
      updated = [...recipes];
      updated[existingIndex] = savedRecipe;
    } else {
      updated = [savedRecipe, ...recipes];
    }

    setRecipes(updated);
    setSelectedRecipeName(savedRecipe.name);
    cacheData(updated, ingredientsDB, pansDB);

    // Save to Google Sheets
    try {
      setSyncStatus('syncing');
      await saveRecipeToGAS(savedRecipe);
      setSyncStatus('synced');
    } catch (err) {
      console.error(err);
      setSyncStatus('error');
    }
  };

  const handleDeleteRecipe = async (name: string) => {
    const updated = recipes.filter((r) => r.name !== name);
    setRecipes(updated);
    cacheData(updated, ingredientsDB, pansDB);

    if (selectedRecipeName === name) {
      setSelectedRecipeName(updated[0]?.name || null);
    }

    try {
      setSyncStatus('syncing');
      await deleteRecipeFromGAS(name);
      setSyncStatus('synced');
    } catch (err) {
      console.error(err);
      setSyncStatus('error');
    }
  };

  const handleDuplicateRecipe = (newRecipe: Recipe) => {
    const updated = [newRecipe, ...recipes];
    setRecipes(updated);
    setSelectedRecipeName(newRecipe.name);
    cacheData(updated, ingredientsDB, pansDB);
    saveRecipeToGAS(newRecipe).catch(console.error);
  };

  const handleImportMultiple = (importedRecipes: Recipe[]) => {
    const updated = [...importedRecipes, ...recipes];
    setRecipes(updated);
    if (importedRecipes[0]) {
      setSelectedRecipeName(importedRecipes[0].name);
    }
    cacheData(updated, ingredientsDB, pansDB);

    // Sync all to GAS in background
    importedRecipes.forEach((r) => saveRecipeToGAS(r).catch(console.error));
  };

  // Ingredient CRUD
  const handleSaveIngredient = async (item: IngredientDBItem) => {
    const idx = ingredientsDB.findIndex((i) => i.name === item.name);
    let updated: IngredientDBItem[];
    if (idx >= 0) {
      updated = [...ingredientsDB];
      updated[idx] = item;
    } else {
      updated = [item, ...ingredientsDB];
    }

    setIngredientsDB(updated);
    cacheData(recipes, updated, pansDB);

    try {
      setSyncStatus('syncing');
      await saveIngredientToGAS(item);
      setSyncStatus('synced');
    } catch (err) {
      console.error(err);
      setSyncStatus('error');
    }
  };

  const handleDeleteIngredient = async (name: string) => {
    const updated = ingredientsDB.filter((i) => i.name !== name);
    setIngredientsDB(updated);
    cacheData(recipes, updated, pansDB);

    try {
      setSyncStatus('syncing');
      await deleteIngredientFromGAS(name);
      setSyncStatus('synced');
    } catch (err) {
      console.error(err);
      setSyncStatus('error');
    }
  };

  // Pan CRUD
  const handleSavePan = async (pan: PanDBItem) => {
    const idx = pansDB.findIndex((p) => p.name === pan.name);
    let updated: PanDBItem[];
    if (idx >= 0) {
      updated = [...pansDB];
      updated[idx] = pan;
    } else {
      updated = [pan, ...pansDB];
    }

    setPansDB(updated);
    cacheData(recipes, ingredientsDB, updated);

    try {
      setSyncStatus('syncing');
      await savePanToGAS(pan);
      setSyncStatus('synced');
    } catch (err) {
      console.error(err);
      setSyncStatus('error');
    }
  };

  const handleDeletePan = async (name: string) => {
    const updated = pansDB.filter((p) => p.name !== name);
    setPansDB(updated);
    cacheData(recipes, ingredientsDB, updated);

    try {
      setSyncStatus('syncing');
      await deletePanFromGAS(name);
      setSyncStatus('synced');
    } catch (err) {
      console.error(err);
      setSyncStatus('error');
    }
  };

  return (
    <div className="app-container">
      {/* Top Header */}
      <Header
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        recipeCount={recipes.length}
        ingredientCount={ingredientsDB.length}
        panCount={pansDB.length}
        syncStatus={syncStatus}
        lastSyncTime={lastSyncTime}
        onSync={handleSyncWithGAS}
        onOpenNewRecipe={() => {
          setEditingRecipe(null);
          setIsRecipeModalOpen(true);
        }}
        onOpenQuickImport={() => setIsQuickImportOpen(true)}
      />

      {/* Main Navigation Tabs */}
      <nav className="nav-tabs">
        <button
          className={`nav-tab-btn ${currentTab === 'recipes' ? 'active' : ''}`}
          onClick={() => setCurrentTab('recipes')}
        >
          <ChefHat size={16} />
          <span>레시피 관리</span>
          <span className="tab-count-pill num-tabular">{recipes.length}</span>
        </button>

        <button
          className={`nav-tab-btn ${currentTab === 'ingredients' ? 'active' : ''}`}
          onClick={() => setCurrentTab('ingredients')}
        >
          <Database size={16} />
          <span>재료 단가 DB</span>
          <span className="tab-count-pill num-tabular">{ingredientsDB.length}</span>
        </button>

        <button
          className={`nav-tab-btn ${currentTab === 'pans' ? 'active' : ''}`}
          onClick={() => setCurrentTab('pans')}
        >
          <Box size={16} />
          <span>구움틀 DB</span>
          <span className="tab-count-pill num-tabular">{pansDB.length}</span>
        </button>
      </nav>

      {/* Main Content Area */}
      <main>
        {currentTab === 'recipes' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="recipe-layout-grid">
              {/* Recipe List sidebar / column */}
              <div
                style={{
                  display:
                    typeof window !== 'undefined' && window.innerWidth < 960 && mobileRecipeView === 'detail'
                      ? 'none'
                      : 'flex',
                  flexDirection: 'column',
                  gap: 14,
                }}
              >
                <RecipeList
                  recipes={recipes}
                  selectedRecipeName={selectedRecipeName}
                  onSelectRecipe={(r) => {
                    setSelectedRecipeName(r.name);
                    setMobileRecipeView('detail');
                  }}
                  onOpenNewRecipe={() => {
                    setEditingRecipe(null);
                    setIsRecipeModalOpen(true);
                  }}
                />
              </div>

              {/* Recipe Detail view */}
              <div
                style={{
                  display:
                    typeof window !== 'undefined' && window.innerWidth < 960 && mobileRecipeView === 'list'
                      ? 'none'
                      : 'block',
                }}
              >
                {/* Mobile back to list bar */}
                <div className="mobile-back-bar">
                  <button className="btn btn-soft btn-sm" onClick={() => setMobileRecipeView('list')}>
                    <ArrowLeft size={14} />
                    <span>◀ 레시피 목록으로 돌아가기</span>
                  </button>
                </div>

                {activeRecipe ? (
                  <RecipeDetail
                    key={activeRecipe.name}
                    recipe={activeRecipe}
                    pansDB={pansDB}
                    onEdit={(r) => {
                      setEditingRecipe(r);
                      setIsRecipeModalOpen(true);
                    }}
                    onDelete={handleDeleteRecipe}
                    onSaveToGAS={async (r) => {
                      try {
                        setSyncStatus('syncing');
                        await saveRecipeToGAS(r);
                        setSyncStatus('synced');
                        return true;
                      } catch {
                        setSyncStatus('error');
                        return false;
                      }
                    }}
                    onDuplicate={handleDuplicateRecipe}
                  />
                ) : (
                  <div className="paper-card" style={{ padding: 40, textAlign: 'center', color: 'var(--ink-muted)' }}>
                    선택된 레시피가 없습니다. 좌측 목록에서 레시피를 선택하거나 새로 작성해보세요.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {currentTab === 'ingredients' && (
          <IngredientDBView
            ingredients={ingredientsDB}
            onSaveIngredient={handleSaveIngredient}
            onDeleteIngredient={handleDeleteIngredient}
          />
        )}

        {currentTab === 'pans' && (
          <PanDBView pans={pansDB} onSavePan={handleSavePan} onDeletePan={handleDeletePan} />
        )}
      </main>

      {/* Modals */}
      <RecipeModal
        isOpen={isRecipeModalOpen}
        initialRecipe={editingRecipe}
        ingredientDB={ingredientsDB}
        pansDB={pansDB}
        onClose={() => setIsRecipeModalOpen(false)}
        onSave={handleSaveRecipe}
      />

      <QuickImportModal
        isOpen={isQuickImportOpen}
        ingredientDB={ingredientsDB}
        onClose={() => setIsQuickImportOpen(false)}
        onImportRecipe={(r) => {
          handleSaveRecipe(r);
          setSelectedRecipeName(r.name);
        }}
        onImportMultipleRecipes={handleImportMultiple}
      />
    </div>
  );
}

export default App;
