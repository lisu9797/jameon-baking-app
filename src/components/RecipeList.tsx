import React, { useState, useEffect } from 'react';
import { Recipe, ViewMode } from '../types/erp';
import { formatCurrency, formatNumber } from '../utils/calc';
import { LayoutGrid, List, Search, Plus, ChefHat, Filter } from 'lucide-react';

interface RecipeListProps {
  recipes: Recipe[];
  selectedRecipeName: string | null;
  onSelectRecipe: (recipe: Recipe) => void;
  onOpenNewRecipe: () => void;
}

const STORAGE_KEY_RECIPE_VIEW = 'jameon_recipe_view_mode';

export const RecipeList: React.FC<RecipeListProps> = ({
  recipes,
  selectedRecipeName,
  onSelectRecipe,
  onOpenNewRecipe,
}) => {
  // Mobile defaults to 'card', desktop user selection persisted in localStorage
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_RECIPE_VIEW);
    if (saved === 'card' || saved === 'list') return saved;
    return window.innerWidth < 768 ? 'card' : 'list';
  });

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('전체');

  // Persist view mode
  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem(STORAGE_KEY_RECIPE_VIEW, mode);
  };

  // Extract unique categories
  const categories = ['전체', ...Array.from(new Set(recipes.map((r) => r.category || '기타'))).filter(Boolean)];

  // Filter recipes
  const filteredRecipes = recipes.filter((r) => {
    const matchesCat = selectedCategory === '전체' || (r.category || '기타') === selectedCategory;
    const matchesSearch =
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.ingredients.some((ing) => ing.name.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Top Filter and Controls Bar */}
      <div
        className="paper-card"
        style={{
          padding: '12px 16px',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: '1 1 240px' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: 280 }}>
            <Search size={15} style={{ position: 'absolute', left: 10, top: 10, color: 'var(--ink-muted)' }} />
            <input
              type="text"
              className="input-text"
              style={{ paddingLeft: 32 }}
              placeholder="레시피명 또는 재료명 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Filter size={14} color="var(--ink-muted)" />
            <select
              className="select-box"
              style={{ width: 'auto', minWidth: 100 }}
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', border: '1px solid var(--border-hairline)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
            <button
              type="button"
              className={`btn btn-icon ${viewMode === 'card' ? 'btn-primary' : 'btn-soft'}`}
              style={{ borderRadius: 0, border: 'none' }}
              onClick={() => handleViewModeChange('card')}
              title="카드형 보기"
            >
              <LayoutGrid size={15} />
            </button>
            <button
              type="button"
              className={`btn btn-icon ${viewMode === 'list' ? 'btn-primary' : 'btn-soft'}`}
              style={{ borderRadius: 0, border: 'none' }}
              onClick={() => handleViewModeChange('list')}
              title="목록형 보기"
            >
              <List size={15} />
            </button>
          </div>

          <button className="btn btn-primary btn-sm" onClick={onOpenNewRecipe}>
            <Plus size={14} />
            <span>레시피 추가</span>
          </button>
        </div>
      </div>

      {/* Recipe List: Card View */}
      {viewMode === 'card' ? (
        <div className="recipe-cards-grid">
          {filteredRecipes.map((recipe) => {
            const isSelected = recipe.name === selectedRecipeName;
            const ingCount = recipe.ingredients.filter(
              (i) => !i.name.startsWith('[소제목') && i.name !== '합계' && i.amount > 0
            ).length;

            return (
              <div
                key={recipe.name}
                className={`recipe-card-item ${isSelected ? 'selected' : ''}`}
                onClick={() => onSelectRecipe(recipe)}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, gap: 6 }}>
                    <span className="tag-badge">{recipe.category || '베이커리'}</span>
                    <span style={{ fontSize: 12, color: 'var(--ink-muted)', whiteSpace: 'nowrap' }}>재료 {ingCount}종</span>
                  </div>
                  <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--ink-primary)', marginBottom: 6, lineHeight: 1.3 }}>
                    {recipe.name}
                  </h3>
                  {recipe.panName && (
                    <p style={{ fontSize: 12, color: 'var(--ink-secondary)', marginBottom: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      틀: <strong>{recipe.panName}</strong>
                    </p>
                  )}
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: 10,
                    borderTop: '1px solid var(--border-hairline)',
                    marginTop: 8,
                  }}
                >
                  <div style={{ fontSize: 12, color: 'var(--ink-secondary)' }}>
                    기준 수량: <strong className="num-tabular">{recipe.baseYield || 1}개</strong>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--forest-green)' }} className="num-tabular">
                    {recipe.price > 0 ? formatCurrency(recipe.price) : '가격 미정'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Recipe List: Responsive List View (never overflows or vertically wraps text) */
        <div className="recipe-compact-list">
          {filteredRecipes.map((recipe) => {
            const isSelected = recipe.name === selectedRecipeName;
            return (
              <div
                key={recipe.name}
                className={`recipe-list-row ${isSelected ? 'selected' : ''}`}
                onClick={() => onSelectRecipe(recipe)}
              >
                <div className="recipe-row-left">
                  <span className="tag-badge">{recipe.category || '기타'}</span>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div className="recipe-row-title" title={recipe.name}>
                      {recipe.name}
                    </div>
                    {recipe.panName && (
                      <div style={{ fontSize: 11, color: 'var(--ink-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {recipe.panName}
                      </div>
                    )}
                  </div>
                </div>

                <div className="recipe-row-right">
                  <span className="recipe-row-price num-tabular">
                    {recipe.price > 0 ? formatCurrency(recipe.price) : '-'}
                  </span>
                  <span className="recipe-row-yield num-tabular">
                    기준 {recipe.baseYield || 1}개
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {filteredRecipes.length === 0 && (
        <div
          style={{
            padding: 40,
            textAlign: 'center',
            background: 'var(--surface-paper)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-hairline)',
            color: 'var(--ink-muted)',
          }}
        >
          <ChefHat size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
          <p>검색 조건에 맞는 레시피가 없습니다.</p>
        </div>
      )}
    </div>
  );
};
