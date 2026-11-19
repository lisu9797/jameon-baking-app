import React, { useState, useRef, useEffect } from 'react';
import { Recipe, RecipeIngredient, IngredientDBItem, PanDBItem } from '../types/erp';
import { isLikelyFlour } from '../utils/parser';
import {
  X,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Layers,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  Flame,
  Clock,
  HelpCircle,
  FolderPlus,
} from 'lucide-react';

interface RecipeModalProps {
  isOpen: boolean;
  initialRecipe?: Recipe | null;
  ingredientDB: IngredientDBItem[];
  pansDB: PanDBItem[];
  onClose: () => void;
  onSave: (recipe: Recipe) => void;
}

export const RecipeModal: React.FC<RecipeModalProps> = ({
  isOpen,
  initialRecipe,
  ingredientDB,
  pansDB,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('제과');
  const [baseYield, setBaseYield] = useState(1);
  const [price, setPrice] = useState(0);
  const [packagingCost, setPackagingCost] = useState(0);

  // Accordion 1: Pan & Specific Gravity
  const [panName, setPanName] = useState('');
  const [specificGravity, setSpecificGravity] = useState(0.8);
  const [fillRatio, setFillRatio] = useState(75);
  const [isPanAccordionOpen, setIsPanAccordionOpen] = useState(false);

  // Accordion 2: Photo, Oven, Time, Notice
  const [temperature, setTemperature] = useState('');
  const [time, setTime] = useState('');
  const [notice, setNotice] = useState('');
  const [image, setImage] = useState('');
  const [isExtraAccordionOpen, setIsExtraAccordionOpen] = useState(false);

  // Ingredients and Steps
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>([]);
  const [steps, setSteps] = useState<string[]>([]);

  // Autocomplete state for active row
  const [activeIngIndex, setActiveIngIndex] = useState<number | null>(null);
  const [autocompleteSuggestions, setAutocompleteSuggestions] = useState<IngredientDBItem[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(0);

  // Initialize or reset form
  useEffect(() => {
    if (initialRecipe) {
      setName(initialRecipe.name || '');
      setCategory(initialRecipe.category || '제과');
      setBaseYield(initialRecipe.baseYield || 1);
      setPrice(initialRecipe.price || 0);
      setPackagingCost(initialRecipe.packagingCost || 0);

      setPanName(initialRecipe.panName || '');
      setSpecificGravity(initialRecipe.specificGravity || 0.8);
      setFillRatio(initialRecipe.fillRatio || 75);
      setIsPanAccordionOpen(Boolean(initialRecipe.panName || initialRecipe.specificGravity));

      setTemperature(initialRecipe.temperature || '');
      setTime(initialRecipe.time || '');
      setNotice(initialRecipe.notice || '');
      setImage(initialRecipe.image || '');
      setIsExtraAccordionOpen(Boolean(initialRecipe.temperature || initialRecipe.time || initialRecipe.notice || initialRecipe.image));

      setIngredients(
        initialRecipe.ingredients && initialRecipe.ingredients.length > 0
          ? JSON.parse(JSON.stringify(initialRecipe.ingredients))
          : [{ name: '', amount: 100, packagePrice: 0, packageWeight: 1000, isFlour: true }]
      );
      setSteps(initialRecipe.steps ? [...initialRecipe.steps] : ['']);
    } else {
      // New Recipe default
      setName('');
      setCategory('제과');
      setBaseYield(1);
      setPrice(0);
      setPackagingCost(0);
      setPanName('');
      setSpecificGravity(0.8);
      setFillRatio(75);
      setIsPanAccordionOpen(false);
      setTemperature('');
      setTime('');
      setNotice('');
      setImage('');
      setIsExtraAccordionOpen(false);
      setIngredients([
        { name: '', amount: 100, packagePrice: 0, packageWeight: 1000, isFlour: true },
      ]);
      setSteps(['']);
    }
  }, [initialRecipe, isOpen]);

  if (!isOpen) return null;

  // Add normal ingredient row
  const addIngredientRow = () => {
    setIngredients([
      ...ingredients,
      { name: '', amount: 0, packagePrice: 0, packageWeight: 1000, isFlour: false },
    ]);
  };

  // Add subheading row
  const addSubheadingRow = () => {
    setIngredients([
      ...ingredients,
      { name: '[소제목: 소보로]', amount: 0, packagePrice: 0, packageWeight: 1000, isFlour: false, isSubheading: true },
    ]);
  };

  // Move item up/down
  const moveIngredient = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === ingredients.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const updated = [...ingredients];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);
    setIngredients(updated);
  };

  // Remove ingredient row
  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  // Update ingredient property
  const updateIngredient = (index: number, field: keyof RecipeIngredient, value: any) => {
    const updated = [...ingredients];
    updated[index] = { ...updated[index], [field]: value };

    // Auto-detect flour on name change if not manual
    if (field === 'name' && typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed.startsWith('[소제목')) {
        updated[index].isFlour = isLikelyFlour(trimmed);
      }
    }

    setIngredients(updated);
  };

  // Autocomplete search on input
  const handleNameInputChange = (index: number, val: string) => {
    updateIngredient(index, 'name', val);
    setActiveIngIndex(index);

    if (val.trim().length > 0 && !val.startsWith('[')) {
      const filtered = ingredientDB
        .filter((item) => item.name.toLowerCase().includes(val.toLowerCase()))
        .slice(0, 8);
      setAutocompleteSuggestions(filtered);
      setHighlightedIndex(0);
    } else {
      setAutocompleteSuggestions([]);
    }
  };

  // Select autocomplete suggestion
  const selectSuggestion = (index: number, item: IngredientDBItem) => {
    const updated = [...ingredients];
    updated[index] = {
      ...updated[index],
      name: item.name,
      packagePrice: item.price || 0,
      packageWeight: item.weight || 1000,
      isFlour: isLikelyFlour(item.name),
    };
    setIngredients(updated);
    setAutocompleteSuggestions([]);
    setActiveIngIndex(null);
  };

  // Keyboard navigation for autocomplete (ArrowUp, ArrowDown, Enter)
  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (autocompleteSuggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % autocompleteSuggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev - 1 + autocompleteSuggestions.length) % autocompleteSuggestions.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (autocompleteSuggestions[highlightedIndex]) {
        selectSuggestion(index, autocompleteSuggestions[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      setAutocompleteSuggestions([]);
    }
  };

  // Add / remove / update steps
  const addStepRow = () => setSteps([...steps, '']);
  const updateStep = (index: number, val: string) => {
    const updated = [...steps];
    updated[index] = val;
    setSteps(updated);
  };
  const removeStep = (index: number) => setSteps(steps.filter((_, i) => i !== index));

  // Save handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('레시피명을 입력해주세요.');
      return;
    }

    const cleanedIngredients = ingredients.filter((ing) => ing.name.trim().length > 0);
    const cleanedSteps = steps.filter((s) => s.trim().length > 0);

    const recipeObj: Recipe = {
      name: name.trim(),
      category: category.trim() || '제과',
      baseYield: Math.max(1, baseYield || 1),
      price: Number(price) || 0,
      packagingCost: Number(packagingCost) || 0,
      panName: panName.trim(),
      specificGravity: Number(specificGravity) || 0,
      fillRatio: Number(fillRatio) || 75,
      image,
      notice: notice.trim(),
      temperature: temperature.trim(),
      time: time.trim(),
      ingredients: cleanedIngredients,
      steps: cleanedSteps,
    };

    onSave(recipeObj);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{initialRecipe ? '레시피 수정' : '새 레시피 작성'}</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
          <div className="modal-body" style={{ flex: 1, overflowY: 'auto' }}>
            {/* Core Info */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 16 }}>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">레시피명 *</label>
                <input
                  type="text"
                  required
                  className="input-text"
                  placeholder="예: 쑥 크럼블 파운드케이크"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">분류(카테고리)</label>
                <input
                  type="text"
                  className="input-text"
                  placeholder="예: 제과, 빵, 스프"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">기준 생산 수량 (개)</label>
                <input
                  type="number"
                  min="1"
                  className="input-text num-tabular"
                  value={baseYield}
                  onChange={(e) => setBaseYield(Number(e.target.value))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">판매가 (원)</label>
                <input
                  type="number"
                  step="100"
                  className="input-text num-tabular"
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">개당 포장비 (원)</label>
                <input
                  type="number"
                  step="10"
                  className="input-text num-tabular"
                  value={packagingCost}
                  onChange={(e) => setPackagingCost(Number(e.target.value))}
                />
              </div>
            </div>

            {/* Accordion 1: 구움틀 · 반죽 비중 설정 (Default closed unless data exists) */}
            <div className="accordion">
              <button
                type="button"
                className="accordion-trigger"
                onClick={() => setIsPanAccordionOpen(!isPanAccordionOpen)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Layers size={15} color="var(--forest-green)" />
                  <span>구움틀 · 반죽 비중 설정</span>
                  {panName && <span className="tag-badge" style={{ fontSize: 11 }}>{panName}</span>}
                </div>
                {isPanAccordionOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              {isPanAccordionOpen && (
                <div className="accordion-content">
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                    <div className="form-group">
                      <label className="form-label">기준 구움틀</label>
                      <select
                        className="select-box"
                        value={panName}
                        onChange={(e) => {
                          setPanName(e.target.value);
                          const pan = pansDB.find((p) => p.name === e.target.value);
                          if (pan && pan.fillRatio) setFillRatio(pan.fillRatio);
                        }}
                      >
                        <option value="">구움틀 선택 안함 (직접 입력)</option>
                        {pansDB.map((p) => (
                          <option key={p.name} value={p.name}>
                            {p.name} ({p.volume}ml)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">반죽 비중 (g/ml)</label>
                      <input
                        type="number"
                        step="0.01"
                        className="input-text num-tabular"
                        placeholder="예: 0.8"
                        value={specificGravity}
                        onChange={(e) => setSpecificGravity(Number(e.target.value))}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">권장 충전율 (%)</label>
                      <input
                        type="number"
                        className="input-text num-tabular"
                        value={fillRatio}
                        onChange={(e) => setFillRatio(Number(e.target.value))}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Accordion 2: 사진 · 오븐 온도/시간 · 주의사항 (Default closed unless data exists) */}
            <div className="accordion">
              <button
                type="button"
                className="accordion-trigger"
                onClick={() => setIsExtraAccordionOpen(!isExtraAccordionOpen)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Flame size={15} color="var(--crust-terracotta)" />
                  <span>사진 · 오븐 온도/시간 · 주의사항</span>
                  {(temperature || time) && (
                    <span className="tag-badge" style={{ fontSize: 11 }}>
                      {temperature} {time}
                    </span>
                  )}
                </div>
                {isExtraAccordionOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              {isExtraAccordionOpen && (
                <div className="accordion-content">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                    <div className="form-group">
                      <label className="form-label">오븐 온도</label>
                      <input
                        type="text"
                        className="input-text"
                        placeholder="예: 175℃"
                        value={temperature}
                        onChange={(e) => setTemperature(e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">굽는 시간</label>
                      <input
                        type="text"
                        className="input-text"
                        placeholder="예: 35분"
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">주의사항 및 베이킹 팁</label>
                    <textarea
                      rows={2}
                      className="input-text"
                      placeholder="예: 크림화 단계에서 계란 분리 주의, 냉장 휴지 1시간"
                      value={notice}
                      onChange={(e) => setNotice(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Ingredients & Subheadings Section */}
            <div style={{ marginTop: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink-primary)' }}>
                  배합 재료 및 소제목 목록 ({ingredients.length}개)
                </h3>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" className="btn btn-soft btn-sm" onClick={addSubheadingRow}>
                    <FolderPlus size={13} color="var(--crust-terracotta)" />
                    <span>+ 소제목 추가</span>
                  </button>
                  <button type="button" className="btn btn-soft btn-sm" onClick={addIngredientRow}>
                    <Plus size={13} />
                    <span>+ 재료 추가</span>
                  </button>
                </div>
              </div>

              <div className="table-wrapper">
                <table className="artisan-table">
                  <thead>
                    <tr>
                      <th style={{ width: '6%', textAlign: 'center' }}>순서</th>
                      <th style={{ width: '38%' }}>재료명 / 소제목</th>
                      <th style={{ width: '16%' }}>배합량(g)</th>
                      <th style={{ width: '18%' }}>구매단가(원)</th>
                      <th style={{ width: '12%' }}>구매용량(g)</th>
                      <th style={{ width: '6%', textAlign: 'center' }}>가루류</th>
                      <th style={{ width: '4%', textAlign: 'center' }}>삭제</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ingredients.map((ing, idx) => {
                      const isSub = ing.name.startsWith('[소제목') || ing.isSubheading;

                      return (
                        <tr key={idx} className={isSub ? 'subheading-row' : ''}>
                          {/* Reordering buttons */}
                          <td style={{ textAlign: 'center' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
                              <button
                                type="button"
                                className="btn btn-ghost btn-sm"
                                style={{ padding: 2, height: 18 }}
                                onClick={() => moveIngredient(idx, 'up')}
                                disabled={idx === 0}
                              >
                                <ArrowUp size={12} />
                              </button>
                              <button
                                type="button"
                                className="btn btn-ghost btn-sm"
                                style={{ padding: 2, height: 18 }}
                                onClick={() => moveIngredient(idx, 'down')}
                                disabled={idx === ingredients.length - 1}
                              >
                                <ArrowDown size={12} />
                              </button>
                            </div>
                          </td>

                          {/* Ingredient Name / Subheading with autocomplete */}
                          <td>
                            <div className="autocomplete-container">
                              <input
                                type="text"
                                className="input-text input-sm"
                                placeholder={isSub ? '예: [소제목: 소보로]' : '재료명 검색 (예: 박력분)'}
                                value={ing.name}
                                onChange={(e) => handleNameInputChange(idx, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(e, idx)}
                                onFocus={() => {
                                  if (ing.name && !ing.name.startsWith('[')) {
                                    handleNameInputChange(idx, ing.name);
                                  }
                                }}
                              />

                              {/* Autocomplete Dropdown */}
                              {activeIngIndex === idx && autocompleteSuggestions.length > 0 && (
                                <div className="autocomplete-dropdown">
                                  {autocompleteSuggestions.map((item, sIdx) => (
                                    <div
                                      key={item.name}
                                      className={`autocomplete-item ${sIdx === highlightedIndex ? 'highlighted' : ''}`}
                                      onClick={() => selectSuggestion(idx, item)}
                                    >
                                      <span>{item.name}</span>
                                      <span style={{ fontSize: 11, color: 'var(--ink-muted)' }}>
                                        {item.price ? `${item.price}원/${item.weight}g` : ''}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Amount */}
                          <td>
                            {isSub ? (
                              <span style={{ fontSize: 11, color: 'var(--ink-muted)' }}>(소제목 구분행)</span>
                            ) : (
                              <input
                                type="number"
                                step="0.1"
                                className="input-text input-sm num-tabular"
                                value={ing.amount}
                                onChange={(e) => updateIngredient(idx, 'amount', Number(e.target.value))}
                              />
                            )}
                          </td>

                          {/* Package Price */}
                          <td>
                            {!isSub && (
                              <input
                                type="number"
                                step="100"
                                className="input-text input-sm num-tabular"
                                placeholder="0"
                                value={ing.packagePrice}
                                onChange={(e) => updateIngredient(idx, 'packagePrice', Number(e.target.value))}
                              />
                            )}
                          </td>

                          {/* Package Weight */}
                          <td>
                            {!isSub && (
                              <input
                                type="number"
                                step="10"
                                className="input-text input-sm num-tabular"
                                placeholder="1000"
                                value={ing.packageWeight}
                                onChange={(e) => updateIngredient(idx, 'packageWeight', Number(e.target.value))}
                              />
                            )}
                          </td>

                          {/* Is Flour */}
                          <td style={{ textAlign: 'center' }}>
                            {!isSub && (
                              <input
                                type="checkbox"
                                checked={ing.isFlour}
                                onChange={(e) => updateIngredient(idx, 'isFlour', e.target.checked)}
                                title="베이커스% 가루류 기준 체크"
                              />
                            )}
                          </td>

                          {/* Delete Row */}
                          <td style={{ textAlign: 'center' }}>
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              style={{ color: 'var(--danger-red)', padding: 4 }}
                              onClick={() => removeIngredient(idx)}
                            >
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Manufacturing Steps Section */}
            <div style={{ marginTop: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink-primary)' }}>
                  제조 공정 단계 ({steps.length}단계)
                </h3>
                <button type="button" className="btn btn-soft btn-sm" onClick={addStepRow}>
                  <Plus size={13} />
                  <span>+ 단계 추가</span>
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {steps.map((step, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, width: 24, textAlign: 'right' }}>{idx + 1}.</span>
                    <input
                      type="text"
                      className="input-text input-sm"
                      placeholder={`공정 단계 내용 (예: 버터와 설탕을 뽀얗게 크림화합니다.)`}
                      value={step}
                      onChange={(e) => updateStep(idx, e.target.value)}
                    />
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      style={{ color: 'var(--danger-red)' }}
                      onClick={() => removeStep(idx)}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-soft" onClick={onClose}>
              취소
            </button>
            <button type="submit" className="btn btn-primary">
              저장하기
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
