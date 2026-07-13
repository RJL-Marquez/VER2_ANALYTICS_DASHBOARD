import { useEffect, useMemo, useState } from 'react';
import { sharePointService } from '../services/sharepointService';
import { QuestionDefinition, SurveyResponse, SurveyType } from '../types/survey';

export function useSurveyData() {
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [surveyTypes, setSurveyTypes] = useState<SurveyType[]>([]);
  const [questions, setQuestions] = useState<QuestionDefinition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        setIsLoading(true);
        const [nextResponses, nextSurveyTypes, nextQuestions] = await Promise.all([
          sharePointService.getResponses(),
          sharePointService.getSurveyTypes(),
          sharePointService.getQuestions(),
        ]);

        if (isMounted) {
          setResponses(nextResponses);
          setSurveyTypes(nextSurveyTypes);
          setQuestions(nextQuestions);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError instanceof Error ? loadError.message : 'Unable to load survey data.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  const companies = useMemo(() => [...new Set(responses.map((response) => response.company))].sort(), [responses]);

  return { responses, surveyTypes, questions, companies, isLoading, error };
}
