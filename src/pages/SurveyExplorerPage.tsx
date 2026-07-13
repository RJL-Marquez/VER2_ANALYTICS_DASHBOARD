import { ResponseTable } from '../components/ResponseTable';
import { StateMessage } from '../components/StateMessage';
import { SurveyResponse } from '../types/survey';

interface SurveyExplorerPageProps {
  responses: SurveyResponse[];
}

export function SurveyExplorerPage({ responses }: SurveyExplorerPageProps) {
  if (!responses.length) {
    return <StateMessage title="No records found" message="The current search and filters returned no SharePoint list items." />;
  }

  return (
    <div className="space-y-5">
      <section className="panel">
        <h3 className="text-base font-semibold">Survey Explorer</h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Inspect individual response records from Contractor, Supplier, and Subcontractor surveys.
        </p>
      </section>
      <ResponseTable responses={responses} />
    </div>
  );
}
