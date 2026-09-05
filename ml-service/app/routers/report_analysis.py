from fastapi import APIRouter, HTTPException, status
from app.schemas.schemas import ReportAnalysisRequest, ReportAnalysisResponse
from app.services.gemini_service import analyze_report_with_gemini

router = APIRouter()

@router.post("/analyze", response_model=ReportAnalysisResponse)
def analyze_report(payload: ReportAnalysisRequest):
    try:
        result = analyze_report_with_gemini(
            file_name=payload.fileName,
            file_type=payload.fileType,
            file_data=payload.fileData
        )
        return ReportAnalysisResponse(**result)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Report analysis failed: {str(e)}"
        )
