import { useEffect, useMemo, useRef, useState } from 'react';
import { sharePointService } from '../services/sharepointService';
import { QuestionDefinition, ResponseNotification, SurveyResponse, SurveyType, CustomForm, Rating, PartnerCompany } from '../types/survey';
import { surveyQuestions } from '../data/questions';
import { generateMockResponses } from '../data/mockResponses';

const NOTIFICATION_HISTORY_LIMIT = 200;
const INITIAL_NOTIFICATION_SEED = 15;

function toNotification(rows: SurveyResponse[]): ResponseNotification | null {
  const first = rows[0];
  if (!first) return null;
  return {
    id: first.responseId,
    company: first.company,
    surveyType: first.surveyType,
    respondentType: first.respondentType,
    submissionDate: first.submissionDate,
    questionCount: rows.length,
  };
}

// Group responses by responseId to create proper individual notifications
function groupResponsesToNotifications(allResponses: SurveyResponse[]): ResponseNotification[] {
  const grouped: Record<string, SurveyResponse[]> = {};
  allResponses.forEach((r) => {
    if (!grouped[r.responseId]) {
      grouped[r.responseId] = [];
    }
    grouped[r.responseId].push(r);
  });

  return Object.values(grouped)
    .map((rows) => toNotification(rows))
    .filter((item): item is ResponseNotification => item !== null)
    .sort((a, b) => b.submissionDate.localeCompare(a.submissionDate));
}

export function useSurveyData() {
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [surveys, setSurveys] = useState<CustomForm[]>([]);
  const [partnerCompanies, setPartnerCompanies] = useState<PartnerCompany[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<ResponseNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const isMountedRef = useRef(true);

  // Initialize and load surveys & responses
  useEffect(() => {
    isMountedRef.current = true;

    function initData() {
      try {
        setIsLoading(true);

        // 1. Handle Surveys (Forms)
        let loadedSurveys: CustomForm[] = [];
        const savedSurveys = localStorage.getItem('survey_analytics_surveys');
        if (savedSurveys) {
          loadedSurveys = JSON.parse(savedSurveys);
        } else {
          // Create 3 standard default surveys based on initial static questions
          const contractorQuestions = surveyQuestions
            .filter((q) => q.surveyTypes.includes('Contractor'))
            .map((q) => ({
              questionId: q.questionId,
              questionNumber: q.questionNumber,
              question: q.question,
              questionCategory: q.questionCategory,
            }));
          const supplierQuestions = surveyQuestions
            .filter((q) => q.surveyTypes.includes('Supplier'))
            .map((q) => ({
              questionId: q.questionId,
              questionNumber: q.questionNumber,
              question: q.question,
              questionCategory: q.questionCategory,
            }));
          const subcontractorQuestions = surveyQuestions
            .filter((q) => q.surveyTypes.includes('Subcontractor'))
            .map((q) => ({
              questionId: q.questionId,
              questionNumber: q.questionNumber,
              question: q.question,
              questionCategory: q.questionCategory,
            }));

          loadedSurveys = [
            {
              id: 'default-contractor',
              title: 'Contractor Satisfaction Survey',
              surveyType: 'Contractor',
              description: 'Standard satisfaction reporting for external courier and logistics contractors.',
              createdAt: new Date('2025-01-01T08:00:00Z').toISOString(),
              questions: contractorQuestions,
            },
            {
              id: 'default-supplier',
              title: 'Supplier Quality Survey',
              surveyType: 'Supplier',
              description: 'Product quality and commercial terms assessment for inventory suppliers.',
              createdAt: new Date('2025-01-01T08:00:00Z').toISOString(),
              questions: supplierQuestions,
            },
            {
              id: 'default-subcontractor',
              title: 'Subcontractor Performance Survey',
              surveyType: 'Subcontractor',
              description: 'On-site execution, compliance, and schedule feedback for active subcontractors.',
              createdAt: new Date('2025-01-01T08:00:00Z').toISOString(),
              questions: subcontractorQuestions,
            },
          ];
          localStorage.setItem('survey_analytics_surveys', JSON.stringify(loadedSurveys));
        }

        // 2. Handle Partner Companies
        let loadedCompanies: PartnerCompany[] = [];
        const savedCompanies = localStorage.getItem('survey_analytics_partner_companies');
        if (savedCompanies) {
          loadedCompanies = JSON.parse(savedCompanies);
        } else {
          loadedCompanies = [
            { id: 'pc-1', name: 'Apex Buildworks', type: 'Contractor', affiliation: 'Core Logistics', createdAt: new Date('2025-01-01T08:00:00Z').toISOString() },
            { id: 'pc-2', name: 'Northstar Materials', type: 'Supplier', affiliation: 'Raw Materials', createdAt: new Date('2025-01-01T08:00:00Z').toISOString() },
            { id: 'pc-3', name: 'BluePeak Industrial', type: 'Subcontractor', affiliation: 'Heavy Machinery', createdAt: new Date('2025-01-01T08:00:00Z').toISOString() },
            { id: 'pc-4', name: 'CivicLine Contractors', type: 'Contractor', affiliation: 'Civil Engineering', createdAt: new Date('2025-01-01T08:00:00Z').toISOString() },
            { id: 'pc-5', name: 'MetroGrid Services', type: 'Subcontractor', affiliation: 'MEP Infrastructure', createdAt: new Date('2025-01-01T08:00:00Z').toISOString() },
            { id: 'pc-6', name: 'HarborPoint Supply', type: 'Supplier', affiliation: 'Pipes & Fittings', createdAt: new Date('2025-01-01T08:00:00Z').toISOString() },
            { id: 'pc-7', name: 'Summit Electrical', type: 'Subcontractor', affiliation: 'Electrical Systems', createdAt: new Date('2025-01-01T08:00:00Z').toISOString() },
            { id: 'pc-8', name: 'PrimeAxis Logistics', type: 'Contractor', affiliation: 'Fleet Management', createdAt: new Date('2025-01-01T08:00:00Z').toISOString() },
            { id: 'pc-9', name: 'Greenfield Mechanical', type: 'Subcontractor', affiliation: 'HVAC Services', createdAt: new Date('2025-01-01T08:00:00Z').toISOString() },
            { id: 'pc-10', name: 'Keystone Fabrication', type: 'Supplier', affiliation: 'Steel & Rebar', createdAt: new Date('2025-01-01T08:00:00Z').toISOString() },
            { id: 'pc-11', name: 'Orbit Safety Group', type: 'Contractor', affiliation: 'HSE Auditing', createdAt: new Date('2025-01-01T08:00:00Z').toISOString() },
            { id: 'pc-12', name: 'BrightPath Engineering', type: 'Supplier', affiliation: 'Lighting & Smart Tech', createdAt: new Date('2025-01-01T08:00:00Z').toISOString() },
          ];
          localStorage.setItem('survey_analytics_partner_companies', JSON.stringify(loadedCompanies));
        }

        // 3. Handle Responses
        let loadedResponses: SurveyResponse[] = [];
        const savedResponses = localStorage.getItem('survey_analytics_responses');
        if (savedResponses) {
          loadedResponses = JSON.parse(savedResponses);
        } else {
          loadedResponses = generateMockResponses();
          localStorage.setItem('survey_analytics_responses', JSON.stringify(loadedResponses));
        }

        if (isMountedRef.current) {
          setSurveys(loadedSurveys);
          setPartnerCompanies(loadedCompanies);
          setResponses(loadedResponses);

          const groupedNotifs = groupResponsesToNotifications(loadedResponses);
          setNotifications(groupedNotifs.slice(0, INITIAL_NOTIFICATION_SEED));
        }
      } catch (loadError) {
        if (isMountedRef.current) {
          setError(loadError instanceof Error ? loadError.message : 'Unable to load survey data.');
        }
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      }
    }

    initData();

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Create a new survey form
  const createSurvey = (newForm: Omit<CustomForm, 'id' | 'createdAt'>) => {
    const id = `survey-${Date.now()}`;
    const createdAt = new Date().toISOString();
    const surveyWithId: CustomForm = {
      ...newForm,
      id,
      createdAt,
    };

    const updatedSurveys = [surveyWithId, ...surveys];
    setSurveys(updatedSurveys);
    localStorage.setItem('survey_analytics_surveys', JSON.stringify(updatedSurveys));
    return surveyWithId;
  };

  // Delete a survey form
  const deleteSurvey = (surveyId: string) => {
    const updatedSurveys = surveys.filter((s) => s.id !== surveyId);
    setSurveys(updatedSurveys);
    localStorage.setItem('survey_analytics_surveys', JSON.stringify(updatedSurveys));

    // Also optionally clean up custom responses submitted specifically to this survey?
    // Let's filter out responses that match the deleted survey's questions and aren't default ones.
    // However, to be safe, let's keep responses unless specifically wanted, or just clean them up.
    // Actually, cleaning them up keeps analytics clean! Let's do it if we want, or keep it simple.
  };

  // Submit a survey response
  const submitResponse = (
    surveyId: string,
    company: string,
    department: string,
    respondentType: string,
    answers: { questionId: string; questionNumber: number; question: string; questionCategory: string; rating: Rating; comment: string }[]
  ) => {
    const targetSurvey = surveys.find((s) => s.id === surveyId);
    if (!targetSurvey) return null;

    const responseId = `RESP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const submissionDate = new Date().toISOString();

    const newResponses: SurveyResponse[] = answers.map((ans) => ({
      responseId,
      surveyType: targetSurvey.surveyType,
      respondentType,
      submissionDate,
      company,
      department,
      questionId: ans.questionId,
      questionNumber: ans.questionNumber,
      question: ans.question,
      questionCategory: ans.questionCategory,
      rating: ans.rating,
      comment: ans.comment || 'Submitted successfully.',
    }));

    const updatedResponses = [...responses, ...newResponses];
    setResponses(updatedResponses);
    localStorage.setItem('survey_analytics_responses', JSON.stringify(updatedResponses));

    // Add notification
    const notification = toNotification(newResponses);
    if (notification) {
      setNotifications((current) => [notification, ...current].slice(0, NOTIFICATION_HISTORY_LIMIT));
      setUnreadCount((count) => count + 1);
    }

    return responseId;
  };

  // Create or add a partner company
  const addPartnerCompany = (name: string, type: SurveyType, affiliation?: string) => {
    const newCompany: PartnerCompany = {
      id: `pc-${Date.now()}`,
      name: name.trim(),
      type,
      affiliation: affiliation?.trim() || 'General partner',
      createdAt: new Date().toISOString(),
    };
    const updated = [...partnerCompanies, newCompany];
    setPartnerCompanies(updated);
    localStorage.setItem('survey_analytics_partner_companies', JSON.stringify(updated));
    return newCompany;
  };

  // Remove a partner company
  const removePartnerCompany = (id: string) => {
    const updated = partnerCompanies.filter((c) => c.id !== id);
    setPartnerCompanies(updated);
    localStorage.setItem('survey_analytics_partner_companies', JSON.stringify(updated));
  };

  // Reset to initial mock data state
  const resetAllData = () => {
    localStorage.removeItem('survey_analytics_surveys');
    localStorage.removeItem('survey_analytics_responses');
    localStorage.removeItem('survey_analytics_partner_companies');
    window.location.reload();
  };

  const markNotificationsRead = () => setUnreadCount(0);

  // Derive unique active survey types (Contractor, Supplier, Subcontractor)
  const surveyTypes = useMemo<SurveyType[]>(() => {
    return ['Contractor', 'Supplier', 'Subcontractor'];
  }, []);

  // Derive list of all questions across all surveys
  const questions = useMemo<QuestionDefinition[]>(() => {
    // Generate standard definitions from currently loaded surveys
    const questionMap: Record<string, QuestionDefinition> = {};
    surveys.forEach((survey) => {
      survey.questions.forEach((q) => {
        if (!questionMap[q.questionId]) {
          questionMap[q.questionId] = {
            questionId: q.questionId,
            questionNumber: q.questionNumber,
            question: q.question,
            questionCategory: q.questionCategory,
            surveyTypes: [],
          };
        }
        if (!questionMap[q.questionId].surveyTypes.includes(survey.surveyType)) {
          questionMap[q.questionId].surveyTypes.push(survey.surveyType);
        }
      });
    });
    return Object.values(questionMap).sort((a, b) => a.questionNumber - b.questionNumber);
  }, [surveys]);

  const companies = useMemo(() => {
    return partnerCompanies.map((c) => c.name).sort();
  }, [partnerCompanies]);

  return {
    responses,
    surveys,
    surveyTypes,
    questions,
    companies,
    partnerCompanies,
    addPartnerCompany,
    removePartnerCompany,
    isLoading,
    error,
    notifications,
    unreadCount,
    markNotificationsRead,
    createSurvey,
    deleteSurvey,
    submitResponse,
    resetAllData,
  };
}

