import { useState, useMemo } from 'react';
import { Database, Play, Trash2, CheckCircle2, Activity, Sparkles, Layers, RotateCcw } from 'lucide-react';
import { SurveyResponse } from '../types/survey';

interface SimulatorPageProps {
  responses: SurveyResponse[];
  archivedResponses: SurveyResponse[];
  onSimulate: (mode: 'single' | 'bulk' | 'complete') => void;
  onResetSimulation: () => void;
}

export function SimulatorPage({
  responses,
  archivedResponses,
  onSimulate,
  onResetSimulation
}: SimulatorPageProps) {
  const [selectedMode, setSelectedMode] = useState<'single' | 'bulk' | 'complete'>('bulk');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Group responses by responseId to get the unique count of simulated submissions
  const stats = useMemo(() => {
    const isSimulated = (id: string) => 
      id.startsWith('RESP-MOCK-') || 
      id.startsWith('RESP-SINGLE-') || 
      id.startsWith('RESP-BULK-');

    const activeSimulatedIds = new Set(
      responses.filter((r) => isSimulated(r.responseId)).map((r) => r.responseId)
    );
    const archivedSimulatedIds = new Set(
      archivedResponses.filter((r) => isSimulated(r.responseId)).map((r) => r.responseId)
    );

    const totalActive = new Set(responses.map((r) => r.responseId)).size;
    const totalArchived = new Set(archivedResponses.map((r) => r.responseId)).size;

    return {
      activeSimulated: activeSimulatedIds.size,
      archivedSimulated: archivedSimulatedIds.size,
      totalActive,
      totalArchived
    };
  }, [responses, archivedResponses]);

  const handleSimulate = () => {
    onSimulate(selectedMode);
    
    let text = '';
    if (selectedMode === 'single') text = 'Successfully simulated one singular response!';
    else if (selectedMode === 'bulk') text = 'Successfully simulated 15 responses in bulk!';
    else if (selectedMode === 'complete') text = 'Successfully simulated a complete dataset (All responded)!';
    
    setSuccessMessage(text);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  const [confirmReset, setConfirmReset] = useState(false);

  const handleReset = () => {
    setConfirmReset(true);
  };

  const executeReset = () => {
    onResetSimulation();
    setConfirmReset(false);
    setSuccessMessage('All simulated responses have been removed successfully.');
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-2.5">
          <span className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
            <Database size={20} />
          </span>
          <h2 className="text-xl font-bold tracking-tight text-slate-800 dark:text-white">
            Database Simulator
          </h2>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Simulate stakeholder response feeds and evaluations using custom synthetic accounts to stress-test your analytics visualizations.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Simulation Controls */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2.5 mb-6">
              <Sparkles size={18} className="text-blue-500" />
              <h3 className="text-sm font-bold text-slate-850 dark:text-white">Simulation Options</h3>
            </div>

            {/* Selection modes */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setSelectedMode('single')}
                className={`w-full flex items-start gap-4 p-4 rounded-xl border text-left transition-all ${
                  selectedMode === 'single'
                    ? 'border-blue-500 bg-blue-50/20 dark:bg-blue-950/20'
                    : 'border-slate-100 dark:border-slate-850 hover:border-slate-200 dark:hover:border-slate-800'
                }`}
              >
                <div className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                  selectedMode === 'single' ? 'border-blue-500 text-blue-500' : 'border-slate-300 dark:border-slate-700'
                }`}>
                  {selectedMode === 'single' && <span className="h-2 w-2 rounded-full bg-blue-500" />}
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-white block">One Singular Response</span>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 block">
                    Generates a single comprehensive evaluation for a random partner company from a random non-admin synthetic account.
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMode('bulk')}
                className={`w-full flex items-start gap-4 p-4 rounded-xl border text-left transition-all ${
                  selectedMode === 'bulk'
                    ? 'border-blue-500 bg-blue-50/20 dark:bg-blue-950/20'
                    : 'border-slate-100 dark:border-slate-850 hover:border-slate-200 dark:hover:border-slate-800'
                }`}
              >
                <div className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                  selectedMode === 'bulk' ? 'border-blue-500 text-blue-500' : 'border-slate-300 dark:border-slate-700'
                }`}>
                  {selectedMode === 'bulk' && <span className="h-2 w-2 rounded-full bg-blue-500" />}
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-white block">Bulk Response (15 responses)</span>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 block">
                    Batches 15 independent evaluations. Spread across multiple companies, categories, and non-admin respondent roles.
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMode('complete')}
                className={`w-full flex items-start gap-4 p-4 rounded-xl border text-left transition-all ${
                  selectedMode === 'complete'
                    ? 'border-blue-500 bg-blue-50/20 dark:bg-blue-950/20'
                    : 'border-slate-100 dark:border-slate-850 hover:border-slate-200 dark:hover:border-slate-800'
                }`}
              >
                <div className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                  selectedMode === 'complete' ? 'border-blue-500 text-blue-500' : 'border-slate-300 dark:border-slate-700'
                }`}>
                  {selectedMode === 'complete' && <span className="h-2 w-2 rounded-full bg-blue-500" />}
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-white block">Complete Response (All responded)</span>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 block">
                    Pre-populates a 100% full dataset where every non-admin synthetic employee evaluates every registered partner company.
                  </span>
                </div>
              </button>
            </div>

            {/* Simulate Button */}
            <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-850 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 dark:text-slate-500">
                Responses are generated with realistic scores (biased high, 80-90ish, with a small low score probability and low N/A chance).
              </span>
              <button
                onClick={handleSimulate}
                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-5 py-2.5 text-xs font-bold text-white shadow-md transition-all duration-250 hover:scale-[1.01]"
                type="button"
              >
                <Play size={13} fill="currentColor" />
                Simulate Response
              </button>
            </div>
          </div>
        </div>

        {/* Database Status Panel */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center gap-2.5 mb-6">
                <Activity size={18} className="text-emerald-500" />
                <h3 className="text-sm font-bold text-slate-850 dark:text-white">Database Metrics</h3>
              </div>

              {/* Stats display */}
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-850 text-xs">
                  <span className="text-slate-500 dark:text-slate-400">Simulated (Active)</span>
                  <span className="font-bold text-slate-800 dark:text-white">{stats.activeSimulated} submissions</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-850 text-xs">
                  <span className="text-slate-500 dark:text-slate-400">Simulated (Archived)</span>
                  <span className="font-bold text-slate-800 dark:text-white">{stats.archivedSimulated} submissions</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-850 text-xs">
                  <span className="text-slate-500 dark:text-slate-400">Total Active Submissions</span>
                  <span className="font-bold text-slate-800 dark:text-white">{stats.totalActive} submissions</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-850 text-xs">
                  <span className="text-slate-500 dark:text-slate-400">Total Archived Submissions</span>
                  <span className="font-bold text-slate-800 dark:text-white">{stats.totalArchived} submissions</span>
                </div>
              </div>
            </div>

            {/* Reset Area */}
            <div className="mt-8 pt-5 border-t border-slate-100 dark:border-slate-850">
              <button
                onClick={handleReset}
                disabled={stats.activeSimulated === 0 && stats.archivedSimulated === 0}
                className="w-full inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-rose-200/60 dark:border-rose-950 bg-rose-50/30 hover:bg-rose-50 dark:bg-rose-950/10 dark:hover:bg-rose-950/20 px-4 py-2.5 text-xs font-bold text-rose-600 dark:text-rose-400 disabled:opacity-40 disabled:pointer-events-none transition-all"
                type="button"
              >
                <Trash2 size={13} />
                Reset Simulation
              </button>
              <span className="text-[10px] text-slate-400 dark:text-slate-550 text-center block mt-2">
                Cleanses only synthetic evaluations from both active and archived lists.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {confirmReset && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="confirm-reset-simulation-modal">
          <div className="bg-white dark:bg-slate-950 rounded-2xl max-w-md w-full border border-rose-100 dark:border-rose-900/30 p-6 shadow-xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-xl shrink-0">
                <Trash2 size={24} />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Reset Simulation?</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Are you sure you want to remove all simulated responses? This will not affect real custom evaluations.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setConfirmReset(false)}
                className="px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 cursor-pointer transition"
              >
                Cancel
              </button>
              <button
                onClick={executeReset}
                className="px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl bg-rose-600 hover:bg-rose-700 text-white cursor-pointer transition"
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Notification */}
      {successMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-4 py-3 rounded-xl shadow-lg border border-slate-800 dark:border-slate-100 text-xs font-semibold animate-fade-in">
          <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}
    </div>
  );
}
