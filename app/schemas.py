from datetime import date
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class TaskCreate(BaseModel):
    title: str = Field(min_length=1, max_length=150)
    description: str = Field(default="", max_length=500)
    status: Literal["Pending", "In Progress", "Completed"] = "Pending"
    priority: Literal["Low", "Medium", "High"] = "Medium"
    due_date: date | None = None


class TaskUpdate(BaseModel):
    title: str = Field(min_length=1, max_length=150)
    description: str = Field(default="", max_length=500)
    status: Literal["Pending", "In Progress", "Completed"] = "Pending"
    priority: Literal["Low", "Medium", "High"] = "Medium"
    due_date: date | None = None


class TaskResponse(BaseModel):
    id: int
    title: str
    description: str
    status: str
    priority: str
    due_date: date | None
    user_id: int

    model_config = ConfigDict(from_attributes=True)


class UserCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    email: str = Field(min_length=1, max_length=150)
    password: str = Field(min_length=8, max_length=100)


class UserLogin(BaseModel):
    email: str
    password: str


class UserResponse(BaseModel):
    id: int
    name: str
    email: str

    model_config = ConfigDict(from_attributes=True)


class LoginResponse(BaseModel):
    access_token: str
    token_type: str
