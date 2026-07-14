import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Download,
  Maximize2,
  Minimize2,
  Sparkles,
  Trophy,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
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
import { Slide } from '../utils/presentation';
import { exportSlidesAsPDF } from '../utils/presentationPdf';

interface SlideDeckProps {
  slides: Slide[];
  title: string;
  onExit: () => void;
}

const surveyTypeColors: Record<string, string> = {
  Contractor: '#2563eb',
  Supplier: '#10b981',
  Subcontractor: '#f97316',
};

function slideTitleFor(slide: Slide, index: number): string {
  switch (slide.kind) {
    case 'title':
      return 'Cover';
    case 'agenda':
      return 'Contents';
    case 'overview':
      return 'Overview';
    case 'comparison':
      return 'Survey Comparison';
    case 'sections':
      return 'Category Breakdown';
    case 'leaderboard':
      return 'Leaderboard';
    case 'trends':
      return 'Trends';
    case 'questions':
      return 'Top & Bottom Questions';
    case 'spotlight':
      return 'Spotlight';
    case 'distribution':
      return 'Rating Distribution';
    case 'closing':
      return 'Key Takeaways';
    default:
      return `Slide ${index + 1}`;
  }
}

function ScoreBadge({ label, hex }: { label: string; hex: string }) {
  return (
    <span
      className="inline-flex items-center rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide"
      style={{ backgroundColor: `${hex}1a`, color: hex }}
    >
      {label}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Individual slide layouts                                            */
/* ------------------------------------------------------------------ */

function TitleSlide({ slide }: { slide: Extract<Slide, { kind: 'title' }> }) {
  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-[#0063a9] via-[#005793] to-[#00335a] px-10 text-center text-white">
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-16 h-96 w-96 rounded-full bg-sky-300/20 blur-3xl" />
      <div className="pointer-events-none absolute right-10 top-10 h-24 w-24 rounded-full border border-white/20" />
      <Sparkles className="mb-5 text-sky-200" size={32} />
      <p className="text-xs font-bold uppercase tracking-[0.35em] text-sky-200">{slide.subtitle}</p>
      <h1 className="mt-4 max-w-3xl text-3xl font-bold leading-tight sm:text-5xl">{slide.title}</h1>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-2.5">
        {slide.meta.map((item) => (
          <span key={item} className="rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-xs font-semibold tracking-wide backdrop-blur-sm">
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

function AgendaSlide({ slide }: { slide: Extract<Slide, { kind: 'agenda' }> }) {
  return (
    <div className="flex h-full w-full flex-col bg-white px-8 py-8 sm:px-14 sm:py-12">
      <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#0063a9]">What's inside</p>
      <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">Contents</h2>
      <div className="mt-6 flex-1 overflow-y-auto pr-1">
        <ol className="space-y-3">
          {slide.items.map((item, index) => (
            <li key={item.label} className="flex items-start gap-4 rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0063a9] text-sm font-bold text-white">
                {index + 1}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-800 sm:text-base">{item.label}</p>
                <p className="text-xs text-slate-500 sm:text-sm">{item.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

function OverviewSlide({ slide }: { slide: Extract<Slide, { kind: 'overview' }> }) {
  return (
    <div className="flex h-full w-full flex-col overflow-y-auto bg-gradient-to-b from-white to-blue-50/60 px-8 py-8 sm:px-14 sm:py-10">
      <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#0063a9]">Overview</p>
      <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">Where things stand</h2>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {slide.kpis.map((kpi) => (
          <div key={kpi.label} className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{kpi.label}</p>
            <p className="mt-1 text-xl font-bold text-slate-900 sm:text-2xl">{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.1fr,1fr]">
        <div className="rounded-xl border-2 border-[#0063a9]/15 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-[#0063a9]">
            <Trophy size={18} />
            <span className="text-xs font-bold uppercase tracking-wider">Top Performer Overall</span>
          </div>
          <h3 className="mt-2 text-lg font-bold text-slate-900 sm:text-xl">{slide.standout.name}</h3>
          <p className="mt-1 text-sm text-slate-500">
            {slide.standout.type} · <span className="font-semibold text-slate-700">{slide.standout.score}</span>
          </p>
          <p className="mt-3 text-xs text-slate-400">Highest scoring criterion: {slide.highlight}</p>
        </div>

        <div className="space-y-2.5">
          {slide.topPerformers.map((performer) => (
            <div
              key={performer.type}
              className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-white px-4 py-3 shadow-sm"
            >
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Top {performer.type}</p>
                <p className="truncate text-sm font-bold text-slate-800">{performer.name}</p>
              </div>
              <span className="shrink-0 text-sm font-bold text-[#0063a9]">{performer.score}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ComparisonSlide({ slide }: { slide: Extract<Slide, { kind: 'comparison' }> }) {
  return (
    <div className="flex h-full w-full flex-col bg-white px-8 py-8 sm:px-14 sm:py-10">
      <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#0063a9]">Category</p>
      <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">Survey Type Comparison</h2>
      <p className="mt-1 text-sm text-slate-500">Average rating and response volume side by side.</p>
      <div className="mt-6 grid flex-1 gap-6 lg:grid-cols-2">
        <div className="min-h-[220px] rounded-xl border border-slate-100 p-4">
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">Average rating (0–4)</p>
          <ResponsiveContainer width="100%" height="90%">
            <BarChart data={slide.data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="surveyType" tick={{ fontSize: 12 }} />
              <YAxis domain={[0, 4]} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="average" radius={[6, 6, 0, 0]}>
                {slide.data.map((entry) => (
                  <Cell key={entry.surveyType} fill={surveyTypeColors[entry.surveyType]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="min-h-[220px] rounded-xl border border-slate-100 p-4">
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">Response volume</p>
          <ResponsiveContainer width="100%" height="90%">
            <BarChart data={slide.data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="surveyType" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="responses" radius={[6, 6, 0, 0]}>
                {slide.data.map((entry) => (
                  <Cell key={entry.surveyType} fill={surveyTypeColors[entry.surveyType]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function SectionsSlide({ slide }: { slide: Extract<Slide, { kind: 'sections' }> }) {
  const max = Math.max(4, ...slide.data.map((d) => d.average));
  return (
    <div className="flex h-full w-full flex-col bg-white px-8 py-8 sm:px-14 sm:py-10">
      <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#0063a9]">Category</p>
      <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">Category Breakdown</h2>
      <p className="mt-1 text-sm text-slate-500">Average rating by evaluation category, strongest to weakest.</p>
      <div className="mt-5 flex-1 space-y-3 overflow-y-auto pr-1">
        {slide.data.map((item, index) => (
          <div key={item.category} className="flex items-center gap-3">
            <span className="w-32 shrink-0 truncate text-sm font-semibold text-slate-700 sm:w-40">{item.category}</span>
            <div className="h-3 flex-1 rounded-full bg-slate-100">
              <div
                className="h-3 rounded-full"
                style={{
                  width: `${Math.min(100, (item.average / max) * 100)}%`,
                  backgroundColor: index === 0 ? '#10b981' : index === slide.data.length - 1 ? '#ef4444' : '#2563eb',
                }}
              />
            </div>
            <span className="w-14 shrink-0 text-right text-sm font-bold text-slate-800">{item.average.toFixed(2)}</span>
            <span className="w-20 shrink-0 text-right text-xs text-slate-400">{item.responses} resp.</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function LeaderboardSlide({ slide }: { slide: Extract<Slide, { kind: 'leaderboard' }> }) {
  return (
    <div className="flex h-full w-full flex-col bg-white px-8 py-8 sm:px-14 sm:py-10">
      <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#0063a9]">Category</p>
      <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">Company Leaderboard</h2>
      <p className="mt-1 text-sm text-slate-500">Top-ranked partners within each survey type.</p>
      <div className="mt-5 grid flex-1 gap-4 overflow-y-auto pr-1 sm:grid-cols-3">
        {slide.groups.map((group) => (
          <div key={group.surveyType} className="rounded-xl border border-slate-100 p-3">
            <p
              className="mb-2 text-xs font-bold uppercase tracking-wider"
              style={{ color: surveyTypeColors[group.surveyType] }}
            >
              {group.surveyType}
            </p>
            {group.rows.length ? (
              <ol className="space-y-1.5">
                {group.rows.map((row) => (
                  <li key={row.company} className="flex items-center gap-2">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-500">
                      {row.rank}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-xs font-semibold text-slate-700">{row.company}</span>
                    <span className="shrink-0 text-xs font-bold" style={{ color: row.hex }}>
                      {row.score.toFixed(0)}
                    </span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-xs text-slate-400">No data for this window.</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function TrendsSlide({ slide }: { slide: Extract<Slide, { kind: 'trends' }> }) {
  return (
    <div className="flex h-full w-full flex-col bg-white px-8 py-8 sm:px-14 sm:py-10">
      <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#0063a9]">Category</p>
      <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">Trends Over Time</h2>
      <p className="mt-1 text-sm text-slate-500">Monthly average rating and response volume.</p>
      <div className="mt-6 min-h-[240px] flex-1 rounded-xl border border-slate-100 p-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={slide.data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis yAxisId="left" domain={[0, 4]} tick={{ fontSize: 12 }} />
            <YAxis yAxisId="right" orientation="right" allowDecimals={false} tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line yAxisId="left" type="monotone" name="Average rating" dataKey="average" stroke="#2563eb" strokeWidth={3} dot={false} />
            <Line yAxisId="right" type="monotone" name="Responses" dataKey="responses" stroke="#10b981" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function QuestionsSlide({ slide }: { slide: Extract<Slide, { kind: 'questions' }> }) {
  return (
    <div className="flex h-full w-full flex-col bg-white px-8 py-8 sm:px-14 sm:py-10">
      <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#0063a9]">Category</p>
      <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">Top & Bottom Questions</h2>
      <div className="mt-5 grid flex-1 gap-5 overflow-y-auto pr-1 sm:grid-cols-2">
        <div>
          <div className="mb-2 flex items-center gap-1.5 text-emerald-600">
            <TrendingUp size={16} />
            <span className="text-xs font-bold uppercase tracking-wider">Highest scoring</span>
          </div>
          <ol className="space-y-2">
            {slide.top.map((q, i) => (
              <li key={q.question} className="rounded-lg bg-emerald-50/60 px-3 py-2">
                <p className="text-xs text-slate-700">
                  <span className="font-bold text-emerald-700">{i + 1}. </span>
                  {q.question}
                </p>
                <p className="mt-0.5 text-xs font-bold text-emerald-600">{q.average.toFixed(2)} / 4.00</p>
              </li>
            ))}
          </ol>
        </div>
        <div>
          <div className="mb-2 flex items-center gap-1.5 text-rose-600">
            <TrendingDown size={16} />
            <span className="text-xs font-bold uppercase tracking-wider">Lowest scoring</span>
          </div>
          <ol className="space-y-2">
            {slide.bottom.map((q, i) => (
              <li key={q.question} className="rounded-lg bg-rose-50/60 px-3 py-2">
                <p className="text-xs text-slate-700">
                  <span className="font-bold text-rose-700">{i + 1}. </span>
                  {q.question}
                </p>
                <p className="mt-0.5 text-xs font-bold text-rose-600">{q.average.toFixed(2)} / 4.00</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}

function SpotlightSlide({ slide }: { slide: Extract<Slide, { kind: 'spotlight' }> }) {
  return (
    <div className="flex h-full w-full flex-col bg-white px-8 py-8 sm:px-14 sm:py-10">
      <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#0063a9]">Category</p>
      <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">Company Spotlight</h2>
      <div className="mt-5 grid flex-1 gap-5 lg:grid-cols-[1fr,1.1fr]">
        <div className="flex flex-col justify-center rounded-xl border-2 border-slate-100 p-5">
          <ScoreBadge label={slide.band} hex={slide.hex} />
          <h3 className="mt-3 text-xl font-bold text-slate-900">{slide.company}</h3>
          <p className="text-sm text-slate-500">{slide.surveyType}</p>
          <p className="mt-4 text-4xl font-bold" style={{ color: slide.hex }}>
            {slide.score.toFixed(1)}
            <span className="text-base font-medium text-slate-400"> / 100</span>
          </p>
          {slide.atRisk && (
            <div className="mt-6 flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2.5 text-amber-800">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              <p className="text-xs">
                <span className="font-bold">{slide.atRisk.company}</span> is trailing its peer group at{' '}
                {slide.atRisk.score.toFixed(1)} / 100 and may need attention.
              </p>
            </div>
          )}
        </div>
        <div className="min-h-[220px] rounded-xl border border-slate-100 p-3">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={slide.radar} outerRadius="72%">
              <PolarGrid />
              <PolarAngleAxis dataKey="section" tick={{ fontSize: 10 }} />
              <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 9 }} />
              <Radar name={slide.company} dataKey="value" stroke={slide.hex} fill={slide.hex} fillOpacity={0.35} />
              <Radar name="Peer average" dataKey="peer" stroke="#94a3b8" fill="#94a3b8" fillOpacity={0.15} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function DistributionSlide({ slide }: { slide: Extract<Slide, { kind: 'distribution' }> }) {
  return (
    <div className="flex h-full w-full flex-col bg-white px-8 py-8 sm:px-14 sm:py-10">
      <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#0063a9]">Category</p>
      <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">Rating Distribution</h2>
      <p className="mt-1 text-sm text-slate-500">
        <span className="font-semibold text-slate-700">{slide.naPercentage.toFixed(1)}%</span> of ratings were marked N/A.
      </p>
      <div className="mt-6 min-h-[220px] flex-1 rounded-xl border border-slate-100 p-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={slide.ratings}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="rating" tick={{ fontSize: 12 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="count" radius={[6, 6, 0, 0]}>
              {slide.ratings.map((entry, index) => (
                <Cell key={entry.rating} fill={['#2563eb', '#10b981', '#f97316', '#64748b', '#e11d48'][index % 5]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function ClosingSlide({ slide }: { slide: Extract<Slide, { kind: 'closing' }> }) {
  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-[#172033] via-[#0f1a2e] to-[#0063a9] px-10 py-10 text-center text-white">
      <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-sky-400/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-white/5 blur-3xl" />
      <Trophy className="mb-4 text-sky-200" size={30} />
      <h2 className="text-2xl font-bold sm:text-3xl">Key Takeaways</h2>
      <ul className="mx-auto mt-6 max-w-2xl space-y-3 text-left">
        {slide.takeaways.map((point) => (
          <li key={point} className="flex items-start gap-3 rounded-xl border border-white/15 bg-white/5 px-4 py-3 backdrop-blur-sm">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-300" />
            <span className="text-sm text-blue-50">{point}</span>
          </li>
        ))}
      </ul>
      <p className="mt-8 text-xs font-semibold uppercase tracking-[0.3em] text-sky-200">Thank you</p>
    </div>
  );
}

function SlideContent({ slide }: { slide: Slide }) {
  switch (slide.kind) {
    case 'title':
      return <TitleSlide slide={slide} />;
    case 'agenda':
      return <AgendaSlide slide={slide} />;
    case 'overview':
      return <OverviewSlide slide={slide} />;
    case 'comparison':
      return <ComparisonSlide slide={slide} />;
    case 'sections':
      return <SectionsSlide slide={slide} />;
    case 'leaderboard':
      return <LeaderboardSlide slide={slide} />;
    case 'trends':
      return <TrendsSlide slide={slide} />;
    case 'questions':
      return <QuestionsSlide slide={slide} />;
    case 'spotlight':
      return <SpotlightSlide slide={slide} />;
    case 'distribution':
      return <DistributionSlide slide={slide} />;
    case 'closing':
      return <ClosingSlide slide={slide} />;
    default:
      return null;
  }
}

/* ------------------------------------------------------------------ */
/* Deck shell: thumbnails, controls, fullscreen, PDF export             */
/* ------------------------------------------------------------------ */

export function SlideDeck({ slides, title, onExit }: SlideDeckProps) {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);

  const goTo = (next: number) => {
    if (next < 0 || next >= slides.length) return;
    setDirection(next > index ? 1 : -1);
    setIndex(next);
  };

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight') goTo(index + 1);
      if (event.key === 'ArrowLeft') goTo(index - 1);
      if (event.key === 'Escape' && document.fullscreenElement) document.exitFullscreen();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [index, slides.length]);

  useEffect(() => {
    const handler = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  const toggleFullscreen = async () => {
    if (!stageRef.current) return;
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else {
      await stageRef.current.requestFullscreen();
    }
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      exportSlidesAsPDF(slides, title);
    } finally {
      setIsExporting(false);
    }
  };

  const progress = useMemo(() => ((index + 1) / slides.length) * 100, [index, slides.length]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button onClick={onExit} type="button" className="secondary-button">
          <ArrowLeft size={16} />
          <span>Back to setup</span>
        </button>
        <div className="flex items-center gap-2">
          <button onClick={handleExportPDF} type="button" className="secondary-button" disabled={isExporting}>
            <Download size={16} />
            <span>{isExporting ? 'Exporting…' : 'Export PDF'}</span>
          </button>
          <button onClick={toggleFullscreen} type="button" className="secondary-button">
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            <span>{isFullscreen ? 'Exit fullscreen' : 'Present fullscreen'}</span>
          </button>
        </div>
      </div>

      <div ref={stageRef} className="rounded-2xl border border-slate-200 bg-slate-950 p-3 dark:border-slate-800 sm:p-5">
        {/* Progress bar */}
        <div className="mb-3 h-1 w-full overflow-hidden rounded-full bg-white/10">
          <div className="h-1 rounded-full bg-[#2563eb] transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>

        <div className="flex flex-col gap-3 lg:flex-row">
          {/* Stage */}
          <div className="relative flex-1">
            <div className="relative aspect-video w-full overflow-hidden rounded-xl shadow-2xl">
              <AnimatePresence custom={direction} mode="wait">
                <motion.div
                  key={index}
                  custom={direction}
                  initial={{ opacity: 0, x: direction * 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: direction * -40 }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                  className="absolute inset-0"
                >
                  <SlideContent slide={slides[index]} />
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Prev / Next */}
            <button
              onClick={() => goTo(index - 1)}
              type="button"
              disabled={index === 0}
              className="absolute left-2 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-md transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-0"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => goTo(index + 1)}
              type="button"
              disabled={index === slides.length - 1}
              className="absolute right-2 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-md transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-0"
            >
              <ChevronRight size={18} />
            </button>

            <div className="mt-2 flex items-center justify-center gap-2 text-xs font-semibold text-slate-300">
              <span>
                Slide {index + 1} of {slides.length}
              </span>
              <span className="text-slate-500">·</span>
              <span>{slideTitleFor(slides[index], index)}</span>
            </div>
          </div>

          {/* Thumbnail rail */}
          <div className="flex gap-2 overflow-x-auto pb-1 lg:w-40 lg:flex-col lg:overflow-y-auto lg:overflow-x-visible lg:pb-0">
            {slides.map((slide, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                type="button"
                className={`flex shrink-0 items-center gap-2 rounded-lg border px-2.5 py-2 text-left text-[11px] font-semibold transition lg:w-full ${
                  i === index
                    ? 'border-[#2563eb] bg-[#2563eb]/10 text-white'
                    : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/25 hover:bg-white/10'
                }`}
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-[10px]">{i + 1}</span>
                <span className="truncate">{slideTitleFor(slide, i)}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
