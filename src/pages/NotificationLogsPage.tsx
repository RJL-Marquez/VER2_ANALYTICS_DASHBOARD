import { useMemo, useState } from 'react';
import { Bell, Inbox, Search } from 'lucide-react';
import { ResponseNotification, SurveyType } from '../types/survey';
import { formatLogDate, formatLogTime, formatRelativeTime } from '../utils/time';
import { StateMessage } from '../components/StateMessage';

interface NotificationLogsPageProps {
  notifications: ResponseNotification[];
  unreadCount: number;
}

const surveyTypeOptions: Array<'All' | SurveyType> = ['All', 'Contractor', 'Supplier', 'Subcontractor'];

const surveyTypeColors: Record<SurveyType, string> = {
  Contractor: '#2563eb',
  Supplier: '#0f9f6e',
  Subcontractor: '#7c3aed',
};

export function NotificationLogsPage({ notifications, unreadCount }: NotificationLogsPageProps) {
  const [surveyType, setSurveyType] = useState<'All' | SurveyType>('All');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [search, setSearch] = useState('');

  // The bell keeps unread items at the front of the list, so the first `unreadCount`
  // entries are the ones the user hasn't seen in the panel yet.
  const enriched = useMemo(
    () => notifications.map((item, index) => ({ ...item, isNew: index < unreadCount })),
    [notifications, unreadCount],
  );

  const filtered = useMemo(() => {
    return enriched.filter((item) => {
      if (surveyType !== 'All' && item.surveyType !== surveyType) return false;

      if (dateFrom && item.submissionDate < dateFrom) return false;
      if (dateTo) {
        const endOfDay = `${dateTo}T23:59:59`;
        if (item.submissionDate > endOfDay) return false;
      }

      if (search.trim()) {
        const needle = search.trim().toLowerCase();
        const haystack = `${item.company} ${item.respondentType} ${item.surveyType}`.toLowerCase();
        if (!haystack.includes(needle)) return false;
      }

      return true;
    });
  }, [enriched, surveyType, dateFrom, dateTo, search]);

  const todayCount = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return notifications.filter((item) => item.submissionDate.slice(0, 10) === today).length;
  }, [notifications]);

  return (
    <div className="space-y-5">
      <section className="grid gap-4 sm:grid-cols-3">
        <SummaryCard label="Total logged" value={notifications.length} icon={Bell} />
        <SummaryCard label="Unread" value={unreadCount} icon={Bell} accent="rose" />
        <SummaryCard label="Today" value={todayCount} icon={Bell} accent="green" />
      </section>

      <section className="panel">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-base font-semibold">Activity log</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Every survey submission received, with the date, time, and details of each response.
            </p>
          </div>
          <div className="segmented-control">
            {surveyTypeOptions.map((option) => (
              <button
                key={option}
                type="button"
                className={surveyType === option ? 'segmented-active' : ''}
                onClick={() => setSurveyType(option)}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-5 grid gap-3 sm:grid-cols-3">
          <label className="field-label">
            From
            <input className="field" type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
          </label>
          <label className="field-label">
            To
            <input className="field" type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
          </label>
          <label className="field-label">
            Search
            <div className="mt-1 flex items-center gap-2.5 rounded-lg border border-slate-200 bg-white pl-3 pr-3 transition focus-within:border-azure focus-within:ring-2 focus-within:ring-blue-100 dark:border-slate-800 dark:bg-slate-900 dark:focus-within:ring-blue-950">
              <Search size={16} className="shrink-0 text-[#0063a9] dark:text-blue-300" />
              <span className="h-5 w-px shrink-0 bg-slate-200 dark:bg-slate-700" />
              <input
                className="w-full bg-transparent py-2 text-sm text-ink outline-none placeholder:text-slate-400 dark:text-slate-100"
                placeholder="Company or respondent..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
          </label>
        </div>

        {filtered.length === 0 ? (
          <StateMessage
            title="No notifications found"
            message={
              notifications.length === 0
                ? 'No survey responses have been logged yet.'
                : 'Try adjusting the filters or search to find what you\u2019re looking for.'
            }
          />
        ) : (
          <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
            <table className="w-full min-w-[720px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-400">
                  <th className="px-4 py-3">Company</th>
                  <th className="px-4 py-3">Survey Type</th>
                  <th className="px-4 py-3">Respondent</th>
                  <th className="px-4 py-3">Questions Answered</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Time</th>
                  <th className="px-4 py-3 text-right">Received</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map((item) => (
                  <tr key={item.id} className="align-middle">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {item.isNew && <span className="h-2 w-2 shrink-0 rounded-full bg-rose-500" title="New" />}
                        <span className="font-medium text-slate-800 dark:text-slate-100">{item.company}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                        <span
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{ backgroundColor: surveyTypeColors[item.surveyType] }}
                        />
                        {item.surveyType}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{item.respondentType}</td>
                    <td className="px-4 py-3">
                      <span className="badge">{item.questionCount}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{formatLogDate(item.submissionDate)}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{formatLogTime(item.submissionDate)}</td>
                    <td className="px-4 py-3 text-right text-xs text-slate-400 dark:text-slate-500">
                      {formatRelativeTime(item.submissionDate)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {notifications.length > 0 && (
          <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">
            Showing {filtered.length} of {notifications.length} logged notifications.
          </p>
        )}
      </section>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon: Icon,
  accent = 'blue',
}: {
  label: string;
  value: number;
  icon: typeof Bell;
  accent?: 'blue' | 'rose' | 'green';
}) {
  const accentClasses = {
    blue: 'bg-blue-50 text-azure dark:bg-blue-950/60',
    rose: 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-300',
    green: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300',
  }[accent];

  return (
    <article className="panel flex items-center gap-4">
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${accentClasses}`}>
        {value === 0 ? <Inbox size={20} /> : <Icon size={20} />}
      </div>
      <div>
        <p className="text-2xl font-bold leading-none">{value}</p>
        <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
      </div>
    </article>
  );
}
