from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Task(BaseModel):
    text: str
    category: str

tasks_by_category = {}

@app.get("/tasks")
def get_tasks():
    return tasks_by_category

@app.post("/tasks")
def add_task(task: Task):
    if task.category not in tasks_by_category:
        tasks_by_category[task.category] = []
    tasks_by_category[task.category].append(task.text)
    return {"message": "Task added"}
