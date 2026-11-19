import React, { useMemo, useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Phone,
  Mail,
  Copy,
  Pencil,
  Trash2,
  PackagePlus,
} from 'lucide-react';
import { useBusiness } from '../context/BusinessContext';
import { Client, ClientOrder, ClientStatus, OrderStatus } from '../types/business';
import {
  CLIENT_STATUS_LABELS,
  formatDateRu,
  formatMoney,
  getTodayISO,
  ORDER_STATUS_LABELS,
  pluralizeRu,
} from '../utils/formatters';
import { ClientModal } from '../components/ClientModal';
import { Modal } from '../components/Modal';
import { ConfirmModal } from '../components/ConfirmModal';

export const ClientsView: React.FC = () => {
  const {
    data,
    deleteClient,
    addClientOrder,
    updateClientOrderStatus,
    deleteClientOrder,
    notify,
  } = useBusiness();
  const { clients, profile } = data;

  const [statusFilter, setStatusFilter] = useState<'all' | ClientStatus>('all');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string>(() => clients[0]?.id || '');

  const [clientModalOpen, setClientModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null);

  // Add order modal state
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [orderTitle, setOrderTitle] = useState('');
  const [orderAmount, setOrderAmount] = useState('');
  const [orderDate, setOrderDate] = useState(getTodayISO());
  const [orderStatus, setOrderStatus] = useState<OrderStatus>('paid');
  const [syncToFinance, setSyncToFinance] = useState(true);
  const [deleteOrderTarget, setDeleteOrderTarget] = useState<ClientOrder | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return clients.filter((c) => {
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;
      if (q) {
        const match =
          c.name.toLowerCase().includes(q) ||
          c.company.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.phone.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [clients, statusFilter, search]);

  useEffect(() => {
    if (filtered.length > 0 && !filtered.some((c) => c.id === selectedId)) {
      setSelectedId(filtered[0].id);
    }
  }, [filtered, selectedId]);

  const selectedClient = useMemo(
    () => clients.find((c) => c.id === selectedId) || null,
    [clients, selectedId]
  );

  const getClientTotal = (c: Client) =>
    c.orders
      .filter((o) => o.status !== 'cancelled')
      .reduce((sum, o) => sum + o.amount, 0);

  const handleCopy = async (text: string, label: string) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      notify(`${label} скопирован`);
    } catch {
      notify(`Скопируйте вручную: ${text}`, 'info');
    }
  };

  const handleAddOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) return;
    const numeric = Number(orderAmount.replace(/\s+/g, '').replace(',', '.'));
    if (!orderTitle.trim() || !Number.isFinite(numeric) || numeric <= 0) {
      notify('Укажите название заказа и сумму больше нуля', 'error');
      return;
    }
    addClientOrder(
      selectedClient.id,
      {
        title: orderTitle.trim(),
        amount: Math.round(numeric),
        date: orderDate || getTodayISO(),
        status: orderStatus,
      },
      syncToFinance && (orderStatus === 'paid' || orderStatus === 'completed')
    );
    setOrderTitle('');
    setOrderAmount('');
    setOrderDate(getTodayISO());
    setOrderStatus('paid');
    setOrderModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-hairline)]">
            {(['all', 'active', 'lead', 'archived'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 min-h-[34px] rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                  statusFilter === st
                    ? 'bg-[var(--accent-primary)] text-white'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {st === 'all' ? 'Все' : CLIENT_STATUS_LABELS[st]}
              </button>
            ))}
          </div>

          <div className="relative flex-1 sm:w-64 sm:flex-none">
            <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Имя, компания, телефон..."
              className="w-full min-h-[40px] pl-9 pr-3 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-hairline)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingClient(null);
            setClientModalOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 px-4 min-h-[40px] rounded-lg bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-sm font-medium text-white transition-colors whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" />
          Добавить клиента
        </button>
      </div>

      {/* Master-Detail Client Grid */}
      {clients.length === 0 ? (
        <div className="p-12 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] text-center">
          <p className="text-sm font-medium text-[var(--text-primary)]">База клиентов пуста</p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Добавьте первого клиента, чтобы вести контакты и историю заказов.
          </p>
          <button
            type="button"
            onClick={() => {
              setEditingClient(null);
              setClientModalOpen(true);
            }}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 min-h-[40px] rounded-lg text-sm font-medium bg-[var(--accent-primary)] text-white"
          >
            <Plus className="w-4 h-4" />
            Добавить клиента
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Directory List */}
          <div className="lg:col-span-5 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[var(--border-hairline)] flex items-center justify-between">
              <span className="text-xs font-semibold text-[var(--text-muted)]">
                Список клиентов
              </span>
              <span className="text-xs font-mono-num text-[var(--text-muted)]">
                {filtered.length}
              </span>
            </div>

            {filtered.length === 0 ? (
              <div className="p-8 text-center text-xs text-[var(--text-muted)]">
                Совпадений не найдено
              </div>
            ) : (
              <div className="divide-y divide-[var(--border-hairline)] max-h-[620px] overflow-y-auto">
                {filtered.map((client) => {
                  const isSelected = selectedClient?.id === client.id;
                  const ltv = getClientTotal(client);
                  return (
                    <button
                      key={client.id}
                      type="button"
                      onClick={() => setSelectedId(client.id)}
                      className={`w-full text-left px-5 py-4 transition-colors flex items-start justify-between gap-3 ${
                        isSelected
                          ? 'bg-[var(--accent-soft)]'
                          : 'hover:bg-[var(--bg-surface-hover)]'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-[var(--text-primary)] truncate">
                          {client.company || client.name}
                        </div>
                        <div className="mt-0.5 text-xs text-[var(--text-muted)] truncate">
                          {client.company ? `${client.name} · ` : ''}
                          {CLIENT_STATUS_LABELS[client.status]}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-xs font-semibold font-mono-num text-[var(--text-primary)]">
                          {formatMoney(ltv, profile.currency)}
                        </div>
                        <div className="mt-0.5 text-[11px] text-[var(--text-muted)] font-mono-num">
                          {client.orders.length}{' '}
                          {pluralizeRu(client.orders.length, 'заказ', 'заказа', 'заказов')}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Client Detail & Order History */}
          <div className="lg:col-span-7 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] overflow-hidden">
            {!selectedClient ? (
              <div className="p-12 text-center text-sm text-[var(--text-muted)]">
                Выберите клиента из списка слева
              </div>
            ) : (
              <div>
                {/* Client Header */}
                <div className="p-6 border-b border-[var(--border-hairline)]">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h2 className="text-lg font-bold text-[var(--text-primary)]">
                        {selectedClient.company || selectedClient.name}
                      </h2>
                      <div className="mt-1 text-xs text-[var(--text-muted)] flex flex-wrap items-center gap-2">
                        <span>{selectedClient.name}</span>
                        <span aria-hidden="true">·</span>
                        <span
                          className={
                            selectedClient.status === 'active'
                              ? 'text-emerald-500 font-medium'
                              : selectedClient.status === 'lead'
                                ? 'text-amber-500 font-medium'
                                : ''
                          }
                        >
                          {CLIENT_STATUS_LABELS[selectedClient.status]}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono-num">
                          В базе с {formatDateRu(selectedClient.createdAt)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingClient(selectedClient);
                          setClientModalOpen(true);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 min-h-[36px] rounded-lg border border-[var(--border-hairline)] text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        Изменить
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(selectedClient)}
                        aria-label="Удалить клиента"
                        className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-[var(--border-hairline)] text-[var(--text-muted)] hover:text-rose-500 hover:bg-[var(--bg-surface-hover)] transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Contact Info Row */}
                  <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-hairline)]">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Phone className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
                        <span className="text-xs font-mono-num text-[var(--text-primary)] truncate">
                          {selectedClient.phone || 'Не указан'}
                        </span>
                      </div>
                      {selectedClient.phone && (
                        <button
                          type="button"
                          onClick={() => handleCopy(selectedClient.phone, 'Телефон')}
                          aria-label="Копировать телефон"
                          className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-hairline)]">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Mail className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
                        <span className="text-xs text-[var(--text-primary)] truncate">
                          {selectedClient.email || 'Не указана'}
                        </span>
                      </div>
                      {selectedClient.email && (
                        <button
                          type="button"
                          onClick={() => handleCopy(selectedClient.email, 'Email')}
                          aria-label="Копировать email"
                          className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {selectedClient.notes && (
                    <p className="mt-4 text-xs text-[var(--text-secondary)] leading-relaxed">
                      {selectedClient.notes}
                    </p>
                  )}
                </div>

                {/* Order History Section */}
                <div className="p-6">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <div>
                      <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                        История заказов
                      </h3>
                      <p className="text-xs text-[var(--text-muted)] mt-0.5">
                        Суммарная выручка:{' '}
                        <span className="font-mono-num font-semibold text-[var(--text-primary)]">
                          {formatMoney(getClientTotal(selectedClient), profile.currency)}
                        </span>
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setOrderModalOpen(true)}
                      className="inline-flex items-center gap-2 px-3.5 min-h-[38px] rounded-lg bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-xs font-medium text-white transition-colors whitespace-nowrap"
                    >
                      <PackagePlus className="w-3.5 h-3.5" />
                      Новый заказ
                    </button>
                  </div>

                  {selectedClient.orders.length === 0 ? (
                    <div className="py-8 text-center text-xs text-[var(--text-muted)] border border-dashed border-[var(--border-hairline)] rounded-lg">
                      У этого клиента пока нет заказов
                    </div>
                  ) : (
                    <div className="divide-y divide-[var(--border-hairline)] border-t border-[var(--border-hairline)]">
                      {selectedClient.orders.map((order) => (
                        <div
                          key={order.id}
                          className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-[var(--text-primary)]">
                              {order.title}
                            </div>
                            <div className="mt-0.5 text-xs text-[var(--text-muted)] font-mono-num">
                              {formatDateRu(order.date)}
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                            <span className="text-sm font-semibold font-mono-num text-[var(--text-primary)]">
                              {formatMoney(order.amount, profile.currency)}
                            </span>

                            <select
                              value={order.status}
                              onChange={(e) =>
                                updateClientOrderStatus(
                                  selectedClient.id,
                                  order.id,
                                  e.target.value as OrderStatus
                                )
                              }
                              aria-label={`Статус заказа ${order.title}`}
                              className="min-h-[34px] px-2.5 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-hairline)] text-xs text-[var(--text-secondary)]"
                            >
                              {(Object.keys(ORDER_STATUS_LABELS) as OrderStatus[]).map((st) => (
                                <option key={st} value={st}>
                                  {ORDER_STATUS_LABELS[st]}
                                </option>
                              ))}
                            </select>

                            <button
                              type="button"
                              onClick={() => setDeleteOrderTarget(order)}
                              aria-label="Удалить заказ"
                              className="p-1.5 rounded text-[var(--text-muted)] hover:text-rose-500"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Client Form Modal */}
      <ClientModal
        open={clientModalOpen}
        onClose={() => setClientModalOpen(false)}
        editingClient={editingClient}
        onCreated={(id) => setSelectedId(id)}
      />

      {/* Add Order Modal */}
      <Modal
        open={orderModalOpen}
        onClose={() => setOrderModalOpen(false)}
        title="Новый заказ клиента"
        subtitle={selectedClient ? selectedClient.company || selectedClient.name : undefined}
      >
        <form onSubmit={handleAddOrderSubmit} className="space-y-4">
          <div>
            <label htmlFor="ord-title" className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
              Наименование услуги / заказа
            </label>
            <input
              id="ord-title"
              type="text"
              required
              value={orderTitle}
              onChange={(e) => setOrderTitle(e.target.value)}
              placeholder="Например: Разработка аналитического модуля"
              className="w-full min-h-[42px] px-3.5 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-hairline)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="ord-amount" className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
                Сумма ({profile.currency})
              </label>
              <input
                id="ord-amount"
                type="number"
                min="1"
                required
                value={orderAmount}
                onChange={(e) => setOrderAmount(e.target.value)}
                placeholder="180000"
                className="w-full min-h-[42px] px-3.5 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-hairline)] text-sm font-mono-num text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
              />
            </div>

            <div>
              <label htmlFor="ord-date" className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
                Дата заказа
              </label>
              <input
                id="ord-date"
                type="date"
                required
                value={orderDate}
                onChange={(e) => setOrderDate(e.target.value)}
                className="w-full min-h-[42px] px-3.5 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-hairline)] text-sm font-mono-num text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
              />
            </div>
          </div>

          <div>
            <label htmlFor="ord-status" className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
              Статус заказа
            </label>
            <select
              id="ord-status"
              value={orderStatus}
              onChange={(e) => setOrderStatus(e.target.value as OrderStatus)}
              className="w-full min-h-[42px] px-3 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-hairline)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
            >
              {(Object.keys(ORDER_STATUS_LABELS) as OrderStatus[]).map((st) => (
                <option key={st} value={st}>
                  {ORDER_STATUS_LABELS[st]}
                </option>
              ))}
            </select>
          </div>

          {(orderStatus === 'paid' || orderStatus === 'completed') && (
            <label className="flex items-center gap-2.5 text-xs text-[var(--text-secondary)] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={syncToFinance}
                onChange={(e) => setSyncToFinance(e.target.checked)}
                className="w-4 h-4 rounded accent-[var(--accent-primary)]"
              />
              Автоматически добавить запись дохода в раздел «Финансы»
            </label>
          )}

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setOrderModalOpen(false)}
              className="px-4 py-2 min-h-[40px] rounded-lg text-sm font-medium border border-[var(--border-hairline)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="px-5 py-2 min-h-[40px] rounded-lg text-sm font-medium bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white"
            >
              Добавить заказ
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) deleteClient(deleteTarget.id);
        }}
        title="Удалить клиента?"
        description={
          deleteTarget
            ? `Карточка клиента «${deleteTarget.company || deleteTarget.name}» и его история заказов будут удалены.`
            : ''
        }
        confirmLabel="Удалить"
      />

      <ConfirmModal
        open={!!deleteOrderTarget}
        onClose={() => setDeleteOrderTarget(null)}
        onConfirm={() => {
          if (selectedClient && deleteOrderTarget) {
            deleteClientOrder(selectedClient.id, deleteOrderTarget.id);
          }
        }}
        title="Удалить заказ?"
        description={
          deleteOrderTarget
            ? `Заказ «${deleteOrderTarget.title}» будет удалён из истории клиента.`
            : ''
        }
        confirmLabel="Удалить"
      />
    </div>
  );
};
