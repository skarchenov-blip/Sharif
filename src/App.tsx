import React, { useState } from 'react';
import { AnimatePresence, motion, MotionConfig } from 'motion/react';
import { Menu, Plus } from 'lucide-react';
import { BusinessProvider } from './context/BusinessContext';
import { NavSection } from './types/business';
import { Sidebar } from './components/Sidebar';
import { ToastContainer } from './components/ToastContainer';
import { DashboardView } from './views/DashboardView';
import { FinanceView } from './views/FinanceView';
import { TasksView } from './views/TasksView';
import { ClientsView } from './views/ClientsView';
import { AnalyticsView } from './views/AnalyticsView';
import { SettingsView } from './views/SettingsView';
import { TransactionModal } from './components/TransactionModal';

const SECTION_META: Record<NavSection, { title: string; subtitle: string }> = {
  dashboard: {
    title: 'Главная панель',
    subtitle: 'Ключевые показатели финансов, задач и клиентской базы',
  },
  finance: {
    title: 'Финансы',
    subtitle: 'Учёт доходов, расходов и автоматический расчёт прибыли',
  },
  tasks: {
    title: 'Задачи',
    subtitle: 'Планирование, приоритеты, статусы и контроль дедлайнов',
  },
  clients: {
    title: 'Клиенты',
    subtitle: 'База контрагентов, контакты и история заказов',
  },
  analytics: {
    title: 'Аналитика',
    subtitle: 'Динамика за неделю и месяц, структура потоков и эффективность',
  },
  settings: {
    title: 'Настройки',
    subtitle: 'Профиль руководителя, оформление и резервное копирование',
  },
};

function AppWorkspace() {
  const [activeSection, setActiveSection] = useState<NavSection>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [quickTxOpen, setQuickTxOpen] = useState(false);

  const meta = SECTION_META[activeSection];

  const renderView = () => {
    switch (activeSection) {
      case 'dashboard':
        return <DashboardView onNavigate={setActiveSection} />;
      case 'finance':
        return <FinanceView />;
      case 'tasks':
        return <TasksView />;
      case 'clients':
        return <ClientsView />;
      case 'analytics':
        return <AnalyticsView />;
      case 'settings':
        return <SettingsView />;
    }
  };

  return (
    <div className="min-h-screen flex bg-[var(--bg-canvas)] text-[var(--text-primary)]">
      <Sidebar
        activeSection={activeSection}
        onNavigate={setActiveSection}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="sticky top-0 z-30 h-16 px-4 sm:px-6 lg:px-8 border-b border-[var(--border-hairline)] bg-[var(--bg-canvas)]/90 backdrop-blur-md flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Открыть навигацию"
              className="lg:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] text-[var(--text-primary)] shrink-0"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="min-w-0">
              <div className="flex items-center gap-2 text-sm sm:text-base font-semibold text-[var(--text-primary)] truncate">
                <span className="hidden sm:inline text-[var(--text-muted)] font-normal">
                  Business Manager Pro
                </span>
                <span className="hidden sm:inline text-[var(--text-muted)]" aria-hidden="true">
                  /
                </span>
                <h1 className="truncate">{meta.title}</h1>
              </div>
              <p className="hidden md:block text-xs text-[var(--text-muted)] truncate">
                {meta.subtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setQuickTxOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 sm:px-4 min-h-[40px] rounded-lg bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-xs sm:text-sm font-medium text-white transition-colors whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Новая операция</span>
              <span className="sm:hidden">Операция</span>
            </button>
          </div>
        </header>

        {/* Main Content Viewport */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 max-w-[1440px] w-full mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            >
              {renderView()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <TransactionModal
        open={quickTxOpen}
        onClose={() => setQuickTxOpen(false)}
        initialType="income"
      />
      <ToastContainer />
    </div>
  );
}

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <BusinessProvider>
        <AppWorkspace />
      </BusinessProvider>
    </MotionConfig>
  );
}
