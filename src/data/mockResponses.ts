import { surveyQuestions } from './questions';
import { Rating, SurveyResponse, SurveyType } from '../types/survey';

const courierCompanies = [
  'Airspeed International Corp',
  'Alphacon Logistics International Corp',
  'Cloverxpress Freight Inc',
  'Lite Xpress International Inc',
  'Lucky Charm Express Movers Inc',
  'Road2go Trucking Services OPC',
  'RZ1 Freight Express Corporation',
  'Yello X Supply Chain Solutions',
];

const subcontractorCompanies = [
  'Aimvest Electrical Services',
  'Cara Electrical and Network Solutions Inc',
  'Cgalz Enterprises',
  'Datalec Technology Corporation',
  'Glimpse-DC Electronics Industries Inc',
  'J & C Obenita Construction OPC',
  'L-Gertrude Construction Services',
  'MTeknik Technologies Solutions, Inc',
  'Paragon Electromech Development Corporation',
  'Skyconvergence Inc',
  'Technivision ICT Solutions, Inc',
  'Unikkon Network Philippines Inc',
  'ZIMOSystem Solutions Inc',
];

const supplierCompanies = [
  'VSTECS Phils. Inc',
  'Wordtext Systems, Inc',
  'Exclusive Networks-Ph Inc',
  'Touchstream Digital, Inc',
  'Bridge Distribution, Inc',
  'Softwareone Philippines Corporation',
  'AptSecure Technologies Inc',
  'Westcon Group Philippines',
  'M-Security Tech Philippines, Inc',
  'Banbros Commercial, Incorporated',
  'Westcon Solutions Philippines Inc',
  'Ardent Networks Inc',
  'Mec Computer Corporation',
  'Streamline Works Inc',
  'Wyntech Corp',
  'ACW Distribution (Phils), Inc',
  'Apuma, March Maanap',
  'Versatech International Inc',
  'Sencolink Technologies Inc',
  'PAX8 Philippines Inc',
];

// Companies grouped by the survey type they're actually evaluated on -
// this must stay in sync with the default partner company list seeded in
// useSurveyData.ts, so a company never ends up with responses for a form
// type it was never registered under.
const companiesByType: Record<SurveyType, string[]> = {
  Contractor: courierCompanies,
  Subcontractor: subcontractorCompanies,
  Supplier: supplierCompanies,
};

const departments = [
  'Accounts Payable - Trade',
  'Business Solutions Manager',
  'Logistics',
  'Procurement Group',
  'TASS'
];
const surveyTypes: SurveyType[] = ['Contractor', 'Supplier', 'Subcontractor'];
const respondentTypes = [
  'Rank & File',
  'Supervisory',
  'Managerial',
  'Director',
  'Executive'
];

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
  start.setDate(start.getDate() + Math.floor(index * 2.1));
  return start.toISOString();
}

function respondentEmailFor(rType: string, dept: string) {
  if (rType === 'Rank & File' && dept === 'Accounts Payable - Trade') return 'rankfile@mgenesis.com';
  if (rType === 'Supervisory' && dept === 'Logistics') return 'supervisory@mgenesis.com';
  if (rType === 'Managerial' && dept === 'Procurement Group') return 'managerial@mgenesis.com';
  if (rType === 'Director' && dept === 'TASS') return 'director@mgenesis.com';
  if (rType === 'Executive' && dept === 'Business Solutions Manager') return 'executive@mgenesis.com';
  return undefined;
}

/**
 * A real Microsoft Forms submission only exists once every question on the
 * form has been answered (N/A is still an answer). So each simulated
 * "submission" here answers every question that applies to its survey
 * type, for one company, in one sitting - mirroring generateLiveSubmission
 * below. This guarantees that any company with at least one submission has
 * every section represented on the radar chart; a section can only go
 * missing there if every question in it happened to be rated N/A, which is
 * astronomically unlikely across a handful of submissions.
 */
export function generateMockResponses(): SurveyResponse[] {
  const rows: SurveyResponse[] = [];
  let submissionIndex = 0;

  (Object.keys(companiesByType) as SurveyType[]).forEach((surveyType) => {
    const applicableQuestions = surveyQuestions.filter((q) => q.surveyTypes.includes(surveyType));

    companiesByType[surveyType].forEach((company, companyIndex) => {
      const companySeed = companyIndex * 31 + surveyType.length * 7;
      const submissionCount = 3 + Math.floor(seededRandom(companySeed + 3) * 4); // 3-6 submissions per company

      for (let s = 0; s < submissionCount; s += 1) {
        submissionIndex += 1;
        const seedBase = submissionIndex * 97 + companyIndex * 13 + s * 5;
        const rType = pick(respondentTypes, seedBase + 13);
        const dept = pick(departments, seedBase + 45);
        const respondentEmail = respondentEmailFor(rType, dept);
        const submissionDate = dateForIndex(submissionIndex);

        applicableQuestions.forEach((question, questionIndex) => {
          const seed = seedBase + questionIndex * 17 + question.questionNumber;
          const rating = weightedRating(seed, surveyType, question.questionNumber);

          rows.push({
            responseId: `SP-${String(rows.length + 1).padStart(5, '0')}`,
            surveyType,
            respondentType: rType,
            submissionDate,
            company,
            department: dept,
            questionId: question.questionId,
            questionNumber: question.questionNumber,
            question: question.question,
            questionCategory: question.questionCategory,
            rating,
            comment: commentForRating(rating, seed + 111),
            respondentEmail,
          });
        });
      }
    });
  });

  return rows;
}

let liveSubmissionCounter = 0;

/**
 * Simulates a single new respondent completing the survey right now.
 * Produces one SurveyResponse row per applicable question, all sharing
 * the same respondent/company/timestamp - mirroring a real form submission.
 */
export function generateLiveSubmission(): SurveyResponse[] {
  liveSubmissionCounter += 1;
  const batchSeed = Date.now() + liveSubmissionCounter;

  const surveyType = surveyTypes[Math.floor(Math.random() * surveyTypes.length)];
  const applicableQuestions = surveyQuestions.filter((question) => question.surveyTypes.includes(surveyType));
  const company = companies[Math.floor(Math.random() * companies.length)];
  const respondentType = respondentTypes[Math.floor(Math.random() * respondentTypes.length)];
  const department = departments[Math.floor(Math.random() * departments.length)];
  const submissionDate = new Date().toISOString();

  return applicableQuestions.map((question, questionIndex) => {
    const seed = batchSeed + questionIndex * 17;
    const rating = weightedRating(seed, surveyType, question.questionNumber);

    return {
      responseId: `SP-LIVE-${batchSeed}-${questionIndex}`,
      surveyType,
      respondentType,
      submissionDate,
      company,
      department,
      questionId: question.questionId,
      questionNumber: question.questionNumber,
      question: question.question,
      questionCategory: question.questionCategory,
      rating,
      comment: commentForRating(rating, seed + 3),
    };
  });
}
