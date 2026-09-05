import os
import json
from fastapi import APIRouter, HTTPException, status
from typing import Dict, Any
from app.config import BIAS_FILE

router = APIRouter()

@router.get("/bias_metrics", response_model=Dict[str, Any])
def get_bias_metrics():
    if not os.path.exists(BIAS_FILE):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bias metrics file not found."
        )
        
    try:
        with open(BIAS_FILE, "r") as f:
            data = json.load(f)
        return data
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to read bias metrics: {str(e)}"
        )
