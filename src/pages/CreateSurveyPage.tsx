import { useState } from 'react';
import { Plus, Trash, ArrowLeft, Save, AlertCircle, FileText, Sparkles } from 'lucide-react';
import { SurveyType, CustomForm } from '../types/survey';

interface CreateSurveyPageProps {
  onBack: () => void;
  onSave: (survey: Omit<CustomForm, 'id' | 'createdAt'>) => void;
}

const CATEGORIES = [
  'Delivery',
  'Commercial',
  'Technology',
  'Support',
  'Communication',
  'Operations',
  'Compliance',
  'Security',
];

interface QuestionInput {
  question: string;
  questionCategory: string;
}

export function CreateSurveyPage({ onBack, onSave }: CreateSurveyPageProps) {
  const [title, setTitle] = useState('');
  const [surveyType, setSurveyType] = useState<SurveyType>('Contractor');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState<QuestionInput[]>([
    { question: '', questionCategory: 'Delivery' },
  ]);
  const [error, setError] = useState('');

  const handleAddQuestion = () => {
    setQuestions([...questions, { question: '', questionCategory: 'Delivery' }]);
  };

  const handleRemoveQuestion = (index: number) => {
    if (questions.length === 1) {
      setError('A survey must have at least one question.');
      return;
    }
    const next = [...questions];
    next.splice(index, 1);
    setQuestions(next);
    setError('');
  };

  const handleQuestionChange = (index: number, value: string) => {
    const next = [...questions];
    next[index].question = value;
    setQuestions(next);
  };

  const handleCategoryChange = (index: number, value: string) => {
    const next = [...questions];
    next[index].questionCategory = value;
    setQuestions(next);
  };

  const handlePrefillTemplate = () => {
    let template: QuestionInput[] = [];
    if (surveyType === 'Contractor') {
      template = [
        { question: 'Does the courier deliver goods on the agreed date?', questionCategory: 'Delivery' },
        { question: 'Are the logistics rates competitive and transparent?', questionCategory: 'Commercial' },
        { question: 'Is real-time tracking of packages responsive?', questionCategory: 'Technology' },
        { question: 'Is customer support helpful when resolving package delays?', questionCategory: 'Support' },
      ];
    } else if (surveyType === 'Supplier') {
      template = [
        { question: 'Does the supplier deliver the product based on agreed schedule?', questionCategory: 'Delivery' },
        { question: 'Is the pricing competitive compared to other suppliers?', questionCategory: 'Commercial' },
        { question: 'Is the supplier open and responsive to negotiate terms?', questionCategory: 'Communication' },
        { question: 'Are the products delivered in excellent condition with no defects?', questionCategory: 'Operations' },
      ];
    } else {
      template = [
        { question: 'Tasks and deliverables were completed on schedule.', questionCategory: 'Delivery' },
        { question: 'Offers competitive prices and discounts for additional work requests.', questionCategory: 'Commercial' },
        { question: 'The subcontractor communicated delays and project changes promptly.', questionCategory: 'Communication' },
        { question: 'Site work strictly complied with safety and quality regulations.', questionCategory: 'Operations' },
      ];
    }
    setQuestions(template);
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Please provide a survey title.');
      return;
    }

    if (questions.some((q) => !q.question.trim())) {
      setError('All questions must contain text. Please fill or remove empty questions.');
      return;
    }

    const formattedQuestions = questions.map((q, idx) => ({
      questionId: `Q-CUST-${Date.now()}-${idx + 1}`,
      questionNumber: idx + 1,
      question: q.question.trim(),
      questionCategory: q.questionCategory,
    }));

    onSave({
      title: title.trim(),
      surveyType,
      description: description.trim() || `Custom survey for ${surveyType} stakeholders.`,
      questions: formattedQuestions,
    });
  };

  return (
    <div className="panel space-y-6" id="create-survey-page">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
        <button
          onClick={onBack}
          className="secondary-button"
          type="button"
          id="btn-back-to-surveys"
        >
          <ArrowLeft size={16} />
          <span>Back</span>
        </button>
        <div className="text-right">
          <span className="badge">Form Builder Mode</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-rose-50 border border-rose-200 p-3 text-sm text-rose dark:bg-rose-950/30 dark:border-rose-900">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid gap-5 md:grid-cols-3">
          <div className="md:col-span-2 space-y-4">
            <div>
              <label htmlFor="survey-title" className="field-label">Survey Title *</label>
              <input
                id="survey-title"
                type="text"
                className="field"
                placeholder="e.g. Q3 Logistics & Courier Experience Feedback"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div>
              <label htmlFor="survey-desc" className="field-label">Description / Instructions</label>
              <textarea
                id="survey-desc"
                className="field min-h-20 max-h-40"
                placeholder="Describe the purpose of this survey to respondents..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-900/50 space-y-4">
            <div>
              <label htmlFor="survey-type" className="field-label">Survey Type (Audience) *</label>
              <select
                id="survey-type"
                className="field"
                value={surveyType}
                onChange={(e) => setSurveyType(e.target.value as SurveyType)}
              >
                <option value="Contractor">Contractor (Courier/Logistics)</option>
                <option value="Supplier">Supplier (Goods/Materials)</option>
                <option value="Subcontractor">Subcontractor (On-Site/Execution)</option>
              </select>
            </div>

            <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={handlePrefillTemplate}
                className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-blue-50 hover:bg-blue-100 text-[#0063a9] px-3 py-2 text-xs font-semibold dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-900/50 transition"
              >
                <Sparkles size={13} />
                <span>Pre-fill Standard Questions</span>
              </button>
              <p className="text-[10px] text-slate-400 mt-1.5 text-center">
                Quickly populate standard benchmark questions for this audience.
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-6 dark:border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <FileText size={18} className="text-[#0063a9] dark:text-blue-400" />
              <span>Survey Questions ({questions.length})</span>
            </h3>
            <button
              type="button"
              onClick={handleAddQuestion}
              className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-blue-400/50 hover:border-[#0063a9] hover:bg-blue-50 text-[#0063a9] px-3 py-1.5 text-xs font-semibold dark:hover:bg-blue-950/40 dark:text-blue-300 transition"
              id="btn-add-question"
            >
              <Plus size={14} />
              <span>Add Question</span>
            </button>
          </div>

          <div className="space-y-4">
            {questions.map((q, idx) => (
              <div
                key={idx}
                className="group relative flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/40 md:flex-row md:items-center"
              >
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                  {idx + 1}
                </div>

                <div className="flex-1">
                  <input
                    type="text"
                    className="field mt-0"
                    placeholder="Enter question text (e.g. Does the service provider maintain standard quality over time?)"
                    value={q.question}
                    onChange={(e) => handleQuestionChange(idx, e.target.value)}
                    required
                  />
                </div>

                <div className="w-full md:w-48 shrink-0">
                  <select
                    className="field mt-0"
                    value={q.questionCategory}
                    onChange={(e) => handleCategoryChange(idx, e.target.value)}
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveQuestion(idx)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 md:opacity-0 group-hover:opacity-100 transition duration-200 cursor-pointer self-end md:self-auto"
                  title="Remove question"
                >
                  <Trash size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-5 dark:border-slate-800">
          <button
            onClick={onBack}
            className="secondary-button"
            type="button"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="primary-button bg-[#0063a9] hover:bg-[#00528c]"
            id="btn-save-survey"
          >
            <Save size={16} />
            <span>Create and Publish Form</span>
          </button>
        </div>
      </form>
    </div>
  );
}
