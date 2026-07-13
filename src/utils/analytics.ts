import { FilterState, KpiSummary, Rating, SurveyResponse, SurveyType } from '../types/survey';

export const initialFilters: FilterState = {
  surveyType: [],
  dateFrom: '',
  dateTo: '',
  questionId: '',
  rating: 'All',
  company: '',
  search: '',
};

export function numericRating(rating: Rating): number | null {
  return rating === 'N/A' ? null : rating;
}

export function formatNumber(value: number, digits = 1) {
  return Number.isFinite(value) ? value.toFixed(digits) : '0.0';
}

export function applyFilters(responses: SurveyResponse[], filters: FilterState) {
  const search = filters.search.trim().toLowerCase();

  return responses.filter((response) => {
    const submitted = response.submissionDate.slice(0, 10);
    const matchesSurvey = filters.surveyType.length === 0 || filters.surveyType.includes(response.surveyType);
    const matchesFrom = !filters.dateFrom || submitted >= filters.dateFrom;
    const matchesTo = !filters.dateTo || submitted <= filters.dateTo;
    const matchesQuestion = !filters.questionId || response.questionId === filters.questionId;
    const matchesRating = filters.rating === 'All' || response.rating === filters.rating;
    const matchesCompany = !filters.company || response.company === filters.company;
    const matchesSearch =
      !search ||
      [response.company, response.department, response.respondentType, response.question, response.comment, response.surveyType]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(search));

    return matchesSurvey && matchesFrom && matchesTo && matchesQuestion && matchesRating && matchesCompany && matchesSearch;
  });
}

export function averageRating(responses: SurveyResponse[]) {
  const values = responses.map((response) => numericRating(response.rating)).filter((rating): rating is number => rating !== null);
  return values.length ? values.reduce((sum, rating) => sum + rating, 0) / values.length : 0;
}

function averageByQuestion(responses: SurveyResponse[]) {
  const groups = new Map<string, SurveyResponse[]>();
  responses.forEach((response) => {
    groups.set(response.question, [...(groups.get(response.question) ?? []), response]);
  });

  return [...groups.entries()].map(([question, questionResponses]) => ({
    question,
    average: averageRating(questionResponses),
    responses: questionResponses.length,
  }));
}

export function getKpiSummary(responses: SurveyResponse[]): KpiSummary {
  const questionAverages = averageByQuestion(responses).filter((item) => item.responses > 0);
  const sorted = [...questionAverages].sort((left, right) => right.average - left.average);
  const naCount = responses.filter((response) => response.rating === 'N/A').length;
  const average = averageRating(responses);

  return {
    overallSatisfactionScore: (average / 4) * 100,
    totalResponses: responses.length,
    averageRating: average,
    naPercentage: responses.length ? (naCount / responses.length) * 100 : 0,
    highestRatedQuestion: sorted[0]?.question ?? 'No responses',
    lowestRatedQuestion: sorted[sorted.length - 1]?.question ?? 'No responses',
  };
}

export function ratingDistribution(responses: SurveyResponse[]) {
  const ratings: Rating[] = [0, 1, 2, 3, 4, 'N/A'];
  return ratings.map((rating) => ({
    rating: String(rating),
    count: responses.filter((response) => response.rating === rating).length,
  }));
}

export function averageBySurveyType(responses: SurveyResponse[], types: SurveyType[] = ['Contractor', 'Supplier', 'Subcontractor']) {
  return types.map((surveyType) => ({
    surveyType,
    average: Number(formatNumber(averageRating(responses.filter((response) => response.surveyType === surveyType)))),
    responses: responses.filter((response) => response.surveyType === surveyType).length,
  }));
}

export function monthlyTrend(responses: SurveyResponse[]) {
  const groups = new Map<string, SurveyResponse[]>();
  responses.forEach((response) => {
    const month = response.submissionDate.slice(0, 7);
    groups.set(month, [...(groups.get(month) ?? []), response]);
  });

  return [...groups.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([month, monthResponses]) => ({
      month,
      average: Number(formatNumber(averageRating(monthResponses))),
      responses: monthResponses.length,
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
    responses: responses.filter((response) => response.surveyType === surveyType).length,
  }));
}

export function naFrequency(responses: SurveyResponse[]) {
  const groups = new Map<string, SurveyResponse[]>();
  responses.forEach((response) => {
    groups.set(response.questionCategory, [...(groups.get(response.questionCategory) ?? []), response]);
  });

  return [...groups.entries()].map(([category, categoryResponses]) => ({
    category,
    count: categoryResponses.filter((response) => response.rating === 'N/A').length,
  }));
}


