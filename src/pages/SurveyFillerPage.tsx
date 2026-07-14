import { useState, useMemo, useEffect } from 'react';
import { CheckCircle, Info, Shield, ArrowRight, ClipboardCopy, Send, UserCheck, MessageSquare } from 'lucide-react';
import { CustomForm, Rating, PartnerCompany } from '../types/survey';
<<<<<<< HEAD
import { isValidDDMMYYYY } from '../utils/time';
=======
>>>>>>> dd3d86aebfcefa969b5ece6322fec478a426523b

interface SurveyFillerPageProps {
  surveys: CustomForm[];
  partnerCompanies: PartnerCompany[];
  initialSurveyId?: string | null;
  onSubmitted: (
    surveyId: string,
    company: string,
    department: string,
    respondentType: string,
<<<<<<< HEAD
    address: string | undefined,
=======
>>>>>>> dd3d86aebfcefa969b5ece6322fec478a426523b
    answers: { questionId: string; questionNumber: number; question: string; questionCategory: string; rating: Rating; comment: string }[]
  ) => void;
  onCancel?: () => void;
}

<<<<<<< HEAD
const DEPARTMENTS = [
  'Accounts Payable - Trade',
  'Business Solutions Manager',
  'Logistics',
  'Procurement Group',
  'TASS'
];

const RESPONDENT_TYPES = [
  'Rank & File',
  'Supervisory',
  'Managerial',
  'Director',
  'Executive'
];
=======
const DEPARTMENTS = ['Procurement', 'Operations', 'Facilities', 'Finance', 'Project Delivery', 'Compliance'];
const RESPONDENT_TYPES = ['Project Manager', 'Account Lead', 'Site Supervisor', 'Coordinator', 'Commercial Contact'];
>>>>>>> dd3d86aebfcefa969b5ece6322fec478a426523b

export function SurveyFillerPage({ surveys, partnerCompanies = [], initialSurveyId, onSubmitted, onCancel }: SurveyFillerPageProps) {
  const [selectedSurveyId, setSelectedSurveyId] = useState<string>(initialSurveyId || (surveys[0]?.id ?? ''));
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Info, 2: Questions, 3: Success

  // Respondent metadata
  const [company, setCompany] = useState('');
<<<<<<< HEAD
  const [department, setDepartment] = useState(DEPARTMENTS[0]);
  const [respondentType, setRespondentType] = useState(RESPONDENT_TYPES[0]);
  const [address, setAddress] = useState('');
  const [periodCovered, setPeriodCovered] = useState('1st Half');

  // Answers state
  const [ratings, setRatings] = useState<Record<string, any>>({});
  const [comments, setComments] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
=======
  const [department, setDepartment] = useState('Procurement');
  const [respondentType, setRespondentType] = useState('Project Manager');

  // Answers state
  const [ratings, setRatings] = useState<Record<string, Rating>>({});
  const [comments, setComments] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
>>>>>>> dd3d86aebfcefa969b5ece6322fec478a426523b

  const activeSurvey = surveys.find((s) => s.id === selectedSurveyId);

  // Filter registered partner companies that match the selected survey type
  const matchingCompanies = useMemo(() => {
    if (!activeSurvey) return [];
    return partnerCompanies.filter((c) => c.type === activeSurvey.surveyType);
  }, [partnerCompanies, activeSurvey]);

  // Sync company with selected survey type
  useEffect(() => {
    if (matchingCompanies.length > 0) {
      setCompany(matchingCompanies[0].name);
    } else {
      setCompany('');
    }
  }, [matchingCompanies]);

  const handleStartForm = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!company.trim()) {
      setError('Please provide your organization or company name.');
      return;
    }

    if (!selectedSurveyId) {
      setError('Please select a survey form to respond to.');
      return;
    }

    // Initialize answer state for this survey's questions
<<<<<<< HEAD
    const initialRatings: Record<string, any> = {};
    const initialComments: Record<string, string> = {};
    const defaultVal = activeSurvey?.maxRating !== undefined ? activeSurvey.maxRating : 4;
    activeSurvey?.questions.forEach((q) => {
      if (q.question === 'Period Covered') {
        initialRatings[q.questionId] = periodCovered;
      } else if (q.inputType === 'checkbox') {
        initialRatings[q.questionId] = [];
      } else if (q.inputType === 'matrix') {
        initialRatings[q.questionId] = {};
      } else if (q.inputType === 'date-range') {
        initialRatings[q.questionId] = { from: '', to: '' };
      } else if (q.inputType === 'text' || q.inputType === 'select' || q.inputType === 'typed-rating') {
        initialRatings[q.questionId] = '';
      } else {
        initialRatings[q.questionId] = defaultVal; // default to maximum scale value
      }
=======
    const initialRatings: Record<string, Rating> = {};
    const initialComments: Record<string, string> = {};
    activeSurvey?.questions.forEach((q) => {
      initialRatings[q.questionId] = 4; // default to 4 (excellent) or let them click
>>>>>>> dd3d86aebfcefa969b5ece6322fec478a426523b
      initialComments[q.questionId] = '';
    });
    setRatings(initialRatings);
    setComments(initialComments);
<<<<<<< HEAD
    setValidationErrors({});
=======
>>>>>>> dd3d86aebfcefa969b5ece6322fec478a426523b

    setStep(2);
  };

<<<<<<< HEAD
  const handleRatingChange = (qId: string, value: any) => {
    setRatings((prev) => ({ ...prev, [qId]: value }));
  };

  const handleMatrixRatingChange = (qId: string, subId: string, value: any) => {
    setRatings((prev) => ({
      ...prev,
      [qId]: { ...prev[qId], [subId]: value }
    }));
  };

  const handleCheckboxChange = (qId: string, option: string, checked: boolean) => {
    setRatings((prev) => {
      const current = Array.isArray(prev[qId]) ? prev[qId] : [];
      if (checked) {
        return { ...prev, [qId]: [...current, option] };
      } else {
        return { ...prev, [qId]: current.filter((item: string) => item !== option) };
      }
    });
  };

  const handleDateRangeChange = (qId: string, field: 'from' | 'to', value: string) => {
    setRatings((prev) => ({
      ...prev,
      [qId]: { ...prev[qId], [field]: value }
    }));

    // Live strict validation: dd/mm/yyyy only, and must be a real calendar date.
    // This catches spammed/random input (letters, malformed digits, impossible dates) immediately.
    if (!value.trim()) {
      setValidationErrors((prev) => {
        const copy = { ...prev };
        delete copy[qId];
        return copy;
      });
      return;
    }

    if (!isValidDDMMYYYY(value)) {
      setValidationErrors((prev) => ({
        ...prev,
        [qId]: 'Enter valid dates in dd/mm/yyyy format (e.g. 05/03/2026).'
      }));
    } else {
      setValidationErrors((prev) => {
        const copy = { ...prev };
        delete copy[qId];
        return copy;
      });
    }
  };

=======
  const handleRatingChange = (qId: string, value: Rating) => {
    setRatings((prev) => ({ ...prev, [qId]: value }));
  };

>>>>>>> dd3d86aebfcefa969b5ece6322fec478a426523b
  const handleCommentChange = (qId: string, value: string) => {
    setComments((prev) => ({ ...prev, [qId]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSurvey) return;

<<<<<<< HEAD
    // Validate form inputs
    const errors: Record<string, string> = {};
    activeSurvey.questions.forEach((q) => {
      const val = ratings[q.questionId];
      const valStr = val !== undefined ? val.toString().trim() : '';

      if (q.inputType === 'select') {
        if (!valStr) {
          errors[q.questionId] = 'This field is required. Please select an option from the dropdown.';
        }
      } else if (q.inputType === 'checkbox') {
        if (!Array.isArray(val) || val.length === 0) {
          errors[q.questionId] = 'This field is required. Please select at least one option.';
        }
      } else if (q.inputType === 'date-range') {
        if (!val || !val.from || !val.to) {
          errors[q.questionId] = 'This field is required. Please specify both dates.';
        } else if (!isValidDDMMYYYY(val.from) || !isValidDDMMYYYY(val.to)) {
          errors[q.questionId] = 'Enter valid dates in dd/mm/yyyy format (e.g. 05/03/2026).';
        }
      } else if (q.inputType === 'matrix') {
        q.subQuestions?.forEach(sub => {
           const subVal = val?.[sub.id];
           if (subVal === undefined || subVal === '') {
             errors[q.questionId] = 'Please answer all sub-questions in this section.';
           }
        });
      } else if (q.inputType === 'text') {
        if (!valStr) {
          errors[q.questionId] = 'This field is required. Please enter your answer.';
        }
      } else if (q.inputType === 'typed-rating') {
        if (!valStr) {
          errors[q.questionId] = 'This field is required. Please type a rating score or "N/A".';
        } else if (valStr.toUpperCase() === 'N/A') {
          // valid
        } else {
          const num = Number(valStr);
          const min = q.validationRange?.min ?? 0;
          const max = q.validationRange?.max ?? 5;
          if (isNaN(num) || !Number.isInteger(num) || num < min || num > max) {
            errors[q.questionId] = `Invalid input. Must be "N/A" or a whole number between ${min} and ${max}.`;
          }
        }
      }
    });

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setError('Please resolve the invalid or missing answers highlighted in red below.');
      
      // Smooth scroll to the first question with an error
      setTimeout(() => {
        const firstErrorId = Object.keys(errors)[0];
        const element = document.getElementById(`q-container-${firstErrorId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
      return;
    }

    setError('');
    setValidationErrors({});

    const defaultVal = activeSurvey.maxRating !== undefined ? activeSurvey.maxRating : 4;
    const formattedAnswers = activeSurvey.questions.flatMap((q) => {
      const val = ratings[q.questionId];
      let finalComment = comments[q.questionId]?.trim() || '';

      if (q.inputType === 'matrix' && q.subQuestions) {
        return q.subQuestions.map((sub, idx) => {
          const subVal = val?.[sub.id] !== undefined ? val[sub.id].toString().trim() : '';
          let ratingVal: Rating = 'N/A';
          if (subVal.toUpperCase() === 'N/A') {
            ratingVal = 'N/A';
          } else {
            ratingVal = parseInt(subVal, 10);
            if (isNaN(ratingVal)) ratingVal = 'N/A';
          }
          return {
            questionId: `${q.questionId}-${sub.id}`,
            questionNumber: q.questionNumber + (idx * 0.1),
            question: `${q.question} - ${sub.label}`,
            questionCategory: q.questionCategory,
            rating: ratingVal,
            comment: finalComment,
          };
        });
      }

      let ratingVal: Rating = 'N/A';
      const valStr = val !== undefined && val !== null ? val.toString().trim() : '';

      if (q.inputType === 'typed-rating') {
        if (valStr.toUpperCase() === 'N/A') {
          ratingVal = 'N/A';
        } else {
          ratingVal = parseInt(valStr, 10);
        }
      } else if (q.inputType === 'select' || q.inputType === 'text') {
        ratingVal = 'N/A';
        finalComment = valStr + (finalComment ? ` | Comment detail: ${finalComment}` : '');
      } else if (q.inputType === 'checkbox') {
        ratingVal = 'N/A';
        const joined = Array.isArray(val) ? val.join(', ') : valStr;
        finalComment = joined + (finalComment ? ` | Comment detail: ${finalComment}` : '');
      } else if (q.inputType === 'date-range') {
        ratingVal = 'N/A';
        const fromStr = val?.from || '';
        const toStr = val?.to || '';
        const drStr = `From: ${fromStr} To: ${toStr}`;
        finalComment = drStr + (finalComment ? ` | Comment detail: ${finalComment}` : '');
      } else {
        ratingVal = typeof ratings[q.questionId] === 'number' ? ratings[q.questionId] : defaultVal;
      }

      return [{
        questionId: q.questionId,
        questionNumber: q.questionNumber,
        question: q.question,
        questionCategory: q.questionCategory,
        rating: ratingVal,
        comment: finalComment,
      }];
    });
=======
    const formattedAnswers = activeSurvey.questions.map((q) => ({
      questionId: q.questionId,
      questionNumber: q.questionNumber,
      question: q.question,
      questionCategory: q.questionCategory,
      rating: ratings[q.questionId] ?? 4,
      comment: comments[q.questionId]?.trim() || '',
    }));
>>>>>>> dd3d86aebfcefa969b5ece6322fec478a426523b

    onSubmitted(
      selectedSurveyId,
      company.trim(),
      department,
      respondentType,
<<<<<<< HEAD
      address.trim(),
=======
>>>>>>> dd3d86aebfcefa969b5ece6322fec478a426523b
      formattedAnswers
    );

    setStep(3);
  };

  const handleReset = () => {
    setCompany('');
<<<<<<< HEAD
    setDepartment(DEPARTMENTS[0]);
    setRespondentType(RESPONDENT_TYPES[0]);
    setAddress('');
    setPeriodCovered('1st Half');
    setRatings({});
    setComments({});
    setValidationErrors({});
    setError('');
=======
    setDepartment('Procurement');
    setRespondentType('Project Manager');
    setRatings({});
    setComments({});
>>>>>>> dd3d86aebfcefa969b5ece6322fec478a426523b
    setStep(1);
  };

  if (!activeSurvey && surveys.length === 0) {
    return (
      <div className="panel max-w-2xl mx-auto p-12 text-center" id="survey-filler-empty">
        <Info size={40} className="mx-auto text-amber-500 mb-4" />
        <h3 className="text-xl font-bold">No Surveys Available</h3>
        <p className="text-slate-500 dark:text-slate-400 mt-2">There are currently no published survey forms inside the system.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6" id="survey-filler-container">
      {/* Step Progress bar */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold">
          <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${step >= 1 ? 'bg-[#0063a9] text-white' : 'bg-slate-200 text-slate-500'}`}>1</span>
          <span className={step >= 1 ? 'text-slate-900 dark:text-white font-bold' : 'text-slate-400'}>Respondent Info</span>
        </div>
        <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1 mx-4" />
        <div className="flex items-center gap-1.5 text-xs font-semibold">
          <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${step >= 2 ? 'bg-[#0063a9] text-white' : 'bg-slate-200 text-slate-500'}`}>2</span>
          <span className={step >= 2 ? 'text-slate-900 dark:text-white font-bold' : 'text-slate-400'}>Questions Form</span>
        </div>
        <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1 mx-4" />
        <div className="flex items-center gap-1.5 text-xs font-semibold">
          <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${step >= 3 ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'}`}>3</span>
          <span className={step >= 3 ? 'text-emerald-600 font-bold' : 'text-slate-400'}>Success</span>
        </div>
      </div>

      {step === 1 && (
        <div className="panel p-6 sm:p-10 space-y-6" id="survey-filler-step-1">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <p className="text-[10px] uppercase tracking-widest text-[#0063a9] font-bold dark:text-blue-300">Microsoft Forms Ingress</p>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Stakeholder Feedback Form</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Provide your details and complete the official MBS stakeholder evaluation survey. Your feedback directly impacts operations.
            </p>
          </div>

          {error && (
            <div className="rounded-lg bg-rose-50 border border-rose-200 px-4 py-2.5 text-sm text-rose dark:bg-rose-950/30 dark:border-rose-900 flex items-center gap-2">
              <Info size={16} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleStartForm} className="space-y-5 border-t border-slate-100 pt-6 dark:border-slate-800">
<<<<<<< HEAD
            <div className="bg-[#0063a9]/10 text-[#0063a9] dark:bg-blue-950/40 dark:text-blue-300 font-bold px-4 py-2.5 rounded-lg text-sm uppercase tracking-wider border border-[#0063a9]/10 shadow-xs mb-6">
              Section 1: Details
            </div>

            <div className="grid gap-4 sm:grid-cols-2 mb-5">
              <div>
                <label htmlFor="filler-dept" className="field-label">Associated Department</label>
                <select
                  id="filler-dept"
                  className="field"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                >
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="filler-role" className="field-label">Designation</label>
                <select
                  id="filler-role"
                  className="field"
                  value={respondentType}
                  onChange={(e) => setRespondentType(e.target.value)}
                >
                  {RESPONDENT_TYPES.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>
=======
            <div>
              <label htmlFor="survey-select" className="field-label">Select Survey Form *</label>
              <select
                id="survey-select"
                className="field"
                value={selectedSurveyId}
                onChange={(e) => setSelectedSurveyId(e.target.value)}
              >
                {surveys.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title} ({s.surveyType})
                  </option>
                ))}
              </select>
              {activeSurvey && (
                <p className="text-xs text-slate-400 mt-1 italic">
                  {activeSurvey.description}
                </p>
              )}
>>>>>>> dd3d86aebfcefa969b5ece6322fec478a426523b
            </div>

            <div>
              <label htmlFor="filler-company" className="field-label">Select Partner Company to Evaluate *</label>
              {matchingCompanies.length > 0 ? (
                <select
                  id="filler-company"
                  className="field text-xs font-semibold"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  required
                >
                  <option value="">-- Choose registered partner --</option>
                  {matchingCompanies.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name} {c.affiliation ? `(${c.affiliation})` : ''}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  id="filler-company"
                  type="text"
                  className="field"
                  placeholder="e.g. Apex Buildworks Co."
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  required
                />
              )}
            </div>

<<<<<<< HEAD
            <div>
              <label htmlFor="filler-address" className="field-label">Address</label>
              <input
                id="filler-address"
                type="text"
                className="field"
                placeholder="Enter Company Address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>

            {activeSurvey && (activeSurvey.surveyType === 'Contractor' || activeSurvey.surveyType === 'Supplier') && (
              <div>
                <label htmlFor="filler-period" className="field-label">Period Covered</label>
                <select
                  id="filler-period"
                  className="field"
                  value={periodCovered}
                  onChange={(e) => setPeriodCovered(e.target.value)}
                >
                  <option value="1st Half">1st Half</option>
                  <option value="2nd Half">2nd Half</option>
                  <option value="Annual">Annual</option>
                </select>
              </div>
            )}
=======
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="filler-dept" className="field-label">Associated Department</label>
                <select
                  id="filler-dept"
                  className="field"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                >
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="filler-role" className="field-label">Respondent Job Role</label>
                <select
                  id="filler-role"
                  className="field"
                  value={respondentType}
                  onChange={(e) => setRespondentType(e.target.value)}
                >
                  {RESPONDENT_TYPES.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>
            </div>
>>>>>>> dd3d86aebfcefa969b5ece6322fec478a426523b

            <div className="flex items-center justify-between border-t border-slate-100 pt-5 dark:border-slate-800">
              {onCancel ? (
                <button
                  type="button"
                  onClick={onCancel}
                  className="secondary-button"
                >
                  Cancel
                </button>
              ) : (
                <div />
              )}
              <button
                type="submit"
                className="primary-button bg-[#0063a9] hover:bg-[#00528c]"
                id="btn-filler-next"
              >
                <span>Proceed to Form Questions</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </form>
        </div>
      )}

      {step === 2 && activeSurvey && (
        <form onSubmit={handleSubmit} className="space-y-6" id="survey-filler-step-2">
          {/* Form Header Info card */}
          <div className="panel bg-[#0063a9]/5 border-blue-100 dark:border-blue-900/30">
            <h3 className="text-lg font-bold text-[#0063a9] dark:text-blue-300">{activeSurvey.title}</h3>
            <p className="text-xs text-slate-500 mt-1 dark:text-slate-400">{activeSurvey.description}</p>
            <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-slate-500 dark:text-slate-400 pt-3 border-t border-blue-400/10">
              <div>
                Company: <strong className="text-slate-700 dark:text-slate-200">{company}</strong>
              </div>
              <div className="hidden sm:inline text-slate-300">|</div>
              <div>
                Department: <strong className="text-slate-700 dark:text-slate-200">{department}</strong>
              </div>
              <div className="hidden sm:inline text-slate-300">|</div>
              <div>
                Role: <strong className="text-slate-700 dark:text-slate-200">{respondentType}</strong>
              </div>
            </div>
          </div>

<<<<<<< HEAD
          {error && (
            <div className="rounded-lg bg-rose-50 border border-rose-200 px-4 py-2.5 text-sm text-rose dark:bg-rose-950/30 dark:border-rose-900 flex items-center gap-2">
              <Info size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Form questions list */}
          <div className="space-y-5">
            {(() => {
              let currentSection = '';
              const questionsToRender = activeSurvey.questions.filter(q => q.question !== 'Period Covered');
              return questionsToRender.map((q, idx) => {
                const showSectionHeader = q.section && q.section !== currentSection;
                if (showSectionHeader) {
                  currentSection = q.section!;
                }

                const maxVal = activeSurvey.maxRating !== undefined ? activeSurvey.maxRating : 4;
                const currentRating = ratings[q.questionId] !== undefined ? ratings[q.questionId] : maxVal;

                return (
                  <div key={q.questionId} className="space-y-3">
                    {showSectionHeader && (
                      <div className="pt-6 pb-1 first:pt-0">
                        <div className="bg-[#0063a9]/10 text-[#0063a9] dark:bg-blue-950/40 dark:text-blue-300 font-bold px-4 py-2.5 rounded-lg text-sm uppercase tracking-wider border border-[#0063a9]/10 shadow-xs">
                          {q.section}
                        </div>
                      </div>
                    )}

                    <div
                      id={`q-container-${q.questionId}`}
                      className={`panel p-5 space-y-4 shadow-sm hover:shadow-md transition duration-200 border-l-4 ${
                        validationErrors[q.questionId]
                          ? 'border-l-rose-500 bg-rose-50/10 ring-1 ring-rose-300 dark:border-l-rose-500 dark:bg-rose-950/5 dark:ring-rose-900/30'
                          : 'border-l-[#0063a9] dark:border-l-blue-400'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-start justify-between gap-4">
                          <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-relaxed">
                            <span className="text-slate-400 font-bold mr-1.5">{idx + 1}.</span>
                            {q.question} <span className="text-rose-500 font-bold">*</span>
                          </h4>
                          <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                            {q.questionCategory}
                          </span>
                        </div>
                      </div>

                      {/* Input Types rendering */}
                      {q.inputType === 'select' ? (
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-2">Choose an option:</span>
                          <select
                            className="field w-full text-xs font-semibold"
                            value={ratings[q.questionId] !== undefined ? ratings[q.questionId].toString() : ''}
                            onChange={(e) => {
                              handleRatingChange(q.questionId, e.target.value);
                              if (validationErrors[q.questionId]) {
                                setValidationErrors(prev => {
                                  const copy = { ...prev };
                                  delete copy[q.questionId];
                                  return copy;
                                });
                              }
                            }}
                          >
                            <option value="">-- Select option --</option>
                            {q.options?.map((opt) => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        </div>
                      ) : q.inputType === 'text' ? (
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-2">Your Answer:</span>
                          <input
                            type="text"
                            placeholder="Enter your answer"
                            className="field w-full"
                            value={ratings[q.questionId] !== undefined ? ratings[q.questionId].toString() : ''}
                            onChange={(e) => {
                              handleRatingChange(q.questionId, e.target.value);
                              if (validationErrors[q.questionId]) {
                                setValidationErrors(prev => {
                                  const copy = { ...prev };
                                  delete copy[q.questionId];
                                  return copy;
                                });
                              }
                            }}
                          />
                        </div>
                      ) : q.inputType === 'checkbox' ? (
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-2">Select Options:</span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {q.options?.map((opt) => {
                              const isChecked = Array.isArray(ratings[q.questionId]) && ratings[q.questionId].includes(opt);
                              return (
                                <label key={opt} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
                                  <input 
                                    type="checkbox"
                                    className="w-4 h-4 rounded border-slate-300 text-[#0063a9] focus:ring-[#0063a9]"
                                    checked={isChecked}
                                    onChange={(e) => {
                                      handleCheckboxChange(q.questionId, opt, e.target.checked);
                                      if (validationErrors[q.questionId]) {
                                        setValidationErrors(prev => {
                                          const copy = { ...prev };
                                          delete copy[q.questionId];
                                          return copy;
                                        });
                                      }
                                    }}
                                  />
                                  <span>{opt}</span>
                                </label>
                              )
                            })}
                          </div>
                        </div>
                      ) : q.inputType === 'date-range' ? (
                        <div>
                           <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-2">Duration (From - To):</span>
                           <div className="flex items-center gap-4">
                             <input
                               type="text"
                               inputMode="numeric"
                               placeholder="dd/mm/yyyy"
                               maxLength={10}
                               className={`field w-40 ${validationErrors[q.questionId] ? 'border-rose-400 focus:ring-rose-200' : ''}`}
                               value={ratings[q.questionId]?.from || ''}
                               onChange={(e) => {
                                 handleDateRangeChange(q.questionId, 'from', e.target.value);
                               }}
                             />
                             <span className="text-slate-400 font-bold">to</span>
                             <input
                               type="text"
                               inputMode="numeric"
                               placeholder="dd/mm/yyyy"
                               maxLength={10}
                               className={`field w-40 ${validationErrors[q.questionId] ? 'border-rose-400 focus:ring-rose-200' : ''}`}
                               value={ratings[q.questionId]?.to || ''}
                               onChange={(e) => {
                                 handleDateRangeChange(q.questionId, 'to', e.target.value);
                               }}
                             />
                           </div>
                           {validationErrors[q.questionId] && (
                             <p className="text-xs text-rose-500 font-semibold mt-1.5 flex items-center gap-1">
                               <span className="inline-block w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                               {validationErrors[q.questionId]}
                             </p>
                           )}
                        </div>
                      ) : q.inputType === 'matrix' && q.subQuestions ? (
                        <div className="overflow-x-auto w-full">
                          <table className="w-full text-sm text-left border-collapse min-w-[600px]">
                            <thead>
                              <tr className="border-b border-slate-200 dark:border-slate-800">
                                <th className="pb-3 text-slate-500 w-3/5 font-semibold">Criteria</th>
                                {[2, 1, 0, 'N/A'].map(opt => (
                                  <th key={opt} className="pb-3 text-center text-slate-500 font-semibold">{opt}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {q.subQuestions.map((sub, idx) => {
                                const subVal = ratings[q.questionId]?.[sub.id] || '';
                                return (
                                  <tr key={sub.id} className={idx !== q.subQuestions!.length - 1 ? "border-b border-slate-100 dark:border-slate-800" : ""}>
                                    <td className="py-4 pr-4">
                                      <div className="text-slate-800 dark:text-slate-200 leading-snug">{String.fromCharCode(97 + idx)}. {sub.label}</div>
                                      {sub.description && <div className="text-xs text-[#0063a9] dark:text-blue-400 mt-2 font-medium">{sub.description}</div>}
                                    </td>
                                    {[2, 1, 0, 'N/A'].map(opt => (
                                      <td key={opt} className="py-4 text-center">
                                        <input 
                                          type="radio"
                                          name={`matrix-${q.questionId}-${sub.id}`}
                                          className="w-4 h-4 text-[#0063a9] border-slate-300 focus:ring-[#0063a9]"
                                          checked={subVal.toString() === opt.toString()}
                                          onChange={() => {
                                            handleMatrixRatingChange(q.questionId, sub.id, opt);
                                            if (validationErrors[q.questionId]) {
                                              setValidationErrors(prev => {
                                                const copy = { ...prev };
                                                delete copy[q.questionId];
                                                return copy;
                                              });
                                            }
                                          }}
                                        />
                                      </td>
                                    ))}
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      ) : q.inputType === 'typed-rating' ? (
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                            Type Rating (Value: {q.validationRange ? `${q.validationRange.min}-${q.validationRange.max}` : '0-5'} or "N/A"): <span className="text-rose-500 font-bold">*</span>
                          </span>
                          <input
                            type="text"
                            placeholder={`Enter N/A or number from ${q.validationRange?.min || 0} to ${q.validationRange?.max || 5}`}
                            className={`field w-full max-w-sm ${validationErrors[q.questionId] ? 'border-rose-400 focus:ring-rose-200' : ''}`}
                            value={ratings[q.questionId] !== undefined ? ratings[q.questionId].toString() : ''}
                            onChange={(e) => {
                              handleRatingChange(q.questionId, e.target.value);
                              if (validationErrors[q.questionId]) {
                                setValidationErrors(prev => {
                                  const copy = { ...prev };
                                  delete copy[q.questionId];
                                  return copy;
                                });
                              }
                            }}
                          />
                          {validationErrors[q.questionId] && (
                            <p className="text-xs text-rose-500 font-semibold mt-1 flex items-center gap-1">
                              <span className="inline-block w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                              {validationErrors[q.questionId]}
                            </p>
                          )}
                        </div>
                      ) : (
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-2">Select Performance Rating:</span>
                          <div className="flex flex-wrap items-center gap-2">
                            {Array.from({ length: maxVal + 1 }, (_, i) => i).map((r) => {
                              const isSelected = currentRating === r;
                              const ratio = maxVal > 0 ? r / maxVal : 1;
                              
                              let btnStyle = 'border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900';
                              if (isSelected) {
                                if (ratio <= 0.3) {
                                  btnStyle = 'bg-rose-50 border-rose-500 text-rose-600 ring-2 ring-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:ring-rose-900/30';
                                } else if (ratio < 0.75) {
                                  btnStyle = 'bg-amber-50 border-amber-500 text-amber-600 ring-2 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:ring-amber-900/30';
                                } else {
                                  btnStyle = 'bg-emerald-50 border-emerald-500 text-emerald-600 ring-2 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:ring-emerald-900/30';
                                }
                              }

                              let label = '';
                              if (r === 0) label = 'Poor';
                              else if (r === maxVal) label = 'Excellent';
                              else if (r === Math.round(maxVal / 2)) label = 'Fair';

                              return (
                                <button
                                  key={r}
                                  type="button"
                                  onClick={() => handleRatingChange(q.questionId, r)}
                                  className={`flex-1 min-w-[42px] h-11 rounded-lg border text-sm font-bold flex flex-col items-center justify-center transition duration-150 cursor-pointer ${btnStyle}`}
                                >
                                  <span className="text-base leading-none">{r}</span>
                                  {label && (
                                    <span className="text-[8px] font-semibold mt-0.5 tracking-tight uppercase opacity-70">
                                      {label}
                                    </span>
                                  )}
                                </button>
                              );
                            })}

                            <button
                              type="button"
                              onClick={() => handleRatingChange(q.questionId, 'N/A')}
                              className={`min-w-16 h-11 rounded-lg border text-sm font-bold flex flex-col items-center justify-center transition duration-150 cursor-pointer ${
                                currentRating === 'N/A'
                                  ? 'bg-slate-100 border-slate-400 text-slate-700 ring-2 ring-slate-200 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-300'
                                  : 'border-slate-200 text-slate-400 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900'
                              }`}
                            >
                              <span className="text-sm leading-none">N/A</span>
                              <span className="text-[8px] font-semibold mt-0.5 uppercase tracking-tight opacity-70">Not App</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Comment Input */}
                      <div className="flex items-center gap-2.5 rounded-lg border border-slate-100 bg-slate-50/50 pl-3 pr-3 transition-colors focus-within:bg-white focus-within:border-slate-200 dark:border-slate-800 dark:bg-slate-900/40 dark:focus-within:bg-slate-900">
                        <MessageSquare size={14} className="text-slate-400 shrink-0" />
                        <input
                          type="text"
                          className="w-full bg-transparent py-2 text-xs text-slate-700 placeholder:text-slate-400 dark:text-slate-200 outline-none"
                          placeholder="Add a comment..."
                          value={comments[q.questionId] || ''}
                          onChange={(e) => handleCommentChange(q.questionId, e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                );
              });
            })()}
=======
          {/* Form questions list */}
          <div className="space-y-5">
            {activeSurvey.questions.map((q, idx) => {
              const currentRating = ratings[q.questionId] ?? 4;
              return (
                <div
                  key={q.questionId}
                  className="panel p-5 space-y-4 shadow-sm hover:shadow-md transition duration-200 border-l-4 border-l-[#0063a9] dark:border-l-blue-400"
                >
                  <div className="space-y-1">
                    <div className="flex items-start justify-between gap-4">
                      <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-relaxed">
                        <span className="text-slate-400 font-bold mr-1.5">{idx + 1}.</span>
                        {q.question} <span className="text-rose-500">*</span>
                      </h4>
                      <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                        {q.questionCategory}
                      </span>
                    </div>
                  </div>

                  {/* Ratings Row */}
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-2">Select Performance Rating:</span>
                    <div className="flex flex-wrap items-center gap-2">
                      {([0, 1, 2, 3, 4] as const).map((r) => {
                        const isSelected = currentRating === r;
                        let btnStyle = 'border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900';
                        if (isSelected) {
                          if (r <= 1) btnStyle = 'bg-rose-50 border-rose-500 text-rose-600 ring-2 ring-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:ring-rose-900/30';
                          else if (r === 2) btnStyle = 'bg-amber-50 border-amber-500 text-amber-600 ring-2 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:ring-amber-900/30';
                          else btnStyle = 'bg-emerald-50 border-emerald-500 text-emerald-600 ring-2 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:ring-emerald-900/30';
                        }

                        return (
                          <button
                            key={r}
                            type="button"
                            onClick={() => handleRatingChange(q.questionId, r)}
                            className={`flex-1 min-w-12 h-11 rounded-lg border text-sm font-bold flex flex-col items-center justify-center transition duration-150 cursor-pointer ${btnStyle}`}
                          >
                            <span className="text-base leading-none">{r}</span>
                            <span className="text-[8px] font-semibold mt-0.5 tracking-tight uppercase opacity-70">
                              {r === 0 ? 'Poor' : r === 2 ? 'Fair' : r === 4 ? 'Excel' : ''}
                            </span>
                          </button>
                        );
                      })}

                      {/* N/A Option */}
                      <button
                        type="button"
                        onClick={() => handleRatingChange(q.questionId, 'N/A')}
                        className={`min-w-16 h-11 rounded-lg border text-sm font-bold flex flex-col items-center justify-center transition duration-150 cursor-pointer ${
                          currentRating === 'N/A'
                            ? 'bg-slate-100 border-slate-400 text-slate-700 ring-2 ring-slate-200 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-300'
                            : 'border-slate-200 text-slate-400 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900'
                        }`}
                      >
                        <span className="text-sm leading-none">N/A</span>
                        <span className="text-[8px] font-semibold mt-0.5 uppercase tracking-tight opacity-70">Not App</span>
                      </button>
                    </div>
                  </div>

                  {/* Comment Input */}
                  <div className="flex items-center gap-2.5 rounded-lg border border-slate-100 bg-slate-50/50 pl-3 pr-3 transition-colors focus-within:bg-white focus-within:border-slate-200 dark:border-slate-800 dark:bg-slate-900/40 dark:focus-within:bg-slate-900">
                    <MessageSquare size={14} className="text-slate-400 shrink-0" />
                    <input
                      type="text"
                      className="w-full bg-transparent py-2 text-xs text-slate-700 placeholder:text-slate-400 dark:text-slate-200 outline-none"
                      placeholder="Optional details or specific examples..."
                      value={comments[q.questionId] || ''}
                      onChange={(e) => handleCommentChange(q.questionId, e.target.value)}
                    />
                  </div>
                </div>
              );
            })}
>>>>>>> dd3d86aebfcefa969b5ece6322fec478a426523b
          </div>

          {/* Form Footer */}
          <div className="panel p-5 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="secondary-button"
            >
              Back to Info
            </button>
            
            <button
              type="submit"
              className="primary-button bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
              id="btn-filler-submit"
            >
              <Send size={15} />
              <span>Submit Evaluation</span>
            </button>
          </div>
        </form>
      )}

      {step === 3 && (
        <div className="panel p-10 sm:p-16 text-center space-y-6" id="survey-filler-success">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-500 dark:bg-emerald-950/30 dark:text-emerald-400">
            <CheckCircle size={36} />
          </div>

          <div className="space-y-2 max-w-md mx-auto">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Submission Successful</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Thank you! Your ratings and comments have been registered in our database. The central administrator has been notified.
            </p>
          </div>

          <div className="border border-dashed border-slate-200 dark:border-slate-800 rounded-lg p-5 max-w-sm mx-auto text-left text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-400 font-semibold">Respondent:</span>
              <span className="text-slate-700 dark:text-slate-300 font-bold">{company}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 font-semibold">Audience Segment:</span>
              <span className="text-slate-700 dark:text-slate-300 font-bold">{activeSurvey?.surveyType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 font-semibold">Date Registered:</span>
              <span className="text-slate-700 dark:text-slate-300 font-bold">{new Date().toLocaleString()}</span>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-center gap-3">
            <button
              onClick={handleReset}
              className="secondary-button"
              type="button"
              id="btn-submit-another"
            >
              <span>Submit Another Evaluation</span>
            </button>
            {onCancel && (
              <button
                onClick={onCancel}
                className="primary-button bg-[#0063a9] hover:bg-[#00528c]"
                type="button"
              >
                Return to Directory
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
