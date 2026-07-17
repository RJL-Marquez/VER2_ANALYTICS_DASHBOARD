import { useEffect, useMemo, useRef, useState } from 'react';
import { sharePointService } from '../services/sharepointService';
import { QuestionDefinition, ResponseNotification, SurveyResponse, SurveyType, CustomForm, Rating, PartnerCompany } from '../types/survey';
import { surveyQuestions } from '../data/questions';
import { generateMockResponses, generateAllMockResponses, generateSingleMockResponse, generateBulkMockResponses } from '../data/mockResponses';

const NOTIFICATION_HISTORY_LIMIT = 200;
const INITIAL_NOTIFICATION_SEED = 15;
const ALL_DEPARTMENTS = [
  'Accounts Payable - Trade',
  'Business Solutions Manager',
  'Executive Office',
  'Logistics',
  'Procurement Group',
  'TASS'
];
const ALL_SURVEY_ACCESS_ROLES = ['Rank & File', 'Supervisory', 'Managerial', 'Director', 'Executive'] as const;

function normalizeSurveyType(value: unknown): SurveyType {
  if (value === 'Contractor') return 'Courier';
  if (value === 'Courier' || value === 'Supplier' || value === 'Subcontractor') return value;
  return 'Courier';
}

function normalizeCustomForm(form: CustomForm): CustomForm {
  return {
    ...form,
    surveyType: normalizeSurveyType(form.surveyType),
    accessDepartments: form.accessDepartments?.length ? form.accessDepartments : ALL_DEPARTMENTS,
    accessRoles: form.accessRoles?.length ? form.accessRoles : [...ALL_SURVEY_ACCESS_ROLES],
  };
}

function normalizePartnerCompany(company: PartnerCompany): PartnerCompany {
  return {
    ...company,
    type: normalizeSurveyType(company.type),
  };
}

function normalizeSurveyResponse(response: SurveyResponse): SurveyResponse {
  return {
    ...response,
    surveyType: normalizeSurveyType(response.surveyType),
  };
}

function toNotification(rows: SurveyResponse[]): ResponseNotification | null {
  const first = rows[0];
  if (!first) return null;

  // Determine email
  let email = first.respondentEmail;
  if (!email) {
    const cleanType = first.respondentType.toLowerCase();
    if (cleanType.includes('rank') || cleanType.includes('file')) {
      email = 'miguel.santos@mgenesis.com';
    } else if (cleanType.includes('super')) {
      email = 'denise.aquino@mgenesis.com';
    } else if (cleanType.includes('manag')) {
      email = 'angela.reyes@mgenesis.com';
    } else if (cleanType.includes('direct')) {
      email = 'patricia.navarro@mgenesis.com';
    } else if (cleanType.includes('exec')) {
      email = 'rafael.concepcion@mgenesis.com';
    } else {
      email = 'miguel.santos@mgenesis.com';
    }
  }

  // Determine designation
  let designation = first.respondentType;
  const normalized = email.trim().toLowerCase();
  if (normalized === 'admin@mgenesis.com') designation = 'Executive';
  else if (normalized === 'miguel.santos@mgenesis.com') designation = 'Rank & File';
  else if (normalized === 'denise.aquino@mgenesis.com') designation = 'Supervisory';
  else if (normalized === 'angela.reyes@mgenesis.com') designation = 'Managerial';
  else if (normalized === 'patricia.navarro@mgenesis.com') designation = 'Director';
  else if (normalized === 'rafael.concepcion@mgenesis.com') designation = 'Executive';

  return {
    id: first.responseId,
    company: first.company,
    surveyType: first.surveyType,
    respondentType: first.respondentType,
    submissionDate: first.submissionDate,
    questionCount: rows.length,
    respondentEmail: email,
    department: first.department || 'Logistics',
    designation: designation,
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

// Fallback synthetic pool used only if no accounts are supplied to the hook
// (e.g. very first render before account state is available). In normal
// operation this is fully replaced by the live account roster below.
const FALLBACK_NON_ADMIN_USERS = [
  { rType: 'Rank & File', dept: 'Logistics', email: 'miguel.santos@mgenesis.com' },
  { rType: 'Supervisory', dept: 'Logistics', email: 'denise.aquino@mgenesis.com' },
  { rType: 'Managerial', dept: 'Procurement Group', email: 'angela.reyes@mgenesis.com' },
  { rType: 'Director', dept: 'TASS', email: 'patricia.navarro@mgenesis.com' },
  { rType: 'Executive', dept: 'Executive Office', email: 'rafael.concepcion@mgenesis.com' }
];

// Minimal shape needed from an account record — kept structural (not imported
// from App.tsx) to avoid a circular import between the hook and the app shell.
export interface SimulatableAccount {
  email: string;
  role: string;
  designation: string;
  department: string;
}

export function useSurveyData(accounts: SimulatableAccount[] = []) {
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [surveys, setSurveys] = useState<CustomForm[]>([]);
  const [partnerCompanies, setPartnerCompanies] = useState<PartnerCompany[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<ResponseNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isFullDatasetActive, setIsFullDatasetActive] = useState(() => {
    return localStorage.getItem('survey_analytics_full_dataset_active') === 'true';
  });
  const isMountedRef = useRef(true);

  // Initialize and load surveys & responses
  useEffect(() => {
    isMountedRef.current = true;

    function initData() {
      try {
        setIsLoading(true);

        // 1. Handle Surveys (Forms)
        let loadedSurveys: CustomForm[] = [];
        const savedSurveys = localStorage.getItem('survey_analytics_surveys_v6');
        if (savedSurveys) {
          loadedSurveys = JSON.parse(savedSurveys).map(normalizeCustomForm);
          localStorage.setItem('survey_analytics_surveys_v6', JSON.stringify(loadedSurveys));
        } else {
          // Create 3 standard default surveys based on initial static questions
          const contractorQuestions = [
            {
              questionId: 'Q-CON-03',
              questionNumber: 1,
              question: 'Period Covered',
              questionCategory: 'General',
              section: 'SECTION 2',
              inputType: 'select' as const,
              options: [
                '1st Half',
                '2nd Half',
                'Annual'
              ]
            },
            {
              questionId: 'Q-CON-04',
              questionNumber: 2,
              question: 'Does the courier consistently deliver our goods to our customers on the agreed date or period?',
              questionCategory: 'Delivery',
              section: 'SECTION 2: Reliability/Delivery (30 points)',
              inputType: 'typed-rating' as const,
              validationRange: { min: 0, max: 15, allowNa: true }
            },
            {
              questionId: 'Q-CON-05',
              questionNumber: 5,
              question: 'Does the courier service maintain a consistent level of acceptable service over time?',
              questionCategory: 'Delivery',
              section: 'SECTION 2: Reliability/Delivery (30 points)',
              inputType: 'typed-rating' as const,
              validationRange: { min: 0, max: 15, allowNa: true }
            },
            {
              questionId: 'Q-CON-06',
              questionNumber: 6,
              question: 'Please provide any additional comments on Reliability and Delivery performance.',
              questionCategory: 'Delivery',
              section: 'SECTION 2: Reliability/Delivery (30 points)',
              inputType: 'text' as const
            },
            {
              questionId: 'Q-CON-07',
              questionNumber: 7,
              question: "Are the courier's rates competitive and transparent?",
              questionCategory: 'Commercial',
              section: 'SECTION 3: Cost (20 points)',
              inputType: 'typed-rating' as const,
              validationRange: { min: 0, max: 7, allowNa: true }
            },
            {
              questionId: 'Q-CON-08',
              questionNumber: 8,
              question: 'Are there any hidden fees or surcharges?',
              questionCategory: 'Commercial',
              section: 'SECTION 3: Cost (20 points)',
              inputType: 'typed-rating' as const,
              validationRange: { min: 0, max: 7, allowNa: true }
            },
            {
              questionId: 'Q-CON-09',
              questionNumber: 9,
              question: 'Are they offering flexible payment options, e.g., credit cards or invoicing, and payment credit line?',
              questionCategory: 'Commercial',
              section: 'SECTION 3: Cost (20 points)',
              inputType: 'typed-rating' as const,
              validationRange: { min: 0, max: 6, allowNa: true }
            },
            {
              questionId: 'Q-CON-10',
              questionNumber: 10,
              question: 'Please provide any additional comments on Cost and pricing.',
              questionCategory: 'Commercial',
              section: 'SECTION 3: Cost (20 points)',
              inputType: 'text' as const
            },
            {
              questionId: 'Q-CON-11',
              questionNumber: 11,
              question: 'Do they have advanced tracking systems allowing customers for real-time monitoring of the status and location of their packages?',
              questionCategory: 'Technology',
              section: 'SECTION 4: Technology (10 points)',
              inputType: 'typed-rating' as const,
              validationRange: { min: 0, max: 5, allowNa: true }
            },
            {
              questionId: 'Q-CON-12',
              questionNumber: 12,
              question: 'Do they have online platforms and mobile apps provided to customers to schedule pickups, make payments, and arrange deliveries?',
              questionCategory: 'Technology',
              section: 'SECTION 4: Technology (10 points)',
              inputType: 'typed-rating' as const,
              validationRange: { min: 0, max: 5, allowNa: true }
            },
            {
              questionId: 'Q-CON-13',
              questionNumber: 13,
              question: 'Please provide any additional comments on Technology and online tools.',
              questionCategory: 'Technology',
              section: 'SECTION 4: Technology (10 points)',
              inputType: 'text' as const
            },
            {
              questionId: 'Q-CON-14',
              questionNumber: 14,
              question: 'Do they have a helpful and responsive customer support team?',
              questionCategory: 'Support',
              section: 'SECTION 5: Customer Service (25 points)',
              inputType: 'typed-rating' as const,
              validationRange: { min: 0, max: 10, allowNa: true }
            },
            {
              questionId: 'Q-CON-15',
              questionNumber: 15,
              question: "Do they effectively handle the customer's issues, and complaints, e.g., lost shipment, item, defective items?",
              questionCategory: 'Support',
              section: 'SECTION 5: Customer Service (25 points)',
              inputType: 'typed-rating' as const,
              validationRange: { min: 0, max: 10, allowNa: true }
            },
            {
              questionId: 'Q-CON-16',
              questionNumber: 16,
              question: 'Does the courier have a prompt payment process in case of mishandled goods, e.g., broken or missing goods?',
              questionCategory: 'Support',
              section: 'SECTION 5: Customer Service (25 points)',
              inputType: 'typed-rating' as const,
              validationRange: { min: 0, max: 5, allowNa: true }
            },
            {
              questionId: 'Q-CON-17',
              questionNumber: 17,
              question: 'Please provide any additional comments on Customer Service and support.',
              questionCategory: 'Support',
              section: 'SECTION 5: Customer Service (25 points)',
              inputType: 'text' as const
            },
            {
              questionId: 'Q-CON-18',
              questionNumber: 18,
              question: 'Do they ensure the safety and security of our packages/parcels during transit and delivery to the client\'s site?',
              questionCategory: 'Security',
              section: 'SECTION 6: Security (15 points)',
              inputType: 'typed-rating' as const,
              validationRange: { min: 0, max: 5, allowNa: true }
            },
            {
              questionId: 'Q-CON-19',
              questionNumber: 19,
              question: 'Do they include insurance options to cover potential loss or damage to our items?',
              questionCategory: 'Security',
              section: 'SECTION 6: Security (15 points)',
              inputType: 'typed-rating' as const,
              validationRange: { min: 0, max: 10, allowNa: true }
            },
            {
              questionId: 'Q-CON-20',
              questionNumber: 20,
              question: 'Please provide any additional comments on Security and safety.',
              questionCategory: 'Security',
              section: 'SECTION 6: Security (15 points)',
              inputType: 'text' as const
            }
          ];
          const supplierQuestions = [
  {
    "questionId": "Q-SUP-03",
    "questionNumber": 1,
    "question": "Period Covered",
    "questionCategory": "General",
    "section": "SECTION 1",
    "inputType": "select",
    "options": [
      "1st Half",
      "2nd Half",
      "Annual"
    ]
  },
  {
    "questionId": "Q-SUP-05",
    "questionNumber": 2,
    "question": "Does the supplier use the correct documents to facilitate the delivery of sale transaction? (BIR Registered, DR, SI/BS, OR/CR)",
    "questionCategory": "Documentation",
    "section": "Documentation (20 points)",
    "inputType": "typed-rating",
    "validationRange": {
      "min": 0,
      "max": 4,
      "allowNa": true
    }
  },
  {
    "questionId": "Q-SUP-06",
    "questionNumber": 3,
    "question": "Are the required documents complete for every transaction?",
    "questionCategory": "Documentation",
    "section": "Documentation (20 points)",
    "inputType": "typed-rating",
    "validationRange": {
      "min": 0,
      "max": 4,
      "allowNa": true
    }
  },
  {
    "questionId": "Q-SUP-07",
    "questionNumber": 4,
    "question": "Are documents clean, neat and readable?",
    "questionCategory": "Documentation",
    "section": "Documentation (20 points)",
    "inputType": "typed-rating",
    "validationRange": {
      "min": 0,
      "max": 4,
      "allowNa": true
    }
  },
  {
    "questionId": "Q-SUP-08",
    "questionNumber": 5,
    "question": "Are documents presented/submitted upon delivery?",
    "questionCategory": "Documentation",
    "section": "Documentation (20 points)",
    "inputType": "typed-rating",
    "validationRange": {
      "min": 0,
      "max": 4,
      "allowNa": true
    }
  },
  {
    "questionId": "Q-SUP-09",
    "questionNumber": 6,
    "question": "Are documents presented/submitted upon payments?",
    "questionCategory": "Documentation",
    "section": "Documentation (20 points)",
    "inputType": "typed-rating",
    "validationRange": {
      "min": 0,
      "max": 4,
      "allowNa": true
    }
  },
  {
    "questionId": "Q-SUP-10",
    "questionNumber": 7,
    "question": "Documentation Remarks",
    "questionCategory": "Documentation",
    "section": "Documentation (20 points)",
    "inputType": "text"
  },
  {
    "questionId": "Q-SUP-11",
    "questionNumber": 8,
    "question": "Does the supplier deliver the product on time based on the agreed schedule?",
    "questionCategory": "Delivery",
    "section": "Delivery (20 points)",
    "inputType": "typed-rating",
    "validationRange": {
      "min": 0,
      "max": 7,
      "allowNa": true
    }
  },
  {
    "questionId": "Q-SUP-12",
    "questionNumber": 9,
    "question": "Does the supplier deliver the product in proper packaging and in good condition?",
    "questionCategory": "Delivery",
    "section": "Delivery (20 points)",
    "inputType": "typed-rating",
    "validationRange": {
      "min": 0,
      "max": 7,
      "allowNa": true
    }
  },
  {
    "questionId": "Q-SUP-13",
    "questionNumber": 10,
    "question": "Does the supplier deliver the products sealed and safe and free for possible contamination?",
    "questionCategory": "Delivery",
    "section": "Delivery (20 points)",
    "inputType": "typed-rating",
    "validationRange": {
      "min": 0,
      "max": 6,
      "allowNa": true
    }
  },
  {
    "questionId": "Q-SUP-14",
    "questionNumber": 11,
    "question": "Delivery Remarks",
    "questionCategory": "Delivery",
    "section": "Delivery (20 points)",
    "inputType": "text"
  },
  {
    "questionId": "Q-SUP-15",
    "questionNumber": 12,
    "question": "Does the supplier change the price without any notice to MBS Procurement/BSM?",
    "questionCategory": "Price",
    "section": "Price/Cost Effectiveness (20 points)",
    "inputType": "typed-rating",
    "validationRange": {
      "min": 0,
      "max": 6,
      "allowNa": true
    }
  },
  {
    "questionId": "Q-SUP-16",
    "questionNumber": 13,
    "question": "Is the supplier open for negotiation in terms of price?",
    "questionCategory": "Price",
    "section": "Price/Cost Effectiveness (20 points)",
    "inputType": "typed-rating",
    "validationRange": {
      "min": 0,
      "max": 7,
      "allowNa": true
    }
  },
  {
    "questionId": "Q-SUP-17",
    "questionNumber": 14,
    "question": "Is the supplier pricing competitive with other suppliers?",
    "questionCategory": "Price",
    "section": "Price/Cost Effectiveness (20 points)",
    "inputType": "typed-rating",
    "validationRange": {
      "min": 0,
      "max": 7,
      "allowNa": true
    }
  },
  {
    "questionId": "Q-SUP-18",
    "questionNumber": 15,
    "question": "Price/Cost Effectiveness Remarks",
    "questionCategory": "Price",
    "section": "Price/Cost Effectiveness (20 points)",
    "inputType": "text"
  },
  {
    "questionId": "Q-SUP-19",
    "questionNumber": 16,
    "question": "Does the supplier deliver the product with good quality?",
    "questionCategory": "Quality",
    "section": "Quality (20 points)",
    "inputType": "typed-rating",
    "validationRange": {
      "min": 0,
      "max": 7,
      "allowNa": true
    }
  },
  {
    "questionId": "Q-SUP-20",
    "questionNumber": 17,
    "question": "Does the supplier take immediate action for defective product upon delivery/RMA?",
    "questionCategory": "Quality",
    "section": "Quality (20 points)",
    "inputType": "typed-rating",
    "validationRange": {
      "min": 0,
      "max": 6,
      "allowNa": true
    }
  },
  {
    "questionId": "Q-SUP-21",
    "questionNumber": 18,
    "question": "Does the supplier replace the defective product immediately?",
    "questionCategory": "Quality",
    "section": "Quality (20 points)",
    "inputType": "typed-rating",
    "validationRange": {
      "min": 0,
      "max": 7,
      "allowNa": true
    }
  },
  {
    "questionId": "Q-SUP-22",
    "questionNumber": 19,
    "question": "Quality Remarks",
    "questionCategory": "Quality",
    "section": "Quality (20 points)",
    "inputType": "text"
  },
  {
    "questionId": "Q-SUP-23",
    "questionNumber": 20,
    "question": "Do supplier responsive and easy to contact?",
    "questionCategory": "Communication",
    "section": "Communication (20 points)",
    "inputType": "typed-rating",
    "validationRange": {
      "min": 0,
      "max": 7,
      "allowNa": true
    }
  },
  {
    "questionId": "Q-SUP-24",
    "questionNumber": 21,
    "question": "Does the supplier proactively communicate to MBS Representatives in terms of any discrepancy or changes in transaction?",
    "questionCategory": "Communication",
    "section": "Communication (20 points)",
    "inputType": "typed-rating",
    "validationRange": {
      "min": 0,
      "max": 6,
      "allowNa": true
    }
  },
  {
    "questionId": "Q-SUP-25",
    "questionNumber": 22,
    "question": "Does the supplier proactively communicate to MBS Representatives fact-based concern on product/technology?",
    "questionCategory": "Communication",
    "section": "Communication (20 points)",
    "inputType": "typed-rating",
    "validationRange": {
      "min": 0,
      "max": 7,
      "allowNa": true
    }
  },
  {
    "questionId": "Q-SUP-26",
    "questionNumber": 23,
    "question": "Communication Remarks",
    "questionCategory": "Communication",
    "section": "Communication (20 points)",
    "inputType": "text"
  }
];
          const subcontractorQuestions = [
  {
    "questionId": "Q-SUB-01",
    "questionNumber": 1,
    "question": "Project Name",
    "questionCategory": "General",
    "section": "SECTION 1",
    "inputType": "text"
  },
  {
    "questionId": "Q-SUB-02",
    "questionNumber": 2,
    "question": "Products or Services",
    "questionCategory": "General",
    "section": "SECTION 1",
    "inputType": "checkbox",
    "options": [
      "Access Control System",
      "CCTV System",
      "Civil Works",
      "Electrical Works",
      "Fire Suppression System",
      "Mechanical Works",
      "Structured Cabling System",
      "Others"
    ]
  },
  {
    "questionId": "Q-SUB-03",
    "questionNumber": 3,
    "question": "Project Duration",
    "questionCategory": "General",
    "section": "SECTION 1",
    "inputType": "date-range"
  },
  {
    "questionId": "Q-SUB-04",
    "questionNumber": 4,
    "question": "Delivery / Project Timeliness",
    "questionCategory": "Delivery",
    "section": "SECTION 4",
    "inputType": "matrix",
    "subQuestions": [
      {
        "id": "a",
        "label": "Except for circumstances beyond the subcontractor's control, tasks and deliverables were completed on time or ahead of the schedule in the contact.",
        "description": "Always = 2, <2wks late = 1, >2wks late = 0, Not Applicable = N/A",
        "validationRange": {
          "min": 0,
          "max": 2,
          "allowNa": true
        }
      },
      {
        "id": "b",
        "label": "Delivers and use all resources required to the project and turnover all excess materials to MBS Project Manager.",
        "description": "Consistently = 2, Inconsistent = 1, Not at all = 0, Not Applicable = N/A",
        "validationRange": {
          "min": 0,
          "max": 2,
          "allowNa": true
        }
      }
    ]
  },
  {
    "questionId": "Q-SUB-05",
    "questionNumber": 5,
    "question": "Delivery / Project Timeliness Remarks",
    "questionCategory": "Delivery",
    "section": "SECTION 4",
    "inputType": "text"
  },
  {
    "questionId": "Q-SUB-06",
    "questionNumber": 6,
    "question": "Documentation / Invoicing",
    "questionCategory": "Documentation",
    "section": "SECTION 5",
    "inputType": "matrix",
    "subQuestions": [
      {
        "id": "a",
        "label": "The subcontractor's invoices/billing were correct, accurate and contained all information of references.",
        "description": "Always = 2, Limited correction/tolerable = 1, Multiple important corrections/delays = 0, Not Applicable = N/A",
        "validationRange": {
          "min": 0,
          "max": 2,
          "allowNa": true
        }
      },
      {
        "id": "b",
        "label": "All required documents are submitted on time or within the time frames of agreement e.g. Service report, billing, COC, etc.",
        "description": "Very timely = 2, <1 week = 1, >1 week = 0, Not Applicable = N/A",
        "validationRange": {
          "min": 0,
          "max": 2,
          "allowNa": true
        }
      },
      {
        "id": "c",
        "label": "The proposal provides a clear breakdown matched with what MBS requires.",
        "description": "Consistently = 2, Scope inaccurate but no price increase = 1, Incomplete/leads to price increase = 0, Not Applicable = N/A",
        "validationRange": {
          "min": 0,
          "max": 2,
          "allowNa": true
        }
      }
    ]
  },
  {
    "questionId": "Q-SUB-07",
    "questionNumber": 7,
    "question": "Documentation / Invoicing Remarks",
    "questionCategory": "Documentation",
    "section": "SECTION 5",
    "inputType": "text"
  },
  {
    "questionId": "Q-SUB-08",
    "questionNumber": 8,
    "question": "Cost Control / Pricing",
    "questionCategory": "Cost",
    "section": "SECTION 6",
    "inputType": "matrix",
    "subQuestions": [
      {
        "id": "a",
        "label": "Give competitive prices, discount, and reasonable prices.",
        "description": "Yes/accommodate within MBS budget = 2, No = 1, (unused) = 0, Not Applicable = N/A",
        "validationRange": {
          "min": 0,
          "max": 2,
          "allowNa": true
        }
      },
      {
        "id": "b",
        "label": "Request for change of orders for additional works/cost ONLY outside the scope of contract.",
        "description": "Yes = 2, Seldom requests = 1, Does not accommodate = 0",
        "validationRange": {
          "min": 0,
          "max": 2,
          "allowNa": true
        }
      },
      {
        "id": "c",
        "label": "Indication that the subcontractor has financial problem which cannot meet the terms and conditions stated in contract.",
        "description": "Healthy financial position = 2, Liquid for at least <1M = 1, Always needs fund to mobilize project = 0, Not Applicable = N/A",
        "validationRange": {
          "min": 0,
          "max": 2,
          "allowNa": true
        }
      }
    ]
  },
  {
    "questionId": "Q-SUB-09",
    "questionNumber": 9,
    "question": "Cost Control / Pricing Remarks",
    "questionCategory": "Cost",
    "section": "SECTION 6",
    "inputType": "text"
  },
  {
    "questionId": "Q-SUB-10",
    "questionNumber": 10,
    "question": "Quality and Technical Competence",
    "questionCategory": "Quality",
    "section": "SECTION 7",
    "inputType": "matrix",
    "subQuestions": [
      {
        "id": "a",
        "label": "The Subcontractor work products complied with the contract, PO scope of work, rules and applicable program guidance.",
        "description": "Consistently met, no re-work = 2, Mostly met/minor re-work = 1, Substandard = 0, Not Applicable = N/A",
        "validationRange": {
          "min": 0,
          "max": 2,
          "allowNa": true
        }
      },
      {
        "id": "b",
        "label": "The subcontractor performed site assessment tasks efficiently and effectively, proposed cost-effective changes in scope, provided an accurate summary and proposed cost-effective recommendations for future work and course of action.",
        "description": "Consistently = 2, Minor ineffective/inaccurate summary = 1, Summaries had to be re-worked = 0, Not Applicable = N/A",
        "validationRange": {
          "min": 0,
          "max": 2,
          "allowNa": true
        }
      },
      {
        "id": "c",
        "label": "The subcontractor proposed appropriate changes to monitoring points, parameters, and or frequency based on changing site conditions.",
        "description": "Consistently = 2, Minor changes not proposed = 1, Changes not proposed though warranted = 0, Not Applicable = N/A",
        "validationRange": {
          "min": 0,
          "max": 2,
          "allowNa": true
        }
      },
      {
        "id": "d",
        "label": "The remedial action plan adequately and cost-effectively addressed the site conditions.",
        "description": "Always = 2, Minor inconsistent guidelines = 1, Remedial action had to be reworked = 0, Not Applicable = N/A",
        "validationRange": {
          "min": 0,
          "max": 2,
          "allowNa": true
        }
      },
      {
        "id": "e",
        "label": "The subcontractor initiates Certificate of Completion when the project has been done.",
        "description": "Yes = 2, Only when prompted by MBS accounting/PM = 1, Not at all = 0, Not Applicable = N/A",
        "validationRange": {
          "min": 0,
          "max": 2,
          "allowNa": true
        }
      }
    ]
  },
  {
    "questionId": "Q-SUB-11",
    "questionNumber": 11,
    "question": "Quality and Technical Competence Remarks",
    "questionCategory": "Quality",
    "section": "SECTION 7",
    "inputType": "text"
  },
  {
    "questionId": "Q-SUB-12",
    "questionNumber": 12,
    "question": "Communication",
    "questionCategory": "Communication",
    "section": "SECTION 8",
    "inputType": "matrix",
    "subQuestions": [
      {
        "id": "a",
        "label": "The subcontractor communicated and proposed solutions of project changes, problems, delays and issues to MBS representative as they occurred and ahead of deadlines.",
        "description": "Always = 2, Some untimely/less helpful = 1, Problems from untimely/poor comms = 0, Not Applicable = N/A",
        "validationRange": {
          "min": 0,
          "max": 2,
          "allowNa": true
        }
      },
      {
        "id": "b",
        "label": "The subcontractor responded within a reasonable time frame to telephone messages and emails from MBS representative.",
        "description": "Within 2 business days = 2, Within 3-5 days = 1, More than 5 days = 0, Not Applicable = N/A",
        "validationRange": {
          "min": 0,
          "max": 2,
          "allowNa": true
        }
      },
      {
        "id": "c",
        "label": "The subcontractor is professional in their approach, provide assistance whenever needed, courteous and polite.",
        "description": "Always regardless of who = 2, Depends on position = 1, Unprofessional at all times = 0, Not Applicable = N/A",
        "validationRange": {
          "min": 0,
          "max": 2,
          "allowNa": true
        }
      }
    ]
  },
  {
    "questionId": "Q-SUB-13",
    "questionNumber": 13,
    "question": "Communication Remarks",
    "questionCategory": "Communication",
    "section": "SECTION 8",
    "inputType": "text"
  }
];

          loadedSurveys = [
            {
              id: 'default-courier',
              title: 'Courier Satisfaction Survey',
              surveyType: 'Courier',
              description: 'Standard satisfaction reporting for external courier and logistics.',
              createdAt: new Date('2025-01-01T08:00:00Z').toISOString(),
              deadlineDate: '31/12/2026',
              accessDepartments: ALL_DEPARTMENTS,
              accessRoles: [...ALL_SURVEY_ACCESS_ROLES],
              questions: contractorQuestions as any,
            },
            {
              id: 'default-supplier',
              title: 'Supplier Quality Survey',
              surveyType: 'Supplier',
              description: 'Product quality and commercial terms assessment for inventory suppliers.',
              createdAt: new Date('2025-01-01T08:00:00Z').toISOString(),
              deadlineDate: '31/12/2026',
              accessDepartments: ALL_DEPARTMENTS,
              accessRoles: [...ALL_SURVEY_ACCESS_ROLES],
              questions: supplierQuestions as any,
            },
            {
              id: 'default-subcontractor',
              title: 'Subcontractor Performance Survey',
              surveyType: 'Subcontractor',
              description: 'On-site execution, compliance, and schedule feedback for active subcontractors.',
              createdAt: new Date('2025-01-01T08:00:00Z').toISOString(),
              deadlineDate: '31/12/2026',
              accessDepartments: ALL_DEPARTMENTS,
              accessRoles: [...ALL_SURVEY_ACCESS_ROLES],
              questions: subcontractorQuestions as any,
            },
          ];
          localStorage.setItem('survey_analytics_surveys_v6', JSON.stringify(loadedSurveys));
        }

        // 2. Handle Partner Companies
        let loadedCompanies: PartnerCompany[] = [];
        const savedCompanies = localStorage.getItem('survey_analytics_partner_companies_v6');
        if (savedCompanies) {
          loadedCompanies = JSON.parse(savedCompanies).map(normalizePartnerCompany);
          localStorage.setItem('survey_analytics_partner_companies_v6', JSON.stringify(loadedCompanies));
        } else {
          loadedCompanies = [
            // Courier
            { id: 'pc-1', name: 'Airspeed International Corp', type: 'Courier', createdAt: new Date('2025-01-01T08:00:00Z').toISOString() },
            { id: 'pc-2', name: 'Alphacon Logistics International Corp', type: 'Courier', createdAt: new Date('2025-01-01T08:00:00Z').toISOString() },
            { id: 'pc-3', name: 'Cloverxpress Freight Inc', type: 'Courier', createdAt: new Date('2025-01-01T08:00:00Z').toISOString() },
            { id: 'pc-4', name: 'Lite Xpress International Inc', type: 'Courier', createdAt: new Date('2025-01-01T08:00:00Z').toISOString() },
            { id: 'pc-5', name: 'Lucky Charm Express Movers Inc', type: 'Courier', createdAt: new Date('2025-01-01T08:00:00Z').toISOString() },
            { id: 'pc-6', name: 'Road2go Trucking Services OPC', type: 'Courier', createdAt: new Date('2025-01-01T08:00:00Z').toISOString() },
            { id: 'pc-7', name: 'RZ1 Freight Express Corporation', type: 'Courier', createdAt: new Date('2025-01-01T08:00:00Z').toISOString() },
            { id: 'pc-8', name: 'Yello X Supply Chain Solutions', type: 'Courier', createdAt: new Date('2025-01-01T08:00:00Z').toISOString() },
            // Subcontractor
            { id: 'pc-9', name: 'Aimvest Electrical Services', type: 'Subcontractor', createdAt: new Date('2025-01-01T08:00:00Z').toISOString() },
            { id: 'pc-10', name: 'Cara Electrical and Network Solutions Inc', type: 'Subcontractor', createdAt: new Date('2025-01-01T08:00:00Z').toISOString() },
            { id: 'pc-11', name: 'Cgalz Enterprises', type: 'Subcontractor', createdAt: new Date('2025-01-01T08:00:00Z').toISOString() },
            { id: 'pc-12', name: 'Datalec Technology Corporation', type: 'Subcontractor', createdAt: new Date('2025-01-01T08:00:00Z').toISOString() },
            { id: 'pc-13', name: 'Glimpse-DC Electronics Industries Inc', type: 'Subcontractor', createdAt: new Date('2025-01-01T08:00:00Z').toISOString() },
            { id: 'pc-14', name: 'J & C Obenita Construction OPC', type: 'Subcontractor', createdAt: new Date('2025-01-01T08:00:00Z').toISOString() },
            { id: 'pc-15', name: 'L-Gertrude Construction Services', type: 'Subcontractor', createdAt: new Date('2025-01-01T08:00:00Z').toISOString() },
            { id: 'pc-16', name: 'MTeknik Technologies Solutions, Inc', type: 'Subcontractor', createdAt: new Date('2025-01-01T08:00:00Z').toISOString() },
            { id: 'pc-17', name: 'Paragon Electromech Development Corporation', type: 'Subcontractor', createdAt: new Date('2025-01-01T08:00:00Z').toISOString() },
            { id: 'pc-18', name: 'Skyconvergence Inc', type: 'Subcontractor', createdAt: new Date('2025-01-01T08:00:00Z').toISOString() },
            { id: 'pc-19', name: 'Technivision ICT Solutions, Inc', type: 'Subcontractor', createdAt: new Date('2025-01-01T08:00:00Z').toISOString() },
            { id: 'pc-20', name: 'Unikkon Network Philippines Inc', type: 'Subcontractor', createdAt: new Date('2025-01-01T08:00:00Z').toISOString() },
            { id: 'pc-21', name: 'ZIMOSystem Solutions Inc', type: 'Subcontractor', createdAt: new Date('2025-01-01T08:00:00Z').toISOString() },
            // Supplier
            { id: 'pc-22', name: 'VSTECS Phils. Inc', type: 'Supplier', createdAt: new Date('2025-01-01T08:00:00Z').toISOString() },
            { id: 'pc-23', name: 'Wordtext Systems, Inc', type: 'Supplier', createdAt: new Date('2025-01-01T08:00:00Z').toISOString() },
            { id: 'pc-24', name: 'Exclusive Networks-Ph Inc', type: 'Supplier', createdAt: new Date('2025-01-01T08:00:00Z').toISOString() },
            { id: 'pc-25', name: 'Touchstream Digital, Inc', type: 'Supplier', createdAt: new Date('2025-01-01T08:00:00Z').toISOString() },
            { id: 'pc-26', name: 'Bridge Distribution, Inc', type: 'Supplier', createdAt: new Date('2025-01-01T08:00:00Z').toISOString() },
            { id: 'pc-27', name: 'Softwareone Philippines Corporation', type: 'Supplier', createdAt: new Date('2025-01-01T08:00:00Z').toISOString() },
            { id: 'pc-28', name: 'AptSecure Technologies Inc', type: 'Supplier', createdAt: new Date('2025-01-01T08:00:00Z').toISOString() },
            { id: 'pc-29', name: 'Westcon Group Philippines', type: 'Supplier', createdAt: new Date('2025-01-01T08:00:00Z').toISOString() },
            { id: 'pc-30', name: 'M-Security Tech Philippines, Inc', type: 'Supplier', createdAt: new Date('2025-01-01T08:00:00Z').toISOString() },
            { id: 'pc-31', name: 'Banbros Commercial, Incorporated', type: 'Supplier', createdAt: new Date('2025-01-01T08:00:00Z').toISOString() },
            { id: 'pc-32', name: 'Westcon Solutions Philippines Inc', type: 'Supplier', createdAt: new Date('2025-01-01T08:00:00Z').toISOString() },
            { id: 'pc-33', name: 'Ardent Networks Inc', type: 'Supplier', createdAt: new Date('2025-01-01T08:00:00Z').toISOString() },
            { id: 'pc-34', name: 'Mec Computer Corporation', type: 'Supplier', createdAt: new Date('2025-01-01T08:00:00Z').toISOString() },
            { id: 'pc-35', name: 'Streamline Works Inc', type: 'Supplier', createdAt: new Date('2025-01-01T08:00:00Z').toISOString() },
            { id: 'pc-36', name: 'Wyntech Corp', type: 'Supplier', createdAt: new Date('2025-01-01T08:00:00Z').toISOString() },
            { id: 'pc-37', name: 'ACW Distribution (Phils), Inc', type: 'Supplier', createdAt: new Date('2025-01-01T08:00:00Z').toISOString() },
            { id: 'pc-38', name: 'Apuma, March Maanap', type: 'Supplier', createdAt: new Date('2025-01-01T08:00:00Z').toISOString() },
            { id: 'pc-39', name: 'Versatech International Inc', type: 'Supplier', createdAt: new Date('2025-01-01T08:00:00Z').toISOString() },
            { id: 'pc-40', name: 'Sencolink Technologies Inc', type: 'Supplier', createdAt: new Date('2025-01-01T08:00:00Z').toISOString() },
            { id: 'pc-41', name: 'PAX8 Philippines Inc', type: 'Supplier', createdAt: new Date('2025-01-01T08:00:00Z').toISOString() },
          ];
          localStorage.setItem('survey_analytics_partner_companies_v6', JSON.stringify(loadedCompanies));
        }

        // 3. Handle Responses
        if (localStorage.getItem('survey_analytics_v6_cleared_by_agent_final') !== 'true') {
          localStorage.removeItem('survey_analytics_responses');
          localStorage.removeItem('survey_analytics_responses_v4');
          localStorage.removeItem('survey_analytics_responses_v5');
          localStorage.removeItem('survey_analytics_responses_v6');
          localStorage.removeItem('survey_analytics_full_dataset_active');
          localStorage.setItem('survey_analytics_v6_cleared_by_agent_final', 'true');
        }

        let loadedResponses: SurveyResponse[] = [];
        const savedResponses = localStorage.getItem('survey_analytics_responses_v6');
        if (savedResponses) {
          loadedResponses = JSON.parse(savedResponses).map(normalizeSurveyResponse);
          localStorage.setItem('survey_analytics_responses_v6', JSON.stringify(loadedResponses));
        } else {
          loadedResponses = [];
          localStorage.setItem('survey_analytics_responses_v6', JSON.stringify([]));
          localStorage.setItem('survey_analytics_full_dataset_active', 'false');
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
      ...normalizeCustomForm(newForm as CustomForm),
      id,
      createdAt,
    };

    const updatedSurveys = [surveyWithId, ...surveys];
    setSurveys(updatedSurveys);
    localStorage.setItem('survey_analytics_surveys_v6', JSON.stringify(updatedSurveys));
    return surveyWithId;
  };

  // Update an existing survey form
  const updateSurvey = (updatedForm: CustomForm) => {
    const normalizedForm = normalizeCustomForm(updatedForm);
    setSurveys((currentSurveys) => {
      const updated = currentSurveys.map((s) => s.id === normalizedForm.id ? normalizedForm : s);
      localStorage.setItem('survey_analytics_surveys_v6', JSON.stringify(updated));
      return updated;
    });
    return normalizedForm;
  };

  // Bulk update multiple survey forms simultaneously to prevent React state batching overwrites
  const updateSurveysBulk = (updatedSurveysList: CustomForm[]) => {
    const map = new Map(updatedSurveysList.map((s) => [s.id, normalizeCustomForm(s)]));
    setSurveys((currentSurveys) => {
      const updated = currentSurveys.map((s) => map.has(s.id) ? map.get(s.id)! : s);
      localStorage.setItem('survey_analytics_surveys_v6', JSON.stringify(updated));
      return updated;
    });
  };

  // Delete a survey form
  const deleteSurvey = (surveyId: string) => {
    const updatedSurveys = surveys.filter((s) => s.id !== surveyId);
    setSurveys(updatedSurveys);
    localStorage.setItem('survey_analytics_surveys_v6', JSON.stringify(updatedSurveys));

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
    address: string | undefined,
    answers: { questionId: string; questionNumber: number; question: string; questionCategory: string; rating: Rating; comment: string }[],
    respondentEmail?: string
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
      address,
      questionId: ans.questionId,
      questionNumber: ans.questionNumber,
      question: ans.question,
      questionCategory: ans.questionCategory,
      rating: ans.rating,
      comment: ans.comment || 'Submitted successfully.',
      respondentEmail,
    }));

    const updatedResponses = [...responses, ...newResponses];
    setResponses(updatedResponses);
    localStorage.setItem('survey_analytics_responses_v6', JSON.stringify(updatedResponses));

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
    localStorage.setItem('survey_analytics_partner_companies_v6', JSON.stringify(updated));
    return newCompany;
  };

  // Remove a partner company
  const removePartnerCompany = (id: string) => {
    const updated = partnerCompanies.filter((c) => c.id !== id);
    setPartnerCompanies(updated);
    localStorage.setItem('survey_analytics_partner_companies_v6', JSON.stringify(updated));
  };

  // Reset to initial mock data state
  const resetAllData = () => {
    localStorage.removeItem('survey_analytics_surveys');
    localStorage.removeItem('survey_analytics_surveys_v4');
    localStorage.removeItem('survey_analytics_surveys_v5');
    localStorage.removeItem('survey_analytics_surveys_v6');
    localStorage.removeItem('survey_analytics_responses');
    localStorage.removeItem('survey_analytics_responses_v4');
    localStorage.removeItem('survey_analytics_responses_v5');
    localStorage.removeItem('survey_analytics_responses_v6');
    localStorage.removeItem('survey_analytics_partner_companies_v4');
    localStorage.removeItem('survey_analytics_partner_companies_v5');
    localStorage.removeItem('survey_analytics_partner_companies_v6');
    localStorage.removeItem('survey_analytics_full_dataset_active');
    window.location.reload();
  };

  // Every non-admin account currently registered in the system becomes part
  // of the synthetic respondent pool used by the Database Simulator. This
  // means the pool automatically grows or shrinks as accounts are added or
  // removed in Account Management — no hardcoded headcount to maintain.
  const NON_ADMIN_USERS = useMemo(() => {
    const derived = accounts
      .filter((a) => a.role !== 'Admin')
      .map((a) => ({ rType: a.designation, dept: a.department, email: a.email }));
    return derived.length > 0 ? derived : FALLBACK_NON_ADMIN_USERS;
  }, [accounts]);

  const BULK_BATCH_SIZE = 15;

  // Single unified entry point for the admin "Add Evaluation" test tool.
  // - single: adds one random evaluation on top of whatever already exists.
  // - bulk: adds a batch of random evaluations on top of whatever already exists.
  // - complete: replaces all responses with a fully-covered dataset where every
  //   non-admin employee has evaluated every registered company.
  const addEvaluations = (mode: 'single' | 'bulk' | 'complete') => {
    if (mode === 'complete') {
      const fullRows = generateAllMockResponses(surveys, partnerCompanies, NON_ADMIN_USERS);
      setResponses(fullRows);
      localStorage.setItem('survey_analytics_responses_v6', JSON.stringify(fullRows));

      const groupedNotifs = groupResponsesToNotifications(fullRows);
      setNotifications(groupedNotifs.slice(0, NOTIFICATION_HISTORY_LIMIT));
      setUnreadCount(0);
      setIsFullDatasetActive(true);
      localStorage.setItem('survey_analytics_full_dataset_active', 'true');
      return;
    }

    const newRows =
      mode === 'bulk'
        ? generateBulkMockResponses(BULK_BATCH_SIZE, surveys, partnerCompanies, NON_ADMIN_USERS)
        : generateSingleMockResponse(surveys, partnerCompanies, NON_ADMIN_USERS);

    if (newRows.length === 0) return;

    const updated = [...responses, ...newRows];
    setResponses(updated);
    localStorage.setItem('survey_analytics_responses_v6', JSON.stringify(updated));
    setIsFullDatasetActive(false);
    localStorage.setItem('survey_analytics_full_dataset_active', 'false');

    const newNotifications = groupResponsesToNotifications(newRows);
    if (newNotifications.length > 0) {
      setNotifications((current) => [...newNotifications, ...current].slice(0, NOTIFICATION_HISTORY_LIMIT));
      setUnreadCount((count) => count + newNotifications.length);
    }
  };

  const clearResponses = () => {
    setResponses([]);
    setNotifications([]);
    setUnreadCount(0);
    localStorage.setItem('survey_analytics_responses_v6', JSON.stringify([]));
    setIsFullDatasetActive(false);
    localStorage.setItem('survey_analytics_full_dataset_active', 'false');
    window.location.reload();
  };

  const resetSimulation = () => {
    const isSimulated = (id: string) => 
      id.startsWith('RESP-MOCK-') || 
      id.startsWith('RESP-SINGLE-') || 
      id.startsWith('RESP-BULK-');
      
    const filtered = responses.filter(r => !isSimulated(r.responseId));
    setResponses(filtered);
    localStorage.setItem('survey_analytics_responses_v6', JSON.stringify(filtered));
    setIsFullDatasetActive(false);
    localStorage.setItem('survey_analytics_full_dataset_active', 'false');

    const remainingSimulated = filtered.filter(r => isSimulated(r.responseId));
    const groupedNotifs = groupResponsesToNotifications(filtered);
    setNotifications(groupedNotifs.slice(0, NOTIFICATION_HISTORY_LIMIT));
    setUnreadCount(0);
  };

  const markNotificationsRead = () => setUnreadCount(0);

  // Split active and archived responses so the active dashboard is unaffected
  const activeResponses = useMemo(() => {
    return responses.filter(r => !r.archived);
  }, [responses]);

  const archivedResponses = useMemo(() => {
    return responses.filter(r => r.archived);
  }, [responses]);

  const archiveResponsesForSurveys = (surveyIds: string[]) => {
    const targetSurveys = surveys.filter(s => surveyIds.includes(s.id));
    const questionIdsToArchive = new Map<string, { id: string; title: string }>();
    const archiveDate = new Date().toISOString();
    
    targetSurveys.forEach(s => {
      s.questions.forEach(q => {
        questionIdsToArchive.set(q.questionId, { id: s.id, title: s.title });
        if (q.subQuestions) {
          q.subQuestions.forEach(sub => questionIdsToArchive.set(`${q.questionId}-${sub.id}`, { id: s.id, title: s.title }));
        }
      });
    });

    const updatedResponses = responses.map(r => {
      const surveyInfo = questionIdsToArchive.get(r.questionId);
      if (surveyInfo) {
        return { 
          ...r, 
          archived: true,
          archivedAt: archiveDate,
          archivedBySurveyId: surveyInfo.id,
          archivedBySurveyTitle: surveyInfo.title
        };
      }
      return r;
    });

    setResponses(updatedResponses);
    localStorage.setItem('survey_analytics_responses_v6', JSON.stringify(updatedResponses));
  };

  const restoreResponseGroup = (responseId: string) => {
    const updatedResponses = responses.map(r => {
      if (r.responseId === responseId) {
        return { ...r, archived: false };
      }
      return r;
    });

    setResponses(updatedResponses);
    localStorage.setItem('survey_analytics_responses_v6', JSON.stringify(updatedResponses));
  };

  const restoreResponsesForSurvey = (surveyId: string) => {
    const targetSurvey = surveys.find(s => s.id === surveyId);
    if (!targetSurvey) return;
    const questionIdsToRestore = new Set<string>();
    targetSurvey.questions.forEach(q => {
      questionIdsToRestore.add(q.questionId);
      if (q.subQuestions) {
        q.subQuestions.forEach(sub => questionIdsToRestore.add(`${q.questionId}-${sub.id}`));
      }
    });

    const updatedResponses = responses.map(r => {
      if (questionIdsToRestore.has(r.questionId)) {
        return { ...r, archived: false };
      }
      return r;
    });

    setResponses(updatedResponses);
    localStorage.setItem('survey_analytics_responses_v6', JSON.stringify(updatedResponses));
  };

  const deleteArchivedResponseGroups = (groupIds: { archivedAt: string; surveyId: string }[]) => {
    const updatedResponses = responses.filter(r => {
      if (!r.archived || !r.archivedAt || !r.archivedBySurveyId) return true;
      const match = groupIds.some(g => g.archivedAt === r.archivedAt && g.surveyId === r.archivedBySurveyId);
      return !match;
    });
    setResponses(updatedResponses);
    localStorage.setItem('survey_analytics_responses_v6', JSON.stringify(updatedResponses));
  };

  const restoreArchivedResponseGroups = (groupIds: { archivedAt: string; surveyId: string }[]) => {
    const updatedResponses = responses.map(r => {
      if (!r.archived || !r.archivedAt || !r.archivedBySurveyId) return r;
      const match = groupIds.some(g => g.archivedAt === r.archivedAt && g.surveyId === r.archivedBySurveyId);
      if (match) {
        return { ...r, archived: false };
      }
      return r;
    });
    setResponses(updatedResponses);
    localStorage.setItem('survey_analytics_responses_v6', JSON.stringify(updatedResponses));
  };

  // Derive unique active survey types (Courier, Supplier, Subcontractor)
  const surveyTypes = useMemo<SurveyType[]>(() => {
    return ['Courier', 'Supplier', 'Subcontractor'];
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
    responses: activeResponses,
    archivedResponses,
    archiveResponsesForSurveys,
    restoreResponseGroup,
    restoreResponsesForSurvey,
    deleteArchivedResponseGroups,
    restoreArchivedResponseGroups,
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
    updateSurvey,
    updateSurveysBulk,
    deleteSurvey,
    submitResponse,
    resetAllData,
    isFullDatasetActive,
    clearResponses,
    addEvaluations,
    resetSimulation,
  };
}
