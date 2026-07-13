import { surveyQuestions } from './questions';
import { Rating, SurveyResponse, SurveyType } from '../types/survey';

const companies = [
  'Apex Buildworks',
  'Northstar Materials',
  'BluePeak Industrial',
  'CivicLine Contractors',
  'MetroGrid Services',
  'HarborPoint Supply',
  'Summit Electrical',
  'PrimeAxis Logistics',
  'Greenfield Mechanical',
  'Keystone Fabrication',
  'Orbit Safety Group',
  'BrightPath Engineering',
];

const departments = ['Procurement', 'Operations', 'Facilities', 'Finance', 'Project Delivery', 'Compliance'];
const surveyTypes: SurveyType[] = ['Contractor', 'Supplier', 'Subcontractor'];
const respondentTypes = ['Project Manager', 'Account Lead', 'Site Supervisor', 'Coordinator', 'Commercial Contact'];

const positiveComments = [
  'Clear coordination and professional follow-through.',
  'The team was responsive and easy to work with.',
  'Process is improving and communication has been consistent.',
  'Good collaboration across the recent reporting period.',
];

const neutralComments = [
  'Generally acceptable, with a few items that need attention.',
  'Service was adequate but communication could be more proactive.',
  'No major issues, though status updates could be clearer.',
  'The process worked, but handoffs need more consistency.',
];

const negativeComments = [
  'Response times were slower than expected.',
  'Documentation gaps created avoidable follow-up work.',
  'Escalations need clearer ownership and faster closure.',
  'Several updates arrived late in the process.',
];

function seededRandom(seed: number) {
  const value = Math.sin(seed) * 10000;
  return value - Math.floor(value);
}

function pick<T>(items: T[], seed: number): T {
  return items[Math.floor(seededRandom(seed) * items.length)];
}

function weightedRating(seed: number, surveyType: SurveyType, questionNumber: number): Rating {
  const base = seededRandom(seed);
  const modifier = surveyType === 'Supplier' ? 0.04 : surveyType === 'Contractor' ? 0.02 : -0.02;
  const questionPenalty = questionNumber === 7 ? -0.08 : questionNumber === 2 ? -0.05 : questionNumber === 8 ? 0.06 : 0;
  const score = base + modifier + questionPenalty;

  if (score < 0.07) return 'N/A';
  if (score < 0.13) return 0;
  if (score < 0.28) return 1;
  if (score < 0.53) return 2;
  if (score < 0.79) return 3;
  return 4;
}

function commentForRating(rating: Rating, seed: number) {
  if (rating === 'N/A') return 'Question was not applicable for this respondent.';
  if (rating >= 3) return pick(positiveComments, seed);
  if (rating === 2) return pick(neutralComments, seed);
  return pick(negativeComments, seed);
}

function dateForIndex(index: number) {
  const start = new Date('2025-01-03T08:00:00');
  start.setDate(start.getDate() + Math.floor(index * 0.78));
  return start.toISOString();
}

export function generateMockResponses(total = 432): SurveyResponse[] {
  return Array.from({ length: total }, (_, index) => {
    const question = surveyQuestions[index % surveyQuestions.length];
    const surveyType = pick(question.surveyTypes, index + 21);
    const rating = weightedRating(index + 73, surveyType, question.questionNumber);
    const company = pick(companies, index + 91);

    return {
      responseId: `SP-${String(index + 1).padStart(5, '0')}`,
      surveyType,
      respondentType: pick(respondentTypes, index + 13),
      submissionDate: dateForIndex(index),
      company,
      department: pick(departments, index + 45),
      questionId: question.questionId,
      questionNumber: question.questionNumber,
      question: question.question,
      questionCategory: question.questionCategory,
      rating,
      comment: commentForRating(rating, index + 111),
    };
  });
}
