export type InstitutionalRole = "Principal" | "Management" | "IQAC" | "Dean" | "HOD" | "Faculty";

export interface PermissionMatrix {
  canApproveMacroInterventions: boolean; // Principal, Management, Dean
  canViewAllDepartments: boolean;        // Principal, Management, IQAC, Dean
  canExportOfficialReports: boolean;     // Principal, Management, IQAC, Dean
  canTriggerSystemAudit: boolean;        // Principal, IQAC, Dean
  canCalibrateCourseDifficulty: boolean; // Dean, HOD
  canExecuteRecommendation: boolean;     // Principal, Dean, HOD
  canSubmitFacultyFeedback: boolean;     // Faculty, HOD
}

export const getRolePermissions = (roleString: string): PermissionMatrix => {
  const role = roleString.trim();

  switch (role) {
    case "Principal":
    case "Management":
      return {
        canApproveMacroInterventions: true,
        canViewAllDepartments: true,
        canExportOfficialReports: true,
        canTriggerSystemAudit: true,
        canCalibrateCourseDifficulty: true,
        canExecuteRecommendation: true,
        canSubmitFacultyFeedback: false,
      };
    case "IQAC":
      return {
        canApproveMacroInterventions: false,
        canViewAllDepartments: true,
        canExportOfficialReports: true,
        canTriggerSystemAudit: true,
        canCalibrateCourseDifficulty: false,
        canExecuteRecommendation: false,
        canSubmitFacultyFeedback: false,
      };
    case "Dean":
      return {
        canApproveMacroInterventions: true,
        canViewAllDepartments: true,
        canExportOfficialReports: true,
        canTriggerSystemAudit: true,
        canCalibrateCourseDifficulty: true,
        canExecuteRecommendation: true,
        canSubmitFacultyFeedback: false,
      };
    case "HOD":
      return {
        canApproveMacroInterventions: false,
        canViewAllDepartments: false,
        canExportOfficialReports: false,
        canTriggerSystemAudit: false,
        canCalibrateCourseDifficulty: true,
        canExecuteRecommendation: true,
        canSubmitFacultyFeedback: true,
      };
    case "Faculty":
      return {
        canApproveMacroInterventions: false,
        canViewAllDepartments: false,
        canExportOfficialReports: false,
        canTriggerSystemAudit: false,
        canCalibrateCourseDifficulty: false,
        canExecuteRecommendation: false,
        canSubmitFacultyFeedback: true,
      };
    default:
      return {
        canApproveMacroInterventions: false,
        canViewAllDepartments: false,
        canExportOfficialReports: false,
        canTriggerSystemAudit: false,
        canCalibrateCourseDifficulty: false,
        canExecuteRecommendation: false,
        canSubmitFacultyFeedback: false,
      };
  }
};
