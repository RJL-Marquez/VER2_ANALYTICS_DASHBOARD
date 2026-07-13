import { useState, useRef, useEffect } from 'react';
import { LogOut, User, ChevronDown } from 'lucide-react';

interface AccountMenuProps {
  email: string;
  onLogout: () => void;
}

export function AccountMenu({ email, onLogout }: AccountMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown if clicked outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const initials = email
    .split('@')[0]
    .split('.')
    .map((name) => name[0]?.toUpperCase())
    .join('')
    .slice(0, 2) || 'AD';

  return (
    <div className="relative" ref={menuRef} id="account-menu-container">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg bg-[#00528c]/40 hover:bg-[#00528c]/60 px-3 py-1.5 transition text-white text-sm font-medium border border-blue-400/25 cursor-pointer outline-none"
        type="button"
        id="account-menu-trigger"
      >
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-[#0063a9] font-bold text-xs shadow-sm shrink-0">
          {initials}
        </div>
        <span className="hidden md:inline truncate max-w-28 text-blue-100 group-hover:text-white">
          {email}
        </span>
        <ChevronDown size={14} className={`text-blue-200 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-56 origin-top-right rounded-lg border border-slate-200 bg-white p-1.5 shadow-xl ring-1 ring-black/5 focus:outline-none dark:border-slate-800 dark:bg-slate-950 z-50"
          id="account-menu-dropdown"
        >
          <div className="px-3 py-2.5 border-b border-slate-100 dark:border-slate-800">
            <p className="text-xs font-medium text-slate-400 dark:text-slate-500">Signed in as</p>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate mt-0.5" title={email}>
              {email}
            </p>
          </div>
          
          <div className="mt-1">
            <div className="flex items-center gap-2 px-3 py-2 text-xs text-slate-500 dark:text-slate-400">
              <User size={14} />
              <span>Administrator Role</span>
            </div>
            
            <button
              onClick={() => {
                setIsOpen(false);
                onLogout();
              }}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/30 transition cursor-pointer"
              type="button"
              id="logout-button"
            >
              <LogOut size={15} />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
