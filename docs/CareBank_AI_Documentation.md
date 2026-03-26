# CareBank AI — Detailed Project Documentation

**Project Title:** CareBank AI — Intelligent Financial Wellness Platform  
**Team:** Vidyutrendz Competition Entry  
**Date:** March 26, 2026  
**Repository:** https://github.com/Navaneee7/carebank_ai_react

---

## 1. Project Overview

CareBank AI is a full-stack financial intelligence platform that goes beyond traditional expense tracking. It uses a **Multi-Agent AI Orchestration System** powered by Google Gemini to provide:

- **Proactive financial coaching** (not just reactive tracking)
- **Forensic data auditing** for bank managers using mathematical models
- **Predictive financial simulations** for "What-If" scenario planning
- **Format-agnostic data ingestion** supporting any CSV or PDF bank statement

The platform serves two user roles:
1. **Customer** — Receives personalized AI-driven financial wellness insights
2. **Bank Manager** — Gets forensic oversight tools to audit customer data integrity

---

## 2. Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React.js | Component-based UI framework |
| | Vite | Fast development server and bundler |
| | Recharts | Interactive data visualization (charts, sparklines) |
| | Lucide React | Modern SVG icon library |
| | CSS3 | Custom styling with glassmorphism effects |
| **Backend** | FastAPI (Python) | High-performance async API framework |
| | SQLAlchemy | ORM for database operations |
| | Pandas | Data processing and analysis engine |
| | pdfplumber | PDF table and text extraction |
| **AI Engine** | Google Generative AI (Gemini) | Powers all intelligent agents |
| **Database** | SQLite | Lightweight relational database |
| **Security** | PyJWT | JSON Web Token authentication |
| | Bcrypt | One-way password hashing |
| | CORS Middleware | Cross-origin request protection |

---

## 3. System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│              FRONTEND (React + Vite + Recharts)             │
│                                                             │
│  Customer Dashboard  │  Manager Command Center  │  What-If  │
│  Spending Trends     │  Savings Goals            │  Notifs   │
│  Tax Estimator       │  Score History            │  Chat     │
└──────────────────────────┬──────────────────────────────────┘
                           │  HTTP / REST
                           ▼
┌─────────────────────────────────────────────────────────────┐
│            SECURITY LAYER (FastAPI Middleware)               │
│                                                             │
│     JWT Token Auth  │  CORS Protection  │  Bcrypt Hashing   │
│              Login / Register / Forgot Password             │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              API GATEWAY (FastAPI - Python)                  │
│                                                             │
│  /api/upload    │  /api/dashboard  │  /api/admin            │
│  /api/simulate  │  /api/chat       │  /api/auth             │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│           AI AGENT ORCHESTRATOR (Google Gemini)              │
│                                                             │
│  Tax Agent  │  Risk Agent  │  Savings Agent                 │
│  Fraud Agent (Benford's Law)  │  Forecast Agent (What-If)  │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              DATA PROCESSING & STORAGE                      │
│                                                             │
│  Pandas Engine  │  pdfplumber Parser  │  Fuzzy Column Mapper│
│                      SQLite Database                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Feature Implementation Details

### 4.1 Format-Agnostic Data Ingestion

**Problem:** Bank statements come in hundreds of different formats — varying column names, separate debit/credit columns, and complex PDF layouts.

**Implementation:**
- **CSV Handling:** Built a Fuzzy Column Mapper that recognizes variations like "Particulars", "Narrative", "Description", or "Details" and maps them to a standardized schema. Separate "Debit" and "Credit" columns are automatically merged into a single "Amount" field.
- **PDF Handling:** Implemented a Dual-Pass PDF Extractor:
  - **Pass 1 (Structural):** Uses `pdfplumber` to extract tabular data directly from PDF tables.
  - **Pass 2 (Regex Fallback):** If Pass 1 fails (e.g., scanned or poorly formatted PDFs), a regex-based text parser scans the raw text to identify date-amount-description patterns.

**Key Files:**
- `backend/main.py` — Upload endpoint (`/api/upload`) with parsing logic
- `backend/agents.py` — Data validation agents

---

### 4.2 Multi-Agent AI Orchestration

**Problem:** A single AI model cannot handle the diverse financial advisory needs of users.

**Implementation:** We built a Multi-Agent Architecture where each agent is a specialized Python class that receives the user's transaction data and returns domain-specific insights via Google Gemini.

| Agent | Responsibility | How It Works |
|-------|---------------|--------------|
| **Tax Agent** | Identifies tax-saving opportunities | Scans transactions for deductible categories (donations, medical, education) |
| **Risk Agent** | Flags financial vulnerabilities | Detects overspending patterns and debt-to-income warnings |
| **Savings Agent** | Recommends savings strategies | Analyzes discretionary spending to find "leakage" opportunities |
| **Fraud Agent** | Verifies data authenticity | Uses Benford's Law, round-number bias, and duplicate detection |
| **Forecast Agent** | Powers the What-If Simulator | Projects financial health under hypothetical scenarios |

**Key Files:**
- `backend/agents.py` — All agent class definitions and Gemini integration

---

### 4.3 Forensic Command Center (Manager Dashboard)

**Problem:** Bank managers need tools to audit customer data integrity at scale, not just view balances.

**Implementation:**
- Built a dedicated `ManagerDashboard.jsx` with a **tabbed interface** (Financials, Logic, Forensics).
- **Financials Tab:** Real-time sparklines and area charts (Recharts) showing income vs. expense trends.
- **Logic Tab:** Displays the AI agent reasoning chain — showing *why* the system flagged or scored a customer.
- **Forensics Tab:** Shows the output of the Fraud Detection Agent, including:
  - **Benford's Law Score:** Compares the leading-digit frequency distribution of the customer's transaction amounts against the expected Benford distribution. A significant deviation flags potential data manipulation.
  - **Round-Number Bias:** Calculates the percentage of transactions that are round numbers (e.g., ₹500, ₹1000). An unusually high percentage suggests manual data entry rather than genuine bank activity.
  - **Duplicate Detection:** Identifies identical transactions occurring within a suspicious time window.

**Data Parity:** The Manager and Customer dashboards share the same backend data pipeline, ensuring 100% consistency between what the customer sees and what the manager audits.

**Key Files:**
- `frontend/src/components/ManagerDashboard.jsx` — Manager UI
- `frontend/src/components/Dashboard.jsx` — Customer UI
- `backend/main.py` — `/api/admin/customer/{user_id}` endpoint

---

### 4.4 What-If Financial Simulator

**Problem:** Users want to know the financial impact of a major purchase *before* they make it.

**Implementation:**
- Created a dedicated `/api/simulate` API endpoint.
- The simulator takes the user's current financial profile (income, expenses, health score) and "injects" a hypothetical transaction (e.g., "Buy a car for ₹5,00,000").
- It recalculates the projected Health Score, budget allocation, and savings trajectory in-memory (without modifying real data).
- The AI Forecast Agent provides a narrative explanation: *"Purchasing this vehicle would reduce your health score from 78 to 62 and deplete your emergency fund within 3 months."*

**Key Files:**
- `backend/main.py` — `/api/simulate` endpoint
- `backend/agents.py` — `ForecastAgent` class

---

### 4.5 Proactive AI Notification Center

**Problem:** Users miss critical financial insights buried in charts and tables.

**Implementation:**
- Built a unified `NotificationsPanel.jsx` component embedded in the Sidebar.
- All five AI agents push their top-priority alerts to this panel.
- Used `position: fixed` CSS to ensure the notification dropdown is never clipped by parent containers.
- Notifications are categorized by urgency: 🔴 Critical (budget breach), 🟡 Advisory (tax opportunity), 🟢 Positive (savings milestone).

**Key Files:**
- `frontend/src/components/NotificationsPanel.jsx` — Notification UI
- `frontend/src/components/Sidebar.jsx` — Bell icon integration

---

## 5. Security Architecture

### 5.1 Authentication Flow
1. User submits credentials → Backend validates against **Bcrypt-hashed** password in database.
2. On success, backend generates a **JWT Token** with an expiry time and returns it.
3. Frontend stores the token and attaches it to every subsequent API request as a `Bearer` header.
4. Backend middleware validates the token on every request before processing.

### 5.2 Authorization (Role-Based Access Control)
- **Customer endpoints** (`/api/dashboard`, `/api/upload`) require a valid user JWT.
- **Manager endpoints** (`/api/admin/*`) require a valid admin JWT with elevated privileges.
- A customer cannot access manager forensic data, and vice versa.

### 5.3 API Protection
- **CORS Middleware:** Only requests from `localhost:5173` (Vite dev server) and `localhost:3000` are accepted. All other origins are rejected.
- **Rate Limiting:** Upload endpoints are protected against brute-force attacks and automated data-faking attempts.

**Key Files:**
- `backend/auth.py` — JWT generation, validation, and Bcrypt hashing
- `backend/main.py` — CORS and middleware configuration

---

## 6. Database Schema

| Table | Key Columns | Purpose |
|-------|-------------|---------|
| **users** | id, email, password_hash, role | User authentication and RBAC |
| **transactions** | id, user_id, date, description, amount, category | Financial transaction records |
| **health_scores** | id, user_id, score, timestamp | Historical wellness score tracking |
| **savings_goals** | id, user_id, goal_name, target, current | User-defined savings targets |

**Key Files:**
- `backend/models.py` — SQLAlchemy model definitions
- `backend/database.py` — Database connection and session management

---

## 7. How to Run the Project

### Prerequisites
- Python 3.10+
- Node.js 18+
- Google Gemini API Key

### Backend Setup
```bash
cd backend
pip install -r requirements.txt
python seed_admin.py        # Creates the default admin account
uvicorn main:app --reload   # Starts the API server on port 8000
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev                 # Starts the UI on port 5173
```

### Default Credentials
- **Customer:** Register a new account via the UI
- **Manager:** admin@carebank.com / admin123 (seeded via `seed_admin.py`)

---

## 8. Future Roadmap

1. **Real-Time Bank Integration:** Connect Plaid/Yodlee APIs for automatic statement fetching.
2. **OCR Upgrade:** Integrate Tesseract for scanned/handwritten statement processing.
3. **PostgreSQL Migration:** Move from SQLite to PostgreSQL for production-scale deployments.
4. **Predictive Coaching:** Expand the Forecast Agent for long-term automated financial planning.
5. **Mobile App:** React Native companion app for on-the-go financial wellness tracking.

---

**CareBank AI transforms raw financial data into actionable intelligence — providing proactive coaching for customers and forensic oversight for institutions.**

*For questions or further technical details, please refer to the GitHub repository or contact the development team.*
