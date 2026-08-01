import React, { useState, useMemo } from 'react';
import axios from 'axios';

export default function UnitDetails({ units, readings, selectedUnit, onSelectUnit, backendUrl }) {
  const [activeUnitId, setActiveUnitId] = useState(selectedUnit?.id || null);

  const latestByUnit = useMemo(() => {
    const map = {};
    [...readings].reverse().forEach(r => {
      const key = `${r.unitId}-${r.type}`;
      if (!map[key]) map[key] = r;
    });
    return map;
  }, [readings]);

  const unit = units.find(u => u.id === (activeUnitId || units[0]?.id));
  const air   = unit ? latestByUnit[`${unit.id}-air`]   : null;
  const water = unit ? latestByUnit[`${unit.id}-water`] : null;

  const getStatus = (value, safe, warning, critical) => {
    if (value >= critical) return 'critical';
    if (value >= warning)  return 'warning';
    return 'normal';
  };

  const airThresholds = {
    SO2:  { safe:40,  warning:80,   critical:120,  unit:'µg/m³' },
    NO2:  { safe:40,  warning:80,   critical:150,  unit:'µg/m³' },
    PM25: { safe:25,  warning:60,   critical:120,  unit:'µg/m³' },
    PM10: { safe:50,  warning:100,  critical:200,  unit:'µg/m³' },
    CO:   { safe:2,   warning:5,    critical:10,   unit:'mg/m³' },
    VOC:  { safe:200, warning:500,  critical:1000, unit:'µg/m³' },
    H2S:  { safe:7,   warning:14,   critical:28,   unit:'µg/m³' },
    NH3:  { safe:100, warning:200,  critical:400,  unit:'µg/m³' }
  };

  const waterThresholds = {
    COD:     { safe:100,   warning:200,  critical:400,  unit:'mg/L' },
    BOD:     { safe:30,    warning:60,   critical:120,  unit:'mg/L' },
    TSS:     { safe:100,   warning:200,  critical:500,  unit:'mg/L' },
    TDS:     { safe:500,   warning:1000, critical:2000, unit:'mg/L' },
    Lead:    { safe:0.01,  warning:0.05, critical:0.1,  unit:'mg/L' },
    Mercury: { safe:0.001, warning:0.01, critical:0.05, unit:'mg/L' },
    Chromium:{ safe:0.05,  warning:0.1,  critical:0.5,  unit:'mg/L' }
  };

  const PollutantGauge = ({ label, value, thres }) => {
    if (!thres || value === undefined) return null;
    const maxVal = thres.critical * 1.5;
    const pct    = Math.min((value / maxVal) * 100, 100);
    const status = getStatus(value, thres.safe, thres.warning, thres.critical);
    return (
      <div className="gauge-row">
        <div className="gauge-label">{label}</div>
        <div className="gauge-bar-wrap">
          <div className={`gauge-bar status-${status}`} style={{ width:`${pct}%` }} />
        </div>
        <div className={`gauge-val`} style={{ color: status==='critical'?'#ef4444':status==='warning'?'#f59e0b':'#10b981' }}>
          {value} <span style={{ fontSize:9, color:'#475569' }}>{thres.unit}</span>
        </div>
      </div>
    );
  };

  const aqiClass = (aqi) => {
    if (aqi > 150) return 'aqi-vhazard';
    if (aqi > 100) return 'aqi-poor';
    if (aqi > 50)  return 'aqi-moderate';
    return 'aqi-good';
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      {/* Unit Selector */}
      <div className="filter-bar">
        <select
          className="filter-select"
          value={activeUnitId || ''}
          onChange={e => { setActiveUnitId(e.target.value); onSelectUnit(units.find(u => u.id === e.target.value)); }}
          style={{ flexShrink:0 }}
        >
          <option value="">— Select Industrial Unit —</option>
          {units.map(u => <option key={u.id} value={u.id}>{u.name} ({u.location})</option>)}
        </select>
      </div>

      {/* Unit Grid Selector */}
      <div className="grid-4">
        {units.map(u => {
          const air = latestByUnit[`${u.id}-air`];
          const status = air?.status || 'normal';
          return (
            <div
              key={u.id}
              className={`unit-card status-${status}`}
              style={{ border: activeUnitId===u.id ? '2px solid #3b82f6' : undefined }}
              onClick={() => { setActiveUnitId(u.id); onSelectUnit(u); }}
            >
              <div className="unit-header">
                <div>
                  <div className="unit-name" style={{ fontSize:12 }}>{u.name}</div>
                  <div className="unit-location">📍 {u.location}</div>
                </div>
                <span className={`badge badge-${status}`}>{status}</span>
              </div>
              {air && <div style={{ fontSize:11, color:'#94a3b8', marginTop:4 }}>AQI: <strong style={{ color:'#e2e8f0' }}>{air.aqi}</strong></div>}
            </div>
          );
        })}
      </div>

      {unit && (
        <>
          {/* Unit Header */}
          <div className="card" style={{ background:'linear-gradient(135deg, #1e3a5f 0%, #1e293b 100%)', border:'1px solid #1e40af' }}>
            <div style={{ display:'flex', gap:20, alignItems:'center', flexWrap:'wrap' }}>
              <div style={{ fontSize:40 }}>🏭</div>
              <div style={{ flex:1 }}>
                <h2 style={{ margin:0, fontSize:20, color:'#e2e8f0' }}>{unit.name}</h2>
                <div style={{ fontSize:13, color:'#94a3b8', marginTop:4 }}>
                  📍 {unit.location} &nbsp;|&nbsp; ⚙️ {unit.type} &nbsp;|&nbsp; ID: {unit.id}
                </div>
                <div style={{ marginTop:8, display:'flex', gap:12 }}>
                  <span className={`badge ${unit.riskLevel==='High'?'badge-critical':unit.riskLevel==='Medium'?'badge-warning':'badge-normal'}`}>
                    Risk: {unit.riskLevel}
                  </span>
                  <span className="badge badge-info">GIDC Registered</span>
                  <span className="badge badge-info">CPCB Monitored</span>
                </div>
              </div>
              {air && (
                <div className={`aqi-ring ${aqiClass(air.aqi)}`}>
                  <div className="aqi-val">{air.aqi}</div>
                  <div className="aqi-label">AQI</div>
                </div>
              )}
            </div>
          </div>

          <div className="grid-2">
            {/* Air Quality */}
            <div className="card">
              <div className="card-title">🌬️ Air Emissions — Current Readings</div>
              {air ? (
                <>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:12 }}>
                    <span style={{ fontSize:12, color:'#94a3b8' }}>Last Updated: {new Date(air.timestamp).toLocaleString()}</span>
                    <span className={`badge badge-${air.status}`}>{air.status}</span>
                  </div>
                  {Object.entries(air.pollutants || {}).map(([key, val]) => (
                    <PollutantGauge key={key} label={key} value={val} thres={airThresholds[key]} />
                  ))}
                </>
              ) : (
                <div className="empty-state"><div className="icon">📡</div><p>No air data available</p></div>
              )}
            </div>

            {/* Water Quality */}
            <div className="card">
              <div className="card-title">💧 Effluent Quality — Current Readings</div>
              {water ? (
                <>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:12 }}>
                    <span style={{ fontSize:12, color:'#94a3b8' }}>Last Updated: {new Date(water.timestamp).toLocaleString()}</span>
                    <span className={`badge badge-${water.status}`}>{water.status}</span>
                  </div>
                  {/* pH special */}
                  <div className="gauge-row">
                    <div className="gauge-label">pH</div>
                    <div className="gauge-bar-wrap">
                      <div
                        className="gauge-bar"
                        style={{ width:`${((water.pollutants?.pH || 7) / 14) * 100}%`, background: water.pollutants?.pH >= 6.5 && water.pollutants?.pH <= 8.5 ? '#10b981' : '#ef4444' }}
                      />
                    </div>
                    <div className="gauge-val" style={{ color: water.pollutants?.pH >= 6.5 && water.pollutants?.pH <= 8.5 ? '#10b981' : '#ef4444' }}>
                      {water.pollutants?.pH}
                    </div>
                  </div>
                  {Object.entries(water.pollutants || {}).filter(([k]) => k !== 'pH').map(([key, val]) => (
                    <PollutantGauge key={key} label={key} value={val} thres={waterThresholds[key]} />
                  ))}
                </>
              ) : (
                <div className="empty-state"><div className="icon">📡</div><p>No water data available</p></div>
              )}
            </div>
          </div>

          {/* Compliance Summary */}
          <div className="card">
            <div className="card-title">📋 Compliance Summary — GPCB / CPCB Standards</div>
            <div className="grid-3">
              {[
                { label:'Regulatory Body',    value:'GPCB + CPCB',          icon:'🏛️' },
                { label:'Standards Applied',  value:'Env. Protection Act 1986', icon:'📜' },
                { label:'Emission Norms',     value:'CPCB 2022 Schedule IV', icon:'🌬️' },
                { label:'Effluent Norms',     value:'MoEF Schedule VI',      icon:'💧' },
                { label:'Reporting Frequency',value:'Real-time (15s cycles)', icon:'⏱️' },
                { label:'Alert System',       value:'Multi-channel (SMS/Email/App)', icon:'📡' },
              ].map(item => (
                <div key={item.label} style={{ display:'flex', gap:10, alignItems:'flex-start', padding:'10px 0', borderBottom:'1px solid #334155' }}>
                  <span style={{ fontSize:20 }}>{item.icon}</span>
                  <div>
                    <div style={{ fontSize:11, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'.4px' }}>{item.label}</div>
                    <div style={{ fontSize:13, color:'#e2e8f0', fontWeight:600 }}>{item.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
