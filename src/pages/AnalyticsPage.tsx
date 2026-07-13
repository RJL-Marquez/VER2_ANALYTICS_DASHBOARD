import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ChartCard } from '../components/ChartCard';
import { StateMessage } from '../components/StateMessage';
import { ComparisonMode, SurveyResponse } from '../types/survey';
import { averageBySurveyType, naFrequency, questionPerformance, responseVolume, visibleSurveyTypes } from '../utils/analytics';

interface AnalyticsPageProps {
  responses: SurveyResponse[];
  comparisonMode: ComparisonMode;
  onComparisonModeChange: (mode: ComparisonMode) => void;
}

const comparisonModes: ComparisonMode[] = ['All Three', 'Contractor vs Supplier', 'Supplier vs Subcontractor', 'Contractor vs Subcontractor'];

export function AnalyticsPage({ responses, comparisonMode, onComparisonModeChange }: AnalyticsPageProps) {
  if (!responses.length) {
    return <StateMessage title="No analytics available" message="Adjust filters to compare survey groups." />;
  }

  const selectedTypes = visibleSurveyTypes(comparisonMode);
  const comparableResponses = responses.filter((response) => selectedTypes.includes(response.surveyType));

  return (
    <div className="space-y-5">
      <section className="panel">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-base font-semibold">Survey Comparison</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Compare satisfaction patterns across stakeholder groups.</p>
          </div>
          <div className="segmented-control">
            {comparisonModes.map((mode) => (
              <button
                key={mode}
                className={comparisonMode === mode ? 'segmented-active' : ''}
                type="button"
                onClick={() => onComparisonModeChange(mode)}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-2">
        <ChartCard title="Average Rating by Survey Type" subtitle="Side-by-side stakeholder comparison">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={averageBySurveyType(comparableResponses)}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="surveyType" />
              <YAxis domain={[0, 4]} />
              <Tooltip />
              <Bar dataKey="average" fill="#2563eb" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Response Volume" subtitle="Filtered response counts by survey">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={responseVolume(comparableResponses)}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="surveyType" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="responses" fill="#0f9f6e" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <ChartCard title="N/A Frequency" subtitle="Non-applicable responses by category">
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
        <ChartCard title="Top and Bottom Questions" subtitle="Performance spread across the question bank">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={questionPerformance(comparableResponses)} layout="vertical" margin={{ left: 70 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" domain={[0, 4]} />
              <YAxis dataKey="question" type="category" width={150} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="average" fill="#172033" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}
