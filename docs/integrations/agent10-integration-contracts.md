# Integration Contracts

**CRITICAL: Actual external-agent APIs are not yet available and must not be invented.**

## Inbound Integrations

### Agent 1 → Agent 10
**Agent 1 (Academic Curriculum Agent)** provides authoritative curriculum information (Programmes, Regulations, Courses, Credits, Outcomes).
- **Integration Strategy:** BodhSight implements a `CurriculumProvider` abstraction. It does not invent Agent 1's API but defines what data Agent 10 needs to interpret results.

### Agent 3 → Agent 10
**Agent 3 (Faculty Course Allocation Agent)** provides contextual relationships between faculty, courses, sections, and academic periods.
- **Integration Strategy:** BodhSight implements a `FacultyAllocationProvider` abstraction, backed initially by the supplied PostgreSQL database.

### Agent 34 → Agent 10
**Agent 34 (Result Analysis Agent)** provides published semester results, internal marks, and grade distributions.
- **Integration Strategy:** BodhSight implements a `ResultAnalysisProvider` abstraction to consume structured result-analysis information.

## Outbound Integrations

### Agent 10 → Agent 9
**Agent 9 (Accreditation Academic Agent)** uses Agent 10 outputs for official reporting.
- Agent 10 provides structured, traceable `AcademicPerformanceReport` data.

### Agent 10 → Agent 59
**Agent 59 (Faculty Performance Agent)** uses contextual course results.
- Agent 10 provides `FacultyContextualPerformance`, actively preventing raw/crude ranking by including course difficulty and historical baselines.

### Agent 10 → Agent 70
**Agent 70 (Academic Decision Support Agent)** consumes consolidated outputs.
- Agent 10 provides machine-readable `AgentOutput` (metric, value, scope, baseline, deviation, evidence).

### Agent 10 → Agent 71
**Agent 71 (University KPI Agent)** uses institutional indicators.
- Agent 10 exposes validated academic indicators in standardized `AcademicMetric` format.

### Agent 10 → Agent 72
**Agent 72 (Strategic Planning Agent)** uses historical trends.
- Agent 10 provides historical `AcademicTrend` objects suitable for long-term strategic analysis.
