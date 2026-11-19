import React, { useRef, useState } from 'react';
import {
  Save,
  Download,
  Upload,
  RotateCcw,
  Trash2,
  Check,
} from 'lucide-react';
import { useBusiness } from '../context/BusinessContext';
import { AccentId, CurrencyCode, ThemeId } from '../types/business';
import { Avatar } from '../components/Avatar';
import { ConfirmModal } from '../components/ConfirmModal';
import { DEFAULT_AVATAR_URL } from '../data/seedData';

const THEMES: { id: ThemeId; title: string; desc: string; swatch: string }[] = [
  {
    id: 'slate-dark',
    title: 'Тёмная графитовая',
    desc: 'Глубокий сине-графитовый фон',
    swatch: '#0b1120',
  },
  {
    id: 'obsidian',
    title: 'Глубокий ночной',
    desc: 'Контрастный нейтральный тёмный',
    swatch: '#09090b',
  },
  {
    id: 'light',
    title: 'Светлая классическая',
    desc: 'Дневной деловой режим',
    swatch: '#f8fafc',
  },
];

const ACCENTS: { id: AccentId; label: string; color: string }[] = [
  { id: 'emerald', label: 'Изумрудный', color: '#10b981' },
  { id: 'indigo', label: 'Индиго', color: '#6366f1' },
  { id: 'amber', label: 'Янтарный', color: '#f59e0b' },
];

export const SettingsView: React.FC = () => {
  const {
    data,
    updateProfile,
    updateSettings,
    saveNow,
    exportBackup,
    importBackup,
    resetDemoData,
    clearAllData,
    notify,
  } = useBusiness();

  const [name, setName] = useState(data.profile.name);
  const [role, setRole] = useState(data.profile.role);
  const [companyName, setCompanyName] = useState(data.profile.companyName);
  const [email, setEmail] = useState(data.profile.email);
  const [currency, setCurrency] = useState<CurrencyCode>(data.profile.currency);
  const [avatarUrl, setAvatarUrl] = useState(data.profile.avatarUrl);

  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      notify('Укажите имя пользователя', 'error');
      return;
    }
    updateProfile({
      name: name.trim(),
      role: role.trim() || 'Руководитель',
      companyName: companyName.trim() || 'Мой бизнес',
      email: email.trim(),
      currency,
      avatarUrl,
    });
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1_500_000) {
      notify('Изображение слишком большое (макс. 1.5 МБ)', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAvatarUrl(reader.result);
        updateProfile({ avatarUrl: reader.result });
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const ok = importBackup(reader.result);
        if (ok) {
          // Sync local form state with newly imported profile
          setTimeout(() => {
            window.location.reload();
          }, 500);
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const formattedLastSaved = new Date(data.settings.lastSavedAt).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <div className="max-w-4xl space-y-6">
      {/* 1. Profile Settings */}
      <section className="p-6 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)]">
        <div className="mb-5">
          <h2 className="text-base font-semibold text-[var(--text-primary)]">
            Профиль руководителя и компании
          </h2>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Персональные данные, отображаемые в интерфейсе, и основная валюта отчётов
          </p>
        </div>

        <form onSubmit={handleProfileSave} className="space-y-5">
          <div className="flex flex-wrap items-center gap-4">
            <Avatar src={avatarUrl} name={name} size="lg" />
            <div className="flex flex-wrap items-center gap-2">
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                className="px-3.5 min-h-[38px] rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] hover:bg-[var(--bg-surface-hover)] text-xs font-medium text-[var(--text-primary)] transition-colors"
              >
                Загрузить фото
              </button>
              {avatarUrl !== DEFAULT_AVATAR_URL && (
                <button
                  type="button"
                  onClick={() => {
                    setAvatarUrl(DEFAULT_AVATAR_URL);
                    updateProfile({ avatarUrl: DEFAULT_AVATAR_URL });
                  }}
                  className="px-3.5 min-h-[38px] rounded-lg text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                >
                  Стандартное фото
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="prof-name" className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
                Имя и фамилия
              </label>
              <input
                id="prof-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full min-h-[42px] px-3.5 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-hairline)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
              />
            </div>

            <div>
              <label htmlFor="prof-role" className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
                Должность
              </label>
              <input
                id="prof-role"
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full min-h-[42px] px-3.5 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-hairline)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
              />
            </div>

            <div>
              <label htmlFor="prof-company" className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
                Название компании
              </label>
              <input
                id="prof-company"
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full min-h-[42px] px-3.5 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-hairline)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
              />
            </div>

            <div>
              <label htmlFor="prof-email" className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
                Рабочий Email
              </label>
              <input
                id="prof-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full min-h-[42px] px-3.5 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-hairline)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
              />
            </div>

            <div>
              <label htmlFor="prof-currency" className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
                Основная валюта
              </label>
              <select
                id="prof-currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                className="w-full min-h-[42px] px-3 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-hairline)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
              >
                <option value="RUB">Российский рубль (₽)</option>
                <option value="USD">Доллар США ($)</option>
                <option value="EUR">Евро (€)</option>
                <option value="KZT">Казахстанский тенге (₸)</option>
              </select>
            </div>
          </div>

          <div className="pt-1 flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 min-h-[40px] rounded-lg bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-sm font-medium text-white transition-colors"
            >
              <Save className="w-4 h-4" />
              Сохранить профиль
            </button>
          </div>
        </form>
      </section>

      {/* 2. Theme & Accent */}
      <section className="p-6 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] space-y-5">
        <div>
          <h2 className="text-base font-semibold text-[var(--text-primary)]">
            Оформление и выбор темы
          </h2>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Настройки применяются мгновенно и сохраняются между сессиями
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {THEMES.map((t) => {
            const active = data.settings.theme === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  updateSettings({ theme: t.id });
                  notify(`Тема «${t.title}» применена`, 'info');
                }}
                className={`p-4 rounded-xl border text-left transition-colors flex items-start gap-3 ${
                  active
                    ? 'border-[var(--accent-primary)] bg-[var(--accent-soft)]'
                    : 'border-[var(--border-hairline)] bg-[var(--bg-canvas)] hover:bg-[var(--bg-surface-hover)]'
                }`}
              >
                <span
                  className="w-6 h-6 rounded-md border border-slate-500/30 shrink-0 mt-0.5 flex items-center justify-center"
                  style={{ backgroundColor: t.swatch }}
                >
                  {active && (
                    <Check
                      className={`w-3.5 h-3.5 ${t.id === 'light' ? 'text-slate-900' : 'text-white'}`}
                    />
                  )}
                </span>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-[var(--text-primary)]">{t.title}</div>
                  <div className="text-xs text-[var(--text-muted)] mt-0.5">{t.desc}</div>
                </div>
              </button>
            );
          })}
        </div>

        <div>
          <div className="text-xs font-medium text-[var(--text-muted)] mb-2.5">
            Акцентный цвет интерфейса
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            {ACCENTS.map((acc) => {
              const active = data.settings.accent === acc.id;
              return (
                <button
                  key={acc.id}
                  type="button"
                  onClick={() => {
                    updateSettings({ accent: acc.id });
                    notify(`Акцент «${acc.label}» выбран`, 'info');
                  }}
                  className={`inline-flex items-center gap-2 px-3.5 min-h-[38px] rounded-lg border text-xs font-medium transition-colors ${
                    active
                      ? 'border-[var(--accent-primary)] bg-[var(--accent-soft)] text-[var(--text-primary)]'
                      : 'border-[var(--border-hairline)] bg-[var(--bg-canvas)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: acc.color }}
                  />
                  {acc.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. Data Persistence & Backup */}
      <section className="p-6 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-[var(--text-primary)]">
              Сохранение данных и резервные копии
            </h2>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Последнее сохранение: <span className="font-mono-num">{formattedLastSaved}</span>
            </p>
          </div>

          <label className="inline-flex items-center gap-2.5 text-xs font-medium text-[var(--text-secondary)] cursor-pointer select-none">
            <input
              type="checkbox"
              checked={data.settings.autoSave}
              onChange={(e) => {
                updateSettings({ autoSave: e.target.checked });
                notify(
                  e.target.checked ? 'Автосохранение включено' : 'Автосохранение отключено',
                  'info'
                );
              }}
              className="w-4 h-4 rounded accent-[var(--accent-primary)]"
            />
            Автоматическое сохранение
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={saveNow}
            className="inline-flex items-center gap-2 px-4 min-h-[40px] rounded-lg bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-sm font-medium text-white transition-colors"
          >
            <Save className="w-4 h-4" />
            Сохранить сейчас
          </button>

          <button
            type="button"
            onClick={exportBackup}
            className="inline-flex items-center gap-2 px-4 min-h-[40px] rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] hover:bg-[var(--bg-surface-hover)] text-sm font-medium text-[var(--text-primary)] transition-colors"
          >
            <Download className="w-4 h-4" />
            Экспорт JSON
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            onChange={handleImportJson}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 px-4 min-h-[40px] rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] hover:bg-[var(--bg-surface-hover)] text-sm font-medium text-[var(--text-primary)] transition-colors"
          >
            <Upload className="w-4 h-4" />
            Импорт JSON
          </button>
        </div>

        <div className="pt-4 border-t border-[var(--border-hairline)] flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-[var(--text-muted)]">
            Управление базой записей в локальном хранилище браузера
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className="inline-flex items-center gap-2 px-3.5 min-h-[38px] rounded-lg border border-[var(--border-hairline)] text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Восстановить демо-данные
            </button>
            <button
              type="button"
              onClick={() => setConfirmClear(true)}
              className="inline-flex items-center gap-2 px-3.5 min-h-[38px] rounded-lg border border-rose-500/30 text-xs font-medium text-rose-500 hover:bg-rose-500/10 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Очистить все записи
            </button>
          </div>
        </div>
      </section>

      <ConfirmModal
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        onConfirm={resetDemoData}
        title="Восстановить демонстрационные данные?"
        description="Текущие операции, задачи и клиенты будут заменены исходным демонстрационным набором."
        confirmLabel="Восстановить"
        danger={false}
      />

      <ConfirmModal
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        onConfirm={clearAllData}
        title="Очистить все данные?"
        description="Все финансовые операции, задачи и база клиентов будут удалены без возможности восстановления. Рекомендуем предварительно сделать экспорт JSON."
        confirmLabel="Очистить всё"
        danger
      />
    </div>
  );
};
