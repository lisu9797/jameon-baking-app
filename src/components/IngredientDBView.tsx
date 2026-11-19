import React, { useState } from 'react';
import { IngredientDBItem, ViewMode } from '../types/erp';
import { formatCurrency, formatNumber, getFormattedToday } from '../utils/calc';
import {
  LayoutGrid,
  List,
  Search,
  Plus,
  Edit2,
  Trash2,
  ExternalLink,
  Calendar,
  X,
  Filter,
} from 'lucide-react';

interface IngredientDBViewProps {
  ingredients: IngredientDBItem[];
  onSaveIngredient: (item: IngredientDBItem) => Promise<void>;
  onDeleteIngredient: (name: string) => Promise<void>;
}

const STORAGE_KEY_ING_VIEW = 'jameon_ing_view_mode';

export const IngredientDBView: React.FC<IngredientDBViewProps> = ({
  ingredients,
  onSaveIngredient,
  onDeleteIngredient,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_ING_VIEW);
    if (saved === 'card' || saved === 'list') return saved;
    return window.innerWidth < 768 ? 'card' : 'list';
  });

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('전체');

  // Edit / Create modal state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<IngredientDBItem | null>(null);

  // Form states
  const [category, setCategory] = useState<string>('식재료');
  const [name, setName] = useState<string>('');
  const [manufacturer, setManufacturer] = useState<string>('');
  const [weight, setWeight] = useState<number>(1000);
  const [unit, setUnit] = useState<string>('g');
  const [price, setPrice] = useState<number>(0);
  const [shop, setShop] = useState<string>('');
  const [link, setLink] = useState<string>('');
  const [note, setNote] = useState<string>('');

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem(STORAGE_KEY_ING_VIEW, mode);
  };

  const categories = ['전체', ...Array.from(new Set(ingredients.map((i) => i.category || '기타'))).filter(Boolean)];

  const filtered = ingredients.filter((item) => {
    const matchesCat = selectedCategory === '전체' || (item.category || '기타') === selectedCategory;
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.shop && item.shop.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.manufacturer && item.manufacturer.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  const openCreateModal = () => {
    setEditingItem(null);
    setCategory('식재료');
    setName('');
    setManufacturer('');
    setWeight(1000);
    setUnit('g');
    setPrice(0);
    setShop('');
    setLink('');
    setNote('');
    setIsModalOpen(true);
  };

  const openEditModal = (item: IngredientDBItem) => {
    setEditingItem(item);
    setCategory(item.category || '식재료');
    setName(item.name);
    setManufacturer(item.manufacturer || '');
    setWeight(item.weight || 1000);
    setUnit(item.unit || 'g');
    setPrice(item.price || 0);
    setShop(item.shop || '');
    setLink(item.link || '');
    setNote(item.note || '');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('재료명을 입력해주세요.');
      return;
    }

    const item: IngredientDBItem = {
      category: category.trim(),
      name: name.trim(),
      manufacturer: manufacturer.trim(),
      weight: Number(weight) || 1000,
      unit: unit.trim() || 'g',
      price: Number(price) || 0,
      shop: shop.trim(),
      link: link.trim(),
      updatedAt: getFormattedToday(), // YYYY.MM.DD auto recording
      note: note.trim(),
    };

    await onSaveIngredient(item);
    setIsModalOpen(false);
  };

  // Format display date
  const formatDisplayDate = (d?: string) => {
    if (!d) return '-';
    // If date is like "Sun Nov 15 2026...", convert to YYYY.MM.DD
    try {
      const parsed = new Date(d);
      if (!isNaN(parsed.getTime())) {
        const y = parsed.getFullYear();
        const m = String(parsed.getMonth() + 1).padStart(2, '0');
        const day = String(parsed.getDate()).padStart(2, '0');
        return `${y}.${m}.${day}`;
      }
    } catch {
      // fallback
    }
    return d.replace(/-/g, '.').slice(0, 10);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Top Bar */}
      <div
        className="paper-card"
        style={{
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: '1 1 260px' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: 280 }}>
            <Search size={15} style={{ position: 'absolute', left: 10, top: 10, color: 'var(--ink-muted)' }} />
            <input
              type="text"
              className="input-text"
              style={{ paddingLeft: 32 }}
              placeholder="재료명, 구매처, 제조사 검색..."
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

          <button className="btn btn-primary btn-sm" onClick={openCreateModal}>
            <Plus size={14} />
            <span>재료 등록</span>
          </button>
        </div>
      </div>

      {/* Quick Category Chips */}
      {categories.length > 2 && (
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4, whiteSpace: 'nowrap' }}>
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              className={`chip ${selectedCategory === c ? 'active' : ''}`}
              onClick={() => setSelectedCategory(c)}
            >
              <span>{c}</span>
              <span className="num-tabular" style={{ fontSize: 11, opacity: 0.8 }}>
                ({c === '전체' ? ingredients.length : ingredients.filter((i) => (i.category || '기타') === c).length})
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Card View */}
      {viewMode === 'card' ? (
        <div className="recipe-cards-grid">
          {filtered.map((item) => {
            const unitPrice = item.weight > 0 ? (item.price / item.weight).toFixed(2) : '0';
            return (
              <div key={item.name} className="paper-card" style={{ padding: 16, margin: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <span className="tag-badge">{item.category || '기타'}</span>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button className="btn btn-ghost btn-sm" style={{ padding: 4 }} onClick={() => openEditModal(item)}>
                      <Edit2 size={13} />
                    </button>
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ color: 'var(--danger-red)', padding: 4 }}
                      onClick={() => {
                        if (confirm(`'${item.name}' 재료를 DB에서 삭제하시겠습니까?`)) {
                          onDeleteIngredient(item.name);
                        }
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--ink-primary)', marginBottom: 4 }}>
                  {item.name}
                </h3>
                {item.manufacturer && (
                  <p style={{ fontSize: 12, color: 'var(--ink-secondary)', marginBottom: 8 }}>
                    제조사: {item.manufacturer}
                  </p>
                )}

                <div
                  style={{
                    background: 'var(--surface-sub)',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    margin: '8px 0',
                    fontSize: 13,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                    <span style={{ color: 'var(--ink-secondary)' }}>구매가:</span>
                    <strong className="num-tabular">
                      {formatCurrency(item.price)} / {formatNumber(item.weight)}
                      {item.unit}
                    </strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--ink-secondary)' }}>단위당 단가:</span>
                    <strong style={{ color: 'var(--forest-green)' }} className="num-tabular">
                      {unitPrice}원/{item.unit}
                    </strong>
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: 12,
                    color: 'var(--ink-muted)',
                    marginTop: 6,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Calendar size={12} />
                    <span>{formatDisplayDate(item.updatedAt)}</span>
                  </div>

                  {item.link ? (
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-ghost btn-sm"
                      style={{ padding: '2px 6px', fontSize: 11 }}
                    >
                      <span>{item.shop || '구매링크'}</span>
                      <ExternalLink size={11} />
                    </a>
                  ) : (
                    <span>{item.shop || '-'}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table List View */
        <div className="table-wrapper">
          <table className="artisan-table">
            <thead>
              <tr>
                <th style={{ width: '10%' }}>분류</th>
                <th style={{ width: '25%' }}>재료명</th>
                <th style={{ width: '15%' }}>제조사</th>
                <th style={{ width: '15%', textAlign: 'right' }}>구매단가 / 용량</th>
                <th style={{ width: '10%', textAlign: 'right' }}>g당 단가</th>
                <th style={{ width: '12%' }}>구매처</th>
                <th style={{ width: '10%' }}>업데이트</th>
                <th style={{ width: '3%', textAlign: 'center' }}>수정</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => {
                const unitPrice = item.weight > 0 ? (item.price / item.weight).toFixed(2) : '0';
                return (
                  <tr key={item.name}>
                    <td>
                      <span className="tag-badge">{item.category || '기타'}</span>
                    </td>
                    <td>
                      <strong>{item.name}</strong>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--ink-secondary)' }}>{item.manufacturer || '-'}</td>
                    <td style={{ textAlign: 'right' }} className="num-tabular">
                      {formatCurrency(item.price)} / {formatNumber(item.weight)}
                      {item.unit}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--forest-green)' }} className="num-tabular">
                      {unitPrice}원
                    </td>
                    <td>
                      {item.link ? (
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            color: 'var(--forest-green)',
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 3,
                            fontSize: 12,
                          }}
                        >
                          <span>{item.shop || '구매처'}</span>
                          <ExternalLink size={11} />
                        </a>
                      ) : (
                        <span style={{ fontSize: 12, color: 'var(--ink-secondary)' }}>{item.shop || '-'}</span>
                      )}
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--ink-muted)' }}>{formatDisplayDate(item.updatedAt)}</td>
                    <td style={{ textAlign: 'center' }}>
                      <button className="btn btn-ghost btn-sm" style={{ padding: 4 }} onClick={() => openEditModal(item)}>
                        <Edit2 size={13} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Ingredient Edit / Create Modal */}
      {isModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editingItem ? '재료 정보 수정' : '새 재료 등록'}</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setIsModalOpen(false)}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">분류 *</label>
                  <input
                    type="text"
                    required
                    className="input-text"
                    placeholder="예: 식재료, 샌드위치, 포장재"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">재료명 *</label>
                  <input
                    type="text"
                    required
                    className="input-text"
                    placeholder="예: 강력분(브레드블랑)"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">제조사 / 브랜드</label>
                  <input
                    type="text"
                    className="input-text"
                    placeholder="예: 대한제분, 에쓰푸드"
                    value={manufacturer}
                    onChange={(e) => setManufacturer(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">구매처</label>
                  <input
                    type="text"
                    className="input-text"
                    placeholder="예: 쿠팡, 비앤씨마켓"
                    value={shop}
                    onChange={(e) => setShop(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">구매 가격 (원) *</label>
                  <input
                    type="number"
                    step="10"
                    required
                    className="input-text num-tabular"
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">구매 중량/용량 *</label>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <input
                      type="number"
                      step="1"
                      required
                      className="input-text num-tabular"
                      value={weight}
                      onChange={(e) => setWeight(Number(e.target.value))}
                    />
                    <input
                      type="text"
                      style={{ width: 60 }}
                      className="input-text"
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">구매 링크 (URL)</label>
                  <input
                    type="url"
                    className="input-text"
                    placeholder="https://..."
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">비고 / 메모</label>
                  <input
                    type="text"
                    className="input-text"
                    placeholder="특이사항, 규격, 보관방법"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-soft" onClick={() => setIsModalOpen(false)}>
                  취소
                </button>
                <button type="submit" className="btn btn-primary">
                  저장하기
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
