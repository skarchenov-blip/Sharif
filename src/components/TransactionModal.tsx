import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { Transaction, TransactionType } from '../types/business';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, getTodayISO } from '../utils/formatters';
import { useBusiness } from '../context/BusinessContext';

interface TransactionModalProps {
  open: boolean;
  onClose: () => void;
  initialType?: TransactionType;
  editingTransaction?: Transaction | null;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  open,
  onClose,
  initialType = 'income',
  editingTransaction = null,
}) => {
  const { data, addTransaction, updateTransaction } = useBusiness();
  const [type, setType] = useState<TransactionType>(initialType);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(INCOME_CATEGORIES[0]);
  const [date, setDate] = useState(getTodayISO());
  const [description, setDescription] = useState('');
  const [clientId, setClientId] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setError('');
    if (editingTransaction) {
      setType(editingTransaction.type);
      setAmount(String(editingTransaction.amount));
      setCategory(editingTransaction.category);
      setDate(editingTransaction.date);
      setDescription(editingTransaction.description);
      setClientId(editingTransaction.clientId || '');
    } else {
      setType(initialType);
      setAmount('');
      setCategory(initialType === 'income' ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0]);
      setDate(getTodayISO());
      setDescription('');
      setClientId('');
    }
  }, [open, initialType, editingTransaction]);

  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const handleTypeSwitch = (nextType: TransactionType) => {
    setType(nextType);
    const nextCats = nextType === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    if (!nextCats.includes(category)) {
      setCategory(nextCats[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = Number(amount.replace(/\s+/g, '').replace(',', '.'));
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError('Укажите корректную сумму больше нуля.');
      return;
    }
    if (!description.trim()) {
      setError('Добавьте краткое описание операции.');
      return;
    }

    const payload = {
      type,
      amount: Math.round(numericAmount),
      category,
      date: date || getTodayISO(),
      description: description.trim(),
      clientId: clientId || undefined,
    };

    if (editingTransaction) {
      updateTransaction(editingTransaction.id, payload);
    } else {
      addTransaction(payload);
    }
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editingTransaction ? 'Редактировать операцию' : 'Новая финансовая операция'}
      subtitle="Запись автоматически обновит общий баланс и аналитику"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Segmented Type Selector */}
        <div>
          <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
            Тип операции
          </label>
          <div className="grid grid-cols-2 gap-1 p-1 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-hairline)]">
            <button
              type="button"
              onClick={() => handleTypeSwitch('income')}
              className={`min-h-[40px] rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                type === 'income'
                  ? 'bg-emerald-600 text-white'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Доход
            </button>
            <button
              type="button"
              onClick={() => handleTypeSwitch('expense')}
              className={`min-h-[40px] rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                type === 'expense'
                  ? 'bg-rose-600 text-white'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Расход
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="tx-amount" className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
              Сумма ({data.profile.currency})
            </label>
            <input
              id="tx-amount"
              type="number"
              min="1"
              step="1"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="150000"
              className="w-full min-h-[42px] px-3.5 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-hairline)] text-sm font-mono-num text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
            />
          </div>

          <div>
            <label htmlFor="tx-date" className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
              Дата операции
            </label>
            <input
              id="tx-date"
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full min-h-[42px] px-3.5 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-hairline)] text-sm font-mono-num text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="tx-category" className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
              Категория
            </label>
            <select
              id="tx-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full min-h-[42px] px-3 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-hairline)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="tx-client" className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
              Клиент (необязательно)
            </label>
            <select
              id="tx-client"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="w-full min-h-[42px] px-3 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-hairline)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
            >
              <option value="">Без привязки к клиенту</option>
              {data.clients.map((cl) => (
                <option key={cl.id} value={cl.id}>
                  {cl.company || cl.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="tx-desc" className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
            Назначение / комментарий
          </label>
          <input
            id="tx-desc"
            type="text"
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={
              type === 'income'
                ? 'Например: Оплата по договору №12'
                : 'Например: Продление облачного хостинга'
            }
            className="w-full min-h-[42px] px-3.5 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-hairline)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
          />
        </div>

        {error && <p className="text-xs font-medium text-rose-500">{error}</p>}

        <div className="pt-2 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 min-h-[40px] rounded-lg text-sm font-medium border border-[var(--border-hairline)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] transition-colors whitespace-nowrap"
          >
            Отмена
          </button>
          <button
            type="submit"
            className="px-5 py-2 min-h-[40px] rounded-lg text-sm font-medium bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white transition-colors whitespace-nowrap"
          >
            {editingTransaction ? 'Сохранить изменения' : 'Добавить запись'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
