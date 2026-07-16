import { FilterState, KpiSummary, Rating, SurveyResponse, SurveyType } from '../types/survey';
import { getQuestionMaxPoints, isScoredQuestion } from '../data/questionWeights';

const SURVEY_TOTAL_POINTS: Record<SurveyType, number> = {
  Contractor: 100,
  Supplier: 100,
  Subcontractor: 32,
};

export const initialFilters: FilterState = {
  surveyType: [],
  questionId: '',
  rating: 'All',
  company: '',
  search: '',
};

export function numericRating(rating: Rating): number | null {
  return rating === 'N/A' ? null : rating;
}

export type CompletionStatus = 'not-started' | 'in-progress' | 'completed' | 'no-companies';

export interface CompletionStyle {
  status: CompletionStatus;
  percentage: number;
  barColorClass: string;
  textColorClass: string;
}

/**
 * Determines the visual treatment for a company-evaluation completion percentage:
 * - red under 50%, orange 50-64%, yellow 65-74%, light green 75-89%, darker green 90-99%.
 * - "completed" when 100% (bar goes away, replaced with a "Completed" badge elsewhere).
 * - "not-started" when 0 (no bar at all, just a "Not Yet Started" label elsewhere).
 */
export function getCompletionStyle(completed: number, total: number): CompletionStyle {
  if (total <= 0) {
    return { status: 'no-companies', percentage: 0, barColorClass: 'bg-slate-300 dark:bg-slate-700', textColorClass: 'text-slate-400' };
  }

  const percentage = Math.round((completed / total) * 100);

  if (completed <= 0) {
    return { status: 'not-started', percentage: 0, barColorClass: 'bg-slate-300 dark:bg-slate-700', textColorClass: 'text-slate-400' };
  }

  if (completed >= total) {
    return { status: 'completed', percentage: 100, barColorClass: 'bg-emerald-600 dark:bg-emerald-500', textColorClass: 'text-emerald-600 dark:text-emerald-400' };
  }

  if (percentage < 50) {
    return { status: 'in-progress', percentage, barColorClass: 'bg-rose-500', textColorClass: 'text-rose-600 dark:text-rose-400' };
  }
  if (percentage < 65) {
    return { status: 'in-progress', percentage, barColorClass: 'bg-orange-500', textColorClass: 'text-orange-600 dark:text-orange-400' };
  }
  if (percentage < 75) {
    return { status: 'in-progress', percentage, barColorClass: 'bg-yellow-400', textColorClass: 'text-yellow-600 dark:text-yellow-400' };
  }
  if (percentage < 90) {
    return { status: 'in-progress', percentage, barColorClass: 'bg-green-400', textColorClass: 'text-green-600 dark:text-green-400' };
  }
  return { status: 'in-progress', percentage, barColorClass: 'bg-emerald-700 dark:bg-emerald-600', textColorClass: 'text-emerald-700 dark:text-emerald-400' };
}

export function formatNumber(value: number, digits = 1) {
  return Number.isFinite(value) ? value.toFixed(digits) : '0.0';
}

/**
 * Picks a Y-axis domain (0-100 scale) for score bar charts.
 *
 * A fixed [0, 100] domain makes tightly clustered scores (e.g. 90, 91, 92)
 * look like near-identical bar heights, hiding real differences between
 * companies. When the values are close together, this zooms the axis in
 * around them (snapped to nice multiples of 5) so the differences read
 * clearly. When values are already spread out, it falls back to the full
 * 0-100 scale so the chart doesn't exaggerate an already-visible gap.
 */
export function getScoreAxisDomain(values: number[]): [number, number] {
  const finite = values.filter((value) => Number.isFinite(value));
  if (finite.length === 0) return [0, 100];

  const min = Math.min(...finite);
  const max = Math.max(...finite);
  const spread = max - min;

  // Values are already spread across a wide range - the standard scale
  // already shows the differences clearly, so don't zoom in.
  if (spread > 30) return [0, 100];

  // Pad around the cluster so bars don't touch the chart edges, with a
  // floor so we never zoom in so far that noise looks like signal.
  const padding = Math.max(spread * 0.6, 4);
  let lower = Math.floor((min - padding) / 5) * 5;
  let upper = Math.ceil((max + padding) / 5) * 5;

  lower = Math.max(0, lower);
  upper = Math.min(100, upper);

  // Guarantee a minimum visible span even for a single identical value.
  if (upper - lower < 10) {
    upper = Math.min(100, lower + 10);
    lower = Math.max(0, upper - 10);
  }

  return [lower, upper];
}

export function applyFilters(responses: SurveyResponse[], filters: FilterState) {
  const search = filters.search.trim().toLowerCase();

  return responses.filter((response) => {
    const matchesSurvey = filters.surveyType.length === 0 || filters.surveyType.includes(response.surveyType);
    const matchesQuestion = !filters.questionId || response.questionId === filters.questionId;
    const matchesRating = filters.rating === 'All' || response.rating === filters.rating;
    const matchesCompany = !filters.company || response.company === filters.company;
    const matchesSearch =
      !search ||
      [response.company, response.department, response.respondentType, response.question, response.comment, response.surveyType]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(search));

    return matchesSurvey && matchesQuestion && matchesRating && matchesCompany && matchesSearch;
  });
}

export function averageRating(responses: SurveyResponse[]) {
  const scores = submissionScores(responses);
  return scores.length ? scores.reduce((sum, item) => sum + item.score, 0) / scores.length : 0;
}

export function getSurveyTotalPoints(surveyType: SurveyType): number {
  return SURVEY_TOTAL_POINTS[surveyType];
}

export function normalizeScoreTo100(score: number, surveyType: SurveyType): number {
  const totalPoints = getSurveyTotalPoints(surveyType);
  return totalPoints > 0 ? (score / totalPoints) * 100 : 0;
}

function getSubmissionKey(response: SurveyResponse) {
  return [
    response.responseId,
    response.company,
    response.surveyType,
    response.respondentEmail ?? response.respondentType,
    response.submissionDate,
  ].join('|');
}

export function submissionScores(responses: SurveyResponse[]) {
  const groups = new Map<string, { surveyType: SurveyType; company: string; submissionDate: string; score: number; answers: number }>();

  responses.forEach((response) => {
    const rating = numericRating(response.rating);
    if (rating === null) return;

    const key = getSubmissionKey(response);
    const current = groups.get(key) ?? {
      surveyType: response.surveyType,
      company: response.company,
      submissionDate: response.submissionDate,
      score: 0,
      answers: 0,
    };

    current.score += rating;
    current.answers += 1;
    groups.set(key, current);
  });

  return [...groups.values()].map((item) => ({
    ...item,
    score: normalizeScoreTo100(item.score, item.surveyType),
  }));
}

export function submissionCount(responses: SurveyResponse[]) {
  return new Set(responses.map(getSubmissionKey)).size;
}

export function scoredResponses(responses: SurveyResponse[]) {
  return responses.filter((response) => isScoredQuestion(response.surveyType, response.questionId));
}

function averageByQuestion(responses: SurveyResponse[]) {
  const groups = new Map<string, SurveyResponse[]>();
  responses.forEach((response) => {
    groups.set(response.question, [...(groups.get(response.question) ?? []), response]);
  });

  return [...groups.entries()]
    .map(([question, questionResponses]) => {
      const scoredQuestionResponses = scoredResponses(questionResponses);
      if (scoredQuestionResponses.length === 0) {
        return null;
      }

      const validRatings = scoredQuestionResponses
        .map((r) => numericRating(r.rating))
        .filter((rating): rating is number => rating !== null);

      if (validRatings.length === 0) {
        return null;
      }

      const average = validRatings.reduce((sum, rating) => sum + rating, 0) / validRatings.length;
      const surveyType = scoredQuestionResponses[0]?.surveyType ?? 'Contractor';
      const maxPoints = getQuestionMaxPoints(surveyType, scoredQuestionResponses[0]?.questionId ?? '');

      return {
        question,
        average: maxPoints > 0 ? (average / maxPoints) * 100 : 0,
        responses: scoredQuestionResponses.length,
      };
    })
    .filter((q): q is NonNullable<typeof q> => q !== null);
}

export function getMaxRatingForResponses(responses: SurveyResponse[]): number {
  return responses.length === 0 ? 100 : 100;
}

export function getKpiSummary(responses: SurveyResponse[]): KpiSummary {
  const scored = scoredResponses(responses);
  const questionAverages = averageByQuestion(scored).filter((item) => item.responses > 0);
  const sorted = [...questionAverages].sort((left, right) => right.average - left.average);
  const naCount = scored.filter((response) => response.rating === 'N/A').length;
  const average = averageRating(scored);

  const satScore = average;

  return {
    overallSatisfactionScore: satScore,
    totalResponses: submissionCount(responses),
    averageRating: average,
    naPercentage: scored.length ? (naCount / scored.length) * 100 : 0,
    highestRatedQuestion: sorted[0]?.question ?? 'No responses',
    lowestRatedQuestion: sorted[sorted.length - 1]?.question ?? 'No responses',
    maxRating: 100,
  };
}

export function getCompanyPerformance(responses: SurveyResponse[]) {
  const scores = submissionScores(responses);
  const companyMap = new Map<string, { totalScore: number; count: number }>();
  
  scores.forEach(item => {
    const current = companyMap.get(item.company) || { totalScore: 0, count: 0 };
    current.totalScore += item.score;
    current.count += 1;
    companyMap.set(item.company, current);
  });
  
  const companyAverages = Array.from(companyMap.entries()).map(([company, data]) => ({
    company,
    average: data.totalScore / data.count,
    evaluations: data.count,
  }));
  
  companyAverages.sort((a, b) => b.average - a.average);
  
  return companyAverages;
}

export function ratingDistribution(responses: SurveyResponse[]) {
  const uniqueRatings = new Set<Rating>();
  responses.forEach((response) => {
    uniqueRatings.add(response.rating);
  });

  const list = [...uniqueRatings].sort((a, b) => {
    if (a === 'N/A') return 1;
    if (b === 'N/A') return -1;
    return (a as number) - (b as number);
  });

  if (list.length === 0) {
    return [0, 1, 2, 3, 4, 'N/A'].map((r) => ({
      rating: String(r),
      count: 0,
    }));
  }

  return list.map((rating) => ({
    rating: String(rating),
    count: responses.filter((response) => response.rating === rating).length,
  }));
}

export function averageBySurveyType(responses: SurveyResponse[], types: SurveyType[] = ['Contractor', 'Supplier', 'Subcontractor']) {
  return types.map((surveyType) => ({
    surveyType,
    average: Number(formatNumber(averageRating(responses.filter((response) => response.surveyType === surveyType)))),
    responses: submissionCount(responses.filter((response) => response.surveyType === surveyType)),
  }));
}

export function monthlyTrend(responses: SurveyResponse[]) {
  const groups = new Map<string, ReturnType<typeof submissionScores>>();
  submissionScores(responses).forEach((submission) => {
    const month = submission.submissionDate.slice(0, 7);
    groups.set(month, [...(groups.get(month) ?? []), submission]);
  });

  return [...groups.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([month, monthSubmissions]) => ({
      month,
      average: Number(formatNumber(monthSubmissions.reduce((sum, item) => sum + item.score, 0) / monthSubmissions.length)),
      responses: monthSubmissions.length,
    }));
}

export function questionPerformance(responses: SurveyResponse[]) {
  return averageByQuestion(responses)
    .sort((left, right) => right.average - left.average)
    .map((item) => ({
      question: item.question.replace('How satisfied are you with ', '').replace('How would you rate ', ''),
      average: Number(formatNumber(item.average)),
      responses: item.responses,
    }));
}

export function responseVolume(responses: SurveyResponse[], types: SurveyType[] = ['Contractor', 'Supplier', 'Subcontractor']) {
  return types.map((surveyType) => ({
    surveyType,
    responses: submissionCount(responses.filter((response) => response.surveyType === surveyType)),
  }));
}

export function categoryPerformance(responses: SurveyResponse[]) {
  const groups = new Map<string, SurveyResponse[]>();
  responses.forEach((response) => {
    groups.set(response.questionCategory, [...(groups.get(response.questionCategory) ?? []), response]);
  });

  return [...groups.entries()]
    .map(([category, categoryResponses]) => ({
      category,
      average: Number(formatNumber(averageByQuestion(categoryResponses).reduce((sum, item) => sum + item.average, 0) / Math.max(averageByQuestion(categoryResponses).length, 1))),
      responses: categoryResponses.length,
      naCount: scoredResponses(categoryResponses).filter((response) => response.rating === 'N/A').length,
    }))
    .sort((left, right) => right.average - left.average);
}

export function naFrequency(responses: SurveyResponse[]) {
  const groups = new Map<string, SurveyResponse[]>();
  responses.forEach((response) => {
    groups.set(response.questionCategory, [...(groups.get(response.questionCategory) ?? []), response]);
  });

  return [...groups.entries()].map(([category, categoryResponses]) => ({
    category,
    count: scoredResponses(categoryResponses).filter((response) => response.rating === 'N/A').length,
  }));
}
