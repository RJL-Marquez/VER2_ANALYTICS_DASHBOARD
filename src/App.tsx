import { useMemo, useState } from 'react';
import { BarChart3, Bell, FileText, LayoutDashboard, Moon, Search, Sun, Table2, ChevronDown, ChevronRight, FilePlus, ClipboardCheck, ArrowLeft, LogOut, HelpCircle, ShieldAlert, Users } from 'lucide-react';
import { AccountMenu } from './components/AccountMenu';
import { FilterPanel } from './components/FilterPanel';
import { NotificationBell } from './components/NotificationBell';
import { Shell } from './layouts/Shell';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';
import { NotificationLogsPage } from './pages/NotificationLogsPage';
import { ReportsPage } from './pages/ReportsPage';
import { SurveyExplorerPage } from './pages/SurveyExplorerPage';
import { CreateSurveyPage } from './pages/CreateSurveyPage';
import { SurveyDetailsPage } from './pages/SurveyDetailsPage';
import { SurveyFillerPage } from './pages/SurveyFillerPage';
import { PartnerCompaniesPage } from './pages/PartnerCompaniesPage';
import { SurveyFormsPage } from './pages/SurveyFormsPage';
import { useSurveyData } from './hooks/useSurveyData';
import { applyFilters, initialFilters } from './utils/analytics';
import { FilterState, SurveyType, CustomForm } from './types/survey';

type PageKey = 'dashboard' | 'partner-companies' | 'survey-forms' | 'analytics' | 'explorer' | 'reports' | 'notifications' | 'create-form' | 'view-form' | 'fill-form';

const adminPages = [
  { key: 'dashboard' as const, label: 'Dashboard', icon: LayoutDashboard },
  { key: 'partner-companies' as const, label: 'Partner Companies', icon: Users },
  { key: 'survey-forms' as const, label: 'Survey Forms', icon: ClipboardCheck },
  { key: 'analytics' as const, label: 'Analytics', icon: BarChart3 },
  { key: 'explorer' as const, label: 'Survey Explorer', icon: Table2 },
  { key: 'reports' as const, label: 'Reports', icon: FileText },
  { key: 'notifications' as const, label: 'Notification Logs', icon: Bell },
];

const allSurveyTypes: SurveyType[] = ['Contractor', 'Supplier', 'Subcontractor'];

export default function App() {
  const {
    responses,
    surveys,
    questions,
    companies,
    partnerCompanies,
    addPartnerCompany,
    removePartnerCompany,
    isLoading,
    error,
    notifications,
    unreadCount,
    markNotificationsRead,
    createSurvey,
    deleteSurvey,
    submitResponse,
    resetAllData
  } = useSurveyData();

  const [activePage, setActivePage] = useState<PageKey>('dashboard');
  const [selectedSurveyId, setSelectedSurveyId] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [darkMode, setDarkMode] = useState(false);
  const [account, setAccount] = useState<string | null>(null);
  const [isFormsMenuOpen, setIsFormsMenuOpen] = useState(true);

  const filteredResponses = useMemo(() => applyFilters(responses, filters), [responses, filters]);
  const activeSurveyTypes = filters.surveyType.length ? filters.surveyType : allSurveyTypes;

  const activeTitle = useMemo(() => {
    if (activePage === 'partner-companies') return 'Administrative Partner Registry';
    if (activePage === 'create-form') return 'Create Survey Form';
    if (activePage === 'view-form') {
      const selected = surveys.find((s) => s.id === selectedSurveyId);
      return selected ? `Survey: ${selected.title}` : 'Survey Details';
    }
    if (activePage === 'fill-form') return 'Fill Out Stakeholder Survey';
    return adminPages.find((page) => page.key === activePage)?.label ?? 'Dashboard';
  }, [activePage, selectedSurveyId, surveys]);

  // Auth Guard
  if (!account) {
    return <LoginPage onLogin={(email) => setAccount(email)} />;
  }

  const isAdmin = account === 'admin@mgenesis.com';

  // Handler for custom survey submission
  const handleSurveySubmit = (
    surveyId: string,
    company: string,
    department: string,
    respondentType: string,
    answers: any[]
  ) => {
    submitResponse(surveyId, company, department, respondentType, answers);
  };

  // ----------------------------------------------------
  // PUBLIC RESPONDENT EXPERIENCE
  // ----------------------------------------------------
  if (!isAdmin) {
    return (
      <div className={darkMode ? 'dark' : ''}>
        <div className="min-h-screen bg-cloud text-ink dark:bg-slate-950 dark:text-slate-100 flex flex-col">
          {/* Public Header */}
          <header className="sticky top-0 z-20 h-20 border-b border-[#00528c] bg-[#0063a9] flex items-center justify-between w-full px-4 sm:px-8 shadow-sm">
            <div className="flex items-center gap-4">
              <img
                src="/microgenesis_logo.png"
                alt="Microgenesis Logo"
                className="h-10 object-contain brightness-0 invert"
                referrerPolicy="no-referrer"
              />
              <span className="hidden sm:inline h-6 w-px bg-blue-400/35" />
              <div className="hidden sm:block">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-blue-200 block leading-none">Microsoft Forms</span>
                <h1 className="text-base font-bold leading-tight mt-0.5 text-white">Stakeholder Submission Ingress</h1>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Dark mode button */}
              <button
                className={`inline-flex h-9 w-9 items-center justify-center rounded-lg transition cursor-pointer ${
                  darkMode ? 'bg-white/10 text-white' : 'text-blue-100 hover:text-white hover:bg-white/5'
                }`}
                type="button"
                onClick={() => setDarkMode((value) => !value)}
                title="Toggle dark mode"
              >
                {darkMode ? <Sun size={16} /> : <Moon size={16} />}
              </button>

              <button
                onClick={() => setAccount(null)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 border border-white/20 text-white px-3.5 py-1.5 text-xs font-semibold hover:bg-white/20 transition cursor-pointer"
                type="button"
                id="btn-public-signout"
              >
                <LogOut size={13} />
                <span>Exit Form</span>
              </button>
            </div>
          </header>

          <main className="flex-1 px-4 py-8 max-w-4xl w-full mx-auto">
            <SurveyFillerPage
              surveys={surveys}
              partnerCompanies={partnerCompanies}
              initialSurveyId={selectedSurveyId}
              onSubmitted={handleSurveySubmit}
              onCancel={() => {
                setSelectedSurveyId(null);
                setAccount(null);
              }}
            />
          </main>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // ADMIN EXPERIENCE (ALL ANALYTICS SECURED HERE)
  // ----------------------------------------------------
  const pageContent = {
    dashboard: (
      <DashboardPage
        responses={filteredResponses}
        allResponses={responses}
        partnerCompanies={partnerCompanies}
        isLoading={isLoading}
        error={error}
        surveyTypeFilter={filters.surveyType}
      />
    ),
    'partner-companies': (
      <PartnerCompaniesPage
        partnerCompanies={partnerCompanies}
        responses={responses}
        onAddCompany={addPartnerCompany}
        onRemoveCompany={removePartnerCompany}
      />
    ),
    'survey-forms': (
      <SurveyFormsPage
        surveys={surveys}
        responses={responses}
        onSelectSurvey={(id) => {
          setSelectedSurveyId(id);
          setActivePage('view-form');
        }}
        onNavigateToCreate={() => setActivePage('create-form')}
        onFillForm={(id) => {
          setSelectedSurveyId(id);
          setActivePage('fill-form');
        }}
      />
    ),
    analytics: <AnalyticsPage responses={filteredResponses} activeSurveyTypes={activeSurveyTypes} />,
    explorer: <SurveyExplorerPage responses={filteredResponses} />,
    reports: <ReportsPage responses={filteredResponses} />,
    notifications: <NotificationLogsPage notifications={notifications} unreadCount={unreadCount} />,
    'create-form': (
      <CreateSurveyPage
        onBack={() => setActivePage('dashboard')}
        onSave={(surveyData) => {
          const newSurvey = createSurvey(surveyData);
          if (newSurvey) {
            setSelectedSurveyId(newSurvey.id);
            setActivePage('view-form');
          }
        }}
      />
    ),
    'view-form': (() => {
      const targetSurvey = surveys.find((s) => s.id === selectedSurveyId);
      if (!targetSurvey) {
        return (
          <div className="panel p-8 text-center text-slate-500">
            <ShieldAlert size={36} className="mx-auto mb-2 text-rose-500" />
            <p className="font-semibold">Survey not found or was deleted.</p>
            <button onClick={() => setActivePage('dashboard')} className="primary-button mt-4">Return to Dashboard</button>
          </div>
        );
      }
      return (
        <SurveyDetailsPage
          survey={targetSurvey}
          responses={responses}
          onBack={() => setActivePage('dashboard')}
          onFillForm={(id) => {
            setSelectedSurveyId(id);
            setActivePage('fill-form');
          }}
          onDelete={(id) => {
            deleteSurvey(id);
            setActivePage('dashboard');
          }}
        />
      );
    })(),
    'fill-form': (
      <div className="space-y-4">
        <button
          onClick={() => setActivePage('view-form')}
          className="secondary-button"
          type="button"
        >
          <ArrowLeft size={16} />
          <span>Back to Form Management</span>
        </button>
        <SurveyFillerPage
          surveys={surveys}
          partnerCompanies={partnerCompanies}
          initialSurveyId={selectedSurveyId}
          onSubmitted={handleSurveySubmit}
          onCancel={() => setActivePage('view-form')}
        />
      </div>
    ),
  }[activePage];

  // Forms dropdown in the sidebar
  const surveyFormsDropdown = (
    <div className="space-y-2 px-1" id="admin-forms-dropdown">
      <button
        onClick={() => {
          setActivePage('survey-forms');
          setIsFormsMenuOpen(!isFormsMenuOpen);
        }}
        className={`flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-xs font-bold uppercase tracking-wider transition cursor-pointer ${
          activePage === 'survey-forms'
            ? 'text-[#0063a9] dark:text-blue-300 bg-blue-50/50 dark:bg-blue-950/20'
            : 'text-slate-400 hover:text-[#0063a9] dark:hover:text-blue-400'
        }`}
        type="button"
      >
        <span className="flex items-center gap-1.5">
          <HelpCircle size={14} className="text-[#0063a9] dark:text-blue-400" />
          <span>Survey Forms</span>
        </span>
        {isFormsMenuOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
      </button>

      {isFormsMenuOpen && (
        <div className="mt-1 pl-2.5 space-y-1.5 border-l border-slate-100 dark:border-slate-800">
          <button
            onClick={() => setActivePage('create-form')}
            className={`flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition cursor-pointer`}
            type="button"
            id="btn-sidebar-create"
          >
            <FilePlus size={14} />
            <span>＋ Create New Form</span>
          </button>

          {surveys.map((survey) => {
            const isViewing = activePage === 'view-form' && selectedSurveyId === survey.id;
            return (
              <button
                key={survey.id}
                onClick={() => {
                  setSelectedSurveyId(survey.id);
                  setActivePage('view-form');
                }}
                className={`flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-xs font-medium transition ${
                  isViewing
                    ? 'bg-blue-50 text-[#0063a9] font-bold dark:bg-blue-950/40 dark:text-blue-300'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900/50 dark:hover:text-white'
                }`}
                type="button"
                title={survey.title}
              >
                <ClipboardCheck size={14} className={isViewing ? 'text-[#0063a9] dark:text-blue-400' : 'text-slate-400'} />
                <span className="truncate">{survey.title}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <div className={darkMode ? 'dark' : ''}>
      <Shell
        pages={adminPages}
        activePage={activePage as any}
        onPageChange={(page) => {
          setActivePage(page as any);
          if (page === 'notifications') markNotificationsRead();
        }}
        title={activeTitle}
        surveyFormsDropdown={surveyFormsDropdown}
        action={
          <div className="flex items-center divide-x divide-blue-400/25">
            <div className="pr-3">
              <NotificationBell
                notifications={notifications}
                unreadCount={unreadCount}
                onOpen={markNotificationsRead}
                onViewAll={() => setActivePage('notifications')}
              />
            </div>
            <div className="px-3">
              <button
                className={`inline-flex h-10 w-10 items-center justify-center rounded-lg transition cursor-pointer ${
                  darkMode ? 'bg-white/10 text-white' : 'text-blue-100 hover:text-white'
                }`}
                type="button"
                onClick={() => setDarkMode((value) => !value)}
                title="Toggle dark mode"
              >
                {darkMode ? <Sun size={18} /> : <Moon size={18} />}
              </button>
            </div>
            <div className="pl-3">
              <AccountMenu email={account} onLogout={() => setAccount(null)} />
            </div>
          </div>
        }
      >
        <div className="space-y-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start">
            <div className="min-w-0 flex-1">{pageContent}</div>
            
            {/* Show Filter Panel only on Admin-view pages that need filters */}
            {activePage !== 'notifications' && activePage !== 'create-form' && activePage !== 'view-form' && activePage !== 'fill-form' && activePage !== 'partner-companies' && activePage !== 'survey-forms' && (
              <aside className="xl:w-80">
                <FilterPanel
                  filters={filters}
                  questions={questions}
                  companies={companies}
                  onChange={setFilters}
                  onReset={() => setFilters(initialFilters)}
                  isDashboard={activePage === 'dashboard'}
                />
              </aside>
            )}
          </div>
          
          {activePage !== 'notifications' && activePage !== 'create-form' && activePage !== 'fill-form' && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <Search size={16} className="text-[#0063a9] dark:text-blue-400 shrink-0" />
                <span>
                  Data Engine: Local Microsoft Forms creation model. Submissions immediately refresh visual analytics in real-time.
                </span>
              </div>
              <button
                onClick={resetAllData}
                className="text-xs font-bold text-rose-500 hover:text-rose-600 hover:underline transition shrink-0 cursor-pointer"
                title="Re-seed standard reports and database values"
              >
                Reset System Database
              </button>
            </div>
          )}
        </div>
      </Shell>
    </div>
  );
}
