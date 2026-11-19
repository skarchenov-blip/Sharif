import React, { useMemo, useState } from 'react';
import {
  Plus,
  Search,
  Check,
  Pencil,
  Trash2,
  LayoutList,
  Columns3,
} from 'lucide-react';
import { useBusiness } from '../context/BusinessContext';
import { TaskItem, TaskPriority, TaskStatus } from '../types/business';
import {
  getDeadlineMeta,
  PRIORITY_LABELS,
  TASK_STATUS_LABELS,
} from '../utils/formatters';
import { TaskModal } from '../components/TaskModal';
import { ConfirmModal } from '../components/ConfirmModal';

const STATUS_ORDER: TaskStatus[] = ['todo', 'in_progress', 'review', 'done'];

export const TasksView: React.FC = () => {
  const { data, setTaskStatus, deleteTask } = useBusiness();
  const { tasks, clients } = data;

  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [statusFilter, setStatusFilter] = useState<'all' | TaskStatus>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | TaskPriority>('all');
  const [search, setSearch] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TaskItem | null>(null);

  const clientMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of clients) {
      map.set(c.id, c.company || c.name);
    }
    return map;
  }, [clients]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tasks
      .filter((t) => {
        if (viewMode === 'list' && statusFilter !== 'all' && t.status !== statusFilter) return false;
        if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
        if (q) {
          const clientName = t.clientId ? (clientMap.get(t.clientId) || '').toLowerCase() : '';
          if (
            !t.title.toLowerCase().includes(q) &&
            !t.description.toLowerCase().includes(q) &&
            !clientName.includes(q)
          ) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => {
        if (a.status === 'done' && b.status !== 'done') return 1;
        if (a.status !== 'done' && b.status === 'done') return -1;
        return a.deadline.localeCompare(b.deadline);
      });
  }, [tasks, viewMode, statusFilter, priorityFilter, search, clientMap]);

  const stats = useMemo(() => {
    const total = tasks.length;
    const done = tasks.filter((t) => t.status === 'done').length;
    const overdue = tasks.filter(
      (t) => t.status !== 'done' && getDeadlineMeta(t.deadline, false).urgency === 'overdue'
    ).length;
    return { total, done, active: total - done, overdue };
  }, [tasks]);

  const handleCreate = () => {
    setEditingTask(null);
    setModalOpen(true);
  };

  const handleEdit = (task: TaskItem) => {
    setEditingTask(task);
    setModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Compact Stats Header */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)]">
          <div className="text-xs text-[var(--text-muted)]">Всего задач</div>
          <div className="mt-1.5 text-xl font-bold font-mono-num text-[var(--text-primary)]">
            {stats.total}
          </div>
        </div>
        <div className="p-4 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)]">
          <div className="text-xs text-[var(--text-muted)]">В работе</div>
          <div className="mt-1.5 text-xl font-bold font-mono-num text-[var(--text-primary)]">
            {stats.active}
          </div>
        </div>
        <div className="p-4 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)]">
          <div className="text-xs text-[var(--text-muted)]">Выполнено</div>
          <div className="mt-1.5 text-xl font-bold font-mono-num text-emerald-500">
            {stats.done}
          </div>
        </div>
        <div className="p-4 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)]">
          <div className="text-xs text-[var(--text-muted)]">Просрочено</div>
          <div
            className={`mt-1.5 text-xl font-bold font-mono-num ${
              stats.overdue > 0 ? 'text-rose-500' : 'text-[var(--text-primary)]'
            }`}
          >
            {stats.overdue}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {viewMode === 'list' && (
            <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-hairline)] overflow-x-auto max-w-full">
              {(['all', ...STATUS_ORDER] as const).map((st) => (
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
                  {st === 'all' ? 'Все' : TASK_STATUS_LABELS[st]}
                </button>
              ))}
            </div>
          )}

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as 'all' | TaskPriority)}
            aria-label="Фильтр по приоритету"
            className="min-h-[40px] px-3 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-hairline)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
          >
            <option value="all">Любой приоритет</option>
            <option value="high">Высокий</option>
            <option value="medium">Средний</option>
            <option value="low">Низкий</option>
          </select>

          <div className="relative flex-1 sm:w-56 sm:flex-none">
            <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск задачи..."
              className="w-full min-h-[40px] pl-9 pr-3 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-hairline)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-hairline)]">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              aria-label="Вид списком"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                viewMode === 'list'
                  ? 'bg-[var(--bg-surface-hover)] text-[var(--text-primary)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              <LayoutList className="w-3.5 h-3.5" />
              Список
            </button>
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              aria-label="Вид канбан-доски"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                viewMode === 'kanban'
                  ? 'bg-[var(--bg-surface-hover)] text-[var(--text-primary)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Columns3 className="w-3.5 h-3.5" />
              Доска
            </button>
          </div>

          <button
            type="button"
            onClick={handleCreate}
            className="inline-flex items-center gap-2 px-4 min-h-[40px] rounded-lg bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-sm font-medium text-white transition-colors whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            Новая задача
          </button>
        </div>
      </div>

      {/* Content */}
      {viewMode === 'list' ? (
        <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] overflow-hidden">
          {filtered.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-sm font-medium text-[var(--text-primary)]">Задачи не найдены</p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                Создайте новую задачу или сбросьте фильтры.
              </p>
              <button
                type="button"
                onClick={handleCreate}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 min-h-[40px] rounded-lg text-sm font-medium bg-[var(--accent-primary)] text-white"
              >
                <Plus className="w-4 h-4" />
                Создать задачу
              </button>
            </div>
          ) : (
            <div className="divide-y divide-[var(--border-hairline)]">
              {filtered.map((task) => {
                const isDone = task.status === 'done';
                const deadline = getDeadlineMeta(task.deadline, isDone);
                return (
                  <div
                    key={task.id}
                    className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-5 py-4 hover:bg-[var(--bg-surface-hover)] transition-colors"
                  >
                    <div className="flex items-start gap-3.5 min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={() => setTaskStatus(task.id, isDone ? 'todo' : 'done')}
                        aria-label={isDone ? 'Вернуть в работу' : 'Отметить выполненной'}
                        className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                          isDone
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'border-[var(--border-hairline)] hover:border-[var(--accent-primary)] text-transparent'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>

                      <div className="min-w-0 flex-1">
                        <div
                          className={`text-sm font-medium ${
                            isDone
                              ? 'line-through text-[var(--text-muted)]'
                              : 'text-[var(--text-primary)]'
                          }`}
                        >
                          {task.title}
                        </div>
                        {task.description && (
                          <p className="mt-1 text-xs text-[var(--text-muted)] line-clamp-1">
                            {task.description}
                          </p>
                        )}
                        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-[var(--text-muted)]">
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
                              deadline.urgency === 'overdue'
                                ? 'text-rose-500 font-medium'
                                : deadline.urgency === 'today'
                                  ? 'text-amber-500 font-medium'
                                  : ''
                            }`}
                          >
                            Дедлайн: {deadline.label}
                          </span>
                          {task.clientId && clientMap.get(task.clientId) && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="text-[var(--text-secondary)]">
                                {clientMap.get(task.clientId)}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-2 pl-8 md:pl-0 shrink-0">
                      <select
                        value={task.status}
                        onChange={(e) => setTaskStatus(task.id, e.target.value as TaskStatus)}
                        aria-label={`Статус задачи ${task.title}`}
                        className="min-h-[36px] px-2.5 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-hairline)] text-xs font-medium text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                      >
                        {STATUS_ORDER.map((st) => (
                          <option key={st} value={st}>
                            {TASK_STATUS_LABELS[st]}
                          </option>
                        ))}
                      </select>

                      <button
                        type="button"
                        onClick={() => handleEdit(task)}
                        aria-label="Редактировать задачу"
                        className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeleteTarget(task)}
                        aria-label="Удалить задачу"
                        className="p-2 rounded-lg text-[var(--text-muted)] hover:text-rose-500 hover:bg-[var(--bg-subtle)] transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Kanban View */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
          {STATUS_ORDER.map((colStatus) => {
            const colTasks = filtered.filter((t) => t.status === colStatus);
            return (
              <div
                key={colStatus}
                className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] overflow-hidden"
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-hairline)]">
                  <span className="text-xs font-semibold text-[var(--text-primary)]">
                    {TASK_STATUS_LABELS[colStatus]}
                  </span>
                  <span className="text-xs font-mono-num text-[var(--text-muted)]">
                    {colTasks.length}
                  </span>
                </div>
                <div className="divide-y divide-[var(--border-hairline)]">
                  {colTasks.length === 0 ? (
                    <div className="p-6 text-center text-xs text-[var(--text-muted)]">
                      Пусто
                    </div>
                  ) : (
                    colTasks.map((task) => {
                      const deadline = getDeadlineMeta(task.deadline, task.status === 'done');
                      return (
                        <div key={task.id} className="p-4 space-y-2.5">
                          <div className="flex items-start justify-between gap-2">
                            <button
                              type="button"
                              onClick={() => handleEdit(task)}
                              className="text-left text-sm font-medium text-[var(--text-primary)] hover:text-[var(--accent-text)] transition-colors"
                            >
                              {task.title}
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(task)}
                              aria-label="Удалить"
                              className="p-1 text-[var(--text-muted)] hover:text-rose-500 shrink-0"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div className="text-xs text-[var(--text-muted)] flex flex-wrap items-center gap-1.5">
                            <span
                              className={
                                task.priority === 'high'
                                  ? 'text-rose-500 font-medium'
                                  : task.priority === 'medium'
                                    ? 'text-amber-500'
                                    : ''
                              }
                            >
                              {PRIORITY_LABELS[task.priority]}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span
                              className={`font-mono-num ${
                                deadline.urgency === 'overdue' ? 'text-rose-500 font-medium' : ''
                              }`}
                            >
                              {deadline.label}
                            </span>
                          </div>
                          <select
                            value={task.status}
                            onChange={(e) => setTaskStatus(task.id, e.target.value as TaskStatus)}
                            className="w-full min-h-[34px] px-2.5 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-hairline)] text-xs text-[var(--text-secondary)]"
                          >
                            {STATUS_ORDER.map((st) => (
                              <option key={st} value={st}>
                                {TASK_STATUS_LABELS[st]}
                              </option>
                            ))}
                          </select>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <TaskModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        editingTask={editingTask}
      />

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) deleteTask(deleteTarget.id);
        }}
        title="Удалить задачу?"
        description={
          deleteTarget
            ? `Задача «${deleteTarget.title}» будет удалена без возможности восстановления.`
            : ''
        }
        confirmLabel="Удалить"
      />
    </div>
  );
};
