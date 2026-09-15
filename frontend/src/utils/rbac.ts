export type InstitutionalRole = "Chairman" | "Dean" | "HOD" | "Faculty" | "Admin" | "Student" | "IQAC" | "Principal" | "Management";

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

// Parses the raw string array from the DB into the PermissionMatrix booleans
export const parsePermissions = (perms: string[]): PermissionMatrix => {
  const has = (p: string) => perms.includes(p);
  return {
    canApproveMacroInterventions: has("can_approve_interventions"),
    canViewAllDepartments: has("can_view_all_departments"),
    canExportOfficialReports: has("can_export_reports"),
    canTriggerSystemAudit: has("can_trigger_audit"),
    canCalibrateCourseDifficulty: has("can_calibrate_difficulty"),
    canCalibrateDifficulty: has("can_calibrate_difficulty"),
    canExecuteRecommendation: has("can_execute_recommendation"),
    canSubmitFacultyFeedback: has("can_submit_feedback"),
    canOverrideStudentData: has("can_override_student_data"),
  };
};

export const getDefaultPermissions = (roleString: string): PermissionMatrix => {
  const role = roleString ? roleString.trim() : "Chairman";

  switch (role) {
    case "Admin":
      return {
        canApproveMacroInterventions: true,
        canViewAllDepartments: true,
        canExportOfficialReports: true,
        canTriggerSystemAudit: true,
        canCalibrateCourseDifficulty: true,
        canCalibrateDifficulty: true,
        canExecuteRecommendation: true,
        canSubmitFacultyFeedback: true,
        canOverrideStudentData: true,
      };
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
