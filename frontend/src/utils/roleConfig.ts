import type { InstitutionalRole } from "./rbac";

export type RuntimeRole = InstitutionalRole | "Principal" | "IQAC";

export interface RoleConfig {
  role: RuntimeRole;
  title: string;
  purpose: string;
  scopeLabel: string;
  primaryQuestion: string;
  composition: "faculty" | "hod" | "dean" | "principal" | "chairman" | "iqac";
}

export const ROLE_CONFIG: Record<RuntimeRole, RoleConfig> = {
  Faculty: {
    role: "Faculty",
    title: "Course Instructor Telemetry",
    purpose: "Assigned-course monitoring and action",
    scopeLabel: "My academic scope",
    primaryQuestion: "How are my assigned academic areas performing, and what needs attention?",
    composition: "faculty",
  },
  HOD: {
    role: "HOD",
    title: "Departmental Command Center",
    purpose: "Department performance and intervention",
    scopeLabel: "Department scope",
    primaryQuestion: "Which areas in my department need intervention?",
    composition: "hod",
  },
  Dean: {
    role: "Dean",
    title: "Academic Management Center",
    purpose: "Multi-department governance",
    scopeLabel: "Institutional management scope",
    primaryQuestion: "How are departments performing relative to one another?",
    composition: "dean",
  },
  Principal: {
    role: "Principal",
    title: "Institutional Academic Health",
    purpose: "Institution-wide monitoring",
    scopeLabel: "Institutional scope",
    primaryQuestion: "How healthy is the institution overall?",
    composition: "principal",
  },
  Chairman: {
    role: "Chairman",
    title: "Strategic Institutional Overview",
    purpose: "Macro strategic oversight",
    scopeLabel: "Strategic institutional scope",
    primaryQuestion: "What strategic academic signals require attention?",
    composition: "chairman",
  },
  IQAC: {
    role: "IQAC",
    title: "Academic Quality & Assurance",
    purpose: "Quality, risks, trends, and reports",
    scopeLabel: "Quality assurance scope",
    primaryQuestion: "Where are the academic quality signals, risks, and evidence areas?",
    composition: "iqac",
  },
};

export function getRoleConfig(role: string): RoleConfig {
  return ROLE_CONFIG[role as RuntimeRole] ?? ROLE_CONFIG.Dean;
}
