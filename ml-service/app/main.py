import app
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import datetime
from app.routers import (
    disease_prediction,
    doctor_recommendation,
    risk_prediction,
    bias_metrics,
    report_analysis
)
from app.services.gemini_service import get_gemini_chat_reply
from app.schemas.schemas import ChatbotRequest, ChatbotResponse

app = FastAPI(
    title="MediMind AI/ML Core Microservice",
    description="FastAPI service implementing the 4 Enhanced AI Layers: 25. NLP Engine, 26. Risk Assessment Model, 27. Recommendation Engine, and 28. Health Insights Engine.",
    version="2.0.0"
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers aligned with the architecture diagram
app.include_router(disease_prediction.router, tags=["25. NLP Engine (Symptom Understanding)"])
app.include_router(risk_prediction.router, tags=["26. Risk Assessment Model (Triage)"])
app.include_router(doctor_recommendation.router, tags=["27. Recommendation Engine (Doctor Match)"])
app.include_router(report_analysis.router, tags=["28. Health Insights Engine (Report Analysis)"])
app.include_router(bias_metrics.router, tags=["AI Ethics & Bias Metrics"])

@app.post("/chat", response_model=ChatbotResponse, tags=["28. Health Insights Engine (Report Analysis)"])
@app.post("/message", response_model=ChatbotResponse, tags=["28. Health Insights Engine (Report Analysis)"])
def chat_endpoint(payload: ChatbotRequest):
    reply = get_gemini_chat_reply(payload.message, payload.history)
    return ChatbotResponse(
        sender="bot",
        text=reply,
        timestamp=datetime.datetime.now().isoformat()
    )

@app.get("/", tags=["System Monitoring"])
def root():
    return {
        "message": "MediMind AI/ML Core Microservice is running!",
        "status": "online",
        "docs": "/docs",
        "health": "/health"
    }

@app.get("/health", tags=["System Monitoring"])
def health_check():
    return {
        "status": "healthy",
        "service": "MediMind AI/ML Service",
        "architecture_version": "2.0.0",
        "layers": [
            "25. NLP Engine",
            "26. Risk Assessment Model",
            "27. Recommendation Engine",
            "28. Health Insights Engine"
        ]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
