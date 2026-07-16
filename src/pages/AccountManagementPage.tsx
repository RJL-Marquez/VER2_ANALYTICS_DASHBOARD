import React, { useState, useMemo } from 'react';
import { Shield, Search, Plus, UserCog, Mail, Briefcase, Trash2, Edit2, AlertCircle } from 'lucide-react';
import { AccountProfile } from '../App';

interface AccountManagementPageProps {
  accounts: AccountProfile[];
  onUpdateAccounts: (accounts: AccountProfile[]) => void;
  isAdmin: boolean;
  currentUserEmail: string;
}

const DESIGNATION_OPTIONS = ['Rank & File', 'Supervisory', 'Managerial', 'Director', 'Executive'];
const DEPARTMENT_OPTIONS = ['Accounts Payable - Trade', 'Business Solutions Manager', 'Logistics', 'Procurement Group', 'TASS'];

export function AccountManagementPage({ accounts, onUpdateAccounts, isAdmin, currentUserEmail }: AccountManagementPageProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingEmail, setEditingEmail] = useState<string | null>(null);

  // Form State
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Employee');
  const [designation, setDesignation] = useState(DESIGNATION_OPTIONS[0]);
  const [department, setDepartment] = useState(DEPARTMENT_OPTIONS[0]);

  // The account currently signed in, used to prevent an admin from removing
  // their own account or another account that shares their access level.
  const currentAccount = useMemo(
    () => accounts.find((a) => a.email.trim().toLowerCase() === currentUserEmail.trim().toLowerCase()) || null,
    [accounts, currentUserEmail]
  );

  const canDeleteAccount = (acc: AccountProfile) => {
    if (!currentAccount) return true;
    if (acc.email.trim().toLowerCase() === currentAccount.email.trim().toLowerCase()) return false;
    if (acc.role === currentAccount.role) return false;
    return true;
  };

  const filteredAccounts = useMemo(() => {
    return accounts.filter(a => 
      a.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
      a.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.designation.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [accounts, searchTerm]);

  const handleOpenAdd = () => {
    setEmail('');
    setRole('Employee');
    setDesignation(DESIGNATION_OPTIONS[0]);
    setDepartment(DEPARTMENT_OPTIONS[0]);
    setEditingEmail(null);
    setIsAddOpen(true);
  };

  const handleOpenEdit = (acc: AccountProfile) => {
    setEmail(acc.email);
    setRole(acc.role);
    setDesignation(acc.designation);
    setDepartment(acc.department);
    setEditingEmail(acc.email);
    setIsAddOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !role || !designation || !department) return;
    
    let updated = [...accounts];
    
    if (editingEmail) {
      // Edit mode
      updated = updated.map(a => a.email === editingEmail ? { email, role, designation, department } : a);
    } else {
      // Add mode - check if exists
      if (updated.some(a => a.email.toLowerCase() === email.toLowerCase())) {
        alert('An account with this email already exists.');
        return;
      }
      updated.push({ email, role, designation, department });
    }
    
    onUpdateAccounts(updated);
    setIsAddOpen(false);
  };

  const handleDelete = (targetEmail: string) => {
    const target = accounts.find(a => a.email === targetEmail);
    if (target && !canDeleteAccount(target)) {
      alert('You cannot remove your own account or another account that shares your access level.');
      return;
    }
    if (window.confirm(`Are you sure you want to remove ${targetEmail}?`)) {
      onUpdateAccounts(accounts.filter(a => a.email !== targetEmail));
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center dark:border-slate-800 dark:bg-slate-900/50">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400">
          <Shield size={28} />
        </div>
        <h3 className="mb-2 text-lg font-bold text-slate-900 dark:text-white">Administrator Access Required</h3>
        <p className="max-w-md text-sm text-slate-500 dark:text-slate-400">
          You need administrator privileges to view and manage system accounts.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
              <UserCog size={20} />
            </span>
            <h2 className="text-xl font-bold tracking-tight text-slate-800 dark:text-white">Account Management</h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage system access, roles, and organizational details for all user accounts.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenAdd}
            className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-[#0063a9] hover:bg-[#00528c] px-4 py-2 text-sm font-semibold text-white shadow-md transition-all duration-200"
            type="button"
          >
            <Plus size={16} />
            Add Account
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="panel">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search by email, department, or designation..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white dark:focus:border-blue-500 dark:focus:bg-slate-800"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span className="font-medium text-slate-700 dark:text-slate-300">{filteredAccounts.length}</span> Accounts Found
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                <th className="pb-3 pl-2 font-medium">Account Email</th>
                <th className="pb-3 font-medium">Role</th>
                <th className="pb-3 font-medium">Designation</th>
                <th className="pb-3 font-medium">Department</th>
                <th className="pb-3 text-right pr-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {filteredAccounts.map((acc) => (
                <tr key={acc.email} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="py-3 pl-2">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 font-semibold text-xs">
                        {acc.email.substring(0, 2).toUpperCase()}
                      </div>
                      <span className="font-medium text-slate-900 dark:text-slate-100">{acc.email}</span>
                    </div>
                  </td>
                  <td className="py-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      acc.role === 'Admin' 
                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border border-purple-200 dark:border-purple-800/50'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                    }`}>
                      {acc.role}
                    </span>
                  </td>
                  <td className="py-3 text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <Briefcase size={14} className="text-slate-400" />
                      {acc.designation}
                    </div>
                  </td>
                  <td className="py-3 text-slate-600 dark:text-slate-400">
                    {acc.department}
                  </td>
                  <td className="py-3 pr-2 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleOpenEdit(acc)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                        title="Edit Account"
                      >
                        <Edit2 size={16} />
                      </button>
                      {canDeleteAccount(acc) && (
                        <button
                          onClick={() => handleDelete(acc.email)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors"
                          title="Delete Account"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredAccounts.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <AlertCircle className="mb-2 h-8 w-8 text-slate-400" />
                      <p>No accounts found matching your search.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {editingEmail ? 'Edit Account Details' : 'Add New Account'}
              </h3>
            </div>
            
            <div className="p-5 overflow-y-auto">
              <form id="account-form" onSubmit={handleSave} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      disabled={!!editingEmail}
                      className="w-full pl-10 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none focus:border-blue-500 transition-colors text-sm disabled:opacity-50"
                      placeholder="user@example.com"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">System Role</label>
                  <select
                    value={role}
                    onChange={e => setRole(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none focus:border-blue-500 transition-colors text-sm"
                  >
                    <option value="Employee">Employee</option>
                    <option value="Admin">Administrator</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Designation / Title</label>
                  <select
                    required
                    value={designation}
                    onChange={e => setDesignation(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none focus:border-blue-500 transition-colors text-sm"
                  >
                    {DESIGNATION_OPTIONS.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Department</label>
                  <select
                    required
                    value={department}
                    onChange={e => setDepartment(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none focus:border-blue-500 transition-colors text-sm"
                  >
                    {DEPARTMENT_OPTIONS.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
              </form>
            </div>
            
            <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 flex justify-end gap-3 mt-auto">
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="account-form"
                className="px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition cursor-pointer"
              >
                {editingEmail ? 'Save Changes' : 'Add Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
