import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { Client, ClientStatus } from '../types/business';
import { useBusiness } from '../context/BusinessContext';

interface ClientModalProps {
  open: boolean;
  onClose: () => void;
  editingClient?: Client | null;
  onCreated?: (clientId: string) => void;
}

export const ClientModal: React.FC<ClientModalProps> = ({
  open,
  onClose,
  editingClient = null,
  onCreated,
}) => {
  const { addClient, updateClient } = useBusiness();
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<ClientStatus>('active');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setError('');
    if (editingClient) {
      setName(editingClient.name);
      setCompany(editingClient.company);
      setPhone(editingClient.phone);
      setEmail(editingClient.email);
      setStatus(editingClient.status);
      setNotes(editingClient.notes);
    } else {
      setName('');
      setCompany('');
      setPhone('');
      setEmail('');
      setStatus('active');
      setNotes('');
    }
  }, [open, editingClient]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() && !company.trim()) {
      setError('Укажите имя контакта или название компании.');
      return;
    }

    const payload = {
      name: name.trim() || company.trim(),
      company: company.trim(),
      phone: phone.trim(),
      email: email.trim(),
      status,
      notes: notes.trim(),
    };

    if (editingClient) {
      updateClient(editingClient.id, payload);
    } else {
      const id = addClient(payload);
      onCreated?.(id);
    }
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editingClient ? 'Редактировать клиента' : 'Новый клиент'}
      subtitle="Контактные данные и карточка компании"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="cli-name" className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
              Контактное лицо
            </label>
            <input
              id="cli-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Иван Петров"
              className="w-full min-h-[42px] px-3.5 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-hairline)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
            />
          </div>

          <div>
            <label htmlFor="cli-company" className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
              Компания
            </label>
            <input
              id="cli-company"
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="ООО «Вектор»"
              className="w-full min-h-[42px] px-3.5 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-hairline)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="cli-phone" className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
              Телефон
            </label>
            <input
              id="cli-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+7 (999) 123-45-67"
              className="w-full min-h-[42px] px-3.5 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-hairline)] text-sm font-mono-num text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
            />
          </div>

          <div>
            <label htmlFor="cli-email" className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
              Электронная почта
            </label>
            <input
              id="cli-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="petrov@vektor.ru"
              className="w-full min-h-[42px] px-3.5 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-hairline)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
            />
          </div>
        </div>

        <div>
          <label htmlFor="cli-status" className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
            Статус
          </label>
          <select
            id="cli-status"
            value={status}
            onChange={(e) => setStatus(e.target.value as ClientStatus)}
            className="w-full min-h-[42px] px-3 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-hairline)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
          >
            <option value="active">Активный</option>
            <option value="lead">Потенциальный</option>
            <option value="archived">Архив</option>
          </select>
        </div>

        <div>
          <label htmlFor="cli-notes" className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
            Заметки о клиенте
          </label>
          <textarea
            id="cli-notes"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Предпочтения, условия договора, важные детали..."
            className="w-full p-3.5 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-hairline)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] resize-none"
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
            {editingClient ? 'Сохранить' : 'Добавить клиента'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
