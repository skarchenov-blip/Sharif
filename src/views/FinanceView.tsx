import React, { useMemo, useState } from 'react';
import {
  Plus,
  Search,
  Download,
  Pencil,
  Trash2,
  ArrowUpDown,
} from 'lucide-react';
import { useBusiness } from '../context/BusinessContext';
import { Transaction, TransactionType } from '../types/business';
import {
  EXPENSE_CATEGORIES,
  formatDateRu,
  formatMoney,
  INCOME_CATEGORIES,
} from '../utils/formatters';
import { TransactionModal } from '../components/TransactionModal';
import { ConfirmModal } from '../components/ConfirmModal';

export const FinanceView: React.FC = () => {
  const { data, deleteTransaction, notify } = useBusiness();
  const { transactions, clients, profile } = data;

  const [typeFilter, setTypeFilter] = useState<'all' | TransactionType>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'amount_desc'>('date_desc');

  const [modalOpen, setModalOpen] = useState(false);
  const [initialType, setInitialType] = useState<TransactionType>('income');
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null);

  const allCategories = useMemo(
    () => Array.from(new Set([...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES])),
    []
  );

  const clientMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of clients) {
      map.set(c.id, c.company || c.name);
    }
    return map;
  }, [clients]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return transactions
      .filter((tx) => {
        if (typeFilter !== 'all' && tx.type !== typeFilter) return false;
        if (categoryFilter !== 'all' && tx.category !== categoryFilter) return false;
        if (q) {
          const clientName = tx.clientId ? (clientMap.get(tx.clientId) || '').toLowerCase() : '';
          const match =
            tx.description.toLowerCase().includes(q) ||
            tx.category.toLowerCase().includes(q) ||
            clientName.includes(q);
          if (!match) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'date_asc') return a.date.localeCompare(b.date);
        if (sortBy === 'amount_desc') return b.amount - a.amount;
        return b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt);
      });
  }, [transactions, typeFilter, categoryFilter, search, sortBy, clientMap]);

  // Automatic calculation of overall and filtered profit
  const summary = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const tx of filtered) {
      if (tx.type === 'income') income += tx.amount;
      else expense += tx.amount;
    }
    const profit = income - expense;
    const margin = income > 0 ? Math.round((profit / income) * 100) : 0;
    return { income, expense, profit, margin };
  }, [filtered]);

  const handleOpenAdd = (type: TransactionType) => {
    setEditingTx(null);
    setInitialType(type);
    setModalOpen(true);
  };

  const handleOpenEdit = (tx: Transaction) => {
    setEditingTx(tx);
    setInitialType(tx.type);
    setModalOpen(true);
  };

  const handleExportCsv = () => {
    const header = ['Дата', 'Тип', 'Категория', 'Описание', 'Клиент', 'Сумма'];
    const rows = filtered.map((tx) => [
      formatDateRu(tx.date),
      tx.type === 'income' ? 'Доход' : 'Расход',
      tx.category,
      `"${tx.description.replace(/"/g, '""')}"`,
      tx.clientId ? `"${(clientMap.get(tx.clientId) || '').replace(/"/g, '""')}"` : '—',
      tx.type === 'income' ? String(tx.amount) : `-${tx.amount}`,
    ]);
    const csv = '\uFEFF' + [header.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `finance-report-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    notify('Отчёт CSV экспортирован');
  };

  return (
    <div className="space-y-6">
      {/* Auto-calculated Financial Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)]">
          <div className="text-xs text-[var(--text-muted)]">Доходы (по выборке)</div>
          <div className="mt-2 text-xl font-bold font-mono-num text-emerald-500">
            +{formatMoney(summary.income, profile.currency)}
          </div>
        </div>
        <div className="p-4 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)]">
          <div className="text-xs text-[var(--text-muted)]">Расходы (по выборке)</div>
          <div className="mt-2 text-xl font-bold font-mono-num text-rose-500">
            −{formatMoney(summary.expense, profile.currency)}
          </div>
        </div>
        <div className="p-4 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)]">
          <div className="text-xs text-[var(--text-muted)]">Авторасчёт прибыли</div>
          <div
            className={`mt-2 text-xl font-bold font-mono-num ${
              summary.profit >= 0 ? 'text-[var(--text-primary)]' : 'text-rose-500'
            }`}
          >
            {formatMoney(summary.profit, profile.currency)}
          </div>
        </div>
        <div className="p-4 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)]">
          <div className="text-xs text-[var(--text-muted)]">Рентабельность</div>
          <div className="mt-2 text-xl font-bold font-mono-num text-[var(--text-primary)]">
            {summary.margin}%
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Segmented filter */}
          <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-hairline)]">
            {(
              [
                { id: 'all', label: 'Все' },
                { id: 'income', label: 'Доходы' },
                { id: 'expense', label: 'Расходы' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setTypeFilter(tab.id)}
                className={`px-3.5 py-1.5 min-h-[34px] rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                  typeFilter === tab.id
                    ? 'bg-[var(--accent-primary)] text-white'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative flex-1 sm:w-60 sm:flex-none">
            <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск по операциям..."
              className="w-full min-h-[40px] pl-9 pr-3 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-hairline)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            aria-label="Фильтр по категории"
            className="min-h-[40px] px-3 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-hairline)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
          >
            <option value="all">Все категории</option>
            {allCategories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() =>
              setSortBy((prev) =>
                prev === 'date_desc'
                  ? 'amount_desc'
                  : prev === 'amount_desc'
                    ? 'date_asc'
                    : 'date_desc'
              )
            }
            className="inline-flex items-center gap-2 px-3 min-h-[40px] rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors whitespace-nowrap"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            {sortBy === 'date_desc'
              ? 'Сначала новые'
              : sortBy === 'date_asc'
                ? 'Сначала старые'
                : 'По сумме'}
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={filtered.length === 0}
            className="inline-flex items-center gap-2 px-3.5 min-h-[40px] rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] text-sm font-medium text-[var(--text-secondary)] disabled:opacity-40 transition-colors whitespace-nowrap"
          >
            <Download className="w-4 h-4" />
            CSV
          </button>
          <button
            type="button"
            onClick={() => handleOpenAdd('expense')}
            className="inline-flex items-center gap-2 px-3.5 min-h-[40px] rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] text-sm font-medium text-[var(--text-primary)] transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4 text-rose-500" />
            Добавить расход
          </button>
          <button
            type="button"
            onClick={() => handleOpenAdd('income')}
            className="inline-flex items-center gap-2 px-4 min-h-[40px] rounded-lg bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-sm font-medium text-white transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Добавить доход
          </button>
        </div>
      </div>

      {/* Operations Ledger Table */}
      <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm font-medium text-[var(--text-primary)]">
              Операции не найдены
            </p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Измените параметры фильтрации или добавьте новую финансовую запись.
            </p>
            <button
              type="button"
              onClick={() => handleOpenAdd('income')}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 min-h-[40px] rounded-lg text-sm font-medium bg-[var(--accent-primary)] text-white"
            >
              <Plus className="w-4 h-4" />
              Добавить операцию
            </button>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[var(--border-hairline)] text-xs font-medium text-[var(--text-muted)]">
                    <th className="py-3 px-5">Дата</th>
                    <th className="py-3 px-4">Описание</th>
                    <th className="py-3 px-4">Категория</th>
                    <th className="py-3 px-4">Клиент</th>
                    <th className="py-3 px-4 text-right">Сумма</th>
                    <th className="py-3 px-5 text-right">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-hairline)] text-sm">
                  {filtered.map((tx) => (
                    <tr
                      key={tx.id}
                      className="hover:bg-[var(--bg-surface-hover)] transition-colors"
                    >
                      <td className="py-3.5 px-5 font-mono-num text-xs text-[var(--text-muted)] whitespace-nowrap">
                        {formatDateRu(tx.date)}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-[var(--text-primary)] max-w-xs truncate">
                        {tx.description}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-[var(--text-secondary)] whitespace-nowrap">
                        {tx.category}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-[var(--text-muted)] whitespace-nowrap">
                        {tx.clientId ? clientMap.get(tx.clientId) || '—' : '—'}
                      </td>
                      <td
                        className={`py-3.5 px-4 text-right font-mono-num font-semibold whitespace-nowrap ${
                          tx.type === 'income' ? 'text-emerald-500' : 'text-rose-500'
                        }`}
                      >
                        {tx.type === 'income' ? '+' : '−'}
                        {formatMoney(tx.amount, profile.currency)}
                      </td>
                      <td className="py-3.5 px-5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(tx)}
                            aria-label="Редактировать операцию"
                            className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(tx)}
                            aria-label="Удалить операцию"
                            className="p-2 rounded-lg text-[var(--text-muted)] hover:text-rose-500 hover:bg-[var(--bg-subtle)] transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile list */}
            <div className="md:hidden divide-y divide-[var(--border-hairline)]">
              {filtered.map((tx) => (
                <div key={tx.id} className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-[var(--text-primary)]">
                        {tx.description}
                      </div>
                      <div className="mt-0.5 text-xs text-[var(--text-muted)]">
                        {tx.category} · <span className="font-mono-num">{formatDateRu(tx.date)}</span>
                      </div>
                    </div>
                    <div
                      className={`text-sm font-semibold font-mono-num whitespace-nowrap shrink-0 ${
                        tx.type === 'income' ? 'text-emerald-500' : 'text-rose-500'
                      }`}
                    >
                      {tx.type === 'income' ? '+' : '−'}
                      {formatMoney(tx.amount, profile.currency)}
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-[var(--text-muted)]">
                      {tx.clientId ? clientMap.get(tx.clientId) : 'Общая операция'}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(tx)}
                        className="px-2.5 py-1.5 rounded text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]"
                      >
                        Изменить
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(tx)}
                        className="px-2.5 py-1.5 rounded text-xs text-rose-500 hover:bg-[var(--bg-subtle)]"
                      >
                        Удалить
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <TransactionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        initialType={initialType}
        editingTransaction={editingTx}
      />

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) deleteTransaction(deleteTarget.id);
        }}
        title="Удалить операцию?"
        description={
          deleteTarget
            ? `Запись «${deleteTarget.description}» на сумму ${formatMoney(
                deleteTarget.amount,
                profile.currency
              )} будет удалена без возможности восстановления.`
            : ''
        }
        confirmLabel="Удалить"
      />
    </div>
  );
};
