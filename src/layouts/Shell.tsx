import { LucideIcon, Menu, ChevronLeft, ChevronRight } from 'lucide-react';
import { ReactNode, useState } from 'react';

interface PageItem<T extends string> {
  key: T;
  label: string;
  icon: LucideIcon;
}

interface ShellProps<T extends string> {
  pages: PageItem<T>[];
  activePage: T;
  onPageChange: (page: T) => void;
  title: string;
  action: ReactNode;
  children: ReactNode;
}

export function Shell<T extends string>({ pages, activePage, onPageChange, title, action, children }: ShellProps<T>) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-cloud text-ink dark:bg-slate-950 dark:text-slate-100 flex flex-col">
      {/* Top Header Layer */}
      <header className="sticky top-0 z-20 h-16 border-b border-[#00528c] bg-[#0063a9] flex items-center justify-between w-full lg:pr-8 shadow-sm">
        <div className="flex items-center h-full flex-1 min-w-0">
          {/* Brand Box / Logo Area - Fixed Width, unaffected by collapsing */}
          <div className="relative z-10 flex items-center justify-center h-full bg-[#0063a9] shrink-0 w-[171px] px-4">
            <button
               onClick={() => {
                 const homePage = pages.find((p) => p.key === ('dashboard' as any))?.key || pages[0]?.key;
                 if (homePage) onPageChange(homePage);
               }}
              className="group flex w-full h-full items-center justify-center outline-none transition cursor-pointer overflow-hidden"
              title="Go to Dashboard"
            >
              <img
                src="/src/assets/images/microgenesis_logo.png"
                alt="Microgenesis Logo"
                className="transition duration-200 group-hover:opacity-90 shrink-0 h-8 max-w-full object-contain brightness-0 invert"
                referrerPolicy="no-referrer"
              />
            </button>
          </div>

          {/* Title Area */}
          <div className="hidden sm:block pl-6">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-blue-200 block leading-none">Microsoft Forms</span>
            <h1 className="text-base font-bold leading-tight flex items-center gap-1.5 mt-0.5 text-white">
              <span>Survey Analytics</span>
              <span className="text-blue-300/60">/</span>
              <span className="text-blue-100 font-medium">{title}</span>
            </h1>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-3 pl-4">
          <div className="flex rounded-lg border border-blue-400/20 bg-[#00528c] p-1 lg:hidden">
            {pages.map((page) => (
              <button
                key={page.key}
                className={`max-w-32 truncate rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  activePage === page.key 
                    ? 'bg-white text-[#0063a9] font-bold shadow-sm' 
                    : 'text-blue-100 hover:text-white hover:bg-white/5'
                }`}
                type="button"
                onClick={() => onPageChange(page.key)}
              >
                {page.label}
              </button>
            ))}
          </div>
          {action}
        </div>
      </header>

      {/* Main layout below header */}
      <div className="flex flex-1">
        {/* Sidebar - Below Header */}
        <div className={`relative sticky top-16 h-[calc(100vh-64px)] hidden border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 lg:block transition-all duration-300 shrink-0 ${isSidebarCollapsed ? 'w-16' : 'w-[171px]'}`}>
          {/* Toggle Sidebar Button on the right border, aligned lower down below menu items and fully visible */}
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="absolute top-[180px] -right-3.5 z-30 h-7 w-7 rounded-full border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-md flex items-center justify-center text-slate-500 hover:text-[#0063a9] hover:bg-slate-50 dark:hover:bg-slate-800 hover:scale-105 transition-all cursor-pointer"
            title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isSidebarCollapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
          </button>

          <aside className={`h-full overflow-y-auto py-6 transition-all duration-300 ${isSidebarCollapsed ? 'px-2' : 'px-3'}`}>
            <nav className="space-y-1">
              {pages.map((page) => {
                const Icon = page.icon;
                const active = activePage === page.key;

                return (
                  <button
                    key={page.key}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-all duration-200 ${
                      active
                        ? 'bg-blue-50 text-[#0063a9] dark:bg-blue-950/60 dark:text-blue-200 shadow-sm font-bold'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white'
                    } ${isSidebarCollapsed ? 'justify-center px-2' : ''}`}
                    type="button"
                    onClick={() => onPageChange(page.key)}
                    title={isSidebarCollapsed ? page.label : undefined}
                  >
                    <Icon size={18} className="shrink-0" />
                    {!isSidebarCollapsed && <span className="truncate">{page.label}</span>}
                  </button>
                );
              })}
            </nav>
          </aside>
        </div>

        {/* Page Content - Below Header */}
        <main className={`min-w-0 flex-1 transition-colors duration-300 ${activePage === 'reports' ? 'bg-azure dark:bg-blue-950 text-white' : ''}`}>
          <div className="px-4 py-6 lg:px-8">
            <div className="mb-6">
              <p className={`text-xs font-medium uppercase tracking-wider mb-1 ${activePage === 'reports' ? 'text-blue-100' : 'text-slate-500 dark:text-slate-400'}`}>Centralized stakeholder satisfaction reporting</p>
              <h2 className={`text-2xl font-bold tracking-tight ${activePage === 'reports' ? 'text-white' : 'text-slate-900 dark:text-white'}`}>{title}</h2>
            </div>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
