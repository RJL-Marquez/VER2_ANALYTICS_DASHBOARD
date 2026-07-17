import { CustomForm, PartnerCompany, SurveyResponse, SurveyType } from '../types/survey';

export interface EmployeeNotification {
  id: string;
  surveyId: string;
  surveyTitle: string;
  surveyType: SurveyType;
  sender: string;
  subject: string;
  deadlineDate: string;
  pendingCompanies: PartnerCompany[];
  createdAt: string;
}

export function getEmployeePendingSurveys(
  userEmail: string | null,
  profile: { department: string; designation: string; role: string } | null,
  surveys: CustomForm[],
  partnerCompanies: PartnerCompany[],
  responses: SurveyResponse[]
): EmployeeNotification[] {
  if (!userEmail || !profile || profile.role === 'Admin') {
    return [];
  }

  // Filter for active (running or un-set status) surveys
  const activeSurveys = surveys.filter(
    (s) => s.status !== 'Archived' && s.status !== 'Paused' && s.status !== 'Completed'
  );

  const pendingReminders: EmployeeNotification[] = [];

  activeSurveys.forEach((survey) => {
    // Check Department & Role Access limits for this specific survey form
    const allowsDepartment = !survey.accessDepartments?.length || survey.accessDepartments.includes(profile.department);
    const allowsRole = !survey.accessRoles?.length || survey.accessRoles.includes(profile.designation as any);

    if (!allowsDepartment || !allowsRole) {
      return; // No access to this survey
    }

    // Find all partner companies of this survey's type
    const matchingCompanies = partnerCompanies.filter((c) => c.type === survey.surveyType);

    // Filter out the companies that the user has already evaluated for this survey type
    const userEvaluatedCompanyNames = new Set(
      responses
        .filter(
          (r) =>
            r.respondentEmail &&
            r.respondentEmail.trim().toLowerCase() === userEmail.trim().toLowerCase() &&
            r.surveyType === survey.surveyType
        )
        .map((r) => r.company.trim().toLowerCase())
    );

    const pendingCompanies = matchingCompanies.filter(
      (c) => !userEvaluatedCompanyNames.has(c.name.trim().toLowerCase())
    );

    // If there is at least one partner company remaining to be evaluated, trigger a notification!
    if (pendingCompanies.length > 0) {
      // Format deadline or use fallback
      const deadline = survey.deadlineDate || 'the end of the current evaluation cycle';

      // We use the survey's creation date or fallback to a standard relative date for the reminder
      const createdAt = survey.createdAt || new Date().toISOString();

      pendingReminders.push({
        id: `reminder-${survey.id}`,
        surveyId: survey.id,
        surveyTitle: survey.title,
        surveyType: survey.surveyType,
        sender: 'admin@mgenesis.com',
        subject: 'REMINDER - Survey Accomplishment',
        deadlineDate: deadline,
        pendingCompanies,
        createdAt,
      });
    }
  });

  return pendingReminders;
}
