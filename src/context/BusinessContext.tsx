import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  AppSettings,
  BusinessStoreData,
  Client,
  ClientOrder,
  OrderStatus,
  TaskItem,
  TaskStatus,
  ToastMessage,
  Transaction,
  UserProfile,
} from '../types/business';
import { createInitialSeedData } from '../data/seedData';
import { generateId } from '../utils/formatters';

const STORAGE_KEY = 'business_manager_pro_v1';

interface BusinessContextValue {
  data: BusinessStoreData;
  toasts: ToastMessage[];
  dismissToast: (id: string) => void;
  notify: (title: string, variant?: ToastMessage['variant']) => void;
  // Finance
  addTransaction: (tx: Omit<Transaction, 'id' | 'createdAt'>) => void;
  updateTransaction: (id: string, patch: Partial<Omit<Transaction, 'id' | 'createdAt'>>) => void;
  deleteTransaction: (id: string) => void;
  // Tasks
  addTask: (task: Omit<TaskItem, 'id' | 'createdAt'>) => void;
  updateTask: (id: string, patch: Partial<Omit<TaskItem, 'id' | 'createdAt'>>) => void;
  setTaskStatus: (id: string, status: TaskStatus) => void;
  deleteTask: (id: string) => void;
  // Clients & Orders
  addClient: (client: Omit<Client, 'id' | 'createdAt' | 'orders'>) => string;
  updateClient: (id: string, patch: Partial<Omit<Client, 'id' | 'createdAt' | 'orders'>>) => void;
  deleteClient: (id: string) => void;
  addClientOrder: (
    clientId: string,
    order: Omit<ClientOrder, 'id'>,
    createFinanceIncome?: boolean
  ) => void;
  updateClientOrderStatus: (clientId: string, orderId: string, status: OrderStatus) => void;
  deleteClientOrder: (clientId: string, orderId: string) => void;
  // Profile & Settings
  updateProfile: (patch: Partial<UserProfile>) => void;
  updateSettings: (patch: Partial<AppSettings>) => void;
  saveNow: () => void;
  exportBackup: () => void;
  importBackup: (jsonText: string) => boolean;
  resetDemoData: () => void;
  clearAllData: () => void;
}

const BusinessContext = createContext<BusinessContextValue | null>(null);

function loadStoredData(): BusinessStoreData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialSeedData();
    const parsed = JSON.parse(raw) as Partial<BusinessStoreData>;
    const fallback = createInitialSeedData();
    return {
      transactions: Array.isArray(parsed.transactions) ? parsed.transactions : fallback.transactions,
      tasks: Array.isArray(parsed.tasks) ? parsed.tasks : fallback.tasks,
      clients: Array.isArray(parsed.clients) ? parsed.clients : fallback.clients,
      profile: parsed.profile ? { ...fallback.profile, ...parsed.profile } : fallback.profile,
      settings: parsed.settings ? { ...fallback.settings, ...parsed.settings } : fallback.settings,
    };
  } catch {
    return createInitialSeedData();
  }
}

export const BusinessProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<BusinessStoreData>(() => loadStoredData());
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const notify = useCallback((title: string, variant: ToastMessage['variant'] = 'success') => {
    const id = generateId('toast');
    setToasts((prev) => [...prev.slice(-3), { id, title, variant }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Sync theme & accent attributes to <html>
  useEffect(() => {
    const root = document.documentElement;
    const { theme, accent } = data.settings;

    if (theme === 'light') {
      root.classList.remove('dark');
    } else {
      root.classList.add('dark');
    }
    root.setAttribute('data-theme', theme);
    root.setAttribute('data-accent', accent);
  }, [data.settings]);

  // Auto-persist to localStorage
  useEffect(() => {
    if (!data.settings.autoSave) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // Ignore quota errors gracefully
    }
  }, [data]);

  const touchSaveTimestamp = (prev: BusinessStoreData): AppSettings => ({
    ...prev.settings,
    lastSavedAt: new Date().toISOString(),
  });

  // Finance CRUD
  const addTransaction = useCallback(
    (tx: Omit<Transaction, 'id' | 'createdAt'>) => {
      const newTx: Transaction = {
        ...tx,
        id: generateId('tx'),
        createdAt: new Date().toISOString(),
      };
      setData((prev) => ({
        ...prev,
        transactions: [newTx, ...prev.transactions],
        settings: touchSaveTimestamp(prev),
      }));
      notify(tx.type === 'income' ? 'Доход добавлен в журнал' : 'Расход добавлен в журнал');
    },
    [notify]
  );

  const updateTransaction = useCallback(
    (id: string, patch: Partial<Omit<Transaction, 'id' | 'createdAt'>>) => {
      setData((prev) => ({
        ...prev,
        transactions: prev.transactions.map((t) => (t.id === id ? { ...t, ...patch } : t)),
        settings: touchSaveTimestamp(prev),
      }));
      notify('Операция обновлена');
    },
    [notify]
  );

  const deleteTransaction = useCallback(
    (id: string) => {
      setData((prev) => ({
        ...prev,
        transactions: prev.transactions.filter((t) => t.id !== id),
        settings: touchSaveTimestamp(prev),
      }));
      notify('Операция удалена', 'info');
    },
    [notify]
  );

  // Tasks CRUD
  const addTask = useCallback(
    (task: Omit<TaskItem, 'id' | 'createdAt'>) => {
      const newTask: TaskItem = {
        ...task,
        id: generateId('tsk'),
        createdAt: new Date().toISOString(),
      };
      setData((prev) => ({
        ...prev,
        tasks: [newTask, ...prev.tasks],
        settings: touchSaveTimestamp(prev),
      }));
      notify('Задача создана');
    },
    [notify]
  );

  const updateTask = useCallback(
    (id: string, patch: Partial<Omit<TaskItem, 'id' | 'createdAt'>>) => {
      setData((prev) => ({
        ...prev,
        tasks: prev.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)),
        settings: touchSaveTimestamp(prev),
      }));
      notify('Задача обновлена');
    },
    [notify]
  );

  const setTaskStatus = useCallback(
    (id: string, status: TaskStatus) => {
      setData((prev) => ({
        ...prev,
        tasks: prev.tasks.map((t) => (t.id === id ? { ...t, status } : t)),
        settings: touchSaveTimestamp(prev),
      }));
      notify(status === 'done' ? 'Задача выполнена' : 'Статус задачи изменён');
    },
    [notify]
  );

  const deleteTask = useCallback(
    (id: string) => {
      setData((prev) => ({
        ...prev,
        tasks: prev.tasks.filter((t) => t.id !== id),
        settings: touchSaveTimestamp(prev),
      }));
      notify('Задача удалена', 'info');
    },
    [notify]
  );

  // Clients & Orders CRUD
  const addClient = useCallback(
    (client: Omit<Client, 'id' | 'createdAt' | 'orders'>): string => {
      const id = generateId('cli');
      const newClient: Client = {
        ...client,
        id,
        orders: [],
        createdAt: new Date().toISOString().slice(0, 10),
      };
      setData((prev) => ({
        ...prev,
        clients: [newClient, ...prev.clients],
        settings: touchSaveTimestamp(prev),
      }));
      notify('Клиент добавлен в базу');
      return id;
    },
    [notify]
  );

  const updateClient = useCallback(
    (id: string, patch: Partial<Omit<Client, 'id' | 'createdAt' | 'orders'>>) => {
      setData((prev) => ({
        ...prev,
        clients: prev.clients.map((c) => (c.id === id ? { ...c, ...patch } : c)),
        settings: touchSaveTimestamp(prev),
      }));
      notify('Данные клиента обновлены');
    },
    [notify]
  );

  const deleteClient = useCallback(
    (id: string) => {
      setData((prev) => ({
        ...prev,
        clients: prev.clients.filter((c) => c.id !== id),
        settings: touchSaveTimestamp(prev),
      }));
      notify('Клиент удалён', 'info');
    },
    [notify]
  );

  const addClientOrder = useCallback(
    (clientId: string, order: Omit<ClientOrder, 'id'>, createFinanceIncome = false) => {
      const newOrder: ClientOrder = {
        ...order,
        id: generateId('ord'),
      };
      setData((prev) => {
        const targetClient = prev.clients.find((c) => c.id === clientId);
        const updatedClients = prev.clients.map((c) =>
          c.id === clientId ? { ...c, orders: [newOrder, ...c.orders] } : c
        );

        let updatedTransactions = prev.transactions;
        if (createFinanceIncome && order.amount > 0) {
          const autoTx: Transaction = {
            id: generateId('tx'),
            type: 'income',
            amount: order.amount,
            category: 'Разработка и проекты',
            description: `${order.title}${targetClient ? ` — ${targetClient.company || targetClient.name}` : ''}`,
            date: order.date,
            clientId,
            createdAt: new Date().toISOString(),
          };
          updatedTransactions = [autoTx, ...prev.transactions];
        }

        return {
          ...prev,
          clients: updatedClients,
          transactions: updatedTransactions,
          settings: touchSaveTimestamp(prev),
        };
      });
      notify(
        createFinanceIncome
          ? 'Заказ добавлен и отражён в доходах'
          : 'Заказ добавлен в историю клиента'
      );
    },
    [notify]
  );

  const updateClientOrderStatus = useCallback(
    (clientId: string, orderId: string, status: OrderStatus) => {
      setData((prev) => ({
        ...prev,
        clients: prev.clients.map((c) =>
          c.id === clientId
            ? {
                ...c,
                orders: c.orders.map((o) => (o.id === orderId ? { ...o, status } : o)),
              }
            : c
        ),
        settings: touchSaveTimestamp(prev),
      }));
      notify('Статус заказа обновлён');
    },
    [notify]
  );

  const deleteClientOrder = useCallback(
    (clientId: string, orderId: string) => {
      setData((prev) => ({
        ...prev,
        clients: prev.clients.map((c) =>
          c.id === clientId
            ? { ...c, orders: c.orders.filter((o) => o.id !== orderId) }
            : c
        ),
        settings: touchSaveTimestamp(prev),
      }));
      notify('Заказ удалён', 'info');
    },
    [notify]
  );

  // Profile & Settings
  const updateProfile = useCallback(
    (patch: Partial<UserProfile>) => {
      setData((prev) => ({
        ...prev,
        profile: { ...prev.profile, ...patch },
        settings: touchSaveTimestamp(prev),
      }));
      notify('Профиль сохранён');
    },
    [notify]
  );

  const updateSettings = useCallback((patch: Partial<AppSettings>) => {
    setData((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        ...patch,
        lastSavedAt: new Date().toISOString(),
      },
    }));
  }, []);

  const saveNow = useCallback(() => {
    const nowIso = new Date().toISOString();
    setData((prev) => {
      const next: BusinessStoreData = {
        ...prev,
        settings: { ...prev.settings, lastSavedAt: nowIso },
      };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Ignore storage error
      }
      return next;
    });
    notify('Все данные сохранены локально');
  }, [notify]);

  const exportBackup = useCallback(() => {
    const payload = JSON.stringify(data, null, 2);
    const blob = new Blob([payload], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `business-manager-pro-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    notify('Резервная копия JSON выгружена');
  }, [data, notify]);

  const importBackup = useCallback(
    (jsonText: string): boolean => {
      try {
        const parsed = JSON.parse(jsonText) as Partial<BusinessStoreData>;
        if (
          !parsed ||
          !Array.isArray(parsed.transactions) ||
          !Array.isArray(parsed.tasks) ||
          !Array.isArray(parsed.clients)
        ) {
          notify('Некорректный формат файла резервной копии', 'error');
          return false;
        }
        const fallback = createInitialSeedData();
        const restored: BusinessStoreData = {
          transactions: parsed.transactions,
          tasks: parsed.tasks,
          clients: parsed.clients,
          profile: parsed.profile ? { ...fallback.profile, ...parsed.profile } : fallback.profile,
          settings: parsed.settings
            ? { ...fallback.settings, ...parsed.settings, lastSavedAt: new Date().toISOString() }
            : { ...fallback.settings, lastSavedAt: new Date().toISOString() },
        };
        setData(restored);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(restored));
        notify('Данные успешно восстановлены из файла');
        return true;
      } catch {
        notify('Не удалось прочитать JSON-файл', 'error');
        return false;
      }
    },
    [notify]
  );

  const resetDemoData = useCallback(() => {
    const fresh = createInitialSeedData();
    setData(fresh);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
    notify('Демо-данные восстановлены', 'info');
  }, [notify]);

  const clearAllData = useCallback(() => {
    setData((prev) => {
      const empty: BusinessStoreData = {
        transactions: [],
        tasks: [],
        clients: [],
        profile: prev.profile,
        settings: { ...prev.settings, lastSavedAt: new Date().toISOString() },
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(empty));
      return empty;
    });
    notify('Все записи очищены', 'info');
  }, [notify]);

  return (
    <BusinessContext.Provider
      value={{
        data,
        toasts,
        dismissToast,
        notify,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        addTask,
        updateTask,
        setTaskStatus,
        deleteTask,
        addClient,
        updateClient,
        deleteClient,
        addClientOrder,
        updateClientOrderStatus,
        deleteClientOrder,
        updateProfile,
        updateSettings,
        saveNow,
        exportBackup,
        importBackup,
        resetDemoData,
        clearAllData,
      }}
    >
      {children}
    </BusinessContext.Provider>
  );
};

export function useBusiness(): BusinessContextValue {
  const ctx = useContext(BusinessContext);
  if (!ctx) {
    throw new Error('useBusiness must be used inside BusinessProvider');
  }
  return ctx;
}
