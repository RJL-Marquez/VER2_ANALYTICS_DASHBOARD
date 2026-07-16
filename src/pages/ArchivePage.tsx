import { useMemo, useState } from 'react';
import { Archive, ClipboardList, FileText, RefreshCw, Calendar, Building2, UserCheck, Trash2, ArrowLeft, Search } from 'lucide-react';
import { CustomForm, SurveyResponse, SurveyType } from '../types/survey';

interface ArchivePageProps {
  surveys: CustomForm[];
  archivedResponses: SurveyResponse[];
  onUpdateSurvey?: (survey: CustomForm) => void;
  onRestoreResponseGroup?: (responseId: string) => void;
  onRestoreResponsesForSurvey?: (surveyId: string) => void;
<<<<<<< HEAD
  onDeleteArchivedResponseGroups?: (groupIds: { archivedAt: string; surveyId: string }[]) => void;
  onRestoreArchivedResponseGroups?: (groupIds: { archivedAt: string; surveyId: string }[]) => void;
=======
>>>>>>> 4da41b7c54ae4966b309c7995dd9e2c9301fba1c
  isAdmin: boolean;
}

export function ArchivePage({
  surveys,
  archivedResponses,
  onUpdateSurvey,
  onRestoreResponseGroup,
  onRestoreResponsesForSurvey,
<<<<<<< HEAD
  onDeleteArchivedResponseGroups,
  onRestoreArchivedResponseGroups,
=======
>>>>>>> 4da41b7c54ae4966b309c7995dd9e2c9301fba1c
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

<<<<<<< HEAD
  // Group responses by survey form and date archived
  const groupedArchivedResponses = useMemo(() => {
    const groups: Record<string, {
      id: string; // `${surveyId}_${archivedAt}`
      surveyId: string;
      surveyTitle: string;
      surveyType: SurveyType;
      archivedAt: string;
      responsesCount: number;
      responses: SurveyResponse[];
    }> = {};

    archivedResponses.forEach((r) => {
      // Use fallback for older data that doesn't have these properties
      const surveyId = r.archivedBySurveyId || r.surveyType;
      const surveyTitle = r.archivedBySurveyTitle || r.surveyType + ' Form';
      const archivedAt = r.archivedAt || r.submissionDate;
      const groupId = `${surveyId}_${archivedAt}`;

      if (!groups[groupId]) {
        groups[groupId] = {
          id: groupId,
          surveyId,
          surveyTitle,
          surveyType: r.surveyType,
          archivedAt,
          responsesCount: 0,
          responses: [],
        };
      }
      
      // Calculate responsesCount properly (number of unique responseIds)
      const isUniqueResponse = !groups[groupId].responses.some(resp => resp.responseId === r.responseId);
      if (isUniqueResponse) {
        groups[groupId].responsesCount += 1;
      }
      
      groups[groupId].responses.push(r);
    });

    return Object.values(groups).sort((a, b) => b.archivedAt.localeCompare(a.archivedAt));
=======
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
>>>>>>> 4da41b7c54ae4966b309c7995dd9e2c9301fba1c
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
<<<<<<< HEAD
        g.surveyTitle.toLowerCase().includes(needle) ||
=======
        g.company.toLowerCase().includes(needle) ||
        g.respondentType.toLowerCase().includes(needle) ||
>>>>>>> 4da41b7c54ae4966b309c7995dd9e2c9301fba1c
        g.surveyType.toLowerCase().includes(needle)
    );
  }, [groupedArchivedResponses, searchQuery]);

<<<<<<< HEAD
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    const next = new Set(expandedGroups);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedGroups(next);
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedGroups);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedGroups(next);
  };

  const selectAll = () => {
    if (selectedGroups.size === filteredGroupedResponses.length) {
      setSelectedGroups(new Set());
    } else {
      setSelectedGroups(new Set(filteredGroupedResponses.map(g => g.id)));
    }
  };

  const [confirmDeleteState, setConfirmDeleteState] = useState<{isOpen: boolean}>({ isOpen: false });

  const handleBulkRestore = () => {
    if (selectedGroups.size === 0 || !onRestoreArchivedResponseGroups) return;
    const groups = filteredGroupedResponses
      .filter(g => selectedGroups.has(g.id))
      .map(g => ({ archivedAt: g.archivedAt, surveyId: g.surveyId }));
    
    onRestoreArchivedResponseGroups(groups);
    setSelectedGroups(new Set());
    setSuccessMessage('Selected archived forms have been restored to live dataset!');
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  const handleBulkDelete = () => {
    if (selectedGroups.size === 0 || !onDeleteArchivedResponseGroups) return;
    setConfirmDeleteState({ isOpen: true });
  };

  const confirmBulkDelete = () => {
    const groups = filteredGroupedResponses
      .filter(g => selectedGroups.has(g.id))
      .map(g => ({ archivedAt: g.archivedAt, surveyId: g.surveyId }));
    
    onDeleteArchivedResponseGroups!(groups);
    setSelectedGroups(new Set());
    setConfirmDeleteState({ isOpen: false });
    setSuccessMessage('Selected archived logs have been permanently deleted.');
    setTimeout(() => setSuccessMessage(null), 4000);
  };

=======
>>>>>>> 4da41b7c54ae4966b309c7995dd9e2c9301fba1c
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
<<<<<<< HEAD
=======
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Archive Center</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Store, review, and restore archived evaluations and historical stakeholder submissions.
        </p>
      </div>

>>>>>>> 4da41b7c54ae4966b309c7995dd9e2c9301fba1c
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
<<<<<<< HEAD
                {/* Bulk Actions Bar */}
                {selectedGroups.size > 0 && (
                  <div className="bg-[#0063a9]/10 border border-[#0063a9]/20 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 animate-fade-in">
                    <span className="text-sm font-bold text-[#0063a9] dark:text-blue-400">
                      {selectedGroups.size} group(s) selected
                    </span>
                    <div className="flex items-center gap-2">
                      <button onClick={handleBulkRestore} className="px-3 py-1.5 text-xs font-bold rounded-lg bg-[#0063a9] text-white hover:bg-[#00528c] transition cursor-pointer">
                        Restore Selected
                      </button>
                      <button onClick={handleBulkDelete} className="px-3 py-1.5 text-xs font-bold rounded-lg bg-rose-600 text-white hover:bg-rose-700 transition cursor-pointer">
                        Delete Selected
                      </button>
                      <button onClick={() => setSelectedGroups(new Set())} className="px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer">
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
                
                {/* Select All Checkbox */}
                <div className="flex items-center gap-2 px-4 py-2 text-sm text-slate-600 dark:text-slate-400">
                  <input
                    type="checkbox"
                    checked={selectedGroups.size === filteredGroupedResponses.length && filteredGroupedResponses.length > 0}
                    onChange={selectAll}
                    className="w-4 h-4 rounded border-slate-300 text-[#0063a9] focus:ring-[#0063a9]"
                  />
                  <span>Select All ({filteredGroupedResponses.length})</span>
                </div>

                {filteredGroupedResponses.map((group) => {
                  const isExpanded = expandedGroups.has(group.id);
                  const isSelected = selectedGroups.has(group.id);
                  
                  return (
                    <div key={group.id} className={`rounded-xl border transition ${isSelected ? 'border-[#0063a9] bg-blue-50/10' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'}`}>
                      <div className="p-4 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelect(group.id)}
                            className="w-4 h-4 rounded border-slate-300 text-[#0063a9] focus:ring-[#0063a9]"
                          />
                          <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-500">
                            <ClipboardList size={20} />
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900 dark:text-white">
                              {group.surveyTitle}
                            </h4>
                            <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                              <span className="inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                {group.surveyType}
                              </span>
                              <span>•</span>
                              <Calendar size={12} />
                              <span>Archived: {new Date(group.archivedAt).toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="text-lg font-black text-slate-900 dark:text-white">{group.responsesCount}</div>
                            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Responses</div>
                          </div>
                          <button
                            onClick={() => toggleExpand(group.id)}
                            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800 transition cursor-pointer"
                          >
                            {isExpanded ? 'Hide Logs' : 'View Logs'}
                          </button>
                        </div>
                      </div>
                      
                      {isExpanded && (
                        <div className="border-t border-slate-200 dark:border-slate-800 p-4 bg-slate-50 dark:bg-slate-950/50 space-y-4">
                          <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500">Actual Logs & Scores</h5>
                          <div className="space-y-3">
                            {/* Group logs by responseId internally for display */}
                            {Array.from(new Set(group.responses.map(r => r.responseId))).map(respId => {
                              const answers = group.responses.filter(r => r.responseId === respId);
                              const first = answers[0];
                              return (
                                <div key={respId} className="bg-white dark:bg-slate-900 rounded-lg p-3 border border-slate-200 dark:border-slate-800 shadow-sm text-xs space-y-2">
                                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                                    <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                      <Building2 size={14} className="text-[#0063a9]" />
                                      {first.company}
                                    </div>
                                    <div className="text-slate-500 flex items-center gap-1">
                                      <UserCheck size={12} /> {first.respondentType}
                                    </div>
                                  </div>
                                  <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
                                    {answers.map(ans => (
                                      <div key={ans.questionId} className="py-1.5 flex justify-between gap-4">
                                        <span className="text-slate-600 dark:text-slate-400 truncate max-w-sm">Q{ans.questionNumber}. {ans.question}</span>
                                        <div className="text-right shrink-0">
                                          <span className="font-bold text-[#0063a9]">{ans.rating}</span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
=======
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
>>>>>>> 4da41b7c54ae4966b309c7995dd9e2c9301fba1c
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
<<<<<<< HEAD

      {confirmDeleteState.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="confirm-bulk-delete-modal">
          <div className="bg-white dark:bg-slate-950 rounded-2xl max-w-md w-full border border-rose-100 dark:border-rose-900/30 p-6 shadow-xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-xl shrink-0">
                <Trash2 size={24} />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Permanently Delete?</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Are you sure you want to permanently delete {selectedGroups.size} archived logs? This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setConfirmDeleteState({ isOpen: false })}
                className="px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 cursor-pointer transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmBulkDelete}
                className="px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl bg-rose-600 hover:bg-rose-700 text-white cursor-pointer transition"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
=======
>>>>>>> 4da41b7c54ae4966b309c7995dd9e2c9301fba1c
    </div>
  );
}
