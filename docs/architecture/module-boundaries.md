# Module Boundaries

## Integration Adapters
Responsible for converting different sources (Agent 1, 3, 34, Database, files) into internal Canonical Contracts.

## Ingestion & Normalization
Responsible for receiving incoming academic data and converting external representations into canonical internal academic representation.

## Validation
Responsible for data quality and schema validation before persistence or processing.

## Analytics & Trends
Responsible for deterministic academic calculations and historical temporal analysis.

## Anomaly Detection
Responsible for statistical and rule-based anomaly detection across the academic landscape.

## Context / Evidence Attribution Engine
**Unique Differentiator:** When performance falls, this engine determines whether available evidence suggests broad difficulty, a course-specific issue, or a section-specific deviation. Every major AI insight must be traceable to source records.

## Intervention Priority Engine
**Unique Differentiator:** Prioritizes anomalies based on severity, magnitude, persistence, affected students, and historical recurrence rather than merely listing them.

## Agent Orchestration (Agent 10)
Coordinates reasoning, but strictly limits LLM operations to validated evidence and calculated metrics. The LLM is NOT the numerical source of truth.

## Faculty Contextual-Performance Guardrail
Faculty performance MUST NOT become a crude leaderboard. The architecture evaluates Faculty Performance in the context of:
- Course difficulty
- Section entry-level ability
- Historical subject pass rate

Visibility of these contextual metrics is strictly restricted to the faculty member and their Head of Department.
