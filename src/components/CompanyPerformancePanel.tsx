import { useMemo, useState } from 'react';
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
import { getCompanyTrend, getLeaderboard, getOutliers, getSectionPeerAverages } from '../utils/scoring';

interface CompanyPerformancePanelProps {
  responses: SurveyResponse[];
}

const surveyTypes: SurveyType[] = ['Contractor', 'Supplier', 'Subcontractor'];

export function CompanyPerformancePanel({ responses }: CompanyPerformancePanelProps) {
  const [surveyType, setSurveyType] = useState<SurveyType>('Contractor');
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);

  const leaderboard = useMemo(() => getLeaderboard(responses, surveyType), [responses, surveyType]);
  const outliers = useMemo(() => getOutliers(leaderboard), [leaderboard]);
  const outlierMap = useMemo(() => new Map(outliers.map((o) => [o.company, o])), [outliers]);
  const peerAverages = useMemo(() => getSectionPeerAverages(responses, surveyType), [responses, surveyType]);

  const activeCompany = selectedCompany ?? leaderboard[leaderboard.length - 1]?.company ?? null;
  const activeComposite = leaderboard.find((c) => c.company === activeCompany) ?? null;

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
    if (!activeCompany) return [];
    return getCompanyTrend(responses, activeCompany, surveyType);
  }, [responses, activeCompany, surveyType]);

  if (!responses.length) return null;

  return (
    <section className="panel space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-base font-semibold">Company Performance</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Composite scores weighted to match each form's actual point values, ranked within their own peer group.
          </p>
        </div>
        <div className="segmented-control">
          {surveyTypes.map((type) => (
            <button
              key={type}
              type="button"
              className={surveyType === type ? 'segmented-active' : ''}
              onClick={() => {
                setSurveyType(type);
                setSelectedCompany(null);
              }}
            >
              {surveyTypeDisplayLabel[type]}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <div>
          <h4 className="mb-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
            Leaderboard ({leaderboard.length} companies)
          </h4>
          <ol className="max-h-[26rem] divide-y divide-slate-100 overflow-y-auto pr-1 dark:divide-slate-800">
            {leaderboard.map((composite, index) => {
              const outlier = outlierMap.get(composite.company);
              const isActive = composite.company === activeCompany;
              return (
                <li key={composite.company}>
                  <button
                    type="button"
                    onClick={() => setSelectedCompany(composite.company)}
                    className={`flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left transition ${
                      isActive ? 'bg-blue-50 dark:bg-blue-950/60' : 'hover:bg-slate-50 dark:hover:bg-slate-900'
                    }`}
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-slate-700 dark:text-slate-200">{composite.company}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        <span
                          className="badge"
                          style={{ backgroundColor: `${composite.band.hex}1a`, color: composite.band.hex }}
                        >
                          {composite.band.label}
                        </span>
                        {composite.stdDev >= 20 ? (
                          <span className="badge bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
                            Inconsistent (±{composite.stdDev})
                          </span>
                        ) : null}
                        {outlier?.isLowOutlier ? (
                          <span className="badge bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300">
                            Below peer average
                          </span>
                        ) : null}
                        <span className="text-xs text-slate-400 dark:text-slate-500">
                          {composite.evaluationCount} evaluation{composite.evaluationCount === 1 ? '' : 's'}
                        </span>
                      </div>
                    </div>
                    <span className="shrink-0 text-sm font-semibold tabular-nums" style={{ color: composite.band.hex }}>
                      {composite.compositeScore.toFixed(1)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>

        <div className="space-y-4">
          {activeComposite ? (
            <>
              <div>
                <h4 className="mb-1 text-sm font-semibold text-slate-600 dark:text-slate-300">
                  {activeComposite.company} — section breakdown vs peer average
                </h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData} outerRadius="75%">
                      <PolarGrid />
                      <PolarAngleAxis dataKey="section" tick={{ fontSize: 11 }} />
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

              <div>
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
              </div>

              <div className="flex flex-wrap gap-4 text-xs text-slate-500 dark:text-slate-400">
                <span>{activeComposite.ratedQuestionCount} rated criteria</span>
                <span>{activeComposite.naRate}% marked N/A</span>
                <span>Consistency: ±{activeComposite.stdDev} pts std dev per question</span>
              </div>
            </>
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400">Select a company from the leaderboard.</p>
          )}
        </div>
      </div>
    </section>
  );
}
