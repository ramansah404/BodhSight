export type InstitutionalRole = "Chairman" | "Dean" | "HOD" | "Faculty";

export interface PermissionMatrix {
  canApproveMacroInterventions: boolean;
  canViewAllDepartments: boolean;
  canExportOfficialReports: boolean;
  canTriggerSystemAudit: boolean;
  canCalibrateCourseDifficulty: boolean;
  canCalibrateDifficulty: boolean; // alias
  canExecuteRecommendation: boolean;
  canSubmitFacultyFeedback: boolean;
  canOverrideStudentData: boolean;
}

export const getRolePermissions = (roleString: string): PermissionMatrix => {
  const role = roleString ? roleString.trim() : "Chairman";

  switch (role) {
    case "Chairman":
    case "Principal":
    case "Management":
      return {
        canApproveMacroInterventions: true,
        canViewAllDepartments: true,
        canExportOfficialReports: true,
        canTriggerSystemAudit: true,
        canCalibrateCourseDifficulty: true,
        canCalibrateDifficulty: true,
        canExecuteRecommendation: true,
        canSubmitFacultyFeedback: false,
        canOverrideStudentData: true,
      };
    case "Dean":
    case "IQAC":
      return {
        canApproveMacroInterventions: true,
        canViewAllDepartments: true,
        canExportOfficialReports: true,
        canTriggerSystemAudit: true,
        canCalibrateCourseDifficulty: true,
        canCalibrateDifficulty: true,
        canExecuteRecommendation: true,
        canSubmitFacultyFeedback: false,
        canOverrideStudentData: true,
      };
    case "HOD":
      return {
        canApproveMacroInterventions: false,
        canViewAllDepartments: false,
        canExportOfficialReports: false,
        canTriggerSystemAudit: false,
        canCalibrateCourseDifficulty: true,
        canCalibrateDifficulty: true,
        canExecuteRecommendation: true,
        canSubmitFacultyFeedback: true,
        canOverrideStudentData: true,
      };
    case "Faculty":
      return {
        canApproveMacroInterventions: false,
        canViewAllDepartments: false,
        canExportOfficialReports: false,
        canTriggerSystemAudit: false,
        canCalibrateCourseDifficulty: false,
        canCalibrateDifficulty: false,
        canExecuteRecommendation: false,
        canSubmitFacultyFeedback: true,
        canOverrideStudentData: true,
      };
    default:
      return {
        canApproveMacroInterventions: false,
        canViewAllDepartments: false,
        canExportOfficialReports: false,
        canTriggerSystemAudit: false,
        canCalibrateCourseDifficulty: false,
        canCalibrateDifficulty: false,
        canExecuteRecommendation: false,
        canSubmitFacultyFeedback: false,
        canOverrideStudentData: false,
      };
  }
};
