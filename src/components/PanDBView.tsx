import React, { useState, useEffect } from 'react';
import { PanDBItem, ViewMode } from '../types/erp';
import { calculatePanVolume, formatNumber, getFormattedToday } from '../utils/calc';
import {
  LayoutGrid,
  List,
  Search,
  Plus,
  Edit2,
  Trash2,
  Layers,
  X,
  Filter,
} from 'lucide-react';

interface PanDBViewProps {
  pans: PanDBItem[];
  onSavePan: (pan: PanDBItem) => Promise<void>;
  onDeletePan: (name: string) => Promise<void>;
}

const STORAGE_KEY_PAN_VIEW = 'jameon_pan_view_mode';

export const PanDBView: React.FC<PanDBViewProps> = ({ pans, onSavePan, onDeletePan }) => {
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PAN_VIEW);
    if (saved === 'card' || saved === 'list') return saved;
    return window.innerWidth < 768 ? 'card' : 'list';
  });

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('전체');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingPan, setEditingPan] = useState<PanDBItem | null>(null);

  // Form states
  const [category, setCategory] = useState<string>('원형틀');
  const [name, setName] = useState<string>('');
  const [shape, setShape] = useState<string>('원형');
  const [dim1, setDim1] = useState<number>(15);
  const [dim2, setDim2] = useState<number>(0);
  const [dim3, setDim3] = useState<number>(5);
  const [volume, setVolume] = useState<number>(884);
  const [fillRatio, setFillRatio] = useState<number>(75);
  const [note, setNote] = useState<string>('');

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem(STORAGE_KEY_PAN_VIEW, mode);
  };

  const categories = ['전체', ...Array.from(new Set(pans.map((p) => p.category || '기타'))).filter(Boolean)];

  const filtered = pans.filter((p) => {
    const matchesCat = selectedCategory === '전체' || (p.category || '기타') === selectedCategory;
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.note && p.note.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  // Auto calculate volume when dims change in modal
  useEffect(() => {
    if (shape === '원형' || shape === '사각') {
      const vol = calculatePanVolume(shape, dim1, dim2, dim3);
      if (vol > 0) setVolume(vol);
    }
  }, [shape, dim1, dim2, dim3]);

  const openCreateModal = () => {
    setEditingPan(null);
    setCategory('원형틀');
    setName('');
    setShape('원형');
    setDim1(15);
    setDim2(0);
    setDim3(5);
    setVolume(884);
    setFillRatio(75);
    setNote('');
    setIsModalOpen(true);
  };

  const openEditModal = (pan: PanDBItem) => {
    setEditingPan(pan);
    setCategory(pan.category || '원형틀');
    setName(pan.name);
    setShape(pan.shape || '원형');
    setDim1(pan.dim1 || 0);
    setDim2(pan.dim2 || 0);
    setDim3(pan.dim3 || 0);
    setVolume(pan.volume || 0);
    setFillRatio(pan.fillRatio || 75);
    setNote(pan.note || '');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('구움틀 이름을 입력해주세요.');
      return;
    }

    const item: PanDBItem = {
      category: category.trim(),
      name: name.trim(),
      shape,
      dim1: Number(dim1) || 0,
      dim2: Number(dim2) || 0,
      dim3: Number(dim3) || 0,
      volume: Number(volume) || 0,
      fillRatio: Number(fillRatio) || 75,
      note: note.trim(),
      updatedAt: getFormattedToday(),
    };

    await onSavePan(item);
    setIsModalOpen(false);
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
              placeholder="구움틀명, 규격, 비고 검색..."
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
            <span>구움틀 등록</span>
          </button>
        </div>
      </div>

      {/* Card View */}
      {viewMode === 'card' ? (
        <div className="recipe-cards-grid">
          {filtered.map((pan) => (
            <div key={pan.name} className="paper-card" style={{ padding: 16, margin: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <span className="tag-badge">{pan.category || '틀'}</span>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button className="btn btn-ghost btn-sm" style={{ padding: 4 }} onClick={() => openEditModal(pan)}>
                    <Edit2 size={13} />
                  </button>
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ color: 'var(--danger-red)', padding: 4 }}
                    onClick={() => {
                      if (confirm(`'${pan.name}' 구움틀을 DB에서 삭제하시겠습니까?`)) {
                        onDeletePan(pan.name);
                      }
                    }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--ink-primary)', marginBottom: 4 }}>
                {pan.name}
              </h3>

              <div
                style={{
                  background: 'var(--surface-sub)',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-sm)',
                  margin: '8px 0',
                  fontSize: 13,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ color: 'var(--ink-secondary)' }}>치수 ({pan.shape}):</span>
                  <strong>
                    {pan.shape === '원형' ? `Ø${pan.dim1} × H${pan.dim3}cm` : `${pan.dim1}×${pan.dim2}×${pan.dim3}cm`}
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ color: 'var(--ink-secondary)' }}>용적:</span>
                  <strong style={{ color: 'var(--forest-green)' }} className="num-tabular">
                    {formatNumber(pan.volume)} ml
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--ink-secondary)' }}>권장 충전율:</span>
                  <span className="num-tabular">{pan.fillRatio || 75}%</span>
                </div>
              </div>

              {pan.note && (
                <div style={{ fontSize: 12, color: 'var(--ink-muted)', marginTop: 4 }}>
                  비고: {pan.note}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        /* Table List View */
        <div className="table-wrapper">
          <table className="artisan-table">
            <thead>
              <tr>
                <th style={{ width: '12%' }}>분류</th>
                <th style={{ width: '28%' }}>틀이름</th>
                <th style={{ width: '10%' }}>모양</th>
                <th style={{ width: '18%' }}>규격 치수 (cm)</th>
                <th style={{ width: '12%', textAlign: 'right' }}>용적 (ml)</th>
                <th style={{ width: '10%', textAlign: 'right' }}>권장충전율</th>
                <th style={{ width: '10%' }}>비고</th>
                <th style={{ width: '4%', textAlign: 'center' }}>수정</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((pan) => (
                <tr key={pan.name}>
                  <td>
                    <span className="tag-badge">{pan.category || '기타'}</span>
                  </td>
                  <td>
                    <strong>{pan.name}</strong>
                  </td>
                  <td>{pan.shape}</td>
                  <td style={{ fontSize: 12, color: 'var(--ink-secondary)' }}>
                    {pan.shape === '원형'
                      ? `지름 ${pan.dim1} × 높이 ${pan.dim3}`
                      : `${pan.dim1} × ${pan.dim2} × ${pan.dim3}`}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--forest-green)' }} className="num-tabular">
                    {formatNumber(pan.volume)} ml
                  </td>
                  <td style={{ textAlign: 'right' }} className="num-tabular">
                    {pan.fillRatio || 75}%
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--ink-muted)' }}>{pan.note || '-'}</td>
                  <td style={{ textAlign: 'center' }}>
                    <button className="btn btn-ghost btn-sm" style={{ padding: 4 }} onClick={() => openEditModal(pan)}>
                      <Edit2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pan Edit / Create Modal */}
      {isModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editingPan ? '구움틀 수정' : '새 구움틀 등록'}</h3>
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
                    placeholder="예: 원형틀, 파운드틀, 사각틀"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">구움틀 이름 *</label>
                  <input
                    type="text"
                    required
                    className="input-text"
                    placeholder="예: 원형틀 2호 (18cm)"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">모양 *</label>
                  <select className="select-box" value={shape} onChange={(e) => setShape(e.target.value)}>
                    <option value="원형">원형</option>
                    <option value="사각">사각</option>
                    <option value="직접입력">직접입력(기타)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">{shape === '원형' ? '지름 (cm)' : '가로 (cm)'}</label>
                  <input
                    type="number"
                    step="0.1"
                    className="input-text num-tabular"
                    value={dim1}
                    onChange={(e) => setDim1(Number(e.target.value))}
                  />
                </div>

                {shape === '사각' && (
                  <div className="form-group">
                    <label className="form-label">세로 (cm)</label>
                    <input
                      type="number"
                      step="0.1"
                      className="input-text num-tabular"
                      value={dim2}
                      onChange={(e) => setDim2(Number(e.target.value))}
                    />
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">높이 (cm)</label>
                  <input
                    type="number"
                    step="0.1"
                    className="input-text num-tabular"
                    value={dim3}
                    onChange={(e) => setDim3(Number(e.target.value))}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">용적 (ml) *</label>
                  <input
                    type="number"
                    required
                    className="input-text num-tabular"
                    value={volume}
                    onChange={(e) => setVolume(Number(e.target.value))}
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

                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">비고 / 메모</label>
                  <input
                    type="text"
                    className="input-text"
                    placeholder="용도, 제누와즈 기준 등"
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
