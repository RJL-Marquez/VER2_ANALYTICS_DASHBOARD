import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
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
  LabelList,
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
  const contentPageCount = graphs.trend || graphs.perQuestion || includeComments ? 2 : 1;

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

  const radarTickFormatter = (value: string) => {
    if (!composite) return value;
    const row = sectionChartData.find((r) => r.section === value);
    if (!row) return value;
    const companyVal = row[composite.company];
    const peerVal = row[PEER_LABEL];
    const companyStr = typeof companyVal === 'number' ? companyVal.toFixed(1) : '0.0';
    const peerStr = typeof peerVal === 'number' ? peerVal.toFixed(1) : '0.0';
    return `${value} (${companyStr} / ${peerStr})`;
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
            <select
              className="field mt-2"
              value={category}
              onChange={(event) => setCategory(event.target.value as SurveyType)}
            >
              {CATEGORIES.map((type) => (
                <option key={type} value={type}>
                  {surveyTypeDisplayLabel[type]}
                </option>
              ))}
            </select>
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

        {/* Right: paginated print preview */}
        <section className="panel flex flex-col">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Preview</h3>
            <span className="text-xs text-slate-400 dark:text-slate-500">Scroll to review each page — shown as it will print</span>
          </div>

          <div className="max-h-[75vh] flex-1 overflow-y-auto rounded-lg border border-slate-200 bg-slate-200/70 p-6 dark:border-slate-800 dark:bg-slate-950/60 sm:p-10">
            {!composite ? (
              <div className="flex h-64 items-center justify-center text-center text-sm text-slate-400 dark:text-slate-500">
                Select a category and company on the left to generate a preview.
              </div>
            ) : (
              <div className="mx-auto flex flex-col items-center gap-10">
                {/* Page 1 — Cover */}
                <PagedSheet pageLabel="Page 1 · Cover">
                  <div className="flex h-full flex-col items-center justify-center px-6 text-center">
                    <img src="/microgenesis_logo.png" alt="Microgenesis" className="h-14 w-auto" />
                    <div className="mt-7 h-px w-20 bg-[#0063a9]" />
                    <h1 className="mt-7 text-2xl font-bold text-slate-800 dark:text-slate-100">Company Performance Report</h1>
                    <p className="mt-2 text-lg font-bold text-[#0063a9]">{composite.company}</p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      {surveyTypeDisplayLabel[category]} · Generated{' '}
                      {new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                    <div className="mt-20 border-t border-slate-100 pt-4 text-center dark:border-slate-800">
                      <p className="text-xs text-slate-400 dark:text-slate-500">Prepared for internal review by the</p>
                      <p className="text-xs font-bold text-slate-500 dark:text-slate-300">Microgenesis Supplier Management System</p>
                      <p className="mt-1 text-[11px] italic text-slate-400 dark:text-slate-500">
                        This document is confidential and intended solely for the named recipient.
                      </p>
                    </div>
                  </div>
                </PagedSheet>

                {/* Page 2 — Executive summary, bar graph, radar graph */}
                <PagedSheet pageLabel="Page 2" footerRight={`Page 1 of ${contentPageCount}`}>
                  <ReportPageHeader company={composite.company} />
                  <h2 className="mt-6 text-lg font-bold text-slate-800 dark:text-slate-100">Executive Summary</h2>
                  <div className="mt-3 grid grid-cols-3 gap-3">
                    <SummaryStat label="Composite score" value={`${formatNumber(composite.compositeScore)} / 100`} />
                    <SummaryStat label="Rating band" value={composite.band.label} />
                    <SummaryStat label="Evaluations" value={String(composite.evaluationCount)} />
                  </div>

                  {graphs.bar && (
                    <div className="mt-4">
                      <h4 className="mb-1 text-xs font-bold text-slate-700 dark:text-slate-200">Section Scores — Bar Graph</h4>
                      <div ref={barRef} className="bg-white p-5 rounded-lg block dark:bg-slate-900">
                        {/* HTML legend placed vertically on the left, above the chart */}
                        <div className="mb-4 block text-left text-[11px] pl-2">
                          <div className="mb-1.5 flex items-center gap-2">
                            <span className="inline-block h-3 w-3 rounded-sm" style={{ backgroundColor: PRIMARY_COLOR }} />
                            <span className="font-semibold text-slate-700 dark:text-slate-200">{composite.company}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="inline-block h-3 w-3 rounded-sm" style={{ backgroundColor: PEER_COLOR }} />
                            <span className="font-semibold text-slate-500 dark:text-slate-400">{PEER_LABEL}</span>
                          </div>
                        </div>
                        {/* Centered Bar Chart */}
                        <div className="h-[210px] w-full block">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={sectionChartData} margin={{ top: 24, right: 10, bottom: 5, left: -8 }}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} />
                              <XAxis dataKey="section" tick={{ fontSize: 9.5 }} interval={0} height={24} />
                              <YAxis domain={sectionAxisDomain} tick={{ fontSize: 10 }} />
                              <Tooltip />
                              <Bar dataKey={composite.company} fill={PRIMARY_COLOR} radius={[4, 4, 0, 0]} isAnimationActive={false}>
                                <LabelList dataKey={composite.company} position="top" formatter={(val: number) => typeof val === 'number' ? val.toFixed(1) : val} style={{ fontSize: 13, fill: PRIMARY_COLOR, fontWeight: 'bold' }} />
                              </Bar>
                              <Bar dataKey={PEER_LABEL} fill={PEER_COLOR} radius={[4, 4, 0, 0]} isAnimationActive={false}>
                                <LabelList dataKey={PEER_LABEL} position="top" formatter={(val: number) => typeof val === 'number' ? val.toFixed(1) : val} style={{ fontSize: 13, fill: PEER_COLOR, fontWeight: 'bold' }} />
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>
                  )}

                  {graphs.radar && (
                    <div className="mt-4">
                      <h4 className="mb-1 text-xs font-bold text-slate-700 dark:text-slate-200">Section Scores — Radar Graph</h4>
                      <div ref={radarRef} className="h-[265px] w-full bg-white dark:bg-slate-900">
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart data={sectionChartData} outerRadius="90%" margin={{ top: 20, right: 10, bottom: 0, left: 10 }}>
                            <PolarGrid />
                            <PolarAngleAxis dataKey="section" tick={{ fontSize: 10 }} tickFormatter={radarTickFormatter} />
                            <PolarRadiusAxis domain={sectionAxisDomain} tick={{ fontSize: 9 }} />
                            <Radar
                              name={composite.company}
                              dataKey={composite.company}
                              stroke={PRIMARY_COLOR}
                              fill={PRIMARY_COLOR}
                              fillOpacity={0.35}
                              isAnimationActive={false}
                            >
                              <LabelList dataKey={composite.company} position="top" formatter={(val: number) => typeof val === 'number' ? val.toFixed(1) : val} style={{ fontSize: 11, fill: PRIMARY_COLOR, fontWeight: 'bold' }} />
                            </Radar>
                            <Radar
                              name={PEER_LABEL}
                              dataKey={PEER_LABEL}
                              stroke={PEER_COLOR}
                              fill={PEER_COLOR}
                              fillOpacity={0.3}
                              isAnimationActive={false}
                            >
                              <LabelList dataKey={PEER_LABEL} position="bottom" formatter={(val: number) => typeof val === 'number' ? val.toFixed(1) : val} style={{ fontSize: 11, fill: PEER_COLOR, fontWeight: 'bold' }} />
                            </Radar>
                            <Legend verticalAlign="top" align="left" layout="vertical" iconSize={10} wrapperStyle={{ fontSize: 10, paddingBottom: 12, left: 0 }} />
                            <Tooltip />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}
                </PagedSheet>

                {/* Page 3 — Score trend, per-question table, comments */}
                {(graphs.trend || graphs.perQuestion || includeComments) && (
                  <PagedSheet pageLabel="Page 3" footerRight={`Page 2 of ${contentPageCount}`}>
                    <ReportPageHeader company={composite.company} />

                    {graphs.trend && (
                      <div className="mt-6">
                        <h4 className="mb-2 font-semibold text-slate-700 dark:text-slate-200">Score Trend</h4>
                        <div ref={trendRef} className="h-48 w-full bg-white dark:bg-slate-900">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={trendChartData} margin={{ top: 20, right: 16, bottom: 5, left: -10 }}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} />
                              <XAxis dataKey="label" tick={{ fontSize: 9 }} tickLine={false} />
                              <YAxis domain={[0, 100]} tick={{ fontSize: 9 }} tickLine={false} width={30} />
                              <Tooltip />
                              <Legend verticalAlign="top" align="left" layout="horizontal" iconSize={10} wrapperStyle={{ fontSize: 10, paddingBottom: 10, left: 0 }} />
                              <Line type="monotone" dataKey="score" name={composite.company} stroke={PRIMARY_COLOR} strokeWidth={2} dot={{ r: 3 }} connectNulls isAnimationActive={false}>
                                <LabelList dataKey="score" position="top" formatter={(val: number) => typeof val === 'number' ? val.toFixed(1) : val} style={{ fontSize: 13, fill: PRIMARY_COLOR, fontWeight: 'bold' }} />
                              </Line>
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                        {trendChartData.length === 0 && (
                          <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">Not enough dated submissions yet to plot a trend.</p>
                        )}
                      </div>
                    )}

                    {graphs.perQuestion && (
                      <div className="mt-6">
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
                      <div className="mt-6">
                        <h4 className="mb-2 font-semibold text-slate-700 dark:text-slate-200">Stakeholder Comments</h4>
                        <p className="rounded-lg border border-dashed border-slate-300 p-4 text-sm italic text-slate-400 dark:border-slate-700 dark:text-slate-500">
                          No comments have been submitted yet — free-text feedback is not yet collected on this questionnaire.
                        </p>
                      </div>
                    )}
                  </PagedSheet>
                )}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Bottom bar: always-visible cancel + export */}
      <div className="panel sticky bottom-4 flex flex-wrap items-center justify-between gap-3 shadow-2xl ring-1 ring-slate-900/5 dark:ring-white/10 z-10">
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

/** A single A4-proportioned sheet in the print preview, styled like a Word/PDF print-layout page. */
function PagedSheet({
  children,
  pageLabel,
  footerRight,
}: {
  children: ReactNode;
  pageLabel: string;
  footerRight?: string;
}) {
  const PAGE_WIDTH = 640;
  const PAGE_HEIGHT = Math.round(PAGE_WIDTH * (297 / 210)); // A4 aspect ratio
  return (
    <div className="flex flex-col items-center">
      <div
        className="w-full rounded-sm bg-white shadow-xl ring-1 ring-slate-900/5 dark:bg-slate-900 dark:ring-white/10"
        style={{ width: PAGE_WIDTH, minHeight: PAGE_HEIGHT, maxWidth: '100%' }}
      >
        <div className="flex h-full flex-col px-10 py-9 sm:px-12">
          <div className="flex-1">{children}</div>
          {footerRight && (
            <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-3 text-[10px] text-slate-400 dark:border-slate-800 dark:text-slate-500">
              <span>Microgenesis Supplier Management System — Confidential</span>
              <span>{footerRight}</span>
            </div>
          )}
        </div>
      </div>
      <p className="mt-2 text-[11px] font-medium text-slate-400 dark:text-slate-500">{pageLabel}</p>
    </div>
  );
}

/** The small running header (logo + company name) repeated at the top of each content page, mirroring the export. */
function ReportPageHeader({ company }: { company: string }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
      <img src="/microgenesis_logo.png" alt="Microgenesis" className="h-6 w-auto" />
      <div className="text-right">
        <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{company}</p>
        <p className="text-[10px] text-slate-400 dark:text-slate-500">Company Performance Report</p>
      </div>
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
