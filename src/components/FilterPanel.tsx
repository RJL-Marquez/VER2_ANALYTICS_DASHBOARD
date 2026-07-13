import { useMemo } from 'react';
import { RotateCcw } from 'lucide-react';
import { FilterState, QuestionDefinition, Rating } from '../types/survey';

interface FilterPanelProps {
  filters: FilterState;
  questions: QuestionDefinition[];
  companies: string[];
  onChange: (filters: FilterState) => void;
  onReset: () => void;
}

const ratings: Array<'All' | Rating> = ['All', 0, 1, 2, 3, 4, 'N/A'];

export function FilterPanel({ filters, questions, companies, onChange, onReset }: FilterPanelProps) {
  const update = <Key extends keyof FilterState>(key: Key, value: FilterState[Key]) => onChange({ ...filters, [key]: value });

  const filteredQuestions = useMemo(() => {
    if (filters.surveyType === 'All') return questions;
    return questions.filter((question) => question.surveyTypes.includes(filters.surveyType));
  }, [questions, filters.surveyType]);

  return (
    <section className="panel sticky top-24">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-semibold">Filters</h3>
        <button className="ghost-button" type="button" onClick={onReset}>
          <RotateCcw size={15} />
          Reset
        </button>
      </div>
      <div className="space-y-4">
        <label className="field-label">
          Survey Type
          <select className="field" value={filters.surveyType} onChange={(event) => update('surveyType', event.target.value as FilterState['surveyType'])}>
            <option>All</option>
            <option>Contractor</option>
            <option>Supplier</option>
            <option>Subcontractor</option>
          </select>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="field-label">
            From
            <input className="field" type="date" value={filters.dateFrom} onChange={(event) => update('dateFrom', event.target.value)} />
          </label>
          <label className="field-label">
            To
            <input className="field" type="date" value={filters.dateTo} onChange={(event) => update('dateTo', event.target.value)} />
          </label>
        </div>
        <label className="field-label">
          Question
          <select className="field" value={filters.questionId} onChange={(event) => update('questionId', event.target.value)}>
            <option value="">All questions</option>
            {filteredQuestions.map((question) => (
              <option key={question.questionId} value={question.questionId}>
                {question.questionId} - {question.questionCategory}
              </option>
            ))}
          </select>
        </label>
        <label className="field-label">
          Rating
          <select className="field" value={String(filters.rating)} onChange={(event) => update('rating', event.target.value === 'All' ? 'All' : event.target.value === 'N/A' ? 'N/A' : Number(event.target.value) as Rating)}>
            {ratings.map((rating) => (
              <option key={String(rating)} value={String(rating)}>
                {rating}
              </option>
            ))}
          </select>
        </label>
        <label className="field-label">
          Company
          <select className="field" value={filters.company} onChange={(event) => update('company', event.target.value)}>
            <option value="">All companies</option>
            {companies.map((company) => (
              <option key={company}>{company}</option>
            ))}
          </select>
        </label>
        <label className="field-label">
          Search
          <input className="field" placeholder="Company, comment, question..." value={filters.search} onChange={(event) => update('search', event.target.value)} />
        </label>
      </div>
    </section>
  );
}
