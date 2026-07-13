import { useMemo, useState } from 'react';
import { ClipboardList, Plus, Search, Eye, FormInput, FileText } from 'lucide-react';
import { CustomForm, SurveyType } from '../types/survey';
import { StateMessage } from '../components/StateMessage';

interface SurveyFormsPageProps {
  surveys: CustomForm[];
  responses: any[];
  onSelectSurvey: (id: string) => void;
  onNavigateToCreate: () => void;
  onFillForm: (id: string) => void;
}

const surveyTypeOptions: Array<'All' | SurveyType> = ['All', 'Contractor', 'Supplier', 'Subcontractor'];

const surveyTypeColors: Record<SurveyType, string> = {
  Contractor: '#2563eb',
  Supplier: '#10b981',
  Subcontractor: '#f97316',
};

const surveyTypeBadges: Record<SurveyType, string> = {
  Contractor: 'bg-blue-50 text-blue-700 border border-blue-100 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/20',
  Supplier: 'bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/20',
  Subcontractor: 'bg-orange-50 text-orange-700 border border-orange-100 dark:bg-orange-950/20 dark:text-orange-400 dark:border-orange-900/20',
};

export function SurveyFormsPage({ surveys, responses, onSelectSurvey, onNavigateToCreate, onFillForm }: SurveyFormsPageProps) {
  const [surveyType, setSurveyType] = useState<'All' | SurveyType>('All');
  const [search, setSearch] = useState('');

  const filteredSurveys = useMemo(() => {
    return surveys.filter((survey) => {
      if (surveyType !== 'All' && survey.surveyType !== surveyType) return false;

      if (search.trim()) {
        const needle = search.trim().toLowerCase();
        const haystack = `${survey.title} ${survey.description} ${survey.surveyType}`.toLowerCase();
        if (!haystack.includes(needle)) return false;
      }

      return true;
    });
  }, [surveys, surveyType, search]);

  // Compute responses count per surveyType or custom criteria if possible.
  // Since we don't store surveyId on responses, let's group responseId counts by surveyType for standard surveys, 
  // or count total unique responseIds.
  const responseCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    const processedResponseIds = new Set<string>();

    responses.forEach((resp) => {
      const respId = resp.responseId;
      if (!processedResponseIds.has(respId)) {
        processedResponseIds.add(respId);
        const type = resp.surveyType as SurveyType;
        counts[type] = (counts[type] || 0) + 1;
      }
    });

    return counts;
  }, [responses]);

  return (
    <div className="space-y-5">
      {/* Cards Row */}
      <section className="grid gap-4 sm:grid-cols-2">
        <div className="panel p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Total Active Templates</span>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{surveys.length}</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500">Configured forms for Microgenesis evaluations</p>
          </div>
          <div className="rounded-lg bg-blue-50 p-3.5 text-[#0063a9] dark:bg-blue-950/40 dark:text-blue-300">
            <ClipboardList size={22} />
          </div>
        </div>

        <div className="panel p-5 flex items-center justify-between border-dashed border-2 border-slate-200 dark:border-slate-800/80 bg-slate-50/25 dark:bg-transparent">
          <div className="space-y-1 flex-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Template Engine</span>
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Custom Microsoft Forms</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500">Instantly generate feedback schemas</p>
          </div>
          <button
            onClick={onNavigateToCreate}
            className="flex items-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 text-xs font-bold shadow-sm transition cursor-pointer shrink-0"
            type="button"
          >
            <Plus size={15} />
            <span>Create Form</span>
          </button>
        </div>
      </section>

      {/* Main List Section */}
      <section className="panel">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-base font-semibold">Active Survey Forms</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Interactive forms for evaluating performance metrics, contracts, and service level agreements.
            </p>
          </div>
          <div className="segmented-control">
            {surveyTypeOptions.map((option) => (
              <button
                key={option}
                type="button"
                className={surveyType === option ? 'segmented-active' : ''}
                onClick={() => setSurveyType(option)}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="mb-5">
          <label className="field-label">
            Search Templates
            <div className="mt-1 flex items-center gap-2.5 rounded-lg border border-slate-200 bg-white pl-3 pr-3 transition focus-within:border-azure focus-within:ring-2 focus-within:ring-blue-100 dark:border-slate-800 dark:bg-slate-900 dark:focus-within:ring-blue-950">
              <Search size={16} className="shrink-0 text-[#0063a9] dark:text-blue-300" />
              <span className="h-5 w-px shrink-0 bg-slate-200 dark:bg-slate-700" />
              <input
                className="w-full bg-transparent py-2.5 text-sm text-ink outline-none placeholder:text-slate-400 dark:text-slate-100"
                placeholder="Search survey title or description..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
          </label>
        </div>

        {filteredSurveys.length === 0 ? (
          <StateMessage
            title="No survey forms found"
            message={
              surveys.length === 0
                ? "No custom survey forms have been created yet."
                : "Try adjusting the filters or search to find what you're looking for."
            }
          />
        ) : (
          <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
            <table className="w-full min-w-[720px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-400">
                  <th className="px-4 py-3.5">Survey Title</th>
                  <th className="px-4 py-3.5">Category Type</th>
                  <th className="px-4 py-3.5">Question Count</th>
                  <th className="px-4 py-3.5">Approx. Responses</th>
                  <th className="px-4 py-3.5">Creation Date</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredSurveys.map((survey) => {
                  const numQuestions = survey.questions?.length ?? 0;
                  const numResponses = responseCounts[survey.surveyType] ?? 0;
                  const displayDate = new Date(survey.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  });

                  return (
                    <tr key={survey.id} className="align-middle hover:bg-slate-50/40 dark:hover:bg-slate-900/10">
                      <td className="px-4 py-3.5">
                        <div className="space-y-0.5 max-w-sm">
                          <span className="font-bold text-slate-850 dark:text-slate-100 hover:text-[#0063a9] dark:hover:text-blue-400 cursor-pointer" onClick={() => onSelectSurvey(survey.id)}>
                            {survey.title}
                          </span>
                          <p className="text-xs text-slate-400 dark:text-slate-500 line-clamp-1" title={survey.description}>
                            {survey.description || 'No description provided.'}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${surveyTypeBadges[survey.surveyType]}`}>
                          {survey.surveyType}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-medium text-slate-600 dark:text-slate-300">
                        {numQuestions} {numQuestions === 1 ? 'question' : 'questions'}
                      </td>
                      <td className="px-4 py-3.5 font-medium text-slate-600 dark:text-slate-300">
                        {numResponses} {numResponses === 1 ? 'response' : 'responses'}
                      </td>
                      <td className="px-4 py-3.5 text-slate-500 dark:text-slate-400">
                        {displayDate}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2.5">
                          <button
                            onClick={() => onSelectSurvey(survey.id)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-300 px-2.5 py-1.5 text-xs font-semibold transition cursor-pointer"
                            type="button"
                            title="Manage questions and details"
                          >
                            <Eye size={13} />
                            <span>Manage</span>
                          </button>
                          <button
                            onClick={() => onFillForm(survey.id)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 text-[#0063a9] hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-300 px-2.5 py-1.5 text-xs font-bold transition cursor-pointer"
                            type="button"
                            title="Open submission ingress form"
                          >
                            <FormInput size={13} />
                            <span>Fill Ingress</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
