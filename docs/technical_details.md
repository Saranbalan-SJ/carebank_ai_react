# Code Explanation: Technical Talking Points 💻

If the judges ask about the "guts" of your code, here is how you should explain the key parts:

## 1. 📂 Backend: The AI Command Center (`main.py`)
> **"We implemented an 'Adaptive AI Controller'."**
*   **Explain**: We use a **Tiered Intelligence System**. Primary analysis happens on **Gemini 2.0 Flash** via Google Cloud. For privacy or offline mode, we have a **Local LLM (Ollama)** fallback. If even that is unavailable, we have a **Deterministic Rule Engine** to ensure the user ALWAYS gets an answer. It's built for zero downtime.

## 2. 🧠 Backend: Modular Specialist Agents (`agents.py`)
> **"Our core logic follows a 'Multi-Agent Pattern'."**
*   **Explain**: Unlike simple trackers, we have specialized Python classes for each task.
    *   **RiskAgent**: Uses `scikit-learn`'s **Isolation Forest** algorithms for anomaly detection (identifies weird spending).
    *   **TaxAgent**: Analyzes descriptions using **Keyword Heuristics** to find deductions under Indian Income Tax law.
    *   **ForecastAgent**: Uses **Rolling Averages** in `Pandas` to predict future cash flow trends.

## 3. 🎨 Frontend: Premium Dashboard (`Dashboard.jsx`)
> **"We built a 'Reactive Data Environment'."**
*   **Explain**: The UI is built with **React** and **Vite**, using **Recharts** for real-time visualization. The data flows seamlessly from our FastAPI backend into interactive charts. We also implemented a **Persistent Theme Engine** using CSS variables for high-fidelity glassmorphism (the blur effect).

## 4. 🔗 Database: Secure Transaction Mapping (`models.py`)
> **"We use a 'Relational Data Store' via SQLAlchemy."**
*   **Explain**: Our database (SQLite + SQLAlchemy ORM) is designed for security. Each transaction is mapped directly to a **Hashed User ID**, ensuring total data isolation. We also track **Health History**, which allows the system to show progress over time, not just a one-time snapshot.

## 5. 🏗️ Developer Workflow: High-Quality Code
> **"We followed 'Agile DevOps' principles."**
*   **Explain**: Point out that the code is structured cleanly with separate files for Authentication (`auth.py`), Models (`models.py`), and Routing (`App.jsx`). This makes the project highly **Scalable** and easy for a team to maintain.

## 6. 📄 Intelligent Parsing: Robust PDF Ingestion (`main.py`)
> **"We built a 'Format-Agnostic' ingestion pipeline."**
*   **Explain**: We use a **Dual-Pass Extraction** strategy. First, we try structural table extraction; if that's ambiguous, we fallback to a **Regex-based Text OCR**. This allows the system to parse messy bank statements that would break regular tools.

## 7. 🛡️ Manager Insights: The Command Center (`ManagerDashboard.jsx`)
> **"We developed a 'Mirror-Sync' forensic dashboard."**
*   **Explain**: The Manager View isn't just a list; it's a **Forensic Command Center**. It uses the exact same budget and agent logic as the customer's dashboard, ensuring **100% Data Parity**. Bankers can mirror a customer's health score to provide real-time human counseling.

---

### 🔥 The "Killer Quote" to end your technical walk-through:
> "We didn't just build a wrapper; we built a **Financial Intelligence Layer** that turns messy transaction strings into structured, actionable wisdom."
