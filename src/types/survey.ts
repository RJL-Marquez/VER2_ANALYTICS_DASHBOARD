export type SurveyType = 'Contractor' | 'Supplier' | 'Subcontractor';
export type Rating = 0 | 1 | 2 | 3 | 4 | 'N/A';

export interface PartnerCompany {
  id: string;
  name: string;
  type: SurveyType;
  affiliation?: string;
  createdAt: string;
}

export interface SurveyResponse {
  responseId: string;
  surveyType: SurveyType;
  respondentType: string;
  submissionDate: string;
  company: string;
  department?: string;
  questionId: string;
  questionNumber: number;
  question: string;
  questionCategory: string;
  rating: Rating;
  comment: string;
}

export interface FilterState {
  surveyType: SurveyType[];
  dateFrom: string;
  dateTo: string;
  questionId: string;
  rating: 'All' | Rating;
  company: string;
  search: string;
}

export interface QuestionDefinition {
  questionId: string;
  questionNumber: number;
  question: string;
  questionCategory: string;
  surveyTypes: SurveyType[];
}

export interface KpiSummary {
  overallSatisfactionScore: number;
  totalResponses: number;
  averageRating: number;
  naPercentage: number;
  highestRatedQuestion: string;
  lowestRatedQuestion: string;
}

export interface ResponseNotification {
  id: string;
  company: string;
  surveyType: SurveyType;
  respondentType: string;
  submissionDate: string;
  questionCount: number;
}

export interface CustomForm {
  id: string;
  title: string;
  surveyType: SurveyType;
  description: string;
  createdAt: string;
  questions: {
    questionId: string;
    questionNumber: number;
    question: string;
    questionCategory: string;
  }[];
}

