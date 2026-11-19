import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  LayoutDashboard,
  Wallet,
  CheckSquare,
  Users,
  BarChart3,
  Settings,
  X,
} from 'lucide-react';
import { NavSection } from '../types/business';
import { useBusiness } from '../context/BusinessContext';
import { Avatar } from './Avatar';

interface SidebarProps {
  activeSection: NavSection;
  onNavigate: (section: NavSection) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

const NAV_ITEMS: { id: NavSection; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'dashboard', label: 'Главная панель', icon: LayoutDashboard },
  { id: 'finance', label: 'Финансы', icon: Wallet },
  { id: 'tasks', label: 'Задачи', icon: CheckSquare },
  { id: 'clients', label: 'Клиенты', icon: Users },
  { id: 'analytics', label: 'Аналитика', icon: BarChart3 },
  { id: 'settings', label: 'Настройки', icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({
  activeSection,
  onNavigate,
  mobileOpen,
  onCloseMobile,
}) => {
  const { data } = useBusiness();
  const activeTasksCount = data.tasks.filter((t) => t.status !== 'done').length;

  const renderContent = (isMobile: boolean) => (
    <div className="flex flex-col h-full bg-[var(--bg-surface)] border-r border-[var(--border-hairline)] w-[260px]">
      {/* Brand mark */}
      <div className="flex items-center justify-between px-5 h-16 border-b border-[var(--border-hairline)] shrink-0">
        <button
          type="button"
          onClick={() => {
            onNavigate('dashboard');
            if (isMobile) onCloseMobile();
          }}
          className="text-left focus-visible:outline-2 focus-visible:outline-[var(--accent-primary)] rounded"
        >
          <span className="text-[17px] font-bold tracking-tight text-[var(--text-primary)] whitespace-nowrap block">
            Business Manager Pro
          </span>
        </button>
        {isMobile && (
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Закрыть меню"
            className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto" aria-label="Основная навигация">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                onNavigate(item.id);
                if (isMobile) onCloseMobile();
              }}
              className={`w-full flex items-center justify-between gap-3 px-3.5 min-h-[44px] rounded-lg text-sm font-medium transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-[var(--accent-primary)] ${
                isActive
                  ? 'bg-[var(--accent-soft)] text-[var(--accent-text)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]'
              }`}
            >
              <span className="flex items-center gap-3 min-w-0">
                <Icon className="w-[18px] h-[18px] shrink-0" />
                <span className="truncate">{item.label}</span>
              </span>
              {item.id === 'tasks' && activeTasksCount > 0 && (
                <span className="text-xs font-mono-num text-[var(--text-muted)]">
                  {activeTasksCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Profile Footer */}
      <div className="p-3 border-t border-[var(--border-hairline)] shrink-0">
        <button
          type="button"
          onClick={() => {
            onNavigate('settings');
            if (isMobile) onCloseMobile();
          }}
          className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--bg-surface-hover)] transition-colors text-left focus-visible:outline-2 focus-visible:outline-[var(--accent-primary)]"
        >
          <Avatar src={data.profile.avatarUrl} name={data.profile.name} size="md" />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-[var(--text-primary)] truncate">
              {data.profile.name}
            </div>
            <div className="text-xs text-[var(--text-muted)] truncate">
              {data.profile.companyName}
            </div>
          </div>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop persistent sidebar */}
      <aside className="hidden lg:block shrink-0 h-screen sticky top-0">
        {renderContent(false)}
      </aside>

      {/* Mobile slide-over drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.16 }}
              onClick={onCloseMobile}
              className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs"
            />
            <motion.aside
              initial={{ x: -260 }}
              animate={{ x: 0 }}
              exit={{ x: -260 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="relative z-10 h-full"
            >
              {renderContent(true)}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
