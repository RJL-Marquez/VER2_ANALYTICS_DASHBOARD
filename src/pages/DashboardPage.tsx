import { Award, Ban, ClipboardList, Star, TrendingUp, Users } from 'lucide-react';
import { motion } from 'motion/react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ChartCard } from '../components/ChartCard';
import { StatCard } from '../components/StatCard';
import { StateMessage } from '../components/StateMessage';
import { SurveyResponse } from '../types/survey';
import { formatNumber, getKpiSummary, monthlyTrend, questionPerformance, ratingDistribution } from '../utils/analytics';

interface DashboardPageProps {
  responses: SurveyResponse[];
  isLoading: boolean;
  error: string | null;
}

const chartColors = ['#e11d48', '#d97706', '#2563eb', '#0f9f6e', '#172033', '#64748b'];

function getSatisfactionColor(p: number) {
  if (p < 50) {
    return {
      text: 'text-red-600 dark:text-red-400',
      bg: 'bg-red-50 dark:bg-red-950/20',
      border: 'border-red-200 dark:border-red-900/40',
      stroke: 'stroke-red-500 dark:stroke-red-400',
      fill: 'fill-red-500 dark:fill-red-400',
      label: 'Critical Status',
      badgeBg: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200',
      description: 'Satisfaction levels are critical. Immediate attention to partner performance and remediation is highly recommended.'
    };
  } else if (p < 65) {
    return {
      text: 'text-orange-500 dark:text-orange-400',
      bg: 'bg-orange-50 dark:bg-orange-950/20',
      border: 'border-orange-200 dark:border-orange-900/40',
      stroke: 'stroke-orange-500 dark:stroke-orange-400',
      fill: 'fill-orange-500 dark:fill-orange-400',
      label: 'Needs Improvement',
      badgeBg: 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-200',
      description: 'Average performance with noticeable gaps. Several operational or communication areas require corrective feedback.'
    };
  } else if (p < 75) {
    return {
      text: 'text-yellow-500 dark:text-yellow-400',
      bg: 'bg-yellow-50 dark:bg-yellow-950/20',
      border: 'border-yellow-200 dark:border-yellow-900/40',
      stroke: 'stroke-yellow-500 dark:stroke-yellow-400',
      fill: 'fill-yellow-500 dark:fill-yellow-400',
      label: 'Satisfactory Performance',
      badgeBg: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200',
      description: 'Acceptable standards met. Consistent results overall, with opportunity to optimize delivery timelines and invoices.'
    };
  } else if (p < 85) {
    return {
      text: 'text-lime-600 dark:text-lime-400',
      bg: 'bg-lime-50 dark:bg-lime-950/20',
      border: 'border-lime-200 dark:border-lime-900/40',
      stroke: 'stroke-lime-500 dark:stroke-lime-400',
      fill: 'fill-lime-500 dark:fill-lime-400',
      label: 'Good Quality Service',
      badgeBg: 'bg-lime-100 text-lime-800 dark:bg-lime-900/50 dark:text-lime-200',
      description: 'Solid performance. Partners are highly responsive, maintaining high quality outputs with minimal transaction discrepancies.'
    };
  } else {
    return {
      text: 'text-green-600 dark:text-green-400',
      bg: 'bg-green-50 dark:bg-green-950/20',
      border: 'border-green-200 dark:border-green-900/40',
      stroke: 'stroke-green-600 dark:stroke-green-400',
      fill: 'fill-green-600 dark:fill-green-400',
      label: 'Excellent Standing',
      badgeBg: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200',
      description: 'Outstanding partnership. Prominent operational quality, competitive pricing terms, and proactive stakeholder engagement.'
    };
  }
}

export function DashboardPage({ responses, isLoading, error }: DashboardPageProps) {
  if (isLoading) {
    return <StateMessage title="Loading analytics" message="Reading centralized survey list records." />;
  }

  if (error) {
    return <StateMessage title="Unable to load dashboard" message={error} />;
  }

  if (!responses.length) {
    return <StateMessage title="No responses match the current filters" message="Reset filters or broaden the date range to restore analytics." />;
  }

  const summary = getKpiSummary(responses);
  const distribution = ratingDistribution(responses);
  const trend = monthlyTrend(responses);
  const questions = questionPerformance(responses);

  // Compute precise top and bottom rated scores directly
  const sortedQuestions = [...questions].sort((left, right) => right.average - left.average);
  const highestScore = sortedQuestions[0]?.average ?? 4.0;
  const lowestScore = sortedQuestions[sortedQuestions.length - 1]?.average ?? 0.0;

  const score = summary.overallSatisfactionScore;
  const color = getSatisfactionColor(score);

  return (
    <div className="space-y-6">
      {/* Prominent KPI Section: Overall Satisfaction (Star) */}
      <div className="panel flex flex-col md:flex-row items-center justify-between p-6 md:p-8 border-2 border-slate-100 dark:border-slate-800/40 shadow-lg relative overflow-hidden bg-gradient-to-r from-white to-slate-50/50 dark:from-slate-950 dark:to-slate-900/40 gap-6 md:gap-10">
        
        {/* Left Side: Circular Gauge */}
        <div className="relative flex items-center justify-center w-48 h-48 shrink-0">
          {/* SVG Circle Progress Ring */}
          <svg className="w-full h-full transform -rotate-90">
            {/* Underlay Track */}
            <circle
              cx="96"
              cy="96"
              r="75"
              className="stroke-slate-100 dark:stroke-slate-800/50 fill-none"
              strokeWidth="10"
            />
            {/* Animated Segment Progress */}
            <motion.circle
              cx="96"
              cy="96"
              r="75"
              className={`${color.stroke} fill-none`}
              strokeWidth="10"
              strokeDasharray="471.2"
              initial={{ strokeDashoffset: 471.2 }}
              animate={{ strokeDashoffset: 471.2 - (471.2 * score) / 100 }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
              strokeLinecap="round"
            />
          </svg>
          
          {/* Centered Number Overlay */}
          <div className="absolute flex flex-col items-center justify-center">
            <motion.span
              className={`text-4xl sm:text-5xl font-light tracking-tight ${color.text}`}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              {formatNumber(score, 0)}%
            </motion.span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mt-1">
              Satisfaction
            </span>
          </div>
        </div>

        {/* Right Side: Overall Satisfaction Texts on its Side */}
        <div className="flex-1 text-center md:text-left space-y-4">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
            <span className="text-xs font-semibold tracking-wider text-slate-400 dark:text-slate-500 uppercase">Primary KPI Metric</span>
            <div className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${color.badgeBg}`}>
              {color.label}
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">Overall Partner Satisfaction</h3>
            <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 leading-relaxed max-w-2xl">
              {color.description}
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-850 flex flex-col sm:flex-row items-center justify-center md:justify-start gap-4 text-xs text-slate-400 dark:text-slate-500">
            <div className="flex items-center gap-1.5">
              <span>Weighted rating:</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">{formatNumber(summary.averageRating, 2)} / 4.00</span>
            </div>
            <span className="hidden sm:inline text-slate-200 dark:text-slate-800">|</span>
            <div className="flex items-center gap-1.5">
              <span>Highest rated:</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">{formatNumber(highestScore, 2)} / 4.00</span>
            </div>
            <span className="hidden sm:inline text-slate-200 dark:text-slate-800">|</span>
            <div className="flex items-center gap-1.5">
              <span>Lowest rated:</span>
              <span className="font-semibold text-rose-500 dark:text-rose-400">{formatNumber(lowestScore, 2)} / 4.00</span>
            </div>
          </div>
        </div>
      </div>

      {/* Primary Stats Row - Only Total Responses and Average Rating on Desktop */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        <StatCard
          label="Total Responses"
          value={String(summary.totalResponses)}
          detail="Consolidated response records extracted directly from Microsoft Forms platforms."
          icon={ClipboardList}
        />
        <StatCard
          label="Average Rating"
          value={`${formatNumber(summary.averageRating, 2)} / 4.00`}
          detail="Total average performance score across all evaluation answers, excluding N/A."
          icon={Star}
        />
      </div>

      {/* Secondary Stats Row - Performance Highlights & N/A Percentage */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        <article className="panel md:col-span-2 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800/60">
              <span className="text-xs font-semibold tracking-wider text-slate-400 dark:text-slate-500 uppercase">Performance Highlights</span>
              <span className="rounded bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.5 text-[10px] font-bold text-azure">Extremes</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Highest Rated Criteria */}
              <div className="space-y-1 pb-3 sm:pb-0 border-b sm:border-b-0 border-slate-100 dark:border-slate-800/40">
                <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  <TrendingUp size={14} className="shrink-0" />
                  <span>Highest Rated Criteria</span>
                </div>
                <p className="text-xl font-bold text-slate-800 dark:text-slate-100">
                  {formatNumber(highestScore, 2)} <span className="text-xs font-normal text-slate-400 dark:text-slate-500">/ 4.00</span>
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed" title={summary.highestRatedQuestion}>
                  "{summary.highestRatedQuestion}"
                </p>
              </div>

              {/* Lowest Rated Criteria */}
              <div className="space-y-1 pt-3 sm:pt-0 sm:pl-4 sm:border-l border-slate-150 dark:border-slate-800/60">
                <div className="flex items-center gap-1.5 text-xs font-medium text-rose-500 dark:text-rose-400">
                  <Users size={14} className="shrink-0" />
                  <span>Lowest Rated Criteria</span>
                </div>
                <p className="text-xl font-bold text-slate-800 dark:text-slate-100">
                  {formatNumber(lowestScore, 2)} <span className="text-xs font-normal text-slate-400 dark:text-slate-500">/ 4.00</span>
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed" title={summary.lowestRatedQuestion}>
                  "{summary.lowestRatedQuestion}"
                </p>
              </div>
            </div>
          </div>
        </article>
        <div className="md:col-span-1">
          <StatCard
            label="N/A Percentage"
            value={`${formatNumber(summary.naPercentage, 1)}%`}
            detail="Share of evaluated criteria marked as Not Applicable by respondents."
            icon={Ban}
          />
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <ChartCard title="Rating Distribution" subtitle="Counts across the full rating scale">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={distribution}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="rating" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {distribution.map((entry, index) => (
                  <Cell key={entry.rating} fill={chartColors[index]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Monthly Trend" subtitle="Average score and response volume over time">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" />
              <YAxis yAxisId="left" domain={[0, 4]} />
              <YAxis yAxisId="right" orientation="right" allowDecimals={false} />
              <Tooltip />
              <Line yAxisId="left" type="monotone" dataKey="average" stroke="#2563eb" strokeWidth={3} dot={false} />
              <Line yAxisId="right" type="monotone" dataKey="responses" stroke="#0f9f6e" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <ChartCard
        title="Question Performance"
        subtitle="All questions, ranked by average rating (highest to lowest)"
        contentClassName="max-h-[32rem] overflow-y-auto pr-1"
      >
        <ol className="divide-y divide-slate-100 dark:divide-slate-800">
          {questions.map((item, index) => {
            const pct = Math.max(0, Math.min(100, (item.average / 4) * 100));
            const tone =
              item.average >= 3
                ? { text: 'text-emerald-700 dark:text-emerald-400', bar: 'bg-emerald-500' }
                : item.average >= 2
                  ? { text: 'text-yellow-700 dark:text-yellow-400', bar: 'bg-yellow-500' }
                  : item.average >= 1
                    ? { text: 'text-orange-700 dark:text-orange-400', bar: 'bg-orange-500' }
                    : { text: 'text-red-700 dark:text-red-400', bar: 'bg-red-500' };

            return (
              <li key={item.question} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-slate-700 dark:text-slate-200">{item.question}</p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="h-1.5 flex-1 rounded-full bg-slate-100 dark:bg-slate-800">
                      <div className={`h-1.5 rounded-full ${tone.bar}`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="shrink-0 text-xs text-slate-400 dark:text-slate-500">{item.responses} responses</span>
                  </div>
                </div>
                <span className={`shrink-0 text-sm font-semibold tabular-nums ${tone.text}`}>{item.average.toFixed(1)}</span>
              </li>
            );
          })}
        </ol>
      </ChartCard>
    </div>
  );
}
