import React, { useState, useRef } from 'react';
import { Recipe, RecipeMetrics, PanDBItem, UiToggles } from '../types/erp';
import {
  calculateRecipeMetrics,
  formatCurrency,
  formatNumber,
  formatSubheading,
  getFormattedToday,
} from '../utils/calc';
import { PanConverter } from './PanConverter';
import {
  FileDown,
  Edit3,
  CloudUpload,
  Trash2,
  ChevronDown,
  ChevronUp,
  Percent,
  DollarSign,
  Maximize2,
  CheckCircle,
  Clock,
  Flame,
  Info,
  Layers,
  ChefHat,
} from 'lucide-react';

interface RecipeDetailProps {
  recipe: Recipe;
  pansDB: PanDBItem[];
  onEdit: (recipe: Recipe) => void;
  onDelete: (name: string) => void;
  onSaveToGAS: (recipe: Recipe) => Promise<boolean>;
  onDuplicate: (recipe: Recipe) => void;
}

export const RecipeDetail: React.FC<RecipeDetailProps> = ({
  recipe,
  pansDB,
  onEdit,
  onDelete,
  onSaveToGAS,
  onDuplicate,
}) => {
  // Yield and scale control
  const [currentYield, setCurrentYield] = useState<number>(recipe.baseYield || 1);
  const [activeScaleFactor, setActiveScaleFactor] = useState<number>(1.0);

  // UI Toggles
  const [toggles, setToggles] = useState<UiToggles>({
    showCostMargin: true,
    showPanConverter: true,
    showSteps: true,
    isPanConverterExpanded: false, // 기본 접힘 유지
  });

  // Step checked state for live baking session
  const [completedSteps, setCompletedSteps] = useState<{ [index: number]: boolean }>({});

  // Printable work order reference
  const printRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Calculate current metrics based on active scale
  const metrics: RecipeMetrics = calculateRecipeMetrics(
    recipe,
    currentYield,
    activeScaleFactor !== 1.0 ? activeScaleFactor : undefined
  );

  // Handle direct yield change
  const handleYieldChange = (newYield: number) => {
    const val = Math.max(0.1, Number(newYield) || 1);
    setCurrentYield(val);
    const base = Math.max(1, recipe.baseYield || 1);
    setActiveScaleFactor(val / base);
  };

  // Handle quick scaling factor (0.5x, 1x, 2x, 3x)
  const handleQuickScale = (factor: number) => {
    const base = Math.max(1, recipe.baseYield || 1);
    const newYield = Math.round(base * factor * 10) / 10;
    setCurrentYield(newYield);
    setActiveScaleFactor(factor);
  };

  // Handle scaling by specific ingredient weight change
  const handleSpecificIngredientWeightChange = (originalAmount: number, newWeightStr: string) => {
    const newWeight = parseFloat(newWeightStr);
    if (!isNaN(newWeight) && newWeight > 0 && originalAmount > 0) {
      const calculatedScale = newWeight / originalAmount;
      const base = Math.max(1, recipe.baseYield || 1);
      setCurrentYield(Math.round(base * calculatedScale * 10) / 10);
      setActiveScaleFactor(calculatedScale);
    }
  };

  // Toggle step completion in baking work session
  const toggleStepCompleted = (index: number) => {
    setCompletedSteps((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  // Export work order to PNG via html2canvas
  const handleExportPNG = async () => {
    if (!printRef.current || !window.html2canvas) {
      alert('html2canvas 라이브러리를 불러오는 중이거나 인쇄 영역을 찾을 수 없습니다.');
      return;
    }

    try {
      setIsExporting(true);
      const canvas = await window.html2canvas(printRef.current, {
        scale: 2, // High resolution for crisp printing
        backgroundColor: '#FFFFFF',
        useCORS: true,
      });

      const link = document.createElement('a');
      link.download = `[작업지시서]_${recipe.name}_${getFormattedToday()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Failed to export work order PNG:', err);
      alert('작업지시서 이미지 생성 중 오류가 발생했습니다.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="recipe-detail-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Top Controls & Toggles Bar */}
      <div
        className="paper-card"
        style={{
          padding: '12px 18px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-secondary)' }}>표시 항목:</span>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={toggles.showCostMargin}
              onChange={(e) => setToggles({ ...toggles, showCostMargin: e.target.checked })}
            />
            <span>원가 · 마진</span>
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={toggles.showPanConverter}
              onChange={(e) => setToggles({ ...toggles, showPanConverter: e.target.checked })}
            />
            <span>구움틀 · 비중 변환기</span>
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={toggles.showSteps}
              onChange={(e) => setToggles({ ...toggles, showSteps: e.target.checked })}
            />
            <span>제조 공정</span>
          </label>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn btn-soft btn-sm" onClick={handleExportPNG} disabled={isExporting} title="작업지시서를 PNG 이미지로 다운로드">
            <FileDown size={14} />
            <span>{isExporting ? '이미지 생성 중...' : '작업지시서 PNG'}</span>
          </button>
          <button
            className="btn btn-soft btn-sm"
            onClick={() => onSaveToGAS(recipe)}
            title="이 레시피를 구글 시트 탭에 즉시 업데이트"
          >
            <CloudUpload size={14} color="var(--forest-green)" />
            <span>시트 업데이트</span>
          </button>
          <button className="btn btn-soft btn-sm" onClick={() => onEdit(recipe)} title="레시피 정보 수정">
            <Edit3 size={14} />
            <span>수정</span>
          </button>
          <button
            className="btn btn-ghost btn-sm"
            style={{ color: 'var(--danger-red)' }}
            onClick={() => {
              if (confirm(`'${recipe.name}' 레시피를 삭제하시겠습니까?`)) {
                onDelete(recipe.name);
              }
            }}
            title="레시피 삭제"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Printable Work Order Container */}
      <div ref={printRef} className="work-order-print-area paper-card" style={{ padding: 24, margin: 0 }}>
        {/* Header Section */}
        <div className="work-order-title">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="tag-badge" style={{ fontSize: 12, padding: '3px 8px' }}>
                {recipe.category || '베이커리'}
              </span>
              <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--ink-primary)' }}>{recipe.name}</h2>
            </div>
            {recipe.panName && (
              <div style={{ fontSize: 13, color: 'var(--ink-secondary)', marginTop: 4 }}>
                기준 구움틀: <strong>{recipe.panName}</strong>
                {recipe.fillRatio > 0 && ` (충전율 ${recipe.fillRatio}%)`}
                {recipe.specificGravity > 0 && ` (비중 ${recipe.specificGravity} g/ml)`}
              </div>
            )}
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 12, color: 'var(--ink-muted)' }}>JAMEON BAKERY ERP</div>
            <div style={{ fontSize: 13, color: 'var(--ink-secondary)', fontWeight: 600 }}>{getFormattedToday()}</div>
          </div>
        </div>

        {/* Recipe Meta Info (Oven, Time, Notice) */}
        {(recipe.temperature || recipe.time || recipe.notice) && (
          <div
            style={{
              display: 'flex',
              gap: 16,
              background: 'var(--surface-sub)',
              padding: '10px 16px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-hairline)',
              marginBottom: 16,
              flexWrap: 'wrap',
              fontSize: 13,
            }}
          >
            {recipe.temperature && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Flame size={15} color="var(--crust-terracotta)" />
                <span>오븐 온도:</span>
                <strong>{recipe.temperature}</strong>
              </div>
            )}
            {recipe.time && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Clock size={15} color="var(--forest-green)" />
                <span>굽는 시간:</span>
                <strong>{recipe.time}</strong>
              </div>
            )}
            {recipe.notice && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
                <Info size={15} color="var(--ink-muted)" />
                <span style={{ color: 'var(--ink-secondary)' }}>{recipe.notice}</span>
              </div>
            )}
          </div>
        )}

        {/* Real-time Yield & Scaling Controller Bar */}
        <div
          style={{
            background: 'var(--surface-sub)',
            padding: '12px 16px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-hairline)',
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--ink-primary)' }}>생산 수량 스케일링:</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input
                type="number"
                min="0.1"
                step="1"
                style={{ width: 70, textAlign: 'center' }}
                className="input-text input-sm num-tabular"
                value={currentYield}
                onChange={(e) => handleYieldChange(Number(e.target.value))}
              />
              <span style={{ fontSize: 13, fontWeight: 600 }}>개 분량</span>
              <span style={{ fontSize: 12, color: 'var(--ink-muted)' }}>(기준: {recipe.baseYield || 1}개)</span>
            </div>

            <div style={{ display: 'flex', gap: 4 }}>
              {[0.5, 1.0, 2.0, 3.0].map((f) => (
                <button
                  key={f}
                  type="button"
                  className={`chip ${Math.abs(activeScaleFactor - f) < 0.05 ? 'active' : ''}`}
                  onClick={() => handleQuickScale(f)}
                >
                  {f}배
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ fontSize: 13 }}>
              총 반죽 중량: <strong className="num-tabular">{formatNumber(metrics.totalWeight, 1)} g</strong>
            </div>
            {metrics.totalFlourWeight > 0 && (
              <div style={{ fontSize: 13, color: 'var(--crust-terracotta)' }}>
                총 가루류: <strong className="num-tabular">{formatNumber(metrics.totalFlourWeight, 1)} g</strong>
              </div>
            )}
          </div>
        </div>

        {/* Cost & Margin Summary Panel (Toggleable) */}
        {toggles.showCostMargin && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
              gap: 12,
              padding: 14,
              background: 'var(--surface-accent)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-hairline)',
              marginBottom: 16,
            }}
          >
            <div>
              <div style={{ fontSize: 11, color: 'var(--ink-secondary)', fontWeight: 600 }}>총 재료원가</div>
              <div style={{ fontSize: 16, fontWeight: 800 }} className="num-tabular">
                {formatCurrency(metrics.totalMaterialCost)}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 11, color: 'var(--ink-secondary)', fontWeight: 600 }}>
                포장비 (개당 {formatNumber(recipe.packagingCost)}원)
              </div>
              <div style={{ fontSize: 16, fontWeight: 800 }} className="num-tabular">
                {formatCurrency(metrics.packagingCostTotal)}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 11, color: 'var(--ink-secondary)', fontWeight: 600 }}>총 제조원가</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--forest-green)' }} className="num-tabular">
                {formatCurrency(metrics.totalCost)}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 11, color: 'var(--ink-secondary)', fontWeight: 600 }}>1개당 원가</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--forest-green)' }} className="num-tabular">
                {formatCurrency(metrics.costPerPiece)}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 11, color: 'var(--ink-secondary)', fontWeight: 600 }}>개당 판매가</div>
              <div style={{ fontSize: 16, fontWeight: 800 }} className="num-tabular">
                {formatCurrency(metrics.sellingPrice)}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 11, color: 'var(--ink-secondary)', fontWeight: 600 }}>마진율 (개당 마진)</div>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 800,
                  color: metrics.marginRate >= 40 ? 'var(--forest-green)' : 'var(--crust-terracotta)',
                }}
                className="num-tabular"
              >
                {metrics.marginRate}%{' '}
                <span style={{ fontSize: 11, fontWeight: 600 }}>({formatCurrency(metrics.marginPerPiece)})</span>
              </div>
            </div>
          </div>
        )}

        {/* Ingredients Table */}
        <div className="table-wrapper" style={{ marginBottom: 20 }}>
          <table className="artisan-table">
            <thead>
              <tr>
                <th style={{ width: '35%' }}>재료명</th>
                <th style={{ width: '15%', textAlign: 'right' }}>배합량 (g)</th>
                <th style={{ width: '15%', textAlign: 'right' }}>베이커스 (%)</th>
                {toggles.showCostMargin && (
                  <>
                    <th style={{ width: '20%', textAlign: 'right' }}>구매단가 (용량)</th>
                    <th style={{ width: '15%', textAlign: 'right' }}>재료 원가</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {metrics.ingredients.map((ing, idx) => {
                if (ing.isSubheading) {
                  return (
                    <tr key={`sub-${idx}`} className="subheading-row">
                      <td colSpan={toggles.showCostMargin ? 5 : 3}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ color: 'var(--crust-terracotta)' }}>▶</span>
                          <span>{formatSubheading(ing.name)}</span>
                        </div>
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr key={`ing-${idx}`}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontWeight: 600 }}>{ing.name}</span>
                        {ing.isFlour && (
                          <span className="tag-badge flour" title="베이커스% 기준 가루류">
                            가루류
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Editable / Scalable Weight cell */}
                    <td style={{ textAlign: 'right' }}>
                      <input
                        type="number"
                        step="0.1"
                        style={{ width: 85, textAlign: 'right' }}
                        className="input-text input-sm num-tabular"
                        value={ing.calculatedWeight}
                        onChange={(e) => handleSpecificIngredientWeightChange(ing.amount, e.target.value)}
                        title="이 재료의 중량을 직접 변경하면 전체 레시피가 비율에 맞춰 실시간 스케일링됩니다"
                      />
                      <span style={{ fontSize: 11, color: 'var(--ink-muted)', marginLeft: 3 }}>g</span>
                    </td>

                    <td style={{ textAlign: 'right' }} className="percent-cell num-tabular">
                      {ing.bakersPct > 0 ? `${ing.bakersPct.toFixed(1)}%` : '-'}
                    </td>

                    {toggles.showCostMargin && (
                      <>
                        <td style={{ textAlign: 'right', fontSize: 12, color: 'var(--ink-secondary)' }} className="num-tabular">
                          {ing.packagePrice > 0 ? (
                            <>
                              {formatNumber(ing.packagePrice)}원 / {formatNumber(ing.packageWeight)}g
                            </>
                          ) : (
                            <span style={{ color: 'var(--ink-muted)' }}>단가 미입력</span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }} className="price-cell num-tabular">
                          {ing.cost > 0 ? formatCurrency(ing.cost) : '-'}
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}

              {/* Total Row */}
              <tr className="total-row">
                <td>합계 (총 반죽 중량)</td>
                <td style={{ textAlign: 'right', fontWeight: 800 }} className="weight-cell num-tabular">
                  {formatNumber(metrics.totalWeight, 1)} g
                </td>
                <td style={{ textAlign: 'right', fontWeight: 700 }} className="percent-cell num-tabular">
                  {metrics.totalFlourWeight > 0 ? (
                    `${((metrics.totalWeight / metrics.totalFlourWeight) * 100).toFixed(1)}%`
                  ) : (
                    '100%'
                  )}
                </td>
                {toggles.showCostMargin && (
                  <>
                    <td style={{ textAlign: 'right', fontSize: 12, color: 'var(--ink-secondary)' }}>재료비 합계</td>
                    <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--forest-green)' }} className="price-cell num-tabular">
                      {formatCurrency(metrics.totalMaterialCost)}
                    </td>
                  </>
                )}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Manufacturing Steps (Toggleable) */}
        {toggles.showSteps && recipe.steps && recipe.steps.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <ChefHat size={18} color="var(--forest-green)" />
              <span>제조 공정 단계</span>
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {recipe.steps.map((step, idx) => (
                <div
                  key={idx}
                  onClick={() => toggleStepCompleted(idx)}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    background: completedSteps[idx] ? 'var(--forest-tint)' : 'var(--surface-sub)',
                    border: '1px solid',
                    borderColor: completedSteps[idx] ? '#C3D9C8' : 'var(--border-hairline)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ marginTop: 2 }}>
                    <CheckCircle
                      size={16}
                      color={completedSteps[idx] ? 'var(--forest-green)' : 'var(--ink-muted)'}
                    />
                  </div>
                  <div style={{ flex: 1, fontSize: 13, lineHeight: 1.6 }}>
                    <strong style={{ marginRight: 6, color: 'var(--ink-secondary)' }}>{idx + 1}.</strong>
                    <span
                      style={{
                        textDecoration: completedSteps[idx] ? 'line-through' : 'none',
                        color: completedSteps[idx] ? 'var(--forest-green)' : 'var(--ink-primary)',
                      }}
                    >
                      {step}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Collapsible Pan & Specific Gravity Converter (Default Collapsed as requested) */}
      {toggles.showPanConverter && (
        <div className="accordion paper-card">
          <button
            type="button"
            className="accordion-trigger"
            onClick={() => setToggles({ ...toggles, isPanConverterExpanded: !toggles.isPanConverterExpanded })}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Layers size={16} color="var(--forest-green)" />
              <span>구움틀 및 반죽 비중 변환기</span>
              <span className="tag-badge" style={{ fontSize: 11 }}>
                용적비 / 목표 반죽량 계산
              </span>
            </div>
            {toggles.isPanConverterExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {toggles.isPanConverterExpanded && (
            <div className="accordion-content">
              <PanConverter
                currentRecipe={recipe}
                currentTotalWeight={metrics.totalWeight}
                pansDB={pansDB}
                onApplyScale={(scale) => {
                  const base = Math.max(1, recipe.baseYield || 1);
                  setCurrentYield(Math.round(base * scale * 10) / 10);
                  setActiveScaleFactor(scale);
                }}
                onDuplicateWithNewPan={onDuplicate}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
