import { CurrencyCode, TaskPriority, TaskStatus, OrderStatus, ClientStatus } from '../types/business';

const CURRENCY_CONFIG: Record<CurrencyCode, { symbol: string; locale: string }> = {
  RUB: { symbol: '₽', locale: 'ru-RU' },
  USD: { symbol: '$', locale: 'en-US' },
  EUR: { symbol: '€', locale: 'de-DE' },
  KZT: { symbol: '₸', locale: 'ru-KZ' },
};

export function formatMoney(amount: number, currency: CurrencyCode = 'RUB'): string {
  const cfg = CURRENCY_CONFIG[currency] || CURRENCY_CONFIG.RUB;
  const absFormatted = new Intl.NumberFormat('ru-RU', {
    maximumFractionDigits: 0,
  }).format(Math.round(Math.abs(amount)));

  const sign = amount < 0 ? '−' : '';
  return `${sign}${absFormatted} ${cfg.symbol}`;
}

export function formatCompactMoney(amount: number, currency: CurrencyCode = 'RUB'): string {
  const cfg = CURRENCY_CONFIG[currency] || CURRENCY_CONFIG.RUB;
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '−' : '';
  if (abs >= 1_000_000) {
    return `${sign}${(abs / 1_000_000).toFixed(1).replace('.', ',')} млн ${cfg.symbol}`;
  }
  if (abs >= 10_000) {
    return `${sign}${Math.round(abs / 1000)} тыс. ${cfg.symbol}`;
  }
  return formatMoney(amount, currency);
}

export function formatDateRu(isoDate: string): string {
  if (!isoDate) return '—';
  const [y, m, d] = isoDate.split('-');
  if (!y || !m || !d) return isoDate;
  return `${d}.${m}.${y}`;
}

export function getTodayISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function shiftDaysISO(baseIso: string, deltaDays: number): string {
  const [y, m, d] = baseIso.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + deltaDays);
  const ny = date.getFullYear();
  const nm = String(date.getMonth() + 1).padStart(2, '0');
  const nd = String(date.getDate()).padStart(2, '0');
  return `${ny}-${nm}-${nd}`;
}

export function getDeadlineMeta(deadlineIso: string, isDone: boolean): {
  label: string;
  urgency: 'overdue' | 'today' | 'soon' | 'normal' | 'done';
} {
  if (isDone) {
    return { label: formatDateRu(deadlineIso), urgency: 'done' };
  }
  const today = getTodayISO();
  const [ty, tm, td] = today.split('-').map(Number);
  const [dy, dm, dd] = deadlineIso.split('-').map(Number);
  if (!dy || !dm || !dd) {
    return { label: 'Без срока', urgency: 'normal' };
  }
  const todayMs = new Date(ty, tm - 1, td).getTime();
  const deadMs = new Date(dy, dm - 1, dd).getTime();
  const diffDays = Math.round((deadMs - todayMs) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { label: `Просрочено (${Math.abs(diffDays)} дн.)`, urgency: 'overdue' };
  }
  if (diffDays === 0) {
    return { label: 'Сегодня', urgency: 'today' };
  }
  if (diffDays === 1) {
    return { label: 'Завтра', urgency: 'soon' };
  }
  if (diffDays <= 3) {
    return { label: `Через ${diffDays} дн.`, urgency: 'soon' };
  }
  return { label: formatDateRu(deadlineIso), urgency: 'normal' };
}

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  high: 'Высокий',
  medium: 'Средний',
  low: 'Низкий',
};

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'К выполнению',
  in_progress: 'В работе',
  review: 'На проверке',
  done: 'Выполнено',
};

export const CLIENT_STATUS_LABELS: Record<ClientStatus, string> = {
  active: 'Активный',
  lead: 'Потенциальный',
  archived: 'Архив',
};

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  paid: 'Оплачен',
  in_progress: 'В работе',
  completed: 'Выполнен',
  cancelled: 'Отменён',
};

export const INCOME_CATEGORIES = [
  'Разработка и проекты',
  'Консалтинг',
  'Подписки и поддержка',
  'Продажа лицензий',
  'Обучение и аудит',
  'Прочие доходы',
];

export const EXPENSE_CATEGORIES = [
  'Фонд оплаты труда',
  'Маркетинг и реклама',
  'Облако и сервисы',
  'Аренда офиса',
  'Налоги и сборы',
  'Оборудование',
  'Прочие расходы',
];

export function generateId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export function pluralizeRu(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}
