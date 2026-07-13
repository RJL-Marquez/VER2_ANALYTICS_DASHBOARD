import { useEffect, useRef, useState } from 'react';
import { CircleUserRound, ExternalLink, LogOut } from 'lucide-react';

interface AccountMenuProps {
  email: string;
  onLogout: () => void;
}

export function AccountMenu({ email, onLogout }: AccountMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const initials = email
    .split('@')[0]
    .split(/[.\-_]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  return (
    <div className="relative hidden lg:block" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        className={`inline-flex h-10 items-center gap-2 rounded-lg pl-2 pr-3 transition cursor-pointer ${
          isOpen ? 'bg-white/10 text-white' : 'text-blue-100 hover:text-white'
        }`}
        title="Account"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 text-xs font-bold text-white">
          {initials || <CircleUserRound size={18} />}
        </span>
        <span className="hidden xl:block max-w-[160px] truncate text-xs font-medium">{email}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 rounded-xl border border-slate-200 bg-white shadow-panel z-30 overflow-hidden dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-3 px-4 py-3.5 bg-slate-50 dark:bg-slate-950/60 border-b border-slate-100 dark:border-slate-800">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0063a9] text-sm font-bold text-white">
              {initials || <CircleUserRound size={20} />}
            </span>
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">Signed in as</p>
              <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{email}</p>
            </div>
          </div>

          <div className="py-1">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                window.open('https://myaccount.microsoft.com/', '_blank', 'noopener,noreferrer');
              }}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <ExternalLink size={16} className="text-slate-400 dark:text-slate-500" />
              View my account
            </button>
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800 py-1">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onLogout();
              }}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium text-rose hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer"
            >
              <LogOut size={16} />
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
