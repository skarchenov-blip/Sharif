export type NavSection =
  | 'dashboard'
  | 'finance'
  | 'tasks'
  | 'clients'
  | 'analytics'
  | 'settings';

export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  description: string;
  date: string; // YYYY-MM-DD
  clientId?: string;
  createdAt: string;
}

export type TaskPriority = 'high' | 'medium' | 'low';
export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done';

export interface TaskItem {
  id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  deadline: string; // YYYY-MM-DD
  clientId?: string;
  createdAt: string;
}

export type ClientStatus = 'active' | 'lead' | 'archived';
export type OrderStatus = 'paid' | 'in_progress' | 'completed' | 'cancelled';

export interface ClientOrder {
  id: string;
  title: string;
  amount: number;
  date: string; // YYYY-MM-DD
  status: OrderStatus;
  notes?: string;
}

export interface Client {
  id: string;
  name: string;
  company: string;
  phone: string;
  email: string;
  status: ClientStatus;
  notes: string;
  orders: ClientOrder[];
  createdAt: string;
}

export type CurrencyCode = 'RUB' | 'USD' | 'EUR' | 'KZT';
export type ThemeId = 'slate-dark' | 'obsidian' | 'light';
export type AccentId = 'emerald' | 'indigo' | 'amber';

export interface UserProfile {
  name: string;
  role: string;
  companyName: string;
  email: string;
  avatarUrl: string;
  currency: CurrencyCode;
}

export interface AppSettings {
  theme: ThemeId;
  accent: AccentId;
  autoSave: boolean;
  lastSavedAt: string;
}

export interface BusinessStoreData {
  transactions: Transaction[];
  tasks: TaskItem[];
  clients: Client[];
  profile: UserProfile;
  settings: AppSettings;
}

export interface ToastMessage {
  id: string;
  title: string;
  variant: 'success' | 'info' | 'error';
}
