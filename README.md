# DealLens — AI Investment Research & Due-Diligence Workflow Engine

[![DealLens CI Pipeline](https://github.com/Tejas-Raj01/DealLens/actions/workflows/ci.yml/badge.svg)](https://github.com/Tejas-Raj01/DealLens/actions)
[![Live Backend (Render)](https://img.shields.io/badge/Backend-Render-000000?style=flat&logo=render)](https://deallens-73yw.onrender.com/health)
[![Python 3.11](https://img.shields.io/badge/Python-3.11-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111.0-009688.svg)](https://fastapi.tiangolo.com/)
[![PostgreSQL pgvector](https://img.shields.io/badge/PostgreSQL-pgvector-336791.svg)](https://github.com/pgvector/pgvector)
[![Next.js 14](https://img.shields.io/badge/Next.js-14-black.svg)](https://nextjs.org/)

**DealLens** is a production-grade, asynchronous AI backend system designed for automated corporate investment due-diligence and financial document research. It transforms unstructured filings (Annual Reports, 10-Ks, 10-Qs, Investor Presentation Decks) into a structured vector + relational knowledge graph, executing deterministic multi-step due-diligence workflows with strict page-level citation provenance.

---

## 🌐 Live Production Deployments

* **Backend API (Render)**: [https://deallens-73yw.onrender.com](https://deallens-73yw.onrender.com)
* **Interactive API Docs (OpenAPI / Swagger)**: [https://deallens-73yw.onrender.com/docs](https://deallens-73yw.onrender.com/docs)
* **API Health Check**: [https://deallens-73yw.onrender.com/health](https://deallens-73yw.onrender.com/health)

---

## Architecture Diagram

```
                                  +----------------------------------+
                                  |         Next.js 14 UI            |
                                  |   (Docs, Workflows, Citations)   |
                                  +-----------------+----------------+
                                                    | HTTP / REST API
                                                    v
                                  +----------------------------------+
                                  |        FastAPI API Gateway       |
                                  |  (Validation, Auth, Middleware)  |
                                  +-----------------+----------------+
                                                    |
          +-----------------------------------------+-----------------------------------------+
          |                                         |                                         |
          v                                         v                                         v
+-------------------+                    +--------------------+                    +--------------------+
|  PostgreSQL 16    |                    |    Redis 7 Broker  |                    | MinIO / S3 Storage |
|    + pgvector     |                    |   & Result Store   |                    |  (Raw Document PDF |
| (Docs, Chunks,    |                    +----------+---------+                    |     Artifacts)     |
|  Workflows,       |                               |                              +--------------------+
|  Citations, Logs) |                               v
+-------------------+                    +--------------------+
                                         |   Celery Worker    |
                                         | (Async Ingestion,  |
                                         | Workflow Engine,   |
                                         |  RAG & Citations)  |
                                         +--------------------+
```

---

## Executive Overview & Problem Statement

Investment analysts, private equity deal teams, and venture capitalists spend hundreds of hours manually cross-referencing multi-page corporate filings (10-K annual reports, audited financial statements, investor presentation pitch decks).

Generic RAG applications and simple chat interfaces suffer from three critical production flaws in financial engineering:
1. **Hallucinations & Groundless Claims**: Models state figures like *"Revenue grew 25%"* without pointing to an audited line item or page.
2. **Page-Number & Provenance Loss**: Traditional text splitters strip out document page numbers, leaving analysts unable to inspect the original PDF page.
3. **Fragile "Magic Autonomous Agents"**: Unpredictable LLM agent loops execute arbitrary steps, leading to infinite loops, high costs, and unexplainable failures.

### How DealLens Solves This
* **Page-Aware Ingestion**: PDF layout parsing preserves 1-indexed page boundaries for every extracted text chunk.
* **Hybrid RAG Pipeline**: Integrates Postgres `tsvector` keyword search with `pgvector` Cosine Distance search via **Reciprocal Rank Fusion (RRF)**.
* **Deterministic DAG Workflow Engine**: An explicit 7-step state machine orchestrates due diligence with granular step input/output logging and automated retries.
* **Strict Provenance Guardrails**: Every claim in generated investment reports is passed through a Citation Verifier to ensure zero ungrounded statements.
* **RAG & Workflow Evaluation Framework**: Built-in benchmark harness (`eval/evaluate.py`) tracking Context Recall @ K, Citation Precision, and Latency.

---

## Explicit 7-Step Due-Diligence Workflow DAG

Unlike non-deterministic LLM agents, DealLens uses an explicit, observable state machine:

```
Workflow Trigger
   │
   ├── [Step 1] Document Validation (MIME check, SHA256 deduplication, PROCESSED state check)
   ├── [Step 2] Company Extraction (Entity profile, sector, US GAAP/IFRS reporting standard)
   ├── [Step 3] Financial Performance Analysis (Revenue, Gross Margins, EBITDA, Debt with page citations)
   ├── [Step 4] Risk Analysis (Regulatory, Market, Operational risk categorization)
   ├── [Step 5] Target Evidence Retrieval (Target vector + keyword queries for risk mitigations)
   ├── [Step 6] Cross-Document Claim Verification (Cross-referencing Deck claims vs 10-K audited reality)
   └── [Step 7] Due Diligence Report Generation (Synthesizing memo with embedded page provenance citations)
```

---

## Core Technology Stack

| Layer | Technology | Primary Rationale |
| :--- | :--- | :--- |
| **Backend API** | Python 3.11, FastAPI, Pydantic v2 | Async I/O concurrency, auto OpenAPI schema docs, strict input validation |
| **Database** | PostgreSQL 16 + pgvector | Combined relational + vector storage, ACID transactions, HNSW vector indexing |
| **Async Task Queue** | Celery 5 + Redis 7 | Decouples heavy PDF parsing, embedding generation, and multi-step LLM workflows |
| **Storage** | MinIO / AWS S3 | S3-compatible raw PDF document store with SHA256 deduplication |
| **RAG & Hybrid Search** | pgvector Cosine + Postgres tsvector + RRF | Hybrid dense + sparse search without external vector DB operational overhead |
| **Observability** | Structlog JSON + Telemetry Middleware | Correlation IDs (`X-Request-ID`), request duration, and step-level audit logs |
| **Testing & Evaluation**| Pytest, Benchmark Eval Framework | Automated test coverage and quantitative evaluation (Recall @ K, Citation Precision) |
| **Frontend UI** | Next.js 14, React, Tailwind CSS | Sleek corporate dark-mode dashboard with side-by-side evidence inspector |

---

## Key System Engineering Trade-Offs

### 1. Why PostgreSQL + pgvector over a standalone vector database (Pinecone / Weaviate / Qdrant)?
* **Transactional Consistency**: Documents, chunks, workflow runs, and citation records reside in a single relational DB. Deleting a document atomically cascades to delete its embeddings and citations.
* **Hybrid Relational Filtering**: Allows combined SQL queries filtering by relational metadata (`document_id`, `company_name`, `page_number`) alongside vector similarity in a single query execution plan with HNSW indexing.
* **Simplified Infrastructure**: Reduces operational complexity for deployment and local development.

### 2. Why an explicit deterministic workflow DAG over an autonomous agent framework (AutoGPT / CrewAI)?
* **Auditability & Observability**: Enterprise due diligence requires predictable execution. Analysts must know exactly which step failed and inspect its inputs and outputs.
* **Cost & Latency Control**: Prevents infinite loops or multi-turn agent hallucination queries.
* **Fault Tolerance & Retries**: Individual steps can be retried independently without re-executing completed upstream steps.

---

## VectorShift Backend Engineer Interview Q&A Study Guide

### Q1: How does DealLens guarantee strict document provenance and prevent hallucinations?
> **Answer**: When parsing PDFs, `PDFParser` maintains 1-indexed page boundaries for every extracted text block. Chunks saved to `document_chunks` retain their source `page_number` and `document_id`. Generated answer claims pass through a `CitationVerifier` guardrail that performs string matching and number-precision checks against source chunks. Unverified or contradicted claims are flagged before report synthesis.

### Q2: Why use Reciprocal Rank Fusion (RRF) for hybrid retrieval?
> **Answer**: Dense vector search (pgvector) excels at semantic search, while sparse keyword search (`tsvector`) excels at exact financial numbers, ticker symbols, and specific terms. RRF merges both ranked lists using $RRF(d) = \sum \frac{1}{k + r(d)}$, scoring documents consistently without needing to normalize raw cosine distances against BM25 scores.

### Q3: How are long-running document ingestion and workflow execution handled?
> **Answer**: Document uploads return a `202 Accepted` response immediately with a status of `PENDING`. Processing is offloaded asynchronously to Celery background workers backed by Redis. Clients poll `GET /api/v1/documents/{id}` or `GET /api/v1/workflows/{id}` to track execution state without holding open HTTP connections.

---

## Local Setup & Quickstart Guide

### Prerequisites
* Docker & Docker Compose
* Python 3.11+

### Running via Docker Compose
```bash
# Clone repository
git clone https://github.com/Tejas-Raj01/DealLens.git
cd DealLens

# Start PostgreSQL (pgvector), Redis, MinIO, FastAPI Backend, and Celery Worker
docker-compose up --build -d
```

### Running Backend Locally (Development)
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Run migrations
alembic upgrade head

# Run FastAPI API Server
uvicorn app.main:app --reload --port 8000
```

### Running Evaluation Benchmark Script
```bash
python -m eval.evaluate
```

### Running Test Suite
```bash
pytest -v backend/tests
```

---

## License & Author

Developed by **Tejas Raj** as a production-grade portfolio project optimized for the **VectorShift Backend Engineer — India** role.
