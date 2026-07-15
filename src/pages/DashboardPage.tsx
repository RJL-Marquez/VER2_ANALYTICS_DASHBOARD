import { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Trash2, 
  RotateCcw, 
  ChevronLeft, 
  ChevronRight, 
  Maximize2, 
  Minimize2, 
  Award, 
  ClipboardList, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  TrendingUp, 
  Settings2, 
  HelpCircle,
  Sparkles,
  BarChart3,
  ListCollapse,
  Layers,
  ChevronDown,
  LayoutGrid
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PartnerCompany, SurveyResponse, SurveyType, Survey } from '../types/survey';
import {
  submissionCount,
  averageRating,
  submissionScores,
  questionPerformance,
} from '../utils/analytics';

// ----------------------------------------------------
// TYPES & WIDGET DEFINITIONS
// ----------------------------------------------------

export type WidgetType = 
  | 'satisfaction-gauge' 
  | 'active-forms' 
  | 'recent-submissions' 
  | 'question-scores' 
  | 'group-comparison' 
  | 'volume-tracker';

export interface DashboardWidget {
  id: string;
  type: WidgetType;
  title: string;
  gridSpan: 1 | 2 | 3; // 1 = 1 column, 2 = 2 columns, 3 = full width
}

interface DashboardPageProps {
  responses: SurveyResponse[];
  allResponses: SurveyResponse[];
  partnerCompanies: PartnerCompany[];
  isLoading: boolean;
  error: string | null;
  surveyTypeFilter: SurveyType[];
  surveys?: Survey[];
}

const ALL_WIDGET_CATALOG: { type: WidgetType; title: string; desc: string; defaultSpan: 1 | 2 | 3; category: 'Analytics' | 'Surveys' | 'Submissions' }[] = [
  { 
    type: 'satisfaction-gauge', 
    title: 'Top Performing Partner', 
    desc: 'Displays the highest-rated active partner company with a prominent satisfaction radial gauge.', 
    defaultSpan: 2,
    category: 'Analytics'
  },
  { 
    type: 'volume-tracker', 
    title: 'Response Statistics Feed', 
    desc: 'High-level telemetry on submissions volume, completion rates, and active partner counts.', 
    defaultSpan: 1,
    category: 'Submissions'
  },
  { 
    type: 'group-comparison', 
    title: 'Stakeholder Group Comparison', 
    desc: 'A comparative review of satisfaction score metrics across Contractors, Suppliers, and Subcontractors.', 
    defaultSpan: 1,
    category: 'Analytics'
  },
  { 
    type: 'active-forms', 
    title: 'Published Survey Forms', 
    desc: 'Overview of live questionnaires, response counters, and close dates.', 
    defaultSpan: 1,
    category: 'Surveys'
  },
  { 
    type: 'recent-submissions', 
    title: 'Recent Evaluations Log', 
    desc: 'A real-time stream of the latest completed survey submissions and stakeholder ratings.', 
    defaultSpan: 1,
    category: 'Submissions'
  },
  { 
    type: 'question-scores', 
    title: 'Top & Bottom Question Ratings', 
    desc: 'Highlights the single highest and lowest scoring questions to isolate performance gaps.', 
    defaultSpan: 1,
    category: 'Analytics'
  }
];

const DEFAULT_LAYOUT: DashboardWidget[] = [
  { id: 'widget-satisfaction', type: 'satisfaction-gauge', title: 'Top Performing Partner', gridSpan: 2 },
  { id: 'widget-volume', type: 'volume-tracker', title: 'Response Statistics Feed', gridSpan: 1 },
  { id: 'widget-comparison', type: 'group-comparison', title: 'Stakeholder Group Comparison', gridSpan: 1 },
  { id: 'widget-active-forms', type: 'active-forms', title: 'Published Survey Forms', gridSpan: 1 },
  { id: 'widget-recent', type: 'recent-submissions', title: 'Recent Evaluations Log', gridSpan: 1 }
];

// Helper colors
const categoryColors: Record<string, string> = {
  Contractor: 'bg-blue-500',
  Supplier: 'bg-emerald-500',
  Subcontractor: 'bg-orange-500'
};

const badgeColors: Record<string, string> = {
  Contractor: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200 border border-blue-200 dark:border-blue-800',
  Supplier: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800',
  Subcontractor: 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-200 border border-orange-200 dark:border-orange-800'
};

export function DashboardPage({ 
  responses = [], 
  allResponses = [], 
  partnerCompanies = [], 
  isLoading, 
  error, 
  surveyTypeFilter = [],
  surveys = []
}: DashboardPageProps) {
  
  const [widgets, setWidgets] = useState<DashboardWidget[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [catalogTab, setCatalogTab] = useState<'All' | 'Analytics' | 'Surveys' | 'Submissions'>('All');
  const [showConfigMenu, setShowConfigMenu] = useState<string | null>(null);

  // Load custom layout
  useEffect(() => {
    const saved = localStorage.getItem('survey_dashboard_widgets_v1');
    if (saved) {
      try {
        setWidgets(JSON.parse(saved));
      } catch (e) {
        setWidgets(DEFAULT_LAYOUT);
      }
    } else {
      setWidgets(DEFAULT_LAYOUT);
    }
  }, []);

  // Save custom layout
  const saveLayout = (newWidgets: DashboardWidget[]) => {
    setWidgets(newWidgets);
    localStorage.setItem('survey_dashboard_widgets_v1', JSON.stringify(newWidgets));
  };

  // Add widget
  const handleAddWidget = (item: typeof ALL_WIDGET_CATALOG[0]) => {
    const newWidget: DashboardWidget = {
      id: `widget-${Date.now()}`,
      type: item.type,
      title: item.title,
      gridSpan: item.defaultSpan
    };
    const updated = [...widgets, newWidget];
    saveLayout(updated);
    setIsAddOpen(false);
  };

  // Remove widget
  const handleRemoveWidget = (id: string) => {
    const updated = widgets.filter(w => w.id !== id);
    saveLayout(updated);
  };

  // Resize widget (cycle through span width: 1 -> 2 -> 3 -> 1)
  const handleResizeWidget = (id: string) => {
    const updated = widgets.map(w => {
      if (w.id === id) {
        const nextSpan: (1 | 2 | 3) = w.gridSpan === 1 ? 2 : w.gridSpan === 2 ? 3 : 1;
        return { ...w, gridSpan: nextSpan };
      }
      return w;
    });
    saveLayout(updated);
  };

  // Move widget position in array (left / right / up / down)
  const handleMoveWidget = (index: number, direction: 'prev' | 'next') => {
    if (direction === 'prev' && index === 0) return;
    if (direction === 'next' && index === widgets.length - 1) return;

    const targetIndex = direction === 'prev' ? index - 1 : index + 1;
    const updated = [...widgets];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    saveLayout(updated);
  };

  // Reset to default
  const handleResetLayout = () => {
    if (window.confirm('Are you sure you want to restore the default dashboard widget layout?')) {
      saveLayout(DEFAULT_LAYOUT);
    }
  };

  // ----------------------------------------------------
  // COMPUTED STATS FOR WIDGETS
  // ----------------------------------------------------
  
  // 1. Partner Company Averages (to find the Top Performing Partner)
  const companyAverages = useMemo(() => {
    if (!allResponses.length || !partnerCompanies.length) return [];
    
    const companyMap: Record<string, { name: string; sum: number; count: number; type: string }> = {};
    
    const typeMap = new Map<string, string>();
    partnerCompanies.forEach((c) => typeMap.set(c.name, c.type));

    submissionScores(allResponses).forEach((submission) => {
      if (!companyMap[submission.company]) {
        const type = typeMap.get(submission.company) || submission.surveyType;
        companyMap[submission.company] = { name: submission.company, sum: 0, count: 0, type };
      }
      companyMap[submission.company].sum += submission.score;
      companyMap[submission.company].count += 1;
    });

    partnerCompanies.forEach((c) => {
      if (!companyMap[c.name]) {
        companyMap[c.name] = { name: c.name, sum: 0, count: 0, type: c.type };
      }
    });

    return Object.values(companyMap)
      .map((c) => {
        const average = c.count > 0 ? c.sum / c.count : 0;
        return {
          name: c.name,
          average: (average / 20), // out of 5
          scorePercentage: average, // out of 100
          count: c.count,
          type: c.type,
        };
      })
      .filter((c) => c.count > 0)
      .sort((a, b) => b.average - a.average);
  }, [allResponses, partnerCompanies]);

  const topPartner = useMemo(() => {
    return companyAverages[0] || null;
  }, [companyAverages]);

  // 2. Stakeholder Groups Comparison Averages
  const groupAverages = useMemo(() => {
    const counts = { Contractor: 0, Supplier: 0, Subcontractor: 0 };
    const averages = { Contractor: 0, Supplier: 0, Subcontractor: 0 };

    const contractorResponses = allResponses.filter(r => r.surveyType === 'Contractor');
    const supplierResponses = allResponses.filter(r => r.surveyType === 'Supplier');
    const subcontractorResponses = allResponses.filter(r => r.surveyType === 'Subcontractor');

    counts.Contractor = submissionCount(contractorResponses);
    counts.Supplier = submissionCount(supplierResponses);
    counts.Subcontractor = submissionCount(subcontractorResponses);

    averages.Contractor = averageRating(contractorResponses);
    averages.Supplier = averageRating(supplierResponses);
    averages.Subcontractor = averageRating(subcontractorResponses);

    return {
      Contractor: averages.Contractor > 0 ? (averages.Contractor / 20) : 0,
      Supplier: averages.Supplier > 0 ? (averages.Supplier / 20) : 0,
      Subcontractor: averages.Subcontractor > 0 ? (averages.Subcontractor / 20) : 0,
      counts
    };
  }, [allResponses]);

  // 3. Question Performance rankings
  const questionAverages = useMemo(() => {
    const list = questionPerformance(allResponses);
    return {
      top: list[0] ? { text: list[0].question, average: (list[0].average / 20) } : null,
      bottom: list[list.length - 1] ? { text: list[list.length - 1].question, average: (list[list.length - 1].average / 20) } : null
    };
  }, [allResponses]);

  // 4. Submissions Feed
  const recentSubmissions = useMemo(() => {
    const submissions = submissionScores(allResponses);
    return [...submissions]
      .sort((a, b) => new Date(b.submissionDate).getTime() - new Date(a.submissionDate).getTime())
      .slice(0, 5);
  }, [allResponses]);

  // Catalog filtered widgets
  const filteredCatalog = useMemo(() => {
    if (catalogTab === 'All') return ALL_WIDGET_CATALOG;
    return ALL_WIDGET_CATALOG.filter(w => w.category === catalogTab);
  }, [catalogTab]);

  return (
    <div className="space-y-6">
      
      {/* ----------------------------------------------------
          DASHBOARD HEADER & CONTROL BAR
          ---------------------------------------------------- */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
              <LayoutGrid size={20} />
            </span>
            <h2 className="text-xl font-bold tracking-tight text-slate-800 dark:text-white">
              Interactive Workspace
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Build your personalized stakeholder metrics panel. Drag or arrange widgets to capture key partner satisfaction alerts.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={handleResetLayout}
            className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all shadow-xs"
            title="Reset to default workspace"
            type="button"
          >
            <RotateCcw size={14} />
            Reset Layout
          </button>
          
          <button
            onClick={() => setIsAddOpen(true)}
            className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-[#0063a9] hover:bg-[#00528c] px-4 py-2 text-xs font-semibold text-white shadow-md transition-all duration-200 hover:scale-[1.02]"
            type="button"
          >
            <Plus size={15} />
            Add Custom Widget
          </button>
        </div>
      </div>

      {/* ----------------------------------------------------
          ACTIVE WIDGETS GRID
          ---------------------------------------------------- */}
      {widgets.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[360px] text-center p-8 bg-white dark:bg-slate-900 rounded-2xl border-2 border-dashed border-slate-250 dark:border-slate-850">
          <div className="w-16 h-16 bg-blue-50 dark:bg-blue-950/20 rounded-full flex items-center justify-center mb-4 text-blue-500">
            <Sparkles size={32} />
          </div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">Your Workspace is Empty</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-sm">
            All widgets have been removed. Click the button below to start pinning satisfaction gauges, response logs, and active charts to your feed!
          </p>
          <button
            onClick={() => setIsAddOpen(true)}
            className="primary-button mt-5 px-5 py-2 rounded-xl text-xs font-semibold shadow-md"
            type="button"
          >
            + Create New Widget
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {widgets.map((widget, index) => {
              // Determine grid span class
              const spanClass = 
                widget.gridSpan === 3 
                  ? 'col-span-1 md:col-span-2 lg:col-span-3' 
                  : widget.gridSpan === 2 
                    ? 'col-span-1 md:col-span-2' 
                    : 'col-span-1';

              return (
                <motion.div
                  key={widget.id}
                  layout
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.25 }}
                  className={`${spanClass} flex flex-col bg-white dark:bg-slate-950 rounded-2xl border border-slate-200/90 dark:border-slate-850 shadow-sm relative group overflow-visible`}
                >
                  
                  {/* Widget Card Header */}
                  <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-850 bg-slate-50/40 dark:bg-slate-900/30 rounded-t-2xl">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-350 truncate max-w-[180px]" title={widget.title}>
                        {widget.title}
                      </h4>
                    </div>

                    {/* Widget Operations Toolbar */}
                    <div className="flex items-center gap-1 bg-white dark:bg-slate-900 rounded-lg p-0.5 border border-slate-200/60 dark:border-slate-800 shadow-2xs">
                      {/* Move Left / Prev */}
                      <button
                        onClick={() => handleMoveWidget(index, 'prev')}
                        disabled={index === 0}
                        className="p-1 rounded text-slate-400 dark:text-slate-550 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent"
                        title="Move Up/Left"
                        type="button"
                      >
                        <ChevronLeft size={13} />
                      </button>

                      {/* Move Right / Next */}
                      <button
                        onClick={() => handleMoveWidget(index, 'next')}
                        disabled={index === widgets.length - 1}
                        className="p-1 rounded text-slate-400 dark:text-slate-550 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent"
                        title="Move Down/Right"
                        type="button"
                      >
                        <ChevronRight size={13} />
                      </button>

                      {/* Resize Width */}
                      <button
                        onClick={() => handleResizeWidget(widget.id)}
                        className="p-1 rounded text-slate-400 dark:text-slate-550 hover:bg-slate-100 dark:hover:bg-slate-800"
                        title={`Resize Widget (Current: ${widget.gridSpan === 1 ? '1/3' : widget.gridSpan === 2 ? '2/3' : 'Full'} Width)`}
                        type="button"
                      >
                        {widget.gridSpan === 1 ? <Maximize2 size={11} /> : <Minimize2 size={11} />}
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => handleRemoveWidget(widget.id)}
                        className="p-1 rounded text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                        title="Delete Widget"
                        type="button"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>

                  {/* Widget Card Body */}
                  <div className="p-5 flex-1 flex flex-col justify-center min-h-[160px]">
                    {widget.type === 'satisfaction-gauge' && (
                      <div className="space-y-4">
                        {topPartner ? (
                          <div className="flex flex-col sm:flex-row items-center gap-5 justify-between">
                            {/* Dial */}
                            <div className="relative flex items-center justify-center w-24 h-24 shrink-0">
                              <svg className="w-full h-full transform -rotate-90">
                                <circle
                                  cx="48"
                                  cy="48"
                                  r="36"
                                  className="stroke-slate-100 dark:stroke-slate-900 fill-none"
                                  strokeWidth="6"
                                />
                                <circle
                                  cx="48"
                                  cy="48"
                                  r="36"
                                  className="stroke-emerald-500 fill-none"
                                  strokeWidth="6"
                                  strokeDasharray="226.1"
                                  strokeDashoffset={226.1 - (226.1 * topPartner.scorePercentage) / 100}
                                  strokeLinecap="round"
                                />
                              </svg>
                              <div className="absolute flex flex-col items-center">
                                <span className="text-lg font-bold text-slate-800 dark:text-slate-200">
                                  {Math.round(topPartner.scorePercentage)}%
                                </span>
                              </div>
                            </div>

                            {/* Details */}
                            <div className="flex-1 text-center sm:text-left">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md inline-block">
                                {topPartner.type} Top Rank
                              </span>
                              <h5 className="font-bold text-slate-800 dark:text-slate-100 text-sm mt-1.5 truncate max-w-[240px]">
                                {topPartner.name}
                              </h5>
                              <p className="text-xs text-slate-400 mt-1 leading-snug">
                                Acclaimed leader across {topPartner.count} employee feedback surveys.
                              </p>
                              <div className="mt-3 flex items-center gap-4 text-[11px] font-semibold text-slate-500">
                                <span>Rating: {topPartner.average.toFixed(2)} / 5.0</span>
                                <span>•</span>
                                <span>{topPartner.count} reviews</span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center text-slate-400 text-xs py-4">
                            No active partner reviews registered yet.
                          </div>
                        )}
                      </div>
                    )}

                    {widget.type === 'volume-tracker' && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-50/50 dark:bg-slate-900/40 p-3.5 rounded-xl border border-slate-100 dark:border-slate-850">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Total Feedback</span>
                          <span className="text-2xl font-light text-slate-800 dark:text-white mt-1 block">
                            {allResponses.length}
                          </span>
                          <span className="text-[10px] text-blue-500 mt-1 block font-medium">Submissions log</span>
                        </div>

                        <div className="bg-slate-50/50 dark:bg-slate-900/40 p-3.5 rounded-xl border border-slate-100 dark:border-slate-850">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Active Partners</span>
                          <span className="text-2xl font-light text-slate-800 dark:text-white mt-1 block">
                            {partnerCompanies.length}
                          </span>
                          <span className="text-[10px] text-emerald-500 mt-1 block font-medium">Unique registry</span>
                        </div>
                      </div>
                    )}

                    {widget.type === 'group-comparison' && (
                      <div className="space-y-3.5 w-full">
                        {/* Contractor Group Row */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px] font-medium text-slate-600 dark:text-slate-400">
                            <span>Contractors ({groupAverages.counts.Contractor} submissions)</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200">
                              {groupAverages.Contractor ? `${groupAverages.Contractor.toFixed(2)} / 5.0` : 'N/A'}
                            </span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-blue-500 rounded-full" 
                              style={{ width: `${(groupAverages.Contractor / 5) * 100}%` }}
                            />
                          </div>
                        </div>

                        {/* Supplier Group Row */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px] font-medium text-slate-600 dark:text-slate-400">
                            <span>Suppliers ({groupAverages.counts.Supplier} submissions)</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200">
                              {groupAverages.Supplier ? `${groupAverages.Supplier.toFixed(2)} / 5.0` : 'N/A'}
                            </span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-emerald-500 rounded-full" 
                              style={{ width: `${(groupAverages.Supplier / 5) * 100}%` }}
                            />
                          </div>
                        </div>

                        {/* Subcontractor Group Row */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px] font-medium text-slate-600 dark:text-slate-400">
                            <span>Subcontractors ({groupAverages.counts.Subcontractor} submissions)</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200">
                              {groupAverages.Subcontractor ? `${groupAverages.Subcontractor.toFixed(2)} / 5.0` : 'N/A'}
                            </span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-orange-500 rounded-full" 
                              style={{ width: `${(groupAverages.Subcontractor / 5) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {widget.type === 'active-forms' && (
                      <div className="space-y-2.5">
                        {surveys.length === 0 ? (
                          <div className="text-center text-slate-400 text-xs py-4">
                            No published survey questionnaires are available.
                          </div>
                        ) : (
                          surveys.slice(0, 3).map((survey) => {
                            const count = allResponses.filter(r => r.surveyId === survey.id).length;
                            return (
                              <div key={survey.id} className="flex items-center justify-between p-2 rounded-xl bg-slate-50/50 dark:bg-slate-900/20 border border-slate-100 dark:border-slate-850 text-xs">
                                <div className="min-w-0 flex-1 pr-2">
                                  <p className="font-bold text-slate-800 dark:text-slate-200 truncate">{survey.title}</p>
                                  <p className="text-[10px] text-slate-400 mt-0.5">Due: {survey.deadlineDate || 'No close date'}</p>
                                </div>
                                <span className="shrink-0 px-2.5 py-1 rounded-lg bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 font-bold text-blue-600 dark:text-blue-400 text-[10px]">
                                  {count} submissions
                                </span>
                              </div>
                            );
                          })
                        )}
                        {surveys.length > 3 && (
                          <p className="text-[10px] text-center text-slate-400 italic font-medium pt-1">
                            + {surveys.length - 3} more forms in the active registry.
                          </p>
                        )}
                      </div>
                    )}

                    {widget.type === 'recent-submissions' && (
                      <div className="space-y-2">
                        {recentSubmissions.length === 0 ? (
                          <div className="text-center text-slate-400 text-xs py-4">
                            No survey responses are available.
                          </div>
                        ) : (
                          recentSubmissions.map((resp, sIdx) => {
                            const avgVal = resp.score / 20;
                            return (
                              <div key={sIdx} className="flex items-center justify-between text-xs py-1.5 border-b border-dashed border-slate-100 dark:border-slate-800/60 last:border-0">
                                <div className="min-w-0 flex-1 pr-2">
                                  <span className={`text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded ${badgeColors[resp.surveyType] || 'bg-slate-100 text-slate-800'}`}>
                                    {resp.surveyType}
                                  </span>
                                  <p className="font-semibold text-slate-700 dark:text-slate-300 truncate mt-1">
                                    {resp.company}
                                  </p>
                                </div>
                                <span className="shrink-0 font-bold text-slate-900 dark:text-white">
                                  {avgVal.toFixed(1)} / 5.0
                                </span>
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}

                    {widget.type === 'question-scores' && (
                      <div className="space-y-3">
                        {questionAverages.top ? (
                          <div className="space-y-2">
                            <div className="p-2.5 rounded-xl border border-emerald-100 dark:border-emerald-900/20 bg-emerald-50/10">
                              <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">Highest Rated Query</span>
                              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-1 line-clamp-1">
                                "{questionAverages.top.text}"
                              </p>
                              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-1 block">
                                Average: {questionAverages.top.average.toFixed(2)} / 5.0
                              </span>
                            </div>

                            {questionAverages.bottom && (
                              <div className="p-2.5 rounded-xl border border-rose-100 dark:border-rose-900/20 bg-rose-50/10">
                                <span className="text-[9px] font-bold uppercase tracking-wider text-rose-500 block">Lowest Rated Query</span>
                                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-1 line-clamp-1">
                                  "{questionAverages.bottom.text}"
                                </p>
                                <span className="text-[10px] font-bold text-rose-500 mt-1 block">
                                  Average: {questionAverages.bottom.average.toFixed(2)} / 5.0
                                </span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-center text-slate-400 text-xs py-4">
                            Submit evaluations to populate query averages.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* ----------------------------------------------------
          ADD WIDGET MODAL DIALOG
          ---------------------------------------------------- */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-4 mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Workspace Catalog</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Select a widget card to place onto your tailored metrics feed.</p>
              </div>
              <button 
                onClick={() => setIsAddOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                type="button"
              >
                ✕
              </button>
            </div>

            {/* Catalog Categories */}
            <div className="flex flex-wrap gap-2 mb-5">
              {(['All', 'Analytics', 'Surveys', 'Submissions'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setCatalogTab(tab)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                    catalogTab === tab 
                      ? 'bg-[#0063a9] text-white' 
                      : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                  type="button"
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Widget Items Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[380px] overflow-y-auto pr-1">
              {filteredCatalog.map(item => {
                // Check if already in dashboard
                const exists = widgets.some(w => w.type === item.type);

                return (
                  <div 
                    key={item.type}
                    className="flex flex-col justify-between p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/20 hover:border-blue-500/50 dark:hover:border-blue-500/30 transition-all group"
                  >
                    <div>
                      <div className="flex items-center gap-1.5 justify-between">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-100">{item.title}</span>
                        <span className="text-[9px] uppercase font-extrabold tracking-wider bg-slate-100 dark:bg-slate-850 px-1.5 py-0.5 rounded text-slate-400 dark:text-slate-500">
                          {item.category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                        {item.desc}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-850 flex items-center justify-between gap-2">
                      <span className="text-[10px] text-slate-400">
                        Default width: {item.defaultSpan === 3 ? 'Full Width' : item.defaultSpan === 2 ? 'Two-Thirds' : 'One-Third'}
                      </span>
                      <button
                        onClick={() => handleAddWidget(item)}
                        className="inline-flex items-center justify-center gap-1 cursor-pointer rounded-lg bg-[#0063a9]/10 hover:bg-[#0063a9] text-[#0063a9] hover:text-white px-2.5 py-1.5 text-[11px] font-bold transition-all duration-150"
                        type="button"
                      >
                        <Plus size={12} />
                        Add Widget {exists && <span className="text-[9px] font-medium opacity-75">(Extra)</span>}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end pt-4 mt-6 border-t border-slate-100 dark:border-slate-850">
              <button
                onClick={() => setIsAddOpen(false)}
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 cursor-pointer transition-all"
                type="button"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
}
