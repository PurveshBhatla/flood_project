from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional
from model import predictor

app = FastAPI(
    title="FloodVision AI Prediction Service",
    description="Microservice for real-time flood risk assessment and machine learning prediction.",
    version="1.0.0"
)

# Enable CORS for Next.js API cross-origin requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class PredictRequest(BaseModel):
    latitude: float = Field(..., example=19.076)
    longitude: float = Field(..., example=72.8777)
    rainfall: float = Field(..., description="Rainfall volume in mm", example=65.5)
    rainfallIntensity: Optional[float] = Field(15.0, description="Rainfall intensity in mm/hour", example=15.0)
    temperature: float = Field(..., description="Temperature in Celsius", example=28.0)
    humidity: Optional[float] = Field(80.0, description="Relative humidity in %", example=85.0)
    waterLevel: float = Field(..., description="River / water level in meters", example=4.5)
    historicalRisk: Optional[float] = Field(0.5, description="Historical flood risk coefficient (0-1)", example=0.6)
    soilMoisture: Optional[float] = Field(70.0, description="Soil saturation percentage", example=75.0)

class PredictResponse(BaseModel):
    riskScore: float
    probability: float
    riskLevel: str
    confidence: float
    recommendation: str

@app.get("/")
def read_root():
    return {
        "service": "FloodVision AI Microservice",
        "status": "online",
        "endpoints": ["/predict", "/health"]
    }

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "ml-service"}

@app.post("/predict", response_model=PredictResponse)
def predict_flood_risk(payload: PredictRequest):
    try:
        result = predictor.predict(
            latitude=payload.latitude,
            longitude=payload.longitude,
            rainfall=payload.rainfall,
            rainfall_intensity=payload.rainfallIntensity,
            temperature=payload.temperature,
            humidity=payload.humidity,
            water_level=payload.waterLevel,
            historical_risk=payload.historicalRisk,
            soil_moisture=payload.soilMoisture
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
