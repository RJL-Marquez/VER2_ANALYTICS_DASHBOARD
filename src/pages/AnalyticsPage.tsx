import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ChartCard } from '../components/ChartCard';
import { StateMessage } from '../components/StateMessage';
import { SurveyResponse, SurveyType } from '../types/survey';
import { averageBySurveyType, naFrequency, questionPerformance, responseVolume } from '../utils/analytics';

interface AnalyticsPageProps {
  responses: SurveyResponse[];
  activeSurveyTypes: SurveyType[];
}

const surveyTypeColors: Record<SurveyType, string> = {
  Contractor: '#2563eb',
  Supplier: '#10b981',
  Subcontractor: '#f97316',
};

function truncateQuestion(text: string, max = 44) {
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

export function AnalyticsPage({ responses, activeSurveyTypes }: AnalyticsPageProps) {
  if (!responses.length) {
    return <StateMessage title="No analytics available" message="Adjust filters to compare survey groups." />;
  }

  const comparableResponses = responses;

  const rankedQuestions = questionPerformance(comparableResponses);
  const topQuestions = rankedQuestions.slice(0, 5);
  const remainingQuestions = rankedQuestions.slice(5);
  const bottomQuestions = remainingQuestions.slice(-5);
  const spreadQuestions = [...topQuestions, ...bottomQuestions];

  return (
    <div className="space-y-5">
      <section className="panel">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-base font-semibold">Survey Comparison</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Compare satisfaction patterns across stakeholder groups.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {activeSurveyTypes.map((type) => (
              <span
                key={type}
                className="inline-flex items-center gap-2 rounded-full border border-transparent px-3.5 py-1.5 text-sm font-medium text-white shadow-sm"
                style={{ backgroundColor: surveyTypeColors[type] }}
              >
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.85)' }} />
                {type}
              </span>
            ))}
            <span className="text-xs text-slate-400 dark:text-slate-500">Use the Survey Type filter to change this.</span>
          </div>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-2">
        <ChartCard title="Average Rating by Survey Type" subtitle="Side-by-side stakeholder comparison">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={averageBySurveyType(comparableResponses, activeSurveyTypes)}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="surveyType" />
              <YAxis domain={[0, 4]} />
              <Tooltip />
              <Bar dataKey="average" radius={[6, 6, 0, 0]}>
                {averageBySurveyType(comparableResponses, activeSurveyTypes).map((entry) => (
                  <Cell key={entry.surveyType} fill={surveyTypeColors[entry.surveyType]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Response Volume" subtitle="Filtered response counts by survey">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={responseVolume(comparableResponses, activeSurveyTypes)}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="surveyType" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="responses" radius={[6, 6, 0, 0]}>
                {responseVolume(comparableResponses, activeSurveyTypes).map((entry) => (
                  <Cell key={entry.surveyType} fill={surveyTypeColors[entry.surveyType]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <ChartCard title="N/A Frequency" subtitle="Non-applicable responses by category" contentClassName="h-[26rem]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={naFrequency(comparableResponses)}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="category" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#d97706" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard
          title="Top and Bottom Questions"
          subtitle="5 highest and 5 lowest scoring questions"
          contentClassName="h-[26rem]"
        >
          <div className="mb-2 flex items-center gap-4 text-xs font-medium text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Top 5
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-red-500" />
              Bottom 5
            </span>
          </div>
          <ResponsiveContainer width="100%" height="90%">
            <BarChart data={spreadQuestions} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" domain={[0, 4]} />
              <YAxis
                dataKey="question"
                type="category"
                width={190}
                tick={{ fontSize: 12 }}
                tickFormatter={(value: string) => truncateQuestion(value)}
                interval={0}
              />
              <Tooltip labelFormatter={(value: string) => value} wrapperStyle={{ maxWidth: 320, whiteSpace: 'normal' }} />
              <Bar dataKey="average" radius={[0, 6, 6, 0]}>
                {spreadQuestions.map((entry, index) => (
                  <Cell key={entry.question} fill={index < topQuestions.length ? '#10b981' : '#ef4444'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}
