import React, { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

const COLORS = { critical: '#ef4444', warning: '#f59e0b', normal: '#10b981' };

export default function Dashboard({ units, stats, readings, violations, alerts }) {
  const latestByUnit = useMemo(() => {
    const map = {};
    [...readings].reverse().forEach(r => {
      const key = `${r.unitId}-${r.type}`;
      if (!map[key]) map[key] = r;
    });
    return Object.values(map);
  }, [readings]);

  const pieData = [
    { name: 'Critical', value: stats.criticalCount || 0 },
    { name: 'Warning',  value: stats.warningCount  || 0 },
    { name: 'Normal',   value: stats.normalCount   || 0 },
  ];

  const barData = units.map(u => {
    const air = latestByUnit.find(r => r.unitId === u.id && r.type === 'air');
    return {
      name: u.name.split(' ').slice(0, 2).join(' '),
      SO2:  air?.pollutants?.SO2  || 0,
      NO2:  air?.pollutants?.NO2  || 0,
      PM25: air?.pollutants?.PM25 || 0,
    };
  });

  const recentViolations = [...violations].filter(v => v.status === 'active').slice(0, 5);
  const recentAlerts     = [...alerts].filter(a => !a.acknowledged).slice(0, 5);

  return (
    <div>
      {/* KPI Row */}
      <div className="grid-4" style={{ marginBottom: 20 }}>
        <div className="stat-card c-critical">
          <span className="stat-card-val">{stats.activeViolations || 0}</span>
          <span className="stat-card-label">Active Violations</span>
          <span className="stat-card-sub">Requires immediate action</span>
        </div>
        <div className="stat-card c-warning">
          <span className="stat-card-val">{stats.pendingAlerts || 0}</span>
          <span className="stat-card-label">Pending Alerts</span>
          <span className="stat-card-sub">Unacknowledged notifications</span>
        </div>
        <div className="stat-card c-accent">
          <span className="stat-card-val">{stats.avgAQI || 0}</span>
          <span className="stat-card-label">Average AQI</span>
          <span className="stat-card-sub">Across all monitored units</span>
        </div>
        <div className="stat-card c-normal">
          <span className="stat-card-val">{stats.totalUnits || 0}</span>
          <span className="stat-card-label">Monitored Units</span>
          <span className="stat-card-sub">Vapi · Ankleshwar · Vatva</span>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: 20 }}>
        {/* Pie Chart */}
        <div className="card">
          <div className="card-title">Sensor Status Distribution</div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={COLORS[entry.name.toLowerCase()]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 6, color: '#e2e8f0' }} />
              <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Bar Chart */}
        <div className="card">
          <div className="card-title">Air Pollutant Levels by Unit (µg/m³)</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData} margin={{ top: 5, right: 10, left: -10, bottom: 40 }}>
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} angle={-30} textAnchor="end" interval={0} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 6, color: '#e2e8f0' }} />
              <Bar dataKey="SO2"  fill="#ef4444" radius={[2,2,0,0]} />
              <Bar dataKey="NO2"  fill="#f59e0b" radius={[2,2,0,0]} />
              <Bar dataKey="PM25" fill="#8b5cf6" radius={[2,2,0,0]} />
              <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 12 }} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid-2">
        {/* Recent Violations */}
        <div className="card">
          <div className="card-title">⚠️ Recent Active Violations</div>
          {recentViolations.length === 0 ? (
            <div className="empty-state"><div className="icon">✅</div><p>No active violations</p></div>
          ) : (
            recentViolations.map(v => (
              <div key={v.id} className="list-item" style={{ marginBottom: 8 }}>
                <div className="list-item-header">
                  <span className="list-item-title">{v.unitName}</span>
                  <span className={`badge badge-${v.severity}`}>{v.severity}</span>
                </div>
                <div className="list-item-desc">{v.description}</div>
                <div className="list-item-meta">{v.location} · {new Date(v.timestamp).toLocaleTimeString()}</div>
              </div>
            ))
          )}
        </div>

        {/* Recent Alerts */}
        <div className="card">
          <div className="card-title">🔔 Pending Alerts</div>
          {recentAlerts.length === 0 ? (
            <div className="empty-state"><div className="icon">✅</div><p>All alerts acknowledged</p></div>
          ) : (
            recentAlerts.map(a => (
              <div key={a.id} className="list-item" style={{ marginBottom: 8 }}>
                <div className="list-item-header">
                  <span className="list-item-title">{a.unitName}</span>
                  <span className={`badge badge-${a.severity}`}>{a.priority}</span>
                </div>
                <div className="list-item-desc">{a.message}</div>
                <div className="list-item-meta">
                  📢 {a.channels?.join(', ')} · {new Date(a.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
