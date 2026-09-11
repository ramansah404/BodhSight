# Agent 10: Academic Performance Agent - Scope

## Purpose
BodhSight (Agent 10) provides a consolidated, reliable, and intelligent view of academic performance across every relevant dimension and time period for the university.

## Official Requirements Supported
- Consolidation of semester/result data
- Academic data validation and anomaly detection
- Distribution analysis (Pass percentage, Distinctions, GPA)
- Subject/course-wise failure rate and average marks
- Multidimensional analysis (Course, Section, Faculty, Department, Regulation, Batch, Gender, Category)
- Semester/year trends and sudden/persistent performance-drop detection
- Statistical threshold-based deviation detection
- Evidence-supported deviation attribution
- Intervention-priority ranking and proactive exception alerts

## Target Users
- Principal
- Deans
- Heads of Department (HOD)
- Internal Quality Assurance Cell (IQAC)
- Management

## Data Flow
**Inputs:** Curriculum context (Agent 1), Faculty Allocation (Agent 3), Result Analysis (Agent 34), and raw database records.
**Processing:** Ingest -> Validate -> Normalize -> Analyze -> Detect -> Attribute -> Reason -> Prioritize -> Alert/Report.
**Outputs:** Consumed by Agent 9, Agent 59, Agent 70, Agent 71, and Agent 72.

## Guardrails
- **Database-First:** We do not define the database structure; we map to the institution's existing schema.
- **Evidence-Backed Insights:** All LLM reasoning must be grounded in deterministic evidence.
- **Contextual Faculty Evaluation:** Raw rankings are prohibited. Performance is always contextualized against course difficulty and historical baselines.

*Note: Actual external-agent APIs are not yet available and must not be invented.*
