"""
CareBank AI – FastAPI Backend
Exposes REST endpoints for CSV upload, analysis, and AI chat.
"""

import io
import os
from datetime import timedelta, datetime
from typing import List, Optional

import pandas as pd
import pdfplumber
import google.generativeai as genai
from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
from sqlalchemy.orm import Session

import agents
import auth
import models
from database import engine, get_db

# Load .env file so GEMINI_API_KEY is available via os.getenv()
load_dotenv()

# Initialize Database
models.Base.metadata.create_all(bind=engine)

# ---------------------
# App Initialization
# ---------------------
app = FastAPI(title="CareBank Unified API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

orchestrator = agents.Orchestrator()

# In-memory store for the latest analysis context (per-session simplification)
_latest_context: dict = {}

class UserCreate(BaseModel):
    username: str
    password: str
    role: Optional[str] = "customer"

class Token(BaseModel):
    access_token: str
    token_type: str

class BudgetSettings(BaseModel):
    Food: float = 4000
    Transport: float = 2000
    Shopping: float = 3000
    Other: float = 2000

class ChatRequest(BaseModel):
    message: str
    context: str = ""

class ResetPasswordRequest(BaseModel):
    username: str
    new_password: str

class SavingsGoalCreate(BaseModel):
    name: str
    target: float
    deadline: str

class SavingsGoalUpdate(BaseModel):
    saved: float

class FlagRequest(BaseModel):
    reason: str

class SimulationRequest(BaseModel):
    amount: float
    category: str

@app.get("/")
def root():
    return {"status": "CareBank AI API is running"}

@app.post("/api/register")
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    hashed_pw = auth.get_password_hash(user.password)
    new_user = models.User(
        username=user.username, 
        hashed_password=hashed_pw,
        role=user.role if user.role in ["customer", "banker"] else "customer"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": new_user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer", "role": new_user.role}

@app.post("/api/login")
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "role": user.role
    }

@app.post("/api/reset-password")
def reset_password(request: ResetPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == request.username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.hashed_password = auth.get_password_hash(request.new_password)
    db.commit()
    return {"message": "Password reset successfully"}

@app.get("/api/admin/customers")
def get_all_customers(db: Session = Depends(get_db), current_admin: models.User = Depends(auth.get_current_admin)):
    users = db.query(models.User).filter(models.User.role == "customer").all()
    results = []
    
    for user in users:
        df = pd.DataFrame([
            {"Date": t.date, "Description": t.description, "Amount": t.amount}
            for t in user.transactions
        ])
        
        if df.empty:
            health = "New / No Data"
            score = 0
            risk_count = 0
            reliability = 100
            data_status = "No Data"
            fraud_flags = []
        else:
            analysis = orchestrator.execute(df)
            score = analysis["budget_summary"]["health_score"]
            risk_count = len(analysis["anomalies"])
            health = analysis["advice"][0] if analysis["advice"] else "Stable"
            reliability = analysis["fraud_analysis"]["reliability_score"]
            data_status = analysis["fraud_analysis"]["status"]
            # Admin sees private forensic flags
            fraud_flags = analysis["fraud_analysis"]["private_flags"]

        results.append({
            "id": user.id,
            "username": user.username,
            "health_score": score,
            "status": health,
            "risk_alerts": risk_count,
            "reliability_score": reliability,
            "data_status": data_status,
            "fraud_flags": fraud_flags,
            "total_transactions": len(user.transactions)
        })
    
    return results

@app.get("/api/admin/customers/export")
def export_customers(db: Session = Depends(get_db), current_admin: models.User = Depends(auth.get_current_admin)):
    customers = get_all_customers(db, current_admin)
    df = pd.DataFrame(customers)
    output = io.StringIO()
    df.to_csv(output, index=False)
    
    from fastapi.responses import StreamingResponse
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=customers_export.csv"}
    )

@app.post("/api/admin/flag/{customer_id}")
def flag_customer(customer_id: int, request: FlagRequest, db: Session = Depends(get_db), current_admin: models.User = Depends(auth.get_current_admin)):
    customer = db.query(models.User).filter(models.User.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    flag = models.CustomerFlag(
        customer_id=customer_id,
        flagged_by=current_admin.id,
        reason=request.reason,
        created_at=datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    )
    db.add(flag)
    db.commit()
    return {"status": "success", "message": f"Customer {customer.username} flagged for review."}

    return alerts

@app.get("/api/admin/customer/{user_id}")
def get_customer_detail(user_id: int, db: Session = Depends(get_db), current_admin: models.User = Depends(auth.get_current_admin)):
    """Runs full analysis for a specific customer and returns all agent insights."""
    customer = db.query(models.User).filter(models.User.id == user_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    if not customer.transactions:
        return {"status": "No Transactions", "analysis": None}
    
    df = pd.DataFrame([{
        "Date": t.date, 
        "Description": t.description, 
        "Amount": t.amount,
        "Category": t.category
    } for t in customer.transactions])
    
    # 3. Apply the user's specific saved budgets for absolute data consistency
    user_budgets = db.query(models.Budget).filter(models.Budget.user_id == user_id).all()
    budget_map = {b.category: b.limit for b in user_budgets}
    
    analysis = orchestrator.execute(df, budgets=budget_map if budget_map else None)
    
    return {
        "username": customer.username,
        "analysis": analysis
    }

def parse_pdf(file_contents):
    import re
    transactions = []
    
    # Method 1: Table Extraction (Best for structured statement)
    with pdfplumber.open(io.BytesIO(file_contents)) as pdf:
        for page in pdf.pages:
            tables = page.extract_tables()
            for table in tables:
                if not table: continue
                # Skip header-like rows or empty rows
                for row in table:
                    clean_row = [str(x).strip() for x in row if x is not None]
                    if len(clean_row) >= 3 and not any("date" in str(x).lower() for x in clean_row):
                        transactions.append(clean_row)
    
    # Method 2: Text Extraction Fallback (For text-based or messy PDFs)
    if len(transactions) < 2: # If table extraction failed or only found headers
        print("Table extraction failed or yielded too few results. Falling back to text extraction...")
        with pdfplumber.open(io.BytesIO(file_contents)) as pdf:
            for page in pdf.pages:
                text = page.extract_text()
                if not text: continue
                
                # Look for lines that look like: DD/MM/YYYY Description ... Amount
                # Matches: 01/01/2024 Amazon.in 450.00 or 01-Jan-2024 Netflix 799.00
                pattern = r'(\d{1,2}[/-](?:\d{1,2}|[A-Za-z]{3})[/-]\d{2,4})\s+(.*?)\s+(-?[\d,]+\.\d{2})'
                matches = re.findall(pattern, text)
                for m in matches:
                    transactions.append([m[0], m[1], m[2]])

    if not transactions:
        return pd.DataFrame()
    
    # Convert to DataFrame
    df = pd.DataFrame(transactions)
    
    # If we have 3 columns exactly, assume Date, Description, Amount
    if df.shape[1] == 3:
        df.columns = ["Date", "Description", "Amount"]
    else:
        # Try to find headers if we have more columns
        header_idx = -1
        for i, row in df.iterrows():
            row_str = " ".join(str(x) for x in row if x)
            if any(k in row_str.lower() for k in ["date", "desc", "amount"]):
                header_idx = i
                break
        
        if header_idx != -1:
            df.columns = df.iloc[header_idx]
            df = df.drop(df.index[:header_idx+1])
        else:
            # Last resort: just name the first three
            cols = ["Date", "Description", "Amount"]
            df.columns = cols + [f"Col{i}" for i in range(len(df.columns) - 3)]

    return df

@app.post("/api/upload")
async def upload_file(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    # Simple Rate Limiting: Prevent more than 3 uploads in 5 minutes per user
    five_min_ago = (datetime.now() - timedelta(minutes=5)).strftime("%Y-%m-%d %H:%M:%S")
    recent_uploads = db.query(models.Transaction).filter(
        models.Transaction.user_id == current_user.id,
        models.Transaction.date >= five_min_ago # Using date as proxy since we don't have created_at in transactions
    ).count()
    
    # NOTE: Since transactions might be old data, we'll actually use a simple global 
    # check if they have TOO many transactions uploaded recently. 
    # For a demo, we'll just implement the logic check.
    if recent_uploads > 150: # Assuming ~50 transactions per file, 3 files = 150
        raise HTTPException(
            status_code=429, 
            detail="Rate limit exceeded. Too many transaction uploads in the last 5 minutes. This is a security measure against brute-force data faking."
        )
    
    filename = file.filename.lower()
    contents = await file.read()

    if filename.endswith(".csv"):
        try:
            df = pd.read_csv(io.StringIO(contents.decode("utf-8")))
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to parse CSV: {str(e)}")
    elif filename.endswith(".pdf"):
        try:
            df = parse_pdf(contents)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to parse PDF: {str(e)}")
    else:
        raise HTTPException(status_code=400, detail="Only CSV and PDF files are accepted.")

    if df.empty:
         raise HTTPException(status_code=400, detail="No data found in file.")

    required_cols = {"Date", "Description", "Amount"}
    current_cols = set(str(c).lower() for c in df.columns)
    
    # Smart Mapping
    new_cols = {}
    for col in df.columns:
        c = str(col).lower()
        if any(x in c for x in ["date", "period", "value date"]): new_cols[col] = "Date"
        elif any(x in c for x in ["desc", "particulars", "remarks", "narrative", "narration", "details"]): new_cols[col] = "Description"
        elif any(x in c for x in ["amount", "value", "debit", "credit", "withdrawal", "deposit"]): 
            # If we already mapped an amount-like column, this might be split debit/credit
            if "Amount" in new_cols.values():
                # Logic to merge columns later if needed, but for now just take the most likely
                pass 
            new_cols[col] = "Amount"
    
    # Handle Split Debit/Credit columns
    if "Amount" not in new_cols.values():
        debit_col = next((c for c in df.columns if "debit" in str(c).lower() or "withdrawal" in str(c).lower()), None)
        credit_col = next((c for c in df.columns if "credit" in str(c).lower() or "deposit" in str(c).lower()), None)
        
        if debit_col and credit_col:
            # Create Amount column by merging them (assuming debit is neg, credit is pos)
            df["Amount"] = pd.to_numeric(df[credit_col], errors="coerce").fillna(0) - pd.to_numeric(df[debit_col], errors="coerce").fillna(0)
            new_cols[debit_col] = "Old_Debit"
            new_cols[credit_col] = "Old_Credit"
            # Manually ensure Amount is in required_cols check
            required_cols.remove("Amount") # We've created it
    
    if len(new_cols) >= 2: # At least Date and Description
        df = df.rename(columns=new_cols)
    
    # Final check
    if not {"Date", "Description"}.issubset(set(df.columns)) or ("Amount" not in df.columns):
        raise HTTPException(
            status_code=400,
            detail=f"Incomplete columns. Found: {set(df.columns)}. Need mapping for Date, Description, and Amount.",
        )

    # Robust Amount Parsing
    df["Amount"] = df["Amount"].astype(str).str.replace(r'[^\d.-]', '', regex=True)
    df["Amount"] = pd.to_numeric(df["Amount"], errors="coerce")
    df = df.dropna(subset=["Amount", "Description"])
    
    # Robust Date Parsing
    df["Date"] = pd.to_datetime(df["Date"], errors="coerce").dt.strftime("%Y-%m-%d")
    df["Date"] = df["Date"].fillna("Unknown")
    
    for _, row in df.iterrows():
        txn = models.Transaction(
            user_id=current_user.id,
            date=str(row["Date"]),
            description=str(row["Description"]),
            amount=float(row["Amount"]),
            category="Pending"
        )
        db.add(txn)
    db.commit()

    return {"status": "success", "message": f"{len(df)} transactions uploaded."}

@app.get("/api/dashboard")
def get_dashboard(
    food_budget: float = 4000,
    transport_budget: float = 2000,
    shopping_budget: float = 3000,
    other_budget: float = 2000,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    global _latest_context
    transactions = db.query(models.Transaction).filter(models.Transaction.user_id == current_user.id).all()
    if not transactions:
        return {
            "budget_summary": {"income": 0, "expense": 0, "health_score": 0},
            "category_spending": {},
            "anomalies": [],
            "forecast": [],
            "advice": ["Please upload a transaction file to see your health analysis."],
            "budget_alerts": [],
            "subscriptions": [],
            "monthly_trends": [],
            "tax_info": {"estimated_tax": 0, "tax_bracket": "N/A"},
            "savings_plan": [],
            "fraud_analysis": {"reliability_score": 100, "public_flags": [], "status": "Verified"}
        }
    
    df = pd.DataFrame([{
        "Date": t.date,
        "Description": t.description,
        "Amount": t.amount
    } for t in transactions])

    budgets = {
        "Food": food_budget,
        "Transport": transport_budget,
        "Shopping": shopping_budget,
        "Other": other_budget,
    }

    try:
        result = orchestrator.execute(df, budgets)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

    new_history = models.HealthScoreHistory(
        user_id=current_user.id,
        score=result["budget_summary"]["health_score"],
        date=datetime.now().strftime("%Y-%m-%d")
    )
    db.add(new_history)
    db.commit()

    _latest_context = {
        "ai_context": result["ai_context"],
        "budget_summary": result["budget_summary"],
        "category_spending": result["category_spending"],
    }

    # Obfuscate fraud details for the user dashboard
    if "fraud_analysis" in result:
        # User only sees public flags, never the forensic 'private_flags'
        result["fraud_analysis"].pop("private_flags", None)
        
    return result

@app.post("/api/simulate")
def simulate_purchase(request: SimulationRequest, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    """Simulates a hypothetical purchase and returns projected impact."""
    # 1. Get current data
    user_txs = db.query(models.Transaction).filter(models.Transaction.user_id == current_user.id).all()
    if not user_txs:
        return {"projected_health_score": 0, "alerts": ["No historical data to simulate against."]}
    
    # 2. Convert to DataFrame
    df_current = pd.DataFrame([{
        "Date": t.date, 
        "Description": t.description, 
        "Amount": t.amount,
        "Category": t.category
    } for t in user_txs])

    # Add the single hypothetical transaction
    hypothetical_tx = pd.DataFrame([{
        "Date": datetime.now().strftime("%Y-%m-%d"),
        "Description": f"HYPOTHETICAL: {request.category}",
        "Amount": -abs(request.amount),
        "Category": request.category
    }])
    
    df_simulated = pd.concat([df_current, hypothetical_tx], ignore_index=True)
    
    # 3. Get User Budgets
    user_budgets = db.query(models.Budget).filter(models.Budget.user_id == current_user.id).all()
    budget_map = {b.category: b.limit for b in user_budgets}
    
    # 4. Run shadow analysis
    analysis = orchestrator.execute(df_simulated, budgets=budget_map if budget_map else None)
    
    # 5. Extract results
    return {
        "projected_health_score": analysis["budget_summary"]["health_score"],
        "alerts": analysis["budget_alerts"],
        "category_total": analysis["category_spending"].get(request.category, 0),
        "income": analysis["budget_summary"]["income"],
        "expense": analysis["budget_summary"]["expense"]
    }

@app.get("/api/goals")
def get_goals(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    return db.query(models.SavingsGoal).filter(models.SavingsGoal.user_id == current_user.id).all()

@app.post("/api/goals")
def create_goal(goal: SavingsGoalCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    new_goal = models.SavingsGoal(
        user_id=current_user.id,
        name=goal.name,
        target=goal.target,
        deadline=goal.deadline
    )
    db.add(new_goal)
    db.commit()
    return new_goal

@app.patch("/api/goals/{goal_id}")
def update_goal(goal_id: int, update: SavingsGoalUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    goal = db.query(models.SavingsGoal).filter(models.SavingsGoal.id == goal_id, models.SavingsGoal.user_id == current_user.id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    goal.saved = update.saved
    db.commit()
    return goal

@app.delete("/api/goals/{goal_id}")
def delete_goal(goal_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    goal = db.query(models.SavingsGoal).filter(models.SavingsGoal.id == goal_id, models.SavingsGoal.user_id == current_user.id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    db.delete(goal)
    db.commit()
    return {"status": "success"}

@app.get("/api/score-history")
def get_score_history(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    return db.query(models.HealthScoreHistory).filter(models.HealthScoreHistory.user_id == current_user.id).order_by(models.HealthScoreHistory.date).all()

@app.get("/api/suggested-budgets")
def get_suggested_budgets(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    transactions = db.query(models.Transaction).filter(models.Transaction.user_id == current_user.id).all()
    if not transactions:
        return {}
    df = pd.DataFrame([{"Amount": t.amount, "Description": t.description} for t in transactions])
    df = orchestrator.spending.run(df)
    expense_df = df[df["Amount"] < 0].copy()
    category_spending = expense_df.groupby("Category")["Amount"].sum().abs().to_dict()
    return orchestrator.personal_budget.run(category_spending)

@app.post("/api/chat")
async def chat(request: ChatRequest, current_user: models.User = Depends(auth.get_current_user)):
    """Send a message to the AI advisor via Gemini (primary) or local Ollama (fallback)."""
    global _latest_context

    user_message = request.message.strip()
    if not user_message:
        raise HTTPException(status_code=400, detail="Message cannot be empty.")

    context = request.context or _latest_context.get("ai_context", "")
    prompt = (
        f"System Context:\n{context}\n\n"
        f"User Question: {user_message}\n\n"
        f"As CareBank AI, provide a friendly, professional financial response. "
        f"Reference actual data from the context. Be concise and actionable."
    )

    # 1. TRY GEMINI (Cloud AI)
    gemini_key = os.getenv("GEMINI_API_KEY")
    if gemini_key:
        try:
            genai.configure(api_key=gemini_key)
            model = genai.GenerativeModel('gemini-2.0-flash')
            response = model.generate_content(prompt)
            if response and response.text:
                return {"reply": response.text, "source": "gemini-cloud"}
        except Exception as e:
            print(f"Gemini API error: {e}")

    # 2. TRY OLLAMA (Local AI Fallback)
    try:
        import httpx
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "http://localhost:11434/api/generate",
                json={"model": "llama3.2", "prompt": prompt, "stream": False},
                timeout=12.0
            )
            if response.status_code == 200:
                reply_text = response.json().get("response", "")
                if reply_text:
                    return {"reply": reply_text, "source": "local-ollama"}
    except Exception as e:
        print(f"Ollama local error: {e}")

    # 3. RULE-BASED FALLBACK
    reply = _fallback_response(user_message, _latest_context)
    return {"reply": reply, "source": "rule-fallback"}

def _fallback_response(message: str, context: dict) -> str:
    text = message.lower()
    budget = context.get("budget_summary", {})
    spending = context.get("category_spending", {})
    income = budget.get("income", 0)
    expense = budget.get("expense", 0)
    score = budget.get("health_score", 0)

    if spending:
        top_category = max(spending, key=spending.get)
        top_value = spending[top_category]
    else:
        top_category = "N/A"
        top_value = 0

    if "reduce" in text or "save" in text:
        return f"Your highest spending is in {top_category} (₹{top_value:,.0f}). Reducing this by 20% would save you ₹{top_value*0.2:,.0f}."
    elif "score" in text or "health" in text:
        return f"Your health score is {score}/100. Income: ₹{income:,.0f}, Expenses: ₹{expense:,.0f}."
    else:
        return f"Income: ₹{income:,.0f}, Expenses: ₹{expense:,.0f}, Score: {score}/100. Ask me for saving tips!"

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
