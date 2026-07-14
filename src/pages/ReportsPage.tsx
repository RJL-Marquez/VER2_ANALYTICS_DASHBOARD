import { Download, FileBarChart, FileSpreadsheet, Printer } from 'lucide-react';
import { SurveyResponse } from '../types/survey';
import { averageBySurveyType, formatNumber, getKpiSummary, questionPerformance } from '../utils/analytics';

interface ReportsPageProps {
  responses: SurveyResponse[];
  isAdmin?: boolean;
}

export function ReportsPage({ responses, isAdmin }: ReportsPageProps) {
  const summary = getKpiSummary(responses);
  const questionRows = questionPerformance(responses).slice(0, 5);
  const surveyRows = averageBySurveyType(responses);

  return (
    <div className="space-y-5">
      <section className="grid gap-4 md:grid-cols-3">
        <ReportCard
          title="Summary Report"
          detail={`${responses.length} responses, ${formatNumber(summary.averageRating)} average rating`}
          icon={FileBarChart}
          isAdmin={isAdmin}
        />
        <ReportCard title="Question Report" detail={`${questionRows.length} ranked question groups`} icon={FileSpreadsheet} isAdmin={isAdmin} />
        <ReportCard title="Survey Report" detail="Contractor, Supplier, and Subcontractor comparison" icon={Printer} isAdmin={isAdmin} />
      </section>

      <section className="panel">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-base font-semibold">Executive Summary</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Prototype report view for stakeholder briefings.</p>
          </div>
          <div className="flex gap-2">
            {isAdmin ? (
              <>
                <button className="primary-button" type="button">
                  <Download size={16} />
                  Export PDF
                </button>
                <button className="secondary-button" type="button">
                  <Download size={16} />
                  Export CSV
                </button>
              </>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 bg-amber-50 border border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30 px-3 py-2 rounded-lg">
                ⚠️ Exporting restricted to Admin
              </span>
            )}
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
            <h4 className="font-semibold">Question Highlights</h4>
            <div className="mt-3 space-y-3">
              {questionRows.map((row) => (
                <div key={row.question} className="flex items-center justify-between gap-4 text-sm">
                  <span className="text-slate-600 dark:text-slate-300">{row.question}</span>
                  <span className="badge">{formatNumber(row.average)}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
            <h4 className="font-semibold">Survey Summary</h4>
            <div className="mt-3 space-y-3">
              {surveyRows.map((row) => (
                <div key={row.surveyType} className="flex items-center justify-between gap-4 text-sm">
                  <span className="text-slate-600 dark:text-slate-300">{row.surveyType}</span>
                  <span className="text-slate-500 dark:text-slate-400">{row.responses} responses, {formatNumber(row.average)} avg</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function ReportCard({ title, detail, icon: Icon, isAdmin }: { title: string; detail: string; icon: typeof FileBarChart; isAdmin?: boolean }) {
  return (
    <article className="panel">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-azure dark:bg-blue-950/60">
        <Icon size={20} />
      </div>
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{detail}</p>
      {isAdmin ? (
        <button className="mt-4 ghost-button" type="button">
          <Download size={15} />
          Export
        </button>
      ) : (
        <p className="mt-4 text-[11px] font-bold text-slate-400 select-none">⚠️ Export restricted</p>
      )}
    </article>
  );
}
