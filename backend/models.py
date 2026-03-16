from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(String, default="customer") # 'customer' or 'banker'

    transactions = relationship("Transaction", back_populates="owner")
    budgets = relationship("Budget", back_populates="owner")
    savings_goals = relationship("SavingsGoal", back_populates="owner")
    health_history = relationship("HealthScoreHistory", back_populates="owner")
    flags = relationship("CustomerFlag", back_populates="customer", foreign_keys="[CustomerFlag.customer_id]")

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    date = Column(String)
    description = Column(String)
    amount = Column(Float)
    category = Column(String)

    owner = relationship("User", back_populates="transactions")

class Budget(Base):
    __tablename__ = "budgets"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    category = Column(String)
    limit = Column(Float)

    owner = relationship("User", back_populates="budgets")

class SavingsGoal(Base):
    __tablename__ = "savings_goals"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String)
    target = Column(Float)
    saved = Column(Float, default=0.0)
    deadline = Column(String)

    owner = relationship("User", back_populates="savings_goals")

class HealthScoreHistory(Base):
    __tablename__ = "health_score_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    score = Column(Integer)
    date = Column(String)

    owner = relationship("User", back_populates="health_history")

class CustomerFlag(Base):
    __tablename__ = "customer_flags"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("users.id"))
    flagged_by = Column(Integer, ForeignKey("users.id"))
    reason = Column(String)
    created_at = Column(String)

    customer = relationship("User", foreign_keys=[customer_id], back_populates="flags")
