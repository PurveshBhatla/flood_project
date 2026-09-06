# 🌊 FloodVision - AI Flood Monitoring, Risk Prediction & Alert Platform

**FloodVision** is a production-ready, full-stack, AI-powered flood monitoring, prediction, early warning alert, and GIS visualization platform designed for emergency responders, government authorities, and citizens.

---

## 🚀 Key Features

* **Real-Time Hydrological Telemetry**: Integrates live precipitation, humidity, temperature, and river water level telemetry gauges.
* **AI Machine Learning Prediction**: Hydrological scoring model & Python FastAPI microservice estimating flood probability, risk score (0-100), and risk categories (LOW, MODERATE, HIGH, CRITICAL).
* **Interactive GIS Flood Map**: Leaflet interactive map with color-coded risk heatmaps, monitoring station pins, active alert radiuses, preset locations, and browser geolocation.
* **Personalized User Dashboard**: Saved locations management, live flood risk gauges, Recharts 24-hour trend graphs, weather widgets, and recommended emergency actions.
* **Real-Time Emergency Alert System**: Broadcast emergency alerts, location-based notifications, and Server-Sent Events (SSE) live telemetry updates.
* **Administrator Command Portal**: User directory role control, emergency broadcast dispatch, monitoring station threshold updates, historical flood logs, and system health status.
* **Safety & Evacuation Guide**: Actionable instructions before, during, and after flood events + 24/7 disaster hotline directory.

---

## 🛠️ Tech Stack

* **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Lucide React icons, Leaflet (`react-leaflet`), Recharts.
* **Backend**: Next.js API Routes (`app/api/*`), Jose / JsonWebToken for Auth, Bcryptjs for password hashing, Zod validation.
* **Database**: PostgreSQL / SQLite with Prisma ORM.
* **ML Microservice**: Python 3.10+, FastAPI, Uvicorn, Scikit-learn (`/ml-service`).
* **Real-Time Stream**: Server-Sent Events (`/api/stream/alerts`).

---

## 🔑 Demo Credentials

| Role | Email | Password | Access Level |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@floodvision.org` | `Admin@123456` | Full System & Broadcast Access |
| **Demo User** | `user@floodvision.org` | `User@123456` | User Dashboard & Monitored Locations |

*(One-click demo login buttons are also available on the `/login` page)*

---

## ⚙️ Environment Variables (`.env`)

```env
NODE_ENV=development
PORT=3000
DATABASE_URL="file:./dev.db"
JWT_SECRET="floodvision-super-secret-jwt-key-2026-secure-production-ready"
ML_SERVICE_URL="http://127.0.0.1:8000"
OPEN_METEO_API_URL="https://api.open-meteo.com/v1"
```

---

## 📦 Setup & Running Locally

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Database & Seed Data
```bash
npx prisma db push
npm run prisma:seed
```

### 3. Run Automated Tests
```bash
npm test
```

### 4. Start Next.js Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🐍 Python FastAPI ML Microservice (`/ml-service`)

### Run Python ML Microservice
```bash
cd ml-service
pip install -r requirements.txt
python main.py
```
Microservice runs on `http://127.0.0.1:8000` with Swagger UI at `http://127.0.0.1:8000/docs`.

### How to Replace Baseline Algorithm with a Trained Model:
1. Save your trained PyTorch, TensorFlow, XGBoost, or Scikit-learn `.joblib` model into `/ml-service/saved_model.joblib`.
2. Open `/ml-service/model.py` and uncomment the model loading code inside `__init__`:
   ```python
   import joblib
   self.model = joblib.load("saved_model.joblib")
   ```
3. Update `predict()` to feed feature arrays into `self.model.predict_proba(features)`.

---

## 📡 API Endpoints Summary

### Authentication
* `POST /api/auth/register` - Create user account
* `POST /api/auth/login` - Authenticate & set HTTP-only JWT cookie
* `POST /api/auth/logout` - Clear session token
* `GET /api/auth/me` - Fetch current user session

### Locations & Telemetry
* `GET /api/locations` - User saved locations with latest risk
* `POST /api/locations` - Add monitored location
* `DELETE /api/locations/:id` - Delete location
* `GET /api/weather?lat=&lng=` - Real-time weather telemetry

### Prediction & Alerts
* `GET /api/flood/risk?lat=&lng=` - Comprehensive flood risk assessment
* `POST /api/predictions` - AI prediction engine call
* `GET /api/alerts` - Active emergency alerts
* `POST /api/alerts` - Admin trigger emergency alert
* `GET /api/stream/alerts` - SSE real-time alert feed

### Admin Management
* `GET /api/admin/users` - User directory & role management
* `GET /api/admin/statistics` - KPI metrics & risk distributions
* `GET /api/admin/system-status` - Service telemetry & latency monitoring

---

## 🐳 Docker Deployment

```bash
docker-compose up --build
```

---

## 📄 License
Production-Ready Application built for environmental disaster management.
