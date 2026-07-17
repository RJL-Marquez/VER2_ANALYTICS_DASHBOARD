import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  BarChart3,
  ChevronDown,
  Download,
  FileText,
  FileType,
  ListChecks,
  MessageSquare,
  RadarIcon,
  TrendingUp,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
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
import { PartnerCompany, SurveyResponse, SurveyType } from '../types/survey';
import { surveyTypeDisplayLabel } from '../data/questionWeights';
import { formatNumber, getScoreAxisDomain, questionPerformance } from '../utils/analytics';
import { computeCompanyComposite, getCompanyTrend, getLeaderboard, getSectionPeerAverages } from '../utils/scoring';
import { captureChartImage, CompanyReportData, exportCompanyReportAsDocx, exportCompanyReportAsPDF } from '../utils/companyReportExport';

interface CompanyReportBuilderPageProps {
  responses: SurveyResponse[];
  partnerCompanies: PartnerCompany[];
  canExport?: boolean;
  onBack: () => void;
}

const CATEGORIES: SurveyType[] = ['Courier', 'Supplier', 'Subcontractor'];
const PRIMARY_COLOR = '#0063a9';
const PEER_COLOR = '#b91c1c';
const PEER_LABEL = 'Peer average';

function formatMonthLabel(month: string): string {
  const [year, m] = month.split('-');
  if (!m) return month;
  const date = new Date(Number(year), Number(m) - 1, 1);
  if (Number.isNaN(date.getTime())) return month;
  return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
}

export function CompanyReportBuilderPage({ responses, partnerCompanies, canExport, onBack }: CompanyReportBuilderPageProps) {
  const [category, setCategory] = useState<SurveyType>('Courier');
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [graphs, setGraphs] = useState({ bar: true, radar: true, trend: true, perQuestion: true });
  const [includeComments, setIncludeComments] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [isExporting, setIsExporting] = useState<'pdf' | 'docx' | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const barRef = useRef<HTMLDivElement>(null);
  const radarRef = useRef<HTMLDivElement>(null);
  const trendRef = useRef<HTMLDivElement>(null);

  const leaderboard = useMemo(() => getLeaderboard(responses, category), [responses, category]);
  const companyOptions = useMemo(() => leaderboard.map((c) => c.company), [leaderboard]);

  // Keep the company selection valid whenever the category changes.
  useEffect(() => {
    if (!companyOptions.includes(selectedCompany)) {
      setSelectedCompany(companyOptions[0] ?? '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, companyOptions.join('|')]);

  const composite = useMemo(
    () => (selectedCompany ? computeCompanyComposite(selectedCompany, category, responses) : null),
    [selectedCompany, category, responses],
  );
  const peerAverages = useMemo(() => getSectionPeerAverages(responses, category), [responses, category]);
  const trend = useMemo(
    () => (selectedCompany ? getCompanyTrend(responses, selectedCompany, category) : []),
    [selectedCompany, category, responses],
  );
  const questionRows = useMemo(
    () => (selectedCompany ? questionPerformance(responses.filter((r) => r.company === selectedCompany)) : []),
    [selectedCompany, responses],
  );

  const sectionChartData = useMemo(() => {
    if (!composite) return [];
    return composite.sections.map((section) => ({
      section: section.section,
      [composite.company]: section.percent,
      [PEER_LABEL]: peerAverages.find((p) => p.section === section.section)?.average ?? 0,
    }));
  }, [composite, peerAverages]);

  const sectionAxisDomain = useMemo(
    () => getScoreAxisDomain(sectionChartData.flatMap((row) => [row[composite?.company ?? ''] as number, row[PEER_LABEL] as number])),
    [sectionChartData, composite],
  );

  const trendChartData = useMemo(
    () => trend.map((t) => ({ month: t.month, label: formatMonthLabel(t.month), score: t.score })),
    [trend],
  );

  useEffect(() => {
    if (!exportMenuOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setExportMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [exportMenuOpen]);

  const toggleGraph = (key: keyof typeof graphs) => setGraphs((prev) => ({ ...prev, [key]: !prev[key] }));

  const anyGraphSelected = graphs.bar || graphs.radar || graphs.trend || graphs.perQuestion || includeComments;
  const canRunExport = Boolean(canExport && composite && anyGraphSelected && !isExporting);

  const handleExport = async (format: 'pdf' | 'docx') => {
    if (!composite || !selectedCompany) return;
    setIsExporting(format);
    setExportMenuOpen(false);
    try {
      const chartImages = {
        bar: graphs.bar ? await captureChartImage(barRef.current) : null,
        radar: graphs.radar ? await captureChartImage(radarRef.current) : null,
        trend: graphs.trend ? await captureChartImage(trendRef.current) : null,
      };
      const data: CompanyReportData = {
        company: selectedCompany,
        surveyType: category,
        composite,
        generatedOn: new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }),
        graphs,
        includeComments,
        questionRows,
        chartImages,
      };
      if (format === 'pdf') await exportCompanyReportAsPDF(data);
      else await exportCompanyReportAsDocx(data);
    } finally {
      setIsExporting(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header / always-visible back option */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button type="button" onClick={onBack} className="secondary-button">
          <ArrowLeft size={16} />
          <span>Back to Reports</span>
        </button>
        <div className="text-right">
          <h2 className="text-base font-semibold">Companies Report Builder</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Build a per-company PDF or Word report</p>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
        {/* Left: options */}
        <aside className="panel h-fit space-y-6 lg:sticky lg:top-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">1. Category</h3>
            <div className="segmented-control mt-2 grid grid-cols-3">
              {CATEGORIES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setCategory(type)}
                  className={`w-full py-2 text-center text-xs font-semibold ${
                    category === type ? 'segmented-active text-[#0063a9] shadow-sm dark:text-blue-400' : ''
                  }`}
                >
                  {surveyTypeDisplayLabel[type]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">2. Company</h3>
            <select
              className="field mt-2"
              value={selectedCompany}
              onChange={(event) => setSelectedCompany(event.target.value)}
            >
              {companyOptions.length === 0 ? (
                <option value="">No companies with data yet</option>
              ) : (
                companyOptions.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">3. Graphs to include</h3>
            <div className="mt-2 space-y-2">
              <GraphOption
                icon={BarChart3}
                label="Bar graph (section scores)"
                checked={graphs.bar}
                onChange={() => toggleGraph('bar')}
              />
              <GraphOption
                icon={RadarIcon}
                label="Radar graph (section scores)"
                checked={graphs.radar}
                onChange={() => toggleGraph('radar')}
              />
              <GraphOption
                icon={TrendingUp}
                label="Score trend"
                checked={graphs.trend}
                onChange={() => toggleGraph('trend')}
              />
              <GraphOption
                icon={ListChecks}
                label="Per-question average rating"
                checked={graphs.perQuestion}
                onChange={() => toggleGraph('perQuestion')}
              />
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">4. Comments</h3>
            <label className="mt-2 flex cursor-pointer items-start gap-2 rounded-lg border border-slate-200 p-3 text-sm dark:border-slate-800">
              <input
                type="checkbox"
                checked={includeComments}
                onChange={() => setIncludeComments((prev) => !prev)}
                className="mt-0.5"
              />
              <span className="flex-1">
                <span className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-200">
                  <MessageSquare size={14} /> Include stakeholder comments
                </span>
                <span className="mt-1 block text-xs text-slate-400 dark:text-slate-500">
                  The questionnaire doesn't collect free-text comments yet, so this section will appear blank until
                  that field is added.
                </span>
              </span>
            </label>
          </div>
        </aside>

        {/* Right: scrollable preview */}
        <section className="panel flex flex-col">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Preview</h3>
            <span className="text-xs text-slate-400 dark:text-slate-500">Scroll to review the full report</span>
          </div>

          <div className="max-h-[75vh] flex-1 overflow-y-auto rounded-lg border border-slate-200 bg-slate-100 p-4 dark:border-slate-800 dark:bg-slate-950/40 sm:p-8">
            {!composite ? (
              <div className="flex h-64 items-center justify-center text-center text-sm text-slate-400 dark:text-slate-500">
                Select a category and company on the left to generate a preview.
              </div>
            ) : (
              <div className="mx-auto max-w-[760px] space-y-8 rounded-lg bg-white p-8 shadow dark:bg-slate-900 sm:p-10">
                <header className="border-b border-slate-100 pb-6 dark:border-slate-800">
                  <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#0063a9] dark:text-blue-400">
                    Company Performance Report
                  </p>
                  <h1 className="mt-1 text-2xl font-bold text-slate-800 dark:text-slate-100">{composite.company}</h1>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {surveyTypeDisplayLabel[category]} · Generated{' '}
                    {new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                  <div className="mt-4 grid grid-cols-3 gap-3">
                    <SummaryStat label="Composite score" value={`${formatNumber(composite.compositeScore)} / 100`} />
                    <SummaryStat label="Rating band" value={composite.band.label} />
                    <SummaryStat label="Evaluations" value={String(composite.evaluationCount)} />
                  </div>
                </header>

                {graphs.bar && (
                  <div>
                    <h4 className="mb-2 font-semibold text-slate-700 dark:text-slate-200">Section Scores — Bar Graph</h4>
                    <div ref={barRef} className="h-72 w-full bg-white dark:bg-slate-900">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={sectionChartData} margin={{ top: 10, right: 20, bottom: 10, left: -8 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="section" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" height={48} />
                          <YAxis domain={sectionAxisDomain} tick={{ fontSize: 11 }} />
                          <Tooltip />
                          <Legend wrapperStyle={{ fontSize: 11 }} />
                          <Bar dataKey={composite.company} fill={PRIMARY_COLOR} radius={[4, 4, 0, 0]} />
                          <Bar dataKey={PEER_LABEL} fill={PEER_COLOR} radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {graphs.radar && (
                  <div>
                    <h4 className="mb-2 font-semibold text-slate-700 dark:text-slate-200">Section Scores — Radar Graph</h4>
                    <div ref={radarRef} className="h-80 w-full bg-white dark:bg-slate-900">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={sectionChartData} outerRadius="75%" margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
                          <PolarGrid />
                          <PolarAngleAxis dataKey="section" tick={{ fontSize: 11 }} />
                          <PolarRadiusAxis domain={sectionAxisDomain} tick={{ fontSize: 10 }} />
                          <Radar name={composite.company} dataKey={composite.company} stroke={PRIMARY_COLOR} fill={PRIMARY_COLOR} fillOpacity={0.35} />
                          <Radar name={PEER_LABEL} dataKey={PEER_LABEL} stroke={PEER_COLOR} fill={PEER_COLOR} fillOpacity={0.3} />
                          <Legend wrapperStyle={{ fontSize: 11 }} />
                          <Tooltip />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {graphs.trend && (
                  <div>
                    <h4 className="mb-2 font-semibold text-slate-700 dark:text-slate-200">Score Trend</h4>
                    <div ref={trendRef} className="h-64 w-full bg-white dark:bg-slate-900">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={trendChartData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                          <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                          <Tooltip />
                          <Line type="monotone" dataKey="score" name={composite.company} stroke={PRIMARY_COLOR} strokeWidth={2} dot={{ r: 3 }} connectNulls />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    {trendChartData.length === 0 && (
                      <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">Not enough dated submissions yet to plot a trend.</p>
                    )}
                  </div>
                )}

                {graphs.perQuestion && (
                  <div>
                    <h4 className="mb-2 font-semibold text-slate-700 dark:text-slate-200">Per-Question Average Rating</h4>
                    <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-[#0063a9] text-white">
                          <tr>
                            <th className="px-3 py-2 font-semibold">Question</th>
                            <th className="px-3 py-2 font-semibold">Average Rating</th>
                            <th className="px-3 py-2 font-semibold">Responses</th>
                          </tr>
                        </thead>
                        <tbody>
                          {questionRows.map((row, idx) => (
                            <tr key={row.question} className={idx % 2 === 0 ? 'bg-slate-50 dark:bg-slate-800/40' : ''}>
                              <td className="px-3 py-2 text-slate-600 dark:text-slate-300">{row.question}</td>
                              <td className="px-3 py-2 text-slate-600 dark:text-slate-300">{formatNumber(row.average)}</td>
                              <td className="px-3 py-2 text-slate-600 dark:text-slate-300">{row.responses}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {includeComments && (
                  <div>
                    <h4 className="mb-2 font-semibold text-slate-700 dark:text-slate-200">Stakeholder Comments</h4>
                    <p className="rounded-lg border border-dashed border-slate-300 p-4 text-sm italic text-slate-400 dark:border-slate-700 dark:text-slate-500">
                      No comments have been submitted yet — free-text feedback is not yet collected on this questionnaire.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Bottom bar: always-visible cancel + export */}
      <div className="panel sticky bottom-4 flex flex-wrap items-center justify-between gap-3">
        <button type="button" onClick={onBack} className="secondary-button">
          Cancel
        </button>

        {canExport ? (
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              disabled={!canRunExport}
              onClick={() => setExportMenuOpen((prev) => !prev)}
              className="primary-button disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download size={16} />
              {isExporting ? `Exporting ${isExporting.toUpperCase()}…` : 'Export'}
              <ChevronDown size={14} />
            </button>
            {exportMenuOpen && (
              <div className="absolute bottom-full right-0 z-20 mb-1 w-44 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
                <button
                  type="button"
                  onClick={() => handleExport('pdf')}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <FileText size={14} /> PDF
                </button>
                <button
                  type="button"
                  onClick={() => handleExport('docx')}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <FileType size={14} /> Word (.docx)
                </button>
              </div>
            )}
          </div>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-600 dark:border-amber-900/30 dark:bg-amber-950/20 dark:text-amber-400">
            ⚠️ Exporting restricted to Supervisor and above
          </span>
        )}
      </div>
    </div>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-700 dark:text-slate-200">{value}</p>
    </div>
  );
}

function GraphOption({
  icon: Icon,
  label,
  checked,
  onChange,
}: {
  icon: typeof BarChart3;
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-800">
      <input type="checkbox" checked={checked} onChange={onChange} />
      <Icon size={14} className="text-slate-400" />
      <span className="text-slate-700 dark:text-slate-200">{label}</span>
    </label>
  );
}
