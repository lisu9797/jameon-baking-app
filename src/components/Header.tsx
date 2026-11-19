import React from 'react';
import { TabType } from '../types/erp';
import { ChefHat, Database, Box, RefreshCw, Plus, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface HeaderProps {
  currentTab: TabType;
  onTabChange: (tab: TabType) => void;
  recipeCount: number;
  ingredientCount: number;
  panCount: number;
  syncStatus: 'idle' | 'syncing' | 'synced' | 'error';
  lastSyncTime: string | null;
  onSync: () => void;
  onOpenNewRecipe: () => void;
  onOpenQuickImport: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onTabChange,
  recipeCount,
  ingredientCount,
  panCount,
  syncStatus,
  lastSyncTime,
  onSync,
  onOpenNewRecipe,
  onOpenQuickImport,
}) => {
  return (
    <header className="top-header">
      <div className="brand-section">
        <span className="brand-badge">ERP v14</span>
        <div>
          <h1 className="brand-title">잠언베이글 베이킹 ERP</h1>
          <p className="brand-subtitle">베이킹 배합 · 원가 · 구움틀 변환 · 작업지시서 관리</p>
        </div>
      </div>

      <div className="header-actions">
        {/* Sync Status Badge */}
        <div
          className={`sync-badge ${
            syncStatus === 'syncing' ? 'syncing' : syncStatus === 'synced' ? 'synced' : syncStatus === 'error' ? 'error' : ''
          }`}
          title={lastSyncTime ? `마지막 동기화: ${new Date(lastSyncTime).toLocaleTimeString('ko-KR')}` : '동기화 이력 없음'}
        >
          {syncStatus === 'syncing' && <Loader2 size={13} className="spin-icon" />}
          {syncStatus === 'synced' && <CheckCircle2 size={13} />}
          {syncStatus === 'error' && <AlertCircle size={13} />}
          {syncStatus === 'idle' && <Database size={13} />}
          <span>
            {syncStatus === 'syncing'
              ? '시트 동기화 중...'
              : syncStatus === 'synced'
              ? '구글 시트 연동됨'
              : syncStatus === 'error'
              ? '시트 연결 오류'
              : '시트 연동 대기'}
          </span>
        </div>

        <button className="btn btn-soft btn-sm" onClick={onSync} disabled={syncStatus === 'syncing'} title="구글 시트에서 최신 데이터 가져오기">
          <RefreshCw size={14} className={syncStatus === 'syncing' ? 'spin-icon' : ''} />
          <span>시트 동기화</span>
        </button>

        <button className="btn btn-soft btn-sm" onClick={onOpenQuickImport} title="텍스트, 손글씨 사진 OCR, 엑셀 파일 간편 등록">
          <FileText size={14} />
          <span>간편 등록</span>
        </button>

        <button className="btn btn-primary btn-sm" onClick={onOpenNewRecipe} title="새 베이킹 레시피 작성">
          <Plus size={14} />
          <span>새 레시피</span>
        </button>
      </div>
    </header>
  );
};
