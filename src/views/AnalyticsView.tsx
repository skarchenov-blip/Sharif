import React, { useMemo, useState } from 'react';
import { useBusiness } from '../context/BusinessContext';
import {
  formatDateRu,
  formatMoney,
  getTodayISO,
  shiftDaysISO,
} from '../utils/formatters';
import { CashflowChart, ChartBucket } from '../components/CashflowChart';

type AnalyticsPeriod = 'week' | 'month' | 'quarter' | 'all';

const PERIOD_LABELS: Record<AnalyticsPeriod, string> = {
  week: 'Неделя',
  month: 'Месяц',
  quarter: 'Квартал',
  all: 'Всё время',
};

export const AnalyticsView: React.FC = () => {
  const { data } = useBusiness();
  const { transactions, tasks, clients, profile } = data;
  const [period, setPeriod] = useState<AnalyticsPeriod>('month');

  const today = getTodayISO();

  const periodTransactions = useMemo(() => {
    if (period === 'all') return transactions;
    const days = period === 'week' ? 7 : period === 'month' ? 30 : 90;
    const cutoff = shiftDaysISO(today, -(days - 1));
    return transactions.filter((t) => t.date >= cutoff);
  }, [transactions, period, today]);

  const metrics = useMemo(() => {
    const incomes = periodTransactions.filter((t) => t.type === 'income');
    const expenses = periodTransactions.filter((t) => t.type === 'expense');

    const totalIncome = incomes.reduce((s, t) => s + t.amount, 0);
    const totalExpense = expenses.reduce((s, t) => s + t.amount, 0);
    const netProfit = totalIncome - totalExpense;
    const margin = totalIncome > 0 ? Math.round((netProfit / totalIncome) * 100) : 0;
    const avgIncome = incomes.length > 0 ? Math.round(totalIncome / incomes.length) : 0;
    const coverageRatio =
      totalExpense > 0 ? Number((totalIncome / totalExpense).toFixed(2)) : totalIncome > 0 ? 10 : 0;

    // Task completion efficiency
    const totalTasks = tasks.length;
    const doneTasks = tasks.filter((t) => t.status === 'done').length;
    const taskRate = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

    // Revenue per client
    const activeClientsCount = Math.max(1, clients.length);
    const revenuePerClient = Math.round(totalIncome / activeClientsCount);

    return {
      totalIncome,
      totalExpense,
      netProfit,
      margin,
      avgIncome,
      coverageRatio,
      taskRate,
      doneTasks,
      totalTasks,
      revenuePerClient,
    };
  }, [periodTransactions, tasks, clients]);

  // Buckets for chart depending on selected period
  const chartBuckets: ChartBucket[] = useMemo(() => {
    if (period === 'week') {
      const buckets: ChartBucket[] = [];
      for (let i = 6; i >= 0; i--) {
        const iso = shiftDaysISO(today, -i);
        const dayTxs = periodTransactions.filter((t) => t.date === iso);
        const [, m, d] = iso.split('-');
        buckets.push({
          label: `${d}.${m}`,
          fullLabel: formatDateRu(iso),
          income: dayTxs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0),
          expense: dayTxs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
        });
      }
      return buckets;
    }

    if (period === 'month') {
      // 6 buckets of 5 days each (last 30 days)
      const buckets: ChartBucket[] = [];
      for (let b = 5; b >= 0; b--) {
        const endIso = shiftDaysISO(today, -b * 5);
        const startIso = shiftDaysISO(today, -b * 5 - 4);
        const slice = periodTransactions.filter((t) => t.date >= startIso && t.date <= endIso);
        const [, sm, sd] = startIso.split('-');
        const [, em, ed] = endIso.split('-');
        buckets.push({
          label: `${sd}.${sm}`,
          fullLabel: `${sd}.${sm} – ${ed}.${em}`,
          income: slice.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0),
          expense: slice.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
        });
      }
      return buckets;
    }

    // Quarter or All time: group by YYYY-MM
    const monthMap = new Map<string, { income: number; expense: number }>();
    for (const tx of periodTransactions) {
      const ym = tx.date.slice(0, 7);
      const curr = monthMap.get(ym) || { income: 0, expense: 0 };
      if (tx.type === 'income') curr.income += tx.amount;
      else curr.expense += tx.amount;
      monthMap.set(ym, curr);
    }

    const MONTH_NAMES = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
    return Array.from(monthMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([ym, vals]) => {
        const [y, m] = ym.split('-');
        const mName = MONTH_NAMES[Math.max(0, Number(m) - 1)] || m;
        return {
          label: `${mName} ${y.slice(2)}`,
          fullLabel: `${mName} ${y}`,
          income: vals.income,
          expense: vals.expense,
        };
      });
  }, [period, periodTransactions, today]);

  // Category Breakdown
  const breakdown = useMemo(() => {
    const buildList = (type: 'income' | 'expense') => {
      const map = new Map<string, number>();
      let sum = 0;
      for (const tx of periodTransactions) {
        if (tx.type !== type) continue;
        sum += tx.amount;
        map.set(tx.category, (map.get(tx.category) || 0) + tx.amount);
      }
      return Array.from(map.entries())
        .map(([category, amount]) => ({
          category,
          amount,
          pct: sum > 0 ? Math.round((amount / sum) * 100) : 0,
        }))
        .sort((a, b) => b.amount - a.amount);
    };

    return {
      incomeCategories: buildList('income'),
      expenseCategories: buildList('expense'),
    };
  }, [periodTransactions]);

  // Top Clients by Orders
  const topClients = useMemo(() => {
    return [...clients]
      .map((c) => ({
        id: c.id,
        title: c.company || c.name,
        revenue: c.orders
          .filter((o) => o.status !== 'cancelled')
          .reduce((s, o) => s + o.amount, 0),
        ordersCount: c.orders.length,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 4);
  }, [clients]);

  // Computed business efficiency insights
  const insights = useMemo(() => {
    const list: string[] = [];
    if (metrics.totalIncome === 0 && metrics.totalExpense === 0) {
      list.push('За выбранный период нет финансовых операций. Выберите «Всё время» или добавьте новые записи.');
      return list;
    }
    if (metrics.margin >= 35) {
      list.push(
        `Высокая операционная рентабельность (${metrics.margin}%). Доходы превышают расходы в ${metrics.coverageRatio} раза.`
      );
    } else if (metrics.margin >= 10) {
      list.push(
        `Устойчивая рентабельность (${metrics.margin}%). Есть резерв для оптимизации постоянных издержек.`
      );
    } else if (metrics.margin >= 0) {
      list.push(
        `Низкая маржинальность (${metrics.margin}%). Рекомендуется пересмотреть структуру расходов или средний чек.`
      );
    } else {
      list.push(
        `Операционный убыток за период (${formatMoney(metrics.netProfit, profile.currency)}). Расходы превысили поступления.`
      );
    }

    if (breakdown.expenseCategories[0]) {
      list.push(
        `Крупнейшая статья затрат — «${breakdown.expenseCategories[0].category}» (${breakdown.expenseCategories[0].pct}% от всех расходов).`
      );
    }

    if (metrics.totalTasks > 0) {
      list.push(
        `Выполнение операционных задач: ${metrics.doneTasks} из ${metrics.totalTasks} (${metrics.taskRate}%).`
      );
    }
    return list;
  }, [metrics, breakdown, profile.currency]);

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-[var(--text-muted)]">
            Статистика денежных потоков и оценка эффективности бизнеса
          </p>
        </div>
        <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-hairline)]">
          {(Object.keys(PERIOD_LABELS) as AnalyticsPeriod[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={`px-3.5 py-1.5 min-h-[34px] rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                period === p
                  ? 'bg-[var(--accent-primary)] text-white'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      {/* Period Financial Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)]">
          <div className="text-xs text-[var(--text-muted)]">Доходы ({PERIOD_LABELS[period].toLowerCase()})</div>
          <div className="mt-2 text-2xl font-bold font-mono-num text-emerald-500">
            {formatMoney(metrics.totalIncome, profile.currency)}
          </div>
          <div className="mt-1 text-xs text-[var(--text-muted)]">
            Средний чек: <span className="font-mono-num">{formatMoney(metrics.avgIncome, profile.currency)}</span>
          </div>
        </div>

        <div className="p-5 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)]">
          <div className="text-xs text-[var(--text-muted)]">Расходы ({PERIOD_LABELS[period].toLowerCase()})</div>
          <div className="mt-2 text-2xl font-bold font-mono-num text-rose-500">
            {formatMoney(metrics.totalExpense, profile.currency)}
          </div>
          <div className="mt-1 text-xs text-[var(--text-muted)]">
            Покрытие расходов: <span className="font-mono-num">{metrics.coverageRatio}x</span>
          </div>
        </div>

        <div className="p-5 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)]">
          <div className="text-xs text-[var(--text-muted)]">Чистый результат</div>
          <div
            className={`mt-2 text-2xl font-bold font-mono-num ${
              metrics.netProfit >= 0 ? 'text-[var(--text-primary)]' : 'text-rose-500'
            }`}
          >
            {formatMoney(metrics.netProfit, profile.currency)}
          </div>
          <div className="mt-1 text-xs text-[var(--text-muted)]">
            Рентабельность: <span className="font-mono-num">{metrics.margin}%</span>
          </div>
        </div>

        <div className="p-5 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)]">
          <div className="text-xs text-[var(--text-muted)]">Выручка на клиента</div>
          <div className="mt-2 text-2xl font-bold font-mono-num text-[var(--text-primary)]">
            {formatMoney(metrics.revenuePerClient, profile.currency)}
          </div>
          <div className="mt-1 text-xs text-[var(--text-muted)]">
            Выполнено задач: <span className="font-mono-num">{metrics.taskRate}%</span>
          </div>
        </div>
      </div>

      {/* Main Comparison Chart */}
      <section className="p-5 sm:p-6 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)]">
        <div className="mb-4">
          <h2 className="text-base font-semibold text-[var(--text-primary)]">
            Динамика доходов и расходов ({PERIOD_LABELS[period].toLowerCase()})
          </h2>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Сравнение денежных потоков по интервалам выбранного периода
          </p>
        </div>
        <CashflowChart buckets={chartBuckets} currency={profile.currency} height={260} />
      </section>

      {/* Category Breakdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <section className="p-5 sm:p-6 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)]">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">
            Структура доходов по категориям
          </h3>
          {breakdown.incomeCategories.length === 0 ? (
            <p className="text-xs text-[var(--text-muted)] py-6 text-center">
              Нет поступлений за выбранный период
            </p>
          ) : (
            <div className="space-y-4">
              {breakdown.incomeCategories.map((item) => (
                <div key={item.category} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-medium text-[var(--text-primary)] truncate">
                      {item.category}
                    </span>
                    <span className="font-mono-num text-[var(--text-secondary)] whitespace-nowrap">
                      {formatMoney(item.amount, profile.currency)} · {item.pct}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-[var(--bg-subtle)] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                      style={{ width: `${item.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="p-5 sm:p-6 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)]">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">
            Структура расходов по категориям
          </h3>
          {breakdown.expenseCategories.length === 0 ? (
            <p className="text-xs text-[var(--text-muted)] py-6 text-center">
              Нет расходов за выбранный период
            </p>
          ) : (
            <div className="space-y-4">
              {breakdown.expenseCategories.map((item) => (
                <div key={item.category} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-medium text-[var(--text-primary)] truncate">
                      {item.category}
                    </span>
                    <span className="font-mono-num text-[var(--text-secondary)] whitespace-nowrap">
                      {formatMoney(item.amount, profile.currency)} · {item.pct}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-[var(--bg-subtle)] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-rose-500 transition-all duration-300"
                      style={{ width: `${item.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Business Efficiency & Top Clients */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <section className="p-5 sm:p-6 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)]">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
            Анализ эффективности бизнеса
          </h3>
          <ul className="space-y-3 text-sm text-[var(--text-secondary)]">
            {insights.map((text, idx) => (
              <li
                key={idx}
                className="flex items-start gap-3 pb-3 border-b border-[var(--border-hairline)] last:border-b-0 last:pb-0"
              >
                <span className="font-mono-num text-xs text-[var(--accent-text)] font-semibold pt-0.5">
                  0{idx + 1}
                </span>
                <span className="leading-relaxed">{text}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="p-5 sm:p-6 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)]">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
            Ключевые клиенты по объёму заказов
          </h3>
          {topClients.length === 0 ? (
            <p className="text-xs text-[var(--text-muted)] py-6 text-center">
              Клиенты пока не добавлены
            </p>
          ) : (
            <div className="divide-y divide-[var(--border-hairline)]">
              {topClients.map((cl) => (
                <div key={cl.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-[var(--text-primary)] truncate">
                      {cl.title}
                    </div>
                    <div className="text-xs text-[var(--text-muted)] font-mono-num">
                      Заказов: {cl.ordersCount}
                    </div>
                  </div>
                  <div className="text-sm font-semibold font-mono-num text-[var(--text-primary)] whitespace-nowrap">
                    {formatMoney(cl.revenue, profile.currency)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
