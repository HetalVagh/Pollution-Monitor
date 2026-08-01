# 🏭 Smart Industrial Pollution Monitoring System
## Golden Corridor (Vapi – Ankleshwar – Vatva), Gujarat, India
### Challenge 9 – Environmental Sustainability | Agentic AI Powered

---

## 📋 Overview

A full-stack **Agentic AI** solution for continuous real-time monitoring of industrial emissions and effluents in the Golden Corridor industrial belt. The system detects violations, generates intelligent insights, and triggers multi-channel regulatory alerts.

**Monitored Locations:** Vapi (Chemical/Metal) | Ankleshwar (Dye/Agro-Chem) | Vatva (Pharma/Textile)

---

## 🚀 Quick Start (One Click)

### Step 1 — Install (First time only)
Double-click: **`INSTALL.bat`**

### Step 2 — Run the App
Double-click: **`START_APP.bat`**

### Step 3 — Create Public URL (Optional)
Double-click: **`CREATE_PUBLIC_URL.bat`**

### Step 4 — Stop the App
Double-click: **`STOP_APP.bat`**

---

## 🌐 URLs

| Service | URL |
|---------|-----|
| **Frontend Dashboard** | http://localhost:3000 |
| **Backend API** | http://localhost:5000 |
| **Health Check** | http://localhost:5000/api/health |
| **Dashboard Stats** | http://localhost:5000/api/dashboard |
| **Industrial Units** | http://localhost:5000/api/units |
| **Violations** | http://localhost:5000/api/violations |
| **Alerts** | http://localhost:5000/api/alerts |
| **AI Insights** | http://localhost:5000/api/ai-insights |
| **Trend Data** | http://localhost:5000/api/trend |

---

## 🏗️ Architecture

```
pollution-monitor/
├── backend/
│   ├── server.js          ← Express + Socket.io API
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.js          ← Main React App
│   │   ├── App.css         ← Global Styles
│   │   └── components/
│   │       ├── Dashboard.js      ← KPI + Charts
│   │       ├── MapView.js        ← Interactive Map
│   │       ├── ViolationsPanel.js← Violation Management
│   │       ├── AlertsPanel.js    ← Alert Center
│   │       ├── AIInsights.js     ← AI Analysis Panel
│   │       ├── TrendChart.js     ← Pollutant Trends
│   │       └── UnitDetails.js    ← Unit Deep Dive
│   └── package.json
├── INSTALL.bat           ← Install dependencies
├── START_APP.bat         ← Launch application
├── STOP_APP.bat          ← Stop all services
└── CREATE_PUBLIC_URL.bat ← Create ngrok tunnel
```

---

## 🤖 AI Engine Features

| Feature | Description |
|---------|-------------|
| **Trend Analysis** | Detects consistent upward trends, predicts breaches 30+ min ahead |
| **Pattern Anomaly** | Statistical deviation from historical baselines |
| **Cross-Unit Correlation** | Identifies simultaneous multi-unit events (systemic incidents) |
| **Automated Alerting** | Multi-channel: SMS, Email, App Push, Siren |
| **Real-time Simulation** | New readings every 15 seconds per industrial unit |

---

## 🧪 Monitored Pollutants

### Air Emissions (CPCB Standards)
| Pollutant | Safe | Warning | Critical |
|-----------|------|---------|---------|
| SO₂       | 40 µg/m³ | 80 µg/m³ | 120 µg/m³ |
| NO₂       | 40 µg/m³ | 80 µg/m³ | 150 µg/m³ |
| PM2.5     | 25 µg/m³ | 60 µg/m³ | 120 µg/m³ |
| VOC       | 200 µg/m³ | 500 µg/m³ | 1000 µg/m³ |
| H₂S       | 7 µg/m³ | 14 µg/m³ | 28 µg/m³ |

### Water Effluents (MoEF Standards)
| Parameter | Safe | Warning | Critical |
|-----------|------|---------|---------|
| COD       | 100 mg/L | 200 mg/L | 400 mg/L |
| BOD       | 30 mg/L | 60 mg/L | 120 mg/L |
| Lead      | 0.01 mg/L | 0.05 mg/L | 0.1 mg/L |
| Mercury   | 0.001 mg/L | 0.01 mg/L | 0.05 mg/L |

---

## 📡 Alert System

- **P1 (Critical)**: SMS + Email + App Push + Siren
- **P2 (Warning)**: Email + App Push
- **Recipients**: GPCB Gujarat, CPCB Delhi, Local Collector, Municipal Authority

---

## ⚙️ Requirements

- **Node.js** v16+ (https://nodejs.org/)
- **npm** v8+ (comes with Node.js)
- **Browser**: Chrome, Firefox, Edge (modern version)
- **RAM**: 2GB minimum | **Disk**: 500MB
