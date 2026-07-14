import { SurveyType } from '../types/survey';

/**
 * Point weights pulled directly from the MBS Partner Evaluation Forms
 * (Form 20-002 Form 2/3/4). These are what makes a company's composite
 * score match the actual paper rubric instead of a generic 0-4 average.
 *
 * - Contractor (Courier form, Form 4 Rev. A): 5 sections, 100 points total.
 * - Supplier (Form 2 Rev. B): 5 sections of 20 points each, 100 points total.
 * - Subcontractor (Form 3 Rev. A): every question is scored 0/1/2/N-A on the
 *   same discrete scale, so "maxPoints" is 2 for all of them. There's no
 *   official 100-point total for this form; instead MBS ranks subcontractors
 *   on the *average* of their 0-2 scores (Top Performer 1.5-2.0, Good
 *   Performer 1.0-1.4, Marginal 0.5-0.9, Poor <=0.4). We still compute a
 *   0-100 composite for these companies (average / 2 * 100) purely so every
 *   survey type can share one leaderboard axis and one set of chart
 *   components - the band lookup below converts back to the official
 *   language at display time.
 */
export interface QuestionWeight {
  questionId: string;
  section: string;
  maxPoints: number;
}

export const questionWeights: Record<SurveyType, QuestionWeight[]> = {
  Contractor: [
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

// Thresholds are expressed as "% of max score" so every survey type can be
// banded on the same 0-100 composite while still reproducing the official
// wording from each paper form.
export const ratingBands: Record<SurveyType, ScoreBand[]> = {
  Contractor: [
    { label: 'Excellent', min: 95, hex: '#008300' },
    { label: 'Satisfactory', min: 89, hex: '#1baf7a' },
    { label: 'Good', min: 80, hex: '#eda100' },
    { label: 'Unsatisfactory', min: 0, hex: '#e34948' },
  ],
  Supplier: [
    { label: 'Excellent', min: 95, hex: '#008300' },
    { label: 'Good', min: 89, hex: '#1baf7a' },
    { label: 'Satisfactory', min: 80, hex: '#eda100' },
    { label: 'Unsatisfactory', min: 0, hex: '#e34948' },
  ],
  // Official bands are on the 0-2 average (Top 1.5-2.0 / Good 1.0-1.4 /
  // Marginal 0.5-0.9 / Poor <=0.4). Converted to % of 2.0 so it fits the
  // shared 0-100 composite: 75% / 50% / 25% / 0%.
  Subcontractor: [
    { label: 'Top Performer', min: 75, hex: '#008300' },
    { label: 'Good Performer', min: 50, hex: '#1baf7a' },
    { label: 'Marginal Performer', min: 25, hex: '#eda100' },
    { label: 'Poor Performer', min: 0, hex: '#e34948' },
  ],
};

export function getBand(surveyType: SurveyType, percentScore: number): ScoreBand {
  const bands = ratingBands[surveyType];
  return bands.find((b) => percentScore >= b.min) ?? bands[bands.length - 1];
}

export const surveyTypeDisplayLabel: Record<SurveyType, string> = {
  Contractor: 'Courier',
  Supplier: 'Supplier',
  Subcontractor: 'Subcontractor',
};
