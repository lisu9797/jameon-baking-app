import React, { useState, useEffect } from 'react';
import { Recipe, PanDBItem } from '../types/erp';
import {
  calculatePanVolume,
  calculateTargetDoughWeight,
  SPECIFIC_GRAVITY_PRESETS,
  formatNumber,
} from '../utils/calc';
import { Layers, Copy, ArrowRight, Sparkles } from 'lucide-react';

interface PanConverterProps {
  currentRecipe: Recipe;
  currentTotalWeight: number;
  pansDB: PanDBItem[];
  onApplyScale: (scaleFactor: number) => void;
  onDuplicateWithNewPan: (newRecipe: Recipe) => void;
}

export const PanConverter: React.FC<PanConverterProps> = ({
  currentRecipe,
  currentTotalWeight,
  pansDB,
  onApplyScale,
  onDuplicateWithNewPan,
}) => {
  // Current pan info
  const initialPan = pansDB.find((p) => p.name === currentRecipe.panName);
  const [sourcePanName, setSourcePanName] = useState<string>(currentRecipe.panName || (pansDB[0]?.name ?? ''));
  const [sourceVolume, setSourceVolume] = useState<number>(initialPan?.volume || 1000);
  const [sourceFillRatio, setSourceFillRatio] = useState<number>(currentRecipe.fillRatio || initialPan?.fillRatio || 75);

  // Target pan info
  const [targetPanName, setTargetPanName] = useState<string>(pansDB[1]?.name || '');
  const [targetShape, setTargetShape] = useState<string>('원형');
  const [targetDim1, setTargetDim1] = useState<number>(18);
  const [targetDim2, setTargetDim2] = useState<number>(0);
  const [targetDim3, setTargetDim3] = useState<number>(5.5);
  const [targetVolume, setTargetVolume] = useState<number>(1400);
  const [targetFillRatio, setTargetFillRatio] = useState<number>(75);

  // Specific gravity
  const [specificGravity, setSpecificGravity] = useState<number>(currentRecipe.specificGravity || 0.8);

  // When source pan changes
  const handleSourcePanChange = (panName: string) => {
    setSourcePanName(panName);
    const p = pansDB.find((item) => item.name === panName);
    if (p) {
      setSourceVolume(p.volume);
      setSourceFillRatio(p.fillRatio || 75);
    }
  };

  // When target pan changes from preset
  const handleTargetPanPreset = (panName: string) => {
    setTargetPanName(panName);
    const p = pansDB.find((item) => item.name === panName);
    if (p) {
      setTargetShape(p.shape);
      setTargetDim1(p.dim1);
      setTargetDim2(p.dim2);
      setTargetDim3(p.dim3);
      setTargetVolume(p.volume);
      setTargetFillRatio(p.fillRatio || 75);
    }
  };

  // Recalculate target volume when dims change
  useEffect(() => {
    if (targetShape === '원형' || targetShape === '사각') {
      const vol = calculatePanVolume(targetShape, targetDim1, targetDim2, targetDim3);
      if (vol > 0) {
        setTargetVolume(vol);
      }
    }
  }, [targetShape, targetDim1, targetDim2, targetDim3]);

  // Volume ratio scale
  const effectiveSourceCapacity = (sourceVolume * sourceFillRatio) / 100;
  const effectiveTargetCapacity = (targetVolume * targetFillRatio) / 100;
  const volumeScaleRatio =
    effectiveSourceCapacity > 0 ? Math.round((effectiveTargetCapacity / effectiveSourceCapacity) * 100) / 100 : 1;

  // Specific gravity dough calculation
  const targetDoughWeight = calculateTargetDoughWeight(targetVolume, targetFillRatio, specificGravity);
  const gravityScaleRatio =
    currentTotalWeight > 0 && targetDoughWeight > 0
      ? Math.round((targetDoughWeight / currentTotalWeight) * 100) / 100
      : volumeScaleRatio;

  // Duplicate recipe with new pan
  const handleDuplicate = (scale: number, panTitle: string) => {
    const newIngredients = currentRecipe.ingredients.map((ing) => {
      if (ing.name.startsWith('[소제목') || (ing.amount === 0 && ing.packagePrice === 0)) {
        return { ...ing };
      }
      return {
        ...ing,
        amount: Math.round(ing.amount * scale * 10) / 10,
      };
    });

    const duplicated: Recipe = {
      ...currentRecipe,
      name: `${currentRecipe.name} (${panTitle} 변환)`,
      panName: panTitle,
      specificGravity,
      fillRatio: targetFillRatio,
      ingredients: newIngredients,
    };

    onDuplicateWithNewPan(duplicated);
  };

  return (
    <div className="pan-converter-panel" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Top Notice */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--ink-secondary)' }}>
        <Layers size={16} color="var(--forest-green)" />
        <span>구움틀 치수 및 용적(ml), 반죽 비중(g/ml)을 기반으로 최적 배합량을 자동 산출합니다.</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
        {/* Source Pan */}
        <div style={{ background: 'var(--surface-sub)', padding: 14, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-hairline)' }}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8, color: 'var(--ink-primary)' }}>
            1. 현재(기준) 구움틀
          </div>
          <div className="form-group">
            <label className="form-label">구움틀 선택</label>
            <select
              className="select-box"
              value={sourcePanName}
              onChange={(e) => handleSourcePanChange(e.target.value)}
            >
              <option value="">직접 용적 입력</option>
              {pansDB.map((p) => (
                <option key={p.name} value={p.name}>
                  {p.name} ({p.volume}ml)
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div className="form-group">
              <label className="form-label">용적 (ml)</label>
              <input
                type="number"
                className="input-text"
                value={sourceVolume}
                onChange={(e) => setSourceVolume(Number(e.target.value))}
              />
            </div>
            <div className="form-group">
              <label className="form-label">충전율 (%)</label>
              <input
                type="number"
                className="input-text"
                value={sourceFillRatio}
                onChange={(e) => setSourceFillRatio(Number(e.target.value))}
              />
            </div>
          </div>
          <div style={{ fontSize: 12, color: 'var(--ink-muted)' }}>
            유효 충전 용적: <strong className="num-tabular">{Math.round(effectiveSourceCapacity)} ml</strong>
          </div>
        </div>

        {/* Target Pan */}
        <div style={{ background: 'var(--surface-sub)', padding: 14, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-hairline)' }}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8, color: 'var(--ink-primary)' }}>
            2. 변경할 대상 구움틀
          </div>
          <div className="form-group">
            <label className="form-label">DB에서 선택 또는 치수 입력</label>
            <select
              className="select-box"
              value={targetPanName}
              onChange={(e) => handleTargetPanPreset(e.target.value)}
            >
              <option value="">직접 치수 입력</option>
              {pansDB.map((p) => (
                <option key={p.name} value={p.name}>
                  {p.name} ({p.volume}ml)
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            <div className="form-group">
              <label className="form-label">모양</label>
              <select
                className="select-box"
                value={targetShape}
                onChange={(e) => setTargetShape(e.target.value)}
              >
                <option value="원형">원형</option>
                <option value="사각">사각</option>
                <option value="직접입력">기타</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">{targetShape === '원형' ? '지름(cm)' : '가로(cm)'}</label>
              <input
                type="number"
                step="0.5"
                className="input-text"
                value={targetDim1}
                onChange={(e) => setTargetDim1(Number(e.target.value))}
              />
            </div>
            {targetShape === '사각' ? (
              <div className="form-group">
                <label className="form-label">세로(cm)</label>
                <input
                  type="number"
                  step="0.5"
                  className="input-text"
                  value={targetDim2}
                  onChange={(e) => setTargetDim2(Number(e.target.value))}
                />
              </div>
            ) : null}
            <div className="form-group">
              <label className="form-label">높이(cm)</label>
              <input
                type="number"
                step="0.5"
                className="input-text"
                value={targetDim3}
                onChange={(e) => setTargetDim3(Number(e.target.value))}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div className="form-group">
              <label className="form-label">계산된 용적 (ml)</label>
              <input
                type="number"
                className="input-text"
                value={targetVolume}
                onChange={(e) => setTargetVolume(Number(e.target.value))}
              />
            </div>
            <div className="form-group">
              <label className="form-label">권장 충전율 (%)</label>
              <input
                type="number"
                className="input-text"
                value={targetFillRatio}
                onChange={(e) => setTargetFillRatio(Number(e.target.value))}
              />
            </div>
          </div>
          <div style={{ fontSize: 12, color: 'var(--ink-muted)' }}>
            유효 충전 용적: <strong className="num-tabular">{Math.round(effectiveTargetCapacity)} ml</strong>
          </div>
        </div>
      </div>

      {/* Specific Gravity Chips */}
      <div style={{ background: 'var(--surface-paper)', padding: 14, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-hairline)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--ink-primary)' }}>
            3. 반죽 비중 (g/ml) 빠른 선택
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, color: 'var(--ink-secondary)' }}>현재 설정 비중:</span>
            <input
              type="number"
              step="0.01"
              style={{ width: 80 }}
              className="input-text input-sm num-tabular"
              value={specificGravity}
              onChange={(e) => setSpecificGravity(Number(e.target.value))}
            />
            <span style={{ fontSize: 12, color: 'var(--ink-muted)' }}>g/ml</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {SPECIFIC_GRAVITY_PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              className={`chip ${Math.abs(specificGravity - preset.value) < 0.01 ? 'active' : ''}`}
              onClick={() => setSpecificGravity(preset.value)}
              title={preset.desc}
            >
              <span>{preset.label}</span>
              <span className="num-tabular">({preset.value})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Result Metrics & Actions */}
      <div
        style={{
          background: 'var(--forest-tint)',
          padding: 16,
          borderRadius: 'var(--radius-sm)',
          border: '1px solid #C3D9C8',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          <div>
            <div style={{ fontSize: 12, color: 'var(--forest-green)', fontWeight: 600 }}>용적비 기반 배율</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--forest-green)' }} className="num-tabular">
              {volumeScaleRatio}배
            </div>
            <div style={{ fontSize: 11, color: 'var(--ink-secondary)' }}>
              ({formatNumber(effectiveSourceCapacity)}ml ➔ {formatNumber(effectiveTargetCapacity)}ml)
            </div>
          </div>

          <div>
            <div style={{ fontSize: 12, color: 'var(--forest-green)', fontWeight: 600 }}>비중 기준 권장 반죽량</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--forest-green)' }} className="num-tabular">
              {formatNumber(targetDoughWeight)} g
            </div>
            <div style={{ fontSize: 11, color: 'var(--ink-secondary)' }}>
              (용적 × 충전율 {targetFillRatio}% × 비중 {specificGravity})
            </div>
          </div>

          <div>
            <div style={{ fontSize: 12, color: 'var(--forest-green)', fontWeight: 600 }}>반죽량 맞춤 배율</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--forest-green)' }} className="num-tabular">
              {gravityScaleRatio}배
            </div>
            <div style={{ fontSize: 11, color: 'var(--ink-secondary)' }}>
              (현재 {formatNumber(currentTotalWeight)}g ➔ 목표 {formatNumber(targetDoughWeight)}g)
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', paddingTop: 8, borderTop: '1px solid #D5E5DA' }}>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => onApplyScale(gravityScaleRatio > 0 ? gravityScaleRatio : volumeScaleRatio)}
          >
            <Sparkles size={14} />
            <span>이 화면에 배율 즉시 적용 ({gravityScaleRatio}배)</span>
          </button>

          <button
            className="btn btn-soft btn-sm"
            onClick={() =>
              handleDuplicate(
                gravityScaleRatio > 0 ? gravityScaleRatio : volumeScaleRatio,
                targetPanName || `${targetShape} ${targetDim1}cm 틀`
              )
            }
          >
            <Copy size={14} />
            <span>새 레시피로 복제 저장</span>
          </button>
        </div>
      </div>
    </div>
  );
};
