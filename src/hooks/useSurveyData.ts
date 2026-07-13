import { useEffect, useMemo, useRef, useState } from 'react';
import { sharePointService } from '../services/sharepointService';
import { QuestionDefinition, ResponseNotification, SurveyResponse, SurveyType } from '../types/survey';

const NOTIFICATION_HISTORY_LIMIT = 200;
const INITIAL_NOTIFICATION_SEED = 15;
const SIMULATION_INTERVAL_MS = 25000;

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

export function useSurveyData() {
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [surveyTypes, setSurveyTypes] = useState<SurveyType[]>([]);
  const [questions, setQuestions] = useState<QuestionDefinition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<ResponseNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    async function loadData() {
      try {
        setIsLoading(true);
        const [nextResponses, nextSurveyTypes, nextQuestions] = await Promise.all([
          sharePointService.getResponses(),
          sharePointService.getSurveyTypes(),
          sharePointService.getQuestions(),
        ]);

        if (isMountedRef.current) {
          setResponses(nextResponses);
          setSurveyTypes(nextSurveyTypes);
          setQuestions(nextQuestions);

          const seeded = [...nextResponses]
            .sort((left, right) => right.submissionDate.localeCompare(left.submissionDate))
            .slice(0, INITIAL_NOTIFICATION_SEED)
            .map((row) => toNotification([row]))
            .filter((item): item is ResponseNotification => item !== null);
          setNotifications(seeded);
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

    loadData();

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Periodically simulate a new respondent completing the form, and surface it as a notification.
  useEffect(() => {
    if (isLoading || error || !sharePointService.simulateNewSubmission) return;

    const interval = setInterval(async () => {
      const simulate = sharePointService.simulateNewSubmission;
      if (!simulate || !isMountedRef.current) return;

      const newRows = await simulate();
      if (!isMountedRef.current || !newRows.length) return;

      setResponses((current) => [...current, ...newRows]);

      const notification = toNotification(newRows);
      if (notification) {
        setNotifications((current) => [notification, ...current].slice(0, NOTIFICATION_HISTORY_LIMIT));
        setUnreadCount((count) => count + 1);
      }
    }, SIMULATION_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [isLoading, error]);

  const markNotificationsRead = () => setUnreadCount(0);

  const companies = useMemo(() => [...new Set(responses.map((response) => response.company))].sort(), [responses]);

  return {
    responses,
    surveyTypes,
    questions,
    companies,
    isLoading,
    error,
    notifications,
    unreadCount,
    markNotificationsRead,
  };
}
