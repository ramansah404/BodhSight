export type InstitutionalRole = "Chairman" | "Dean" | "HOD" | "Faculty";

export interface PermissionMatrix {
  canApproveMacroInterventions: boolean;
  canViewAllDepartments: boolean;
  canExportOfficialReports: boolean;
  canTriggerSystemAudit: boolean;
  canCalibrateCourseDifficulty: boolean;
  canExecuteRecommendation: boolean;
  canSubmitFacultyFeedback: boolean;
}

export const getRolePermissions = (roleString: string): PermissionMatrix => {
  const role = roleString ? roleString.trim() : "Chairman";

  switch (role) {
    case "Chairman":
      return {
        canApproveMacroInterventions: true,
        canViewAllDepartments: true,
        canExportOfficialReports: true,
        canTriggerSystemAudit: true,
        canCalibrateCourseDifficulty: true,
        canExecuteRecommendation: true,
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
