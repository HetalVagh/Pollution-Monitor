import React, { useState, useEffect, useCallback } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import Dashboard from './components/Dashboard';
import MapView from './components/MapView';
import ViolationsPanel from './components/ViolationsPanel';
import AlertsPanel from './components/AlertsPanel';
import AIInsights from './components/AIInsights';
import TrendChart from './components/TrendChart';
import UnitDetails from './components/UnitDetails';
import './App.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

export default function App() {
  const [activeTab, setActiveTab]     = useState('dashboard');
  const [units, setUnits]             = useState([]);
  const [readings, setReadings]       = useState([]);
  const [violations, setViolations]   = useState([]);
  const [alerts, setAlerts]           = useState([]);
  const [aiInsights, setAiInsights]   = useState([]);
  const [stats, setStats]             = useState({});
  const [connected, setConnected]     = useState(false);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [lastUpdate, setLastUpdate]   = useState(null);
  const [socket, setSocket]           = useState(null);
  const [notifications, setNotifications] = useState([]);

  const showNotification = useCallback((msg, type = 'info') => {
    const n = { id: Date.now(), msg, type };
    setNotifications(p => [n, ...p].slice(0, 5));
    setTimeout(() => setNotifications(p => p.filter(x => x.id !== n.id)), 5000);
  }, []);

  useEffect(() => {
    const sock = io(BACKEND_URL, { transports: ['websocket', 'polling'] });
    setSocket(sock);

    sock.on('connect',    () => { setConnected(true);  showNotification('Connected to monitoring server', 'success'); });
    sock.on('disconnect', () => { setConnected(false); showNotification('Disconnected from server', 'error'); });

    sock.on('initialData', data => {
      setUnits(data.units || []);
      setReadings(data.readings || []);
      setViolations(data.violations || []);
      setAlerts(data.alerts || []);
      setAiInsights(data.aiInsights || []);
      setStats(data.stats || {});
      setLastUpdate(new Date());
    });

    sock.on('sensorUpdate', ({ readings: newReadings }) => {
      setReadings(prev => {
        const merged = [...prev, ...newReadings];
        return merged.slice(-500);
      });
      setLastUpdate(new Date());
    });

    sock.on('violation', ({ violation, alert }) => {
      setViolations(prev => [violation, ...prev].slice(0, 200));
      setAlerts(prev => [alert, ...prev].slice(0, 200));
      showNotification(`🚨 ${violation.severity.toUpperCase()}: ${violation.unitName} — ${violation.pollutant}`, violation.severity);
    });

    sock.on('aiInsight', insight => {
      setAiInsights(prev => [insight, ...prev].slice(0, 50));
      showNotification(`🤖 AI: ${insight.type.replace(/_/g, ' ')}`, 'warning');
    });

    sock.on('dashboardUpdate', stats => {
      setStats(stats);
      setLastUpdate(new Date());
    });

    // Fetch initial units list
    axios.get(`${BACKEND_URL}/api/units`).then(r => setUnits(r.data)).catch(() => {});

    return () => sock.disconnect();
  }, [showNotification]);

  const refreshData = async () => {
    try {
      const [u, v, a, i, s] = await Promise.all([
        axios.get(`${BACKEND_URL}/api/units`),
        axios.get(`${BACKEND_URL}/api/violations?limit=50`),
        axios.get(`${BACKEND_URL}/api/alerts?limit=50`),
        axios.get(`${BACKEND_URL}/api/ai-insights`),
        axios.get(`${BACKEND_URL}/api/dashboard`)
      ]);
      setUnits(u.data); setViolations(v.data); setAlerts(a.data);
      setAiInsights(i.data); setStats(s.data);
      showNotification('Data refreshed', 'success');
    } catch { showNotification('Refresh failed', 'error'); }
  };

  const acknowledgeAlert = async (alertId) => {
    try {
      await axios.put(`${BACKEND_URL}/api/alerts/${alertId}/acknowledge`);
      setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, acknowledged: true } : a));
      showNotification('Alert acknowledged', 'success');
    } catch { showNotification('Failed to acknowledge', 'error'); }
  };

  const resolveViolation = async (violationId) => {
    try {
      await axios.put(`${BACKEND_URL}/api/violations/${violationId}/resolve`);
      setViolations(prev => prev.map(v => v.id === violationId ? { ...v, status: 'resolved' } : v));
      showNotification('Violation resolved', 'success');
    } catch { showNotification('Failed to resolve', 'error'); }
  };

  const tabs = [
    { id: 'dashboard',   label: '📊 Dashboard',   count: null },
    { id: 'map',         label: '🗺️ Live Map',     count: null },
    { id: 'violations',  label: '⚠️ Violations',   count: violations.filter(v => v.status === 'active').length },
    { id: 'alerts',      label: '🔔 Alerts',       count: alerts.filter(a => !a.acknowledged).length },
    { id: 'ai',          label: '🤖 AI Insights',  count: aiInsights.length },
    { id: 'trends',      label: '📈 Trends',       count: null },
    { id: 'units',       label: '🏭 Units',        count: null }
  ];

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <div className="header-left">
          <div className="logo">🏭</div>
          <div className="header-title">
            <h1>Golden Corridor Pollution Monitor</h1>
            <span className="subtitle">Vapi · Ankleshwar · Vatva — Real-time Industrial Monitoring</span>
          </div>
        </div>
        <div className="header-right">
          <div className={`connection-status ${connected ? 'connected' : 'disconnected'}`}>
            <span className="status-dot" />
            {connected ? 'Live' : 'Offline'}
          </div>
          {lastUpdate && (
            <div className="last-update">
              Updated: {lastUpdate.toLocaleTimeString()}
            </div>
          )}
          <button className="refresh-btn" onClick={refreshData}>↻ Refresh</button>
        </div>
      </header>

      {/* Notification Stack */}
      <div className="notifications">
        {notifications.map(n => (
          <div key={n.id} className={`notification notification-${n.type}`}>{n.msg}</div>
        ))}
      </div>

      {/* Status Bar */}
      <div className="status-bar">
        <div className="status-item critical">
          <span className="status-number">{stats.criticalCount || 0}</span>
          <span className="status-label">Critical</span>
        </div>
        <div className="status-item warning">
          <span className="status-number">{stats.warningCount || 0}</span>
          <span className="status-label">Warning</span>
        </div>
        <div className="status-item normal">
          <span className="status-number">{stats.normalCount || 0}</span>
          <span className="status-label">Normal</span>
        </div>
        <div className="status-divider" />
        <div className="status-item">
          <span className="status-number alert-num">{stats.activeViolations || 0}</span>
          <span className="status-label">Active Violations</span>
        </div>
        <div className="status-item">
          <span className="status-number alert-num">{stats.pendingAlerts || 0}</span>
          <span className="status-label">Pending Alerts</span>
        </div>
        <div className="status-item">
          <span className="status-number">{stats.avgAQI || 0}</span>
          <span className="status-label">Avg AQI</span>
        </div>
        <div className="status-item">
          <span className="status-number">{stats.totalUnits || 0}</span>
          <span className="status-label">Monitored Units</span>
        </div>
      </div>

      {/* Tabs */}
      <nav className="tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
            {tab.count > 0 && <span className="tab-badge">{tab.count}</span>}
          </button>
        ))}
      </nav>

      {/* Main Content */}
      <main className="main-content">
        {activeTab === 'dashboard'  && <Dashboard units={units} stats={stats} readings={readings} violations={violations} alerts={alerts} backendUrl={BACKEND_URL} />}
        {activeTab === 'map'        && <MapView units={units} readings={readings} onUnitSelect={u => { setSelectedUnit(u); setActiveTab('units'); }} />}
        {activeTab === 'violations' && <ViolationsPanel violations={violations} onResolve={resolveViolation} />}
        {activeTab === 'alerts'     && <AlertsPanel alerts={alerts} onAcknowledge={acknowledgeAlert} />}
        {activeTab === 'ai'         && <AIInsights insights={aiInsights} />}
        {activeTab === 'trends'     && <TrendChart units={units} backendUrl={BACKEND_URL} />}
        {activeTab === 'units'      && <UnitDetails units={units} readings={readings} selectedUnit={selectedUnit} onSelectUnit={setSelectedUnit} backendUrl={BACKEND_URL} />}
      </main>

      <footer className="app-footer">
        <span>Smart Industrial Pollution Monitoring System — Golden Corridor (Vapi–Ankleswar) | GPCB / CPCB Standards | Agentic AI Powered</span>
      </footer>
    </div>
  );
}
