import React from 'react';
import { Modal } from './Modal';

interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  danger?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Подтвердить',
  danger = true,
}) => {
  return (
    <Modal open={open} onClose={onClose} title={title} maxWidth="sm">
      <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{description}</p>
      <div className="mt-6 flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 min-h-[40px] text-sm font-medium rounded-lg border border-[var(--border-hairline)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] transition-colors whitespace-nowrap shrink-0"
        >
          Отмена
        </button>
        <button
          type="button"
          onClick={() => {
            onConfirm();
            onClose();
          }}
          className={`px-4 py-2 min-h-[40px] text-sm font-medium rounded-lg text-white transition-colors whitespace-nowrap shrink-0 ${
            danger
              ? 'bg-rose-600 hover:bg-rose-700'
              : 'bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)]'
          }`}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
};
