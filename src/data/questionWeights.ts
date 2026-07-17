import { SurveyType } from '../types/survey';

/**
 * Point weights pulled directly from the MBS Partner Evaluation Forms
 * (Form 20-002 Form 2/3/4). These are what makes a company's composite
 * score match the actual paper rubric instead of a generic 0-4 average.
 *
 * - Courier (Courier form, Form 4 Rev. A): 5 sections, 100 points total.
 * - Supplier (Form 2 Rev. B): 5 sections of 20 points each, 100 points total.
 * - Subcontractor (Form 3 Rev. A): every question is scored 0/1/2/N-A on the
 *   same discrete scale, so "maxPoints" is 2 for all of them. There's no
 *   official 100-point total for this form; we compute a 0-100 composite
 *   (average / 2 * 100) purely so every survey type can share one
 *   leaderboard axis, one set of chart components, and - as of the current
 *   scoring policy - one unified 8-tier band system (see UNIFIED_BANDS
 *   below), instead of type-specific thresholds.
 */
export interface QuestionWeight {
  questionId: string;
  section: string;
  maxPoints: number;
}

export const questionWeights: Record<SurveyType, QuestionWeight[]> = {
  Courier: [
    { questionId: 'Q01', section: 'Reliability/Delivery', maxPoints: 15 },
    { questionId: 'Q02', section: 'Reliability/Delivery', maxPoints: 15 },
    { questionId: 'Q08', section: 'Cost', maxPoints: 7 },
    { questionId: 'Q09', section: 'Cost', maxPoints: 7 },
    { questionId: 'Q10', section: 'Cost', maxPoints: 6 },
    { questionId: 'Q17', section: 'Technology', maxPoints: 5 },
    { questionId: 'Q18', section: 'Technology', maxPoints: 5 },
    { questionId: 'Q19', section: 'Customer Service', maxPoints: 10 },
    { questionId: 'Q20', section: 'Customer Service', maxPoints: 10 },
    { questionId: 'Q21', section: 'Customer Service', maxPoints: 5 },
    { questionId: 'Q44', section: 'Security', maxPoints: 5 },
    { questionId: 'Q45', section: 'Security', maxPoints: 10 },
  ],
  Supplier: [
    { questionId: 'Q39', section: 'Documentation', maxPoints: 4 },
    { questionId: 'Q40', section: 'Documentation', maxPoints: 4 },
    { questionId: 'Q41', section: 'Documentation', maxPoints: 4 },
    { questionId: 'Q42', section: 'Documentation', maxPoints: 4 },
    { questionId: 'Q43', section: 'Documentation', maxPoints: 4 },
    { questionId: 'Q05', section: 'Delivery', maxPoints: 7 },
    { questionId: 'Q06', section: 'Delivery', maxPoints: 7 },
    { questionId: 'Q07', section: 'Delivery', maxPoints: 6 },
    { questionId: 'Q14', section: 'Price/Cost Effectiveness', maxPoints: 6 },
    { questionId: 'Q15', section: 'Price/Cost Effectiveness', maxPoints: 7 },
    { questionId: 'Q16', section: 'Price/Cost Effectiveness', maxPoints: 7 },
    { questionId: 'Q33', section: 'Quality', maxPoints: 7 },
    { questionId: 'Q34', section: 'Quality', maxPoints: 6 },
    { questionId: 'Q35', section: 'Quality', maxPoints: 7 },
    { questionId: 'Q25', section: 'Communication', maxPoints: 7 },
    { questionId: 'Q26', section: 'Communication', maxPoints: 6 },
    { questionId: 'Q27', section: 'Communication', maxPoints: 7 },
  ],
  Subcontractor: [
    { questionId: 'Q03', section: 'Delivery / Timeliness', maxPoints: 2 },
    { questionId: 'Q04', section: 'Delivery / Timeliness', maxPoints: 2 },
    { questionId: 'Q36', section: 'Documentation / Invoicing', maxPoints: 2 },
    { questionId: 'Q37', section: 'Documentation / Invoicing', maxPoints: 2 },
    { questionId: 'Q38', section: 'Documentation / Invoicing', maxPoints: 2 },
    { questionId: 'Q11', section: 'Cost Control / Pricing', maxPoints: 2 },
    { questionId: 'Q12', section: 'Cost Control / Pricing', maxPoints: 2 },
    { questionId: 'Q13', section: 'Cost Control / Pricing', maxPoints: 2 },
    { questionId: 'Q28', section: 'Quality & Technical Competence', maxPoints: 2 },
    { questionId: 'Q29', section: 'Quality & Technical Competence', maxPoints: 2 },
    { questionId: 'Q30', section: 'Quality & Technical Competence', maxPoints: 2 },
    { questionId: 'Q31', section: 'Quality & Technical Competence', maxPoints: 2 },
    { questionId: 'Q32', section: 'Quality & Technical Competence', maxPoints: 2 },
    { questionId: 'Q22', section: 'Communication', maxPoints: 2 },
    { questionId: 'Q23', section: 'Communication', maxPoints: 2 },
    { questionId: 'Q24', section: 'Communication', maxPoints: 2 },
  ],
};

export interface ScoreBand {
  label: string;
  min: number;
  hex: string;
}

// Composite scores are already normalized to a shared 0-100 scale for every
// survey type (see normalizeScoreTo100 in analytics.ts), so all three forms
// - Courier, Supplier, Subcontractor - are ranked against the exact same
// 8-tier scorecard instead of type-specific thresholds.
const UNIFIED_BANDS: ScoreBand[] = [
  { label: 'Top Performer', min: 92, hex: '#0d6b3f' },            // Darker Green
  { label: 'Highly Satisfactory', min: 85, hex: '#1baf7a' },      // Regular Green
  { label: 'Satisfactory', min: 80, hex: '#7bc96f' },             // Lighter Green
  { label: 'Good', min: 75, hex: '#eab308' },                     // Yellow
  { label: 'Fair', min: 50, hex: '#f97316' },                     // Orange
  { label: 'Slightly Unsatisfactory', min: 40, hex: '#f4978e' },  // Lighter Red
  { label: 'Unsatisfactory', min: 30, hex: '#e34948' },           // Red
  { label: 'Critical', min: 0, hex: '#7f1d1d' },                  // Darker Red
];

export const ratingBands: Record<SurveyType, ScoreBand[]> = {
  Courier: UNIFIED_BANDS,
  Supplier: UNIFIED_BANDS,
  Subcontractor: UNIFIED_BANDS,
};

export function getBand(surveyType: SurveyType, percentScore: number): ScoreBand {
  const bands = ratingBands[surveyType];
  return bands.find((b) => percentScore >= b.min) ?? bands[bands.length - 1];
}

export const surveyTypeDisplayLabel: Record<SurveyType, string> = {
  Courier: 'Courier',
  Supplier: 'Supplier',
  Subcontractor: 'Subcontractor',
};

export const ID_MAPPING: Record<string, string> = {
  // Courier (Courier)
  'Q-CON-04': 'Q01',
  'Q-CON-05': 'Q02',
  'Q-CON-07': 'Q08',
  'Q-CON-08': 'Q09',
  'Q-CON-09': 'Q10',
  'Q-CON-11': 'Q17',
  'Q-CON-12': 'Q18',
  'Q-CON-14': 'Q19',
  'Q-CON-15': 'Q20',
  'Q-CON-16': 'Q21',
  'Q-CON-18': 'Q44',
  'Q-CON-19': 'Q45',

  // Supplier
  'Q-SUP-05': 'Q39',
  'Q-SUP-06': 'Q40',
  'Q-SUP-07': 'Q41',
  'Q-SUP-08': 'Q42',
  'Q-SUP-09': 'Q43',
  'Q-SUP-11': 'Q05',
  'Q-SUP-12': 'Q06',
  'Q-SUP-13': 'Q07',
  'Q-SUP-15': 'Q14',
  'Q-SUP-16': 'Q15',
  'Q-SUP-17': 'Q16',
  'Q-SUP-19': 'Q33',
  'Q-SUP-20': 'Q34',
  'Q-SUP-21': 'Q35',
  'Q-SUP-23': 'Q25',
  'Q-SUP-24': 'Q26',
  'Q-SUP-25': 'Q27',

  // Subcontractor (matrix sub-questions)
  'Q-SUB-04-a': 'Q03',
  'Q-SUB-04-b': 'Q04',
  'Q-SUB-06-a': 'Q36',
  'Q-SUB-06-b': 'Q37',
  'Q-SUB-06-c': 'Q38',
  'Q-SUB-08-a': 'Q11',
  'Q-SUB-08-b': 'Q12',
  'Q-SUB-08-c': 'Q13',
  'Q-SUB-10-a': 'Q28',
  'Q-SUB-10-b': 'Q29',
  'Q-SUB-10-c': 'Q30',
  'Q-SUB-10-d': 'Q31',
  'Q-SUB-10-e': 'Q32',
  'Q-SUB-12-a': 'Q22',
  'Q-SUB-12-b': 'Q23',
  'Q-SUB-12-c': 'Q24',
};

export function getCanonicalQuestionId(questionId: string): string {
  return ID_MAPPING[questionId] || questionId;
}

export function getQuestionMaxPoints(surveyType: SurveyType, questionId: string): number {
  const canonicalId = getCanonicalQuestionId(questionId);
  const weight = questionWeights[surveyType]?.find((w) => w.questionId === canonicalId);
  if (weight) return weight.maxPoints;
  return 100; // default fallback if not found
}

export function isScoredQuestion(surveyType: SurveyType, questionId: string): boolean {
  const canonicalId = getCanonicalQuestionId(questionId);
  return questionWeights[surveyType]?.some((w) => w.questionId === canonicalId) ?? false;
}
