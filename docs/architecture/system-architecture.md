# System Architecture

## Architecture Overview

BodhSight is designed as a MODULAR MONOLITH to ensure rapid development during the hackathon phase while preserving clear boundaries for future extraction if needed.

The architecture flows from external data ingestion through strict normalization, analytical evaluation, AI-driven attribution, and finally out to proactive reporting and downstream agents.

## Core Flow
1. **Ingestion Layer:** Receives data from external agents (Agent 1, Agent 3, Agent 34) through Integration Adapters.
2. **Normalization Layer:** Converts varying inputs into a Canonical Internal Contract.
3. **Validation Engine:** Ensures data quality and structural integrity.
4. **Supplied PostgreSQL Academic Database:** Serves as the ultimate source of truth, utilizing pre-existing schemas and views.
5. **Analytics Engine:** Handles deterministic calculations.
6. **Trend & Anomaly Engines:** Identify historical deviations and statistical anomalies.
7. **Attribution Engine:** Connects deviations to contextual evidence.
8. **Agentic Reasoning:** LLM-based reasoning on validated metrics.
9. **Priority & Actions:** Scores interventions and recommendations.
10. **Delivery:** API and Frontend visualization.

## Database-First Principle
BodhSight adheres to a strict Database-First design:
- The supplied university SQL files are the definitive schema.
- We DO NOT invent simplified replacement tables.
- SQLAlchemy business models must map exactly to the provided database structures.
- Use pre-existing views (e.g., from 12_views.sql) where applicable.

## Important Note
**Actual external-agent APIs are not yet available and must not be invented.**
All integrations rely on conceptual abstraction contracts until the real endpoints are provided.
