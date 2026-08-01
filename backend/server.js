const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

app.use(cors());
app.use(express.json());

// ─── Industrial Units (Golden Corridor) ──────────────────────────────────────
const industrialUnits = [
  { id: 'U001', name: 'Vapi Chemical Complex',    location: 'Vapi',       lat: 20.3714, lng: 72.9050, type: 'Chemical',      riskLevel: 'High' },
  { id: 'U002', name: 'Ankleshwar Dye Industry',  location: 'Ankleshwar', lat: 21.6266, lng: 73.0007, type: 'Dye & Textile',  riskLevel: 'High' },
  { id: 'U003', name: 'Vatva Pharma Unit',         location: 'Vatva',      lat: 22.9761, lng: 72.6020, type: 'Pharmaceutical', riskLevel: 'Medium' },
  { id: 'U004', name: 'Vapi Plastics Ltd',         location: 'Vapi',       lat: 20.3800, lng: 72.9100, type: 'Plastics',       riskLevel: 'Medium' },
  { id: 'U005', name: 'Ankleshwar Agro-Chem',     location: 'Ankleshwar', lat: 21.6200, lng: 73.0100, type: 'Agro-Chemical',  riskLevel: 'High' },
  { id: 'U006', name: 'Vatva Textile Processing',  location: 'Vatva',      lat: 22.9700, lng: 72.6100, type: 'Textile',        riskLevel: 'Low' },
  { id: 'U007', name: 'Vapi Metal Refinery',       location: 'Vapi',       lat: 20.3650, lng: 72.9150, type: 'Metal',          riskLevel: 'High' },
  { id: 'U008', name: 'Ankleshwar GIDC Plant',     location: 'Ankleshwar', lat: 21.6300, lng: 73.0050, type: 'Multi-Industry', riskLevel: 'Medium' }
];

// ─── Pollutant Thresholds (WHO + CPCB Standards) ─────────────────────────────
const thresholds = {
  air: {
    SO2:    { safe: 40,  warning: 80,   critical: 120,  unit: 'µg/m³' },
    NO2:    { safe: 40,  warning: 80,   critical: 150,  unit: 'µg/m³' },
    PM25:   { safe: 25,  warning: 60,   critical: 120,  unit: 'µg/m³' },
    PM10:   { safe: 50,  warning: 100,  critical: 200,  unit: 'µg/m³' },
    CO:     { safe: 2,   warning: 5,    critical: 10,   unit: 'mg/m³' },
    VOC:    { safe: 200, warning: 500,  critical: 1000, unit: 'µg/m³' },
    H2S:    { safe: 7,   warning: 14,   critical: 28,   unit: 'µg/m³' },
    NH3:    { safe: 100, warning: 200,  critical: 400,  unit: 'µg/m³' }
  },
  water: {
    pH:     { safe: [6.5, 8.5], warning: [6.0, 9.0], critical: [5.0, 10.0], unit: 'pH' },
    COD:    { safe: 100,  warning: 200,  critical: 400,  unit: 'mg/L' },
    BOD:    { safe: 30,   warning: 60,   critical: 120,  unit: 'mg/L' },
    TSS:    { safe: 100,  warning: 200,  critical: 500,  unit: 'mg/L' },
    TDS:    { safe: 500,  warning: 1000, critical: 2000, unit: 'mg/L' },
    Lead:   { safe: 0.01, warning: 0.05, critical: 0.1,  unit: 'mg/L' },
    Mercury:{ safe: 0.001,warning: 0.01, critical: 0.05, unit: 'mg/L' },
    Chromium:{ safe: 0.05,warning: 0.1,  critical: 0.5,  unit: 'mg/L' }
  }
};

// ─── In-Memory State ──────────────────────────────────────────────────────────
let sensorReadings = [];
let violations     = [];
let alerts         = [];
let aiInsights     = [];

// ─── AI Analysis Engine ───────────────────────────────────────────────────────
function analyzeWithAI(readings) {
  const insights = [];
  const unitReadings = {};
  readings.forEach(r => {
    if (!unitReadings[r.unitId]) unitReadings[r.unitId] = [];
    unitReadings[r.unitId].push(r);
  });

  Object.entries(unitReadings).forEach(([unitId, data]) => {
    const unit = industrialUnits.find(u => u.id === unitId);
    if (!unit) return;

    // Trend analysis
    const recentAir   = data.filter(d => d.type === 'air').slice(-5);
    const recentWater = data.filter(d => d.type === 'water').slice(-5);

    if (recentAir.length >= 3) {
      const so2Trend = recentAir.map(r => r.pollutants.SO2 || 0);
      const isRising = so2Trend.every((v, i) => i === 0 || v >= so2Trend[i - 1]);
      if (isRising && so2Trend[so2Trend.length - 1] > thresholds.air.SO2.warning * 0.8) {
        insights.push({
          id: uuidv4(), unitId, unitName: unit.name, location: unit.location,
          type: 'TREND_ALERT',
          message: `AI TREND DETECTED: SO₂ levels showing consistent upward trend at ${unit.name}. Predicted to breach warning threshold within 30 minutes.`,
          severity: 'warning', timestamp: new Date().toISOString(), confidence: 87
        });
      }
    }

    if (recentWater.length >= 2) {
      const codVals = recentWater.map(r => r.pollutants.COD || 0);
      const avgCOD  = codVals.reduce((a, b) => a + b, 0) / codVals.length;
      if (avgCOD > thresholds.water.COD.warning) {
        insights.push({
          id: uuidv4(), unitId, unitName: unit.name, location: unit.location,
          type: 'PATTERN_ANOMALY',
          message: `AI ANOMALY: Elevated COD pattern detected in ${unit.name} effluents. Possible untreated discharge from secondary treatment unit.`,
          severity: avgCOD > thresholds.water.COD.critical ? 'critical' : 'warning',
          timestamp: new Date().toISOString(), confidence: 92
        });
      }
    }
  });

  // Cross-unit correlation
  const highRiskUnits = readings.filter(r =>
    r.overallStatus === 'critical' &&
    industrialUnits.find(u => u.id === r.unitId)?.riskLevel === 'High'
  );
  if (highRiskUnits.length >= 2) {
    const locations = [...new Set(highRiskUnits.map(r =>
      industrialUnits.find(u => u.id === r.unitId)?.location
    ))];
    insights.push({
      id: uuidv4(), unitId: 'MULTI', unitName: 'Multi-Unit Analysis', location: locations.join(', '),
      type: 'CORRELATION_ALERT',
      message: `AI CORRELATION: Multiple high-risk units (${highRiskUnits.length}) showing simultaneous critical readings in ${locations.join(', ')}. Possible systemic event — recommend field inspection.`,
      severity: 'critical', timestamp: new Date().toISOString(), confidence: 95
    });
  }

  return insights;
}

// ─── Sensor Data Generator ────────────────────────────────────────────────────
function generateSensorReading(unit, scenario = 'normal') {
  const multipliers = { normal: 1, elevated: 1.5, violation: 2.2, spike: 3.0 };
  const m = multipliers[scenario] || 1;

  const rnd  = (min, max) => parseFloat((Math.random() * (max - min) + min).toFixed(3));
  const vary = (base, pct) => parseFloat((base * (1 + (Math.random() - 0.5) * pct * m)).toFixed(3));

  const airPollutants = {
    SO2:  vary(35,  0.8),
    NO2:  vary(45,  0.7),
    PM25: vary(28,  0.9),
    PM10: vary(55,  0.8),
    CO:   vary(2.5, 0.7),
    VOC:  vary(220, 1.0),
    H2S:  vary(8,   1.2),
    NH3:  vary(120, 0.9)
  };

  const waterPollutants = {
    pH:      rnd(6.0, 9.5),
    COD:     vary(110, 1.1),
    BOD:     vary(35,  1.0),
    TSS:     vary(110, 0.9),
    TDS:     vary(520, 0.8),
    Lead:    vary(0.012, 1.5),
    Mercury: vary(0.002, 2.0),
    Chromium:vary(0.055, 1.3)
  };

  // Determine status
  const getAirStatus = (p) => {
    if (p.SO2 > thresholds.air.SO2.critical || p.NO2 > thresholds.air.NO2.critical ||
        p.PM25 > thresholds.air.PM25.critical || p.VOC > thresholds.air.VOC.critical) return 'critical';
    if (p.SO2 > thresholds.air.SO2.warning || p.NO2 > thresholds.air.NO2.warning ||
        p.PM25 > thresholds.air.PM25.warning) return 'warning';
    return 'normal';
  };
  const getWaterStatus = (p) => {
    if (p.COD > thresholds.water.COD.critical || p.Lead > thresholds.water.Lead.critical ||
        p.Mercury > thresholds.water.Mercury.critical) return 'critical';
    if (p.COD > thresholds.water.COD.warning || p.BOD > thresholds.water.BOD.warning ||
        p.Lead > thresholds.water.Lead.warning) return 'warning';
    return 'normal';
  };

  const airStatus   = getAirStatus(airPollutants);
  const waterStatus = getWaterStatus(waterPollutants);
  const overallStatus = airStatus === 'critical' || waterStatus === 'critical' ? 'critical'
    : airStatus === 'warning' || waterStatus === 'warning' ? 'warning' : 'normal';

  return [
    {
      id: uuidv4(), unitId: unit.id, unitName: unit.name, location: unit.location,
      lat: unit.lat, lng: unit.lng, type: 'air',
      pollutants: airPollutants, status: airStatus, overallStatus,
      aqi: Math.round(airPollutants.PM25 * 2.5 + airPollutants.SO2 * 0.5),
      timestamp: new Date().toISOString(), scenario
    },
    {
      id: uuidv4(), unitId: unit.id, unitName: unit.name, location: unit.location,
      lat: unit.lat, lng: unit.lng, type: 'water',
      pollutants: waterPollutants, status: waterStatus, overallStatus,
      timestamp: new Date().toISOString(), scenario
    }
  ];
}

// ─── Violation Detector ───────────────────────────────────────────────────────
function detectViolations(readings) {
  const newViolations = [];
  readings.forEach(reading => {
    if (reading.type === 'air') {
      Object.entries(reading.pollutants).forEach(([pollutant, value]) => {
        const limit = thresholds.air[pollutant];
        if (limit && value > limit.critical) {
          newViolations.push({
            id: uuidv4(), unitId: reading.unitId, unitName: reading.unitName,
            location: reading.location, type: 'AIR_VIOLATION', pollutant,
            measuredValue: value, threshold: limit.critical, unit: limit.unit,
            severity: 'critical', readingId: reading.id,
            timestamp: reading.timestamp,
            description: `CRITICAL: ${pollutant} level (${value} ${limit.unit}) exceeds permissible limit of ${limit.critical} ${limit.unit}`,
            regulatoryRef: 'CPCB Emission Standards 2022', status: 'active',
            actionRequired: `Immediate shutdown of ${reading.unitName} emission sources. Notify GPCB within 24 hours.`
          });
        } else if (limit && value > limit.warning) {
          newViolations.push({
            id: uuidv4(), unitId: reading.unitId, unitName: reading.unitName,
            location: reading.location, type: 'AIR_WARNING', pollutant,
            measuredValue: value, threshold: limit.warning, unit: limit.unit,
            severity: 'warning', readingId: reading.id,
            timestamp: reading.timestamp,
            description: `WARNING: ${pollutant} level (${value} ${limit.unit}) approaching critical threshold of ${limit.critical} ${limit.unit}`,
            regulatoryRef: 'CPCB Emission Standards 2022', status: 'active',
            actionRequired: `Reduce emissions. Monitor closely. Prepare compliance report.`
          });
        }
      });
    } else if (reading.type === 'water') {
      Object.entries(reading.pollutants).forEach(([pollutant, value]) => {
        const limit = thresholds.water[pollutant];
        if (!limit || pollutant === 'pH') return;
        if (value > limit.critical) {
          newViolations.push({
            id: uuidv4(), unitId: reading.unitId, unitName: reading.unitName,
            location: reading.location, type: 'WATER_VIOLATION', pollutant,
            measuredValue: value, threshold: limit.critical, unit: limit.unit,
            severity: 'critical', readingId: reading.id,
            timestamp: reading.timestamp,
            description: `CRITICAL: Effluent ${pollutant} (${value} ${limit.unit}) exceeds discharge standard of ${limit.critical} ${limit.unit}`,
            regulatoryRef: 'MoEF Effluent Standards 2022', status: 'active',
            actionRequired: `Stop discharge immediately. Activate ETP emergency protocol. File incident report to GPCB.`
          });
        }
      });
    }
  });
  return newViolations;
}

// ─── Alert Generator ──────────────────────────────────────────────────────────
function generateAlert(violation) {
  const alertTypes = {
    critical: { channels: ['SMS', 'Email', 'App', 'Siren'], priority: 'P1' },
    warning:  { channels: ['Email', 'App'], priority: 'P2' }
  };
  const cfg = alertTypes[violation.severity];
  return {
    id: uuidv4(), violationId: violation.id,
    unitId: violation.unitId, unitName: violation.unitName, location: violation.location,
    type: violation.type, pollutant: violation.pollutant, severity: violation.severity,
    priority: cfg.priority, channels: cfg.channels,
    message: violation.description,
    recipients: {
      regulatory: ['gpcb-gujarat@gov.in', 'cpcb-delhi@gov.in'],
      community:  ['vapi-collector@gujarat.gov.in', 'ankleshwar-municipal@gov.in'],
      industry:   [`compliance@${violation.unitName.toLowerCase().replace(/\s+/g, '')}.com`]
    },
    timestamp: new Date().toISOString(), status: 'sent', acknowledged: false
  };
}

// ─── Initialize with Seed Data ────────────────────────────────────────────────
function initializeSeedData() {
  industrialUnits.forEach(unit => {
    const readings = generateSensorReading(unit, 'normal');
    sensorReadings.push(...readings);
  });
  // Add one critical unit for demo
  const criticalReadings = generateSensorReading(industrialUnits[0], 'violation');
  criticalReadings[0].pollutants.SO2  = 145;
  criticalReadings[0].pollutants.NO2  = 165;
  criticalReadings[0].pollutants.PM25 = 135;
  criticalReadings[0].status          = 'critical';
  criticalReadings[0].overallStatus   = 'critical';
  criticalReadings[1].pollutants.COD  = 420;
  criticalReadings[1].pollutants.Lead = 0.12;
  criticalReadings[1].status          = 'critical';
  sensorReadings.push(...criticalReadings);

  const initViolations = detectViolations(criticalReadings);
  violations.push(...initViolations);
  initViolations.forEach(v => alerts.push(generateAlert(v)));

  aiInsights = analyzeWithAI(sensorReadings);
}

initializeSeedData();

// ─── Real-time Simulation (every 15 seconds) ──────────────────────────────────
setInterval(() => {
  const scenarios = ['normal', 'normal', 'normal', 'elevated', 'elevated', 'violation', 'spike'];
  industrialUnits.forEach(unit => {
    const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
    const readings = generateSensorReading(unit, scenario);
    sensorReadings.push(...readings);
    if (sensorReadings.length > 2000) sensorReadings = sensorReadings.slice(-1000);

    const newViolations = detectViolations(readings);
    if (newViolations.length > 0) {
      violations.push(...newViolations);
      if (violations.length > 500) violations = violations.slice(-300);
      newViolations.forEach(v => {
        const alert = generateAlert(v);
        alerts.push(alert);
        if (alerts.length > 500) alerts = alerts.slice(-300);
        io.emit('violation', { violation: v, alert });
      });
    }

    io.emit('sensorUpdate', { unit, readings, timestamp: new Date().toISOString() });
  });

  const newInsights = analyzeWithAI(sensorReadings.slice(-80));
  if (newInsights.length > 0) {
    aiInsights.push(...newInsights);
    if (aiInsights.length > 100) aiInsights = aiInsights.slice(-50);
    newInsights.forEach(i => io.emit('aiInsight', i));
  }

  // Dashboard summary broadcast
  io.emit('dashboardUpdate', getDashboardStats());
}, 15000);

// ─── Dashboard Stats ──────────────────────────────────────────────────────────
function getDashboardStats() {
  const latest = {};
  [...sensorReadings].reverse().forEach(r => {
    const key = `${r.unitId}-${r.type}`;
    if (!latest[key]) latest[key] = r;
  });
  const latestArr = Object.values(latest);

  const critical = latestArr.filter(r => r.status === 'critical').length;
  const warning  = latestArr.filter(r => r.status === 'warning').length;
  const normal   = latestArr.filter(r => r.status === 'normal').length;

  const activeViolations    = violations.filter(v => v.status === 'active').length;
  const pendingAlerts       = alerts.filter(a => !a.acknowledged).length;
  const avgAQI              = Math.round(latestArr.filter(r => r.aqi).reduce((s, r) => s + r.aqi, 0) /
                               (latestArr.filter(r => r.aqi).length || 1));

  return {
    totalUnits: industrialUnits.length,
    criticalCount: critical, warningCount: warning, normalCount: normal,
    activeViolations, pendingAlerts, totalAlerts: alerts.length,
    totalViolations: violations.length, avgAQI,
    lastUpdated: new Date().toISOString()
  };
}

// ─── REST API Routes ──────────────────────────────────────────────────────────
app.get('/api/health', (_, res) => res.json({ status: 'ok', message: 'Pollution Monitor API running' }));

app.get('/api/dashboard', (_, res) => res.json(getDashboardStats()));

app.get('/api/units', (_, res) => {
  const latest = {};
  [...sensorReadings].reverse().forEach(r => {
    const key = `${r.unitId}-${r.type}`;
    if (!latest[key]) latest[key] = r;
  });
  const enriched = industrialUnits.map(u => ({
    ...u,
    airReading:   latest[`${u.id}-air`]   || null,
    waterReading: latest[`${u.id}-water`] || null,
    status: latest[`${u.id}-air`]?.overallStatus || 'unknown'
  }));
  res.json(enriched);
});

app.get('/api/readings', (req, res) => {
  const { unitId, type, limit = 50 } = req.query;
  let data = [...sensorReadings].reverse();
  if (unitId) data = data.filter(r => r.unitId === unitId);
  if (type)   data = data.filter(r => r.type   === type);
  res.json(data.slice(0, parseInt(limit)));
});

app.get('/api/violations', (req, res) => {
  const { severity, status, limit = 50 } = req.query;
  let data = [...violations].reverse();
  if (severity) data = data.filter(v => v.severity === severity);
  if (status)   data = data.filter(v => v.status   === status);
  res.json(data.slice(0, parseInt(limit)));
});

app.put('/api/violations/:id/resolve', (req, res) => {
  const v = violations.find(v => v.id === req.params.id);
  if (!v) return res.status(404).json({ error: 'Not found' });
  v.status     = 'resolved';
  v.resolvedAt = new Date().toISOString();
  res.json(v);
});

app.get('/api/alerts', (req, res) => {
  const { limit = 50 } = req.query;
  res.json([...alerts].reverse().slice(0, parseInt(limit)));
});

app.put('/api/alerts/:id/acknowledge', (req, res) => {
  const a = alerts.find(a => a.id === req.params.id);
  if (!a) return res.status(404).json({ error: 'Not found' });
  a.acknowledged   = true;
  a.acknowledgedAt = new Date().toISOString();
  res.json(a);
});

app.get('/api/ai-insights', (_, res) => res.json([...aiInsights].reverse().slice(0, 20)));

app.get('/api/thresholds', (_, res) => res.json(thresholds));

app.get('/api/trend', (req, res) => {
  const { unitId, type = 'air', pollutant = 'SO2', points = 20 } = req.query;
  let data = sensorReadings.filter(r => r.unitId === unitId && r.type === type);
  data = data.slice(-parseInt(points));
  const trend = data.map(r => ({
    timestamp: r.timestamp,
    value:     r.pollutants[pollutant] || 0,
    status:    r.status
  }));
  res.json(trend);
});

// ─── WebSocket ────────────────────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`[WS] Client connected: ${socket.id}`);
  socket.emit('initialData', {
    units:        industrialUnits,
    readings:     sensorReadings.slice(-100),
    violations:   violations.slice(-50),
    alerts:       alerts.slice(-50),
    aiInsights:   aiInsights.slice(-20),
    stats:        getDashboardStats(),
    thresholds
  });
  socket.on('disconnect', () => console.log(`[WS] Client disconnected: ${socket.id}`));
  socket.on('acknowledgeAlert', ({ alertId }) => {
    const a = alerts.find(a => a.id === alertId);
    if (a) { a.acknowledged = true; a.acknowledgedAt = new Date().toISOString(); }
  });
  socket.on('resolveViolation', ({ violationId }) => {
    const v = violations.find(v => v.id === violationId);
    if (v) { v.status = 'resolved'; v.resolvedAt = new Date().toISOString(); }
  });
});

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  Smart Industrial Pollution Monitor — Golden Corridor');
  console.log('  Vapi | Ankleshwar | Vatva');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`  Backend API  : http://localhost:${PORT}`);
  console.log(`  Health Check : http://localhost:${PORT}/api/health`);
  console.log(`  Dashboard    : http://localhost:${PORT}/api/dashboard`);
  console.log('═══════════════════════════════════════════════════════════');
});
