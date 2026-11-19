import React, { useState } from 'react';
import { Recipe, IngredientDBItem } from '../types/erp';
import { parseRecipeText, runOcrOnImage, readExcelFile } from '../utils/parser';
import {
  X,
  FileText,
  Camera,
  FileSpreadsheet,
  Upload,
  Check,
  Loader2,
  AlertCircle,
  Eye,
} from 'lucide-react';

interface QuickImportModalProps {
  isOpen: boolean;
  ingredientDB: IngredientDBItem[];
  onClose: () => void;
  onImportRecipe: (recipe: Recipe) => void;
  onImportMultipleRecipes?: (recipes: Recipe[]) => void;
}

export const QuickImportModal: React.FC<QuickImportModalProps> = ({
  isOpen,
  ingredientDB,
  onClose,
  onImportRecipe,
  onImportMultipleRecipes,
}) => {
  const [activeTab, setActiveTab] = useState<'text' | 'ocr' | 'excel'>('text');

  // Text tab state
  const [pastedText, setPastedText] = useState<string>('');

  // OCR tab state
  const [ocrLoading, setOcrLoading] = useState<boolean>(false);
  const [ocrProgress, setOcrProgress] = useState<number>(0);
  const [ocrStatusText, setOcrStatusText] = useState<string>('');
  const [ocrResultText, setOcrResultText] = useState<string>('');

  // Excel tab state
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [excelSheetNames, setExcelSheetNames] = useState<string[]>([]);
  const [selectedSheets, setSelectedSheets] = useState<{ [sheetName: string]: boolean }>({});
  const [excelParser, setExcelParser] = useState<((name: string, db: IngredientDBItem[]) => Recipe) | null>(null);

  // Preview state
  const [previewRecipe, setPreviewRecipe] = useState<Partial<Recipe> | null>(null);

  if (!isOpen) return null;

  // 1. Text Parsing Preview
  const handleParseText = () => {
    if (!pastedText.trim()) return;
    const parsed = parseRecipeText(pastedText, ingredientDB);
    setPreviewRecipe(parsed);
  };

  // 2. OCR File Selection
  const handleOcrFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setOcrLoading(true);
      setOcrProgress(0);
      setOcrStatusText('OCR 엔진 초기화 중...');

      const text = await runOcrOnImage(file, (progress, status) => {
        setOcrProgress(progress);
        setOcrStatusText(status);
      });

      setOcrResultText(text);
      const parsed = parseRecipeText(text, ingredientDB);
      setPreviewRecipe(parsed);
    } catch (err: any) {
      console.error(err);
      alert('OCR 텍스트 인식 실패: ' + (err.message || '다시 시도해주세요.'));
    } finally {
      setOcrLoading(false);
    }
  };

  // 3. Excel File Selection
  const handleExcelFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const { sheetNames, parseSheet } = await readExcelFile(file);
      setExcelFile(file);
      setExcelSheetNames(sheetNames);
      setExcelParser(() => parseSheet);

      // Select all sheets by default
      const initialSelection: { [name: string]: boolean } = {};
      sheetNames.forEach((name) => {
        // filter out DB sheets from automatic selection
        if (name !== '재료DB' && name !== '구움틀DB' && name !== '시트1') {
          initialSelection[name] = true;
        }
      });
      setSelectedSheets(initialSelection);

      // Preview the first selected sheet
      const firstSheet = sheetNames.find((s) => initialSelection[s]);
      if (firstSheet) {
        setPreviewRecipe(parseSheet(firstSheet, ingredientDB));
      }
    } catch (err: any) {
      console.error(err);
      alert('엑셀 파일 파싱 오류: ' + (err.message || ''));
    }
  };

  // Apply Single Import
  const handleApplySingle = (recipeToApply: Partial<Recipe>) => {
    const completeRecipe: Recipe = {
      name: recipeToApply.name || '새 레시피',
      category: recipeToApply.category || '제과',
      baseYield: recipeToApply.baseYield || 1,
      price: recipeToApply.price || 0,
      packagingCost: recipeToApply.packagingCost || 0,
      panName: recipeToApply.panName || '',
      specificGravity: recipeToApply.specificGravity || 0,
      fillRatio: recipeToApply.fillRatio || 75,
      image: recipeToApply.image || '',
      notice: recipeToApply.notice || '',
      temperature: recipeToApply.temperature || '',
      time: recipeToApply.time || '',
      ingredients: recipeToApply.ingredients || [],
      steps: recipeToApply.steps || [],
    };

    onImportRecipe(completeRecipe);
    onClose();
  };

  // Apply Batch Excel Import
  const handleApplyBatchExcel = () => {
    if (!excelParser) return;
    const targets = Object.keys(selectedSheets).filter((name) => selectedSheets[name]);
    if (targets.length === 0) {
      alert('등록할 시트를 1개 이상 선택해주세요.');
      return;
    }

    const recipes: Recipe[] = targets.map((sheetName) => excelParser(sheetName, ingredientDB));

    if (recipes.length === 1) {
      onImportRecipe(recipes[0]);
    } else if (onImportMultipleRecipes) {
      onImportMultipleRecipes(recipes);
    }
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">레시피 간편 등록 (텍스트 · OCR 사진 · 엑셀)</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="nav-tabs" style={{ padding: '0 20px', marginBottom: 0, background: 'var(--surface-sub)' }}>
          <button
            type="button"
            className={`nav-tab-btn ${activeTab === 'text' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('text');
              setPreviewRecipe(null);
            }}
          >
            <FileText size={15} />
            <span>1. 텍스트 붙여넣기</span>
          </button>
          <button
            type="button"
            className={`nav-tab-btn ${activeTab === 'ocr' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('ocr');
              setPreviewRecipe(null);
            }}
          >
            <Camera size={15} />
            <span>2. 손글씨 · 사진 OCR</span>
          </button>
          <button
            type="button"
            className={`nav-tab-btn ${activeTab === 'excel' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('excel');
              setPreviewRecipe(null);
            }}
          >
            <FileSpreadsheet size={15} />
            <span>3. 엑셀 파일 (.xlsx)</span>
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Tab 1: Text Paste */}
          {activeTab === 'text' && (
            <div>
              <p style={{ fontSize: 13, color: 'var(--ink-secondary)', marginBottom: 8 }}>
                카카오톡, 메모장, 블로그 등에서 복사한 레시피 텍스트를 그대로 붙여넣으면 소제목, 재료, 수량, 공정을 자동으로 파싱합니다.
              </p>
              <textarea
                rows={8}
                className="input-text"
                placeholder={`[레시피명: 소금빵]
기준생산수량: 8
판매가: 3000

[소제목: 본반죽]
강력분 250g
물 160g
인스턴트드라이이스트 3g
설탕 15g
소금 4g
버터 15g

[제조공정]
1. 버터를 제외한 재료를 믹싱합니다.
2. 클린업 단계에서 버터를 넣고 최종 단계까지 믹싱합니다.`}
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
              />

              <div style={{ marginTop: 10, display: 'flex', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-primary btn-sm" onClick={handleParseText}>
                  <Eye size={14} />
                  <span>파싱 및 미리보기</span>
                </button>
              </div>
            </div>
          )}

          {/* Tab 2: OCR Upload */}
          {activeTab === 'ocr' && (
            <div>
              <p style={{ fontSize: 13, color: 'var(--ink-secondary)', marginBottom: 8 }}>
                손으로 쓴 베이킹 노트나 레시피 책 사진을 업로드하면 한국어+영어 OCR로 텍스트를 자동 판독합니다.
              </p>

              <div
                style={{
                  border: '2px dashed var(--border-hairline)',
                  borderRadius: 'var(--radius-sm)',
                  padding: 30,
                  textAlign: 'center',
                  background: 'var(--surface-sub)',
                  cursor: 'pointer',
                }}
                onClick={() => document.getElementById('ocr-file-input')?.click()}
              >
                <input
                  id="ocr-file-input"
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleOcrFileChange}
                />
                <Camera size={32} style={{ margin: '0 auto 10px', color: 'var(--forest-green)' }} />
                <div style={{ fontWeight: 700, fontSize: 14 }}>레시피 사진 선택 또는 촬영</div>
                <div style={{ fontSize: 12, color: 'var(--ink-muted)', marginTop: 4 }}>
                  JPG, PNG, WEBP 지원 (밝고 선명할수록 인식률이 높습니다)
                </div>
              </div>

              {ocrLoading && (
                <div style={{ marginTop: 14, background: 'var(--surface-accent)', padding: 12, borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600 }}>
                    <Loader2 size={15} className="spin-icon" />
                    <span>{ocrStatusText} ({ocrProgress}%)</span>
                  </div>
                  <div style={{ width: '100%', height: 6, background: '#E2DDD5', borderRadius: 3, marginTop: 6, overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${ocrProgress}%`,
                        height: '100%',
                        background: 'var(--forest-green)',
                        transition: 'width 0.2s',
                      }}
                    />
                  </div>
                </div>
              )}

              {ocrResultText && !ocrLoading && (
                <div style={{ marginTop: 14 }}>
                  <label className="form-label">인식된 텍스트 (오탈자 수정 가능):</label>
                  <textarea
                    rows={6}
                    className="input-text"
                    value={ocrResultText}
                    onChange={(e) => {
                      setOcrResultText(e.target.value);
                      setPreviewRecipe(parseRecipeText(e.target.value, ingredientDB));
                    }}
                  />
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Excel Upload */}
          {activeTab === 'excel' && (
            <div>
              <p style={{ fontSize: 13, color: 'var(--ink-secondary)', marginBottom: 8 }}>
                기존 구글 시트 백업본 또는 엑셀(`.xlsx`, `.xls`, `.csv`) 파일을 등록합니다. 여러 시트를 선택해 일괄 등록할 수도 있습니다.
              </p>

              <div
                style={{
                  border: '2px dashed var(--border-hairline)',
                  borderRadius: 'var(--radius-sm)',
                  padding: 24,
                  textAlign: 'center',
                  background: 'var(--surface-sub)',
                  cursor: 'pointer',
                  marginBottom: 16,
                }}
                onClick={() => document.getElementById('excel-file-input')?.click()}
              >
                <input
                  id="excel-file-input"
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  style={{ display: 'none' }}
                  onChange={handleExcelFileChange}
                />
                <FileSpreadsheet size={32} style={{ margin: '0 auto 10px', color: 'var(--forest-green)' }} />
                <div style={{ fontWeight: 700, fontSize: 14 }}>
                  {excelFile ? excelFile.name : '엑셀 파일(.xlsx) 선택'}
                </div>
                <div style={{ fontSize: 12, color: 'var(--ink-muted)', marginTop: 4 }}>
                  다중 시트가 포함된 파일의 경우 시트별로 레시피가 개별 추출됩니다.
                </div>
              </div>

              {excelSheetNames.length > 0 && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 700 }}>
                      시트 선택 ({Object.values(selectedSheets).filter(Boolean).length}개 선택됨):
                    </span>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => {
                        const all: { [name: string]: boolean } = {};
                        excelSheetNames.forEach((n) => (all[n] = true));
                        setSelectedSheets(all);
                      }}
                    >
                      전체 선택
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, maxHeight: 120, overflowY: 'auto' }}>
                    {excelSheetNames.map((sheetName) => (
                      <label
                        key={sheetName}
                        className={`chip ${selectedSheets[sheetName] ? 'active' : ''}`}
                        style={{ cursor: 'pointer' }}
                      >
                        <input
                          type="checkbox"
                          checked={Boolean(selectedSheets[sheetName])}
                          onChange={(e) => {
                            const updated = { ...selectedSheets, [sheetName]: e.target.checked };
                            setSelectedSheets(updated);
                            if (e.target.checked && excelParser) {
                              setPreviewRecipe(excelParser(sheetName, ingredientDB));
                            }
                          }}
                          style={{ display: 'none' }}
                        />
                        <span>{sheetName}</span>
                      </label>
                    ))}
                  </div>

                  <div style={{ marginTop: 14 }}>
                    <button type="button" className="btn btn-primary btn-sm" onClick={handleApplyBatchExcel}>
                      <Upload size={14} />
                      <span>선택한 시트 일괄 레시피 등록 ({Object.values(selectedSheets).filter(Boolean).length}건)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Parsed Preview Section */}
          {previewRecipe && (
            <div
              style={{
                marginTop: 8,
                borderTop: '1px solid var(--border-hairline)',
                paddingTop: 16,
                background: 'var(--surface-sub)',
                padding: 16,
                borderRadius: 'var(--radius-sm)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <h4 style={{ fontSize: 14, fontWeight: 800, color: 'var(--forest-green)' }}>
                  파싱 미리보기: {previewRecipe.name} ({previewRecipe.baseYield}개 분량)
                </h4>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => handleApplySingle(previewRecipe)}
                >
                  <Check size={14} />
                  <span>이 레시피로 즉시 등록</span>
                </button>
              </div>

              <div style={{ fontSize: 12, color: 'var(--ink-secondary)', marginBottom: 10 }}>
                재료 {previewRecipe.ingredients?.length || 0}종 | 공정 {previewRecipe.steps?.length || 0}단계
                {previewRecipe.price ? ` | 판매가 ${previewRecipe.price.toLocaleString()}원` : ''}
              </div>

              <div className="table-wrapper" style={{ maxHeight: 200, overflowY: 'auto' }}>
                <table className="artisan-table">
                  <thead>
                    <tr>
                      <th>재료명 / 소제목</th>
                      <th style={{ textAlign: 'right' }}>배합량(g)</th>
                      <th style={{ textAlign: 'center' }}>가루류</th>
                      <th style={{ textAlign: 'right' }}>단가매칭(원)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewRecipe.ingredients?.map((ing, i) => (
                      <tr key={i} className={ing.name.startsWith('[소제목') ? 'subheading-row' : ''}>
                        <td>{ing.name}</td>
                        <td style={{ textAlign: 'right' }} className="num-tabular">
                          {ing.name.startsWith('[소제목') ? '-' : `${ing.amount}g`}
                        </td>
                        <td style={{ textAlign: 'center' }}>{ing.isFlour ? 'Y' : '-'}</td>
                        <td style={{ textAlign: 'right' }} className="num-tabular">
                          {ing.packagePrice > 0 ? `${ing.packagePrice.toLocaleString()}원` : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-soft" onClick={onClose}>
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
