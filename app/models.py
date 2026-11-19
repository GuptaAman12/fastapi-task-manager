from datetime import date

from sqlalchemy import String, Date, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from .database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100))
    email: Mapped[str] = mapped_column(String(150), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))


class Task(Base):
    __tablename__ = "tasks"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(150))
    description: Mapped[str] = mapped_column(String(500), default="")
    status: Mapped[str] = mapped_column(String(20), default="Pending")
    priority: Mapped[str] = mapped_column(String(20), default="Medium")
    due_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
