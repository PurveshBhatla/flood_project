from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional
from model import predictor

app = FastAPI(
    title="FloodVision SIH26085 AI Prediction Service",
    description="Microservice for street-level urban flood nowcasting and hydraulic risk assessment.",
    version="2.0.0"
)

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
    rainfallIntensity: Optional[float] = Field(28.5, description="Rainfall intensity in mm/hour", example=28.5)
    temperature: float = Field(26.0, description="Temperature in Celsius", example=26.0)
    humidity: Optional[float] = Field(85.0, description="Relative humidity in %", example=85.0)
    waterLevel: float = Field(4.5, description="Water level in meters", example=4.5)
    historicalRisk: Optional[float] = Field(0.5, description="Historical risk coefficient", example=0.6)
    soilMoisture: Optional[float] = Field(75.0, description="Soil moisture %", example=75.0)
    elevation: Optional[float] = Field(6.5, description="Elevation in meters", example=6.5)
    slope: Optional[float] = Field(0.8, description="Slope percentage", example=0.8)
    runoffCoefficient: Optional[float] = Field(0.85, description="Surface runoff coefficient", example=0.85)
    drainageCapacity: Optional[float] = Field(12.5, description="Drainage capacity m3/s", example=12.5)
    surchargeLoad: Optional[float] = Field(144.0, description="Hydraulic utilization load %", example=144.0)

class PredictResponse(BaseModel):
    riskScore: float
    predictedDepthCm: float
    probability: float
    riskLevel: str
    confidence: float
    recommendation: str
    scientificSummary: str

@app.get("/")
def read_root():
    return {
        "service": "FloodVision SIH26085 AI Microservice",
        "status": "online",
        "version": "2.0.0"
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
            rainfall_intensity=payload.rainfallIntensity or 25.0,
            temperature=payload.temperature,
            humidity=payload.humidity or 80.0,
            water_level=payload.waterLevel,
            historical_risk=payload.historicalRisk or 0.5,
            soil_moisture=payload.soilMoisture or 70.0,
            elevation=payload.elevation or 8.0,
            slope=payload.slope or 1.0,
            runoff_coefficient=payload.runoffCoefficient or 0.85,
            drainage_capacity=payload.drainageCapacity or 12.0,
            surcharge_load=payload.surchargeLoad or 100.0
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
