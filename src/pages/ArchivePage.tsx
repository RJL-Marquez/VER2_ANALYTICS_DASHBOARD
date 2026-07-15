import { useMemo, useState } from 'react';
import { Archive, ClipboardList, FileText, RefreshCw, Calendar, Building2, UserCheck, Trash2, ArrowLeft, Search } from 'lucide-react';
import { CustomForm, SurveyResponse, SurveyType } from '../types/survey';

interface ArchivePageProps {
  surveys: CustomForm[];
  archivedResponses: SurveyResponse[];
  onUpdateSurvey?: (survey: CustomForm) => void;
  onRestoreResponseGroup?: (responseId: string) => void;
  onRestoreResponsesForSurvey?: (surveyId: string) => void;
  isAdmin: boolean;
}

export function ArchivePage({
  surveys,
  archivedResponses,
  onUpdateSurvey,
  onRestoreResponseGroup,
  onRestoreResponsesForSurvey,
  isAdmin
}: ArchivePageProps) {
  const [activeTab, setActiveTab] = useState<'surveys' | 'responses'>('surveys');
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmSurvey, setConfirmSurvey] = useState<CustomForm | null>(null);
  const [confirmResponseGroup, setConfirmResponseGroup] = useState<{ responseId: string; company: string; type: string } | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filter archived surveys
  const archivedSurveys = useMemo(() => {
    return surveys.filter((s) => s.status === 'Archived');
  }, [surveys]);

  // Group responses by responseId to display submissions as individual unified records
  const groupedArchivedResponses = useMemo(() => {
    const groups: Record<string, {
      responseId: string;
      surveyType: SurveyType;
      respondentType: string;
      submissionDate: string;
      company: string;
      department?: string;
      respondentEmail?: string;
      answers: SurveyResponse[];
    }> = {};

    archivedResponses.forEach((r) => {
      if (!groups[r.responseId]) {
        groups[r.responseId] = {
          responseId: r.responseId,
          surveyType: r.surveyType,
          respondentType: r.respondentType,
          submissionDate: r.submissionDate,
          company: r.company,
          department: r.department,
          respondentEmail: r.respondentEmail,
          answers: [],
        };
      }
      groups[r.responseId].answers.push(r);
    });

    return Object.values(groups).sort((a, b) => b.submissionDate.localeCompare(a.submissionDate));
  }, [archivedResponses]);

  // Handle restoring an archived survey back to active/running status
  const handleRestoreSurvey = (survey: CustomForm) => {
    setConfirmSurvey(survey);
  };

  const executeRestoreSurvey = () => {
    if (!confirmSurvey || !onUpdateSurvey) return;
    onUpdateSurvey({
      ...confirmSurvey,
      status: 'Running'
    });
    setSuccessMessage(`Form "${confirmSurvey.title}" has been restored to Active status!`);
    setConfirmSurvey(null);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  const handleRestoreResponseGroup = (group: { responseId: string; company: string; type: string }) => {
    setConfirmResponseGroup(group);
  };

  const executeRestoreResponseGroup = () => {
    if (!confirmResponseGroup || !onRestoreResponseGroup) return;
    onRestoreResponseGroup(confirmResponseGroup.responseId);
    setSuccessMessage(`Evaluations for "${confirmResponseGroup.company}" restored to live dataset!`);
    setConfirmResponseGroup(null);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  // Filter lists based on search
  const filteredArchivedSurveys = useMemo(() => {
    if (!searchQuery.trim()) return archivedSurveys;
    const needle = searchQuery.toLowerCase();
    return archivedSurveys.filter(
      (s) => s.title.toLowerCase().includes(needle) || s.description.toLowerCase().includes(needle)
    );
  }, [archivedSurveys, searchQuery]);

  const filteredGroupedResponses = useMemo(() => {
    if (!searchQuery.trim()) return groupedArchivedResponses;
    const needle = searchQuery.toLowerCase();
    return groupedArchivedResponses.filter(
      (g) =>
        g.company.toLowerCase().includes(needle) ||
        g.respondentType.toLowerCase().includes(needle) ||
        g.surveyType.toLowerCase().includes(needle)
    );
  }, [groupedArchivedResponses, searchQuery]);

  if (!isAdmin) {
    return (
      <div className="panel p-8 text-center text-slate-500 max-w-md mx-auto mt-10">
        <Trash2 className="mx-auto mb-4 text-rose-500 h-12 w-12" />
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Access Restricted</h3>
        <p className="text-sm mt-2">Only administrators can access the Archive Center.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Archive Center</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Store, review, and restore archived evaluations and historical stakeholder submissions.
        </p>
      </div>

      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900/50 rounded-xl p-4 flex items-center gap-3 text-emerald-800 dark:text-emerald-300 text-sm animate-fade-in">
          <RefreshCw size={18} className="animate-spin-slow text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className="font-semibold">{successMessage}</span>
        </div>
      )}

      {/* Two Clickable Blocks (Bento Cards) */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Block 1: Archived Survey */}
        <button
          onClick={() => {
            setActiveTab('surveys');
            setSearchQuery('');
          }}
          className={`panel p-6 flex items-start gap-4 text-left transition relative overflow-hidden cursor-pointer ${
            activeTab === 'surveys'
              ? 'ring-2 ring-[#0063a9] bg-blue-50/20 dark:bg-blue-950/10 border-blue-200 dark:border-blue-900'
              : 'hover:border-slate-300 hover:bg-slate-50/30'
          }`}
          id="btn-archive-surveys"
        >
          <div className={`p-3 rounded-xl shrink-0 ${
            activeTab === 'surveys' ? 'bg-[#0063a9] text-white' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
          }`}>
            <ClipboardList size={24} />
          </div>
          <div className="space-y-1 flex-1 pr-12">
            <h3 className="text-lg font-bold text-slate-950 dark:text-white">Archived Surveys</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
              Form templates removed from active rotation. Can be restored back to the active registry.
            </p>
          </div>
          <span className="absolute top-6 right-6 inline-flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs font-black text-slate-700 dark:text-slate-300">
            {archivedSurveys.length}
          </span>
        </button>

        {/* Block 2: Archived Responses */}
        <button
          onClick={() => {
            setActiveTab('responses');
            setSearchQuery('');
          }}
          className={`panel p-6 flex items-start gap-4 text-left transition relative overflow-hidden cursor-pointer ${
            activeTab === 'responses'
              ? 'ring-2 ring-[#0063a9] bg-blue-50/20 dark:bg-blue-950/10 border-blue-200 dark:border-blue-900'
              : 'hover:border-slate-300 hover:bg-slate-50/30'
          }`}
          id="btn-archive-responses"
        >
          <div className={`p-3 rounded-xl shrink-0 ${
            activeTab === 'responses' ? 'bg-[#0063a9] text-white' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
          }`}>
            <FileText size={24} />
          </div>
          <div className="space-y-1 flex-1 pr-12">
            <h3 className="text-lg font-bold text-slate-950 dark:text-white">Archived Responses</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
              Submissions preserved from completed or reset evaluations. Keeps your live dashboards neat.
            </p>
          </div>
          <span className="absolute top-6 right-6 inline-flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs font-black text-slate-700 dark:text-slate-300">
            {groupedArchivedResponses.length}
          </span>
        </button>
      </div>

      {/* List Container with Search */}
      <div className="panel p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            {activeTab === 'surveys' ? 'Archived Surveys Directory' : 'Archived Responses Logs'}
          </h2>
          
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={16} />
            <input
              type="text"
              placeholder={`Search archived ${activeTab === 'surveys' ? 'surveys' : 'responses'}...`}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-9 py-2 text-xs text-slate-700 dark:text-slate-300 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-[#0063a9]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Tab 1 Content: Surveys List */}
        {activeTab === 'surveys' && (
          <div>
            {filteredArchivedSurveys.length === 0 ? (
              <div className="text-center py-10 text-slate-500">
                <Archive size={32} className="mx-auto mb-2 text-slate-300" />
                <p className="text-sm">No archived surveys found.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full min-w-[640px] border-collapse text-sm text-left">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-400">
                      <th className="px-4 py-3">Survey Title</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3">Date Created</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredArchivedSurveys.map((survey) => (
                      <tr key={survey.id} className="align-middle hover:bg-slate-50/40 dark:hover:bg-slate-900/10">
                        <td className="px-4 py-4">
                          <div className="space-y-0.5">
                            <span className="font-bold text-slate-900 dark:text-slate-100">
                              {survey.title}
                            </span>
                            <p className="text-xs text-slate-400 dark:text-slate-500 line-clamp-1">
                              {survey.description || 'No description.'}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className="inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {survey.surveyType}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-xs text-slate-500 dark:text-slate-400">
                          {new Date(survey.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                        </td>
                        <td className="px-4 py-4 text-right">
                          <button
                            onClick={() => handleRestoreSurvey(survey)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-[#0063a9] text-[#0063a9] hover:bg-blue-50 dark:border-blue-500 dark:text-blue-400 dark:hover:bg-blue-950/20 px-3 py-1.5 text-xs font-bold transition cursor-pointer"
                            type="button"
                          >
                            <RefreshCw size={12} />
                            <span>Restore Form</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 2 Content: Responses List */}
        {activeTab === 'responses' && (
          <div>
            {filteredGroupedResponses.length === 0 ? (
              <div className="text-center py-10 text-slate-500">
                <FileText size={32} className="mx-auto mb-2 text-slate-300" />
                <p className="text-sm">No archived responses found.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredGroupedResponses.map((group) => (
                  <div key={group.responseId} className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-3 hover:border-slate-300 dark:hover:border-slate-700 transition">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-2">
                      <div className="flex items-center gap-2">
                        <Building2 className="text-[#0063a9] dark:text-blue-400 shrink-0" size={16} />
                        <span className="font-bold text-slate-900 dark:text-white text-sm">{group.company}</span>
                        <span className="inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {group.surveyType}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
                          <Calendar size={13} />
                          <span>{new Date(group.submissionDate).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</span>
                        </div>
                        {onRestoreResponseGroup && (
                          <button
                            onClick={() => handleRestoreResponseGroup({ responseId: group.responseId, company: group.company, type: group.surveyType })}
                            className="inline-flex items-center gap-1 rounded-lg border border-emerald-600 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-500 dark:text-emerald-400 dark:hover:bg-emerald-950/20 px-2 py-1 text-[10.5px] font-bold transition cursor-pointer"
                            type="button"
                          >
                            <RefreshCw size={10} />
                            <span>Restore Submissions</span>
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-2 text-xs text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <UserCheck size={14} className="text-slate-400" />
                        <span>Evaluator: <strong>{group.respondentType}</strong></span>
                      </div>
                      {group.respondentEmail && (
                        <div>
                          Email: <strong className="text-slate-700 dark:text-slate-300">{group.respondentEmail}</strong>
                        </div>
                      )}
                    </div>

                    {/* Inner mini table of scores */}
                    <div className="overflow-hidden rounded-lg border border-slate-100 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-950/20 p-2 text-xs">
                      <div className="font-bold text-slate-700 dark:text-slate-300 px-2 pb-1.5 border-b border-slate-100 dark:border-slate-900 flex justify-between">
                        <span>Evaluation Questions</span>
                        <span>Score / Comment</span>
                      </div>
                      <div className="divide-y divide-slate-100/50 dark:divide-slate-900/50">
                        {group.answers.map((ans) => (
                          <div key={ans.questionId} className="py-2 px-2 flex justify-between items-start gap-4">
                            <span className="text-slate-600 dark:text-slate-400 max-w-md">
                              Q{ans.questionNumber}. {ans.question}
                            </span>
                            <div className="text-right shrink-0">
                              <span className="font-extrabold text-[#0063a9] dark:text-blue-400 text-sm">
                                {ans.rating}
                              </span>
                              <p className="text-[10px] text-slate-400 dark:text-slate-500 italic max-w-[200px] truncate" title={ans.comment}>
                                {ans.comment}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Confirmation Overlays */}
      {confirmSurvey && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="confirm-restore-survey-modal">
          <div className="bg-white dark:bg-slate-950 rounded-2xl max-w-md w-full border border-slate-100 dark:border-slate-800/80 p-6 shadow-xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-3 bg-blue-50 dark:bg-blue-950/40 text-[#0063a9] dark:text-blue-400 rounded-xl shrink-0">
                <RefreshCw size={24} className="animate-spin-slow" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Restore Survey Form?</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Are you sure you want to restore the survey form <strong>"{confirmSurvey.title}"</strong> back to Active/Running status? Respondents will immediately be able to see and submit evaluations for this form.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setConfirmSurvey(null)}
                className="px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 cursor-pointer transition"
                id="btn-cancel-restore-survey"
              >
                Cancel
              </button>
              <button
                onClick={executeRestoreSurvey}
                className="px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl bg-[#0063a9] hover:bg-[#00528c] text-white cursor-pointer transition"
                id="btn-confirm-restore-survey"
              >
                Confirm Restore
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmResponseGroup && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="confirm-restore-response-modal">
          <div className="bg-white dark:bg-slate-950 rounded-2xl max-w-md w-full border border-slate-100 dark:border-slate-800/80 p-6 shadow-xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl shrink-0">
                <RefreshCw size={24} className="animate-spin-slow" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Restore Submissions?</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Are you sure you want to restore this evaluation submission for <strong>"{confirmResponseGroup.company}"</strong> back into the active database? This will immediately merge these scores back into your live charts and dashboards.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setConfirmResponseGroup(null)}
                className="px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 cursor-pointer transition"
                id="btn-cancel-restore-responses"
              >
                Cancel
              </button>
              <button
                onClick={executeRestoreResponseGroup}
                className="px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer transition"
                id="btn-confirm-restore-responses"
              >
                Confirm Restore
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
