import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  text: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onRemove: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onRemove }) => {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        maxWidth: 360,
        pointerEvents: 'none',
      }}
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onRemove: (id: string) => void }> = ({ toast, onRemove }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(toast.id);
    }, 3500);
    return () => clearTimeout(timer);
  }, [toast.id, onRemove]);

  const isSuccess = toast.type === 'success';
  const isError = toast.type === 'error';

  return (
    <div
      style={{
        pointerEvents: 'auto',
        background: isSuccess ? '#EDF2EE' : isError ? '#FFF5F5' : '#FFFFFF',
        border: `1px solid ${isSuccess ? '#B4CEBC' : isError ? '#FEB2B2' : '#E2DDD5'}`,
        color: isSuccess ? '#174328' : isError ? '#C53030' : '#1C1B18',
        padding: '10px 14px',
        borderRadius: 6,
        boxShadow: '0 4px 12px rgba(28, 27, 24, 0.12)',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        fontSize: 13,
        fontWeight: 600,
        animation: 'toastSlideIn 0.25s ease-out',
      }}
    >
      {isSuccess && <CheckCircle2 size={16} color="#174328" style={{ flexShrink: 0 }} />}
      {isError && <AlertCircle size={16} color="#C53030" style={{ flexShrink: 0 }} />}
      {!isSuccess && !isError && <Info size={16} color="#5C5852" style={{ flexShrink: 0 }} />}

      <span style={{ flex: 1, lineHeight: 1.4 }}>{toast.text}</span>

      <button
        type="button"
        onClick={() => onRemove(toast.id)}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 2,
          color: 'inherit',
          opacity: 0.6,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <X size={14} />
      </button>
    </div>
  );
};
