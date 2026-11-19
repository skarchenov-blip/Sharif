import React, { useMemo, useState } from 'react';
import {
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Check,
  ChevronRight,
  UserPlus,
  CheckSquare,
} from 'lucide-react';
import { useBusiness } from '../context/BusinessContext';
import { NavSection, TransactionType } from '../types/business';
import {
  formatDateRu,
  formatMoney,
  getDeadlineMeta,
  getTodayISO,
  pluralizeRu,
  PRIORITY_LABELS,
  shiftDaysISO,
} from '../utils/formatters';
import { CashflowChart, ChartBucket } from '../components/CashflowChart';
import { TransactionModal } from '../components/TransactionModal';
import { TaskModal } from '../components/TaskModal';
import { ClientModal } from '../components/ClientModal';

interface DashboardViewProps {
  onNavigate: (section: NavSection) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const { data, setTaskStatus } = useBusiness();
  const { transactions, tasks, clients, profile } = data;

  const [txModalOpen, setTxModalOpen] = useState(false);
  const [txInitialType, setTxInitialType] = useState<TransactionType>('income');
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [clientModalOpen, setClientModalOpen] = useState(false);

  const metrics = useMemo(() => {
    let totalIncome = 0;
    let totalExpense = 0;
    for (const tx of transactions) {
      if (tx.type === 'income') totalIncome += tx.amount;
      else totalExpense += tx.amount;
    }
    const netProfit = totalIncome - totalExpense;
    const marginPct = totalIncome > 0 ? Math.round((netProfit / totalIncome) * 100) : 0;
    const activeClients = clients.filter((c) => c.status === 'active').length;
    return {
      totalIncome,
      totalExpense,
      netProfit,
      marginPct,
      totalClients: clients.length,
      activeClients,
    };
  }, [transactions, clients]);

  // Last 7 days bucketed chart
  const weeklyBuckets: ChartBucket[] = useMemo(() => {
    const today = getTodayISO();
    const buckets: ChartBucket[] = [];
    for (let i = 6; i >= 0; i--) {
      const iso = shiftDaysISO(today, -i);
      const dayTxs = transactions.filter((t) => t.date === iso);
      const inc = dayTxs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      const exp = dayTxs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
      const [, m, d] = iso.split('-');
      buckets.push({
        label: `${d}.${m}`,
        fullLabel: formatDateRu(iso),
        income: inc,
        expense: exp,
      });
    }
    return buckets;
  }, [transactions]);

  const recentTransactions = useMemo(
    () =>
      [...transactions]
        .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
        .slice(0, 5),
    [transactions]
  );

  const upcomingTasks = useMemo(
    () =>
      [...tasks]
        .filter((t) => t.status !== 'done')
        .sort((a, b) => a.deadline.localeCompare(b.deadline))
        .slice(0, 5),
    [tasks]
  );

  const openTx = (type: TransactionType) => {
    setTxInitialType(type);
    setTxModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Quick Actions Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[var(--text-muted)]">
          Сводка по ключевым показателям бизнеса на {formatDateRu(getTodayISO())}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => openTx('income')}
            className="inline-flex items-center gap-2 px-3.5 min-h-[40px] rounded-lg text-sm font-medium bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white transition-colors whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            Доход
          </button>
          <button
            type="button"
            onClick={() => openTx('expense')}
            className="inline-flex items-center gap-2 px-3.5 min-h-[40px] rounded-lg text-sm font-medium border border-[var(--border-hairline)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] text-[var(--text-primary)] transition-colors whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4 text-rose-500" />
            Расход
          </button>
          <button
            type="button"
            onClick={() => setTaskModalOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 min-h-[40px] rounded-lg text-sm font-medium border border-[var(--border-hairline)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] text-[var(--text-primary)] transition-colors whitespace-nowrap shrink-0"
          >
            <CheckSquare className="w-4 h-4 text-[var(--text-muted)]" />
            Задача
          </button>
          <button
            type="button"
            onClick={() => setClientModalOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 min-h-[40px] rounded-lg text-sm font-medium border border-[var(--border-hairline)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] text-[var(--text-primary)] transition-colors whitespace-nowrap shrink-0"
          >
            <UserPlus className="w-4 h-4 text-[var(--text-muted)]" />
            Клиент
          </button>
        </div>
      </div>

      {/* 4 Primary KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)]">
          <div className="flex items-center justify-between gap-2 text-xs font-medium text-[var(--text-muted)]">
            <span>Общая прибыль</span>
            <ArrowUpRight className="w-4 h-4 text-emerald-500 shrink-0" />
          </div>
          <div className="mt-3 text-2xl font-bold font-mono-num text-[var(--text-primary)]">
            {formatMoney(metrics.totalIncome, profile.currency)}
          </div>
          <div className="mt-1.5 text-xs text-[var(--text-muted)]">
            Поступления по {transactions.filter((t) => t.type === 'income').length}{' '}
            {pluralizeRu(
              transactions.filter((t) => t.type === 'income').length,
              'операции',
              'операциям',
              'операциям'
            )}
          </div>
        </div>

        <div className="p-5 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)]">
          <div className="flex items-center justify-between gap-2 text-xs font-medium text-[var(--text-muted)]">
            <span>Общие расходы</span>
            <ArrowDownRight className="w-4 h-4 text-rose-500 shrink-0" />
          </div>
          <div className="mt-3 text-2xl font-bold font-mono-num text-[var(--text-primary)]">
            {formatMoney(metrics.totalExpense, profile.currency)}
          </div>
          <div className="mt-1.5 text-xs text-[var(--text-muted)]">
            Списания по {transactions.filter((t) => t.type === 'expense').length}{' '}
            {pluralizeRu(
              transactions.filter((t) => t.type === 'expense').length,
              'операции',
              'операциям',
              'операциям'
            )}
          </div>
        </div>

        <div className="p-5 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)]">
          <div className="flex items-center justify-between gap-2 text-xs font-medium text-[var(--text-muted)]">
            <span>Чистый доход</span>
            <span
              className={`text-xs font-mono-num font-medium ${
                metrics.netProfit >= 0 ? 'text-emerald-500' : 'text-rose-500'
              }`}
            >
              {metrics.marginPct}% маржа
            </span>
          </div>
          <div
            className={`mt-3 text-2xl font-bold font-mono-num ${
              metrics.netProfit >= 0 ? 'text-emerald-500' : 'text-rose-500'
            }`}
          >
            {formatMoney(metrics.netProfit, profile.currency)}
          </div>
          <div className="mt-1.5 text-xs text-[var(--text-muted)]">
            Разница доходов и расходов
          </div>
        </div>

        <div className="p-5 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)]">
          <div className="flex items-center justify-between gap-2 text-xs font-medium text-[var(--text-muted)]">
            <span>Количество клиентов</span>
            <button
              type="button"
              onClick={() => onNavigate('clients')}
              className="text-xs text-[var(--accent-text)] hover:underline whitespace-nowrap"
            >
              База →
            </button>
          </div>
          <div className="mt-3 text-2xl font-bold font-mono-num text-[var(--text-primary)]">
            {metrics.totalClients}
          </div>
          <div className="mt-1.5 text-xs text-[var(--text-muted)]">
            Активных: <span className="font-mono-num text-[var(--text-secondary)]">{metrics.activeClients}</span>
            <span aria-hidden="true"> · </span>
            Задач в работе: <span className="font-mono-num text-[var(--text-secondary)]">{upcomingTasks.length}</span>
          </div>
        </div>
      </div>

      {/* Main Chart Section */}
      <section className="p-5 sm:p-6 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)]">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-base font-semibold text-[var(--text-primary)]">
              Денежный поток за последние 7 дней
            </h2>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Сопоставление ежедневных поступлений и операционных затрат
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('analytics')}
            className="inline-flex items-center gap-1 text-xs font-medium text-[var(--accent-text)] hover:underline whitespace-nowrap shrink-0"
          >
            Подробная аналитика
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <CashflowChart buckets={weeklyBuckets} currency={profile.currency} height={220} />
      </section>

      {/* Two-Column Operations & Tasks Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* Recent Finance Operations */}
        <section className="flex flex-col rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] overflow-hidden">
          <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-[var(--border-hairline)]">
            <h2 className="text-base font-semibold text-[var(--text-primary)]">
              Последние операции
            </h2>
            <button
              type="button"
              onClick={() => onNavigate('finance')}
              className="inline-flex items-center gap-1 text-xs font-medium text-[var(--accent-text)] hover:underline whitespace-nowrap shrink-0"
            >
              Все операции
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {recentTransactions.length === 0 ? (
            <div className="p-8 text-center text-sm text-[var(--text-muted)] flex-1 flex flex-col items-center justify-center">
              <p>Операций пока нет</p>
              <button
                type="button"
                onClick={() => openTx('income')}
                className="mt-3 px-4 py-2 rounded-lg text-xs font-medium bg-[var(--accent-primary)] text-white"
              >
                Добавить первую операцию
              </button>
            </div>
          ) : (
            <div className="divide-y divide-[var(--border-hairline)]">
              {recentTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between gap-4 px-5 py-3.5 hover:bg-[var(--bg-surface-hover)] transition-colors"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-[var(--text-primary)] truncate">
                      {tx.description}
                    </div>
                    <div className="mt-0.5 text-xs text-[var(--text-muted)] truncate">
                      <span>{tx.category}</span>
                      <span aria-hidden="true"> · </span>
                      <span className="font-mono-num">{formatDateRu(tx.date)}</span>
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
              ))}
            </div>
          )}
        </section>

        {/* Upcoming Tasks */}
        <section className="flex flex-col rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] overflow-hidden">
          <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-[var(--border-hairline)]">
            <h2 className="text-base font-semibold text-[var(--text-primary)]">
              Актуальные задачи
            </h2>
            <button
              type="button"
              onClick={() => onNavigate('tasks')}
              className="inline-flex items-center gap-1 text-xs font-medium text-[var(--accent-text)] hover:underline whitespace-nowrap shrink-0"
            >
              Все задачи
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {upcomingTasks.length === 0 ? (
            <div className="p-8 text-center text-sm text-[var(--text-muted)] flex-1 flex flex-col items-center justify-center">
              <p>Все задачи выполнены</p>
              <button
                type="button"
                onClick={() => setTaskModalOpen(true)}
                className="mt-3 px-4 py-2 rounded-lg text-xs font-medium bg-[var(--accent-primary)] text-white"
              >
                Создать задачу
              </button>
            </div>
          ) : (
            <div className="divide-y divide-[var(--border-hairline)]">
              {upcomingTasks.map((task) => {
                const deadlineMeta = getDeadlineMeta(task.deadline, task.status === 'done');
                return (
                  <div
                    key={task.id}
                    className="flex items-center gap-3.5 px-5 py-3.5 hover:bg-[var(--bg-surface-hover)] transition-colors"
                  >
                    <button
                      type="button"
                      onClick={() => setTaskStatus(task.id, 'done')}
                      aria-label={`Отметить задачу «${task.title}» выполненной`}
                      className="w-5 h-5 rounded border border-[var(--border-hairline)] hover:border-[var(--accent-primary)] flex items-center justify-center shrink-0 text-transparent hover:text-[var(--accent-text)] transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-[var(--text-primary)] truncate">
                        {task.title}
                      </div>
                      <div className="mt-0.5 text-xs text-[var(--text-muted)] flex flex-wrap items-center gap-1.5">
                        <span
                          className={
                            task.priority === 'high'
                              ? 'text-rose-500 font-medium'
                              : task.priority === 'medium'
                                ? 'text-amber-500'
                                : 'text-[var(--text-muted)]'
                          }
                        >
                          {PRIORITY_LABELS[task.priority]} приоритет
                        </span>
                        <span aria-hidden="true">·</span>
                        <span
                          className={`font-mono-num ${
                            deadlineMeta.urgency === 'overdue'
                              ? 'text-rose-500 font-medium'
                              : deadlineMeta.urgency === 'today'
                                ? 'text-amber-500 font-medium'
                                : ''
                          }`}
                        >
                          {deadlineMeta.label}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      <TransactionModal
        open={txModalOpen}
        onClose={() => setTxModalOpen(false)}
        initialType={txInitialType}
      />
      <TaskModal open={taskModalOpen} onClose={() => setTaskModalOpen(false)} />
      <ClientModal open={clientModalOpen} onClose={() => setClientModalOpen(false)} />
    </div>
  );
};
