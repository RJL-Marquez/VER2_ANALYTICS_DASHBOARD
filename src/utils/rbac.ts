import { SurveyType } from '../types/survey';

export type PageModuleKey = 
  | 'dashboard'
  | 'survey-forms'
  | 'explorer'
  | 'analytics'
  | 'reports'
  | 'present'
  | 'partner-companies'
  | 'account-management'
  | 'notifications'
  | 'archive'
  | 'simulator';

export interface UserPermissions {
  pages: PageModuleKey[];
  surveyTypes: SurveyType[];
}

/**
 * Resolves the default permitted pages and survey types for a given designation (rank) and department.
 */
export function getDefaultPermissions(designation: string, department: string): UserPermissions {
  const rank = designation.trim();
  const dept = department.trim();

  // 1. Survey Types (Operational Data)
  // Director, Executive, and Admin get company-wide data by default.
  // Other ranks are department-specific.
  let surveyTypes: SurveyType[] = [];
  if (
    rank === 'Executive' || 
    rank === 'Director' || 
    dept === 'Executive Office' || 
    dept === 'Business Solutions Manager' || 
    dept === 'Accounts Payable - Trade'
  ) {
    surveyTypes = ['Courier', 'Supplier', 'Subcontractor'];
  } else if (dept === 'Procurement Group') {
    surveyTypes = ['Supplier'];
  } else if (dept === 'Logistics') {
    surveyTypes = ['Courier'];
  } else if (dept === 'TASS') {
    surveyTypes = ['Subcontractor'];
  } else {
    surveyTypes = ['Courier', 'Supplier', 'Subcontractor'];
  }

  // 2. Page Modules based on Rank/Designation
  let pages: PageModuleKey[] = [];

  if (rank === 'Rank & File') {
    pages = ['dashboard', 'analytics', 'survey-forms', 'partner-companies'];
  } else if (rank === 'Supervisory') {
    // Supervisor gets Dashboard, Analytics, Survey Forms, Partner Companies, and optionally Reports for basic exports
    pages = ['dashboard', 'analytics', 'survey-forms', 'partner-companies', 'reports'];
  } else if (rank === 'Managerial') {
    pages = [
      'dashboard', 
      'analytics', 
      'survey-forms', 
      'partner-companies', 
      'explorer', 
      'reports', 
      'present', 
      'archive'
    ];
  } else if (rank === 'Director') {
    pages = [
      'dashboard', 
      'analytics', 
      'survey-forms', 
      'partner-companies', 
      'explorer', 
      'reports', 
      'present', 
      'archive', 
      'notifications'
    ];
  } else if (rank === 'Executive') {
    pages = ['dashboard', 'analytics', 'reports', 'present'];
  } else {
    // Default fallback or Admin
    pages = [
      'dashboard', 
      'survey-forms', 
      'explorer', 
      'analytics', 
      'reports', 
      'present', 
      'partner-companies', 
      'account-management', 
      'notifications', 
      'archive', 
      'simulator'
    ];
  }

  return { pages, surveyTypes };
}

/**
 * Validates whether a user has access to a specific page key.
 */
export function hasPageAccess(
  userPages: PageModuleKey[],
  pageKey: string,
  isAdmin: boolean
): boolean {
  if (isAdmin && pageKey !== 'fill-form' && pageKey !== 'view-form' && pageKey !== 'create-form') {
    return true; // Admin has full access by default
  }
  
  // Custom sub-views mapping
  if (pageKey === 'create-form') {
    return userPages.includes('survey-forms') && isAdmin; // Keep creation admin-restricted by default unless allowed
  }
  if (pageKey === 'view-form' || pageKey === 'fill-form') {
    return userPages.includes('survey-forms');
  }

  return userPages.includes(pageKey as PageModuleKey);
}
