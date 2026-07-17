import { useMemo, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { useIsMobile } from '../hooks/useIsMobile';
import {
  CartesianGrid,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { SurveyResponse, SurveyType } from '../types/survey';
import { surveyTypeDisplayLabel } from '../data/questionWeights';
import { getCompanyTrend, getLeaderboard, getSectionPeerAverages } from '../utils/scoring';

interface CompanyAnalysisPanelProps {
  responses: SurveyResponse[];
}

const surveyTypes: SurveyType[] = ['Courier', 'Supplier', 'Subcontractor'];

export function CompanyAnalysisPanel({ responses }: CompanyAnalysisPanelProps) {
  const isMobile = useIsMobile();
  const [surveyType, setSurveyType] = useState<SurveyType>('Courier');
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const leaderboard = useMemo(() => getLeaderboard(responses, surveyType), [responses, surveyType]);
  const peerAverages = useMemo(() => getSectionPeerAverages(responses, surveyType), [responses, surveyType]);

  const companyOptions = useMemo(() => leaderboard.map((c) => c.company), [leaderboard]);

  const filteredOptions = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return companyOptions;
    return companyOptions.filter((name) => name.toLowerCase().includes(needle));
  }, [companyOptions, query]);

  const activeComposite = leaderboard.find((c) => c.company === selectedCompany) ?? null;

  const radarData = useMemo(() => {
    if (!activeComposite) return [];
    return activeComposite.sections.map((section) => {
      const peer = peerAverages.find((p) => p.section === section.section);
      return {
        section: section.section,
        [activeComposite.company]: section.percent,
        'Peer average': peer?.average ?? 0,
      };
    });
  }, [activeComposite, peerAverages]);

  const trendData = useMemo(() => {
    if (!selectedCompany) return [];
    return getCompanyTrend(responses, selectedCompany, surveyType);
  }, [responses, selectedCompany, surveyType]);

  const handleSelectCompany = (company: string) => {
    setSelectedCompany(company);
    setQuery(company);
    setIsSearchOpen(false);
  };

  const handleClearSelection = () => {
    setSelectedCompany(null);
    setQuery('');
    inputRef.current?.focus();
    setIsSearchOpen(true);
  };

  if (!responses.length) return null;

  return (
    <section className="panel space-y-4">
      <div className="flex flex-col gap-4">
        <div>
          <h3 className="text-base font-semibold">Company Analysis</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Search for a specific company to see its section breakdown and score trend over time.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg border border-slate-100 dark:border-slate-800 w-full">
          <div className="segmented-control flex-1 w-full md:w-auto grid grid-cols-3">
            {surveyTypes.map((type) => (
              <button
                key={type}
                type="button"
                className={`py-2 text-center w-full flex-1 ${surveyType === type ? 'segmented-active font-bold text-[#0063a9] dark:text-blue-400 shadow-sm' : ''}`}
                onClick={() => {
                  setSurveyType(type);
                  setSelectedCompany(null);
                  setQuery('');
                  setIsSearchOpen(false);
                }}
              >
                {surveyTypeDisplayLabel[type]}
              </button>
            ))}
          </div>
        </div>

        {/* Company search / combobox */}
        <div className="relative w-full md:max-w-sm">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={isSearchOpen ? query : (selectedCompany || query)}
              onFocus={() => {
                setIsSearchOpen(true);
                if (selectedCompany) setQuery('');
              }}
              onChange={(e) => {
                setQuery(e.target.value);
                setIsSearchOpen(true);
                if (selectedCompany) setSelectedCompany(null);
              }}
              placeholder={`Search ${surveyTypeDisplayLabel[surveyType].toLowerCase()} companies...`}
              className="w-full pl-9 pr-9 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm text-slate-700 dark:text-slate-200 outline-none focus:border-[#0063a9] dark:focus:border-blue-500 transition-colors"
            />
            {(selectedCompany || query) && (
              <button
                type="button"
                onClick={handleClearSelection}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                aria-label="Clear selection"
              >
                <X size={15} />
              </button>
            )}
          </div>

          {isSearchOpen && (
            <div className="absolute z-20 mt-1.5 w-full max-h-64 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-lg py-1">
              {filteredOptions.length === 0 ? (
                <p className="px-3 py-3 text-sm text-slate-400 dark:text-slate-500 text-center">
                  No matching companies.
                </p>
              ) : (
                filteredOptions.map((company) => (
                  <button
                    key={company}
                    type="button"
                    onMouseDown={(e) => {
                      // onMouseDown fires before the input's onBlur, so selection registers
                      // before we ever close the dropdown.
                      e.preventDefault();
                      handleSelectCompany(company);
                    }}
                    className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm transition-colors ${
                      company === selectedCompany
                        ? 'bg-blue-50 text-[#0063a9] dark:bg-blue-950/40 dark:text-blue-300 font-semibold'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900'
                    }`}
                  >
                    <span className="truncate">{company}</span>
                  </button>
                ))
              )}
            </div>
          )}

          {/* Click-away backdrop to close the dropdown */}
          {isSearchOpen && (
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsSearchOpen(false)}
            />
          )}
        </div>
      </div>

      {activeComposite ? (
        <div className="grid gap-5 xl:grid-cols-2 mt-2">
          <div>
            <h4 className="mb-1 text-sm font-semibold text-slate-600 dark:text-slate-300">
              {activeComposite.company} — section breakdown vs peer average
            </h4>
            <div className="h-64 w-full overflow-hidden">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart
                  data={radarData}
                  outerRadius={isMobile ? '55%' : '75%'}
                  margin={isMobile ? { top: 8, right: 28, bottom: 8, left: 28 } : undefined}
                >
                  <PolarGrid />
                  <PolarAngleAxis dataKey="section" tick={{ fontSize: isMobile ? 9 : 11 }} />
                  <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Radar
                    name={activeComposite.company}
                    dataKey={activeComposite.company}
                    stroke="#2563eb"
                    fill="#2563eb"
                    fillOpacity={0.35}
                  />
                  <Radar name="Peer average" dataKey="Peer average" stroke="#94a3b8" fill="#94a3b8" fillOpacity={0.15} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="flex flex-col">
            <h4 className="mb-1 text-sm font-semibold text-slate-600 dark:text-slate-300">Score trend</h4>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="score" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="flex flex-wrap gap-4 text-xs text-slate-500 dark:text-slate-400 mt-4">
              <span>{activeComposite.ratedQuestionCount} rated criteria</span>
              <span>{activeComposite.naRate}% marked N/A</span>
              <span>Consistency: ±{activeComposite.stdDev} pts std dev per question</span>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-sm text-slate-500 dark:text-slate-400 py-6 text-center">
          Search and select a company above to view its performance analysis.
        </p>
      )}
    </section>
  );
}
