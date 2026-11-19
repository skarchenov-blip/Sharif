import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { TaskItem, TaskPriority, TaskStatus } from '../types/business';
import { getTodayISO, shiftDaysISO } from '../utils/formatters';
import { useBusiness } from '../context/BusinessContext';

interface TaskModalProps {
  open: boolean;
  onClose: () => void;
  editingTask?: TaskItem | null;
}

export const TaskModal: React.FC<TaskModalProps> = ({ open, onClose, editingTask = null }) => {
  const { data, addTask, updateTask } = useBusiness();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [status, setStatus] = useState<TaskStatus>('todo');
  const [deadline, setDeadline] = useState(shiftDaysISO(getTodayISO(), 2));
  const [clientId, setClientId] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setError('');
    if (editingTask) {
      setTitle(editingTask.title);
      setDescription(editingTask.description);
      setPriority(editingTask.priority);
      setStatus(editingTask.status);
      setDeadline(editingTask.deadline);
      setClientId(editingTask.clientId || '');
    } else {
      setTitle('');
      setDescription('');
      setPriority('medium');
      setStatus('todo');
      setDeadline(shiftDaysISO(getTodayISO(), 2));
      setClientId('');
    }
  }, [open, editingTask]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Введите название задачи.');
      return;
    }

    const payload = {
      title: title.trim(),
      description: description.trim(),
      priority,
      status,
      deadline: deadline || getTodayISO(),
      clientId: clientId || undefined,
    };

    if (editingTask) {
      updateTask(editingTask.id, payload);
    } else {
      addTask(payload);
    }
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editingTask ? 'Редактировать задачу' : 'Новая задача'}
      subtitle="Укажите приоритет, дедлайн и ответственного клиента при необходимости"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="task-title" className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
            Название задачи
          </label>
          <input
            id="task-title"
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Например: Подготовить финансовый отчёт за квартал"
            className="w-full min-h-[42px] px-3.5 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-hairline)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
          />
        </div>

        <div>
          <label htmlFor="task-desc" className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
            Описание
          </label>
          <textarea
            id="task-desc"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Детали выполнения и ожидаемый результат..."
            className="w-full p-3.5 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-hairline)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] resize-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="task-priority" className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
              Приоритет
            </label>
            <select
              id="task-priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
              className="w-full min-h-[42px] px-3 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-hairline)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
            >
              <option value="high">Высокий</option>
              <option value="medium">Средний</option>
              <option value="low">Низкий</option>
            </select>
          </div>

          <div>
            <label htmlFor="task-status" className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
              Статус
            </label>
            <select
              id="task-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as TaskStatus)}
              className="w-full min-h-[42px] px-3 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-hairline)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
            >
              <option value="todo">К выполнению</option>
              <option value="in_progress">В работе</option>
              <option value="review">На проверке</option>
              <option value="done">Выполнено</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="task-deadline" className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
              Дедлайн
            </label>
            <input
              id="task-deadline"
              type="date"
              required
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full min-h-[42px] px-3.5 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-hairline)] text-sm font-mono-num text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
            />
          </div>

          <div>
            <label htmlFor="task-client" className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
              Клиент (необязательно)
            </label>
            <select
              id="task-client"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="w-full min-h-[42px] px-3 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-hairline)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
            >
              <option value="">Внутренняя задача</option>
              {data.clients.map((cl) => (
                <option key={cl.id} value={cl.id}>
                  {cl.company || cl.name}
                </option>
              ))}
            </select>
          </div>
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
            {editingTask ? 'Сохранить' : 'Создать задачу'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
