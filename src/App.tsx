import { useMemo, useRef, useState, useEffect } from 'react';
import { BarChart3, Bell, FileText, LayoutDashboard, Moon, Search, Sun, Table2, FilePlus, ClipboardCheck, ArrowLeft, LogOut, ShieldAlert, Users, Presentation, Archive, Database, UserCog } from 'lucide-react';
import { AccountMenu } from './components/AccountMenu';
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
import { SurveyFillerPage, SurveyFillerHandle } from './pages/SurveyFillerPage';
import { PartnerCompaniesPage } from './pages/PartnerCompaniesPage';
import { SurveyFormsPage } from './pages/SurveyFormsPage';
import { PresentPage } from './pages/PresentPage';
import { ArchivePage } from './pages/ArchivePage';
import { SimulatorPage } from './pages/SimulatorPage';
import { AccountManagementPage } from './pages/AccountManagementPage';
import { useSurveyData } from './hooks/useSurveyData';
import { applyFilters, initialFilters } from './utils/analytics';
import { FilterState, SurveyType, CustomForm } from './types/survey';
import { PageModuleKey, getDefaultPermissions, hasPageAccess } from './utils/rbac';

export interface AccountProfile {
  email: string;
  role: string;
  designation: string;
  department: string;
  permissions?: {
    pages: PageModuleKey[];
    surveyTypes: SurveyType[];
  };
}

const DEFAULT_ACCOUNTS: AccountProfile[] = [
  // System Administrator — unrestricted access to all modules and permissions.
  {
    email: 'admin@mgenesis.com',
    role: 'Admin',
    designation: 'Executive',
    department: 'Business Solutions Manager'
  },

  // Procurement
  {
    email: 'maria.fernandez@mgenesis.com',
    role: 'Employee',
    designation: 'Rank & File',
    department: 'Procurement Group'
  },
  {
    email: 'carlos.bautista@mgenesis.com',
    role: 'Employee',
    designation: 'Supervisory',
    department: 'Procurement Group'
  },
  {
    email: 'angela.reyes@mgenesis.com',
    role: 'Employee',
    designation: 'Managerial',
    department: 'Procurement Group'
  },

  // Logistics
  {
    email: 'miguel.santos@mgenesis.com',
    role: 'Employee',
    designation: 'Rank & File',
    department: 'Logistics'
  },
  {
    email: 'denise.aquino@mgenesis.com',
    role: 'Employee',
    designation: 'Supervisory',
    department: 'Logistics'
  },
  {
    email: 'ramon.villanueva@mgenesis.com',
    role: 'Employee',
    designation: 'Managerial',
    department: 'Logistics'
  },

  // Accounts Payable - Trade
  {
    email: 'kristine.manalo@mgenesis.com',
    role: 'Employee',
    designation: 'Rank & File',
    department: 'Accounts Payable - Trade'
  },
  {
    email: 'paolo.cruz@mgenesis.com',
    role: 'Employee',
    designation: 'Supervisory',
    department: 'Accounts Payable - Trade'
  },
  {
    email: 'bianca.torres@mgenesis.com',
    role: 'Employee',
    designation: 'Managerial',
    department: 'Accounts Payable - Trade'
  },

  // Business Solutions Manager (BSM)
  {
    email: 'joshua.ramos@mgenesis.com',
    role: 'Employee',
    designation: 'Rank & File',
    department: 'Business Solutions Manager'
  },
  {
    email: 'katrina.lopez@mgenesis.com',
    role: 'Employee',
    designation: 'Supervisory',
    department: 'Business Solutions Manager'
  },
  {
    email: 'nathaniel.garcia@mgenesis.com',
    role: 'Employee',
    designation: 'Managerial',
    department: 'Business Solutions Manager'
  },
  {
    email: 'estrella.domingo@mgenesis.com',
    role: 'Employee',
    designation: 'Director',
    department: 'Business Solutions Manager'
  },

  // TASS
  {
    email: 'julius.mercado@mgenesis.com',
    role: 'Employee',
    designation: 'Rank & File',
    department: 'TASS'
  },
  {
    email: 'corazon.ilagan@mgenesis.com',
    role: 'Employee',
    designation: 'Supervisory',
    department: 'TASS'
  },
  {
    email: 'vincent.alvarez@mgenesis.com',
    role: 'Employee',
    designation: 'Managerial',
    department: 'TASS'
  },
  {
    email: 'patricia.navarro@mgenesis.com',
    role: 'Employee',
    designation: 'Director',
    department: 'TASS'
  },

  // Executive Office (new department)
  {
    email: 'rafael.concepcion@mgenesis.com',
    role: 'Employee',
    designation: 'Executive',
    department: 'Executive Office'
  }
];

type PageKey = 'dashboard' | 'partner-companies' | 'account-management' | 'survey-forms' | 'analytics' | 'present' | 'explorer' | 'reports' | 'notifications' | 'create-form' | 'view-form' | 'fill-form' | 'archive' | 'simulator';

const adminPages = [
  { key: 'dashboard' as const, label: 'Dashboard', icon: LayoutDashboard, section: 'Overview' },

  { key: 'survey-forms' as const, label: 'Survey Forms', icon: ClipboardCheck, hasDropdown: true, section: 'Surveys' },
  { key: 'explorer' as const, label: 'Survey Explorer', icon: Table2, section: 'Surveys' },

  { key: 'analytics' as const, label: 'Analytics', icon: BarChart3, section: 'Analytics' },
  { key: 'reports' as const, label: 'Reports', icon: FileText, section: 'Analytics' },
  { key: 'present' as const, label: 'Present', icon: Presentation, section: 'Analytics' },

  { key: 'partner-companies' as const, label: 'Partner Companies', icon: Users, section: 'Management' },
  { key: 'account-management' as const, label: 'Account Management', icon: UserCog, section: 'Management' },

  { key: 'notifications' as const, label: 'Notification Logs', icon: Bell, section: 'System' },
  { key: 'archive' as const, label: 'Archive Center', icon: Archive, section: 'System' },
  { key: 'simulator' as const, label: 'Database Simulator', icon: Database, section: 'System' },
];

const allSurveyTypes: SurveyType[] = ['Courier', 'Supplier', 'Subcontractor'];

export default function App() {
  const [account, setAccount] = useState<string | null>(() => {
    return localStorage.getItem('user_account') || null;
  });

  // Accounts Management State
  const [accounts, setAccounts] = useState<AccountProfile[]>(() => {
    const saved = localStorage.getItem('survey_accounts_v1');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return DEFAULT_ACCOUNTS;
      }
    }
    return DEFAULT_ACCOUNTS;
  });

  const saveAccounts = (newAccounts: AccountProfile[]) => {
    setAccounts(newAccounts);
    localStorage.setItem('survey_accounts_v1', JSON.stringify(newAccounts));
  };

  const {
    responses,
    archivedResponses,
    archiveResponsesForSurveys,
    restoreResponseGroup,
    restoreResponsesForSurvey,
    deleteArchivedResponseGroups,
    restoreArchivedResponseGroups,
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
    updateSurvey,
    updateSurveysBulk,
    deleteSurvey,
    submitResponse,
    resetAllData,
    isFullDatasetActive,
    clearResponses,
    addEvaluations,
    resetSimulation,
  } = useSurveyData(accounts);

  const [activePage, setActivePage] = useState<PageKey>('dashboard');
  const [selectedSurveyId, setSelectedSurveyId] = useState<string | null>(null);
  const surveyFillerRef = useRef<SurveyFillerHandle>(null);

  // Any navigation away from the survey-filling page (sidebar Home logo, a
  // top-level nav item, or picking a different survey from the sidebar
  // dropdown) should go through this, so an in-progress evaluation can warn
  // the respondent and offer to save a draft instead of silently discarding
  // their answers.
  const navigateFrom = (targetPage: PageKey, run: () => void) => {
    if (activePage === 'fill-form' && targetPage !== 'fill-form' && surveyFillerRef.current) {
      surveyFillerRef.current.attemptExit(run);
    } else {
      run();
    }
  };
  const [editingSurveyId, setEditingSurveyId] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [darkMode, setDarkMode] = useState(false);

  const getUserProfile = (email: string | null) => {
    if (!email) return null;
    const normalized = email.trim().toLowerCase();
    const matched = accounts.find((acc) => acc.email.trim().toLowerCase() === normalized);
    if (matched) return matched;
    return {
      email: normalized,
      role: 'Employee',
      designation: 'Rank & File',
      department: 'Logistics'
    };
  };

  const profile = useMemo(() => getUserProfile(account), [account, accounts]);

  // centralize user permissions mapping based on active profile and overrides
  const userPermissions = useMemo(() => {
    if (!profile) return { pages: [] as PageModuleKey[], surveyTypes: [] as SurveyType[] };
    
    // System Administrator gets full unrestricted access unless custom overridden
    if (profile.role === 'Admin' && !profile.permissions) {
      return {
        pages: [
          'dashboard', 'survey-forms', 'explorer', 'analytics', 'reports', 'present', 
          'partner-companies', 'account-management', 'notifications', 'archive', 'simulator'
        ] as PageModuleKey[],
        surveyTypes: ['Courier', 'Supplier', 'Subcontractor'] as SurveyType[]
      };
    }

    const defaults = getDefaultPermissions(profile.designation, profile.department);
    return {
      pages: (profile.permissions?.pages ?? defaults.pages) as PageModuleKey[],
      surveyTypes: (profile.permissions?.surveyTypes ?? defaults.surveyTypes) as SurveyType[]
    };
  }, [profile]);

  const isAdmin = profile?.role === 'Admin' || userPermissions.pages.includes('account-management');

  // A survey's own "Department / Role Access" checkboxes (set via Survey Forms > Modify)
  // are the source of truth for who can see & answer that specific form. If a survey has
  // been explicitly shared with someone's department + rank, that alone should be enough
  // to unlock it for them - they shouldn't also need a separate category checkbox flipped
  // in Account Management. This computes which survey categories have been unlocked for
  // the current user purely through form-level access grants.
  const formGrantedSurveyTypes = useMemo(() => {
    const set = new Set<SurveyType>();
    if (!profile || profile.role === 'Admin') return set;
    surveys.forEach((survey) => {
      if (survey.status === 'Archived') return;
      const departmentAccess = survey.accessDepartments;
      const roleAccess = survey.accessRoles;
      const allowsDepartment = !departmentAccess?.length || departmentAccess.includes(profile.department);
      const allowsRole = !roleAccess?.length || roleAccess.includes(profile.designation as any);
      if (allowsDepartment && allowsRole) set.add(survey.surveyType);
    });
    return set;
  }, [surveys, profile]);

  // Effective survey type access = whatever Account Management grants, PLUS whatever
  // any individual survey's own access settings grant. This is a union (additive) so it
  // never revokes what Account Management already allows - it only extends access when
  // an admin explicitly shares a specific form with a department/role.
  const effectiveSurveyTypes = useMemo<SurveyType[]>(() => {
    const set = new Set<SurveyType>([...userPermissions.surveyTypes, ...formGrantedSurveyTypes]);
    return Array.from(set);
  }, [userPermissions.surveyTypes, formGrantedSurveyTypes]);

  const canExport = useMemo(() => {
    if (!profile) return false;
    return profile.role === 'Admin' || profile.designation !== 'Rank & File';
  }, [profile]);

  // Centralized Data Isolation & Filtering based on user department/rank/permitted types
  const userAccessibleResponses = useMemo(() => {
    if (!profile) return [];
    if (activePage === 'analytics') {
      return responses; // Analytics remains company-wide for all users
    }
    
    if (profile.role === 'Admin') {
      return responses.filter(r => effectiveSurveyTypes.includes(r.surveyType));
    }

    if (profile.designation === 'Executive' || profile.designation === 'Director') {
      return responses.filter(r => effectiveSurveyTypes.includes(r.surveyType));
    }

    if (profile.designation === 'Supervisory') {
      // Supervisor: see team/department responses
      return responses.filter(r => 
        r.department === profile.department && 
        effectiveSurveyTypes.includes(r.surveyType)
      );
    }

    if (profile.designation === 'Rank & File') {
      // Rank & File: see own responses
      return responses.filter(r => 
        r.respondentEmail === profile.email && 
        effectiveSurveyTypes.includes(r.surveyType)
      );
    }

    return responses.filter(r => effectiveSurveyTypes.includes(r.surveyType));
  }, [responses, profile, effectiveSurveyTypes, activePage]);

  const userAccessibleAllResponses = useMemo(() => {
    if (!profile) return [];
    if (activePage === 'analytics') {
      return responses;
    }

    if (profile.role === 'Admin' || profile.designation === 'Executive' || profile.designation === 'Director') {
      return responses.filter(r => effectiveSurveyTypes.includes(r.surveyType));
    }

    if (profile.designation === 'Supervisory') {
      return responses.filter(r => 
        r.department === profile.department && 
        effectiveSurveyTypes.includes(r.surveyType)
      );
    }

    if (profile.designation === 'Rank & File') {
      return responses.filter(r => 
        r.respondentEmail === profile.email && 
        effectiveSurveyTypes.includes(r.surveyType)
      );
    }

    return responses.filter(r => effectiveSurveyTypes.includes(r.surveyType));
  }, [responses, profile, effectiveSurveyTypes, activePage]);

  const userAccessibleSurveys = useMemo(() => {
    return surveys.filter((survey) => {
      if (!profile || profile.role === 'Admin') return true;
      if (!effectiveSurveyTypes.includes(survey.surveyType)) return false;

      const departmentAccess = survey.accessDepartments;
      const roleAccess = survey.accessRoles;
      const allowsDepartment = !departmentAccess?.length || departmentAccess.includes(profile.department);
      const allowsRole = !roleAccess?.length || roleAccess.includes(profile.designation as any);
      return allowsDepartment && allowsRole;
    });
  }, [surveys, effectiveSurveyTypes, profile]);

  const userAccessiblePartnerCompanies = useMemo(() => {
    return partnerCompanies.filter(c => effectiveSurveyTypes.includes(c.type));
  }, [partnerCompanies, effectiveSurveyTypes]);

  const filteredResponses = useMemo(() => applyFilters(userAccessibleResponses, filters), [userAccessibleResponses, filters]);
  const analyticsFilteredResponses = useMemo(() => applyFilters(responses, filters), [responses, filters]);
  
  const activeSurveyTypes = filters.surveyType.length ? filters.surveyType : effectiveSurveyTypes;


  const visiblePages = useMemo(() => {
    return adminPages.filter((page) => userPermissions.pages.includes(page.key as PageModuleKey));
  }, [userPermissions.pages]);

  const activeTitle = useMemo(() => {
    if (activePage === 'dashboard') {
      return 'Dashboard';
    }
    if (activePage === 'partner-companies') return 'Administrative Partner Registry';
    if (activePage === 'account-management') return 'Account Management';
    if (activePage === 'create-form') return editingSurveyId ? 'Edit Survey Form' : 'Create Survey Form';
    if (activePage === 'view-form') {
      const selected = surveys.find((s) => s.id === selectedSurveyId);
      return selected ? `Survey: ${selected.title}` : 'Survey Details';
    }
    if (activePage === 'fill-form') return 'Fill Out Stakeholder Survey';
    return adminPages.find((page) => page.key === activePage)?.label ?? 'Dashboard';
  }, [activePage, selectedSurveyId, surveys, editingSurveyId, profile]);

  const pageHeading = useMemo(() => {
    if (activePage === 'dashboard') {
      const namePart = profile?.email ? profile.email.split('@')[0] : 'User';
      const capitalizedName = namePart
        .split('.')
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
      return `Welcome Back, ${capitalizedName || 'User'}!`;
    }
    return activeTitle;
  }, [activePage, activeTitle, profile]);

  // Safe routing guard redirecting users to permitted views
  useEffect(() => {
    if (!account) return;
    const currentIsAllowed = hasPageAccess(userPermissions.pages, activePage, isAdmin);
    if (!currentIsAllowed) {
      const fallback = visiblePages[0]?.key || 'dashboard';
      setActivePage(fallback as PageKey);
    }
  }, [activePage, userPermissions.pages, visiblePages, account, isAdmin]);

  const handleLogin = (email: string) => {
    setAccount(email);
    localStorage.setItem('user_account', email);
    setActivePage('dashboard');
  };

  // Auth Guard
  if (!account) {
    return <LoginPage onLogin={handleLogin} />;
  }

  // Handler for custom survey submission
  const handleSurveySubmit = (
    surveyId: string,
    company: string,
    department: string,
    respondentType: string,
    address: string | undefined,
    answers: any[]
  ) => {
    submitResponse(surveyId, company, department, respondentType, address, answers, account || undefined);
  };

  // ----------------------------------------------------
  // ADMIN EXPERIENCE (ALL ANALYTICS SECURED HERE)
  // ----------------------------------------------------
  const pageContent = {
    dashboard: (
      <DashboardPage
        responses={filteredResponses}
        allResponses={userAccessibleAllResponses}
        partnerCompanies={userAccessiblePartnerCompanies}
        isLoading={isLoading}
        error={error}
        surveyTypeFilter={filters.surveyType}
        surveys={userAccessibleSurveys}
        isAdmin={isAdmin}
        userEmail={account || ''}
      />
    ),
    'partner-companies': (
      <PartnerCompaniesPage
        partnerCompanies={userAccessiblePartnerCompanies}
        responses={userAccessibleResponses}
        onAddCompany={addPartnerCompany}
        onRemoveCompany={removePartnerCompany}
        isAdmin={isAdmin}
      />
    ),
    'account-management': (
      <AccountManagementPage 
        accounts={accounts}
        onUpdateAccounts={saveAccounts}
        isAdmin={isAdmin}
        currentUserEmail={account || ''}
      />
    ),
    'survey-forms': (
      <SurveyFormsPage
        surveys={userAccessibleSurveys}
        responses={userAccessibleResponses}
        partnerCompanies={userAccessiblePartnerCompanies}
        userEmail={account || ''}
        onUpdateSurvey={updateSurvey}
        onUpdateSurveysBulk={updateSurveysBulk}
        onArchiveResponses={archiveResponsesForSurveys}
        onSelectSurvey={(id) => {
          setSelectedSurveyId(id);
          setActivePage('view-form');
        }}
        onNavigateToCreate={() => setActivePage('create-form')}
        onFillForm={(id) => {
          setSelectedSurveyId(id);
          setActivePage('fill-form');
        }}
        isAdmin={isAdmin}
      />
    ),
    analytics: (
      <AnalyticsPage
        responses={analyticsFilteredResponses}
        allResponses={responses}
        partnerCompanies={partnerCompanies}
        activeSurveyTypes={allSurveyTypes}
        filters={filters}
        setFilters={setFilters}
      />
    ),
    present: <PresentPage responses={userAccessibleResponses} partnerCompanies={userAccessiblePartnerCompanies} />,
    explorer: <SurveyExplorerPage responses={filteredResponses} surveys={userAccessibleSurveys} />,
    reports: (
      <ReportsPage
        responses={filteredResponses}
        partnerCompanies={userAccessiblePartnerCompanies}
        isAdmin={isAdmin}
        canExport={canExport}
        isAllCompanies={!filters.company}
      />
    ),
    notifications: <NotificationLogsPage notifications={notifications} unreadCount={unreadCount} />,
    'create-form': (
      <CreateSurveyPage
        onBack={() => {
          setEditingSurveyId(null);
          setActivePage('dashboard');
        }}
        surveyToEdit={editingSurveyId ? surveys.find(s => s.id === editingSurveyId) : undefined}
        onSave={(surveyData) => {
          if (editingSurveyId) {
            const currentSurvey = surveys.find(s => s.id === editingSurveyId);
            updateSurvey({
              ...surveyData,
              id: editingSurveyId,
              createdAt: currentSurvey?.createdAt || new Date().toISOString(),
            });
            setEditingSurveyId(null);
            setActivePage('view-form');
          } else {
            const newSurvey = createSurvey(surveyData);
            if (newSurvey) {
              setSelectedSurveyId(newSurvey.id);
              setActivePage('view-form');
            }
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
          responses={userAccessibleResponses}
          partnerCompanies={userAccessiblePartnerCompanies}
          userEmail={account || ''}
          onBack={() => setActivePage('dashboard')}
          onFillForm={(id) => {
            setSelectedSurveyId(id);
            setActivePage('fill-form');
          }}
          onDelete={(id) => {
            deleteSurvey(id);
            setActivePage('dashboard');
          }}
          onEdit={(id) => {
            setEditingSurveyId(id);
            setActivePage('create-form');
          }}
          isAdmin={isAdmin}
        />
      );
    })(),
    'fill-form': (
      <SurveyFillerPage
        ref={surveyFillerRef}
        surveys={userAccessibleSurveys}
        partnerCompanies={userAccessiblePartnerCompanies}
        initialSurveyId={selectedSurveyId}
        userEmail={account || ''}
        defaultDepartment={profile?.department}
        defaultRespondentType={profile?.designation}
        responses={userAccessibleResponses}
        onSubmitted={handleSurveySubmit}
        onCancel={() => setActivePage('view-form')}
      />
    ),
    archive: (
      <ArchivePage
        surveys={userAccessibleSurveys}
        archivedResponses={archivedResponses}
        onUpdateSurvey={updateSurvey}
        onRestoreResponseGroup={restoreResponseGroup}
        onRestoreResponsesForSurvey={restoreResponsesForSurvey}
        onDeleteArchivedResponseGroups={deleteArchivedResponseGroups}
        onRestoreArchivedResponseGroups={restoreArchivedResponseGroups}
        isAdmin={isAdmin}
      />
    ),
    simulator: (
      <SimulatorPage
        responses={responses}
        archivedResponses={archivedResponses}
        onSimulate={addEvaluations}
        onResetSimulation={resetSimulation}
      />
    ),
  }[activePage];

  // Content shown when the "Survey Forms" nav item's dropdown toggle is expanded:
  // the current forms, followed by "Add New" as the last option.
  const renderSidebarDropdown = (key: string) => {
    if (key !== 'survey-forms') return null;

    return (
      <>
        {userAccessibleSurveys.map((survey) => {
          const isViewing = activePage === 'view-form' && selectedSurveyId === survey.id;
          return (
            <button
              key={survey.id}
              onClick={() => {
                navigateFrom('view-form', () => {
                  setSelectedSurveyId(survey.id);
                  setActivePage('view-form');
                });
              }}
              className={`flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-xs font-medium transition ${
                isViewing
                  ? 'bg-blue-50 text-[#0063a9] font-bold dark:bg-blue-950/40 dark:text-blue-300'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900/50 dark:hover:text-white'
              }`}
              type="button"
              title={survey.title}
            >
              <span
                className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${
                  isViewing ? 'bg-[#0063a9] dark:bg-blue-400' : 'bg-slate-300 dark:bg-slate-600'
                }`}
              />
              <span className="truncate">{survey.title}</span>
            </button>
          );
        })}

        {isAdmin && (
          <button
            onClick={() => navigateFrom('create-form', () => setActivePage('create-form'))}
            className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition cursor-pointer"
            type="button"
            id="btn-sidebar-create"
          >
            <FilePlus size={14} />
            <span>＋ Add New</span>
          </button>
        )}
      </>
    );
  };

  return (
    <div className={darkMode ? 'dark' : ''}>
      <Shell
        pages={visiblePages}
        activePage={activePage as any}
        onPageChange={(page) => {
          const targetPage = page as PageKey;
          navigateFrom(targetPage, () => {
            setActivePage(targetPage);
            if (targetPage === 'notifications') markNotificationsRead();
          });
        }}
        title={activeTitle}
        pageHeading={pageHeading}
        renderDropdown={renderSidebarDropdown}
        action={
          <div className="flex items-center divide-x divide-blue-400/25">
            {isAdmin && (
              <div className="pr-3">
                <NotificationBell
                  notifications={notifications}
                  unreadCount={unreadCount}
                  onOpen={markNotificationsRead}
                  onViewAll={() => setActivePage('notifications')}
                />
              </div>
            )}
            <div className={isAdmin ? 'px-3' : 'pr-3'}>
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
              <AccountMenu
                email={account}
                designation={profile?.designation}
                department={profile?.department}
                role={profile?.role}
                onLogout={() => {
                  setAccount(null);
                  localStorage.removeItem('user_account');
                }}
              />
            </div>
          </div>
        }
      >
        <div className="space-y-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start">
            <div className="min-w-0 flex-1">{pageContent}</div>
          </div>
          
          {activePage !== 'notifications' && activePage !== 'create-form' && activePage !== 'fill-form' && activePage !== 'present' && (
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
