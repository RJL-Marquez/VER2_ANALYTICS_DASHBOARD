import { useMemo, useState } from 'react';
import { BarChart3, FileText, LayoutDashboard, Moon, Search, Sun, Table2 } from 'lucide-react';
import { AccountMenu } from './components/AccountMenu';
import { FilterPanel } from './components/FilterPanel';
import { NotificationBell } from './components/NotificationBell';
import { Shell } from './layouts/Shell';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';
import { ReportsPage } from './pages/ReportsPage';
import { SurveyExplorerPage } from './pages/SurveyExplorerPage';
import { useSurveyData } from './hooks/useSurveyData';
import { applyFilters, initialFilters } from './utils/analytics';
import { FilterState, SurveyType } from './types/survey';

type PageKey = 'dashboard' | 'analytics' | 'explorer' | 'reports';

const pages = [
  { key: 'dashboard' as const, label: 'Dashboard', icon: LayoutDashboard },
  { key: 'analytics' as const, label: 'Analytics', icon: BarChart3 },
  { key: 'explorer' as const, label: 'Survey Explorer', icon: Table2 },
  { key: 'reports' as const, label: 'Reports', icon: FileText },
];

const allSurveyTypes: SurveyType[] = ['Contractor', 'Supplier', 'Subcontractor'];

export default function App() {
  const { responses, questions, companies, isLoading, error, notifications, unreadCount, markNotificationsRead } = useSurveyData();
  const [activePage, setActivePage] = useState<PageKey>('dashboard');
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [darkMode, setDarkMode] = useState(false);
  const [account, setAccount] = useState<string | null>(null);

  const filteredResponses = useMemo(() => applyFilters(responses, filters), [responses, filters]);
  const activeSurveyTypes = filters.surveyType.length ? filters.surveyType : allSurveyTypes;
  const activeTitle = pages.find((page) => page.key === activePage)?.label ?? 'Dashboard';

  if (!account) {
    return <LoginPage onLogin={(email) => setAccount(email)} />;
  }

  const pageContent = {
    dashboard: <DashboardPage responses={filteredResponses} isLoading={isLoading} error={error} />,
    analytics: <AnalyticsPage responses={filteredResponses} activeSurveyTypes={activeSurveyTypes} />,
    explorer: <SurveyExplorerPage responses={filteredResponses} />,
    reports: <ReportsPage responses={filteredResponses} />,
  }[activePage];

  return (
    <div className={darkMode ? 'dark' : ''}>
      <Shell
        pages={pages}
        activePage={activePage}
        onPageChange={setActivePage}
        title={activeTitle}
        action={
          <div className="flex items-center gap-3">
            <NotificationBell notifications={notifications} unreadCount={unreadCount} onOpen={markNotificationsRead} />
            <button className="header-action-btn inline-flex h-10 w-10 items-center justify-center rounded-lg text-blue-50 hover:text-white transition cursor-pointer" type="button" onClick={() => setDarkMode((value) => !value)} title="Toggle dark mode">
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <AccountMenu email={account} onLogout={() => setAccount(null)} />
          </div>
        }
      >
        <div className="space-y-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start">
            <div className="min-w-0 flex-1">{pageContent}</div>
            <aside className="xl:w-80">
              <FilterPanel
                filters={filters}
                questions={questions}
                companies={companies}
                onChange={setFilters}
                onReset={() => setFilters(initialFilters)}
              />
            </aside>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
            <Search size={16} />
            <span>Data source: mock SharePoint list records. Replace `sharepointService.ts` to connect live Microsoft 365 data.</span>
          </div>
        </div>
      </Shell>
    </div>
  );
}
